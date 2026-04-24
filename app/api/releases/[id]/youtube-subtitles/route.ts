import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { logger } from '@/app/lib/logger';

export const dynamic = 'force-dynamic';

const apiLogger = logger.youtube;

/**
 * Normalize snake_case fields that may come from the public page save handler.
 */
function normalizeReleaseFields(release: any): any {
  const normalized = { ...release };

  const fieldMap: Record<string, string> = {
    subtitle_cues: 'subtitleCues',
    subtitle_translations: 'subtitleTranslations',
    subtitle_language_statuses: 'subtitleLanguageStatuses',
    subtitle_cue_metadata: 'subtitleCueMetadata',
    subtitle_style_packs: 'subtitleStylePacks',
    language_style_overrides: 'languageStyleOverrides',
    youtube_caption_tracks: 'youtubeCaptionTracks',
    youtube_subtitle_auto_sync: 'youtubeSubtitleAutoSync',
    content_readiness_state: 'contentReadinessState',
    available_languages: 'availableLanguages',
    default_language: 'defaultLanguage',
  };

  for (const [snakeKey, camelKey] of Object.entries(fieldMap)) {
    if (release[snakeKey] !== undefined && release[camelKey] === undefined) {
      normalized[camelKey] = release[snakeKey];
    }
  }

  return normalized;
}

type SubtitleItem = {
  id: string;
  cueNumber: number;
  start: string;
  end: string;
  text: string;
};

type SyncMode = 'update-changed' | 'force-update';
type SubtitleFormat = 'srt' | 'vtt';
type ContentReadinessState =
  | 'draft'
  | 'editorial_ready'
  | 'web_published'
  | 'youtube_delivery_in_progress'
  | 'fully_delivered'
  | 'delivery_attention_required';

const YOUTUBE_API_BASE = 'https://youtube.googleapis.com/youtube/v3';

const deriveReadinessState = (
  currentState: string | undefined,
  tracks: Record<string, any>
): ContentReadinessState => {
  const metas = Object.values(tracks || {});
  if (!metas.length) {
    return (currentState as ContentReadinessState) || 'draft';
  }

  const hasFailure = metas.some((meta) => meta?.lastStatus === 'failed' || meta?.deliveryState === 'sync_failed');
  if (hasFailure) {
    return 'delivery_attention_required';
  }

  const hasSynced = metas.some((meta) => meta?.lastStatus === 'synced' || meta?.deliveryState === 'synced_to_youtube' || Boolean(meta?.captionId));
  const allSynced = metas.every((meta) => meta?.lastStatus === 'synced' || meta?.deliveryState === 'synced_to_youtube' || Boolean(meta?.captionId));

  if (allSynced) {
    return 'fully_delivered';
  }

  if (hasSynced) {
    return 'youtube_delivery_in_progress';
  }

  return (currentState as ContentReadinessState) || 'draft';
};

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

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing YouTube OAuth credentials. Set YOUTUBE_OAUTH_CLIENT_ID, YOUTUBE_OAUTH_CLIENT_SECRET, and YOUTUBE_OAUTH_REFRESH_TOKEN.');
  }

  return { clientId, clientSecret, refreshToken };
};

/**
 * Get an OAuth access token using refresh token via direct fetch.
 */
let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret, refreshToken } = getOAuthConfig();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh YouTube OAuth token: ${error}`);
  }

  const data = await response.json();
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };

  return cachedToken.accessToken;
};

/**
 * List captions for a video using direct fetch.
 */
const listCaptions = async (videoId: string, accessToken: string) => {
  const url = `${YOUTUBE_API_BASE}/captions?part=snippet%2Cid&videoId=${encodeURIComponent(videoId)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list captions: ${error}`);
  }

  return response.json();
};

/**
 * Insert or update a caption using direct fetch with multipart upload.
 */
const upsertCaption = async (args: {
  videoId: string;
  language: string;
  format: SubtitleFormat;
  captionText: string;
  isDraft: boolean;
  captionId?: string;
  accessToken: string;
}): Promise<{ captionId: string; action: 'inserted' | 'updated' }> => {
  const mimeType = args.format === 'vtt' ? 'text/vtt' : 'application/x-subrip';
  const boundary = '----SufiPulseCaptionBoundary';

  const metadata = JSON.stringify({
    snippet: {
      videoId: args.videoId,
      language: args.language,
      name: `${args.language.toUpperCase()} subtitles`,
      isDraft: args.isDraft,
    },
  });

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    'Content-Transfer-Encoding: binary',
    '',
    args.captionText,
    `--${boundary}--`,
  ].join('\r\n');

  const url = args.captionId
    ? `${YOUTUBE_API_BASE}/captions?part=snippet&id=${encodeURIComponent(args.captionId)}`
    : `${YOUTUBE_API_BASE}/captions?part=snippet`;

  const method = args.captionId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': Buffer.byteLength(body, 'utf8').toString(),
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to ${method.toLowerCase()} caption: ${error}`);
  }

  const data = await response.json();
  return { captionId: data.id, action: args.captionId ? 'updated' : 'inserted' };
};

