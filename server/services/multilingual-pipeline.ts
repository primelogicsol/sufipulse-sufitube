/**
 * server/services/multilingual-pipeline.ts
 *
 * Multilingual Processing Engine for SufiPulse New-Release Pipeline.
 * 
 * Provides:
 *  1. Original Urdu in Nastaliq script.
 *  2. Grammatically natural English translation preserving Sufi mystical and theological meaning.
 *  3. Phonetic Roman Urdu transliteration.
 *  4. Urdu rendered phonetically in Devanagari WITHOUT substituting Hindi vocabulary.
 *  5. Optional language extensions (Kashmiri, Arabic, Persian, Punjabi, Turkish).
 */

import type { ReconciledMasterTimeline } from '@/server/types/pipeline-draft';
import {
  parseCanonicalPoemDocument,
  alignVocalPhrasesToTimeline,
  FLAGSHIP_KAB_TAK_KHAMOSH_LEXICON,
} from './lyric-parser';
import { FOOTPRINTS_BEHIND_LEXICON } from './footprints-behind-lexicon';
import {
  devanagariToRoman,
  devanagariToUrdu,
  toRomanUrdu,
} from '@/lib/transliteration';

export { devanagariToRoman, devanagariToUrdu, toRomanUrdu };

export interface MultilingualLineEntry {
  lineIndex: number;
  vocalIndex?: number;
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  urduNastaliq?: string;
  englishTranslation: string;
  romanUrdu: string;
  devanagariUrdu: string;
  speaker?: string;
  section?: string;
  confidence?: number;
  additionalLanguages?: Record<string, string>;
  isProductionDirection: boolean;
  words?: Array<{
    text: string;
    startSeconds: number;
    endSeconds: number;
  }>;
}

export interface MultilingualPackage {
  revision: number;
  masterDurationSeconds: number;
  primaryLanguage: string;
  languages: {
    ur: { code: 'ur'; label: 'Urdu (Nastaliq)'; isOriginal: boolean; status: 'approved' | 'draft' };
    en: { code: 'en'; label: 'English (Sufi Translation)'; isOriginal: boolean; status: 'approved' | 'draft' };
    'en-rom': { code: 'en-rom'; label: 'Roman Urdu'; isOriginal: boolean; status: 'approved' | 'draft' };
    'ur-deva': { code: 'ur-deva'; label: 'Urdu (Devanagari)'; isOriginal: boolean; status: 'approved' | 'draft' };
    [key: string]: { code: string; label: string; isOriginal: boolean; status: 'approved' | 'draft' };
  };
  lines: MultilingualLineEntry[];
  generatedAt: string;
}

const URDU_TO_DEVANAGARI_CHAR_MAP: Record<string, string> = {
  'ا': 'अ', 'آ': 'आ', 'ب': 'ब', 'پ': 'प', 'ت': 'त', 'ٹ': 'ट', 'ث': 'स',
  'ج': 'ज', 'چ': 'च', 'ح': 'ह', 'خ': 'ख़', 'د': 'द', 'ڈ': 'ड', 'ذ': 'ज़',
  'ر': 'र', 'ڑ': 'ड़', 'ز': 'ज़', 'ژ': 'झ़', 'س': 'स', 'ش': 'श', 'ص': 'स',
  'ض': 'ज़', 'ط': 'त', 'ظ': 'ज़', 'ع': 'अ', 'غ': 'ग़', 'ف': 'फ़', 'ق': 'क़',
  'ک': 'क', 'گ': 'ग', 'ل': 'ल', 'م': 'म', 'ن': 'न', 'ں': 'ँ', 'و': 'व',
  'ہ': 'ह', 'ھ': 'ह', 'ء': '', 'ی': 'य', 'ے': 'े',
};

