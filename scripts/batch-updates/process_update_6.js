const fs = require('fs');
const crypto = require('crypto');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let bgs = ['Ubaid Mir', 'Aarif Yaseen', 'Shayan Qadri', 'Saifuddin'];

for (let name of bgs) {
    let v = vocalists.find(x => x.public_name === name);
    if (!v) {
        v = {
            id: 'vocalists_' + crypto.randomUUID(),
            public_name: name,
            stage_name: name,
            public_name_type: 'STAGE_NAME',
            contributor_role: 'VOCALIST',
            identity_type: 'STUDIO_PSEUDONYM',
            managed_by: 'SufiPulse Studio USA',
            profile_status: 'approved_as_vocalist',
            contributor_status: 'ACTIVE',
            catalog_assignment: 'PENDING_LEGACY_MAPPING',
            lead_song_count: 0,
            total_song_count: 0,
            joined_at: new Date('2025-05-20T00:00:00Z').toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email: 'Internal Workflow'
        };
        vocalists.push(v);
    }
    v.total_song_count += 1;
}

let r = releases.find(x => x.youtubeId === 'jChUc58CZyw');
if (r) {
    r.canonicalTitle = 'Main Habba Hoon | Aaj Ke Habba Hoon';
    
    if (!r.publicCredits) r.publicCredits = {};
    if (!r.publicCredits.artistic) r.publicCredits.artistic = {};
    
    // Explicitly apply the requested authorship exception
    r.publicCredits.artistic.lyricist = 'Dr. Zeenat Ara (Co-Writer / Lyricist), Dr. Zarf-e-Noori (Co-Writer / Lyrics & Concept)';
    r.publicCredits.artistic.composer = 'Dr. Zarf-e-Noori';
    r.publicCredits.artistic.musicProducer = 'Dr. Zarf-e-Noori';
    
    r.publicCredits.artistic.leadVocalist = 'Zeeshan Mehmood, Hamad Fakir, Tariq Zameer';
    r.publicCredits.artistic.backgroundVocals = bgs.join(', ');

    fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
    fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
    console.log('RELEASE FOUND AND PATCHED');
} else {
    console.log('RELEASE NOT FOUND');
}