/**
 * Find caption ID by language code.
 */
const findCaptionIdByLanguage = async (
  videoId: string,
  language: string,
  accessToken: string
): Promise<string | undefined> => {
  const data = await listCaptions(videoId, accessToken);
  const items = data.items || [];
  const found = items.find(
    (item: any) => (item.snippet?.language || '').toLowerCase() === language.toLowerCase()
  );
  return found?.id || undefined;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const rawRelease = cmsServerStorage.getRelease(id);
    if (!rawRelease) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    // Normalize snake_case fields from public page save
    const release = normalizeReleaseFields(rawRelease);

    if (!release.youtubeId) {
      return NextResponse.json({ error: 'Release is missing youtubeId' }, { status: 400 });
    }

    apiLogger.info(`YouTube subtitle sync started: ${release.youtubeId}`, {
      releaseId: id,
      youtubeId: release.youtubeId,
    });

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

    // Get OAuth token once for all caption operations
    const accessToken = await getAccessToken();

    const cueMetadata = release.youtubeCaptionTracks || {};
    const nextCaptionTracks = { ...cueMetadata } as Record<string, any>;

    const cues = (release.subtitleCues || [])
      .filter((cue: any) => cue.active !== false)
      .sort((a: any, b: any) => {
        if (a.cueNumber !== b.cueNumber) return a.cueNumber - b.cueNumber;
        return parseMs(a.startTime) - parseMs(b.startTime);
      });

    // Process languages in parallel with concurrency limit
    const concurrencyLimit = 3;
    const results: Array<{ language: string; status: string; message: string; captionId?: string }> = [];

    for (let i = 0; i < languages.length; i += concurrencyLimit) {
      const batch = languages.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(async (language) => {
        const langMap = release.subtitleTranslations?.[language] || {};
        const items: SubtitleItem[] = cues.map((cue: any) => ({
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

          return {
            language,
            status: 'skipped',
            message: 'No subtitle changes since last sync',
            captionId: existingMeta.captionId,
          };
        }

        try {
          const captionId = existingMeta.captionId || (await findCaptionIdByLanguage(release.youtubeId, language, accessToken));
          const outcome = await upsertCaption({
            videoId: release.youtubeId,
            language,
            format,
            captionText: payloadText,
            isDraft,
            captionId,
            accessToken,
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

          return {
            language,
            status: outcome.action,
            message: `Caption ${outcome.action} on YouTube`,
            captionId: outcome.captionId,
          };
        } catch (error: any) {
          nextCaptionTracks[language] = {
            ...existingMeta,
            language,
            lastStatus: 'failed',
            lastFormat: format,
            lastUploadedAt: new Date().toISOString(),
            lastError: String(error?.message || error || 'Unknown sync error'),
          };

          return {
            language,
            status: 'failed',
            message: String(error?.message || error || 'Sync failed'),
            captionId: existingMeta.captionId,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    const updated = cmsServerStorage.saveRelease({
      ...release,
      youtubeCaptionTracks: nextCaptionTracks,
      youtubeSubtitleAutoSync: body.youtubeSubtitleAutoSync ?? release.youtubeSubtitleAutoSync ?? true,
      contentReadinessState: deriveReadinessState(release.contentReadinessState, nextCaptionTracks),
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
