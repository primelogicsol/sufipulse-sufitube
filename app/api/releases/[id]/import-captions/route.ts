import { NextRequest, NextResponse } from 'next/server';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { normalizeParsedCues, validateParsedCues } from '@/lib/subtitle-ingest/normalizeParsedCues';

export const dynamic = 'force-dynamic';

const YOUTUBE_API_BASE = 'https://youtube.googleapis.com/youtube/v3';

// ── OAuth ────────────────────────────────────────────────────────────────────

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.accessToken;

  const clientId = process.env.YOUTUBE_OAUTH_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '';
  const clientSecret = process.env.YOUTUBE_OAUTH_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '';
  const refreshToken = process.env.YOUTUBE_OAUTH_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN || '';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing YouTube OAuth credentials (YOUTUBE_OAUTH_CLIENT_ID / SECRET / REFRESH_TOKEN)');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });

  if (!res.ok) throw new Error(`OAuth token refresh failed: ${await res.text()}`);
  const data = await res.json();
  cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.accessToken;
};

// ── Inline subtitle parsers (pure, no browser deps) ─────────────────────────

const normalizeCueTime = (input: string): string => {
  const cleaned = (input || '').trim().replace(',', '.');
  const parts = cleaned.split(':');
  if (parts.length < 2) return '00:00:00.000';
  const padded = [...parts];
  while (padded.length < 3) padded.unshift('00');
  const [hh, mm, ssMs] = padded;
  const [ss, ms = '000'] = (ssMs || '0').split('.');
  return `${String(Number(hh || 0)).padStart(2, '0')}:${String(Number(mm || 0)).padStart(2, '0')}:${String(Number(ss || 0)).padStart(2, '0')}.${String(Number(ms || 0)).padStart(3, '0').slice(0, 3)}`;
};

type ParsedCue = { cueNumber: number; startTime: string; endTime: string; text: string };

const parseSrtVtt = (content: string, format: 'srt' | 'vtt'): ParsedCue[] => {
  const rows = content.replace(/\r/g, '').split('\n');
  if (format === 'vtt' && rows[0]?.toUpperCase().includes('WEBVTT')) rows.shift();
  const cues: ParsedCue[] = [];
  const blocks = rows.join('\n').split('\n\n').map((b) => b.trim()).filter(Boolean);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let idx = 0;
    if (/^\d+$/.test(lines[idx])) idx += 1;
    const timing = lines[idx] || '';
    if (!timing.includes('-->')) continue;
    idx += 1;
    const [startRaw, endRaw] = timing.split('-->').map((p) => p.trim().split(' ')[0]);
    const text = lines.slice(idx).join(' ').replace(/<[^>]+>/g, '').trim();
    cues.push({ cueNumber: cues.length + 1, startTime: normalizeCueTime(startRaw), endTime: normalizeCueTime(endRaw), text });
  }
  return cues;
};

