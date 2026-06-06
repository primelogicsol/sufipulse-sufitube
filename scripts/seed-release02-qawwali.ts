import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { entityStore } from '../lib/atlas/atlas-entity';

const DATA_DIR = path.join(process.cwd(), '.data');
const RELEASES_FILE = path.join(DATA_DIR, 'cms-releases.json');

const markdownContent = `
# Release Intelligence: Qawwali: The Sound of Devotional Ecstasy

**Subtitle:** The 700-year journey of South Asian devotional music from the courtyards of the Chishti saints to the global stage.

## 1. What is Qawwali?

Qawwali is not merely a genre of music; it is an acoustic vehicle for divine communion. Rooted deeply in the Sufi concept of *Sama* (spiritual listening), Qawwali is the energetic, rhythmic, and chorus-driven devotional music of South Asia. The word itself derives from the Arabic word *Qaul* (utterance or saying), referring to the sayings of the Prophet Muhammad and the Sufi saints. To perform Qawwali is to repeat the divine word until the barrier between the listener and the Creator dissolves.

## 2. Who Created It? The Genius of Amir Khusrau

The genesis of Qawwali is inextricably tied to the **Chishti Order** of Sufism, which flourished in the Indian subcontinent. Its invention is widely credited to **Amir Khusrau** (1253–1325), the legendary polymath, poet, musician, and devoted disciple of the great saint Nizamuddin Auliya. 

Khusrau achieved something monumental: a profound linguistic and musical synthesis. He composed in classical Persian while simultaneously embracing the vernacular *Hindavi* (the precursor to Urdu and Hindi), bridging the gap between the elite courts and the rural masses. By integrating the complex, structured ragas of Hindustani classical music with the philosophical depth of Persian, Arabic, and Turkic Sufi poetry, Khusrau laid the foundational musical innovations that would become modern Qawwali.

## 3. How Does It Work? The Mechanics of Sama

A Qawwali performance is a meticulously structured ascent into spiritual ecstasy (*wajd*). It operates on several core mechanics:
* **The Structure:** A traditional session begins with a *Hamd* (praise of God), transitions into a *Naat* (praise of the Prophet), moves through a *Manqabat* (praise of saints like Ali or the Chishtis), and culminates in a *Ghazal* or *Kafi* expressing the agony and ecstasy of divine love.
* **Repetition & Rhythm:** The relentless, driving rhythm of the *Tabla* or *Dholak*, combined with rhythmic hand-clapping, induces a trance-like state. 
* **Call and Response:** A lead vocalist introduces a melodic and poetic line, which is then forcefully repeated by a chorus (*humnawa*). This repetition builds sonic pressure, forcing the listener's focus entirely onto the meaning of the verse.

## 4. Why Millions Listen to Qawwali

When listeners search for the "best Qawwali songs" or "famous Qawwali singers," they are often seeking an experience that transcends casual listening. Millions are drawn to Qawwali for its raw emotional intensity and expressions of spiritual longing. Whether experienced in a crowded shrine (*dargah*) or through a digital recording, Qawwali is fundamentally a communal experience. The live performance, characterized by soaring vocal improvisation and relentless rhythm, invites the listener to abandon their ego and participate in collective remembrance.

## 5. Who Made It Global?

For centuries, Qawwali remained primarily confined to the shrines and courtyards of South Asia. In the late 20th century, a handful of monumental voices carried it to the world:
* **Nusrat Fateh Ali Khan:** The undisputed *Shahenshah-e-Qawwali* (King of Kings of Qawwali). Through landmark collaborations—most notably the 1990 fusion album *Mustt Mustt*—he introduced Qawwali to Western pop and world music audiences, proving that the emotional weight of the music transcended language barriers.
* **The Sabri Brothers:** Pioneers who brought a robust, chorus-driven power to international stages, immortalizing tracks like *Tajdar-e-Haram*.
* **Abida Parveen & Rahat Fateh Ali Khan:** Modern masters who continue to bridge classical purity with massive contemporary appeal.

## 6. Qawwali Beyond South Asia

Today, Qawwali possesses a truly global reach. Driven by the South Asian diaspora in the UK, North America, and Europe, Qawwali has transcended its geographic origins. It is now a staple of prestigious world music festivals, concert halls, and global streaming platforms. This international expansion has transformed Qawwali from a regional devotional practice into one of the most widely recognized forms of world music.

## 7. Key Terms

* **Qawwali:** The devotional music of South Asian Sufis.
* **Sama:** The Sufi practice of spiritual listening and remembrance.
* **Wajd:** The state of spiritual ecstasy or trance induced by Sama.
* **Hamd:** Poetry in praise of God.
* **Naat:** Poetry in praise of the Prophet Muhammad.
* **Manqabat:** Poetry in praise of Sufi saints or Ali.
* **Ghazal:** A poetic form expressing the pain of loss or the beauty of love.
* **Kafi:** A classical form of Sufi poetry popular in Punjabi and Sindhi literature.
* **Chishti Order:** The prominent South Asian Sufi order known for its embrace of music and Sama.

## 8. The SufiPulse Interpretation

For more than seven centuries, Qawwali has served as one of the most influential musical expressions of Sufism. Its survival across changing empires, languages, technologies, and generations demonstrates the enduring power of devotional poetry, collective remembrance, and spiritual listening.

SufiPulse approaches Qawwali not simply as a musical genre, but as a living cultural and spiritual tradition whose history, poetry, performance practices, and contemporary interpretations continue to shape the global understanding of Sufi music.

## 9. Related Figures and Traditions

To fully understand the landscape of Qawwali, explore these connected entities within the SufiPulse Discovery Engine:
* [Amir Khusrau](file:///discovery/poets/amir-khusrau)
* [Nizamuddin Auliya](file:///discovery/saints/nizamuddin-auliya)
* [Nusrat Fateh Ali Khan](file:///discovery/singers/nusrat-fateh-ali-khan)
* [Sabri Brothers](file:///discovery/singers/sabri-brothers)
* [Abida Parveen](file:///discovery/singers/abida-parveen)
* [Rahat Fateh Ali Khan](file:///discovery/singers/rahat-fateh-ali-khan)
* [Sama](file:///discovery/traditions/sama)
* [Chishti Order](file:///discovery/orders/chishti-order)
* [Sufi Music](file:///discovery/concepts/sufi-music)
`;

