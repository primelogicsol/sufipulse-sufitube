import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'vocalists.json');

const VOCALISTS = [
  "Ayaan Idrisi", "Rahil Qureshi", "Ibrahim Nouri", "Hamza Kareem", "Faris Malik", 
  "Omar Hadi", "Zayan Rafi", "Zohair Nadeem", "Saif Kareem", "Naveer Aslam", 
  "Armaan Qadri", "Sameer Nizami", "Yusuf Rahmani", "Ayaan Mir", "Rahib Dar", 
  "Nisar Farooqi", "Fahad Zameer", "Zayan Raza", "Meher Gulzar"
];

const HISTORICAL_NOTES: Record<string, string> = {
  "Ayaan Idrisi": "steady, composed vocal character",
  "Rahil Qureshi": "soft, reflective, gentle",
  "Ibrahim Nouri": "CATALOG REVIEW REQUIRED",
  "Zayan Rafi": "soft, calm, grounded",
  "Zohair Nadeem": "higher-pitched, expressive",
  "Armaan Qadri": "steady, devotional, clear, strong, deep, emotional",
  "Sameer Nizami": "smooth, graceful transitions",
  "Yusuf Rahmani": "deep, resonant, mystical, calm"
};

function readExisting(): any[] {
  if (!fs.existsSync(FILE_PATH)) return [];
  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf8');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : (Object.keys(parsed).length > 0 ? [parsed] : []);
  } catch (e) {
    return [];
  }
}

function generateId(): string {
  return `vocalists_${crypto.randomUUID()}`;
}

async function seed() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let existing = readExisting();
  let added = 0;
  let reused = 0;

  for (const name of VOCALISTS) {
    let match = existing.find(v => v.public_name === name || v.stage_name === name);
    if (match) {
      match.legacy_appearances = (match.legacy_appearances || 0) + 1;
      reused++;
      continue;
    }

    const newVocalist = {
      id: generateId(),
      public_name: name,
      stage_name: name,
      public_name_type: 'STAGE_NAME',
      contributor_role: 'VOCALIST',
      identity_type: 'STUDIO_PSEUDONYM',
      managed_by: 'SufiPulse Studio USA',
      profile_status: 'approved_as_vocalist',
      contributor_status: 'ACTIVE',
      catalog_assignment: 'PENDING_LEGACY_MAPPING',
      legacy_appearances: 1,
      performance_character: HISTORICAL_NOTES[name] || null,
      joined_at: new Date('2025-05-20T00:00:00Z').toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email: 'Internal Workflow'
    };

    existing.push(newVocalist);
    added++;
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(existing, null, 2), 'utf8');
  console.log(`Seeding complete. Added: ${added}, Reused: ${reused}`);
}

seed().catch(console.error);