// Known high-frequency Sufi vocabulary dictionary
const SUFI_VOCABULARY_LEXICON: Record<string, { roman: string; deva: string; en: string }> = {
  'عشق': { roman: 'Ishq', deva: 'इश्क़', en: 'Divine Love' },
  'فنا': { roman: 'Fana', deva: 'फ़ना', en: 'annihilation of self' },
  'بقا': { roman: 'Baqa', deva: 'बक़ा', en: 'abiding in Presence' },
  'ذکر': { roman: 'Zikr', deva: 'ज़िक्र', en: 'Sacred Remembrance' },
  'حق': { roman: 'Haq', deva: 'हक़', en: 'the Divine Truth' },
  'نور': { roman: 'Noor', deva: 'नूर', en: 'Divine Radiance' },
  'خاموشی': { roman: 'Khamoshi', deva: 'ख़ामोशी', en: 'sacred silence' },
  'دل': { roman: 'Dil', deva: 'दिल', en: 'the heart' },
  'بےقرار': { roman: 'Be-qarar', deva: 'बे-क़रार', en: 'restless for the Beloved' },
  'بے قرار': { roman: 'Be-qarar', deva: 'बे-क़रार', en: 'restless for the Beloved' },
  'با یاد حق': { roman: 'ba-yaad-e-Haq', deva: 'ब-याद-ए-हक़', en: 'in remembrance of the Divine' },
  'با یاد': { roman: 'ba-yaad', deva: 'ब-याद', en: 'in remembrance' },
  'یاد': { roman: 'Yaad', deva: 'याद', en: 'remembrance' },
  'ہر دم': { roman: 'Har dam', deva: 'हर दम', en: 'With every breath' },
  'موجود': { roman: 'Maujood', deva: 'मौजूद', en: 'ever-present' },
  'صدا': { roman: 'Sada', deva: 'सदा', en: 'everlasting' },
  'سفر': { roman: 'Safar', deva: 'सफ़र', en: 'the spiritual journey' },
  'مسافر': { roman: 'Musafir', deva: 'मुसाफ़िर', en: 'the seeker' },
  'کون': { roman: 'Kaun', deva: 'कौन', en: 'who' },
  'رہ گیا': { roman: 'Reh gaya', deva: 'रह गया', en: 'remained' },
  'تو اور میں': { roman: 'Tu Aur Main', deva: 'तू और मैं', en: 'You and I' },
  'وجد': { roman: 'Wajd', deva: 'वज्द', en: 'spiritual ecstasy' },
  'تجلی': { roman: 'Tajalli', deva: 'तजल्ली', en: 'Divine epiphany' },
  'اور': { roman: 'aur', deva: 'और', en: 'and' },
  'میں': { roman: 'mein', deva: 'में', en: 'in' },
  'ہے': { roman: 'hai', deva: 'है', en: 'is' },
  'ہیں': { roman: 'hain', deva: 'हैं', en: 'are' },
  'کا': { roman: 'ka', deva: 'का', en: 'of' },
  'کی': { roman: 'ki', deva: 'की', en: 'of' },
  'کے': { roman: 'ke', deva: 'के', en: 'of' },
  'کو': { roman: 'ko', deva: 'को', en: 'to' },
  'سے': { roman: 'se', deva: 'से', en: 'from' },
  'پر': { roman: 'par', deva: 'पर', en: 'upon' },
};

