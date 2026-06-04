export const REGIONS = [
  { code: 'pk', label: 'Pakistan' },
  { code: 'in', label: 'India' },
  { code: 'bd', label: 'Bangladesh' },
  { code: 'tr', label: 'Turkey' },
  { code: 'id', label: 'Indonesia' },
  { code: 'my', label: 'Malaysia' },
  { code: 'uk', label: 'United Kingdom' },
  { code: 'us', label: 'United States' },
  { code: 'ca', label: 'Canada' },
  { code: 'de', label: 'Germany' },
  { code: 'me', label: 'Middle East' }
] as const;

export const DIASPORA_MARKETS = [
  { code: 'urdu_diaspora', label: 'Urdu Diaspora' },
  { code: 'punjabi_diaspora', label: 'Punjabi Diaspora' },
  { code: 'turkish_diaspora', label: 'Turkish Diaspora' },
  { code: 'arabic_diaspora', label: 'Arabic Diaspora' },
  { code: 'bengali_diaspora', label: 'Bengali Diaspora' }
] as const;

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'Urdu' },
  { code: 'tr', label: 'Turkish' },
  { code: 'fa', label: 'Persian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'bn', label: 'Bengali' }
] as const;

export const SUFI_CONCEPTS = [
  { code: 'fana', label: 'Fana (Annihilation)' },
  { code: 'baqa', label: 'Baqa (Subsistence)' },
  { code: 'ishq', label: 'Ishq (Divine Love)' },
  { code: 'sabr', label: 'Sabr (Patience)' },
  { code: 'tawakkul', label: 'Tawakkul (Trust in God)' },
  { code: 'tasawwuf', label: 'Tasawwuf (Sufism)' },
  { code: 'dhikr', label: 'Dhikr (Remembrance)' },
  { code: 'rida', label: 'Rida (Contentment)' },
  { code: 'shukr', label: 'Shukr (Gratitude)' },
  { code: 'faqr', label: 'Faqr (Spiritual Poverty)' },
  { code: 'marifa', label: 'Ma\'rifa (Gnosis)' },
  { code: 'haqiqa', label: 'Haqiqa (Ultimate Truth)' }
] as const;

export const SPIRITUAL_THEMES = [
  { code: 'divine_love', label: 'Divine Love' },
  { code: 'seeking_union', label: 'Seeking Union' },
  { code: 'praise_hamd', label: 'Praise & Adoration (Hamd)' },
  { code: 'devotion_naat', label: 'Prophetic Devotion (Naat)' },
  { code: 'spiritual_journey', label: 'The Spiritual Journey' },
  { code: 'annihilation_fana', label: 'Annihilation of Self' },
  { code: 'repentance_tawbah', label: 'Repentance (Tawbah)' },
  { code: 'cosmic_order', label: 'Cosmic Spiritual Order' }
] as const;

export const MOODS = [
  { code: 'ecstatic', label: 'Ecstatic (Wajd)' },
  { code: 'contemplative', label: 'Contemplative (Fikr)' },
  { code: 'longing', label: 'Longing (Shawq)' },
  { code: 'serene', label: 'Serene (Itminan)' },
  { code: 'triumphant', label: 'Triumphant (Fath)' },
  { code: 'reflective', label: 'Reflective' },
  { code: 'melancholic', label: 'Melancholic/Sorrowful' },
  { code: 'celebratory', label: 'Celebratory' }
] as const;

// Helper maps for easy lookup
export const REGION_CODES = REGIONS.map(r => r.code);
export const DIASPORA_CODES = DIASPORA_MARKETS.map(d => d.code);
export const LANGUAGE_CODES = LANGUAGES.map(l => l.code);
export const SUFI_CONCEPT_CODES = SUFI_CONCEPTS.map(c => c.code);
export const THEME_CODES = SPIRITUAL_THEMES.map(t => t.code);
export const MOOD_CODES = MOODS.map(m => m.code);
