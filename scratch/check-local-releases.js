
async function checkReleases() {
  const ids = ['q58mRXIsi-Y', 'wMxWfsst48Q', 'LjmOxu1AVAg'];
  try {
    const res = await fetch('http://localhost:3000/api/releases?status=published');
    const data = await res.json();
    
    const top = data.slice(0, 10).map(r => ({
      id: r.id,
      title: r.title,
      publishedAt: r.publishedAt,
      releaseDate: r.releaseDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
    
    console.log('--- Top 10 Local ---');
    console.log(JSON.stringify(top, null, 2));
    
    console.log('\n--- ID Check ---');
    ids.forEach(id => {
      const found = data.find(r => r.id && r.id.includes(id));
      console.log(`${id}: ${found ? 'Found (' + found.title + ')' : 'Not Found'}`);
      if (found) {
        console.log(JSON.stringify({
          id: found.id,
          title: found.title,
          publishedAt: found.publishedAt,
          releaseDate: found.releaseDate,
          createdAt: found.createdAt,
          updatedAt: found.updatedAt
        }, null, 2));
      }
    });
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

checkReleases();