// YouTube timedtext JSON3 format
const parseJson3 = (json: any): ParsedCue[] => {
  const events: any[] = json?.events || [];
  const cues: ParsedCue[] = [];
  for (const ev of events) {
    if (!ev.segs) continue;
    const text = ev.segs.map((s: any) => s.utf8 || '').join('').replace(/\n/g, ' ').trim();
    if (!text) continue;
    const startMs = Number(ev.tStartMs || 0);
    const durMs = Number(ev.dDurationMs || 2000);
    const startSec = startMs / 1000;
    const endSec = (startMs + durMs) / 1000;
    const fmt = (s: number) => {
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = Math.floor(s % 60);
      const ms = Math.floor((s % 1) * 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    };
    cues.push({ cueNumber: cues.length + 1, startTime: fmt(startSec), endTime: fmt(endSec), text });
  }
  return cues;
};

// ── Caption download helpers ─────────────────────────────────────────────────

const downloadViaOfficialApi = async (captionId: string, accessToken: string): Promise<string | null> => {
  try {
    const url = `${YOUTUBE_API_BASE}/captions/${encodeURIComponent(captionId)}?tfmt=srt`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
};

const downloadViaTimedtext = async (videoId: string, lang: string): Promise<{ content: string; format: 'vtt' | 'json3' } | null> => {
  // Try VTT first
  try {
    const vttUrl = `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}&fmt=vtt`;
    const res = await fetch(vttUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('WEBVTT') && text.includes('-->')) return { content: text, format: 'vtt' };
    }
  } catch {}

  // Try JSON3 fallback
  try {
    const jsonUrl = `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}&fmt=json3`;
    const res = await fetch(jsonUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const json = await res.json();
      if (json?.events?.length) return { content: JSON.stringify(json), format: 'json3' };
    }
  } catch {}

  return null;
};

// ── GET: list caption tracks ─────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

  const youtubeId = String(release.youtubeId || '').trim();
  if (!youtubeId) return NextResponse.json({ error: 'Release has no youtubeId' }, { status: 400 });

  try {
    const accessToken = await getAccessToken();
    const url = `${YOUTUBE_API_BASE}/captions?part=snippet%2Cid&videoId=${encodeURIComponent(youtubeId)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `YouTube API error: ${err}` }, { status: 502 });
    }

    const data = await res.json();
    const tracks = (data.items || []).map((item: any) => ({
      id: item.id,
      language: item.snippet?.language || '',
      name: item.snippet?.name || '',
      trackKind: item.snippet?.trackKind || 'standard',
      isDraft: item.snippet?.isDraft ?? false,
      lastUpdated: item.snippet?.lastUpdated || '',
    }));

    return NextResponse.json({
      youtubeId,
      existingCueCount: (release.subtitleCues || []).length,
      tracks,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: download track and write to CMS ────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) return NextResponse.json({ error: 'Release not found' }, { status: 404 });

  const youtubeId = String(release.youtubeId || '').trim();
  if (!youtubeId) return NextResponse.json({ error: 'Release has no youtubeId' }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const captionId: string = String(body.captionId || '').trim();
  const language: string = String(body.language || release.defaultLanguage || 'en').trim();
  const mode: 'replace' | 'merge' = body.mode === 'merge' ? 'merge' : 'replace';

  if (!captionId) return NextResponse.json({ error: 'captionId is required' }, { status: 400 });

  try {
    const accessToken = await getAccessToken();

    // 1. Try official API download (works for manually uploaded captions)
    let parsed: ParsedCue[] | null = null;
    const officialContent = await downloadViaOfficialApi(captionId, accessToken);
    if (officialContent && officialContent.includes('-->')) {
      const fmt = officialContent.trimStart().startsWith('WEBVTT') ? 'vtt' : 'srt';
      parsed = parseSrtVtt(officialContent, fmt);
    }

    // 2. Timedtext fallback (for ASR/auto-generated captions)
    if (!parsed || parsed.length === 0) {
      const timedtext = await downloadViaTimedtext(youtubeId, language);
      if (timedtext) {
        if (timedtext.format === 'vtt') {
          parsed = parseSrtVtt(timedtext.content, 'vtt');
        } else {
          parsed = parseJson3(JSON.parse(timedtext.content));
        }
      }
    }

    if (!parsed || parsed.length === 0) {
      return NextResponse.json({ error: 'Could not download or parse caption track. The track may be empty or not accessible.' }, { status: 422 });
    }

    // Normalize (dedup, sort, clean, min-duration filter) then validate
    const { cues: normalizedCues, stats } = normalizeParsedCues(parsed);
    const { ok, warnings } = validateParsedCues(normalizedCues);
    if (!ok) {
      return NextResponse.json({ error: `Caption data failed validation: ${warnings.join(' ')}` }, { status: 422 });
    }

    // Build new cues
    const now = Date.now();
    const newCues = normalizedCues.map((p, i) => ({
      id: `cue_${now}_yt_${i}`,
      cueNumber: i + 1,
      startTime: p.startTime,
      endTime: p.endTime,
      lineRef: '',
      sourceType: 'youtube_captions' as const,
      active: true,
    }));

    // Build translation map for the source language
    const newTranslationMap: Record<string, string> = {};
    parsed.forEach((p, i) => { if (p.text) newTranslationMap[newCues[i].id] = p.text; });

    type SubtitleCue = NonNullable<typeof release.subtitleCues>[number];
    type LangStatus = NonNullable<typeof release.subtitleLanguageStatuses>[string];

    // Merge or replace
    let nextCues: SubtitleCue[];
    let nextTranslations: Record<string, Record<string, string>>;
    let nextStatuses: Record<string, LangStatus>;

    if (mode === 'replace') {
      // New cue IDs — all old translation maps are orphaned, clear them
      nextCues = newCues;
      nextTranslations = { [language]: newTranslationMap };
      nextStatuses = {
        ...(release.subtitleLanguageStatuses || {}),
        [language]: 'draft',
      };
    } else {
      // Append — preserve existing cues and translations
      const existingCues: SubtitleCue[] = release.subtitleCues || [];
      nextCues = [...existingCues, ...newCues];
      nextTranslations = {
        ...(release.subtitleTranslations || {}),
        [language]: {
          ...((release.subtitleTranslations || {})[language] || {}),
          ...newTranslationMap,
        },
      };
      nextStatuses = {
        ...(release.subtitleLanguageStatuses || {}),
        [language]: (release.subtitleLanguageStatuses || {})[language] || 'draft',
      };
    }

    // Ensure language is in availableLanguages
    const availableLanguages = Array.from(new Set([
      ...(release.availableLanguages || []),
      language,
    ]));

    const updated = cmsServerStorage.saveRelease({
      ...release,
      subtitleCues: nextCues,
      subtitleTranslations: nextTranslations,
      subtitleLanguageStatuses: nextStatuses,
      availableLanguages,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      importedCount: newCues.length,
      language,
      mode,
      normalizationStats: stats,
      warnings,
      release: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
