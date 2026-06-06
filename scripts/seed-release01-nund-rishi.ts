import fs from 'fs';
import path from 'path';
import { entityStore } from '../lib/atlas/atlas-entity';

const DATA_DIR = path.join(process.cwd(), '.data');
const RELEASES_FILE = path.join(DATA_DIR, 'cms-releases.json');

const markdownContent = `
# Nund Rishi and the Soul of Kashmir
**Subtitle:** How the founder of the Kashmiri Rishi tradition shaped a civilization through humility, service, and spiritual wisdom.

## 1. The Historical Context
Born in the 14th century, Nund Rishi (also known as Sheikh Noor-ud-Din Wali and Sahazanand) emerged during a critical transition in Kashmir's history. He did not simply adopt existing mystic traditions; he synthesized the ascetic practices of Kashmir Shaivism with the egalitarian and devotional principles of Islam. 

He established the **Rishi Order**, the only indigenous Sufi order in Kashmir, which rejected formal religious dogmatism in favor of strict vegetarianism, environmental conservation, and deep introspection. To this day, he is revered equally by Kashmiri Muslims and Kashmiri Pandits, standing as one of the most enduring symbols of Kashmiriyat.

## 2. Cultural Preservation
Nund Rishi communicated his profound realizations not in elite Persian or Sanskrit, but in the vernacular Kashmiri language through four-line poetic aphorisms known as **Shruks**. 

This release preserves three of his most vital Shruks, rescuing them from oral traditions and fragmented regional manuscripts. By recording these verses with historically accurate instrumentation—featuring the *Rabab*, *Tumbaknari*, and the haunting resonance of the *Kashmiri Santoor*—SufiPulse ensures this acoustic heritage survives in high fidelity for future generations.

## 3. The SufiPulse Interpretation
Many of Nund Rishi's teachings emphasize simplicity, stewardship, restraint, and harmony with the natural world. He famously declared, *"Ann poshi teli yeli wan poshi"* ("Food will last as long as forests last"). Contemporary readers often find these themes strikingly relevant to modern discussions of ecology, sustainability, and ethical living. 

Our production strips away the heavy orchestration typical of modern Sufi pop, opting instead for a raw, acoustic intimacy. We aim to present his verses not simply as historical poetry, but as a living transmission of his ethical and spiritual guidance.

## 4. The Influence Network
To fully grasp the magnitude of Nund Rishi's legacy, one must understand the ecosystem he cultivated. 

* **Predecessors:** His spiritual worldview was profoundly shaped by Lal Ded, the great Shaivite mystic whose verses he memorized. 
* **Contemporaries:** His legacy is often discussed alongside that of Mir Sayyid Ali Hamadani, representing the meeting of indigenous Kashmiri ascetic traditions and wider Persianate Sufi influences.
* **Legacy:** His Rishi Order paved the way for the later development of Kashmiri Sufiyana music, which continues to recite his Shruks in its classical repertoire.

## 5. Legacy Today
Nund Rishi is not merely a figure of historical interest; he remains a living presence in Kashmiri daily life. 

* **The Charari Sharief:** His resting place remains one of the most venerated pilgrimage sites in the region, drawing thousands of seekers across faith lines.
* **Cultural Memory:** His idioms and proverbs have seamlessly woven themselves into everyday Kashmiri vocabulary.
* **Musical Continuation:** Elements of the Rishi tradition continue to survive through Kashmiri devotional music, Sufiyana performances, oral poetry recitations, and community gatherings where Shruks remain part of the living cultural memory of the region.

## 6. Sources & Traditions
Our interpretation and preservation efforts are grounded in the following historic and cultural streams:
* **Primary Texts:** *Rishi Nama* (historical chronicles of the Kashmiri Rishis).
* **Poetic Traditions:** The compilation of Shruks transmitted through the *Sufiyana Kalam* repertoire.
* **Oral Histories:** Inherited accounts passed down by traditional Kashmiri musicians and spiritual custodians.

## 7. The Production
**Original Release Title:** Nund Rishi: The Acoustic Shruks  
**Format:** Studio Session Video & Audio Mastering  
**Vocalist:** [SufiPulse Artist Network]  

This release represents SufiPulse's ongoing effort to document, interpret, and preserve the spiritual, literary, and musical heritage of Kashmir. Through performance, translation, and contextual scholarship, we seek to ensure that the voice of Nund Rishi remains accessible to future generations.
`;

async function run() {
  console.log('🚀 Injecting Release 01: Nund Rishi into CMS...');
  
  const releasesData = fs.readFileSync(RELEASES_FILE, 'utf-8');
  let releases = JSON.parse(releasesData);
  
  const newReleaseId = `rel_${crypto.randomUUID()}`;
  
  const release01 = {
    id: newReleaseId,
    title: 'Nund Rishi and the Soul of Kashmir',
    slug: 'nund-rishi-soul-of-kashmir',
    releaseDate: new Date().toISOString(),
    status: 'published',
    contentReadinessState: 'ready',
    publicCommentary: markdownContent,
    description: "How the founder of the Kashmiri Rishi tradition shaped a civilization through humility, service, and spiritual wisdom.",
    format: 'video',
    releaseType: 'flagship',
    visibility: 'public',
    enableLyrics: true,
    enableCommentary: true,
    enableSponsors: true,
    enableAdoption: true,
    enableCredits: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Prevent duplicate insertion
  const existingIndex = releases.findIndex((r: any) => r.slug === 'nund-rishi-soul-of-kashmir');
  if (existingIndex > -1) {
    releases[existingIndex] = { ...releases[existingIndex], ...release01 };
    console.log('✅ Updated existing Release 01 in CMS.');
  } else {
    releases.push(release01);
    console.log('✅ Inserted Release 01 into CMS.');
  }

  // Save via atomic rename pattern
  const tempPath = `${RELEASES_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(releases, null, 2));
  fs.renameSync(tempPath, RELEASES_FILE);

  // Link to Nund Rishi entity in Atlas
  const nundEntity = entityStore.findBySlug('nund-rishi');
  if (nundEntity) {
    const currentReleases = new Set(nundEntity.connectedReleaseIds || []);
    currentReleases.add(newReleaseId);
    
    entityStore.update(nundEntity.id, {
      connectedReleaseIds: Array.from(currentReleases)
    });
    console.log('✅ Connected Release 01 to Atlas Entity: Nund Rishi.');
  } else {
    console.log('⚠️ Could not find Nund Rishi in Atlas Entity Store.');
  }
  
  console.log('🎉 Release 01 injection complete!');
}

run().catch(console.error);
