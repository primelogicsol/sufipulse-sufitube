import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { entityStore } from '../lib/atlas/atlas-entity';

const DATA_DIR = path.join(process.cwd(), '.data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

const markdownContent = `
# Publication 02: Qawwali and the Making of South Asian Sufi Music

**Category:** Historical Deep-Dive  
**Tags:** Qawwali, Sufi Music, Amir Khusrau, Chishti Order, Sama, Nusrat Fateh Ali Khan, South Asian Devotional Music  

---

## 1. The Birth of Qawwali

The story of Qawwali begins in the 13th-century Delhi Sultanate. As the Chishti Order of Sufism firmly established itself across the Indian subcontinent, its spiritual masters recognized a profound reality: complex theology spoken in courtly Persian would never capture the hearts of the agrarian masses. 

The Chishtis believed deeply in *Sama*—the practice of spiritual listening. Under the patronage of the great saint Nizamuddin Auliya, the early *Sama* gatherings evolved from simple recitations of mystic poetry into structured musical assemblies. It was within this spiritual crucible that **Amir Khusrau** (1253–1325), Nizamuddin Auliya's most devoted disciple, is widely associated with the early formation and development of Qawwali traditions.

## 2. Amir Khusrau's Musical Revolution

Amir Khusrau’s genius was rooted in synthesis. As a polymath, poet, and musician, he successfully bridged two entirely different worlds. 

Khusrau integrated the melodic frameworks of Hindustani music with the philosophical and rhythmic traditions of Persian, Arabic, and Turkic Sufi poetry. More importantly, he pioneered the use of *Hindavi* (the vernacular precursor to modern Urdu and Hindi) alongside elite Persian. By doing so, he forged a new linguistic and musical bridge, allowing a single poetic form to resonate with the Sultan in his court and the peasant in the field.

## 3. Sama and Spiritual Listening

To understand Qawwali, one must understand the theological framework that sustains it. Qawwali is the musical manifestation of **Sama**. 
* **Sama:** The act of deep, attentive spiritual listening, intended to awaken the soul to the presence of the Divine.
* **Wajd:** The state of spiritual ecstasy, trance, or rapture that a listener enters when profoundly moved by the performance.
* **Dhikr:** The continuous, rhythmic remembrance of God, often embedded into the percussion and vocal chants of the performance.

Qawwali is not a concert; it is a communal ritual where the musicians (*qawwals*) act as conduits, guiding the listener through an escalating journey toward *wajd*.

## 4. Structure of a Traditional Qawwali

A classic Qawwali session is never random. It follows a strict hierarchical progression:
1. **Hamd:** Many traditional sessions begin with poetry in absolute praise of God.
2. **Naat:** This is followed by verses expressing deep love and veneration for the Prophet Muhammad.
3. **Manqabat:** The session then honors the spiritual lineage, praising revered saints such as Ali ibn Abi Talib or the founders of the Chishti order.
4. **Ghazal or Kafi:** Finally, the performers transition into forms that explore the agony of separation from the Divine, the intoxicating nature of spiritual love, and the ultimate desire for annihilation (*fana*) of the ego.

## 5. The Great Qawwals

While the tradition was sustained for centuries in the *dargahs* (shrines) of the subcontinent, the late 20th century saw the rise of monumental voices who came to define the modern era of Qawwali:
* **Nusrat Fateh Ali Khan:** The undisputed *Shahenshah-e-Qawwali* (King of Kings of Qawwali), whose superhuman vocal improvisations brought the genre to unprecedented global heights.
* **The Sabri Brothers:** The trailblazing ensemble whose powerful, robust chorus singing turned tracks like *Tajdar-e-Haram* into international anthems.
* **Aziz Mian:** Known for his aggressive, philosophically confrontational style and unmatched mastery of complex Urdu poetry.
* **Abida Parveen:** While famous for *Kafi* and *Ghazal*, her towering, transcendent performances frequently blur the lines of Qawwali, capturing the absolute essence of Sufi ecstasy.

## 6. Qawwali Beyond South Asia

Today, the footprint of Qawwali is global. Driven initially by the South Asian diaspora in the United Kingdom, North America, and Europe, Qawwali has broken entirely free of its geographic origins. From sold-out auditoriums in London and Paris to massive world music festivals like WOMAD, Qawwali has established itself as one of the most vital and recognizable forms of devotional music on the planet.

## 7. Why Millions Listen to Qawwali

When listeners search for the "best Qawwali songs" or "famous Qawwali singers," they are often searching for catharsis. Millions are drawn to Qawwali because it offers something profoundly rare: raw emotional intensity stripped of commercial pretense. The soaring vocal improvisation, the relentless drive of the tabla, and the communal energy of the chorus provide an avenue for shared spiritual longing. It is a live, breathing experience that invites the listener to abandon their ego.

## 8. Qawwali in the Digital Age

The digital era has been both a blessing and a profound risk for Qawwali. On platforms like YouTube and Spotify, Qawwali enjoys vast digital audiences, reaching people who have never set foot in a Sufi shrine. However, as 15-second viral clips and heavy electronic remixes strip the vocals from their acoustic foundations, the tradition faces the threat of dilution. When Qawwali is reduced to a "vibe" or a cinematic aesthetic, the sacred poetry and the mechanics of *Sama* are often lost.

## 9. The SufiPulse Interpretation

SufiPulse approaches Qawwali not simply as an ethnic musical genre, but as a sophisticated, 700-year-old intellectual and spiritual technology. Our mission is to document, preserve, and interpret this tradition with the historical and cultural gravity it demands. By protecting the acoustic integrity of the performance and providing rigorous translation of the poetry, we seek to ensure that Qawwali remains a conduit for spiritual awakening, rather than a casualty of digital consumption.

## 10. Related Figures and Traditions

To explore the deeper roots of this tradition within the SufiPulse Discovery Engine, examine the following core nodes:
* Amir Khusrau
* Nizamuddin Auliya
* Nusrat Fateh Ali Khan
* Abida Parveen
* Sama
* Chishti Order
* Sufi Music

## 11. Sources & Traditions

This publication is grounded in the historical framework of Chishti practice, the theological doctrines of Sama, and centuries of dargah performance traditions. It draws from academic scholarship on South Asian devotional music, the oral transmission methods of the qawwals (*qawwal bacchon ka gharana*), and the preservation of original poetic texts found in both classical manuscripts and modern recordings.
`;

async function run() {
  console.log('🚀 Injecting Publication 02: Qawwali into CMS...');
  
  if (!fs.existsSync(ARTICLES_FILE)) {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify([]));
  }
  
  const articlesData = fs.readFileSync(ARTICLES_FILE, 'utf-8');
  let articles = JSON.parse(articlesData);
  
  const newArticleId = `pub_${crypto.randomUUID()}`;
  
  const pub02 = {
    id: newArticleId,
    contributor_id: 'sufipulse-editorial',
    user_id: 'admin',
    title: "Qawwali and the Making of South Asian Sufi Music",
    slug: 'qawwali-and-the-making-of-south-asian-sufi-music',
    content: markdownContent,
    excerpt: "A comprehensive deep-dive into the history, structure, and global evolution of Qawwali, from the Chishti shrines to the digital age.",
    category: 'Historical Deep-Dive',
    tags: ['Qawwali', 'Sufi Music', 'Amir Khusrau', 'Chishti Order', 'Sama', 'Nusrat Fateh Ali Khan'],
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingIndex = articles.findIndex((a: any) => a.slug === pub02.slug);
  if (existingIndex > -1) {
    articles[existingIndex] = { ...articles[existingIndex], ...pub02 };
    console.log('✅ Updated existing Publication 02 in CMS.');
  } else {
    articles.push(pub02);
    console.log('✅ Inserted Publication 02 into CMS.');
  }

  const tempPath = `${ARTICLES_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(articles, null, 2));
  fs.renameSync(tempPath, ARTICLES_FILE);

  const entity = entityStore.findBySlug('qawwali');
  if (entity) {
    const currentArticles = new Set(entity.connectedArticleIds || []);
    currentArticles.add(newArticleId);
    
    entityStore.update(entity.id, {
      connectedArticleIds: Array.from(currentArticles)
    });
    console.log('✅ Connected Publication 02 to Atlas Entity: Qawwali.');
  } else {
    console.log('⚠️ Could not find Qawwali in Atlas Entity Store.');
  }
  
  console.log('🎉 Publication 02 injection complete!');
}

run().catch(console.error);
