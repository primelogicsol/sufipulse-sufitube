const fs = require('fs');
const crypto = require('crypto');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let leads21 = ['Ahsan Rizvi', 'Faizan Qureshi', 'Salman Ansari', 'Imran Siddiqui'];
let bgs21 = ['Arif Khan', 'Naveed Akhtar', 'Shahid Alam', 'Zeeshan Ali', 'Mohsin Raza', 'Irfan Mahmood', 'Yusuf Ashraf', 'Bilal Farooqi'];
let allVocals21 = new Set([...leads21, ...bgs21]);

for (let name of allVocals21) {
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
    if (leads21.includes(name)) {
        v.lead_song_count += 1;
    }
}

// Update Release 21
let r21 = releases.find(x => x.youtubeId === 'FelED4DBHCk');
if (r21) {
    r21.canonicalTitle = 'Zair-o-Zabar ka Jalwa | Qira’at-e-Qur’an That Outlived the Fire | SufiPulse USA';
    
    if (!r21.publicCredits) r21.publicCredits = {};
    if (!r21.publicCredits.artistic) r21.publicCredits.artistic = {};
    if (!r21.publicCredits.production) r21.publicCredits.production = {};
    if (!r21.publicCredits.visual) r21.publicCredits.visual = {};
    if (!r21.publicCredits.literary) r21.publicCredits.literary = {};

    r21.publicCredits.artistic.lyricist = 'Dr. Zarf-e-Noori';
    r21.publicCredits.artistic.composer = 'Dr. Zarf-e-Noori';
    r21.publicCredits.artistic.musicProducer = 'Dr. Zarf-e-Noori';
    r21.publicCredits.artistic.leadVocalist = leads21.join(', ');
    r21.publicCredits.artistic.backgroundVocals = bgs21.join(', ');

    r21.publicCredits.production.recordedAt = 'SufiPulse Studio';
    r21.publicCredits.production.recordingEngineer = 'Lucas Ray, Michael "SufiPulse" Hartman';
    r21.publicCredits.production.mixMaster = 'Ryan Cole, Elijah James';
    r21.publicCredits.production.soundDesign = 'Elijah James';
    r21.publicCredits.production.productionSupervision = 'SufiPulse Studio USA';

    r21.publicCredits.visual.videoDirection = 'SufiPulse Visuals';
    r21.publicCredits.visual.editing = 'SufiPulse Media Team';
    r21.publicCredits.visual.thumbnailDesign = 'SufiPulse Design Team';
    r21.publicCredits.visual.artwork = 'SufiPulse Design Team';

    r21.publicCredits.literary.romanTransliteration = 'SufiPulse Editorial';
    r21.publicCredits.literary.englishTranslation = 'Literary Committee';
    r21.publicCredits.literary.thematicInterpretation = 'Literary Committee';
    r21.publicCredits.literary.proofreading = 'SufiPulse Editorial';

    if (!r21.releaseRights) r21.releaseRights = {};
    r21.releaseRights.publishedBy = 'SufiPulse USA';
    r21.releaseRights.platform = 'SufiTube';
    r21.releaseRights.copyrightHolder = 'SufiPulse USA';
    r21.releaseRights.licensingPermissions = 'Standard SufiPulse License';
    
    if (!r21.releaseRights.registeredReleaseId && !r21.registeredReleaseId) {
        r21.releaseRights.registeredReleaseId = `SP-KS-2026-021`;
    }
    
    r21.releaseDate = '2026-01-05';
    r21.releaseRights.releaseDate = '2026-01-05';

    fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
    fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
    console.log('RELEASE FOUND AND PATCHED');
} else {
    console.log('RELEASE NOT FOUND');
}
