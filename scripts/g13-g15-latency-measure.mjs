/**
 * g13-g15-latency-measure.mjs
 * Measures G13 (API warm p50 latency) and G15 (public route server latency proxy).
 * Run against a warm production server (npm start on port 3000 or 3005).
 *
 * Usage: node scripts/g13-g15-latency-measure.mjs [port]
 *
 * G13 PASS:
 *   API warm p50 <= 100ms OR >= 30% improvement from baseline
 *
 * G15 PASS:
 *   each route p50 <= 500ms AND no individual sample > 800ms
 *   Reports: median + maximum per route (both required per gate spec)
 */

const PORT = process.argv[2] || '3000';
const BASE = `http://localhost:${PORT}`;
const SAMPLES = 25; // >= 20 required; 25 for margin

async function time(url, label) {
  const t0 = performance.now();
  const res = await fetch(url, { cache: 'no-store' });
  const ms = performance.now() - t0;
  if (res.status !== 200) {
    throw new Error(
      `${label}: expected HTTP 200, received ${res.status}. ` +
      `Latency gate requires valid responses — a fast 404/401 is not evidence of a working route.`
    );
  }
  return { ms: Math.round(ms) };
}

function p50(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length * 0.5)];
}

function max(arr) { return Math.max(...arr); }

async function warmThenMeasure(label, url, n = SAMPLES, warmupCount = 3) {
  // Warmup: first requests hit cold Next.js compilation — discard them
  for (let i = 0; i < warmupCount; i++) {
    await fetch(url, { cache: 'no-store' }).catch(() => {});
    await new Promise(r => setTimeout(r, 50));
  }
  const results = [];
  for (let i = 0; i < n; i++) {
    const { ms } = await time(url, label); // throws on non-200
    results.push(ms);
    await new Promise(r => setTimeout(r, 30));
  }
  return { label, p50: p50(results), max: max(results), samples: results };
}


async function run() {
  console.log(`\nSufiPulse P0 Gate Measurement — production server at ${BASE}`);
  console.log(`Samples per route: ${SAMPLES} (${3} warmup discarded)\n`);

  // --- G13: API latency ---
  console.log('=== G13: API warm p50 latency ===');
  const g13 = await warmThenMeasure(
    'GET /api/releases',
    `${BASE}/api/releases?status=published&page=1&pageSize=12`
  );
  const g13Pass = g13.p50 <= 100;
  console.log(`  p50: ${g13.p50}ms  max: ${g13.max}ms`);
  console.log(`  G13: ${g13Pass ? '✅ PASS' : '❌ FAIL'} (p50 <= 100ms)`);
  if (!g13Pass) console.log(`  (PASS also if >= 30% improvement from recorded baseline)`);

  // --- G15: Public route server latency proxy ---
  console.log('\n=== G15: Public route server latency proxy ===');
  const routes = [
    { label: '/', url: `${BASE}/` },
    { label: '/releases', url: `${BASE}/releases` },
    { label: '/writers', url: `${BASE}/writers` },
    { label: '/vocalists', url: `${BASE}/vocalists` },
    { label: '/studio', url: `${BASE}/studio` },
  ];

  const g15Results = [];
  for (const r of routes) {
    const result = await warmThenMeasure(r.label, r.url);
    const pass = result.p50 <= 500 && result.max <= 800;
    g15Results.push({ ...result, pass });
    console.log(`  ${r.label}`);
    console.log(`    p50: ${result.p50}ms  max: ${result.max}ms  ${pass ? '✅ PASS' : '❌ FAIL'}`);
    if (!pass) {
      if (result.p50 > 500) console.log(`    ↳ FAIL: p50 ${result.p50}ms > 500ms limit`);
      if (result.max > 800) console.log(`    ↳ FAIL: max ${result.max}ms > 800ms limit`);
    }
  }

  const g15Pass = g15Results.every(r => r.pass);
  console.log(`\n  G15 overall: ${g15Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('  (G15 proves server layer is not an obvious bottleneck; not a browser UX certification)');

  // Summary
  console.log('\n=== Gate evidence summary ===');
  console.log(`  G13: p50=${g13.p50}ms max=${g13.max}ms — ${g13Pass ? 'PASS' : 'FAIL'}`);
  g15Results.forEach(r => {
    console.log(`  G15 ${r.label}: p50=${r.p50}ms max=${r.max}ms — ${r.pass ? 'PASS' : 'FAIL'}`);
  });
}

run().catch(err => {
  console.error('Measurement failed:', err.message);
  process.exit(1);
});
