const fs = require('fs');
const crypto = require('crypto');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Migrate existing vocalists schema
for (let v of vocalists) {
    if (v.lead_song_count === undefined) v.lead_song_count = v.legacy_appearances || 0;
    if (v.total_song_count === undefined) v.total_song_count = v.legacy_appearances || 0;
}

function processVocalists(leadStr, bgStr, ytId) {
    let leads = (leadStr && leadStr !== 'Not yet supplied/verified') ? leadStr.split(',').map(s => s.trim()).filter(s => s) : [];
    let bgs = (bgStr && bgStr !== 'Not yet supplied/verified') ? bgStr.split(',').map(s => s.trim()).filter(s => s) : [];
    
    // Process Leads
    for (let name of leads) {
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
        
        // We only increment if this is a NEW distinct song we are processing.
        // Since we are applying this incrementally per request, we assume we increment here.
        // Wait, for 15, leads were ALREADY counted previously. I should NOT increment leads for 15 again.
        // But for 20, leads are NEW.
        // How to handle? I'll pass a flag.
    }
}

// Track 15 Updates (already had leads counted, just add BG)
let bgs15 = 'Ethan Brooks, Jonathan Hale, Caleb Morgan, Lucas Whitman, Nathan Cole, Aaron Mitchell, Samuel Reed, Matthew Clarke, Hamza Ali, Bilal Khan, Saad Hussain, Umar Farooq, Latif';
let bgArray15 = bgs15.split(',').map(s => s.trim()).filter(s => s);
for (let name of bgArray15) {
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
    // They are background only on this track, so increment total_song_count
    v.total_song_count += 1;
}

let r15 = releases.find(x => x.youtubeId === 'aMzdiIuYgK4');
if (r15) {
    if (!r15.publicCredits.artistic) r15.publicCredits.artistic = {};
    r15.publicCredits.artistic.backgroundVocals = bgs15;
}

// Track 20 Updates (New Release)
let leads20 = ['Hamza Ali', 'Ahsan Raza'];
let bgs20 = ['Bilal Ahmed', 'Usman Tariq', 'Saad Hussain', 'Zain ul Abideen', 'Fahad Mahmood', 'Rehan Qureshi', 'Noman Siddiqui', 'Arsalan Khan'];
let allVocals20 = new Set([...leads20, ...bgs20]);

for (let name of allVocals20) {
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
    
    // Increment total song count once
    v.total_song_count += 1;
    // If they are lead, increment lead song count
    if (leads20.includes(name)) {
        v.lead_song_count += 1;
    }
}

// Update Release 20
let r20 = releases.find(x => x.youtubeId === 'QkGzXGrEllo');
if (r20) {
    r20.canonicalTitle = 'Haji Naam Mila, Par Badla Kya? | The Journey Ended. Did the Ego? | SufiPulse USA';
    
    if (!r20.publicCredits) r20.publicCredits = {};
    if (!r20.publicCredits.artistic) r20.publicCredits.artistic = {};
    if (!r20.publicCredits.production) r20.publicCredits.production = {};
    if (!r20.publicCredits.visual) r20.publicCredits.visual = {};
    if (!r20.publicCredits.literary) r20.publicCredits.literary = {};

    r20.publicCredits.artistic.lyricist = 'Dr. Zarf-e-Noori';
    r20.publicCredits.artistic.composer = 'Dr. Zarf-e-Noori';
    r20.publicCredits.artistic.musicProducer = 'Dr. Zarf-e-Noori';
    r20.publicCredits.artistic.leadVocalist = leads20.join(', ');
    r20.publicCredits.artistic.backgroundVocals = bgs20.join(', ');

    r20.publicCredits.production.recordedAt = 'SufiPulse Studio';
    r20.publicCredits.production.recordingEngineer = 'Lucas Ray, Michael "SufiPulse" Hartman';
    r20.publicCredits.production.mixMaster = 'Ryan Cole, Elijah James';
    r20.publicCredits.production.soundDesign = 'Elijah James';
    r20.publicCredits.production.productionSupervision = 'SufiPulse Studio USA';

    r20.publicCredits.visual.videoDirection = 'SufiPulse Visuals';
    r20.publicCredits.visual.editing = 'SufiPulse Media Team';
    r20.publicCredits.visual.thumbnailDesign = 'SufiPulse Design Team';
    r20.publicCredits.visual.artwork = 'SufiPulse Design Team';

    r20.publicCredits.literary.romanTransliteration = 'SufiPulse Editorial';
    r20.publicCredits.literary.englishTranslation = 'Literary Committee';
    r20.publicCredits.literary.thematicInterpretation = 'Literary Committee';
    r20.publicCredits.literary.proofreading = 'SufiPulse Editorial';

    if (!r20.releaseRights) r20.releaseRights = {};
    r20.releaseRights.publishedBy = 'SufiPulse USA';
    r20.releaseRights.platform = 'SufiTube';
    r20.releaseRights.copyrightHolder = 'SufiPulse USA';
    r20.releaseRights.licensingPermissions = 'Standard SufiPulse License';
    
    if (!r20.releaseRights.registeredReleaseId && !r20.registeredReleaseId) {
        let year = r20.releaseDate ? r20.releaseDate.substring(0, 4) : '2026';
        r20.releaseRights.registeredReleaseId = `SP-KS-${year}-020`;
    }
}

fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
console.log('Processed new rules, updated release 15 & 20');
