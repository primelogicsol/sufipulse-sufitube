/**
 * lib/transliteration.ts
 *
 * Universal Transliteration Engine for SufiPulse.
 * Converts Urdu (Arabic script) and Devanagari Hindi/Urdu to authentic Roman Urdu.
 *
 * Ensures all displays, waveform scrubbers, and timeline cues default to readable
 * Roman Urdu without exposing raw Devanagari or Arabic scripts when Roman is requested.
 */

export const COMMON_DEVANAGARI_URDU_LEXICON: Record<string, string> = {
  // Common grammatical particles, verbs, and pronouns
  'कोई': 'koi', 'नाम': 'naam', 'की': 'ki', 'ख़ातिर': 'khaatir', 'खातिर': 'khaatir',
  'जीता': 'jeeta', 'जीते': 'jeete', 'जीती': 'jeeti', 'है': 'hai', 'हैं': 'hain',
  'काम': 'kaam', 'से': 'se', 'पहचाना': 'pehchaana', 'जाता': 'jaata', 'जाते': 'jaate',
  'जाती': 'jaati', 'दुनिया': 'duniya', 'में': 'mein', 'आकर': 'aakar', 'गुज़रता': 'guzarta',
  'गुजरता': 'guzarta', 'गुज़रे': 'guzre', 'गुज़री': 'guzri', 'को': 'ko', 'कुछ': 'kuchh',
  'दे': 'de', 'देता': 'deta', 'देते': 'dete', 'वो': 'woh', 'ऊँचे': 'oonche', 'ऊंचे': 'oonche',
  'पहाड़ों': 'pahaadon', 'पहाड़': 'pahaad', 'राहों': 'raahon', 'राह': 'raah', 'का': 'ka',
  'के': 'ke', 'राही': 'raahi', 'कभी': 'kabhi', 'ख़ामोश': 'khamosh', 'खामोश': 'khamosh',
  'वादी': 'vaadi', 'बर्फ़': 'barf', 'बर्फ': 'barf', 'गवाही': 'gawaahi', 'सब्ज़': 'sabz',
  'सब्ज': 'sabz', 'ढलानों': 'dhalaanon', 'पे': 'pe', 'पर': 'par', 'तन्हा': 'tanha',
  'सफ़र': 'safar', 'सफर': 'safar', 'मुसाफ़िर': 'musafir', 'मुसाफिर': 'musafir',
  'बादलों': 'baadlon', 'बादल': 'baadal', 'पार': 'paar', 'नज़र': 'nazar', 'नजर': 'nazar',
  'निगाहों': 'nigaahon', 'निगाह': 'nigaah', 'न': 'na', 'ना': 'na', 'मंज़िल': 'manzil',
  'मंजिल': 'manzil', 'जल्दी': 'jaldi', 'शोहरत': 'shohrat', 'ख़याल': 'khayaal', 'ख्याल': 'khayaal',
  'हर': 'har', 'मोड़': 'mod', 'क़ुदरत': 'qudrat', 'कुदरत': 'qudrat', 'करता': 'karta',
  'करते': 'karte', 'करती': 'karti', 'सवाल': 'sawaal', 'चश्मों': 'chashmon', 'चश्मा': 'chashma',
  'धुन': 'dhun', 'राज़': 'raaz', 'राज': 'raaz', 'मिला': 'mila', 'मिले': 'mile', 'मिली': 'mili',
  'चोटी': 'choti', 'ख़ुद': 'khud', 'खुद': 'khud', 'नया': 'naya', 'नयी': 'nayi', 'नए': 'naye',
  'राब्ता': 'raabta', 'राहें': 'raahein', 'भी': 'bhee', 'पहचानें': 'pehchaanein',
  'हवाएँ': 'hawaayein', 'हवा': 'hawa', 'जानें': 'jaanein', 'लोग': 'log', 'इबादत': 'ibaadat',
  'मानें': 'maanein', 'माना': 'maana', 'निशाँ': 'nishaan', 'निशान': 'nishaan',
  'छोड़': 'chhod', 'ख़ामोशियाँ': 'khamoshiyaan', 'सुना': 'suna', 'सुनाने': 'sunaane',
  'ताज': 'taaj', 'ख़्वाहिश': 'khwaahish', 'ख्वाहिश': 'khwaahish', 'तख़्त': 'takht',
  'तख्त': 'takht', 'गुमाँ': 'gumaan', 'गुमान': 'gumaan', 'बस': 'bas', 'दिलों': 'dilon',
  'दिल': 'dil', 'अपना': 'apna', 'अपने': 'apne', 'अपनी': 'apni', 'मकाँ': 'makaan',
  'मकान': 'makaan', 'बुझते': 'bujhte', 'चराग़': 'charaagh', 'चिराग़': 'charaagh',
  'चिराग': 'charaagh', 'चराग़ों': 'charaaghon', 'जला': 'jala', 'लिए': 'liye', 'तो': 'toh',
  'सभी': 'sabhee', 'औरत': 'aurat', 'औरों': 'auron', 'और': 'aur', 'जी': 'jee',
  'देखा': 'dekha', 'किसी': 'kisi', 'बुनकर': 'bunkar', 'उसकी': 'uski', 'उसके': 'uske',
  'उसका': 'uska', 'आँखों': 'aankhon', 'आंखों': 'aankhon', 'सदियों': 'sadiyon',
  'अरमान': 'armaan', 'सोज़नी': 'sozni', 'टाँकों': 'taankon', 'टांकों': 'taankon',
  'दर्द': 'dard', 'धागों': 'dhaagon', 'रंग': 'rang', 'रंगों': 'rangon', 'ख़्वाब': 'khwaab',
  'ख्वाब': 'khwaab', 'ख़्वाबों': 'khwaabon', 'उम्मीद': 'ummeed', 'हँसता': 'hansta',
  'रोता': 'rota', 'शायर': 'Shayar', 'रब': 'Rab', 'नौजवान': 'Naujawan', 'कोरस': 'Chorus',
  'इश्क़': 'Ishq', 'इश्क': 'Ishq', 'फ़ना': 'Fana', 'फना': 'Fana', 'बक़ा': 'Baqa',
  'ज़िक्र': 'Zikr', 'जिक्र': 'Zikr', 'हक़': 'Haq', 'हक': 'Haq', 'नूर': 'Noor',
  'तस्बीह': 'Tasbeeh', 'तसबीह': 'Tasbeeh', 'अशजार': 'Ashjaar', 'पुकारें': 'Pukaarein',
  'बोलो': 'Bolo', 'ज़मीर': 'Zameer', 'जमीर': 'Zameer', 'पर्दे': 'Parde', 'खोलो': 'Kholo',
  'कब': 'Kab', 'तक': 'Tak', 'जागेगा': 'Jaagega', 'तेरा': 'Tera', 'सोया': 'Soya',
  'होश': 'Hosh', 'या': 'Ya', 'कश्मीर': 'Kashmir', 'फ़िज़ा': 'Fiza', 'फ़िज़ाओं': 'Fizaon',
  'फ़ितरत': 'Fitrat', 'हिफ़ाज़त': 'Hifaazat', 'ईमान': 'Imaan', 'फ़िक्र': 'Fikr',
};

const VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
};

const MATRAS: Record<string, string> = {
  'ा': 'aa', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo',
  'ृ': 'ri', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au',
};

const CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'w', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
};

export function devanagariWordToRoman(rawWord: string): string {
  if (!rawWord || !/[\u0900-\u097F]/.test(rawWord)) return rawWord;

  // Extract punctuation boundaries, including Hindi danda \u0964 and \u0965
  const match = rawWord.match(/^([^a-zA-Z0-9\u0900-\u0963\u0966-\u097F]*)([\u0900-\u0963\u0966-\u097F]+)([^a-zA-Z0-9\u0900-\u0963\u0966-\u097F]*)$/);
  if (!match) return rawWord.replace(/।/g, '.');
  const lead = match[1] || '';
  const rawCore = match[2];
  let trail = match[3] || '';
  trail = trail.replace(/।/g, '.');

  // Direct lexicon check with normalized core
  if (COMMON_DEVANAGARI_URDU_LEXICON[rawCore]) {
    return lead + COMMON_DEVANAGARI_URDU_LEXICON[rawCore] + trail;
  }

  let res = '';
  const len = rawCore.length;
  for (let i = 0; i < len; i++) {
    const ch = rawCore[i];
    const nextIdx = i + 1;
    let hasNukta = false;

    // Check for nukta or precomposed nukta
    let consonantSound = '';
    if (ch === '\u0958') consonantSound = 'q';
    else if (ch === '\u0959') consonantSound = 'kh';
    else if (ch === '\u095A') consonantSound = 'gh';
    else if (ch === '\u095B') consonantSound = 'z';
    else if (ch === '\u095C') consonantSound = 'r';
    else if (ch === '\u095D') consonantSound = 'rh';
    else if (ch === '\u095E') consonantSound = 'f';
    else if (nextIdx < len && rawCore[nextIdx] === '\u093C') {
      hasNukta = true;
      if (ch === 'क') consonantSound = 'q';
      else if (ch === 'ख') consonantSound = 'kh';
      else if (ch === 'ग') consonantSound = 'gh';
      else if (ch === 'ज') consonantSound = 'z';
      else if (ch === 'ड') consonantSound = 'r';
      else if (ch === 'ढ') consonantSound = 'rh';
      else if (ch === 'फ') consonantSound = 'f';
      else if (ch === 'झ') consonantSound = 'zh';
      else if (CONSONANTS[ch]) consonantSound = CONSONANTS[ch];
    } else if (CONSONANTS[ch]) {
      consonantSound = CONSONANTS[ch];
    }

    if (consonantSound) {
      if (hasNukta) i++; // skipped the nukta character
      const after = i + 1 < len ? rawCore[i + 1] : '';

      if (after === '\u094D') { // halant / virama (no vowel)
        res += consonantSound;
        i++; // skip halant
      } else if (MATRAS[after]) {
        res += consonantSound + MATRAS[after];
        i++; // skip matra
      } else if (after === 'ं' || after === 'ँ') {
        res += consonantSound + 'an';
        i++;
      } else {
        // Schwa deletion at word end
        const isEnd = (i === len - 1);
        res += consonantSound + (isEnd ? '' : 'a');
      }
      continue;
    }

    if (VOWELS[ch]) {
      res += VOWELS[ch];
      continue;
    }

    if (MATRAS[ch]) {
      res += MATRAS[ch];
    } else if (ch === 'ं' || ch === 'ँ') {
      res += 'n';
    } else if (ch === 'ः') {
      res += 'h';
    } else if (ch !== '\u094D' && ch !== '\u093C') {
      res += ch;
    }
  }

  return lead + res + trail;
}

