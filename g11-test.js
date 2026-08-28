const http = require('http');

async function doFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body || '{}') }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

(async () => {
  const token = process.env.TOKEN || '';
  const url = 'http://localhost:3005/api/releases';

  // GET
  const get1 = await doFetch(url + '?slug=nund-rishi-life-legacy-kashmir-sufism-sufipulse');
  if (get1.status !== 200) throw new Error('Initial GET failed');
  const original = get1.body[0] || get1.body;
  if (!original.id) throw new Error('Could not find item');

  // PUT sentinel
  const put1 = await doFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ id: original.id, metadataStatus: 'sentinel' })
  });
  if (put1.status !== 200) throw new Error('PUT failed with ' + put1.status);

  // GET without cachebuster
  const get2 = await doFetch(url + '?slug=nund-rishi-life-legacy-kashmir-sufism-sufipulse');
  const mutated = get2.body[0] || get2.body;
  if (mutated.metadataStatus !== 'sentinel') throw new Error('Mutation not visible in GET');

  // Restore
  const put2 = await doFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ id: original.id, metadataStatus: original.metadataStatus })
  });
  if (put2.status !== 200) throw new Error('Restore PUT failed');

  // Final GET
  const get3 = await doFetch(url + '?slug=nund-rishi-life-legacy-kashmir-sufism-sufipulse');
  const restored = get3.body[0] || get3.body;
  if (restored.metadataStatus !== original.metadataStatus) throw new Error('Restore not visible');

  console.log('G11 Filesystem test PASS');
})().catch(console.error);