async function run() {
  console.log('🚀 Injecting Release 02: Qawwali into CMS...');
  
  const releasesData = fs.readFileSync(RELEASES_FILE, 'utf-8');
  let releases = JSON.parse(releasesData);
  
  const newReleaseId = `rel_${crypto.randomUUID()}`;
  
  const release02 = {
    id: newReleaseId,
    title: 'Qawwali: The Sound of Devotional Ecstasy',
    slug: 'qawwali-sound-of-devotional-ecstasy',
    releaseDate: new Date().toISOString(),
    status: 'published',
    contentReadinessState: 'ready',
    publicCommentary: markdownContent,
    description: "The 700-year journey of South Asian devotional music from the courtyards of the Chishti saints to the global stage.",
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

  const existingIndex = releases.findIndex((r: any) => r.slug === 'qawwali-sound-of-devotional-ecstasy');
  if (existingIndex > -1) {
    releases[existingIndex] = { ...releases[existingIndex], ...release02 };
    console.log('✅ Updated existing Release 02 in CMS.');
  } else {
    releases.push(release02);
    console.log('✅ Inserted Release 02 into CMS.');
  }

  const tempPath = `${RELEASES_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(releases, null, 2));
  fs.renameSync(tempPath, RELEASES_FILE);

  const qawwaliEntity = entityStore.findBySlug('qawwali');
  if (qawwaliEntity) {
    const currentReleases = new Set(qawwaliEntity.connectedReleaseIds || []);
    currentReleases.add(newReleaseId);
    
    entityStore.update(qawwaliEntity.id, {
      connectedReleaseIds: Array.from(currentReleases)
    });
    console.log('✅ Connected Release 02 to Atlas Entity: Qawwali.');
  } else {
    console.log('⚠️ Could not find Qawwali in Atlas Entity Store.');
  }
  
  console.log('🎉 Release 02 injection complete!');
}

run().catch(console.error);
