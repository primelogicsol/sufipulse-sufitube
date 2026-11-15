import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '@/server/middleware/authenticate';
import { getYouTubeConnection, CANONICAL_CHANNEL_ID } from '@/lib/youtube-connection';
import { pipelineDraftStorage, computeFileSha256 } from '@/server/storage/pipeline-draft-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;
const CHUNK = 8 * 1024 * 1024;
type Session = { url: string; offset: number; size: number; path: string; releaseId: string; videoId?: string; state: 'uploading' | 'completed'; };
const sessionPath = (id: string) => path.join(process.cwd(), '.data', 'pipeline-drafts', id, 'youtube-upload-session.json');
function read(id: string): Session | null {
  try { return JSON.parse(fs.readFileSync(sessionPath(id), 'utf8')) as Session; } catch { return null; }
}
function save(id: string, session: Session) {
  const file = sessionPath(id), temp = file + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(session), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(temp, file);
}
const fail = (error: string, status: number, code?: string) => NextResponse.json({ error, code }, { status });
async function ownedToken() {
  const connection = await getYouTubeConnection();
  const token = await connection.getAccessToken();
  if (!token) throw new Error('Connect your SufiPulse YouTube account with the upload permission first.');
  const permissionResponse = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(token), { cache: 'no-store' });
  const permission = await permissionResponse.json().catch(() => ({}));
  if (!permissionResponse.ok || !String(permission.scope || '').split(' ').includes('https://www.googleapis.com/auth/youtube.upload')) {
    throw new Error('YouTube upload permission is missing. Click Connect YouTube for Upload to authorize this action.');
  }
  const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true', {
    headers: { Authorization: 'Bearer ' + token }, cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(data.items) || !data.items.some((item: any) => item.id === CANONICAL_CHANNEL_ID)) {
    throw new Error('The connected Google account does not have authorized access to the official SufiPulse USA YouTube channel.');
  }
  return token;
}
async function linkVerifiedVideo(draftId: string, session: Session, videoId: string, token: string) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) throw new Error('YouTube returned an invalid video ID.');
  const response = await fetch('https://www.googleapis.com/youtube/v3/videos?part=id,snippet,status&id=' + videoId, {
    headers: { Authorization: 'Bearer ' + token }, cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  const item = data?.items?.[0];
  if (!response.ok || item?.id !== videoId || item?.snippet?.channelId !== CANONICAL_CHANNEL_ID ||
      item?.status?.privacyStatus !== 'private') throw new Error('YouTube video ownership or private visibility could not be verified.');
  const release = cmsServerStorage.getRelease(session.releaseId);
  if (!release || (release.youtubeId && release.youtubeId !== videoId)) throw new Error('CMS release is missing or already linked to another YouTube video.');
  const youtubeUrl = 'https://www.youtube.com/watch?v=' + videoId;
  cmsServerStorage.saveRelease({
    ...release, youtubeId: videoId, youtubeUrl, youtubeChannelId: CANONICAL_CHANNEL_ID,
    youtubeTitle: item.snippet.title,
    status: 'approved', visibility: 'private',
    distribution: { ...(release.distribution || {}), youtube: {
      ...((release.distribution || {}).youtube || { platform: 'youtube', isVisible: true }),
      platform: 'youtube', status: 'processing', url: youtubeUrl,
      isVerified: true, isVisible: false,
    } }, updatedAt: new Date().toISOString(),
  });
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (draft) {
    const now = new Date().toISOString();
    draft.publishingTx = {
      txId: 'youtube_' + draftId, status: 'PRIVATE_UPLOAD_COMPLETED', youtubeVideoId: videoId,
      youtubePrivacyStatus: 'private', cmsReleaseId: session.releaseId, lastAttemptAt: now,
      history: [{ timestamp: now, step: 'private_youtube_upload', status: 'success', details: 'Owned video ID verified and linked to existing CMS record' }],
    };
    pipelineDraftStorage.saveDraft(draft);
  }
  session.state = 'completed'; session.videoId = videoId; session.offset = session.size;
  save(draftId, session);
  return { videoId, youtubeUrl, cmsReleaseId: session.releaseId };
}
export async function GET(request: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { draftId } = await params;
  if (!pipelineDraftStorage.getDraft(draftId)) return fail('Studio draft not found', 404);
  const s = read(draftId);
  const draft = pipelineDraftStorage.getDraft(draftId);
  let uploadAuthorized = false;
  try {
    const token = await (await getYouTubeConnection()).getAccessToken();
    if (token) {
      const response = await fetch('https://oauth2.googleapis.com/tokeninfo?access_token=' + encodeURIComponent(token), { cache: 'no-store' });
      const details = await response.json().catch(() => ({}));
      uploadAuthorized = response.ok && String(details.scope || '').split(' ').includes('https://www.googleapis.com/auth/youtube.upload');
    }
  } catch { /* The UI must offer reconnection instead of claiming upload access. */ }
  return NextResponse.json(s ? { state: s.state, offset: s.offset, size: s.size, videoId: s.videoId,
    cmsReleaseId: s.releaseId, captionTrackStatus: draft?.publishingTx?.captionTrackStatus || {}, uploadAuthorized } :
    { state: 'not_started', offset: 0, size: 0, uploadAuthorized }, { headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  const { draftId } = await params;
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (!draft) return fail('Studio draft not found', 404);
  const body = await request.json().catch(() => ({}));
  const session = read(draftId);
  if (body.action === 'status') return GET(request, { params: Promise.resolve({ draftId }) });
  if (body.action === 'captions') {
    if (!session || session.state !== 'completed' || !session.videoId) {
      return fail('The private YouTube video must be uploaded and verified before captions.', 409);
    }
    const languages: Record<string, { file: string; language: string; name: string }> = {
      ur: { file: 'ur.srt', language: 'ur', name: 'SufiPulse Urdu' },
      en: { file: 'en.srt', language: 'en', name: 'SufiPulse English' },
      'en-rom': { file: 'en-rom.srt', language: 'ur-Latn', name: 'SufiPulse Roman Urdu' },
      'ur-deva': { file: 'ur-deva.srt', language: 'ur-Deva', name: 'SufiPulse Urdu Devanagari' },
    };
    const code = String(body.language || '');
    const track = languages[code];
    if (!track) return fail('Unsupported subtitle track.', 400);
    const file = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles', track.file);
    if (!fs.existsSync(file) || fs.statSync(file).size < 30 || !draft.downstreamStatus.subtitlesValid) {
      return fail('Studio subtitle track is missing or unverified.', 422);
    }
    try {
      const token = await ownedToken();
      const listResponse = await fetch('https://www.googleapis.com/youtube/v3/captions?part=id,snippet&videoId=' + session.videoId, {
        headers: { Authorization: 'Bearer ' + token }, cache: 'no-store',
      });
      const list = await listResponse.json().catch(() => ({}));
      if (!listResponse.ok) throw new Error(list?.error?.message || 'YouTube caption inventory could not be checked.');
      const existing = list?.items?.find((item: any) =>
        item.snippet?.language === track.language && item.snippet?.name === track.name);
      if (!existing) {
        const boundary = 'sufipulse_' + Date.now().toString(36);
        const info = JSON.stringify({ snippet: { videoId: session.videoId, language: track.language,
          name: track.name, isDraft: false } });
        const payload = Buffer.concat([
          Buffer.from('--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' +
            info + '\r\n--' + boundary + '\r\nContent-Type: application/octet-stream\r\n\r\n'),
          fs.readFileSync(file), Buffer.from('\r\n--' + boundary + '--\r\n'),
        ]);
        const response = await fetch('https://www.googleapis.com/upload/youtube/v3/captions?uploadType=multipart&part=snippet', {
          method: 'POST', headers: { Authorization: 'Bearer ' + token,
            'Content-Type': 'multipart/related; boundary=' + boundary }, body: payload, cache: 'no-store',
        });
        if (!response.ok) {
          const info = await response.json().catch(() => ({}));
          throw new Error(info?.error?.message || 'YouTube rejected caption upload for ' + code);
        }
      }
      const latest = pipelineDraftStorage.getDraft(draftId);
      if (latest?.publishingTx?.youtubeVideoId === session.videoId) {
        latest.publishingTx.captionTrackStatus = {
          ...(latest.publishingTx.captionTrackStatus || {}), [code]: 'uploaded',
        };
        if (Object.keys(languages).every(key => latest.publishingTx!.captionTrackStatus?.[key] === 'uploaded')) {
          latest.publishingTx.status = 'CAPTIONS_UPLOADED';
        }
        pipelineDraftStorage.saveDraft(latest);
      }
      return NextResponse.json({ language: code, status: 'uploaded', existing: Boolean(existing) });
    } catch (error: any) { return fail(error.message || 'YouTube caption upload failed.', 502); }
  }
  if (session?.state === 'completed') return NextResponse.json({ state: 'completed', videoId: session.videoId, cmsReleaseId: session.releaseId });
  if (body.action === 'start') {
    if (session) return NextResponse.json({ state: session.state, offset: session.offset, size: session.size, resumed: true });
    if (body.confirmPrivateUpload !== true) return fail('Explicit approval for a private YouTube upload is required.', 403);
    const releaseId = String((draft.downstreamStatus as any)?.cmsReleaseId || 'studio_' + draftId);
    const release = cmsServerStorage.getRelease(releaseId);
    if (!release || !release.studioProduction?.approvedAt || release.studioProduction.draftId !== draftId ||
        release.status !== 'approved' || release.youtubeId) return fail('Release is not approved, already uploaded, or not linked to this Studio draft.', 409);
    if (draft.downstreamStatus.approvalStatus !== 'approved_for_publishing' || !draft.downstreamStatus.subtitlesValid ||
        draft.video?.status !== 'RENDERED') return fail('Master, captions or approval is not ready.', 422);
    // Upload the complete A+B+C landscape lyric master as ONE YouTube video.
    // The CMS may carry an obsolete outputPath from an earlier render revision.
    const selected = draft.video.formats?.lyric_master_landscape;
    const master = selected?.outputPath;
    if (!selected || !master || selected.width !== 1920 || selected.height !== 1080 ||
        !selected.partASeconds || !selected.partBSeconds || !selected.partCSeconds ||
        Math.abs((selected.partASeconds + selected.partBSeconds + selected.partCSeconds) - selected.durationSeconds) > 0.15 ||
        selected.durationSeconds < 300 || !selected.sha256 || !fs.existsSync(master) ||
        computeFileSha256(master) !== selected.sha256) {
      return fail('Full A+B+C Studio master is missing or does not match approved render timings and checksum.', 422);
    }
    try {
      const token = await ownedToken();
      const size = fs.statSync(master).size;
      const metadata = { snippet: {
        title: (release.youtubeTitle || release.title).slice(0, 100),
        description: (release.youtubeDescription || release.description || release.title).slice(0, 4900),
        categoryId: '10',
      }, status: { privacyStatus: 'private', selfDeclaredMadeForKids: false } };
      const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(size) },
        body: JSON.stringify(metadata), cache: 'no-store',
      });
      const url = response.headers.get('location');
      if (!response.ok || !url || !url.startsWith('https://www.googleapis.com/')) {
        const info = await response.json().catch(() => ({}));
        throw new Error(info?.error?.message || 'YouTube resumable upload session could not be created.');
      }
      save(draftId, { url, offset: 0, size, path: master, releaseId, state: 'uploading' });
      return NextResponse.json({ state: 'uploading', offset: 0, size });
    } catch (error: any) { return fail(error.message || 'YouTube upload initialization failed', 503); }
  }
  if (body.action !== 'chunk' || !session) return fail('Start the private upload first.', 409);
  if (session.state !== 'uploading') return fail('Session is no longer uploading.', 409);
  try {
    const token = await ownedToken();
    // Query Google for the committed offset; never assume the prior chunk reached YouTube.
    const query = await fetch(session.url, { method: 'PUT', headers: {
      Authorization: 'Bearer ' + token, 'Content-Length': '0',
      'Content-Range': 'bytes */' + session.size,
    }, cache: 'no-store' });
    if (query.status === 200 || query.status === 201) {
      const info = await query.json();
      const verified = await linkVerifiedVideo(draftId, session, info.id, token);
      return NextResponse.json({ state: 'completed', ...verified });
    }
    if (query.status !== 308) return fail('YouTube upload session expired or could not be resumed. Check YouTube Studio before starting another upload.', 409, 'RECONCILIATION_REQUIRED');
    const range = query.headers.get('range');
    const offset = range && /bytes=0-(\d+)/.test(range) ? Number(range.match(/bytes=0-(\d+)/)![1]) + 1 : 0;
    session.offset = offset; save(draftId, session);
    const end = Math.min(offset + CHUNK, session.size);
    if (offset >= end) return fail('Invalid YouTube upload progress.', 422);
    const length = end - offset;
    const handle = fs.openSync(session.path, 'r');
    const buffer = Buffer.allocUnsafe(length);
    try { const bytes = fs.readSync(handle, buffer, 0, length, offset); if (bytes !== length) throw new Error('Video file read incomplete'); }
    finally { fs.closeSync(handle); }
    const response = await fetch(session.url, { method: 'PUT', headers: {
      Authorization: 'Bearer ' + token, 'Content-Type': 'video/mp4',
      'Content-Length': String(length), 'Content-Range': 'bytes ' + offset + '-' + (end - 1) + '/' + session.size,
    }, body: buffer, cache: 'no-store' });
    if (response.status === 200 || response.status === 201) {
      const result = await response.json();
      const verified = await linkVerifiedVideo(draftId, session, result.id, token);
      return NextResponse.json({ state: 'completed', ...verified });
    }
    if (response.status === 308) {
      const range = response.headers.get('range');
      session.offset = range && /bytes=0-(\d+)/.test(range) ? Number(range.match(/bytes=0-(\d+)/)![1]) + 1 : end;
      save(draftId, session);
      return NextResponse.json({ state: 'uploading', offset: session.offset, size: session.size });
    }
    const info = await response.json().catch(() => ({}));
    return fail(info?.error?.message || 'YouTube rejected the upload chunk; resume after checking credentials.', response.status || 502);
  } catch (error: any) {
    return fail(error?.message || 'Upload interrupted. Resume to reconcile YouTube progress; do not start another upload.', 503);
  }
}
