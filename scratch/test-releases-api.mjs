async function testReleases() {
  const url = 'http://localhost:3000/api/releases?status=published';
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const body = await res.json();
    if (res.ok) {
      console.log(`Success! Count: ${body.count}, Items: ${body.items?.length}`);
    } else {
      console.error('Error Body:', JSON.stringify(body, null, 2));
    }
  } catch (err) {
    console.error('Fetch Failed:', err.message);
  }
}

testReleases();
