import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export type KnowledgeEntityType =
  | 'saint'
  | 'scholar'
  | 'poet'
  | 'practice'
  | 'quranicTheme'
  | 'spiritualState'
  | 'musicalTradition'
  | 'literaryTradition'
  | 'singer'
  | 'song'
  | 'kalam'
  | 'release'
  | 'album'
  | 'concept'
  | 'order';

export interface KnowledgeEntity {
  id: string; // unique ID e.g., type_slug
  type: KnowledgeEntityType;
  slug: string;
  name: string;
  alternateNames: string[];
  shortDescription: string; // Enforced minimum 40 words for public
  article: string;  // Enforced minimum 150 words for public
  theologicalNotes?: string;
  historicalNotes?: string;
  
  // Person/Life Metadata
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  deathPlace?: string;
  nationality?: string;
  occupation?: string[];

  // Artistic & Thematic Attributes
  performanceCharacteristics?: string[];
  musicalStyle?: string[];
  primaryThemes?: string[];

  // Knowledge Graph Edges
  regionLinks: string[]; // region slugs
  languageLinks: string[]; // language slugs
  traditionLinks?: string[]; // order/tradition IDs
  teacherLinks?: string[]; // person IDs
  influencedLinks?: string[]; // person IDs
  languageLinks: string[]; // language slugs
  relatedConcepts: string[]; // concept slugs
  relatedReleases: string[]; // release IDs
  relatedArticles: string[]; // article slugs
  relatedPlaylists: string[]; // playlist slugs
  sameAs: string[]; // external authority URLs
  wikidataId?: string;
  isActive: boolean;
  isPublic: boolean; // Enforced publishing checks
  createdAt: string;
  updatedAt: string;
  knowledgeDensityScore?: number; // Calculated dynamically on read/write
}

// Zod Schema
export const knowledgeEntitySchema = z.object({
  id: z.string(),
  type: z.enum([
    'saint', 'scholar', 'poet', 'practice', 'quranicTheme', 'spiritualState', 'musicalTradition', 'literaryTradition',
    'singer', 'song', 'kalam', 'release', 'album', 'concept', 'order'
  ]),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(160),
  alternateNames: z.array(z.string()).default([]),
  shortDescription: z.string().max(3000),
  article: z.string().max(25000),
  theologicalNotes: z.string().max(8000).optional().or(z.literal('')),
  historicalNotes: z.string().max(8000).optional().or(z.literal('')),
  
  birthDate: z.string().optional().or(z.literal('')),
  deathDate: z.string().optional().or(z.literal('')),
  birthPlace: z.string().optional().or(z.literal('')),
  deathPlace: z.string().optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  occupation: z.array(z.string()).optional(),
  
  performanceCharacteristics: z.array(z.string()).optional(),
  musicalStyle: z.array(z.string()).optional(),
  primaryThemes: z.array(z.string()).optional(),

  regionLinks: z.array(z.string()).default([]),
  languageLinks: z.array(z.string()).default([]),
  traditionLinks: z.array(z.string()).optional(),
  teacherLinks: z.array(z.string()).optional(),
  influencedLinks: z.array(z.string()).optional(),
  
  relatedConcepts: z.array(z.string()).default([]),
  relatedReleases: z.array(z.string()).default([]),
  relatedArticles: z.array(z.string()).default([]),
  relatedPlaylists: z.array(z.string()).default([]),
  sameAs: z.array(z.string().max(500)).default([]),
  wikidataId: z.string().max(50).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string()
}).passthrough();

const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const KNOWLEDGE_FILE = path.join(DATA_DIR, 'knowledge-registry.json');

class KnowledgeStorage {
  private entities: Record<string, KnowledgeEntity> = {};
  private initialized = false;

  constructor() {
    this.init();
  }

