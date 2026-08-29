const http = require('http');

const testEndpoint = (path) => new Promise((resolve) => {
  http.get('http://localhost:3005' + path, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      resolve({ status: res.statusCode, path, data: JSON.parse(body) });
    });
  }).on('error', (e) => resolve({ status: 'ERROR', error: e.message }));
});

(async () => {
  const tests = [
    { path: '/api/releases?page=1&pageSize=12&format=short', check: i => i.format === 'short' },
    { path: '/api/releases?page=1&pageSize=12&governance=native_governed', check: i => i.governanceOrigin === 'native_governed' },
    { path: '/api/releases?page=1&pageSize=12&duration=long', check: i => i.durationSeconds > 480 },
    { path: '/api/releases?page=1&pageSize=12&year=2025', check: i => new Date(i.releaseDate).getFullYear() === 2025 },
    { path: '/api/releases?page=1&pageSize=12&sort=popular', sortCheck: (prev, curr) => (curr.viewCount || 0) <= (prev.viewCount || 0) }
  ];

  console.log('--- RUNTIME FILTER PROOFS ---');

  for (const t of tests) {
    const res = await testEndpoint(t.path);
    console.log(`\nEndpoint: ${t.path}`);
    console.log(`Status: HTTP ${res.status}`);
    
    if (res.status === 200 && res.data.items) {
      console.log(`Count: ${res.data.items.length}`);
      if (res.data.items.length === 0) {
        console.log(`PASS (Empty result)`);
        continue;
      }

      if (t.check) {
        const allPass = res.data.items.every(t.check);
        console.log(`Every item meets filter criteria: ${allPass ? 'PASS' : 'FAIL'}`);
      }
      if (t.sortCheck) {
        let sorted = true;
        for (let i = 1; i < res.data.items.length; i++) {
          if (!t.sortCheck(res.data.items[i-1], res.data.items[i])) {
            sorted = false; break;
          }
        }
        console.log(`Monotonically descending view counts: ${sorted ? 'PASS' : 'FAIL'}`);
      }
    }
  }
})();
