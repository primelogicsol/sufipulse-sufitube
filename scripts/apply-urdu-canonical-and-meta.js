const fs = require('fs');
const path = require('path');

const extraUrdu = {
  'कुछ लोग निशाँ छोड़ जाते हैं,': 'کچھ لوگ نشاں چھوڑ جاتے ہیں،',
  'ख़ामोशियाँ भी सुना जाते हैं।': 'خاموشیاں بھی سنا جاتے ہیں۔',
  'न ताज की ख़्वाहिश, न तख़्त का गुमाँ,': 'نہ تاج کی خواہش، نہ تخت کا گماں،',
  'बस दिलों में अपना मकाँ छोड़ जाते हैं।': 'بس دلوں میں اپنا مکاں چھوڑ جاتے ہیں۔',
  'बुझते चराग़ जला जाते हैं।': 'بجھتے چراغ جلا جاتے ہیں۔',
  'एक दिन ये रास्ते पीछे रहेंगे,': 'ایک دن یہ راستے پیچھے رہیں گے،',
  'ये मौसम, ये मंज़र बदलते रहेंगे।': 'یہ موسم، یہ منظر بدلتے رہیں گے،',
  'न जाने कहाँ तक सफ़र जाएगा,': 'نہ جانے کہاں تک سفر جائے گا،',
  'कौन किसको कब तक याद आएगा।': 'کون کس کو کب تک یاد آئے گا،',
  'मगर जिनके हाथों को इज़्ज़त मिली,': 'مگر جن کے ہاتھوں کو عزت ملی،',
  'जिनके हुनर को नई हिम्मत मिली,': 'جن کے ہنر کو نئی ہمت ملی،',
  'वो दिल से कभी मिटा न सकेंगे,': 'وہ دل سے کبھی مٹا نہ سکیں گے،',
  'कि कुछ लोग आए थे, जो साथ दे गए।': 'کہ کچھ لوگ آئے تھے، جو ساتھ دے گئے۔',
  'न नाम की ख़्वाहिश, न नाम का सवाल,': 'نہ نام کی خواہش، نہ نام کا سوال،',
  'बस काम से बनती है उनकी मिसाल।': 'بس کام سے بنتی ہے ان کی مثال۔',
  'कभी पहाड़ों की राहों में मिलेंगे,': 'کبھی پہاڑوں کی راہوں میں ملیں گے،',
  'कभी किताबों के सफ़्हों में मिलेंगे।': 'کبھی کتابوں کے صفحوں میں ملیں گے،',
  'कभी कारीगर की दुआओं में रहेंगे,': 'کبھی کاریگر کی دعاؤں میں رہیں گے،',
  'कभी दो चराग़ों की रौशनी में रहेंगे।': 'کبھی دو چراغوں की روشنی میں رہیں گے،',
  'न हर दास्ताँ को कोई नाम चाहिए,': 'نہ ہر داستاں کو کوئی نام چاہیے،',
  'न हर ख़िदमत को कोई इनाम चाहिए।': 'نہ ہر خدمت کو کوئی انعام چاہیے،',
  'कुछ लोग...': 'کچھ لوگ...',
  'बस निशाँ छोड़ जाते हैं।': 'بس نشاں چھوڑ جاتے ہیں۔'
};

const draftPath = '.data/pipeline-drafts/draft_1794752884539_0eb391d5/draft.json';
const draft = JSON.parse(fs.readFileSync(draftPath, 'utf8'));
const devText = draft.canonicalLyrics.text;
const lines = draft.masterTimeline.lines;

let lineCounter = 0;
const urduLines = devText.split('\n').map(l => {
  const trimmed = l.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('#')) return '# کچھ لوگ نشاں چھوڑ جاتے ہیں';
  if (trimmed.startsWith('[')) return l; // Keep section headers

  if (extraUrdu[trimmed]) return extraUrdu[trimmed];
  const clean = trimmed.replace(/[,\.?!।]$/, '');
  if (extraUrdu[clean]) return extraUrdu[clean];

  if (lines[lineCounter] && lines[lineCounter].urduNastaliq) {
    const ur = lines[lineCounter].urduNastaliq;
    lineCounter++;
    return ur;
  }

  return trimmed;
});

