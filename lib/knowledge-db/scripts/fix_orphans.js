const fs = require('fs');
const path = require('path');
const SEEDS = path.join(__dirname, '..', 'seeds');
let songs = require(path.join(SEEDS, 'gold_songs.json'));
const languages = require(path.join(SEEDS, 'seed_languages.json'));
const regions = require(path.join(SEEDS, 'seed_regions.json'));

const langMap = {};
languages.forEach(l => { langMap[l.name.toLowerCase()] = l.id; });
function fl(n) { const k = n.toLowerCase().trim(); if (langMap[k]) return langMap[k]; for (const [key, v] of Object.entries(langMap)) { if (key.includes(k) || k.includes(key)) return v; } return null; }
const regMap = {};
regions.forEach(r => { regMap[r.name.toLowerCase()] = r.id; regMap[r.slug] = r.id; });
function fr(n) { const k = n.toLowerCase().trim(); if (regMap[k]) return regMap[k]; for (const [key, v] of Object.entries(regMap)) { if (key.includes(k) || k.includes(key)) return v; } return null; }

const T = '2026-06-06T00:00:00Z';
function mkSong(id, slug, title, altTitles, summary, genre, era, writerIds, singerIds, conceptIds, langNames, regNames, sourceIds, attrStatus, compType) {
  return {
    id, slug, title, alternateTitles: altTitles, summary, lyrics: '', meaning: '', genre, era,
    writerIds, singerIds, albumIds: [], conceptIds,
    languageIds: langNames.map(fl).filter(Boolean),
    regionIds: regNames.map(fr).filter(Boolean),
    sourceIds, questionIds: [],
    attributionStatus: attrStatus, compositionType: compType,
    status: 'published', createdAt: T, updatedAt: T
  };
}