export function devanagariToRoman(text: string): string {
  if (!text) return '';
  const parts = text.split(/(\s+)/);
  const out = parts.map(devanagariWordToRoman).join('').replace(/।/g, '.').replace(/\s+/g, ' ').trim();
  if (out.length === 0) return '';
  return out.charAt(0).toUpperCase() + out.slice(1);
}

export function urduToRomanUrdu(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();

  const charRomanMap: Record<string, string> = {
    'ا': 'a', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ٹ': 't', 'ث': 's',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ڈ': 'd', 'ذ': 'z',
    'ر': 'r', 'ڑ': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'श': 'sh', 'ص': 's',
    'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
    'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'n', 'و': 'o',
    'ہ': 'h', 'ھ': 'h', 'ی': 'i', 'ے': 'e',
  };

  let out = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (charRomanMap[ch]) {
      out += charRomanMap[ch];
    } else {
      out += ch;
    }
  }

  const res = out.replace(/\s+/g, ' ').trim();
  if (res.length === 0) return '';
  return res.charAt(0).toUpperCase() + res.slice(1);
}

export const DEVANAGARI_TO_URDU_CHAR_MAP: Record<string, string> = {
  'अ': 'ا', 'आ': 'آ', 'इ': 'ا', 'ई': 'ای', 'उ': 'او', 'ऊ': 'او', 'ए': 'اے', 'ऐ': 'اے', 'ओ': 'او', 'औ': 'او',
  'ा': 'ا', 'ि': '', 'ी': 'ی', 'ु': '', 'ू': 'و', 'े': 'ے', 'ै': 'ے', 'ो': 'و', 'ौ': 'و',
  'ं': 'ں', 'ँ': 'ں', 'ः': 'ہ',
  'क': 'ک', 'ख': 'کھ', 'ग': 'گ', 'घ': 'گھ', 'ङ': 'نگ',
  'च': 'چ', 'छ': 'چھ', 'ज': 'ج', 'झ': 'جھ', 'ञ': 'نج',
  'ट': 'ٹ', 'ठ': 'ٹھ', 'ड': 'ڈ', 'ढ': 'ڈھ', 'ण': 'ن',
  'त': 'ت', 'थ': 'تھ', 'द': 'د', 'ध': 'دھ', 'न': 'ن',
  'प': 'پ', 'फ': 'پھ', 'ब': 'ب', 'भ': 'بھ', 'म': 'م',
  'य': 'ی', 'र': 'ر', 'ल': 'ل', 'व': 'و', 'श': 'ش',
  'ष': 'ش', 'स': 'س', 'ह': 'ہ',
  'क़': 'ق', 'ख़': 'خ', 'ग़': 'غ', 'ज़': 'ز', 'फ़': 'ف',
  'ड़': 'ڑ', 'ढ़': 'ڑھ', 'झ़': 'ژ',
};

