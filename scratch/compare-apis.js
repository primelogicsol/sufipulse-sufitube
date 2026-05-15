
async function compareAPIs() {
  const localUrl = 'http://localhost:3000/api/releases?status=published';
  const prodUrl = 'https://sufipulse.com/api/releases?status=published';
  const idsToCheck = ['q58mRXIsi-Y', 'wMxWfsst48Q', 'LjmOxu1AVAg'];

  try {
    console.log('Fetching local data...');
    const localRes = await fetch(localUrl);
    const localData = await localRes.json();
    const localItems = Array.isArray(localData) ? localData : (localData.items || []);

    console.log('Fetching production data...');
    const prodRes = await fetch(prodUrl);
    const prodData = await prodRes.json();
    const prodItems = Array.isArray(prodData) ? prodData : (prodData.items || []);

    console.log('\n--- Counts ---');
    console.log(`Local Published Count: ${localItems.length}`);
    console.log(`Prod Published Count: ${prodItems.length}`);
    
    const pageSize = 12;
    console.log(`Page Size: ${pageSize}`);
    console.log(`Local Expected Pages: ${Math.ceil(localItems.length / pageSize)}`);
    console.log(`Prod Expected Pages: ${Math.ceil(prodItems.length / pageSize)}`);

    console.log('\n--- ID Check ---');
    idsToCheck.forEach(id => {
      const localFound = localItems.find(r => (r.youtubeId || r.id || '').includes(id));
      const prodFound = prodItems.find(r => (r.youtubeId || r.id || '').includes(id));
      console.log(`ID: ${id}`);
      console.log(`  Local: ${localFound ? 'Found (' + localFound.title + ')' : 'NOT FOUND'}`);
      console.log(`  Prod:  ${prodFound ? 'Found (' + prodFound.title + ')' : 'NOT FOUND'}`);
    });

    console.log('\n--- Local Top 5 ---');
    localItems.slice(0, 5).forEach((r, i) => console.log(`${i+1}. ${r.title} [${r.publishedAt || r.releaseDate}]` || 'Untitled'));

    console.log('\n--- Prod Top 5 ---');
    prodItems.slice(0, 5).forEach((r, i) => console.log(`${i+1}. ${r.title} [${r.publishedAt || r.releaseDate}]` || 'Untitled'));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

compareAPIs();