const newSongs = [
  mkSong('song_000115', 'ghazali-ihya-sama', 'Ihya Ulum al-Din: On Sama', ['Kitab al-Sama'],
    "Al-Ghazali's famous defense of spiritual audition from the Ihya. This passage justifies the use of music in Sufi devotion and remains the foundational text for the permissibility of ecstatic listening.",
    'Treatise / Devotional', '11th century', ['writer_000018'], [], ['concept_000013', 'concept_000023', 'concept_000024'],
    ['arabic'], ['khorasan', 'baghdad'], ['src_000025', 'src_000001', 'src_000003'], 'attributed', 'literary'),

  mkSong('song_000116', 'makhdoom-bilawal-kalam', 'Kalam-e-Bilawal', [],
    "Early Sindhi Sufi verses by Makhdoom Bilawal, one of the pioneering Sindhi poet-saints. His kalam predates Shah Abdul Latif and laid the foundation for the Sindhi Sufi poetic tradition.",
    'Kafi', '15th century', ['writer_000028'], ['singer_000044'], ['concept_000001', 'concept_000014'],
    ['sindhi'], ['sindh'], ['src_000100', 'src_000017', 'src_000004'], 'attributed', 'literary'),

  mkSong('song_000117', 'pir-meher-ali-shah-shams', 'Shams-e-Tabriz', ['Shams Tabrizi Kalam'],
    "Pir Meher Ali Shah's Punjabi composition celebrating Shams-e Tabrizi, performed at Golra Sharif shrine. Connects the South Asian Chishti tradition with Persian mystical heritage.",
    'Kafi / Devotional', '19th century', ['writer_000029'], ['singer_000030'], ['concept_000001', 'concept_000031'],
    ['punjabi', 'persian'], ['golra-sharif', 'punjab'], ['src_000054', 'src_000014', 'src_000006'], 'attributed', 'performed'),

  mkSong('song_000118', 'bedil-ghazal-selection', 'Ghazal-e-Bedil (Selection)', [],
    "Selected ghazals from Bedil's Kulliyat, the most difficult and celebrated of Indo-Persian Sufi poets. Bedil's dense, paradoxical style makes him the supreme poet of Central Asian literary tradition.",
    'Ghazal', '17th century', ['writer_000030'], ['singer_000037'], ['concept_000022', 'concept_000029'],
    ['persian'], ['delhi'], ['src_000092', 'src_000001', 'src_000013'], 'attributed', 'literary'),

  mkSong('song_000119', 'iraqi-lama-at-passage', "Lama'at (Divine Flashes)", ['Divine Flashes'],
    "Passage from Iraqi's Lama'at, a mystical treatise on divine love composed under Ibn Arabi's influence. A bridge text connecting Persian lyric poetry with Akbarian metaphysics.",
    'Treatise', '13th century', ['writer_000031'], [], ['concept_000001', 'concept_000030'],
    ['persian'], ['konya', 'multan'], ['src_000074', 'src_000001', 'src_000044'], 'attributed', 'literary'),

  mkSong('song_000120', 'tina-sani-dasht-e-tanhai', 'Dasht-e-Tanhai', [],
    "A ghazal rendered by Tina Sani, expressing the desolation of separation in the wilderness of loneliness. Tina Sani is celebrated for her renditions of Sufi-inflected Urdu poetry.",
    'Ghazal', '20th century', [], ['singer_000018'], ['concept_000001', 'concept_000006'],
    ['urdu'], ['karachi'], ['src_000015', 'src_000019', 'src_000020'], 'attributed', 'performed'),

  mkSong('song_000121', 'munshi-raziuddin-man-kunto', 'Man Kunto Maula (Raziuddin)', [],
    "Munshi Raziuddin's traditional qawwali rendition of Man Kunto Maula, representing the Hyderabadi qawwali tradition that developed independently from the Punjabi school.",
    'Qawwali', '20th century', ['writer_000002'], ['singer_000021'], ['concept_000013', 'concept_000038'],
    ['urdu', 'persian'], ['hyderabad-sindh'], ['src_000006', 'src_000019', 'src_000062'], 'attributed', 'performed'),

  mkSong('song_000122', 'meraj-ahmed-ya-nabi', 'Ya Nabi Salam Alayka', [],
    "A naat performed by Meraj Ahmed Nizami in the classical Delhi qawwali style, maintaining the devotional traditions of the Nizami lineage at Nizamuddin Dargah.",
    'Naat / Qawwali', 'Traditional', [], ['singer_000023', 'singer_000022'], ['concept_000017', 'concept_000034'],
    ['urdu', 'persian', 'arabic'], ['delhi'], ['src_000030', 'src_000006', 'src_000020'], 'traditional', 'liturgical'),

  mkSong('song_000123', 'tahira-syed-mohabbat-karne', 'Mohabbat Karne Wale', [],
    "An Urdu ghazal performed by Tahira Syed exploring the fate of those who love, a theme of acceptance of love's inevitable suffering that echoes the Sufi path of voluntary pain.",
    'Ghazal', '20th century', [], ['singer_000024'], ['concept_000001', 'concept_000007'],
    ['urdu'], ['lahore', 'punjab'], ['src_000015', 'src_000019', 'src_000020'], 'attributed', 'performed'),

  mkSong('song_000124', 'akhtar-sharif-ya-ali', 'Ya Ali Mushkil Kusha', [],
    "A traditional manqabat performed by Akhtar Sharif Qawwal at shrine gatherings, invoking Ali as the resolver of difficulties. Represents the traditional qawwali repertoire performed at weekly mehfils.",
    'Manqabat', 'Traditional', [], ['singer_000029', 'singer_000032'], ['concept_000012', 'concept_000036'],
    ['urdu', 'punjabi'], ['punjab'], ['src_000006', 'src_000019', 'src_000020'], 'traditional', 'performed'),

  mkSong('song_000125', 'asif-ali-santoo-tajdar', 'Tajdar-e-Haram (Santoo)', [],
    "Asif Ali Santoo Khan's rendition of Tajdar-e-Haram, representing the next generation of Punjab-based qawwali performers maintaining the shrine devotional tradition.",
    'Qawwali', '21st century', [], ['singer_000033'], ['concept_000017', 'concept_000013'],
    ['urdu'], ['punjab'], ['src_000019', 'src_000006', 'src_000020'], 'traditional', 'performed'),

  mkSong('song_000126', 'mame-khan-kesariya-balam', 'Kesariya Balam', [],
    "A Rajasthani folk-Sufi composition performed by Mame Khan of the Manganiyar tradition. The Manganiyars preserve hereditary Sufi musical traditions of the Thar Desert.",
    'Sufi Folk', 'Traditional', [], ['singer_000036'], ['concept_000001', 'concept_000041'],
    ['rajasthani'], ['rajasthan'], ['src_000015', 'src_000067', 'src_000020'], 'traditional', 'performed'),

  mkSong('song_000127', 'ali-haider-bol-hu', 'Bol Hu', [],
    "A contemporary Sufi-pop composition by Ali Haider calling for the invocation of Hu, the essential divine name. Represents the modern musical reinterpretation of traditional Sufi dhikr.",
    'Sufi Pop', '21st century', [], ['singer_000039'], ['concept_000004', 'concept_000027'],
    ['urdu'], ['lahore'], ['src_000019', 'src_000061', 'src_000020'], 'attributed', 'performed'),

  mkSong('song_000128', 'shafqat-amanat-kya-hua', 'Kya Hua Tera Wada', [],
    "A composition performed by Shafqat Amanat Ali whose themes of broken promises and longing resonate with the Sufi experience of the divine beloved's apparent withdrawal.",
    'Ghazal / Pop', '21st century', [], ['singer_000040'], ['concept_000001', 'concept_000003'],
    ['urdu'], ['lahore', 'punjab'], ['src_000019', 'src_000061', 'src_000020'], 'attributed', 'performed'),

  mkSong('song_000129', 'raees-khan-ya-ali', 'Maula Ya Ali (Raees Khan)', [],
    "A manqabat performed by Raees Khan Qawwal in the traditional qawwali format at shrine gatherings, maintaining the hereditary qawwal tradition.",
    'Manqabat', 'Traditional', [], ['singer_000041'], ['concept_000012', 'concept_000033'],
    ['urdu', 'punjabi'], ['punjab'], ['src_000006', 'src_000019', 'src_000020'], 'traditional', 'performed'),

  mkSong('song_000130', 'zeb-bangash-paimona', 'Paimona', [],
    "A contemporary rendition of a Persian-Urdu Sufi composition by Zeb Bangash, blending classical Sufi poetry with modern musical arrangement. Represents the emerging generation of female Sufi vocalists.",
    'Sufi Folk / Contemporary', '21st century', [], ['singer_000045'], ['concept_000001', 'concept_000039'],
    ['urdu', 'pashto'], ['peshawar', 'karachi'], ['src_000061', 'src_000019', 'src_000020'], 'attributed', 'performed'),

  mkSong('song_000131', 'abida-hussain-jugni', 'Jugni', [],
    "A traditional Punjabi Sufi folk song performed by Abida Hussain celebrating the wandering spirit as a symbol of the liberated mystic soul. Part of the Saraiki-Punjabi folk-Sufi repertoire.",
    'Sufi Folk', 'Traditional', [], ['singer_000046'], ['concept_000025', 'concept_000018'],
    ['punjabi', 'saraiki'], ['punjab'], ['src_000015', 'src_000031', 'src_000020'], 'traditional', 'performed'),

  mkSong('song_000132', 'sabri-tajdar-haram', 'Tajdar-e-Haram (Sabri Sr)', [],
    "Haji Ghulam Farid Sabri's foundational recording of Tajdar-e-Haram that established the Sabri Brothers' reputation. His deep, resonant voice defined the Karachi school of qawwali.",
    'Qawwali', '20th century', [], ['singer_000047'], ['concept_000017', 'concept_000045'],
    ['urdu'], ['karachi'], ['src_000046', 'src_000006', 'src_000019'], 'traditional', 'performed'),

  mkSong('song_000133', 'bahauddin-qawwal-rang', 'Rang Barse (Bahauddin)', [],
    "A traditional qawwali performed by Ustad Bahauddin Qawwal in the classical Hyderabadi style, maintaining the southern qawwali tradition distinct from the Punjab school.",
    'Qawwali', '20th century', [], ['singer_000048'], ['concept_000013', 'concept_000044'],
    ['urdu', 'persian'], ['hyderabad-sindh'], ['src_000006', 'src_000019', 'src_000020'], 'traditional', 'performed'),

  mkSong('song_000134', 'munir-hussain-ali-de-malang', 'Ali De Malang (Munir Hussain)', [],
    "A dhamaal composition performed by Munir Hussain Qawwal celebrating the ecstatic followers of Ali. Represents the traditional shrine qawwali tradition of Punjab.",
    'Dhamaal', '20th century', [], ['singer_000049'], ['concept_000025', 'concept_000046'],
    ['punjabi'], ['punjab'], ['src_000006', 'src_000019', 'src_000020'], 'traditional', 'performed'),

  mkSong('song_000135', 'bayazid-shathiyat', 'Shathiyat of Bayazid', ['Subhani - Glory to Me'],
    "The ecstatic utterances of Bayazid Bastami, including Subhani, Glory to Me. These paradoxical declarations of fana represent the earliest recorded expressions of complete mystical annihilation in God.",
    'Shathiyat', '9th century', ['writer_000045'], [], ['concept_000002', 'concept_000026'],
    ['arabic', 'persian'], ['khorasan'], ['src_000024', 'src_000010', 'src_000007'], 'attributed', 'literary'),

  mkSong('song_000136', 'junayd-tawhid', 'Epistles of Junayd on Tawhid', [],
    "Junayd of Baghdad's letters and aphorisms on divine unity, representing the sober school of Sufism. His measured articulation of mystical experience became the standard for orthodox Sufi expression.",
    'Epistle / Treatise', '9th century', ['writer_000043'], [], ['concept_000005', 'concept_000027'],
    ['arabic'], ['baghdad'], ['src_000010', 'src_000007', 'src_000008'], 'attributed', 'literary'),

  mkSong('song_000137', 'khushal-khan-armughani', 'Armughan-e-Khushal', ['Gift of Khushal'],
    "Pashto Sufi-inflected verse from Khushal Khan Khattak's extensive diwan. While primarily a warrior-poet, his introspective poetry contains significant Sufi themes of divine love and fate.",
    'Ghazal', '17th century', ['writer_000049'], [], ['concept_000001', 'concept_000047'],
    ['pashto'], ['kpk', 'peshawar'], ['src_000097', 'src_000070', 'src_000004'], 'attributed', 'literary'),

  mkSong('song_000138', 'shams-tabrizi-maqalat', 'Maqalat-e-Shams', ['Discourses of Shams'],
    "The recorded discourses of Shams-e Tabrizi, Rumi's transformative spiritual companion. These conversations document the radical pedagogical method that shattered Rumi's scholarly identity and birthed the greatest mystic poet.",
    'Discourse', '13th century', ['writer_000046'], [], ['concept_000031', 'concept_000022'],
    ['persian'], ['tabriz', 'konya'], ['src_000011', 'src_000001', 'src_000003'], 'attributed', 'literary'),
];

