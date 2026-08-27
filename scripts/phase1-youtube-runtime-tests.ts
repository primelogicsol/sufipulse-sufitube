import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseYouTubeStudioCsv } from '../lib/youtube-studio-import';
import { YouTubeService } from '../lib/youtube-service';

async function expectRejects(action: () => Promise<unknown>, pattern: RegExp) {
  let thrown: unknown;
  try {
    await action();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown instanceof Error, 'Expected operation to reject with Error');
  assert.match(thrown.message, pattern);
}

function testStudioCsvParsing() {
  const csv = [
    'Video,Video title,Views,Watch time (hours),Average view duration,Impressions,Impressions click-through rate (%)',
    'abcDEF12345,Test Release,120,2.5,0:45,1000,8.4',
    'abcDEF12345,Test Release Updated,130,3,0:50,1100,8.8',
  ].join('\n');

  const snapshot = parseYouTubeStudioCsv(csv, 'fixture.csv');
  assert.equal(snapshot.source, 'youtube_studio_advanced_mode_csv');
  assert.equal(snapshot.rowCount, 1, 'Duplicate video IDs must reconcile to one row');
  assert.equal(snapshot.rows[0].videoId, 'abcDEF12345');
  assert.equal(snapshot.rows[0].title, 'Test Release Updated');
  assert.equal(snapshot.rows[0].views, 130);
  assert.equal(snapshot.rows[0].watchTimeMinutes, 180);
  assert.equal(snapshot.rows[0].avgViewDurationSecs, 50);
  assert.equal(snapshot.rows[0].impressions, 1100);
  assert.equal(snapshot.rows[0].ctr, 8.8);

  const realExportShape = [
    'Content,Video title,Video publish time,Duration,Views,Watch time (hours),Subscribers,Estimated revenue (USD),Thumbnail impressions,Thumbnail click-through rate (%)',
    'Total,,,,159475,10359.5571,2209,31.84,986789,8.4',
    '8nmW-vJbwMA,13 January 2026,"Jan 13, 2026",161,40840,4950.7594,666,0.988,163837,21.92',
  ].join('\n');

  const realExportSnapshot = parseYouTubeStudioCsv(realExportShape, 'Table data.csv');
  assert.equal(realExportSnapshot.rowCount, 1, 'Studio Total row must not be treated as a video');
  assert.equal(realExportSnapshot.rows[0].videoId, '8nmW-vJbwMA');
  assert.equal(realExportSnapshot.rows[0].views, 40840);
  assert.equal(realExportSnapshot.rows[0].watchTimeMinutes, 297045.564);
  assert.equal(realExportSnapshot.rows[0].impressions, 163837);
  assert.equal(realExportSnapshot.rows[0].ctr, 21.92, 'Real Thumbnail click-through rate (%) header must map to CTR');
  assert.equal(realExportSnapshot.rows[0].publishedAt, 'Jan 13, 2026');
  assert.equal(realExportSnapshot.rows[0].avgViewDurationSecs, null, 'Missing Average view duration must remain unavailable, not fabricated from video Duration');

  assert.throws(
    () => parseYouTubeStudioCsv('Title,Views\nNo video id,12', 'bad.csv'),
    /video\/content ID column/i,
    'CSV without video/content ID must be rejected'
  );

  assert.throws(
    () => parseYouTubeStudioCsv('Video,Views', 'empty.csv'),
    /header row and at least one data row/i,
    'Header-only CSV must be rejected'
  );

  assert.throws(
    () => parseYouTubeStudioCsv('Video,Views\nnot-a-youtube-id,12', 'invalid-id.csv'),
    /No valid 11-character YouTube video IDs/i,
    'CSV without valid YouTube IDs must be rejected'
  );
}

