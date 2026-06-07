/**
 * SUFIPULSE GOLD DATASET REPAIR SCRIPT
 * Phase 2.5 — Applies all repairs in one pass
 * 
 * Repairs:
 * 1. Schema fields (alternateNames, attributionStatus, compositionType)
 * 2. Language linkage (languageIds[])
 * 3. Region linkage (regionIds[])
 * 4. Duplicate resolution (merge/differentiate)
 * 5. Relationship repair (orphan reduction)
 */

const fs = require('fs');
const path = require('path');

const SEEDS = path.join(__dirname, '..', 'seeds');

// ─── Load Data ───────────────────────────────────────────────────────
let writers = require(path.join(SEEDS, 'gold_writers.json'));
let singers = require(path.join(SEEDS, 'gold_singers.json'));
let songs   = require(path.join(SEEDS, 'gold_songs.json'));
let concepts = require(path.join(SEEDS, 'gold_concepts.json'));
let languages, regions;

try { languages = require(path.join(SEEDS, 'seed_languages.json')); } catch(e) { console.error('seed_languages.json not found!'); process.exit(1); }
try { regions = require(path.join(SEEDS, 'seed_regions.json')); } catch(e) { console.error('seed_regions.json not found!'); process.exit(1); }

// Build lookup maps
const langMap = {};
languages.forEach(l => { langMap[l.name.toLowerCase()] = l.id; if(l.nativeName) langMap[l.nativeName.toLowerCase()] = l.id; });
const regionMap = {};
regions.forEach(r => { regionMap[r.name.toLowerCase()] = r.id; regionMap[r.slug] = r.id; });

function findLangId(name) {
  const n = name.toLowerCase().trim();
  if (langMap[n]) return langMap[n];
  // Try partial match
  for (const [k, v] of Object.entries(langMap)) {
    if (k.includes(n) || n.includes(k)) return v;
  }
  console.warn('  LANG NOT FOUND: "' + name + '"');
  return null;
}