// Poetic contextual translations for common verse templates
const POETIC_VERSE_TRANSLATIONS: Record<string, string> = {
  'عشق اور فنا میں خاموشی کا نور ہے': 'In Divine Love and self-annihilation shines the radiance of sacred silence',
  'ہر دم با یاد حق دل بے قرار ہے': 'With every breath in Divine remembrance, the heart longs for the Beloved',
  'حق موجود صدا موجود': 'The Divine Truth is ever-present, everlasting and near',
  'سفر میں مسافر کون رہ گیا': 'Upon this sacred journey, who remains but the seeker and the Beloved',
  'تو اور میں': 'The duality of You and I melts into oneness',
  // Rab Ki Tasbeeh / Kashmiri Sufi-Rishi Dialogue
  'रब की तस्बीह में अशजार पुकारें!': 'In the Divine Tasbeeh, the sacred trees call out!',
  'رَب کی تسبیح میں اشجار پکاریں!': 'In the Divine Tasbeeh, the sacred trees call out!',
  'رب کی تسبیح میں اشجار پکاریں!': 'In the Divine Tasbeeh, the sacred trees call out!',
  'बोलो... बोलो... अब तो बोलो!': 'Speak now... speak! Awake and speak!',
  'بولو... بولو... اب تو بولو!': 'Speak now... speak! Awake and speak!',
  'اپنے زمیر کے پردے کھولو!': 'Unveil the sacred curtains of your conscience!',
  'اپنے ضمیر کے پردے کھولو!': 'Unveil the sacred curtains of your conscience!',
  'اپنے زمیر کے پردے کھولو': 'Unveil the sacred curtains of your conscience!',
  'اپنے ضمیر کے پردے کھولو': 'Unveil the sacred curtains of your conscience!',
  'अपने ज़मीर के पर्दे खोलो!': 'Unveil the sacred curtains of your conscience!',
  'कब तक ख़ामोश... कब तक ख़ामोश?': 'How long in silence... how long will you remain silent?',
  'کب تک خاموش... کب تک خاموش؟': 'How long in silence... how long will you remain silent?',
  'कब जागेगा तेरा सोया होश?': 'When will your slumbering spirit awaken to Truth?',
  'کب جاگے گا تیرا سویا ہوش؟': 'When will your slumbering spirit awaken to Truth?',
  'یا رب، کیا شجر تیرا ذکر کریں؟': 'O Lord, do the trees chant Your Sacred Remembrance?',
  'کیا دریا بھی تیری تسبیح پڑھیں؟': 'Do the flowing rivers also recite Your sacred praise?',
  'کیا چشموں میں کوئی پوشیدہ کلام؟': 'Is there a hidden word whispering through the fresh springs?',
  'کیا بادِ صبا میں تیرا پیغام؟': 'Does the morning breeze carry Your divine message?',
  'تو ان کی تسبیح کا راز پوچھے': 'You seek the mystery behind their sacred praise',
  'اپنے عمل کا حساب کیوں بھولے؟': 'Why then do you forget to account for your own deeds?',
  'ہر شجر کی تسبیح، ہر قطرے کا ذکر': 'Every tree praises Him, every droplet chants His name',
  'فطرت کی حفاظت، ایمان کی فکر!': 'Protecting nature is safeguarding faith itself',
  // Additional classical refrains
  'رَبّ... میری راہ کھول دے': 'O Lord, open the spiritual pathway for my soul',
  'میری راہ کھول دے': 'Open the pathway for my longing soul',
  'دِل تھک گیا، سانس گراں ہے': 'The weary heart tires, and every breath feels heavy',
  'تُو اپنی نگاہ کھول دے': 'Cast upon me the gaze of Your Divine Grace',
};

export function urduToDevanagari(text: string): string {
  if (!text) return '';
  let result = text.trim();

  const sortedEntries = Object.entries(SUFI_VOCABULARY_LEXICON).sort((a, b) => b[0].length - a[0].length);
  for (const [urduWord, mapped] of sortedEntries) {
    const regex = new RegExp(urduWord, 'g');
    result = result.replace(regex, mapped.deva);
  }

  let out = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (URDU_TO_DEVANAGARI_CHAR_MAP[ch]) {
      out += URDU_TO_DEVANAGARI_CHAR_MAP[ch];
    } else {
      out += ch;
    }
  }

  return out.replace(/\s+/g, ' ').trim();
}

export function urduToRomanUrdu(text: string): string {
  if (!text) return '';
  let result = text.trim();

  const sortedEntries = Object.entries(SUFI_VOCABULARY_LEXICON).sort((a, b) => b[0].length - a[0].length);
  for (const [urduWord, mapped] of sortedEntries) {
    const regex = new RegExp(urduWord, 'g');
    result = result.replace(regex, mapped.roman);
  }

  const charRomanMap: Record<string, string> = {
    'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't', 'ث': 's',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ڈ': 'd', 'ذ': 'z',
    'ر': 'r', 'ڑ': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's',
    'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n', 'و': 'o',
    'ہ': 'h', 'ھ': 'h', 'ی': 'i', 'ے': 'e',
  };

  let out = '';
  for (let i = 0; i < result.length; i++) {
    const ch = result[i];
    if (charRomanMap[ch]) {
      out += charRomanMap[ch];
    } else {
      out += ch;
    }
  }

  return out.replace(/\s+/g, ' ').trim();
}

