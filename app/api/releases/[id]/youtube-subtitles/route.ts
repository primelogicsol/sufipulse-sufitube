import { createHash } from 'crypto';
import { Readable } from 'stream';
import { NextRequest, NextResponse } from 'next/server';
import { google, youtube_v3 } from 'googleapis';
import { cmsStorage } from '@/lib/cms-storage';

export const dynamic = 'force-dynamic';

type SubtitleItem = {
  id: string;
  cueNumber: number;
  start: string;
  end: string;
  text: string;
};

type SyncMode = 'update-changed' | 'force-update';
type SubtitleFormat = 'srt' | 'vtt';

const toSrtTime = (vttTime: string) => vttTime.replace('.', ',');

const parseMs = (time: string): number => {
  const [hh, mm, ssMs] = time.split(':');
  const [ss, ms = '0'] = (ssMs || '0').split('.');
  return (
    Number(hh || 0) * 3600000 +
    Number(mm || 0) * 60000 +
    Number(ss || 0) * 1000 +
    Number((ms + '000').slice(0, 3))
  );
};

const toVtt = (items: SubtitleItem[]) => {
  const body = items
    .map((item) => `${item.start} --> ${item.end}\n${item.text || ''}`)
    .join('\n\n');
  return `WEBVTT\n\n${body}`;
};

const toSrt = (items: SubtitleItem[]) => {
  return items
    .map((item, idx) => `${idx + 1}\n${toSrtTime(item.start)} --> ${toSrtTime(item.end)}\n${item.text || ''}`)
    .join('\n\n');
};

const getOAuthConfig = () => {
  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';
  const refreshToken = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN || '';
  const redirectUri = process.env.YOUTUBE_OAUTH_REDIRECT_URI || 'http://localhost';

  return {
    clientId,
    clientSecret,
    refreshToken,
    redirectUri,
  };
};

const getYoutubeClient = () => {
  const cfg = getOAuthConfig();
  if (!cfg.clientId || !cfg.clientSecret || !cfg.refreshToken) {
    throw new Error('Missing YouTube OAuth credentials. Set YOUTUBE_OAUTH_CLIENT_ID, YOUTUBE_OAUTH_CLIENT_SECRET, and YOUTUBE_OAUTH_REFRESH_TOKEN.');
  }

  const auth = new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  auth.setCredentials({ refresh_token: cfg.refreshToken });

  return google.youtube({ version: 'v3', auth });
};

const findCaptionIdByLanguage = async (
  youtube: youtube_v3.Youtube,
  videoId: string,
  language: string
): Promise<string | undefined> => {
  const params: youtube_v3.Params$Resource$Captions$List = {
    part: ['id', 'snippet'],
    videoId,
  };
  const response = await (youtube.captions.list(params) as Promise<{ data: youtube_v3.Schema$CaptionListResponse }>);

  const items: youtube_v3.Schema$Caption[] = response.data.items || [];
  const found = items.find((item: youtube_v3.Schema$Caption) => (item.snippet?.language || '').toLowerCase() === language.toLowerCase());
  return found?.id || undefined;
};

