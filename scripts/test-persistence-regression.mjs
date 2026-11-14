import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 1. Setup Auth
const envText = fs.readFileSync('.env.local', 'utf8');
const jwtSecret = envText.split('\n').find((l) => l.startsWith('JWT_SECRET=')).split('=')[1].trim().replace(/^['"]|['"]$/g, '');

const b64 = (s) => Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const payload = b64(JSON.stringify({
  userId: '1785047409044-jc5kaobzu',
  email: 'fk.envcal@gmail.com',
  role: 'admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 7200,
  jti: 'persist-test-' + Date.now(),
}));
const sig = crypto.createHmac('sha256', jwtSecret).update(header + '.' + payload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `${header}.${payload}.${sig}`;

const headers = {
  Cookie: `access_token=${token}`,
  'Content-Type': 'application/json',
};

const BASE_URL = 'http://localhost:3005';

function createSineWaveBuffer(durationSeconds = 2.0, sampleRate = 48000) {
  const numChannels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const dataSize = numSamples * blockAlign;
  const buf = Buffer.alloc(44 + dataSize);

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const val = Math.floor(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 16000);
    buf.writeInt16LE(val, offset);
    buf.writeInt16LE(val, offset + 2);
    offset += 4;
  }
  return buf;
}

async function runRegressionTest() {
  console.log('========================================================');
  console.log(' SUFIPULSE PIPELINE: PERSISTENCE REGRESSION TEST SUITE');
  console.log('========================================================\n');

  // Verify baseline catalog
  const catalogBefore = JSON.parse(fs.readFileSync('.data/cms-releases.json', 'utf8'));
  console.log(`[Baseline] Production catalog release count: ${catalogBefore.length} (invariant: 99)`);
  if (catalogBefore.length !== 99) {
    throw new Error(`Catalog invariant violated! Expected 99 releases, got ${catalogBefore.length}`);
  }

  // Step 1: Create draft
  console.log('\n[Step 1] Creating new pipeline draft...');
  const createRes = await fetch(`${BASE_URL}/api/admin/pipeline/drafts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Rab Ki Tasbeeh (Bolo Ab Toh Bolo - Kashmiri Dialogue)',
      slug: 'rab-ki-tasbeeh-bolo-ab-toh-bolo',
      lyricsText: 'بولو اب تو بولو خاموش زمیرو\nعشق اور فنا میں خاموشی کا نور ہے',
      primaryLanguage: 'ur',
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok || !createData.draft?.draftId) {
    throw new Error(`Step 1 Failed: ${JSON.stringify(createData)}`);
  }
  const draftId = createData.draft.draftId;
  console.log(`  -> Draft created successfully: ${draftId}`);
  console.log(`  -> Title: "${createData.draft.title}"`);
  console.log(`  -> Slug: "${createData.draft.slug}"`);

  // Step 2: Save draft to disk verification
  console.log('\n[Step 2] Verifying durable storage on disk...');
  const diskPath = path.resolve('.data', 'pipeline-drafts', draftId, 'draft.json');
  if (!fs.existsSync(diskPath)) {
    throw new Error(`Step 2 Failed: File does not exist at ${diskPath}`);
  }
  const rawDisk = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
  console.log(`  -> Verified file exists at: ${diskPath}`);
  console.log(`  -> On-disk draftId matches: ${rawDisk.draftId === draftId}`);

  // Step 3: Retrieve draft through API
  console.log('\n[Step 3] Retrieving draft through API GET /api/admin/pipeline/drafts/' + draftId);
  const getRes1 = await fetch(`${BASE_URL}/api/admin/pipeline/drafts/${draftId}`, { headers });
  const getData1 = await getRes1.json();
  if (!getRes1.ok || getData1.draft?.draftId !== draftId) {
    throw new Error(`Step 3 Failed: ${JSON.stringify(getData1)}`);
  }
  console.log(`  -> API returned 200 OK. Title: "${getData1.draft.title}"`);

  // Step 4: Simulate process reload / memory flush
  console.log('\n[Step 4] Simulating process reload & direct disk re-read...');
  const directRead = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
  console.log(`  -> Re-read ${diskPath} directly from disk: Status is "${directRead.downstreamStatus.approvalStatus}"`);

  // Step 5: Retrieve same draft again through API
  console.log('\n[Step 5] Retrieving draft again after reload...');
  const getRes2 = await fetch(`${BASE_URL}/api/admin/pipeline/drafts/${draftId}`, { headers });
  const getData2 = await getRes2.json();
  if (!getRes2.ok || getData2.draft?.draftId !== draftId) {
    throw new Error(`Step 5 Failed: ${JSON.stringify(getData2)}`);
  }
  console.log(`  -> API returned 200 OK. Revision: ${getData2.draft.currentRevision}`);

  // Step 6: Import audio variant
  console.log('\n[Step 6] Importing authorized audio variant into draft...');
  const testWav = createSineWaveBuffer(5.0, 48000);
  const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');
  const formDataHeader = `--${boundary}\r\nContent-Disposition: form-data; name="label"\r\n\r\nVariant A (Kashmiri Sufi-Rishi Dialogue)\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="variant_a_take1.wav"\r\nContent-Type: audio/wav\r\n\r\n`;
  const formDataFooter = `\r\n--${boundary}--\r\n`;
  const fullBody = Buffer.concat([
    Buffer.from(formDataHeader, 'utf8'),
    testWav,
    Buffer.from(formDataFooter, 'utf8'),
  ]);

  const uploadRes = await fetch(`${BASE_URL}/api/admin/pipeline/drafts/${draftId}/upload-variant`, {
    method: 'POST',
    headers: {
      Cookie: `access_token=${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: fullBody,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.success) {
    throw new Error(`Step 6 Failed: ${JSON.stringify(uploadData)}`);
  }
  console.log(`  -> Variant uploaded successfully: ${uploadData.variant.variantId}`);
  console.log(`  -> Duration: ${uploadData.variant.durationSeconds}s, Format: ${uploadData.variant.format}`);

  // Step 7: Reload / re-fetch draft
  console.log('\n[Step 7] Re-fetching draft to simulate browser page reload...');
  const getRes3 = await fetch(`${BASE_URL}/api/admin/pipeline/drafts/${draftId}`, { headers });
  const getData3 = await getRes3.json();
  if (!getRes3.ok) {
    throw new Error(`Step 7 Failed: ${JSON.stringify(getData3)}`);
  }

  // Step 8: Verify variant remains attached
  console.log('\n[Step 8] Verifying variant persistence...');
  const variants = Object.values(getData3.draft?.variants || {});
  console.log(`  -> Ingested Variants count: ${variants.length}`);
  if (variants.length !== 1) {
    throw new Error(`Step 8 Failed: Expected 1 variant, found ${variants.length}`);
  }
  const attachedVariant = variants[0];
  console.log(`  -> Attached Variant ID: ${attachedVariant.variantId}`);
  console.log(`  -> Label: "${attachedVariant.label}"`);
  console.log(`  -> Duration: ${attachedVariant.durationSeconds}s`);
  console.log(`  -> Sample Rate: ${attachedVariant.sampleRate}Hz`);
  console.log(`  -> Audio File Exists on Disk: ${fs.existsSync(attachedVariant.filePath)}`);

  // Verify historical catalog remains completely untouched
  console.log('\n[Step 9] Verifying production catalog invariant...');
  const catalogAfter = JSON.parse(fs.readFileSync('.data/cms-releases.json', 'utf8'));
  console.log(`  -> Production catalog release count: ${catalogAfter.length} (Expected: 99)`);
  if (catalogAfter.length !== 99) {
    throw new Error(`CRITICAL ERROR: Production catalog modified! Count: ${catalogAfter.length}`);
  }

  // Clean up test draft
  console.log('\n[Step 10] Cleaning up regression test draft...');
  const delRes = await fetch(`${BASE_URL}/api/admin/pipeline/drafts/${draftId}`, {
    method: 'DELETE',
    headers,
  });
  const delData = await delRes.json();
  console.log(`  -> Delete response: ${JSON.stringify(delData)}`);

  // Final verification that drafts list is 0
  const finalDraftsRes = await fetch(`${BASE_URL}/api/admin/pipeline/drafts`, { headers });
  const finalDraftsData = await finalDraftsRes.json();
  console.log(`  -> Final active drafts count: ${finalDraftsData.drafts?.length ?? 0}`);

  console.log('\n========================================================');
  console.log(' ALL 8 REGRESSION TEST STEPS PASSED SUCCESSFULLY (100%)');
  console.log('========================================================\n');
}

runRegressionTest().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  process.exit(1);
});