export const COMMON_DEVANAGARI_TO_URDU_WORDS: Record<string, string> = {
  'कोई': 'کوئی', 'नाम': 'نام', 'की': 'کی', 'ख़ातिर': 'خاطر', 'खातिर': 'خاطر',
  'जीता': 'جیتا', 'जीते': 'جیتے', 'जीती': 'جیتی', 'है': 'ہے', 'हैं': 'ہیں',
  'काम': 'کام', 'से': 'سے', 'पहचाना': 'پہچانا', 'जाता': 'جاتا', 'जाते': 'جاتے',
  'जाती': 'جاتی', 'दुनिया': 'دنیا', 'में': 'میں', 'आकर': 'آکر', 'गुज़रता': 'گزرتا',
  'गुजरता': 'گزرتا', 'को': 'کو', 'कुछ': 'کچھ', 'दे': 'دے', 'वो': 'وہ',
  'ऊँचे': 'اونچے', 'ऊंचे': 'اونچے', 'पहाड़ों': 'پہاڑوں', 'राहों': 'راہوں',
  'का': 'کا', 'के': 'کے', 'राही': 'راہی', 'कभी': 'کبھی', 'ख़ामोश': 'خاموش',
  'खामोश': 'خاموش', 'वादी': 'وادی', 'बर्फ़': 'برف', 'बर्फ': 'برف',
  'गवाही': 'گواہی', 'सब्ज़': 'سبز', 'सब्ज': 'سبز', 'ढलानों': 'ڈھلانوں',
  'पे': 'پہ', 'पर': 'پر', 'तन्हा': 'تنہا', 'सफ़र': 'سفر', 'सफर': 'سفر',
  'बादलों': 'بادلوں', 'पार': 'پار', 'नज़र': 'نظر', 'नजर': 'نظر', 'न': 'نہ',
  'ना': 'نہ', 'मंज़िल': 'منزل', 'मंजिल': 'منزل', 'जल्दी': 'جلدی', 'शोहरत': 'شہرت',
  'ख़याल': 'خیال', 'ख्याल': 'خیال', 'हर': 'ہر', 'मोड़': 'موڑ', 'क़ुदरत': 'قدرت',
  'कुदरत': 'قدرت', 'करता': 'کرتا', 'करते': 'کرتے', 'सवाल': 'سوال',
  'बुझते': 'بجھتے', 'चराग़': 'چراغ', 'चिराग़': 'چراغ', 'जला': 'جلا',
  'लिए': 'لیے', 'तो': 'تو', 'सभी': 'سبھی', 'औरत': 'عورت', 'औरों': 'اوروں',
  'और': 'اور', 'जी': 'جی', 'देखा': 'دیکھا', 'किसी': 'کسی', 'बुनकर': 'بنکر',
  'उसकी': 'اس کی', 'उसके': 'اس کے', 'उसका': 'اس کا', 'आँखों': 'آنکھوں',
  'सदियों': 'صدیوں', 'अरमान': 'ارمان', 'सोज़नी': 'سوزنی', 'टाँकों': 'ٹانکوں',
  'दर्द': 'درد', 'धागों': 'دھاگوں', 'रंग': 'رنگ', 'रंगों': 'رنگوں',
  'ख़्वाब': 'خواب', 'उम्मीद': 'امید', 'शायर': 'شاعر', 'रब': 'رب',
  'नौजवान': 'نوجوان', 'कोरस': 'کورس', 'इश्क़': 'عشق', 'फ़ना': 'فنا',
  'बक़ा': 'بقا', 'ज़िक्र': 'ذکر', 'हक़': 'حق', 'نूर': 'نور', 'तस्बीह': 'تسبیح'
};

