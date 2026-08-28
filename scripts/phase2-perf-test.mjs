import fs from 'fs';

async function measure(url, runs = 100) {
  const times = [];
  // Warm up
  for (let i = 0; i < 5; i++) {
    await fetch(url).catch(() => {});
  }
  
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    try {
      const res = await fetch(url);
      await res.text();
    } catch (e) {
      console.error(e.message);
    }
    times.push(performance.now() - start);
  }
  
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(runs * 0.5)];
  const p95 = times[Math.floor(runs * 0.95)];
  const max = times[times.length - 1];
  
  return { p50, p95, max };
}

async function run() {
  const routes = [
    'http://localhost:3005/',
    'http://localhost:3005/releases',
    'http://localhost:3005/writers',
    'http://localhost:3005/vocalists',
    'http://localhost:3005/studio'
  ];
  
  console.log(`=== Performance Test (${process.env.RELEASE_STORAGE_BACKEND || 'filesystem'}) ===`);
  for (const url of routes) {
    try {
      const res = await measure(url, 30);
      console.log(`Route: ${url}`);
      console.log(`  p50: ${res.p50.toFixed(2)} ms`);
      console.log(`  p95: ${res.p95.toFixed(2)} ms`);
      console.log(`  Max: ${res.max.toFixed(2)} ms`);
    } catch (e) {
      console.error(`Route ${url} failed: ${e.message}`);
    }
  }
}

run();