async function testYouTubeDataApiFailures() {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.YOUTUBE_API_KEY;
  const originalPublicKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  try {
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    const missingKeyService = new YouTubeService({ apiKey: 'YOUR_KEY_HERE', maxRetries: 0 });
    await expectRejects(
      () => missingKeyService.getVideosByIds('aaaaaaaaaaa'),
      /API key is missing or invalid/i
    );

    globalThis.fetch = async () => new Response(
      JSON.stringify({ error: { message: 'The request cannot be completed because you have exceeded your quota.' } }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    const quotaService = new YouTubeService({ apiKey: 'phase1-test-key', maxRetries: 0 });
    await expectRejects(
      () => quotaService.getVideosByIds('bbbbbbbbbbb'),
      /quota exceeded/i
    );
    assert.equal(quotaService.isQuotaExceeded(), true, 'Quota state should be recorded after a quota response');

    globalThis.fetch = async () => new Response(
      JSON.stringify({ items: [] }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const emptyService = new YouTubeService({ apiKey: 'phase1-test-key', maxRetries: 0 });
    const missingVideos = await emptyService.getVideosByIds('ccccccccccc');
    assert.deepEqual(missingVideos, [], 'Empty upstream response must remain empty and must not manufacture a video record');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = originalKey;
    if (originalPublicKey === undefined) delete process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    else process.env.NEXT_PUBLIC_YOUTUBE_API_KEY = originalPublicKey;
  }
}

async function testOAuthRefreshContracts() {
  const originalFetch = globalThis.fetch;
  const originalDataDir = process.env.DATA_DIR;
  const originalClientId = process.env.YOUTUBE_CLIENT_ID;
  const originalClientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const originalRefreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sufipulse-phase1-oauth-'));

  try {
    process.env.DATA_DIR = tempDir;
    process.env.YOUTUBE_CLIENT_ID = 'phase1-client';
    process.env.YOUTUBE_CLIENT_SECRET = 'phase1-secret';
    delete process.env.YOUTUBE_REFRESH_TOKEN;

    const store = await import('../app/lib/server/youtube-analytics-oauth-store');
    const readClient = await import('../lib/youtube-data-api-readonly');

    await store.saveYTAnalyticsToken({
      accessToken: 'expired-access',
      refreshToken: 'revoked-refresh',
      expiresInSeconds: -60,
    });

    globalThis.fetch = async () => new Response(
      JSON.stringify({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );

    const revokedResult = await store.getValidYTAnalyticsAccessToken();
    assert.equal(revokedResult, null, 'Revoked refresh token must require reconnect instead of returning stale access token');

    let revokedReadError: unknown;
    try {
      await readClient.fetchReadOnlyYouTubeChannelVideos(1);
    } catch (error) {
      revokedReadError = error;
    }
    assert.ok(revokedReadError instanceof readClient.YouTubeDataApiReadError);
    assert.equal(revokedReadError.status, 401, 'Revoked OAuth credential must surface as unauthorized on the sync read path');
    assert.equal(revokedReadError.reason, 'oauth_refresh_failed');
    assert.equal(revokedReadError.reconnectRequired, true, 'Revoked OAuth credential must explicitly require reconnect');

    await store.saveYTAnalyticsToken({
      accessToken: 'expired-access-2',
      refreshToken: 'valid-refresh',
      expiresInSeconds: -60,
    });

    globalThis.fetch = async () => new Response(
      JSON.stringify({ access_token: 'renewed-access', expires_in: 3600, token_type: 'Bearer' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const renewed = await store.getValidYTAnalyticsAccessToken();
    assert.equal(renewed, 'renewed-access', 'Valid refresh token must renew the access token');

    const stored = await store.getYTAnalyticsToken();
    assert.equal(stored?.accessToken, 'renewed-access', 'Renewed access token must be persisted atomically');
    assert.equal(stored?.refreshToken, 'valid-refresh', 'Refresh token must be preserved after renewal');

    globalThis.fetch = async () => new Response(
      JSON.stringify({
        error: {
          code: 403,
          status: 'PERMISSION_DENIED',
          message: 'Insufficient Permission',
          errors: [{ reason: 'forbidden' }],
        },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    let scopeReadError: unknown;
    try {
      await readClient.fetchReadOnlyYouTubeChannelVideos(1);
    } catch (error) {
      scopeReadError = error;
    }
    assert.ok(scopeReadError instanceof readClient.YouTubeDataApiReadError);
    assert.equal(scopeReadError.status, 403, 'Insufficient Data API scope must preserve upstream 403');
    assert.equal(scopeReadError.reason, 'insufficient_scope');
    assert.equal(scopeReadError.reconnectRequired, true, 'Insufficient scope must explicitly require reconnect');
  } finally {
    globalThis.fetch = originalFetch;
    await fs.rm(tempDir, { recursive: true, force: true });
    if (originalDataDir === undefined) delete process.env.DATA_DIR;
    else process.env.DATA_DIR = originalDataDir;
    if (originalClientId === undefined) delete process.env.YOUTUBE_CLIENT_ID;
    else process.env.YOUTUBE_CLIENT_ID = originalClientId;
    if (originalClientSecret === undefined) delete process.env.YOUTUBE_CLIENT_SECRET;
    else process.env.YOUTUBE_CLIENT_SECRET = originalClientSecret;
    if (originalRefreshToken === undefined) delete process.env.YOUTUBE_REFRESH_TOKEN;
    else process.env.YOUTUBE_REFRESH_TOKEN = originalRefreshToken;
  }
}

async function testAnalyticsUpstreamContracts() {
  const originalFetch = globalThis.fetch;
  try {
    const analytics = await import('../lib/youtube-analytics-client');

    globalThis.fetch = async () => new Response(
      JSON.stringify({ error: { code: 403, message: 'Insufficient Permission' } }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );

    let scopeError: unknown;
    try {
      await analytics.queryYouTubeAnalytics(
        { dimensions: 'video', metrics: 'views', maxResults: '1' },
        'phase1-explicit-access-token'
      );
    } catch (error) {
      scopeError = error;
    }

    assert.ok(scopeError instanceof analytics.YouTubeAnalyticsUpstreamError);
    assert.equal(scopeError.status, 403, 'Insufficient Analytics scope must preserve upstream 403 for reconnect handling');

    globalThis.fetch = async () => new Response(
      JSON.stringify({ error: { code: 500, message: 'Temporary upstream failure' } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );

    let upstreamError: unknown;
    try {
      await analytics.queryYouTubeAnalytics(
        { dimensions: 'video', metrics: 'views', maxResults: '1' },
        'phase1-explicit-access-token'
      );
    } catch (error) {
      upstreamError = error;
    }

    assert.ok(upstreamError instanceof analytics.YouTubeAnalyticsUpstreamError);
    assert.equal(upstreamError.status, 500, 'Temporary upstream failure must remain an explicit API error');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function main() {
  testStudioCsvParsing();
  await testYouTubeDataApiFailures();
  await testOAuthRefreshContracts();
  await testAnalyticsUpstreamContracts();
  console.log('Phase 1 YouTube runtime contract tests passed.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});