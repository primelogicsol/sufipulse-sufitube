const fs = require('fs');
const crypto = require('crypto');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// helper to add/increment vocals
function processVocals(names, isLead) {
    for (let name of names) {
        if (name === 'Pending' || !name) continue;
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
        if (isLead) v.lead_song_count += 1;
    }
}

// Track 8 Updates
let bgs8 = ['Hamza Rafiq', 'Bilal Kareem', 'Danish Farooqi', 'Rayan Siddiqui', 'Faizan Malik', 'Taha Mir', 'Saad Hashmi', 'Dr. Zarf-e-Noori'];
processVocals(bgs8, false);

let r8 = releases.find(x => x.youtubeId === 'q58mRXIsi-Y');
if (r8) {
    if (!r8.publicCredits) r8.publicCredits = {};
    if (!r8.publicCredits.artistic) r8.publicCredits.artistic = {};
    r8.publicCredits.artistic.backgroundVocals = bgs8.join(', ');
} else {
    console.log('TRACK 8 NOT FOUND');
}

// Track 22 Updates
let leads22 = ['Rashid Khan', 'Junaid Khan', 'Saad bin Imran Ansari', 'Ahmad Rizvi'];
let bgs22 = ['Bilal Chishti', 'Irfan Ali', 'Tariq Ansar', 'Sameer Madani', 'Noman Raza', 'Saifullah'];
processVocals(leads22, true);
processVocals(bgs22, false);

let r22 = releases.find(x => x.youtubeId === 'k0D188oBZ1Y');
if (!r22) {
    // Some might not be in DB yet if they were never synced
    // But we'll try to patch if found
    console.log('TRACK 22 NOT FOUND in DB');
} else {
    r22.canonicalTitle = 'Khwaja Mere Khwaja | A Devotional Adaptation | SufiPulse USA';
    
    if (!r22.publicCredits) r22.publicCredits = {};
    if (!r22.publicCredits.artistic) r22.publicCredits.artistic = {};
    if (!r22.publicCredits.production) r22.publicCredits.production = {};
    if (!r22.publicCredits.visual) r22.publicCredits.visual = {};
    if (!r22.publicCredits.literary) r22.publicCredits.literary = {};

    r22.publicCredits.artistic.lyricist = 'Dr. Zarf-e-Noori';
    r22.publicCredits.artistic.composer = 'Dr. Zarf-e-Noori';
    r22.publicCredits.artistic.musicProducer = 'Dr. Zarf-e-Noori';
    r22.publicCredits.artistic.leadVocalist = leads22.join(', ');
    r22.publicCredits.artistic.backgroundVocals = bgs22.join(', ');

    r22.publicCredits.production.recordedAt = 'SufiPulse Studio';
    r22.publicCredits.production.recordingEngineer = 'Lucas Ray, Michael "SufiPulse" Hartman';
    r22.publicCredits.production.mixMaster = 'Ryan Cole, Elijah James';
    r22.publicCredits.production.soundDesign = 'Elijah James';
    r22.publicCredits.production.productionSupervision = 'SufiPulse Studio USA';

    r22.publicCredits.visual.videoDirection = 'SufiPulse Visuals';
    r22.publicCredits.visual.editing = 'SufiPulse Media Team';
    r22.publicCredits.visual.thumbnailDesign = 'SufiPulse Design Team';
    r22.publicCredits.visual.artwork = 'SufiPulse Design Team';

    r22.publicCredits.literary.romanTransliteration = 'SufiPulse Editorial';
    r22.publicCredits.literary.englishTranslation = 'Literary Committee';
    r22.publicCredits.literary.thematicInterpretation = 'Literary Committee';
    r22.publicCredits.literary.proofreading = 'SufiPulse Editorial';

    if (!r22.releaseRights) r22.releaseRights = {};
    r22.releaseRights.publishedBy = 'SufiPulse USA';
    r22.releaseRights.platform = 'SufiTube';
    r22.releaseRights.copyrightHolder = 'SufiPulse USA';
    r22.releaseRights.licensingPermissions = 'Standard SufiPulse License';
    
    if (!r22.releaseRights.registeredReleaseId && !r22.registeredReleaseId) {
        let year = r22.releaseDate ? r22.releaseDate.substring(0, 4) : '2026';
        r22.releaseRights.registeredReleaseId = `SP-KS-${year}-022`;
    }
}

fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
console.log('BATCH PROCESSED');
