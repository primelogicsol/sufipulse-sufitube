import fs from 'fs';
import path from 'path';
import { entityStore } from '../lib/atlas/atlas-entity';

const DATA_DIR = path.join(process.cwd(), '.data');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');

const markdownContent = `
# Publication 01: Nund Rishi and the Making of Kashmir's Spiritual Identity

**Category:** Historical Deep-Dive  
**Tags:** Nund Rishi, Kashmiri Spiritual Heritage, Kashmiri Sufism, Rishi Tradition, Sufism, Shruks, Cultural Heritage  

---

## 1. The Crucible of 14th-Century Kashmir

To understand the magnitude of Nund Rishi (1377–1438), also universally revered as Sheikh Noor-ud-Din Wali, one must first look at the landscape of 14th-century Kashmir. The Valley was undergoing one of the most profound demographic and theological shifts in its history. Centuries of indigenous Buddhist philosophy and non-dualistic Kashmir Shaivism were encountering the arrival of Central Asian Sufi missionaries. 

While orthodox theologians debated doctrine in the courts of Srinagar, the rural masses—the agrarian heartbeat of Kashmir—required a spiritual language they could actually understand. Enter Sheikh Noor-ud-Din Wali, a mystic who did not merely preach a new theology, but forged a unique spiritual synthesis that would define the region's identity for the next six hundred years.

## 2. The Influence of Lal Ded

Nund Rishi's spiritual lineage cannot be traced exclusively to Baghdad or Bukhara. It began in the rugged caves and forests of Kashmir, heavily influenced by a slightly older contemporary: the Shaivite mystic poet **Lal Ded** (Lalleshwari).

According to deeply held local tradition, it was Lal Ded who fed the infant Nund Rishi when he refused to nurse, whispering to him, *"You were not ashamed to be born; why are you ashamed to drink?"* Whether historical fact or symbolic lore, the story captures a profound truth: Nund Rishi absorbed the ascetic, introspective practices of the Kashmiri Yoginis and wove them seamlessly into the devotional framework of Islam. 

## 3. The Founding of the Rishi Tradition

Kashmiri Sufism is entirely unique because of the **Rishi Order**. The Rishi Order is widely regarded as one of the most distinctive indigenous expressions of Sufism to emerge from Kashmir. 

Unlike the imported Suhrawardi or Naqshbandi orders, the Rishis did not emphasize formal, systematic theology. They adopted a radical form of asceticism that resonated deeply with the local population:
* **Vegetarianism:** Abstaining from meat, garlic, and onions, mirroring the dietary discipline of local Hindu priests.
* **Environmental Stewardship:** Planting fruit-bearing trees for weary travelers and fiercely protecting the forests.
* **Radical Equality:** Rejecting the caste system and treating every individual, regardless of their faith, as a manifestation of the Divine.

This was not a religion of the sword or the state; it was a religion of the soil.

## 4. The Shruks: Kashmiri Sufi Poetry

Nund Rishi possessed a genius for communication. He bypassed the elite, courtly Persian language favored by foreign scholars and spoke directly to the people in pure Kashmiri.

His teachings were delivered in four-line poetic aphorisms known as **Shruks**. These verses were memorized by illiterate farmers, weavers, and artisans, passing from generation to generation through Kashmiri devotional traditions. Through these Shruks, Nund Rishi conveyed complex theological concepts—such as the illusion of the ego (*fana*) and the omnipresence of God—using the metaphors of the spinning wheel, the potter’s kiln, and the changing seasons.

## 5. The Meeting of Two Worlds

The cultural synthesis of Kashmir was accelerated by Nund Rishi’s historical interaction with the wider Islamic world, most notably symbolized by his legacy alongside the great Persian Sufi, **Mir Sayyid Ali Hamadani**. 

While Hamadani brought structured, institutional Sufism, Persian arts, and global trade connections to the Valley, Nund Rishi provided the indigenous soul. The coexistence and eventual blending of these two streams—the cosmopolitan and the local—created the distinct religious and cultural atmosphere known today as *Kashmiriyat*.

## 6. Nund Rishi and Sufi Music

Although Nund Rishi is primarily remembered as a saint, poet, and founder of the Rishi tradition, his influence extends deeply into the musical culture of Kashmir.

His Shruks continue to be recited, adapted, and interpreted through devotional performance traditions across the Valley. Elements of his teachings survive in Sufiyana Mousiqi, folk devotional gatherings, oral poetry recitations, and community remembrance practices. 

Through these musical traditions, Nund Rishi's teachings moved beyond manuscripts and entered collective memory, allowing generations to encounter spiritual ideas through sound, rhythm, and performance. For modern listeners exploring Sufi music, Nund Rishi represents an important link between spiritual philosophy, vernacular poetry, and living musical heritage.

## 7. Legacy and Cultural Memory

Today, Nund Rishi’s shrine at **Charar-e-Sharif** remains one of the most sacred pilgrimage sites in Kashmir, drawing hundreds of thousands of devotees, both Muslim and Hindu. His idioms and proverbs have seamlessly woven themselves into everyday Kashmiri vocabulary, ensuring that his worldview is transmitted even in casual speech.

## 8. Related Figures and Traditions

To fully map the authority and scope of Kashmiri spiritual heritage, Nund Rishi must be studied alongside the network he helped construct:
* **Lal Ded:** The Shaivite predecessor whose indigenous asceticism laid the groundwork for Nund Rishi’s spiritual idiom.
* **Mir Sayyid Ali Hamadani:** The Persian Sufi master who introduced Central Asian institutional Sufism, representing the global counterweight to Nund Rishi's local mysticism.
* **Rishi Tradition:** The ascetic order he founded, which shaped the socio-cultural fabric of Kashmir for centuries.
* **Kashmiri Sufiyana:** The classical choral tradition that preserved and elevated the Shruks into formal musical repertoires.

---

For SufiPulse, documenting Nund Rishi is part of a broader effort to preserve, interpret, and share the intellectual, spiritual, literary, and musical heritage of Kashmir. By connecting historical context, living traditions, and contemporary performance, we seek to ensure that future generations can continue to engage with one of the most influential voices in the history of Kashmiri spirituality.
`;

