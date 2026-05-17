async function test() {
  const urls = [
    'http://localhost:3001/',
    'http://localhost:3001/api/stats',
    'http://localhost:3001/api/releases?status=published&limit=8',
    'http://localhost:3001/api/auth/me'
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      console.log(`${url} -> ${res.status} ${res.statusText}`);
    } catch (e) {
      console.error(`${url} -> FAILED: ${e.message}`);
    }
  }
}

test();
