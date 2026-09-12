const fs = require('fs');
const crypto = require('crypto');

const VOCALISTS_FILE = '.data/vocalists.json';
let vocalists = JSON.parse(fs.readFileSync(VOCALISTS_FILE, 'utf8'));

const DATA_FILE = '.data/cms-releases.json';
let releases = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

let leads23 = ['Armaan Qadri', 'Sameer Nizami', 'Yusuf Rahmani'];
let bgs23 = ['Zayan Raza', 'Nisar Farooqi'];
let allVocals23 = new Set([...leads23, ...bgs23]);

for (let name of allVocals23) {
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
    if (leads23.includes(name)) {
        v.lead_song_count += 1;
    }
}

// Update Release 23
let r23 = releases.find(x => x.youtubeId === 'XPaJu3lHd5Y');
if (r23) {
    r23.canonicalTitle = 'Ye Lakeerein Nahi | Lauh-e-Mehfooz Ki Tahrirein | SufiPulse USA';
    
    if (!r23.publicCredits) r23.publicCredits = {};
    if (!r23.publicCredits.artistic) r23.publicCredits.artistic = {};
    if (!r23.publicCredits.production) r23.publicCredits.production = {};
    if (!r23.publicCredits.visual) r23.publicCredits.visual = {};
    if (!r23.publicCredits.literary) r23.publicCredits.literary = {};

    r23.publicCredits.artistic.lyricist = 'Dr. Zarf-e-Noori';
    r23.publicCredits.artistic.composer = 'Dr. Zarf-e-Noori';
    r23.publicCredits.artistic.musicProducer = 'Dr. Zarf-e-Noori';
    r23.publicCredits.artistic.leadVocalist = leads23.join(', ');
    r23.publicCredits.artistic.backgroundVocals = bgs23.join(', ');

    r23.publicCredits.production.recordedAt = 'SufiPulse Studio';
    r23.publicCredits.production.recordingEngineer = 'Lucas Ray, Michael "SufiPulse" Hartman';
    r23.publicCredits.production.mixMaster = 'Ryan Cole, Elijah James';
    r23.publicCredits.production.soundDesign = 'Elijah James';
    r23.publicCredits.production.productionSupervision = 'SufiPulse Studio USA';

    r23.publicCredits.visual.videoDirection = 'SufiPulse Visuals';
    r23.publicCredits.visual.editing = 'SufiPulse Media Team';
    r23.publicCredits.visual.thumbnailDesign = 'SufiPulse Design Team';
    r23.publicCredits.visual.artwork = 'SufiPulse Design Team';

    r23.publicCredits.literary.romanTransliteration = 'SufiPulse Editorial';
    r23.publicCredits.literary.englishTranslation = 'Literary Committee';
    r23.publicCredits.literary.thematicInterpretation = 'Literary Committee';
    r23.publicCredits.literary.proofreading = 'SufiPulse Editorial';

    if (!r23.releaseRights) r23.releaseRights = {};
    r23.releaseRights.publishedBy = 'SufiPulse USA';
    r23.releaseRights.platform = 'SufiTube';
    r23.releaseRights.copyrightHolder = 'SufiPulse USA';
    r23.releaseRights.licensingPermissions = 'Standard SufiPulse License';
    
    if (!r23.releaseRights.registeredReleaseId && !r23.registeredReleaseId) {
        let year = r23.releaseDate ? r23.releaseDate.substring(0, 4) : '2026';
        r23.releaseRights.registeredReleaseId = `SP-KS-${year}-023`;
    }

    fs.writeFileSync(VOCALISTS_FILE, JSON.stringify(vocalists, null, 2), 'utf8');
    fs.writeFileSync(DATA_FILE, JSON.stringify(releases, null, 2), 'utf8');
    console.log('RELEASE FOUND AND PATCHED');
} else {
    console.log('RELEASE NOT FOUND');
}