  public init(): void {
    if (typeof window !== 'undefined') return;
    if (this.initialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(KNOWLEDGE_FILE)) {
        const content = fs.readFileSync(KNOWLEDGE_FILE, 'utf-8');
        const list = JSON.parse(content || '[]');
        this.entities = {};
        list.forEach((entity: KnowledgeEntity) => {
          this.entities[entity.id] = entity;
        });
      } else {
        console.log('[KNOWLEDGE] Registry file not found. Pre-seeding initial entities...');
        this.seedInitialData();
        this.persist();
      }
      this.initialized = true;
    } catch (error) {
      console.error('[KNOWLEDGE] Initialization failed:', error);
    }
  }

  public forceHydrate(): void {
    this.initialized = false;
    this.init();
  }

  /**
   * Enforces minimum formatting guidelines before allowing an entity to be set public:
   * 1. Short description: minimum 40 words
   * 2. Long description: minimum 150 words
   * 3. At least 1 connected release OR article
   * 4. At least 3 internal links (combining relatedConcepts, regionLinks, languageLinks, sameAs, relatedPlaylists)
   * 5. Active and public status checked
   */
  public validatePublishReady(entity: KnowledgeEntity): { ready: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Helper word counter
    const countWords = (str: string) => str.trim().split(/\s+/).filter(w => w.length > 0).length;

    // 1. Short description check
    const shortWordCount = countWords(entity.shortDescription || '');
    if (shortWordCount < 40) {
      errors.push(`Short description is too thin (${shortWordCount} words, minimum 40 required).`);
    }

    // 2. Long description check
    const longWordCount = countWords(entity.longDescription || '');
    if (longWordCount < 150) {
      errors.push(`Long description is too thin (${longWordCount} words, minimum 150 required).`);
    }

    // 3. Connection check
    const hasReleases = (entity.relatedReleases || []).length > 0;
    const hasArticles = (entity.relatedArticles || []).length > 0;
    if (!hasReleases && !hasArticles) {
      errors.push(`Entity must be connected to at least one release or journal article.`);
    }

    // 4. Internal links density check
    const conceptLinks = (entity.relatedConcepts || []).length;
    const regionLinks = (entity.regionLinks || []).length;
    const languageLinks = (entity.languageLinks || []).length;
    const sameAsLinks = (entity.sameAs || []).length;
    const playlistLinks = (entity.relatedPlaylists || []).length;
    const totalLinks = conceptLinks + regionLinks + languageLinks + sameAsLinks + playlistLinks;

    if (totalLinks < 3) {
      errors.push(`Entity must have at least 3 internal link references (found ${totalLinks} links: ${conceptLinks} concepts, ${regionLinks} regions, ${languageLinks} languages, ${sameAsLinks} external refs).`);
    }

    return {
      ready: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private seedInitialData(): void {
    const now = new Date().toISOString();

    // 1. Seed Rumi (Poet)
    const rumi: KnowledgeEntity = {
      id: 'poet_rumi',
      type: 'poet',
      slug: 'rumi',
      name: 'Jalaluddin Rumi',
      alternateNames: ['Mawlana Rumi', 'Jalāl al-Dīn Muḥammad Rūmī', 'Mevlana'],
      shortDescription: 'Jalaluddin Rumi was a 13th-century Persian poet, Islamic scholar, theologian, and Sufi mystic whose influence transcends national borders and ethnic divisions, globally celebrated for his poetry on divine love and union.',
      longDescription: 'Jalaluddin Muhammad Rumi is widely regarded as one of the greatest spiritual masters and poetic minds in Islamic history. Born in Balkh (modern-day Afghanistan) in 1207, Rumi eventually settled in Konya (modern-day Turkey) after fleeing the Mongol invasions. His life was permanently transformed after his encounter with the wandering dervish Shams-e Tabrizi, whose sudden disappearance inspired Rumi to compose the Divan-e Shams-e Tabrizi. Rumi’s magnum opus, the Masnavi (often described as the Quran in Persian), comprises six volumes of rhymed spiritual couplets detailing the seeker’s journey of returning to the Divine Source. His works remain the bedrock of ecstatic Sufi poetry, musical assemblies (Sama), and global mystic traditions, shaping qawwalis, ghazals, and Sufiana music for centuries.',
      theologicalNotes: 'Rumi’s theology centers on the alchemy of Divine Love (Ishq). He views human suffering not as a punishment, but as the raw material for spiritual refinement. The soul is likened to a reed flute (Ney) cut from its reedbed, crying out in separation, seeking return and union.',
      regionLinks: ['tr', 'pk', 'in', 'me'],
      languageLinks: ['fa', 'tr', 'en', 'ur'],
      relatedConcepts: ['ishq', 'fana', 'sabr'],
      relatedReleases: ['release_1779542779861_4HZbA2sfGmY'], // Connects to Aahista Aahista
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Rumi', 'https://www.britannica.com/biography/Rumi'],
      wikidataId: 'Q8493',
      isActive: true,
      isPublic: true,
      createdAt: now,
      updatedAt: now
    };

    // 2. Seed Dhikr (Practice)
    const dhikr: KnowledgeEntity = {
      id: 'practice_dhikr',
      type: 'practice',
      slug: 'dhikr',
      name: 'Dhikr (Spiritual Remembrance)',
      alternateNames: ['Zikr', 'Remembrance of God'],
      shortDescription: 'Dhikr is a central Islamic and Sufi devotional practice consisting of the rhythmic repetition of the names of God or short spiritual litanies, performed silently or aloud to polish the seeker\'s heart.',
      longDescription: 'Dhikr (remembrance) is the spiritual practice of purifying the heart through constant awareness of the Divine Presence. Anchored in the Quranic command to "remember God with much remembrance," Dhikr acts as the key meditative tool in Tasawwuf. It can be performed individually (sirr - silent) or collectively in assemblies (jahr - loud), involving physical rhythm, breathing patterns, and spiritual contemplation. In musical traditions like Qawwali or Sufiana Musiqi, the repetitive chants of divine names serve as a sonic vehicle to induce ecstatic states (Wajd), polishing the mirror of the heart to reflect divine light.',
      theologicalNotes: 'In Sufi psychology, the heart is a mirror that accumulates rust through worldly distraction. Dhikr is the polish that removes this veil, allowing the seeker to perceive reality (Haqiqa) and witness the Divine Presence within.',
      regionLinks: ['pk', 'in', 'tr', 'me'],
      languageLinks: ['ar', 'ur', 'tr', 'fa'],
      relatedConcepts: ['dhikr', 'baqa', 'marifa'],
      relatedReleases: ['release_1779542779861_4HZbA2sfGmY'],
      relatedArticles: [],
      relatedPlaylists: [],
      sameAs: ['https://en.wikipedia.org/wiki/Dhikr'],
      wikidataId: 'Q622521',
      isActive: true,
      isPublic: true,
      createdAt: now,
      updatedAt: now
    };

    this.entities[rumi.id] = rumi;
    this.entities[dhikr.id] = dhikr;
  }

  private persist(): void {
    try {
      const serialized = JSON.stringify(Object.values(this.entities), null, 2);
      fs.writeFileSync(KNOWLEDGE_FILE, serialized, 'utf-8');

      // Standalone double-write caching support (production Docker container mapping helper)
      const standaloneDataDir = path.join(process.cwd(), '.next', 'standalone', '.data');
      if (fs.existsSync(standaloneDataDir)) {
        const standaloneDataFile = path.join(standaloneDataDir, 'knowledge-registry.json');
        fs.writeFileSync(standaloneDataFile, serialized, 'utf-8');
      }
    } catch (error) {
      console.error('[KNOWLEDGE] Failed to write knowledge registry to disk:', error);
    }
  }

  public calculateKnowledgeDensityScore(entity: KnowledgeEntity): number {
    const countWords = (str: string) => (str || '').trim().split(/\s+/).filter(w => w.length > 0).length;

    // 1. Description Completeness (Max 30)
    const shortWords = countWords(entity.shortDescription || '');
    const shortScore = Math.min(15, (shortWords / 40) * 15);

    const longWords = countWords(entity.longDescription || '');
    const longScore = Math.min(15, (longWords / 150) * 15);

    const descCompleteness = shortScore + longScore;

    // 2. Relationships Layer (Max 50)
    const releasesCount = (entity.relatedReleases || []).length;
    const releasesScore = Math.min(15, releasesCount * 15);

    const articlesCount = (entity.relatedArticles || []).length;
    const articlesScore = Math.min(10, articlesCount * 10);

    const conceptsCount = (entity.relatedConcepts || []).length;
    const conceptsScore = Math.min(10, conceptsCount * 5);

    const otherLinksCount = 
      (entity.regionLinks || []).length + 
      (entity.languageLinks || []).length + 
      (entity.relatedPlaylists || []).length;
    const otherLinksScore = Math.min(15, otherLinksCount * 5);

    const relationsScore = releasesScore + articlesScore + conceptsScore + otherLinksScore;

    // 3. External References (Max 20)
    const wikidataScore = entity.wikidataId ? 10 : 0;
    const sameAsCount = (entity.sameAs || []).length;
    const sameAsScore = Math.min(10, sameAsCount * 5);

    const externalRefsScore = wikidataScore + sameAsScore;

    return Math.round(descCompleteness + relationsScore + externalRefsScore);
  }

  public getEntity(slug: string, type: KnowledgeEntityType): KnowledgeEntity | undefined {
    this.init();
    const entity = this.entities[`${type}_${slug}`];
    if (entity) {
      entity.knowledgeDensityScore = this.calculateKnowledgeDensityScore(entity);
    }
    return entity;
  }

  public getEntities(type?: KnowledgeEntityType): KnowledgeEntity[] {
    this.init();
    const list = Object.values(this.entities);
    list.forEach(entity => {
      entity.knowledgeDensityScore = this.calculateKnowledgeDensityScore(entity);
    });
    if (type) {
      return list.filter(e => e.type === type);
    }
    return list;
  }

  public saveEntity(entity: KnowledgeEntity): KnowledgeEntity {
    this.init();
    const now = new Date().toISOString();
    
    // Auto-generate ID
    const entityId = `${entity.type}_${entity.slug.trim().toLowerCase()}`;
    const cleanEntity = {
      ...entity,
      id: entityId,
      slug: entity.slug.trim().toLowerCase(),
      createdAt: entity.createdAt || now,
      updatedAt: now
    };

    // If setting to public, run validation checks
    if (cleanEntity.isPublic) {
      const validation = this.validatePublishReady(cleanEntity);
      if (!validation.ready) {
        throw new Error(`Cannot publish entity "${cleanEntity.name}":\n- ` + validation.errors?.join('\n- '));
      }
    }

    const saved = cleanEntity;
    saved.knowledgeDensityScore = this.calculateKnowledgeDensityScore(cleanEntity);

    this.entities[entityId] = cleanEntity;
    this.persist();
    return saved;
  }

  public deleteEntity(slug: string, type: KnowledgeEntityType): boolean {
    this.init();
    const entityId = `${type}_${slug}`;
    if (this.entities[entityId]) {
      delete this.entities[entityId];
      this.persist();
      return true;
    }
    return false;
  }
}

export const knowledgeStorage = new KnowledgeStorage();
