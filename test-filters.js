const http = require('http');

const testEndpoint = (path) => new Promise((resolve) => {
  http.get('http://localhost:3005' + path, (res) => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      resolve({ status: res.statusCode, path, items: JSON.parse(body).items?.length || 0 });
    });
  }).on('error', (e) => resolve({ status: 'ERROR', error: e.message }));
});

(async () => {
  console.log(await testEndpoint('/api/releases?limit=12'));
  console.log(await testEndpoint('/api/releases?limit=12&sort=newest'));
  console.log(await testEndpoint('/api/releases?limit=12&format=video'));
  console.log(await testEndpoint('/api/releases?limit=12&year=2026'));
  console.log(await testEndpoint('/api/releases?limit=12&governanceOrigin=native_governed'));
})();
