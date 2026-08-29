const http = require('http');

http.get('http://localhost:3005/api/releases?page=1&pageSize=20&sort=newest', (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const items = JSON.parse(body).items;
    console.log('website title | youtubeId | effectiveDate | YouTube publishedAt');
    console.log('------------------------------------------------------------------');
    items.forEach(i => {
      const eff = (i.governanceOrigin === 'native_governed') ? (i.publishedAt || i.releaseDate || i.createdAt) : (i.releaseDate || i.publishedAt || i.createdAt);
      console.log(`${(i.title || i.canonicalTitle).substring(0, 35).padEnd(35)} | ${i.youtubeId || 'null'} | ${eff?.substring(0,10)} | ${i.publishedAt?.substring(0,10) || 'N/A'}`);
    });
  });
});
