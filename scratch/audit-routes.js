async function test() {
  const paths = [
    '/',
    '/writers',
    '/writers/apply',
    '/vocalists',
    '/vocalists/apply',
    '/producers',
    '/producers/apply',
    '/login',
    '/api/stats'
  ];

  for (const path of paths) {
    try {
      const res = await fetch(`http://localhost:3001${path}`);
      console.log(`${path} -> ${res.status} ${res.statusText}`);
    } catch (e) {
      console.error(`${path} -> FAILED: ${e.message}`);
    }
  }
}

test();
