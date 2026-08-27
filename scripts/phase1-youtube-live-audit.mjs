import fs from 'node:fs';

function normalizeEnvSecret(raw, keyName = '') {
  let value = String(raw || '').trim();
  if (keyName && value.startsWith(`${keyName}=`)) {
    value = value.slice(keyName.length + 1).trim();
  }
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

const expectedChannelId = normalizeEnvSecret(process.env.YOUTUBE_CHANNEL_ID, 'YOUTUBE_CHANNEL_ID');
const output = process.env.GITHUB_OUTPUT || '';

function writeOutput(key, value) {
  if (!output) return;
  fs.appendFileSync(output, `${key}=${String(value).replace(/\n/g, ' ')}\n`);
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
  const clientId = normalizeEnvSecret(process.env.YOUTUBE_CLIENT_ID, 'YOUTUBE_CLIENT_ID');
  const clientSecret = normalizeEnvSecret(process.env.YOUTUBE_CLIENT_SECRET, 'YOUTUBE_CLIENT_SECRET');
  const refreshToken = normalizeEnvSecret(process.env.YOUTUBE_REFRESH_TOKEN, 'YOUTUBE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await parseJson(response);
  if (!response.ok || !payload.access_token) {
    throw new Error(`OAuth token refresh failed (${response.status}): ${payload.error_description || payload.error || 'unknown error'}`);
  }
  return payload.access_token;
}

async function youtubeJson(path, credential) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  const headers = {};
  if (credential.type === 'oauth') {
    headers.authorization = `Bearer ${credential.value}`;
  } else {
    url.searchParams.set('key', credential.value);
  }

  const response = await fetch(url, { headers });
  const payload = await parseJson(response);
  if (!response.ok) {
    const reason = payload?.error?.errors?.[0]?.reason || '';
    const message = payload?.error?.message || payload?.error_description || 'request failed';
    const error = new Error(`YouTube Data API ${response.status}${reason ? ` ${reason}` : ''}: ${message}`);
    error.status = response.status;
    error.reason = reason;
    throw error;
  }
  return payload;
}

async function auditWith(credential) {
  let channel;
  if (credential.type === 'oauth') {
    channel = await youtubeJson('channels?part=contentDetails,snippet&mine=true', credential);
  } else {
    if (!expectedChannelId) throw new Error('YOUTUBE_CHANNEL_ID is required for API-key catalog audit.');
    channel = await youtubeJson(`channels?part=contentDetails,snippet&id=${encodeURIComponent(expectedChannelId)}`, credential);
  }

  const channelItem = channel.items?.[0];
  const actualChannelId = String(channelItem?.id || '').trim();
  if (!actualChannelId) throw new Error('YouTube Data API returned no channel for the selected credential.');
  if (expectedChannelId && actualChannelId !== expectedChannelId) {
    throw new Error(`Authorized YouTube channel mismatch: expected ${expectedChannelId}, got ${actualChannelId}.`);
  }

  const uploads = channelItem?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error('Uploads playlist was not returned for the configured channel.');

  let count = 0;
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      part: 'contentDetails',
      playlistId: uploads,
      maxResults: '50',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const page = await youtubeJson(`playlistItems?${params.toString()}`, credential);
    count += page.items?.length || 0;
    pageToken = page.nextPageToken || '';
  } while (pageToken);

  if (count === 0) throw new Error('Configured channel returned zero public uploads.');
  return { count, channelId: actualChannelId };
}

async function main() {
  const credentials = [];
  const failures = [];

  try {
    const accessToken = await refreshAccessToken();
    if (accessToken) credentials.push({ type: 'oauth', value: accessToken, label: 'oauth-owner' });
  } catch (error) {
    failures.push(`oauth-refresh: ${error.message}`);
  }

  const serverKey = normalizeEnvSecret(process.env.YOUTUBE_API_KEY, 'YOUTUBE_API_KEY');
  const legacyKey = normalizeEnvSecret(process.env.LEGACY_YOUTUBE_API_KEY, 'NEXT_PUBLIC_YOUTUBE_API_KEY');
  if (serverKey) credentials.push({ type: 'api-key', value: serverKey, label: 'server-api-key' });
  if (legacyKey && legacyKey !== serverKey) credentials.push({ type: 'api-key', value: legacyKey, label: 'legacy-api-key' });

  if (credentials.length === 0) {
    console.log('No OAuth or YouTube Data API credential is available; live catalog audit skipped.');
    writeOutput('status', 'skipped');
    writeOutput('credential_mode', 'none');
    return;
  }

  for (const credential of credentials) {
    try {
      const result = await auditWith(credential);
      console.log(`LIVE_PUBLIC_UPLOAD_COUNT=${result.count}`);
      console.log(`LIVE_DATA_API_CREDENTIAL_MODE=${credential.label}`);
      writeOutput('status', 'success');
      writeOutput('count', result.count);
      writeOutput('credential_mode', credential.label);
      return;
    } catch (error) {
      const message = `${credential.label}: ${error.message}`;
      console.error(message);
      failures.push(message);
    }
  }

  writeOutput('status', 'failure');
  writeOutput('credential_mode', 'all-failed');
  throw new Error(`All configured live YouTube Data API credential paths failed. ${failures.join(' | ')}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