const fullUrduLyrics = urduLines.join('\n').replace('دو چراغوں की روشنی', 'دو چراغوں کی روشنی');
console.log('Converted full canonical lyrics to Urdu. Any Devanagari remaining?:', /[\u0900-\u097F]/.test(fullUrduLyrics));

// 1. Update draft.json
draft.canonicalLyrics.text = fullUrduLyrics;
draft.canonicalLyrics.primaryLanguage = 'ur';
draft.updatedAt = new Date().toISOString();
fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2), 'utf8');
console.log('Successfully updated draft.json with pure Urdu canonical lyrics!');

// 2. Update .data/cms-releases.json
const cmsPath = '.data/cms-releases.json';
const cmsData = JSON.parse(fs.readFileSync(cmsPath, 'utf8'));

let target;
if (Array.isArray(cmsData)) {
  target = cmsData.find(r => r.id === 'studio_draft_1794752884539_0eb391d5');
} else {
  target = cmsData['studio_draft_1794752884539_0eb391d5'] || Object.values(cmsData).find(r => r.id === 'studio_draft_1794752884539_0eb391d5');
}

if (target) {
  target.canonicalLyrics = {
    ...(target.canonicalLyrics || {}),
    text: fullUrduLyrics,
    primaryLanguage: 'ur',
    languages: ['ur', 'en', 'en-rom', 'hi'],
    status: 'APPROVED',
    approvedAt: new Date().toISOString(),
  };

  target.description = [
    'Some People Leave Footprints Behind (کچھ لوگ نشاں چھوڑ جاتے ہیں) | SufiPulse USA',
    'An original musical reflection by Dr. Zarf-e-Noori, presented by SufiPulse USA.\n\nSome People Leave Footprints Behind is a soulful reflection on those who make a difference through service, knowledge, compassion, courage, and quiet dedication—traveling through mountain trails, the writer’s inner world, the living dignity of Kashmir’s master artisans, fatherhood, and the enduring influence of those who help others turn ideas into meaningful action.\n\n“Some people leave footprints behind,\nNot carved in stone, but in our lives.”',
    'Official lyrics and available language tracks are sourced from the approved Hybrid Studio master.'
  ].join('\n\n');

  target.premiereDescription = "Some People Leave Footprints Behind (کچھ لوگ نشاں چھوڑ جاتے ہیں) is an original musical reflection by Dr. Zarf-e-Noori, presented by SufiPulse USA. A soulful tribute to those who make a difference through service, knowledge, compassion, and quiet dedication—traveling through mountain trails, the writer's inner world, the living dignity of Kashmir's master craftspeople, fatherhood, and the enduring influence of those who uplift others without seeking personal recognition or royal acclaim. Not every legacy needs a monument; some lives are remembered through the good they leave behind.";

  target.premiereCtaLabel = "Explore Footprints Behind";

  target.seoKeywords = [
    'Some People Leave Footprints Behind',
    'Footprints Behind',
    'کچھ لوگ نشاں چھوڑ جاتے ہیں',
    'Kuchh Log Nishaan Chhod Jaate Hain',
    'Dr. Zarf-e-Noori',
    'Mahmood Ahmad Shah',
    'SufiPulse USA',
    'Kashmir master artisans',
    'Kashmiri handicrafts',
    'Pashmina weavers',
    'Sozni embroidery Kashmir',
    'Kani shawl heritage',
    'Walnut wood carving Kashmir',
    'Craftlore',
    'KHCRF',
    'Sufi poetry',
    'Urdu Ghazal',
    'Spiritual altruism',
    'Silent guardians',
    'Living crafts of Kashmir',
    'Dignity of labor Sufism',
    'Mystical kalam SufiPulse'
  ];

  target.updatedAt = new Date().toISOString();
  fs.writeFileSync(cmsPath, JSON.stringify(cmsData, null, 2), 'utf8');
  console.log('Successfully updated .data/cms-releases.json with pure Urdu canonical lyrics, title, description and premiereDescription!');
} else {
  console.error('Target release not found in cms-releases.json!');
}
