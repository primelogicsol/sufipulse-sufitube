const fs = require('fs');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// The new BG vocals added for track 3
let bgs = ['Saif Kareem', 'Naveer Aslam', 'Zohair Nadeem'];

// We know Zohair Nadeem was already counted for this track when we did leads earlier.
// So we only increment total_song_count for Saif Kareem and Naveer Aslam.
let toIncrement = ['Saif Kareem', 'Naveer Aslam'];

for (let name of toIncrement) {
    let v = vocalists.find(x => x.public_name === name);
    if (!v) {
        console.log('Error: expected to find', name, 'in registry.');
    } else {
        v.total_song_count = (v.total_song_count || 0) + 1;
    }
}
fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');

// Update Release 3
let r3 = releases.find(x => x.youtubeId === 'sPOY59RAkAU');
if (r3) {
    if (!r3.publicCredits.artistic) r3.publicCredits.artistic = {};
    r3.publicCredits.artistic.backgroundVocals = 'Saif Kareem, Naveer Aslam, Zohair Nadeem';

    fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
    console.log('RELEASE FOUND AND PATCHED');
} else {
    console.log('RELEASE NOT FOUND');
}
