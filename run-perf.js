const http = require('http');

async function measure(url, runs = 25) {
  const times = [];
  // warmup
  for (let i = 0; i < 2; i++) await doFetch(url);

  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    await doFetch(url);
    times.push(Date.now() - start);
  }
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(runs * 0.5)];
  const p95 = times[Math.floor(runs * 0.95)];
  const max = times[runs - 1];
  return { n: runs, p50, p95, max };
}

function doFetch(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    }).on('error', resolve);
  });
}

(async () => {
  console.log('=== G13 / G15 Performance Measurements ===');
  const api = await measure('http://localhost:3005/api/releases?limit=12');
  console.log('G13 /api/releases: n=' + api.n + ', p50=' + api.p50 + 'ms, p95=' + api.p95 + 'ms, max=' + api.max + 'ms');

  const p_rel = await measure('http://localhost:3005/releases', 5);
  console.log('G15 /releases: n=' + p_rel.n + ', p50=' + p_rel.p50 + 'ms, max=' + p_rel.max + 'ms');

  const p_wri = await measure('http://localhost:3005/writers', 5);
  console.log('G15 /writers: n=' + p_wri.n + ', p50=' + p_wri.p50 + 'ms, max=' + p_wri.max + 'ms');

  const p_voc = await measure('http://localhost:3005/vocalists', 5);
  console.log('G15 /vocalists: n=' + p_voc.n + ', p50=' + p_voc.p50 + 'ms, max=' + p_voc.max + 'ms');

  const p_stu = await measure('http://localhost:3005/studio', 5);
  console.log('G15 /studio: n=' + p_stu.n + ', p50=' + p_stu.p50 + 'ms, max=' + p_stu.max + 'ms');
})();
