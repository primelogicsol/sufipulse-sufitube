import fs from 'node:fs';

function normalize(raw, keyName = '') {
  let value = String(raw || '').trim();
  if (keyName && value.startsWith(`${keyName}=`)) value = value.slice(keyName.length + 1).trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) value = value.slice(1, -1).trim();
  return value;
}

const clientId = normalize(process.env.YOUTUBE_CLIENT_ID, 'YOUTUBE_CLIENT_ID');
const clientSecret = normalize(process.env.YOUTUBE_CLIENT_SECRET, 'YOUTUBE_CLIENT_SECRET');
const refreshToken = normalize(process.env.YOUTUBE_REFRESH_TOKEN, 'YOUTUBE_REFRESH_TOKEN');
const expectedChannelId = normalize(process.env.YOUTUBE_CHANNEL_ID, 'YOUTUBE_CHANNEL_ID');
const minExpectedUploads = Math.max(1, Number(process.env.MIN_EXPECTED_UPLOADS || 95));
const output = process.env.GITHUB_OUTPUT || '';

function writeOutput(key, value) {
  if (!output) return;
  fs.appendFileSync(output, `${key}=${String(value).replace(/\n/g, ' ')}\n`);
}

function normalizeText(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim();
}

function parseDuration(duration) {
  const match = String(duration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function refreshAccessToken() {
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN are required.');
  }
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const payload = await parseJson(response);
  if (!response.ok || !payload.access_token) {
    throw new Error(`OAuth refresh failed (${response.status}): ${payload.error_description || payload.error || 'unknown error'}`);
  }
  return String(payload.access_token);
}

async function youtubeJson(resource, params, accessToken) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const payload = await parseJson(response);
  if (!response.ok) {
    const reason = payload?.error?.errors?.[0]?.reason || '';
    const message = payload?.error?.message || payload?.error_description || 'request failed';
    throw new Error(`YouTube Data API ${response.status}${reason ? ` ${reason}` : ''}: ${message}`);
  }
  return payload;
}