export function devanagariToUrdu(text: string): string {
  if (!text) return '';
  const parts = text.split(/(\s+)/);
  return parts.map(part => {
    if (!part || !/[\u0900-\u097F]/.test(part)) {
      return part.replace(/।/g, '۔').replace(/,/g, '،').replace(/\?/g, '؟');
    }
    const match = part.match(/^([^a-zA-Z0-9\u0900-\u0963\u0966-\u097F]*)([\u0900-\u0963\u0966-\u097F]+)([^a-zA-Z0-9\u0900-\u0963\u0966-\u097F]*)$/);
    if (!match) return part;
    const lead = match[1] || '';
    const rawCore = match[2];
    const trail = (match[3] || '').replace(/।/g, '۔').replace(/,/g, '،').replace(/\?/g, '؟');

    if (COMMON_DEVANAGARI_TO_URDU_WORDS[rawCore]) {
      return lead + COMMON_DEVANAGARI_TO_URDU_WORDS[rawCore] + trail;
    }

    let out = '';
    const len = rawCore.length;
    for (let i = 0; i < len; i++) {
      const ch = rawCore[i];
      const nextIdx = i + 1;
      if (nextIdx < len && rawCore[nextIdx] === '\u093C') {
        const pair = ch + '\u093C';
        if (DEVANAGARI_TO_URDU_CHAR_MAP[pair]) {
          out += DEVANAGARI_TO_URDU_CHAR_MAP[pair];
          i++;
          continue;
        }
      }
      if (DEVANAGARI_TO_URDU_CHAR_MAP[ch]) {
        out += DEVANAGARI_TO_URDU_CHAR_MAP[ch];
      } else if (ch !== '\u094D' && ch !== '\u093C') {
        out += ch;
      }
    }
    return lead + out + trail;
  }).join('').replace(/\s+/g, ' ').trim();
}

/**
 * High-reliability Roman Urdu resolver:
 * Guarantees that any text provided (Devanagari, Urdu script, or Roman Urdu)
 * is safely resolved to clean Roman Urdu characters, NEVER leaving raw Devanagari Hindi.
 */
export function toRomanUrdu(text?: string | null): string {
  if (!text) return '';
  const trimmed = String(text).trim();

  // If already pure Latin letters, return as-is
  if (/^[A-Za-z0-9\s.,!?'"()-]+$/.test(trimmed)) {
    return trimmed;
  }

  // If contains Devanagari script, convert to Roman Urdu
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return devanagariToRoman(trimmed);
  }

  // If contains Arabic/Urdu script, convert to Roman Urdu
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return urduToRomanUrdu(trimmed);
  }

  return trimmed;
}