// Link singer_000011 (Abu Muhammad) to existing Sabri songs
const sabriSong = songs.find(s => s.id === 'song_000004');
if (sabriSong && !sabriSong.singerIds.includes('singer_000011')) {
  sabriSong.singerIds.push('singer_000011');
}

songs = songs.concat(newSongs);

// Count orphans
const usedW = new Set(); const usedS = new Set(); const usedC = new Set();
songs.forEach(s => { s.writerIds.forEach(w => usedW.add(w)); s.singerIds.forEach(si => usedS.add(si)); s.conceptIds.forEach(c => usedC.add(c)); });
const orphW = 50 - usedW.size; const orphS = 50 - usedS.size; const orphC = 50 - usedC.size;
console.log('After expansion:');
console.log('Total songs:', songs.length);
console.log('Orphan writers:', orphW, '(' + Math.round(orphW / 50 * 100) + '%)');
console.log('Orphan singers:', orphS, '(' + Math.round(orphS / 50 * 100) + '%)');
console.log('Orphan concepts:', orphC, '(' + Math.round(orphC / 50 * 100) + '%)');

// List remaining
const w50 = Array.from({ length: 50 }, (_, i) => 'writer_' + String(i + 1).padStart(6, '0'));
const s50 = Array.from({ length: 50 }, (_, i) => 'singer_' + String(i + 1).padStart(6, '0'));
const c50 = Array.from({ length: 50 }, (_, i) => 'concept_' + String(i + 1).padStart(6, '0'));
console.log('\nRemaining orphan writers:');
w50.filter(w => !usedW.has(w)).forEach(w => console.log('  ', w));
console.log('Remaining orphan singers:');
s50.filter(s => !usedS.has(s)).forEach(s => console.log('  ', s));
console.log('Remaining orphan concepts:');
c50.filter(c => !usedC.has(c)).forEach(c => console.log('  ', c));

// Write
const formatted = '[\n' + songs.map(d => '  ' + JSON.stringify(d)).join(',\n') + '\n]\n';
fs.writeFileSync(path.join(SEEDS, 'gold_songs.json'), formatted, 'utf-8');
console.log('\nWrote gold_songs.json (' + songs.length + ' entries)');