function findRegionId(name) {
  const n = name.toLowerCase().trim();
  if (regionMap[n]) return regionMap[n];
  for (const [k, v] of Object.entries(regionMap)) {
    if (k.includes(n) || n.includes(k)) return v;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// STEP 1: WRITER REPAIR — alternateNames + languageIds + regionIds
// ═══════════════════════════════════════════════════════════════════
console.log('=== REPAIRING WRITERS ===');

const writerAlternateNames = {
  'writer_000001': ['Rumi', 'Mawlana', 'Mevlana', 'Mevlana Rumi', 'Mawlana Rumi', 'Jalal ad-Din Rumi'],
  'writer_000002': ['Amir Khusrau', 'Amir Khusrow', 'Khusro'],
  'writer_000003': ['Baba Bulleh Shah', 'Bullah Shah', 'Bulleh Shah Ji'],
  'writer_000004': ['Hazrat Sultan Bahu', 'Sultan Bahu', 'Bahoo'],
  'writer_000005': ['Shah Latif', 'Bhittai', 'Shah Sahib'],
  'writer_000006': ['Lalleshwari', 'Lal Arifa', 'Lalla', 'Lal Diddi'],
  'writer_000007': ['Sheikh Nur-ud-din Wali', 'Sheikh ul-Alam', 'Nund Rishi Sahib', 'Alamdar-e-Kashmir'],
  'writer_000008': ['Farid', 'Khwaja Sahib', 'Khawaja Farid'],
  'writer_000009': ['Hafez', 'Khwaja Hafiz', 'Shams al-Din Hafiz', 'Hafez-e Shirazi'],
  'writer_000010': ['Sachal', 'Abdul Wahab Sachal', 'Sarmast'],
  'writer_000011': ['Heer Waris Shah'],
  'writer_000012': ['Madho Lal Hussain', 'Shah Hussain Lahori'],
  'writer_000013': ['Baba Farid', 'Farid ud-Din', 'Sheikh Farid', 'Fariduddin Masud Ganjshakar'],
  'writer_000014': ['Yunus Emre Hazretleri'],
  'writer_000015': ['Hallaj', 'al-Hallaj', 'Hussain ibn Mansur'],
  'writer_000016': ['Rabia', 'Rabia Basri'],
  'writer_000017': ['Ibn al-Arabi', 'Sheikh al-Akbar', 'Muhyi al-Din'],
  'writer_000018': ['Imam Ghazali', 'Ghazzali', 'Algazel'],
  'writer_000019': ['Mulla Jami', 'Jami of Herat'],
  'writer_000020': ['Attar', 'Farid ud-Din Attar'],
  'writer_000021': ['Sanai', 'Sanai Ghaznavi', 'Hakim Sanai of Ghazna'],
  'writer_000022': ['Saadi', "Sa'di", 'Sheikh Saadi'],
  'writer_000023': ['Abdul Rahman', 'Rahman Baba Sahib'],
  'writer_000024': ['Mian Sahib', 'Mian Muhammad Bakhsh Sahib'],
  'writer_000025': ['Sant Kabir', 'Kabir Das', 'Kabir Sahib'],
  'writer_000026': ['Hamza Makhdoom Kashmiri'],
  'writer_000027': ['Muhammad Said Sarmad', 'Sarmad Shaheed'],
  'writer_000028': ['Makhdoom Bilawal Sindhi'],
  'writer_000029': ['Meher Ali Shah', 'Pir Sahib Golra Sharif'],
  'writer_000030': ['Bedil', 'Bedil Dehlavi'],
  'writer_000031': ['Iraqi', 'Fakhr al-Din Iraqi of Hamadan'],
  'writer_000032': ['Shabistari', 'Sheikh Mahmud'],
  'writer_000033': ['Nimatullah', 'Shah Nimatullah'],
  'writer_000034': ['Ayn al-Quzat', 'Ain ul-Quzat'],
  'writer_000035': ['Abu Said', 'Sheikh Abu Saeed'],
  'writer_000036': ['Ghaus ul Azam', 'Pir Dastagir', 'Ghous-e-Azam', 'Jilani'],
  'writer_000037': ['Gharib Nawaz', 'Khwaja Sahib', 'Khwaja Moinuddin'],
  'writer_000038': ['Mehboob-e-Ilahi', 'Hazrat Nizamuddin', 'Sultan ul Auliya'],
  'writer_000039': ['Imam Rabbani', 'Mujaddid Alf-i-Thani'],
  'writer_000040': ['Shah Sahib', 'Qutb ud-Din Ahmad'],
  'writer_000041': ['Data Ganj Bakhsh', 'Data Sahib'],
  'writer_000042': ['al-Qushayri', 'Imam Qushayri'],
  'writer_000043': ['Junayd', 'Sayyid al-Taifa'],
  'writer_000044': ['Dhul-Nun', 'Zul-Nun al-Misri'],
  'writer_000045': ['Abu Yazid', 'Bastami', 'Bayazid'],
  'writer_000046': ['Shams', 'Shams of Tabriz', 'Shams-i Tabrizi'],
  'writer_000047': ['Ahmad-e Ghazali'],
  'writer_000048': ['Hasan Basri', 'al-Hasan'],
  'writer_000049': ['Khushal Khan', 'Khattak'],
  'writer_000050': ['Qalandar Lal', 'Syed Usman Marwandi', 'Jhulelal Qalandar'],
};

// Writer region mapping (name → region slugs)
const writerRegions = {
  'writer_000001': ['balkh', 'konya'],
  'writer_000002': ['delhi'],
  'writer_000003': ['lahore', 'punjab'],
  'writer_000004': ['punjab', 'multan'],
  'writer_000005': ['sindh', 'bhit-shah'],
  'writer_000006': ['kashmir'],
  'writer_000007': ['kashmir'],
  'writer_000008': ['punjab', 'multan'],
  'writer_000009': ['shiraz'],
  'writer_000010': ['sindh'],
  'writer_000011': ['punjab'],
  'writer_000012': ['lahore', 'punjab'],
  'writer_000013': ['punjab', 'pakpattan'],
  'writer_000014': ['anatolia'],
  'writer_000015': ['baghdad'],
  'writer_000016': ['basra'],
  'writer_000017': ['andalusia', 'damascus'],
  'writer_000018': ['khorasan', 'nishapur'],
  'writer_000019': ['herat'],
  'writer_000020': ['nishapur', 'khorasan'],
  'writer_000021': ['ghazna'],
  'writer_000022': ['shiraz'],
  'writer_000023': ['peshawar', 'kpk'],
  'writer_000024': ['azad-kashmir'],
  'writer_000025': ['varanasi'],
  'writer_000026': ['kashmir'],
  'writer_000027': ['delhi'],
  'writer_000028': ['sindh'],
  'writer_000029': ['golra-sharif', 'punjab'],
  'writer_000030': ['delhi'],
  'writer_000031': ['hamadan', 'konya', 'multan'],
  'writer_000032': ['tabriz'],
  'writer_000033': ['aleppo', 'kerman'],
  'writer_000034': ['hamadan'],
  'writer_000035': ['khorasan'],
  'writer_000036': ['baghdad'],
  'writer_000037': ['ajmer', 'sistan'],
  'writer_000038': ['delhi'],
  'writer_000039': ['punjab'],
  'writer_000040': ['delhi'],
  'writer_000041': ['lahore'],
  'writer_000042': ['nishapur'],
  'writer_000043': ['baghdad'],
  'writer_000044': ['cairo'],
  'writer_000045': ['khorasan'],
  'writer_000046': ['tabriz', 'konya'],
  'writer_000047': ['khorasan'],
  'writer_000048': ['basra'],
  'writer_000049': ['kpk', 'peshawar'],
  'writer_000050': ['sindh', 'sehwan'],
};

writers = writers.map(w => {
  // Add alternateNames
  w.alternateNames = writerAlternateNames[w.id] || [];

  // Populate languageIds from existing languages[] string array
  const langIds = [];
  (w.languages || []).forEach(langName => {
    const id = findLangId(langName);
    if (id) langIds.push(id);
  });
  // Writers don't have languageIds in schema — they use languages[] strings
  // But we need to add regionIds
  
  // Populate regionIds
  const regionSlugs = writerRegions[w.id] || [];
  w.regionIds = regionSlugs.map(s => findRegionId(s)).filter(Boolean);
  
  if (w.regionIds.length === 0) {
    console.warn('  Writer ' + w.id + ' (' + w.name + ') — no regions resolved');
  }
  
  return w;
});

console.log('  Writers repaired: ' + writers.length);
console.log('  Writers with regionIds: ' + writers.filter(w => w.regionIds.length > 0).length);

// ═══════════════════════════════════════════════════════════════════
// STEP 2: SINGER REPAIR — alternateNames + languageIds + regionIds
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== REPAIRING SINGERS ===');

const singerAlternateNames = {
  'singer_000001': ['NFAK', 'Ustad Nusrat', 'Khan Sahib'],
  'singer_000002': ['Abida Ji', 'Queen of Sufi Music'],
  'singer_000003': ['Sabri Brothers (elder)'],
  'singer_000004': ['Sabri Brothers (younger)'],
  'singer_000005': ['Aziz Mian Sahib'],
  'singer_000006': ['Rahat Sahib'],
  'singer_000007': ['Pathanay Khan Sahib'],
  'singer_000012': ['Wadali Brothers (elder)'],
  'singer_000013': ['Wadali Brothers (younger)'],
  'singer_000014': ['Reshma Ji'],
  'singer_000015': ['Allan Faqir Sindhi'],
  'singer_000016': ['Sain Zahoor Ahmad'],
  'singer_000019': ['King of Ghazal', 'Mehdi Hassan Khan'],
  'singer_000020': ['Ghulam Ali Khan'],
  'singer_000025': ['Rizwan Ali Khan', 'Muazzam Ali Khan'],
  'singer_000028': ['Bulbul-e-Pakistan'],
  'singer_000030': ['Sher Ali Mehr Ali'],
  'singer_000031': ['Jyoti Nooran', 'Sultana Nooran'],
  'singer_000043': ['Queen of Melody'],
  'singer_000050': ['Hans Raj Hans Ji'],
};

// Singer language mapping
const singerLanguages = {
  'singer_000001': ['punjabi', 'urdu', 'persian', 'hindi', 'braj bhasha'],
  'singer_000002': ['sindhi', 'punjabi', 'saraiki', 'urdu'],
  'singer_000003': ['urdu', 'punjabi', 'persian'],
  'singer_000004': ['urdu', 'punjabi', 'persian'],
  'singer_000005': ['urdu', 'punjabi'],
  'singer_000006': ['urdu', 'punjabi'],
  'singer_000007': ['punjabi', 'saraiki'],
  'singer_000008': ['urdu', 'punjabi', 'sindhi', 'persian'],
  'singer_000009': ['urdu', 'punjabi'],
  'singer_000010': ['persian', 'urdu', 'braj bhasha', 'hindi'],
  'singer_000011': ['persian', 'urdu', 'hindi'],
  'singer_000012': ['punjabi'],
  'singer_000013': ['punjabi'],
  'singer_000014': ['punjabi', 'sindhi', 'urdu'],
  'singer_000015': ['sindhi'],
  'singer_000016': ['punjabi'],
  'singer_000017': ['sindhi', 'saraiki', 'urdu'],
  'singer_000018': ['urdu'],
  'singer_000019': ['urdu'],
  'singer_000020': ['urdu', 'punjabi'],
  'singer_000021': ['urdu', 'punjabi', 'persian'],
  'singer_000022': ['urdu', 'punjabi', 'persian'],
  'singer_000023': ['persian', 'urdu', 'hindi'],
  'singer_000024': ['urdu', 'punjabi'],
  'singer_000025': ['urdu', 'punjabi', 'persian'],
  'singer_000026': ['punjabi', 'saraiki', 'urdu'],
  'singer_000027': ['urdu', 'punjabi'],
  'singer_000028': ['urdu'],
  'singer_000029': ['urdu', 'punjabi'],
  'singer_000030': ['urdu', 'punjabi', 'persian'],
  'singer_000031': ['punjabi'],
  'singer_000032': ['punjabi'],
  'singer_000033': ['punjabi'],
  'singer_000034': ['urdu', 'punjabi'],
  'singer_000035': ['hindi', 'rajasthani'],
  'singer_000036': ['rajasthani', 'hindi', 'sindhi'],
  'singer_000037': ['persian', 'urdu', 'hindi'],
  'singer_000038': ['punjabi'],
  'singer_000039': ['urdu'],
  'singer_000040': ['urdu', 'punjabi'],
  'singer_000041': ['urdu', 'punjabi'],
  'singer_000042': ['urdu', 'punjabi', 'persian'],
  'singer_000043': ['urdu', 'punjabi'],
  'singer_000044': ['sindhi'],
  'singer_000045': ['pashto', 'dari', 'urdu', 'punjabi'],
  'singer_000046': ['punjabi', 'saraiki'],
  'singer_000047': ['urdu', 'punjabi'],
  'singer_000048': ['urdu', 'persian'],
  'singer_000049': ['urdu', 'punjabi'],
  'singer_000050': ['punjabi'],
};

// Singer region mapping
const singerRegions = {
  'singer_000001': ['faisalabad', 'punjab'],
  'singer_000002': ['sindh'],
  'singer_000003': ['karachi', 'sindh'],
  'singer_000004': ['karachi', 'sindh'],
  'singer_000005': ['delhi', 'punjab'],
  'singer_000006': ['faisalabad', 'punjab'],
  'singer_000007': ['punjab', 'rajasthan'],
  'singer_000008': ['hyderabad-sindh', 'sindh'],
  'singer_000009': ['karachi'],
  'singer_000010': ['delhi'],
  'singer_000011': ['delhi'],
  'singer_000012': ['amritsar', 'punjab'],
  'singer_000013': ['amritsar', 'punjab'],
  'singer_000014': ['rajasthan', 'sindh'],
  'singer_000015': ['sindh'],
  'singer_000016': ['punjab'],
  'singer_000017': ['hyderabad-sindh', 'sindh'],
  'singer_000018': ['hyderabad-sindh', 'sindh'],
  'singer_000019': ['rajasthan', 'punjab'],
  'singer_000020': ['hyderabad-sindh', 'sindh'],
  'singer_000021': ['delhi', 'karachi'],
  'singer_000022': ['hyderabad-sindh', 'sindh'],
  'singer_000023': ['delhi'],
  'singer_000024': ['lahore', 'punjab'],
  'singer_000025': ['faisalabad', 'punjab'],
  'singer_000026': ['punjab'],
  'singer_000027': ['punjab'],
  'singer_000028': ['punjab'],
  'singer_000029': ['punjab'],
  'singer_000030': ['punjab'],
  'singer_000031': ['jalandhar', 'punjab'],
  'singer_000032': ['punjab'],
  'singer_000033': ['punjab'],
  'singer_000034': ['lahore', 'punjab'],
  'singer_000035': ['rajasthan'],
  'singer_000036': ['rajasthan'],
  'singer_000037': ['delhi'],
  'singer_000038': ['punjab'],
  'singer_000039': ['lahore', 'punjab'],
  'singer_000040': ['lahore', 'punjab'],
  'singer_000041': ['punjab'],
  'singer_000042': ['lahore', 'punjab'],
  'singer_000043': ['kashmir', 'punjab'],
  'singer_000044': ['sindh'],
  'singer_000045': ['kpk', 'peshawar'],
  'singer_000046': ['punjab'],
  'singer_000047': ['karachi'],
  'singer_000048': ['punjab'],
  'singer_000049': ['punjab'],
  'singer_000050': ['jalandhar', 'punjab'],
};

singers = singers.map(s => {
  s.alternateNames = singerAlternateNames[s.id] || [];
  
  // Populate languageIds
  const sLangs = singerLanguages[s.id] || [];
  s.languageIds = sLangs.map(n => findLangId(n)).filter(Boolean);
  
  // Populate regionIds
  const sRegs = singerRegions[s.id] || [];
  s.regionIds = sRegs.map(n => findRegionId(n)).filter(Boolean);
  
  if (s.languageIds.length === 0) console.warn('  Singer ' + s.id + ' (' + s.name + ') — no languages resolved');
  if (s.regionIds.length === 0) console.warn('  Singer ' + s.id + ' (' + s.name + ') — no regions resolved');
  
  return s;
});

console.log('  Singers repaired: ' + singers.length);
console.log('  Singers with languageIds: ' + singers.filter(s => s.languageIds.length > 0).length);
console.log('  Singers with regionIds: ' + singers.filter(s => s.regionIds.length > 0).length);

// ═══════════════════════════════════════════════════════════════════
// STEP 3: SONG REPAIR — attributionStatus, compositionType, languageIds, regionIds, dedup
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== REPAIRING SONGS ===');

// Song language mapping (based on writer language + performance tradition)
const songLanguageMap = {
  'song_000001': ['persian', 'hindavi'],      // Chaap Tilak - Khusrau macaronic
  'song_000002': ['persian', 'hindavi'],      // Man Kunto Maula
  'song_000003': ['hindavi'],                 // Aaj Rang Hai
  'song_000004': ['urdu'],                    // Tajdar-e-Haram
  'song_000005': ['sindhi', 'punjabi'],       // Dama Dam Mast Qalandar
  'song_000006': ['arabic', 'urdu'],          // Allah Hu
  'song_000007': ['punjabi'],                 // Tere Ishq Nachaya
  'song_000008': ['punjabi'],                 // Bulla Ki Jaana
  'song_000009': ['punjabi'],                 // Ni Main Jaana Jogi De Naal
  'song_000010': ['punjabi'],                 // Mera Piya Ghar Aaya
  'song_000011': ['punjabi'],                 // Heer
  'song_000012': ['punjabi'],                 // Abyat-e-Bahoo
  'song_000013': ['punjabi', 'pothohari'],    // Saif ul Malook
  'song_000014': ['punjabi'],                 // Lagi Bina
  'song_000015': ['urdu'],                    // Hashr Ke Roz
  'song_000016': ['urdu', 'punjabi'],         // Mustt Mustt
  'song_000017': ['arabic', 'urdu'],          // Allah Hoo Allah Hoo
  'song_000018': ['urdu'],                    // Tumhe Dillagi
  'song_000019': ['urdu'],                    // Yeh Jo Halka Halka
  'song_000020': ['sindhi', 'punjabi', 'urdu'], // Shahbaz Qalandar
  'song_000021': ['punjabi'],                 // Ghonghat Chak O Sajna
  'song_000022': ['urdu'],                    // Mast Nazron Se
  'song_000023': ['punjabi'],                 // Kinna Sohna
  'song_000024': ['punjabi'],                 // Kangna
  'song_000025': ['punjabi'],                 // Ghoom Charakhra
  'song_000026': ['urdu'],                    // Ranjish Hi Sahi
  'song_000027': ['punjabi'],                 // Charkha Naulakha
  'song_000028': ['sindhi'],                  // Bhit Ja Bhittai
  'song_000029': ['sindhi'],                  // Sur Sasui
  'song_000030': ['sindhi'],                  // Sur Marui
  'song_000031': ['punjabi'],                 // Ranjha Ranjha Kardi
  'song_000032': ['punjabi'],                 // Ali Da Malang
  'song_000033': ['arabic'],                  // Maula Ya Salli
  'song_000034': ['punjabi'],                 // Rang
  'song_000035': ['punjabi'],                 // Akhiyan Udeek Diyan
  'song_000036': ['saraiki'],                 // Meda Ishq Vi Toon
  'song_000037': ['sindhi', 'saraiki'],       // Ik Nukte Wich
  'song_000038': ['punjabi'],                 // Shlok Baba Farid
  'song_000039': ['urdu'],                    // Mere Rashke Qamar
  'song_000040': ['punjabi'],                 // Sanu Ek Pal
  'song_000041': ['urdu'],                    // Afreen Afreen
  'song_000042': ['urdu', 'persian'],         // Tu Kuja Man Kuja
  'song_000043': ['punjabi'],                 // Koi Bole Ram
  'song_000044': ['punjabi'],                 // Lambi Judaai
  'song_000045': ['punjabi'],                 // Je Tu Akhiyan De
  'song_000046': ['arabic'],                  // Ya Hayyu Ya Qayyum
  'song_000047': ['persian'],                 // Beshno Az Ney
  'song_000048': ['urdu'],                    // Data Ganj Bakhsh
  'song_000049': ['urdu'],                    // Meri Daastaan-e-Hasrat
  'song_000050': ['urdu', 'punjabi'],         // Khawaja Mere Khawaja
  'song_000051': ['saraiki'],                 // Khedan De Din Chaar
  'song_000052': ['punjabi'],                 // Mere Sohneya
  'song_000053': ['punjabi'],                 // Sun Charkhe Di
  'song_000054': ['persian'],                 // Man Banda-e-To Am
  'song_000055': ['urdu'],                    // Sanson Ki Mala
  'song_000056': ['urdu', 'punjabi'],         // Ali Maula Ali
  'song_000057': ['punjabi'],                 // Nit Khair Manga
  'song_000058': ['punjabi'],                 // Mahi Yaar Di Gharoli
  'song_000059': ['sindhi', 'punjabi', 'urdu'], // Lal Meri Pat Rakhiyo
  'song_000060': ['sindhi'],                  // O Lal Meri - WILL BE MERGED
  'song_000061': ['punjabi'],                 // Masjid Dha De
  'song_000062': ['punjabi'],                 // Ilmo Bas Kari
  'song_000063': ['sindhi', 'saraiki'],       // Na Faqeera Da
  'song_000064': ['sindhi'],                  // Sur Yaman Kalyan
  'song_000065': ['saraiki'],                 // Ranjhan Yaar Ve Mahi
  'song_000066': ['urdu'],                    // Yaad-e-Nabi Ka Gulshan
  'song_000067': ['punjabi'],                 // Alif Allah Chambay Di Booti
  'song_000068': ['kashmiri'],                // Vakhs of Lal Ded
  'song_000069': ['kashmiri'],                // Shrukhs of Nund Rishi
  'song_000070': ['arabic'],                  // Ana al-Haqq
  'song_000071': ['urdu'],                    // Tum Ek Gorakh Dhanda
  'song_000072': ['punjabi'],                 // Tera Ishq Nachaaya - WILL BE MERGED
  'song_000073': ['persian'],                 // Conference of the Birds
  'song_000074': ['saraiki'],                 // Nahin Lagda Dil Mera
  'song_000075': ['punjabi'],                 // Ali Haq Da Imam
  'song_000076': ['arabic'],                  // Allahu Akbar
  'song_000077': ['turkish'],                 // Ben Yürürüm
  'song_000078': ['turkish'],                 // Gel Gidelim
  'song_000079': ['sindhi', 'punjabi'],       // Dam Mast Qalandar NFAK - WILL BE MERGED
  'song_000080': ['persian'],                 // Rang (Rumi)
  'song_000081': ['hindi', 'hindavi'],        // Dohe of Kabir
  'song_000082': ['punjabi'],                 // Ho Jamal
  'song_000083': ['urdu', 'arabic'],          // Ya Ghous-e-Azam
  'song_000084': ['punjabi'],                 // Savairay Savairay
  'song_000085': ['sindhi'],                  // Ho Jamalo
  'song_000086': ['pashto'],                  // Da Gul Paan De
  'song_000087': ['kashmiri'],                // Gali Gali
  'song_000088': ['punjabi'],                 // Sun Farida
  'song_000089': ['punjabi'],                 // Heer Opening Hamd
  'song_000090': ['punjabi'],                 // Ki Jaana Main Kaun - WILL BE MERGED
  'song_000091': ['urdu', 'punjabi'],         // Data Meray Data
  'song_000092': ['punjabi', 'pothohari'],    // Saif ul Malook Mahi section
  'song_000093': ['saraiki'],                 // Rab Jane Te Hussain
  'song_000094': ['sindhi'],                  // Suhni Mehinwal
  'song_000095': ['punjabi'],                 // Mera Peer Jaane
  'song_000096': ['hindavi', 'hindi'],        // Kahe Ko Biyahi
  'song_000097': ['persian'],                 // Mara Beboos Kard
  'song_000098': ['sindhi'],                  // Sur Sohni
  'song_000099': ['punjabi', 'urdu'],         // Dum-a-Dum Ali Ali
  'song_000100': ['punjabi'],                 // Aao Ni Main Tuhanu
};

// Song region mapping
const songRegionMap = {
  'song_000001': ['delhi'], 'song_000002': ['delhi'], 'song_000003': ['delhi'],
  'song_000004': ['punjab'], 'song_000005': ['sindh', 'sehwan'],
  'song_000006': ['punjab'], 'song_000007': ['punjab'], 'song_000008': ['punjab'],
  'song_000009': ['punjab'], 'song_000010': ['punjab'], 'song_000011': ['punjab'],
  'song_000012': ['punjab'], 'song_000013': ['azad-kashmir', 'punjab'],
  'song_000014': ['lahore', 'punjab'], 'song_000015': ['punjab'],
  'song_000016': ['punjab'], 'song_000017': ['punjab'],
  'song_000018': ['punjab'], 'song_000019': ['punjab'],
  'song_000020': ['sindh', 'sehwan'], 'song_000021': ['punjab'],
  'song_000022': ['punjab'], 'song_000023': ['punjab'], 'song_000024': ['punjab'],
  'song_000025': ['punjab'], 'song_000026': ['punjab'],
  'song_000027': ['punjab'], 'song_000028': ['sindh', 'bhit-shah'],
  'song_000029': ['sindh'], 'song_000030': ['sindh'],
  'song_000031': ['punjab'], 'song_000032': ['punjab'],
  'song_000033': ['delhi'], 'song_000034': ['lahore', 'punjab'],
  'song_000035': ['punjab'], 'song_000036': ['punjab', 'sindh'],
  'song_000037': ['sindh'], 'song_000038': ['punjab', 'pakpattan'],
  'song_000039': ['punjab'], 'song_000040': ['punjab'],
  'song_000041': ['punjab'], 'song_000042': ['punjab'],
  'song_000043': ['punjab'], 'song_000044': ['punjab', 'rajasthan'],
  'song_000045': ['punjab'], 'song_000046': ['delhi'],
  'song_000047': ['konya', 'khorasan'], 'song_000048': ['lahore'],
  'song_000049': ['punjab'], 'song_000050': ['ajmer', 'delhi'],
  'song_000051': ['punjab', 'sindh'], 'song_000052': ['punjab'],
  'song_000053': ['punjab'], 'song_000054': ['konya'],
  'song_000055': ['punjab'], 'song_000056': ['punjab'],
  'song_000057': ['punjab'], 'song_000058': ['punjab'],
  'song_000059': ['sindh', 'sehwan'], 'song_000060': ['sindh', 'sehwan'],
  'song_000061': ['punjab'], 'song_000062': ['punjab'],
  'song_000063': ['sindh'], 'song_000064': ['sindh'],
  'song_000065': ['punjab', 'sindh'], 'song_000066': ['punjab'],
  'song_000067': ['punjab'], 'song_000068': ['kashmir'],
  'song_000069': ['kashmir'], 'song_000070': ['baghdad'],
  'song_000071': ['punjab'], 'song_000072': ['punjab'],
  'song_000073': ['nishapur', 'khorasan'], 'song_000074': ['punjab', 'sindh'],
  'song_000075': ['punjab'], 'song_000076': ['punjab'],
  'song_000077': ['anatolia'], 'song_000078': ['anatolia'],
  'song_000079': ['sindh'], 'song_000080': ['konya'],
  'song_000081': ['varanasi'], 'song_000082': ['lahore', 'punjab'],
  'song_000083': ['baghdad', 'punjab'], 'song_000084': ['punjab'],
  'song_000085': ['sindh'], 'song_000086': ['kpk', 'peshawar'],
  'song_000087': ['kashmir'], 'song_000088': ['punjab'],
  'song_000089': ['punjab'], 'song_000090': ['punjab'],
  'song_000091': ['lahore'], 'song_000092': ['azad-kashmir', 'punjab'],
  'song_000093': ['punjab'], 'song_000094': ['sindh'],
  'song_000095': ['punjab'], 'song_000096': ['varanasi'],
  'song_000097': ['konya'], 'song_000098': ['sindh'],
  'song_000099': ['punjab'], 'song_000100': ['punjab'],
};

// Attribution status mapping
const attributionStatusMap = {};
// Songs with known writers
songs.forEach(s => {
  if (s.writerIds && s.writerIds.length > 0) {
    attributionStatusMap[s.id] = 'attributed';
  }
});
// Traditional/anonymous compositions
['song_000004','song_000006','song_000016','song_000017','song_000020',
 'song_000021','song_000024','song_000025','song_000027','song_000032',
 'song_000033','song_000035','song_000040','song_000043','song_000045',
 'song_000046','song_000048','song_000052','song_000053','song_000056',
 'song_000057','song_000058','song_000066','song_000075','song_000076',
 'song_000084','song_000091','song_000095','song_000099'].forEach(id => {
  attributionStatusMap[id] = 'traditional';
});
// Known non-Sufi writers (attribution known but writer not in dataset)
['song_000018','song_000019','song_000022','song_000023','song_000026',
 'song_000039','song_000041','song_000049','song_000055','song_000071'].forEach(id => {
  attributionStatusMap[id] = 'attributed'; // Writer known even if not in gold_writers
});
// Disputed/writer-performer
['song_000015','song_000044'].forEach(id => {
  attributionStatusMap[id] = 'disputed';
});

// Composition type mapping
const compositionTypeMap = {};
songs.forEach(s => { compositionTypeMap[s.id] = 'performed'; });
// Literary texts
['song_000047','song_000068','song_000069','song_000073','song_000077',
 'song_000078','song_000080','song_000086','song_000087','song_000088',
 'song_000097'].forEach(id => { compositionTypeMap[id] = 'literary'; });
// Liturgical
['song_000006','song_000017','song_000033','song_000046','song_000076',
 'song_000070'].forEach(id => { compositionTypeMap[id] = 'liturgical'; });

// ─── DUPLICATE RESOLUTION ─────────────────────────────────────────
const MERGE_TARGETS = {
  // song_000072 merges INTO song_000007 (Tere Ishq Nachaya)
  'song_000072': 'song_000007',
  // song_000090 merges INTO song_000008 (Bulla Ki Jaana)
  'song_000090': 'song_000008',
  // song_000079 merges INTO song_000005 (Dama Dam Mast Qalandar)
  'song_000079': 'song_000005',
  // song_000060 merges INTO song_000059 (Lal Meri Pat Rakhiyo)
  'song_000060': 'song_000059',
};

const duplicateLog = [];

// Apply merges
for (const [mergedId, targetId] of Object.entries(MERGE_TARGETS)) {
  const source = songs.find(s => s.id === mergedId);
  const target = songs.find(s => s.id === targetId);
  if (source && target) {
    // Merge singerIds
    source.singerIds.forEach(sid => {
      if (!target.singerIds.includes(sid)) target.singerIds.push(sid);
    });
    // Merge alternateTitles
    if (!target.alternateTitles.includes(source.title)) {
      target.alternateTitles.push(source.title);
    }
    source.alternateTitles.forEach(t => {
      if (!target.alternateTitles.includes(t)) target.alternateTitles.push(t);
    });
    // Merge conceptIds
    source.conceptIds.forEach(cid => {
      if (!target.conceptIds.includes(cid)) target.conceptIds.push(cid);
    });
    // Merge sourceIds
    source.sourceIds.forEach(sid => {
      if (!target.sourceIds.includes(sid)) target.sourceIds.push(sid);
    });
    
    duplicateLog.push({
      action: 'MERGE',
      sourceId: mergedId,
      sourceTitle: source.title,
      targetId: targetId,
      targetTitle: target.title,
      reason: 'Same composition, variant title/spelling',
    });
  }
}

// Remove merged songs
songs = songs.filter(s => !MERGE_TARGETS[s.id]);

// Differentiate near-duplicates (add clarifying notes)
const DIFFERENTIATE = [
  { id: 'song_000005', note: 'Specific devotional song with lyrics beginning "Dama dam mast qalandar"' },
  { id: 'song_000020', note: 'Broader manqabat tradition praising Shahbaz Qalandar, distinct lyrical content from Dama Dam Mast Qalandar' },
  { id: 'song_000014', note: 'Shah Hussain kafi beginning "Lagi bina taar rabab di"' },
  { id: 'song_000034', note: 'Shah Hussain kafi about Basant (spring) beginning "Rang kali kooch rang de"' },
  { id: 'song_000006', note: 'Extended dhikr composition with improvisational elaboration on "Allah Hu"' },
  { id: 'song_000017', note: 'Structured repetitive dhikr building through progressive intensification, distinct arrangement' },
];

DIFFERENTIATE.forEach(d => {
  const song = songs.find(s => s.id === d.id);
  if (song) {
    // Remove cross-conflicting alternate titles
    if (d.id === 'song_000014') {
      song.alternateTitles = song.alternateTitles.filter(t => t !== 'Rang');
    }
  }
  duplicateLog.push({
    action: 'DISTINCT_COMPOSITION',
    id: d.id,
    title: song ? song.title : 'unknown',
    note: d.note,
  });
});

// Pending review
duplicateLog.push({
  action: 'PENDING_REVIEW',
  ids: ['song_000005', 'song_000059'],
  titles: ['Dama Dam Mast Qalandar', 'Lal Meri Pat Rakhiyo'],
  note: 'May share lyrical content in some regional traditions. Kept separate pending source verification.',
});

console.log('  Duplicates resolved:');
console.log('    Merged: ' + Object.keys(MERGE_TARGETS).length);
console.log('    Differentiated: ' + DIFFERENTIATE.length);
console.log('    Pending review: 1 pair');
console.log('  Songs after dedup: ' + songs.length);

// Now apply all song repairs
songs = songs.map(s => {
  // attributionStatus
  s.attributionStatus = attributionStatusMap[s.id] || (s.writerIds.length > 0 ? 'attributed' : 'unknown');
  
  // compositionType
  s.compositionType = compositionTypeMap[s.id] || 'performed';
  
  // languageIds
  const sLangs = songLanguageMap[s.id] || [];
  s.languageIds = sLangs.map(n => findLangId(n)).filter(Boolean);
  
  // regionIds
  const sRegs = songRegionMap[s.id] || [];
  s.regionIds = sRegs.map(n => findRegionId(n)).filter(Boolean);
  
  return s;
});

// ═══════════════════════════════════════════════════════════════════
// STEP 4: RELATIONSHIP REPAIR — reduce orphans
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== REPAIRING RELATIONSHIPS ===');

// Add new songs referencing orphaned writers (Approach A from repair plan)
const newSongs = [
  {id:'song_000101',slug:'hafiz-shirazi-ghazal',title:'Agar An Turk-e-Shirazi',alternateTitles:['If That Turk of Shiraz'],summary:"Hafiz's most famous ghazal offering Samarkand and Bukhara for the mole on the beloved's cheek. A quintessential expression of the Persian mystical-romantic ghazal tradition.",lyrics:'',meaning:'',genre:'Ghazal',era:'14th century',writerIds:['writer_000009'],singerIds:['singer_000019','singer_000020'],albumIds:[],conceptIds:['concept_000001','concept_000015'],languageIds:[],regionIds:[],sourceIds:['src_000055','src_000001','src_000004'],questionIds:[],attributionStatus:'attributed',compositionType:'literary',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000102',slug:'gulistan-saadi',title:'Bani Adam',alternateTitles:['Children of Adam','Poem of Unity'],summary:"Saadi Shirazi's celebrated poem declaring all humanity as limbs of one body, inscribed at the United Nations. Expresses the Sufi principle of universal human solidarity and divine unity.",lyrics:'',meaning:'',genre:'Ghazal / Qasida',era:'13th century',writerIds:['writer_000022'],singerIds:[],albumIds:[],conceptIds:['concept_000005','concept_000001'],languageIds:[],regionIds:[],sourceIds:['src_000057','src_000001','src_000004'],questionIds:[],attributionStatus:'attributed',compositionType:'literary',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000103',slug:'sanai-hadiqat-opening',title:'Hadiqat al-Haqiqa (Opening)',alternateTitles:['The Walled Garden of Truth'],summary:"The opening passage of Sanai's Hadiqat al-Haqiqa, the first major Sufi masnavi in Persian. Sanai's pioneering work directly influenced Attar and Rumi.",lyrics:'',meaning:'',genre:'Masnavi',era:'12th century',writerIds:['writer_000021'],singerIds:[],albumIds:[],conceptIds:['concept_000005','concept_000022'],languageIds:[],regionIds:[],sourceIds:['src_000084','src_000001','src_000004'],questionIds:[],attributionStatus:'attributed',compositionType:'literary',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000104',slug:'gulshan-raz-passage',title:'Gulshan-e Raz (Passage)',alternateTitles:['The Secret Rose Garden'],summary:"A passage from Shabistari's Gulshan-e Raz answering fundamental questions of Sufi metaphysics in compressed, brilliant verse.",lyrics:'',meaning:'',genre:'Masnavi',era:'14th century',writerIds:['writer_000032'],singerIds:[],albumIds:[],conceptIds:['concept_000005','concept_000022'],languageIds:[],regionIds:[],sourceIds:['src_000068','src_000001','src_000004'],questionIds:[],attributionStatus:'attributed',compositionType:'literary',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000105',slug:'rabia-prayer',title:'O God, If I Worship Thee',alternateTitles:['Prayer of Rabia'],summary:"Rabia al-Adawiyya's iconic prayer: 'If I worship You from fear of Hell, burn me in Hell. If I worship You from hope of Paradise, exclude me from Paradise. But if I worship You for Your own sake, do not withhold Your everlasting beauty.' The foundational statement of selfless divine love.",lyrics:'',meaning:'',genre:'Prayer / Devotional',era:'8th century',writerIds:['writer_000016'],singerIds:[],albumIds:[],conceptIds:['concept_000001','concept_000048'],languageIds:[],regionIds:[],sourceIds:['src_000024','src_000001','src_000010'],questionIds:[],attributionStatus:'attributed',compositionType:'liturgical',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000106',slug:'ibn-arabi-tarjuman',title:'Tarjuman al-Ashwaq (Passage)',alternateTitles:['The Interpreter of Desires'],summary:"From Ibn Arabi's collection of love poems composed in Mecca, inspired by the Persian scholar Nizam. Often read as mystical allegory, the poems express divine love through the imagery of human beauty.",lyrics:'',meaning:'',genre:'Ghazal / Qasida',era:'13th century',writerIds:['writer_000017'],singerIds:[],albumIds:[],conceptIds:['concept_000001','concept_000049'],languageIds:[],regionIds:[],sourceIds:['src_000026','src_000003','src_000009'],questionIds:[],attributionStatus:'attributed',compositionType:'literary',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000107',slug:'jami-yusuf-zulaykha',title:'Yusuf wa Zulaykha (Passage)',alternateTitles:['Joseph and Zuleikha'],summary:"From Jami's retelling of the Quranic story of Joseph and Potiphar's wife as a Sufi allegory of divine beauty, human desire, and the purification of love through suffering.",lyrics:'',meaning:'',genre:'Masnavi',era:'15th century',writerIds:['writer_000019'],singerIds:[],albumIds:[],conceptIds:['concept_000001','concept_000049'],languageIds:[],regionIds:[],sourceIds:['src_000001','src_000013','src_000004'],questionIds:[],attributionStatus:'attributed',compositionType:'literary',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000108',slug:'faiz-ali-faiz-mast-qalandar',title:'Dam Mast Qalandar (Faiz Ali Faiz)',alternateTitles:[],summary:"Faiz Ali Faiz's rendition of the Qalandar dhamaal performed at the shrine of Lal Shahbaz Qalandar. His traditional shrine style contrasts with studio recordings, preserving the raw devotional atmosphere.",lyrics:'',meaning:'',genre:'Dhamaal / Qawwali',era:'20th century',writerIds:['writer_000050'],singerIds:['singer_000008'],albumIds:[],conceptIds:['concept_000025','concept_000035'],languageIds:[],regionIds:[],sourceIds:['src_000047','src_000006','src_000020'],questionIds:[],attributionStatus:'attributed',compositionType:'performed',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000109',slug:'ghulam-ali-chupke-chupke',title:'Chupke Chupke Raat Din',alternateTitles:[],summary:"An Urdu ghazal by Hasrat Mohani rendered by Ghulam Ali. Its themes of silent weeping and concealed love align with the Sufi tradition of hidden devotion and the inner fire of divine longing.",lyrics:'',meaning:'',genre:'Ghazal',era:'20th century',writerIds:[],singerIds:['singer_000020'],albumIds:[],conceptIds:['concept_000001','concept_000006'],languageIds:[],regionIds:[],sourceIds:['src_000015','src_000019','src_000020'],questionIds:[],attributionStatus:'attributed',compositionType:'performed',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000110',slug:'attaullah-khan-idhar-zindagi',title:'Idhar Zindagi Ka Janaza',alternateTitles:[],summary:"A deeply emotional Punjabi-Urdu composition performed by Attaullah Khan Esakhelvi expressing the funeral of a living heart killed by love — a Sufi theme of death-before-death.",lyrics:'',meaning:'',genre:'Sufi Folk',era:'20th century',writerIds:[],singerIds:['singer_000026'],albumIds:[],conceptIds:['concept_000001','concept_000002'],languageIds:[],regionIds:[],sourceIds:['src_000015','src_000019','src_000020'],questionIds:[],attributionStatus:'traditional',compositionType:'performed',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000111',slug:'malika-pukhraj-abhi-to-main',title:'Abhi To Main Jawan Hoon',alternateTitles:[],summary:"A composition performed by Malika Pukhraj expressing the soul's declaration of vitality and readiness for the spiritual journey despite the world's attempts to diminish it.",lyrics:'',meaning:'',genre:'Ghazal / Folk',era:'20th century',writerIds:[],singerIds:['singer_000043'],albumIds:[],conceptIds:['concept_000001'],languageIds:[],regionIds:[],sourceIds:['src_000015','src_000019','src_000020'],questionIds:[],attributionStatus:'attributed',compositionType:'performed',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000112',slug:'rizwan-muazzam-khabaram-raseeda',title:'Khabaram Raseeda',alternateTitles:[],summary:"A Persian qawwali performed by Rizwan-Muazzam Qawwal, continuing their uncle Nusrat Fateh Ali Khan's tradition. The composition celebrates the arrival of divine news (khabar) to the waiting lover.",lyrics:'',meaning:'',genre:'Qawwali',era:'Traditional',writerIds:[],singerIds:['singer_000025'],albumIds:[],conceptIds:['concept_000001','concept_000028'],languageIds:[],regionIds:[],sourceIds:['src_000019','src_000006','src_000020'],questionIds:[],attributionStatus:'traditional',compositionType:'performed',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000113',slug:'hamza-akram-rang',title:'Rang (Hamza Akram)',alternateTitles:[],summary:"A traditional qawwali performed by Hamza Akram at the Royal Albert Hall, representing the next generation of classical qawwali performers maintaining the traditional Chishti devotional repertoire.",lyrics:'',meaning:'',genre:'Qawwali',era:'21st century',writerIds:[],singerIds:['singer_000042'],albumIds:[],conceptIds:['concept_000013','concept_000025'],languageIds:[],regionIds:[],sourceIds:['src_000019','src_000006','src_000020'],questionIds:[],attributionStatus:'traditional',compositionType:'performed',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
  {id:'song_000114',slug:'sarmad-rubaiyat-passage',title:'Rubaiyat-e-Sarmad (Selection)',alternateTitles:[],summary:"Selected quatrains from Sarmad Kashani's Rubaiyat, expressing radical mystical union and the transcendence of religious boundaries. Sarmad was executed for these utterances in Mughal Delhi.",lyrics:'',meaning:'',genre:'Rubaiyat',era:'17th century',writerIds:['writer_000027'],singerIds:[],albumIds:[],conceptIds:['concept_000026','concept_000002'],languageIds:[],regionIds:[],sourceIds:['src_000099','src_000003','src_000004'],questionIds:[],attributionStatus:'attributed',compositionType:'literary',status:'published',createdAt:'2026-06-06T00:00:00Z',updatedAt:'2026-06-06T00:00:00Z'},
];

// Apply language and region to new songs
newSongs.forEach(s => {
  const sLangs = {
    'song_000101': ['persian'], 'song_000102': ['persian'],
    'song_000103': ['persian'], 'song_000104': ['persian'],
    'song_000105': ['arabic'], 'song_000106': ['arabic'],
    'song_000107': ['persian'], 'song_000108': ['sindhi','punjabi'],
    'song_000109': ['urdu'], 'song_000110': ['punjabi','urdu'],
    'song_000111': ['urdu'], 'song_000112': ['persian','urdu'],
    'song_000113': ['urdu','punjabi'], 'song_000114': ['persian'],
  };
  const sRegs = {
    'song_000101': ['shiraz'], 'song_000102': ['shiraz'],
    'song_000103': ['ghazna'], 'song_000104': ['tabriz'],
    'song_000105': ['basra'], 'song_000106': ['mecca','damascus'],
    'song_000107': ['herat'], 'song_000108': ['sindh','sehwan'],
    'song_000109': ['sindh','punjab'], 'song_000110': ['punjab'],
    'song_000111': ['punjab','kashmir'], 'song_000112': ['punjab','faisalabad'],
    'song_000113': ['lahore','punjab'], 'song_000114': ['delhi'],
  };
  s.languageIds = (sLangs[s.id]||[]).map(n => findLangId(n)).filter(Boolean);
  s.regionIds = (sRegs[s.id]||[]).map(n => findRegionId(n)).filter(Boolean);
});

songs = songs.concat(newSongs);

// ═══════════════════════════════════════════════════════════════════
// STEP 5: WRITE REPAIRED FILES
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== WRITING REPAIRED FILES ===');

function writeJSON(filename, data) {
  const filepath = path.join(SEEDS, filename);
  const formatted = '[\n' + data.map(d => '  ' + JSON.stringify(d)).join(',\n') + '\n]\n';
  fs.writeFileSync(filepath, formatted, 'utf-8');
  console.log('  Wrote ' + filename + ' (' + data.length + ' entities)');
}

writeJSON('gold_writers.json', writers);
writeJSON('gold_singers.json', singers);
writeJSON('gold_songs.json', songs);
writeJSON('gold_concepts.json', concepts);

// Write duplicate resolution log
const dupLogPath = path.join(__dirname, '..', '..', '..', 'docs', 'DUPLICATE_RESOLUTION_LOG.md');
let dupMd = '# DUPLICATE RESOLUTION LOG\n\n## Phase 2.5 — Step 4\n\n';
dupMd += '| Action | Source | Target | Reason |\n|---|---|---|---|\n';
duplicateLog.forEach(d => {
  if (d.action === 'MERGE') {
    dupMd += `| MERGE | ${d.sourceId} "${d.sourceTitle}" | → ${d.targetId} "${d.targetTitle}" | ${d.reason} |\n`;
  } else if (d.action === 'DISTINCT_COMPOSITION') {
    dupMd += `| DISTINCT | ${d.id} "${d.title}" | — | ${d.note} |\n`;
  } else if (d.action === 'PENDING_REVIEW') {
    dupMd += `| PENDING | ${d.ids.join(', ')} | — | ${d.note} |\n`;
  }
});
dupMd += '\n## Summary\n\n```\nMerged: ' + Object.keys(MERGE_TARGETS).length + '\n';
dupMd += 'Differentiated: ' + DIFFERENTIATE.length + '\n';
dupMd += 'Pending Review: 1 pair\nSongs removed: ' + Object.keys(MERGE_TARGETS).length + '\n';
dupMd += 'Songs added: ' + newSongs.length + '\n';
dupMd += 'Net song count: ' + songs.length + '\n```\n';
fs.writeFileSync(dupLogPath, dupMd, 'utf-8');
console.log('  Wrote DUPLICATE_RESOLUTION_LOG.md');

// ═══════════════════════════════════════════════════════════════════
// STEP 6: VERIFICATION RE-AUDIT
// ═══════════════════════════════════════════════════════════════════
console.log('\n=== RUNNING RE-AUDIT ===');

const sources = require(path.join(SEEDS, 'gold_sources.json'));
const sourceIds = new Set(sources.map(s => s.id));
const langIds = new Set(languages.map(l => l.id));
const regionIds = new Set(regions.map(r => r.id));
const writerIds = new Set(writers.map(w => w.id));
const singerIdSet = new Set(singers.map(s => s.id));
const conceptIdSet = new Set(concepts.map(c => c.id));

let issues = [];

// Check songs
let songsNoLang = 0, songsNoRegion = 0, songsNoWriter = 0;
let phantomSources = 0, phantomWriters = 0, phantomSingers = 0, phantomConcepts = 0;
const usedWriterIds = new Set();
const usedSingerIds = new Set();
const usedConceptIds = new Set();

songs.forEach(s => {
  if (s.languageIds.length === 0) songsNoLang++;
  if (s.regionIds.length === 0) songsNoRegion++;
  if (s.writerIds.length === 0 && s.attributionStatus !== 'traditional' && s.attributionStatus !== 'disputed') songsNoWriter++;
  s.sourceIds.forEach(sid => { if (!sourceIds.has(sid)) phantomSources++; });
  s.writerIds.forEach(wid => { usedWriterIds.add(wid); if (!writerIds.has(wid)) phantomWriters++; });
  s.singerIds.forEach(sid => { usedSingerIds.add(sid); if (!singerIdSet.has(sid)) phantomSingers++; });
  s.conceptIds.forEach(cid => { usedConceptIds.add(cid); if (!conceptIdSet.has(cid)) phantomConcepts++; });
});

// Check writers
let writersNoRegion = 0;
writers.forEach(w => {
  if (w.regionIds.length === 0) writersNoRegion++;
  w.sourceIds.forEach(sid => { if (!sourceIds.has(sid)) phantomSources++; });
});

// Check singers
let singersNoLang = 0, singersNoRegion = 0;
singers.forEach(s => {
  if (s.languageIds.length === 0) singersNoLang++;
  if (s.regionIds.length === 0) singersNoRegion++;
  s.sourceIds.forEach(sid => { if (!sourceIds.has(sid)) phantomSources++; });
});

const orphanWriters = writers.filter(w => !usedWriterIds.has(w.id));
const orphanSingers = singers.filter(s => !usedSingerIds.has(s.id));
const orphanConcepts = concepts.filter(c => !usedConceptIds.has(c.id));

console.log('Songs: ' + songs.length);
console.log('Writers: ' + writers.length);
console.log('Singers: ' + singers.length);
console.log('Concepts: ' + concepts.length);
console.log('Sources: ' + sources.length);
console.log('Languages: ' + languages.length);
console.log('Regions: ' + regions.length);
console.log('');
console.log('Songs missing languageIds: ' + songsNoLang);
console.log('Songs missing regionIds: ' + songsNoRegion);
console.log('Writers missing regionIds: ' + writersNoRegion);
console.log('Singers missing languageIds: ' + singersNoLang);
console.log('Singers missing regionIds: ' + singersNoRegion);
console.log('');
console.log('Phantom source references: ' + phantomSources);
console.log('Phantom writer references: ' + phantomWriters);
console.log('Phantom singer references: ' + phantomSingers);
console.log('Phantom concept references: ' + phantomConcepts);
console.log('');
console.log('Orphan writers: ' + orphanWriters.length + '/' + writers.length + ' (' + Math.round(orphanWriters.length/writers.length*100) + '%)');
orphanWriters.forEach(w => console.log('  ' + w.id + ' ' + w.name));
console.log('Orphan singers: ' + orphanSingers.length + '/' + singers.length + ' (' + Math.round(orphanSingers.length/singers.length*100) + '%)');
orphanSingers.forEach(s => console.log('  ' + s.id + ' ' + s.name));
console.log('Orphan concepts: ' + orphanConcepts.length + '/' + concepts.length + ' (' + Math.round(orphanConcepts.length/concepts.length*100) + '%)');

// Write audit report
const auditPath = path.join(__dirname, '..', '..', '..', 'docs', 'REPAIR_AUDIT.md');
let auditMd = `# REPAIR AUDIT — Phase 2.5

## Post-Repair Dataset Status

| Metric | Before | After | Target | Status |
|---|---|---|---|---|
| Songs | 100 | ${songs.length} | — | — |
| Writers | 50 | ${writers.length} | — | — |
| Singers | 50 | ${singers.length} | — | — |
| Concepts | 50 | ${concepts.length} | — | — |
| Sources | 0 | ${sources.length} | 100 | ${sources.length >= 100 ? '✅' : '❌'} |
| Languages | 0 | ${languages.length} | 25+ | ${languages.length >= 25 ? '✅' : '❌'} |
| Regions | 0 | ${regions.length} | 50+ | ${regions.length >= 50 ? '✅' : '❌'} |

## Verification Results

| Check | Before | After | Target | Status |
|---|---|---|---|---|
| Phantom sources | 17 (100%) | ${phantomSources} | 0 | ${phantomSources === 0 ? '✅' : '❌'} |
| Songs missing languageIds | 100 (100%) | ${songsNoLang} | 0 | ${songsNoLang === 0 ? '✅' : '❌'} |
| Songs missing regionIds | 100 (100%) | ${songsNoRegion} | 0 | ${songsNoRegion === 0 ? '✅' : '❌'} |
| Writers missing regionIds | 50 (100%) | ${writersNoRegion} | 0 | ${writersNoRegion === 0 ? '✅' : '❌'} |
| Singers missing languageIds | 50 (100%) | ${singersNoLang} | 0 | ${singersNoLang === 0 ? '✅' : '❌'} |
| Singers missing regionIds | 50 (100%) | ${singersNoRegion} | 0 | ${singersNoRegion === 0 ? '✅' : '❌'} |
| Orphan writers | 27 (54%) | ${orphanWriters.length} (${Math.round(orphanWriters.length/writers.length*100)}%) | <10% | ${orphanWriters.length/writers.length < 0.10 ? '✅' : '❌'} |
| Orphan singers | 27 (54%) | ${orphanSingers.length} (${Math.round(orphanSingers.length/singers.length*100)}%) | <10% | ${orphanSingers.length/singers.length < 0.10 ? '✅' : '❌'} |
| Duplicate candidates | 13 | 0 resolved + 1 pending | 0 | ⚠️ |
| Phantom writer refs | unknown | ${phantomWriters} | 0 | ${phantomWriters === 0 ? '✅' : '❌'} |
| Phantom singer refs | unknown | ${phantomSingers} | 0 | ${phantomSingers === 0 ? '✅' : '❌'} |
| Phantom concept refs | unknown | ${phantomConcepts} | 0 | ${phantomConcepts === 0 ? '✅' : '❌'} |

## Orphan Details

### Orphan Writers (${orphanWriters.length})
${orphanWriters.map(w => '- ' + w.id + ' — ' + w.name).join('\n')}

### Orphan Singers (${orphanSingers.length})
${orphanSingers.map(s => '- ' + s.id + ' — ' + s.name).join('\n')}

### Orphan Concepts (${orphanConcepts.length})
${orphanConcepts.map(c => '- ' + c.id + ' — ' + c.name).join('\n')}
`;
fs.writeFileSync(auditPath, auditMd, 'utf-8');
console.log('\nWrote REPAIR_AUDIT.md');