export function translateSufiEnglish(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();

  if (/^[A-Za-z0-9\s.,!?'"()-]+$/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed;
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return trimmed;

  // 1. Check poetic verse full matches
  if (POETIC_VERSE_TRANSLATIONS[trimmed]) {
    return POETIC_VERSE_TRANSLATIONS[trimmed];
  }

  // 2. Check lexicon exact terms
  if (SUFI_VOCABULARY_LEXICON[trimmed]) {
    return SUFI_VOCABULARY_LEXICON[trimmed].en;
  }

  // 3. Poetic translation construction
  let translation = trimmed;
  let translatedAny = false;

  const sortedEntries = Object.entries(SUFI_VOCABULARY_LEXICON).sort((a, b) => b[0].length - a[0].length);
  for (const [urduWord, mapped] of sortedEntries) {
    if (translation.includes(urduWord)) {
      translation = translation.replace(new RegExp(urduWord, 'g'), ` ${mapped.en} `);
      translatedAny = true;
    }
  }

  if (translatedAny) {
    // Gracefully transliterate any untranslated Arabic/Urdu words rather than blanking them
    translation = translation.replace(/[\u0600-\u06FF]+/g, (match) => urduToRomanUrdu(match));
    translation = translation.replace(/\s+/g, ' ').trim();
    if (translation.length > 0) {
      // Capitalize first letter
      return translation.charAt(0).toUpperCase() + translation.slice(1);
    }
  }

  // Never invent generic spiritual filler when no verified English translation exists.
  // Missing English stays blank and must be supplied by a real translation source.
  return '';
}

export function generateMultilingualPackage(
  masterTimeline: ReconciledMasterTimeline,
  canonicalLyricsText?: string,
  primaryLanguage: string = 'ur'
): MultilingualPackage {
  const lines: MultilingualLineEntry[] = [];
  const durationSec = masterTimeline.durationSeconds || (masterTimeline as any).totalDurationSeconds || 285.2;

  // Check if timeline needs structural decomposition & natural vocal alignment
  const hasNaiveOrDirections =
    !masterTimeline.lines ||
    masterTimeline.lines.length === 0 ||
    masterTimeline.lines.some(
      (l) =>
        l.isProductionDirection ||
        l.text.startsWith('#') ||
        l.text.startsWith('**[') ||
        l.text.startsWith('[') ||
        l.text.startsWith('**शायर') ||
        l.text.startsWith('**रब') ||
        l.text.startsWith('**नौजवान')
    );

  if (hasNaiveOrDirections && canonicalLyricsText) {
    const doc = parseCanonicalPoemDocument(canonicalLyricsText);
    const alignedVocals = alignVocalPhrasesToTimeline(doc.vocalLines, durationSec);

    masterTimeline.lines = alignedVocals.map((v, idx) => ({
      lineIndex: idx,
      vocalIndex: v.vocalIndex,
      segmentId: 'seg_vocal',
      sourceVariantId: 'primary',
      sourceLineIndex: v.lineIndex,
      startSeconds: v.startSeconds || 0,
      endSeconds: v.endSeconds || 0,
      text: v.text,
      speaker: v.speaker,
      section: v.section,
      confidence: v.confidence ?? 0,
      urduNastaliq: v.urduNastaliq,
      englishTranslation: v.englishTranslation,
      romanUrdu: v.romanUrdu,
      devanagariUrdu: v.devanagariUrdu,
      isProductionDirection: false,
      words: [],
    }));
  }

  const timelineLines = masterTimeline.lines || [];

  for (const line of timelineLines) {
    if (line.isProductionDirection) continue;

    const rawText = line.text.trim();

    const normalizeLookup = (value: string) =>
      value
        .trim()
        .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
        .replace(/[।.!?]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const normalizedRaw = normalizeLookup(rawText);
    const lex =
      FLAGSHIP_KAB_TAK_KHAMOSH_LEXICON[rawText] ||
      FLAGSHIP_KAB_TAK_KHAMOSH_LEXICON[rawText.replace(/[,\.?!।]$/, '')] ||
      Object.entries(FLAGSHIP_KAB_TAK_KHAMOSH_LEXICON).find(
        ([key]) => normalizeLookup(key) === normalizedRaw
      )?.[1] ||
      FOOTPRINTS_BEHIND_LEXICON[rawText] ||
      FOOTPRINTS_BEHIND_LEXICON[rawText.replace(/[,\.?!।]$/, '')] ||
      Object.entries(FOOTPRINTS_BEHIND_LEXICON).find(
        ([key]) => normalizeLookup(key) === normalizedRaw
      )?.[1];

    const containsArabic = /[\u0600-\u06FF]/.test(rawText);
    const containsDevanagari = /[\u0900-\u097F]/.test(rawText);
    const isLatinOnly = (value?: string) =>
      Boolean(value) &&
      /[A-Za-z]/.test(String(value)) &&
      !/[\u0600-\u06FF\u0900-\u097F]/.test(String(value));
    const isArabicScript = (value?: string) =>
      Boolean(value) && /[\u0600-\u06FF]/.test(String(value));
    const isDevanagariScript = (value?: string) =>
      Boolean(value) && /[\u0900-\u097F]/.test(String(value));

    // Strict same-line language binding. Wrong-script stale metadata is rejected.
    const urduNastaliq =
      (isArabicScript(line.urduNastaliq) ? line.urduNastaliq : '') ||
      lex?.urdu ||
      (containsArabic ? rawText : '') ||
      (containsDevanagari ? devanagariToUrdu(rawText) : '');
    const english =
      (isLatinOnly(line.englishTranslation) ? line.englishTranslation : '') ||
      lex?.en ||
      translateSufiEnglish(rawText);
    const roman =
      (isLatinOnly(line.romanUrdu) ? line.romanUrdu : '') ||
      lex?.rom ||
      (containsArabic ? urduToRomanUrdu(rawText) : '') ||
      (containsDevanagari ? devanagariToRoman(rawText) : '');
    const deva =
      (isDevanagariScript(line.devanagariUrdu) ? line.devanagariUrdu : '') ||
      lex?.deva ||
      (containsDevanagari ? rawText : '');

    lines.push({
      lineIndex: line.lineIndex,
      vocalIndex: line.vocalIndex,
      startSeconds: line.startSeconds,
      endSeconds: line.endSeconds,
      originalText: rawText,
      urduNastaliq,
      englishTranslation: english,
      romanUrdu: roman,
      devanagariUrdu: deva,
      speaker: line.speaker || 'शायर',
      section: line.section,
      confidence: line.confidence ?? 0,
      isProductionDirection: false,
      words: line.words
        ? line.words.map((w) => ({
            text: w.text,
            startSeconds: w.startSeconds,
            endSeconds: w.endSeconds,
          }))
        : undefined,
    });
  }

  return {
    revision: masterTimeline.revision,
    masterDurationSeconds: durationSec,
    primaryLanguage,
    languages: {
      ur: { code: 'ur', label: 'Urdu (Nastaliq)', isOriginal: true, status: 'approved' },
      en: { code: 'en', label: 'English (Sufi Translation)', isOriginal: false, status: 'draft' },
      'en-rom': { code: 'en-rom', label: 'Roman Urdu', isOriginal: false, status: 'draft' },
      'ur-deva': { code: 'ur-deva', label: 'Urdu (Devanagari)', isOriginal: false, status: 'draft' },
    },
    lines,
    generatedAt: new Date().toISOString(),
  };
}