async function run() {
  console.log('🚀 Injecting Publication 01: Nund Rishi into CMS...');
  
  if (!fs.existsSync(ARTICLES_FILE)) {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify([]));
  }
  
  const articlesData = fs.readFileSync(ARTICLES_FILE, 'utf-8');
  let articles = JSON.parse(articlesData);
  
  const newArticleId = `pub_${crypto.randomUUID()}`;
  
  const pub01 = {
    id: newArticleId,
    contributor_id: 'sufipulse-editorial',
    user_id: 'admin',
    title: "Nund Rishi and the Making of Kashmir's Spiritual Identity",
    slug: 'nund-rishi-making-of-kashmirs-spiritual-identity',
    content: markdownContent,
    excerpt: "A deep-dive into how Sheikh Noor-ud-Din Wali forged the Rishi Tradition and shaped the spiritual, literary, and musical heritage of Kashmir.",
    category: 'Historical Deep-Dive',
    tags: ['Nund Rishi', 'Kashmiri Spiritual Heritage', 'Kashmiri Sufism', 'Rishi Tradition', 'Sufism', 'Shruks', 'Cultural Heritage'],
    status: 'published',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Prevent duplicate insertion
  const existingIndex = articles.findIndex((a: any) => a.slug === pub01.slug);
  if (existingIndex > -1) {
    articles[existingIndex] = { ...articles[existingIndex], ...pub01 };
    console.log('✅ Updated existing Publication 01 in CMS.');
  } else {
    articles.push(pub01);
    console.log('✅ Inserted Publication 01 into CMS.');
  }

  // Save via atomic rename pattern
  const tempPath = `${ARTICLES_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(articles, null, 2));
  fs.renameSync(tempPath, ARTICLES_FILE);

  // Link to Nund Rishi entity in Atlas
  const nundEntity = entityStore.findBySlug('nund-rishi');
  if (nundEntity) {
    const currentArticles = new Set(nundEntity.connectedArticleIds || []);
    currentArticles.add(newArticleId);
    
    entityStore.update(nundEntity.id, {
      connectedArticleIds: Array.from(currentArticles)
    });
    console.log('✅ Connected Publication 01 to Atlas Entity: Nund Rishi.');
  } else {
    console.log('⚠️ Could not find Nund Rishi in Atlas Entity Store.');
  }
  
  console.log('🎉 Publication 01 injection complete!');
}

run().catch(console.error);
