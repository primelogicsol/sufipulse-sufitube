const fs = require('fs');
const crypto = require('crypto');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let bgs = ['Hamza Kareem', 'Yusuf Anwar', 'Bilal Sadiq', 'Rayan Faheem', 'Zuhair Qasim', 'Dr. Zarf-e-Noori'];

for (let name of bgs) {
    let v = vocalists.find(x => x.public_name === name);
    if (!v) {
        v = {
            id: 'vocalists_' + crypto.randomUUID(),
            public_name: name,
            stage_name: name,
            public_name_type: 'STAGE_NAME',
            contributor_role: 'VOCALIST',
            identity_type: name === 'Dr. Zarf-e-Noori' ? 'PRIMARY_CREATOR' : 'STUDIO_PSEUDONYM',
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

let r = releases.find(x => x.youtubeId === 'lMxb4Dk-n0Y');
if (r) {
    r.canonicalTitle = 'Ya Dost | Asma Se Qalb Tak | Divine Names & Responsibility | SufiPulse USA';
    
    if (!r.publicCredits) r.publicCredits = {};
    if (!r.publicCredits.artistic) r.publicCredits.artistic = {};
    r.publicCredits.artistic.leadVocalist = 'Ibrahim Ziya, Amina Noor, Faizan Rahim';
    r.publicCredits.artistic.backgroundVocals = bgs.join(', ');

    fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
    fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
    console.log('RELEASE FOUND AND PATCHED');
} else {
    console.log('RELEASE NOT FOUND');
}
