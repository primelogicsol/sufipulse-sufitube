import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import {
  REGIONS,
  DIASPORA_MARKETS,
  LANGUAGES,
  SUFI_CONCEPTS,
  SPIRITUAL_THEMES,
  MOODS
} from './cms-taxonomy';

// Interface definitions
export interface RegistryItem {
  slug: string;
  title: string;
  synonyms?: string[];
  description: string;
  theologicalNotes?: string;
  isActive: boolean;
  isPublic: boolean;
  wikidataId?: string;
  sameAs?: string[];
  externalRefs?: {
    wikidata?: string;
    wikipedia?: string;
    britannica?: string;
    other?: string[];
  };
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface RegistriesData {
  concepts: RegistryItem[];
  themes: RegistryItem[];
  moods: RegistryItem[];
  regions: RegistryItem[];
  languages: RegistryItem[];
  diasporaMarkets: RegistryItem[];
  playlists: RegistryItem[];
}

// Zod validation schemas
export const registryItemSchema = z.object({
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  title: z.string().min(2, 'Title must be at least 2 characters').max(160, 'Title is too long'),
  synonyms: z.array(z.string().max(100)).optional(),
  description: z.string().max(5000, 'Description is too long'),
  theologicalNotes: z.string().max(5000).optional(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  wikidataId: z.string().max(50).optional().or(z.literal('')),
  sameAs: z.array(z.string().max(500)).optional(),
  externalRefs: z.object({
    wikidata: z.string().max(500).optional().or(z.literal('')),
    wikipedia: z.string().max(500).optional().or(z.literal('')),
    britannica: z.string().max(500).optional().or(z.literal('')),
    other: z.array(z.string().max(500)).optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
});

export const registriesSchema = z.object({
  concepts: z.array(registryItemSchema),
  themes: z.array(registryItemSchema),
  moods: z.array(registryItemSchema),
  regions: z.array(registryItemSchema),
  languages: z.array(registryItemSchema),
  diasporaMarkets: z.array(registryItemSchema),
  playlists: z.array(registryItemSchema)
});

// Resolve data folder
const resolveDataDir = () => {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (typeof window === 'undefined' && fs.existsSync('/app/.data')) {
    return '/app/.data';
  }
  return path.join(process.cwd(), '.data');
};

const DATA_DIR = resolveDataDir();
const REGISTRIES_FILE = path.join(DATA_DIR, 'registries.json');

class RegistriesStorage {
  private data: RegistriesData = {
    concepts: [],
    themes: [],
    moods: [],
    regions: [],
    languages: [],
    diasporaMarkets: [],
    playlists: []
  };

  private initialized = false;

  constructor() {
    this.init();
  }

  /**
   * Initializes registries, seeding them if they do not exist
   */
  public init(): void {
    if (typeof window !== 'undefined') return; // Only execute server-side
    if (this.initialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(REGISTRIES_FILE)) {
        const fileContent = fs.readFileSync(REGISTRIES_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        console.log('[REGISTRIES] File not found. Creating and seeding registries...');
        this.seedInitialData();
        this.persist();
      }
      this.initialized = true;
    } catch (error) {
      console.error('[REGISTRIES] Initialization failed:', error);
    }
  }

  /**
   * Force re-read file from disk (handles multi-instance edits or hot cache busts)
   */
  public forceHydrate(): void {
    this.initialized = false;
    this.init();
  }

  /**
   * Seeds registries from cms-taxonomy.ts
   */
  private seedInitialData(): void {
    const now = new Date().toISOString();

    this.data.concepts = SUFI_CONCEPTS.map(c => ({
      slug: c.code,
      title: c.label,
      description: `Master concept definition for ${c.label}.`,
      isActive: true,
      isPublic: true,
      createdAt: now
    }));

    this.data.themes = SPIRITUAL_THEMES.map(t => ({
      slug: t.code.replace(/_/g, '-'),
      title: t.label,
      description: `Master theme definition for ${t.label}.`,
      isActive: true,
      isPublic: true,
      createdAt: now
    }));

    this.data.moods = MOODS.map(m => ({
      slug: m.code,
      title: m.label,
      description: `Master mood definition for ${m.label}.`,
      isActive: true,
      isPublic: true,
      createdAt: now
    }));

    this.data.regions = REGIONS.map(r => ({
      slug: r.code,
      title: r.label,
      description: `Target region definition for ${r.label}.`,
      isActive: true,
      isPublic: true,
      createdAt: now
    }));

    this.data.languages = LANGUAGES.map(l => ({
      slug: l.code,
      title: l.label,
      description: `Master language definition for ${l.label}.`,
      isActive: true,
      isPublic: true,
      createdAt: now
    }));

    this.data.diasporaMarkets = DIASPORA_MARKETS.map(d => ({
      slug: d.code.replace(/_/g, '-'),
      title: d.label,
      description: `Diaspora focus for ${d.label}.`,
      isActive: true,
      isPublic: true,
      createdAt: now
    }));

    this.data.playlists = [];
  }

  /**
   * Persists registries database to disk
   */
  private persist(): void {
    try {
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(REGISTRIES_FILE, serialized, 'utf-8');
      
      // Standalone double-write caching support (production Docker container mapping helper)
      const standaloneDataDir = path.join(process.cwd(), '.next', 'standalone', '.data');
      if (fs.existsSync(standaloneDataDir)) {
        const standaloneDataFile = path.join(standaloneDataDir, 'registries.json');
        fs.writeFileSync(standaloneDataFile, serialized, 'utf-8');
      }
    } catch (error) {
      console.error('[REGISTRIES] Failed to write registries to disk:', error);
    }
  }

  /**
   * Get all items of a given type
   */
  public getItems(type: keyof RegistriesData, filterInactive = false): RegistryItem[] {
    this.init();
    const items = this.data[type] || [];
    if (filterInactive) {
      return items.filter(item => item.isActive);
    }
    return items;
  }

  /**
   * Get a single registry item by its slug
   */
  public getItem(type: keyof RegistriesData, slug: string): RegistryItem | undefined {
    this.init();
    return this.data[type]?.find(item => item.slug === slug);
  }

  /**
   * Add or update a registry item
   */
  public saveItem(type: keyof RegistriesData, item: RegistryItem): RegistryItem {
    this.init();
    const now = new Date().toISOString();
    const items = this.data[type] || [];
    const index = items.findIndex(i => i.slug === item.slug);

    if (index >= 0) {
      // Update
      const existing = items[index];
      const merged = {
        ...existing,
        ...item,
        createdAt: existing.createdAt, // Preserve original date
        updatedAt: now
      };
      items[index] = merged;
      this.persist();
      return merged;
    } else {
      // Create new
      const newItem = {
        ...item,
        createdAt: now
      };
      items.push(newItem);
      this.data[type] = items;
      this.persist();
      return newItem;
    }
  }

  /**
   * Delete a registry item by slug
   */
  public deleteItem(type: keyof RegistriesData, slug: string): boolean {
    this.init();
    const items = this.data[type] || [];
    const index = items.findIndex(i => i.slug === slug);
    if (index >= 0) {
      items.splice(index, 1);
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Utility for raw JSON retrieval
   */
  public getRawData(): RegistriesData {
    this.init();
    return this.data;
  }
}

export const registriesStorage = new RegistriesStorage();
