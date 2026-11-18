import fs from 'fs';
const words1 = JSON.parse(fs.readFileSync('scripts/words_24_31.json', 'utf8'));
const words2 = JSON.parse(fs.readFileSync('scripts/words_52_54.json', 'utf8'));

console.log('=== WORDS 100s - 126s ===');
words1.forEach(w => console.log(`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.word}`));

console.log('\n=== WORDS 185s - 200s ===');
words2.forEach(w => console.log(`[${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s] ${w.word}`));