async function loadLiveCatalog(accessToken) {
  const channels = await youtubeJson('channels', {
    part: 'contentDetails,snippet',
    mine: 'true',
    maxResults: '50',
  }, accessToken);
  const items = Array.isArray(channels.items) ? channels.items : [];
  const channel = items.find(item => String(item?.id || '').trim() === expectedChannelId);
  if (!channel) {
    throw new Error(`Authorized YouTube identity did not return expected channel ${expectedChannelId}.`);
  }
  const uploads = String(channel?.contentDetails?.relatedPlaylists?.uploads || '').trim();
  if (!uploads) throw new Error('Uploads playlist missing from authorized channel.');

  const ids = [];
  let pageToken = '';
  do {
    const params = { part: 'contentDetails', playlistId: uploads, maxResults: '50' };
    if (pageToken) params.pageToken = pageToken;
    const page = await youtubeJson('playlistItems', params, accessToken);
    for (const item of page.items || []) {
      const id = String(item?.contentDetails?.videoId || '').trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
    pageToken = String(page.nextPageToken || '');
  } while (pageToken);

  const videos = [];
  for (let index = 0; index < ids.length; index += 50) {
    const chunk = ids.slice(index, index + 50);
    const payload = await youtubeJson('videos', {
      part: 'snippet,contentDetails,statistics',
      id: chunk.join(','),
      maxResults: '50',
    }, accessToken);
    videos.push(...(payload.items || []));
  }

  const byId = new Map(videos.map(video => [video.id, video]));
  const ordered = ids.map(id => byId.get(id)).filter(Boolean);
  if (ordered.length !== ids.length) {
    throw new Error(`Uploads playlist returned ${ids.length} IDs but detailed metadata returned ${ordered.length}.`);
  }
  return ordered;
}

function loadCmsSeed() {
  const seed = JSON.parse(fs.readFileSync('lib/cms-seed-releases.json', 'utf8'));
  if (!Array.isArray(seed) || seed.length === 0) throw new Error('CMS seed registry is empty or invalid.');
  return seed;
}

function reconcile(videos, cmsReleases) {
  const cmsByYoutubeId = new Map();
  for (const release of cmsReleases) {
    const id = String(release?.youtubeId || '').trim();
    if (!id) continue;
    const list = cmsByYoutubeId.get(id) || [];
    list.push(release);
    cmsByYoutubeId.set(id, list);
  }

  const counts = {
    matched: 0,
    youtubeOnly: 0,
    metadataMismatch: 0,
    duplicates: 0,
    cmsOnlyOrNonpublic: 0,
    missingYoutubeId: 0,
  };

  for (const video of videos) {
    const matches = cmsByYoutubeId.get(video.id) || [];
    if (matches.length > 1) {
      counts.duplicates += 1;
      continue;
    }
    if (matches.length === 0) {
      counts.youtubeOnly += 1;
      continue;
    }

    const existing = matches[0];
    const mismatch = [];
    if (normalizeText(existing.title) !== normalizeText(video?.snippet?.title)) mismatch.push('title');
    if (normalizeText(existing.description) !== normalizeText(video?.snippet?.description)) mismatch.push('description');
    const liveDuration = parseDuration(video?.contentDetails?.duration || 'PT0S');
    if (liveDuration > 0 && Number(existing.durationSeconds || 0) !== liveDuration) mismatch.push('duration');

    if (mismatch.length > 0) counts.metadataMismatch += 1;
    else counts.matched += 1;
  }

  const liveIds = new Set(videos.map(video => video.id));
  counts.cmsOnlyOrNonpublic = cmsReleases.filter(release => {
    const id = String(release?.youtubeId || '').trim();
    return id && !liveIds.has(id);
  }).length;
  counts.missingYoutubeId = cmsReleases.filter(release => {
    const id = String(release?.youtubeId || '').trim();
    return !id && release?.format !== 'playlist';
  }).length;

  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = videos.filter(video => {
    const published = new Date(video?.snippet?.publishedAt || 0).getTime();
    return Number.isFinite(published) && published >= cutoff;
  });
  const incrementalCreates = recent.filter(video => !(cmsByYoutubeId.get(video.id) || []).length).length;
  const incrementalUpdates = recent.length - incrementalCreates;

  return { counts, recentCount: recent.length, incrementalCreates, incrementalUpdates };
}

async function main() {
  if (!expectedChannelId) throw new Error('YOUTUBE_CHANNEL_ID is required.');
  const accessToken = await refreshAccessToken();
  const liveVideos = await loadLiveCatalog(accessToken);
  if (liveVideos.length < minExpectedUploads) {
    throw new Error(`Expected at least ${minExpectedUploads} public uploads, received ${liveVideos.length}.`);
  }

  const cmsReleases = loadCmsSeed();
  const result = reconcile(liveVideos, cmsReleases);

  console.log(`LIVE_RECONCILIATION_CHANNEL=${expectedChannelId}`);
  console.log(`LIVE_RECONCILIATION_UPLOADS=${liveVideos.length}`);
  console.log(`CMS_SEED_RELEASES=${cmsReleases.length}`);
  console.log(`RECON_MATCHED=${result.counts.matched}`);
  console.log(`RECON_YOUTUBE_ONLY=${result.counts.youtubeOnly}`);
  console.log(`RECON_METADATA_MISMATCH=${result.counts.metadataMismatch}`);
  console.log(`RECON_DUPLICATES=${result.counts.duplicates}`);
  console.log(`RECON_CMS_ONLY_OR_NONPUBLIC=${result.counts.cmsOnlyOrNonpublic}`);
  console.log(`RECON_MISSING_YOUTUBE_ID=${result.counts.missingYoutubeId}`);
  console.log(`INCREMENTAL_30D_LIVE_COUNT=${result.recentCount}`);
  console.log(`INCREMENTAL_30D_CREATE_PLAN=${result.incrementalCreates}`);
  console.log(`INCREMENTAL_30D_UPDATE_PLAN=${result.incrementalUpdates}`);

  writeOutput('status', 'success');
  writeOutput('uploads', liveVideos.length);
  writeOutput('cms_seed', cmsReleases.length);
  writeOutput('matched', result.counts.matched);
  writeOutput('youtube_only', result.counts.youtubeOnly);
  writeOutput('metadata_mismatch', result.counts.metadataMismatch);
  writeOutput('duplicates', result.counts.duplicates);
  writeOutput('cms_only_or_nonpublic', result.counts.cmsOnlyOrNonpublic);
  writeOutput('missing_youtube_id', result.counts.missingYoutubeId);
  writeOutput('recent_30d', result.recentCount);
  writeOutput('recent_create', result.incrementalCreates);
  writeOutput('recent_update', result.incrementalUpdates);
}

main().catch(error => {
  writeOutput('status', 'failure');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
