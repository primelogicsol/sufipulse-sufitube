import assert from 'node:assert/strict';
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
    const missingVideo = await emptyService.getVideoById('ccccccccccc');
    assert.equal(missingVideo, null, 'Empty upstream response must not manufacture a video record');
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = originalKey;
    if (originalPublicKey === undefined) delete process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    else process.env.NEXT_PUBLIC_YOUTUBE_API_KEY = originalPublicKey;
  }
}

async function main() {
  testStudioCsvParsing();
  await testYouTubeDataApiFailures();
  console.log('Phase 1 YouTube runtime contract tests passed.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
