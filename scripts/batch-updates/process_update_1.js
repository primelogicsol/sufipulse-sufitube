const fs = require('fs');
const crypto = require('crypto');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Only process the new background vocals to increment counts
let bgs = ['Hamza Siddiqui', 'Bilal Farooqi', 'Danish Farooqi', 'Usman Nizami', 'Adnan Sohail', 'Tariq Madani', 'Mahnoor Farooqi', 'Saad Hashmi', 'Dr. Zarf-e-Noori'];

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
    
    // Increment total song count once
    v.total_song_count += 1;
}

// Update Release 1
let r = releases.find(x => x.youtubeId === 'Dbd0fhJty4A');
if (r) {
    // Make sure we use the user's provided exact string for the title and leads
    r.canonicalTitle = 'Ik Khamoshi, Tu Aur Main | Ishq • Fanā • Baqā | SufiPulse USA';
    
    if (!r.publicCredits) r.publicCredits = {};
    if (!r.publicCredits.artistic) r.publicCredits.artistic = {};
    // User requested "Ayaan Qadri, Raza Mehboob Chishti, Zarif Ali"
    // even though we merged Zarif Ali to Zarif Ali Shah in the registry. 
    // We will reflect the text provided.
    r.publicCredits.artistic.leadVocalist = 'Ayaan Qadri, Raza Mehboob Chishti, Zarif Ali';
    r.publicCredits.artistic.backgroundVocals = bgs.join(', ');

    fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
    fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
    console.log('RELEASE FOUND AND PATCHED');
} else {
    console.log('RELEASE NOT FOUND');
}