const upsertYouTubeCaption = async (
  youtube: youtube_v3.Youtube,
  args: {
    videoId: string;
    language: string;
    format: SubtitleFormat;
    captionText: string;
    isDraft: boolean;
    captionId?: string;
  }
): Promise<{ captionId: string; action: 'inserted' | 'updated' }> => {
  const mimeType = args.format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
  const bodyStream = () => Readable.from([Buffer.from(args.captionText, 'utf8')]);

  const snippet: youtube_v3.Schema$CaptionSnippet = {
    videoId: args.videoId,
    language: args.language,
    name: `${args.language.toUpperCase()} subtitles`,
    isDraft: args.isDraft,
  };

  if (args.captionId) {
    try {
      const updateParams: youtube_v3.Params$Resource$Captions$Update = {
        part: ['snippet'],
        requestBody: {
          id: args.captionId,
          snippet,
        },
        media: {
          mimeType,
          body: bodyStream(),
        },
      };

      const updateResponse = await (youtube.captions.update(updateParams) as Promise<{ data: youtube_v3.Schema$Caption }>);

      const updatedId = updateResponse.data.id;
      if (updatedId) {
        return { captionId: updatedId, action: 'updated' };
      }
    } catch {
      // Fallback to insert below when update fails (for deleted/invalid caption ids).
    }
  }

  const insertParams: youtube_v3.Params$Resource$Captions$Insert = {
    part: ['snippet'],
    requestBody: { snippet },
    media: {
      mimeType,
      body: bodyStream(),
    },
  };

  const insertResponse = await (youtube.captions.insert(insertParams) as Promise<{ data: youtube_v3.Schema$Caption }>);

  const insertedId = insertResponse.data.id;
  if (!insertedId) {
    throw new Error('YouTube captions.insert succeeded but did not return a caption id.');
  }

  return { captionId: insertedId, action: 'inserted' };
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const release = cmsStorage.getRelease(id);
    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    if (!release.youtubeId) {
      return NextResponse.json({ error: 'Release is missing youtubeId' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const mode: SyncMode = body.mode === 'force-update' ? 'force-update' : 'update-changed';
    const format: SubtitleFormat = body.format === 'vtt' ? 'vtt' : 'srt';
    const isDraft = Boolean(body.isDraft);

    const requestedLanguages = Array.isArray(body.languages) ? body.languages : [];
    const languages = Array.from(new Set([
      ...requestedLanguages,
      ...(release.availableLanguages || []),
      ...Object.keys(release.subtitleTranslations || {}),
      release.defaultLanguage || 'en',
    ].filter(Boolean)));

    if (!languages.length) {
      return NextResponse.json({ error: 'No subtitle languages found to sync' }, { status: 400 });
    }

    const youtube = getYoutubeClient();
    const cueMetadata = release.youtubeCaptionTracks || {};
    const nextCaptionTracks = { ...cueMetadata } as Record<string, any>;

    const cues = (release.subtitleCues || [])
      .filter((cue) => cue.active !== false)
      .sort((a, b) => {
        if (a.cueNumber !== b.cueNumber) return a.cueNumber - b.cueNumber;
        return parseMs(a.startTime) - parseMs(b.startTime);
      });

    const results: Array<{ language: string; status: string; message: string; captionId?: string }> = [];

    for (const language of languages) {
      const langMap = release.subtitleTranslations?.[language] || {};
      const items: SubtitleItem[] = cues.map((cue) => ({
        id: cue.id,
        cueNumber: cue.cueNumber,
        start: cue.startTime,
        end: cue.endTime,
        text: langMap[cue.id] || '',
      }));

      const payloadText = format === 'vtt' ? toVtt(items) : toSrt(items);
      const payloadHash = createHash('sha1').update(payloadText).digest('hex');
      const existingMeta = nextCaptionTracks[language] || {};

      if (mode === 'update-changed' && existingMeta.lastSyncHash && existingMeta.lastSyncHash === payloadHash) {
        nextCaptionTracks[language] = {
          ...existingMeta,
          language,
          lastStatus: 'unchanged',
          lastFormat: format,
          lastError: '',
        };

        results.push({
          language,
          status: 'skipped',
          message: 'No subtitle changes since last sync',
          captionId: existingMeta.captionId,
        });
        continue;
      }

      try {
        const captionId = existingMeta.captionId || (await findCaptionIdByLanguage(youtube, release.youtubeId, language));
        const outcome = await upsertYouTubeCaption(youtube, {
          videoId: release.youtubeId,
          language,
          format,
          captionText: payloadText,
          isDraft,
          captionId,
        });

        nextCaptionTracks[language] = {
          ...existingMeta,
          language,
          captionId: outcome.captionId,
          lastStatus: 'synced',
          lastSyncHash: payloadHash,
          lastFormat: format,
          lastUploadedAt: new Date().toISOString(),
          lastError: '',
        };

        results.push({
          language,
          status: outcome.action,
          message: `Caption ${outcome.action} on YouTube`,
          captionId: outcome.captionId,
        });
      } catch (error: any) {
        nextCaptionTracks[language] = {
          ...existingMeta,
          language,
          lastStatus: 'failed',
          lastFormat: format,
          lastUploadedAt: new Date().toISOString(),
          lastError: String(error?.message || error || 'Unknown sync error'),
        };

        results.push({
          language,
          status: 'failed',
          message: String(error?.message || error || 'Sync failed'),
          captionId: existingMeta.captionId,
        });
      }
    }

    const updated = cmsStorage.saveRelease({
      ...release,
      youtubeCaptionTracks: nextCaptionTracks,
      youtubeSubtitleAutoSync: body.youtubeSubtitleAutoSync ?? release.youtubeSubtitleAutoSync ?? true,
    });

    const successCount = results.filter((row) => row.status === 'inserted' || row.status === 'updated').length;
    const skippedCount = results.filter((row) => row.status === 'skipped').length;
    const failedCount = results.filter((row) => row.status === 'failed').length;

    return NextResponse.json({
      releaseId: updated.id,
      youtubeId: updated.youtubeId,
      format,
      mode,
      successCount,
      skippedCount,
      failedCount,
      results,
      youtubeCaptionTracks: updated.youtubeCaptionTracks || {},
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
