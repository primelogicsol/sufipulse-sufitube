/**
 * server/services/lyric-parser.ts
 *
 * Authoritative Canonical Lyric Parser & Structural Aligner for SufiPulse Studio.
 *
 * Responsibilities:
 *  1. Immutable Source Preservation: Never overwrites or modifies original canonical lyric text.
 *  2. Document Decomposition:
 *      - Song title (# ...)
 *      - Thematic subtitle (### ...)
 *      - Musical & performance directions (**[...]**)
 *      - Speaker tags (**शायर:**, **रब:**, **नौजवान:**)
 *      - Performed vocal lines (exactly matching genuine sung phrases)
 *  3. Four Linked Language Representations:
 *      A. Urdu Nastaliq (authentic Urdu Arabic script)
 *      B. Sufi English Translation (theologically faithful mystical translation)
 *      C. Roman Urdu (phonetic transliteration)
 *      D. Devanagari Urdu (preserves original Urdu vocabulary without Hindi substitutions)
 *  4. Phrase-Based Timeline Alignment:
 *      - Natural phrase-based vocal timing instead of naive uniform intervals.
 *      - Non-vocal intros, interludes, and pauses remain caption-free.
 *      - Subtitles stop cleanly before Part B.
 */

export interface ParsedVocalLine {
  vocalIndex: number;
  lineIndex: number;
  section: string;
  speaker: string;
  text: string;
  urduNastaliq?: string;
  englishTranslation?: string;
  romanUrdu?: string;
  devanagariUrdu?: string;
  startSeconds?: number;
  endSeconds?: number;
  confidence?: number;
}

export interface ParsedLyricElement {
  type: 'title' | 'subtitle' | 'direction' | 'speaker' | 'vocal_line';
  rawIndex: number;
  text: string;
  speaker?: string;
  section?: string;
  vocalIndex?: number;
}

export interface StructuredPoemDocument {
  title: string;
  thematicSubtitle: string;
  rawText: string;
  totalElements: number;
  vocalLineCount: number;
  elements: ParsedLyricElement[];
  vocalLines: ParsedVocalLine[];
}

// 136-Line Flagship Lexicon for "कब तक ख़ामोश? (फ़ितरत की तस्बीह, इंसान का हिसाब)"
export const FLAGSHIP_KAB_TAK_KHAMOSH_LEXICON: Record<
  string,
  { urdu: string; en: string; rom: string; deva: string }
> = {
  "या रब, कश्मीर की फ़िज़ा में आया,": {
    urdu: "یا رب، کشمیر کی فضا میں آیا،",
    en: "O Lord, I stepped into the air of Kashmir,",
    rom: "Ya Rab, Kashmir ki fiza mein aaya,",
    deva: "या रब, कश्मीर की फ़िज़ा में आया,"
  },
  "हर शजर को तेरी तस्बीह में पाया।": {
    urdu: "ہر شجر کو تیری تسبیح میں پایا۔",
    en: "And found every tree chanting Your sacred praise.",
    rom: "Har shajar ko Teri tasbeeh mein paaya.",
    deva: "हर शजर को तेरी तस्बीह में पाया।"
  },
  "कोहसारों में हैरत, दरिया में नूर,": {
    urdu: "کوہساروں میں حیرت، دریا میں نور،",
    en: "Wonder upon the mountains, divine radiance in the rivers,",
    rom: "Kohsaaron mein hairat, dariya mein noor,",
    deva: "कोहसारों में हैरत, दरिया में नूर,"
  },
  "हर ज़र्रे में तेरी क़ुदरत का ज़ुहूर।": {
    urdu: "ہر ذرے میں تیری قدرت کا ظہور۔",
    en: "In every particle, the manifestation of Your divine power.",
    rom: "Har zarrey mein Teri qudrat ka zuhoor.",
    deva: "हर ज़र्रे में तेरी क़ुदरत का ज़ुहूर।"
  },
  "मगर डल है ज़ख़्मी, वुलर बेक़रार,": {
    urdu: "مگر ڈل ہے زخمی، ولر بےقرار،",
    en: "Yet Dal Lake lies wounded, and Wular is restless with sorrow,",
    rom: "Magar Dal hai zakhmi, Wular be-qarar,",
    deva: "मगर डल है ज़ख़्मी, वुलर बेक़रार,"
  },
  "झेलम की मौजों में दर्द बेशुमार।": {
    urdu: "جہلم کی موجوں میں درد بےشمار۔",
    en: "In the waves of Jhelum flows boundless grief.",
    rom: "Jhelum ki maujon mein dard beshumaar.",
    deva: "झेलम की मौजों में दर्द बेशुमार।"
  },
  "तू मेरी निशानियों को पढ़ता रहा,": {
    urdu: "تو میری نشانیوں کو پڑھتا رہا،",
    en: "You continued to read My sacred signs in creation,",
    rom: "Tu Meri nishaaniyon ko padhta raha,",
    deva: "तू मेरी निशानियों को पढ़ता रहा,"
  },
  "मगर उनके ज़ख़्मों से ग़ाफ़िल रहा?": {
    urdu: "مگر ان کے زخموں سے غافل رہا؟",
    en: "Yet remained heedless of the wounds inflicted upon them?",
    rom: "Magar unke zakhmon se ghaafil raha?",
    deva: "मगर उनके ज़ख़्मों से ग़ाफ़िल रहा?"
  },
  "तुझे ज़ुबाँ दी, तुझे शऊर दिया,": {
    urdu: "تجھے زباں دی، تجھے شعور دیا،",
    en: "I granted you a voice, I endowed you with consciousness,",
    rom: "Tujhe zubaan di, tujhe sha'oor diya,",
    deva: "तुझे ज़ुबाँ दी, तुझे शऊर दिया,"
  },
  "फिर किसने तुझे ख़ामोश किया?": {
    urdu: "پھر کس نے تجھے خاموش کیا؟",
    en: "Then who silenced your tongue in the face of ruin?",
    rom: "Phir kis ne tujhe khamosh kiya?",
    deva: "फिर किसने तुझे ख़ामोश किया?"
  },
  "कब तक ख़ामोश... कब तक ख़ामोश?": {
    urdu: "کب تک خاموش... کب تک خاموش؟",
    en: "How long in silence... how long will you remain silent?",
    rom: "Kab tak khamosh... kab tak khamosh?",
    deva: "कब तक ख़ामोश... कब तक ख़ामोश?"
  },
  "ऐ अहल-ए-कश्मीर, कब तक ख़ामोश?": {
    urdu: "اے اہل کشمیر، کب تک خاموش؟",
    en: "O people of Kashmir, how long will you remain silent?",
    rom: "Ae ahl-e-Kashmir, kab tak khamosh?",
    deva: "ऐ अहल-ए-कश्मीर, कब तक ख़ामोश?"
  },
  "जब आब पुकारे, जब ख़ाक पुकारे,": {
    urdu: "جب آب پکارے، جب خاک پکارے،",
    en: "When the sacred waters cry out, when the earth itself calls,",
    rom: "Jab aab pukaare, jab khaak pukaare,",
    deva: "जब आब पुकारे, जब ख़ाक पुकारे,"
  },
  "जब रब की तस्बीह में अशजार पुकारें!": {
    urdu: "جب رب کی تسبیح میں اشجار پکاریں!",
    en: "When the trees invoke the Lord in cosmic remembrance!",
    rom: "Jab Rab ki tasbeeh mein ashjaar pukaarein!",
    deva: "जब रब की तस्बीह में अशजार पुकारें!"
  },
  "बोलो... बोलो... अब तो बोलो!": {
    urdu: "بولو... بولو... اب تو بولو!",
    en: "Speak... speak! Awake and speak!",
    rom: "Bolo... bolo... ab toh bolo!",
    deva: "बोलो... बोलो... अब तो बोलो!"
  },
  "अपने ज़मीर के पर्दे खोलो!": {
    urdu: "اپنے ضمیر کے پردے کھولو!",
    en: "Unveil the hidden veils of your conscience!",
    rom: "Apne zameer ke parde kholo!",
    deva: "अपने ज़मीर के पर्दे खोलो!"
  },
  "कब जागेगा तेरा सोया होश?": {
    urdu: "کب جاگے گا تیرا سویا ہوش؟",
    en: "When will your slumbering spirit awaken to truth?",
    rom: "Kab jaagega tera soya hosh?",
    deva: "कब जागेगा तेरा सोया होश?"
  },
  "या रब, क्या शजर तेरा ज़िक्र करें?": {
    urdu: "یا رب، کیا شجر تیرا ذکر کریں؟",
    en: "O Lord, do the trees chant Your divine remembrance?",
    rom: "Ya Rab, kya shajar Tera zikr karein?",
    deva: "या रब, क्या शजर तेरा ज़िक्र करें?"
  },
  "क्या दरिया भी तेरी तस्बीह पढ़ें?": {
    urdu: "کیا دریا بھی تیری تسبیح پڑھیں؟",
    en: "Do the flowing rivers also recite Your sacred praise?",
    rom: "Kya dariya bhi Teri tasbeeh padhein?",
    deva: "क्या दरिया भी तेरी तस्बीह पढ़ें?"
  },
  "क्या चश्मों में कोई पोशीदा कलाम?": {
    urdu: "کیا چشموں میں کوئی پوشیدہ کلام؟",
    en: "Is there a hidden word whispering through the freshwater springs?",
    rom: "Kya chashmon mein koi posheeda kalaam?",
    deva: "क्या चश्मों में कोई पोशीदा कलाम?"
  },
  "क्या बाद-ए-सबा में तेरा पैग़ाम?": {
    urdu: "کیا بادِ صبا میں تیرا پیغام؟",
    en: "Does the morning breeze carry Your eternal message?",
    rom: "Kya baad-e-saba mein Tera paighaam?",
    deva: "क्या बाद-ए-सबा में तेरा पैग़ाम?"
  },
  "तू उनकी तस्बीह का राज़ पूछे,": {
    urdu: "تو ان کی تسبیح کا راز پوچھے،",
    en: "You ask of the secret behind their sacred praise,",
    rom: "Tu unki tasbeeh ka raaz poochhe,",
    deva: "तू उनकी तस्बीह का राज़ पूछे,"
  },
  "अपने अमल का हिसाब क्यों भूले?": {
    urdu: "اپنے عمل کا حساب کیوں بھولے؟",
    en: "Why then do you forget the reckoning of your own deeds?",
    rom: "Apne amal ka hisaab kyon bhoole?",
    deva: "अपने अमल का हिसाब क्यों भूले?"
  },
  "जो शजर मेरी नेमत कहलाए,": {
    urdu: "جو شجر میری نعمت کہلائے،",
    en: "The sacred tree that was bestowed as My blessing,",
    rom: "Jo shajar Meri naemat kehlaaye,",
    deva: "जो शजर मेरी नेमत कहलाए,"
  },
  "उसे काटकर तू क्या पाए?": {
    urdu: "اسے کاٹ کر تو کیا پائے؟",
    en: "What do you gain by cutting it down in greed?",
    rom: "Use kaat kar tu kya paaye?",
    deva: "उसे काटकर तू क्या पाए?"
  },
  "जो आब तेरी हयात का सहारा,": {
    urdu: "جو آب تیری حیات کا سہارا،",
    en: "The living water that sustains your very life,",
    rom: "Jo aab teri hayaat ka sahaara,",
    deva: "जो आब तेरी हयात का सहारा,"
  },
  "उसे आलूदा किसने कर डाला?": {
    urdu: "اسے آلودہ کس نے کر ڈالا؟",
    en: "Who turned it foul and poisoned its flow?",
    rom: "Use aaloodah kis ne kar daala?",
    deva: "उसे आलूदा किसने कर डाला?"
  },
  "हर शजर की तस्बीह, हर क़तरे का ज़िक्र,": {
    urdu: "ہر شجر کی تسبیح، ہر قطرے کا ذکر،",
    en: "Every tree in glorification, every drop in remembrance,",
    rom: "Har shajar ki tasbeeh, har qatre ka zikr,",
    deva: "हर शजर की तस्बीह, हर क़तरे का ज़िक्र,"
  },
  "फ़ितरत की हिफ़ाज़त, ईमान की फ़िक्र!": {
    urdu: "فطرت کی حفاظت، ایمان کی فکر!",
    en: "Protecting nature is the sacred conscience of faith!",
    rom: "Fitrat ki hifaazat, imaan ki fikr!",
    deva: "फ़ितरत की हिफ़ाज़त, ईमान की फ़िक्र!"
  },
  "तूने मीज़ान का फ़रमान दिया,": {
    urdu: "تو نے میزان کا فرمان دیا،",
    en: "You commanded the Divine Balance (Meezan) across existence,",
    rom: "Tu ne Meezan ka farmaan diya,",
    deva: "तूने मीज़ान का फ़रमान दिया,"
  },
  "हर शय को इक तवाज़ुन दिया।": {
    urdu: "ہر شے کو اک توازن دیا۔",
    en: "And established every creation in perfect harmony.",
    rom: "Har shay ko ik tawaazun diya.",
    deva: "हर शय को इक तवाज़ुन दिया।"
  },
  "फिर झीलों में गाद क्यों बढ़ती गई?": {
    urdu: "پھر جھیلوں میں گاد کیوں بڑھتی گئی؟",
    en: "Why then did silt and refuse choke the pristine lakes?",
    rom: "Phir jheelon mein gaad kyon badhti gayi?",
    deva: "फिर झीलों में गाद क्यों बढ़ती गई?"
  },
  "सब्ज़ ज़मीन क्यों सिमटती गई?": {
    urdu: "سبز زمین کیوں سمٹتی گئی؟",
    en: "Why did the green meadows wither and shrink away?",
    rom: "Sabz zameen kyon simatti gayi?",
    deva: "सब्ज़ ज़मीन क्यों सिमटती गई?"
  },
  "कहीं ख़ुश्कसाली, कहीं सैलाब,": {
    urdu: "کہیں خشک سالی، کہیں سیلاب،",
    en: "Here drought scorches the land, there floods ravage the shores,",
    rom: "Kahin khushk-saali, kahin sailaab,",
    deva: "कहीं ख़ुश्कसाली, कहीं सैलाब,"
  },
  "किसके अमल का ये बिगड़ा हिसाब?": {
    urdu: "کس کے عمل کا یہ بگڑا حساب؟",
    en: "Whose reckless deeds brought this broken reckoning?",
    rom: "Kis ke amal ka yeh bigda hisaab?",
    deva: "किसके अमल का ये बिगड़ा हिसाब?"
  },
  "मीज़ान का नाम ज़ुबाँ पे लाए,": {
    urdu: "میزان کا نام زباں پہ لائے،",
    en: "You speak the sacred name of the Divine Balance on your tongue,",
    rom: "Meezan ka naam zubaan pe laaye,",
    deva: "मीज़ान का नाम ज़ुबाँ पे लाए,"
  },
  "फिर उसके तवाज़ुन को ख़ुद मिटाए?": {
    urdu: "پھر اس کے توازن کو خود مٹائے؟",
    en: "Yet destroy its harmony with your own hands?",
    rom: "Phir uske tawaazun ko khud mitaaye?",
    deva: "फिर उसके तवाज़ुन को ख़ुद मिटाए?"
  },
  "तू आब की राहों में दीवार करे,": {
    urdu: "تو آب کی راہوں میں دیوار کرے،",
    en: "You build concrete walls in the pathways of living water,",
    rom: "Tu aab ki raahon mein deewaar kare,",
    deva: "तू आब की राहों में दीवार करे,"
  },
  "फिर सैलाब से क्यों फ़रियाद करे?": {
    urdu: "پھر سیلاب سے کیوں فریاد کرے؟",
    en: "Then weep and lament when the raging flood arrives?",
    rom: "Phir sailaab se kyon fariyaad kare?",
    deva: "फिर सैलाब से क्यों फ़रियाद करे?"
  },
  "तू क़ुदरत का निज़ाम बिगाड़ता जाए,": {
    urdu: "تو قدرت کا نظام بگاڑتا جائے،",
    en: "You relentlessly rupture the balance of creation,",
    rom: "Tu qudrat ka nizaam bigaadta jaaye,",
    deva: "तू क़ुदरत का निज़ाम बिगाड़ता जाए,"
  },
  "फिर हर मुसीबत को मेरी रज़ा बताए?": {
    urdu: "پھر ہر مصیبت کو میری رضا بتائے؟",
    en: "Then claim each calamity was My divine will?",
    rom: "Phir har museebat ko Meri raza bataaye?",
    deva: "फिर हर मुसीबत को मेरी रज़ा बताए?"
  },
  "न मीज़ान तोड़ो, न अमानत बेचो,": {
    urdu: "نہ میزان توڑو، نہ امانت بیچو،",
    en: "Do not break the Divine Balance, do not betray the sacred trust,",
    rom: "Na Meezan todo, na amaanat becho,",
    deva: "न मीज़ान तोड़ो, न अमानत बेचो,"
  },
  "न आने वाली नस्लों का हक़ बेचो!": {
    urdu: "نہ آنے والی نسلوں کا حق بیچو!",
    en: "Do not barter away the rightful heritage of future generations!",
    rom: "Na aane waali naslon ka haq becho!",
    deva: "न आने वाली नस्लों का हक़ बेचो!"
  },
  "या रब, तूने ख़लीफ़ा बनाया,": {
    urdu: "یا رب، تو نے خلیفہ بنایا،",
    en: "O Lord, You designated humanity as trustees on earth,",
    rom: "Ya Rab, Tu ne Khalifa banaaya,",
    deva: "या रब, तूने ख़लीफ़ा बनाया,"
  },
  "इंसान को अमानतदार बताया।": {
    urdu: "انسان کو امانت دار بتایا۔",
    en: "And entrusted humanity with the custody of creation.",
    rom: "Insaan ko amaanat-daar bataaya.",
    deva: "इंसान को अमानतदार बताया।"
  },
  "क्या मालिक हूँ मैं तेरी ज़मीन का?": {
    urdu: "کیا مالک ہوں میں تیری زمین کا؟",
    en: "Am I the absolute master of Your earth?",
    rom: "Kya maalik hoon main Teri zameen ka?",
    deva: "क्या मालिक हूँ मैं तेरी ज़मीन का?"
  },
  "क्या हाकिम हूँ मैं हर नेमत का?": {
    urdu: "کیا حاکم ہوں میں ہر نعمت کا؟",
    en: "Am I the sole ruler over every divine bounty?",
    rom: "Kya haakim hoon main har naemat ka?",
    deva: "क्या हाकिम हूँ मैं हर नेमत का?"
  },
  "तू मालिक होने का दावा करे,": {
    urdu: "تو مالک ہونے کا دعویٰ کرے،",
    en: "You boast ownership of the earth,",
    rom: "Tu maalik hone ka daawa kare,",
    deva: "तू मालिक होने का दावा करे,"
  },
  "अमानत का हक़ अदा न करे?": {
    urdu: "امانت کا حق ادا نہ کرے؟",
    en: "Yet fail to honor the obligations of the sacred trust?",
    rom: "Amaanat ka haq ada na kare?",
    deva: "अमानत का हक़ अदा न करे?"
  },
  "जो तेरे सुपुर्द है, तेरी मिल्क नहीं,": {
    urdu: "جو تیرے سپرد ہے، تیری ملک نہیں،",
    en: "What is entrusted to your care is not your possession,",
    rom: "Jo tere supurd hai, teri milk nahin,",
    deva: "जो तेरे सुपुर्द है, तेरी मिल्क नहीं,"
  },
  "तेरी ख़्वाहिश उसकी तक़दीर नहीं!": {
    urdu: "تیری خواہش اس کی تقدیر نہیں!",
    en: "Your whims shall not dictate the fate of nature!",
    rom: "Teri khwaahish uski taqdeer nahin!",
    deva: "तेरी ख़्वाहिश उसकी तक़दीर नहीं!"
  },
  "तू ख़लीफ़ा होने पे फ़ख़्र करे,": {
    urdu: "تو خلیفہ ہونے پہ فخر کرے،",
    en: "You take pride in being called a Khalifa,",
    rom: "Tu Khalifa hone pe fakhr kare,",
    deva: "तू ख़लीफ़ा होने पे फ़ख़्र करे,"
  },
  "फिर मख़लूक़ पे इतना क़हर करे?": {
    urdu: "پھر مخلوق پہ اتنا قہر کرے؟",
    en: "Yet unleash such cruelty upon living creations?",
    rom: "Phir makhlooq pe itna qahar kare?",
    deva: "फिर मख़लूक़ पे इतना क़हर करे?"
  },
  "लल आरिफ़ा की इरफ़ानी सदा,": {
    urdu: "لل عارفہ کی عرفانی صدا،",
    en: "The mystical verses of Lal Arifa echoing through the valley,",
    rom: "Lall Arifa ki irfaani sada,",
    deva: "लल आरिफ़ा की इरफ़ानी सदा,"
  },
  "नुंद ऋषि की ज़िंदगी में ज़ुह्द-ओ-रज़ा।": {
    urdu: "نند رشی کی زندگی میں زہد و رضا۔",
    en: "Nund Rishi's life of ascetism, reverence, and surrender.",
    rom: "Nund Rishi ki zindagi mein zuhd-o-raza.",
    deva: "नुंद ऋषि की ज़िंदगी में ज़ुह्द-ओ-रज़ा।"
  },
  "शाह-ए-हमदान का इल्म-ओ-हुनर,": {
    urdu: "شاہِ ہمدان کا علم و ہنر،",
    en: "The wisdom, learning, and craftsmanship of Mir Sayyid Ali Hamadani,",
    rom: "Shah-e-Hamadan ka ilm-o-hunar,",
    deva: "शाह-ए-हमदान का इल्म-ओ-हुनर,"
  },
  "ज़ैनुद्दीन वली की फ़क़ीरी का असर।": {
    urdu: "زین الدین ولی کی فقیری کا اثر۔",
    en: "The profound grace of Zainuddin Wali's spiritual poverty.",
    rom: "Zainuddin Wali ki faqiri ka asar.",
    deva: "ज़ैनुद्दीन वली की फ़क़ीरी का असर।"
  },
  "चरार का आस्ताँ, ऐशमुक़ाम की ग़ार,": {
    urdu: "چرار کا آستاں، عیش مقام کی غار،",
    en: "The sanctuary of Charar, the sacred cave of Aishmuqam,",
    rom: "Charar ka aastaan, Aishmuqam ki ghaar,",
    deva: "चरार का आस्ताँ, ऐशमुक़ाम की ग़ार,"
  },
  "बाबा पयामुद्दीन का रूहानी दयार।": {
    urdu: "بابا پیام الدین کا روحانی دیار۔",
    en: "The spiritual sanctuary of Baba Payamuddin Rishi.",
    rom: "Baba Payamuddin ka roohaani dayaar.",
    deva: "बाबा पयामुद्दीन का रूहानी दयार।"
  },
  "तू औलिया के मज़ार सजाए,": {
    urdu: "تو اولیاء کے مزار سجائے،",
    en: "You decorate the shrines of the sacred saints,",
    rom: "Tu auliya ke mazaar sajaaye,",
    deva: "तू औलिया के मज़ार सजाए,"
  },
  "मगर उनकी ख़ाक को आलूदा बनाए?": {
    urdu: "مگر ان کی خاک کو آلودہ بنائے؟",
    en: "Yet desecrate and pollute the holy soil they walked upon?",
    rom: "Magar unki khaak ko aaloodah banaaye?",
    deva: "मगर उनकी ख़ाक को आलूदा बनाए?"
  },
  "तू फ़क़्र की महफ़िल आबाद करे,": {
    urdu: "تو فقر کی محفل آباد کرے،",
    en: "You gather in assemblies praising spiritual devotion,",
    rom: "Tu faqr ki mehfil aabaad kare,",
    deva: "तू फ़क़्र की महफ़िल आबाद करे,"
  },
  "फिर इसराफ़ से क्यूँ फ़साद करे?": {
    urdu: "پھر اسراف سے کیوں فساد کرے؟",
    en: "Then sow ruin and devastation through lavish waste?",
    rom: "Phir israaf se kyon fasaad kare?",
    deva: "फिर इसराफ़ से क्यूँ फ़साद करे?"
  },
  "उनकी अक़ीदत का दावा न कर,": {
    urdu: "ان کی عقیدت کا دعویٰ نہ کر،",
    en: "Do not claim devotion to the saints of Kashmir,",
    rom: "Unki aqeedat ka daawa na kar,",
    deva: "उनकी अक़ीदत का दावा न कर,"
  },
  "जब तक अमल में उसका असर न कर!": {
    urdu: "جب تک عمل میں اس کا اثر نہ کر!",
    en: "Unless their righteous spirit transforms your deeds!",
    rom: "Jab tak amal mein uska asar na kar!",
    deva: "जब तक अमल में उसका असर न कर!"
  },
  "ज़िक्र-ए-ख़ुदा से जागे होश!": {
    urdu: "ذکرِ خدا سے جاگے ہوش!",
    en: "Let your inner spirit awaken through sacred remembrance!",
    rom: "Zikr-e-Khuda se jaage hosh!",
    deva: "ज़िक्र-ए-ख़ुदा से जागे होश!"
  },
  "न सिर्फ़ तस्बीह, न सिर्फ़ कलाम,": {
    urdu: "نہ صرف تسبیح، نہ صرف کلام،",
    en: "Not through mere chanting or empty speech,",
    rom: "Na sirf tasbeeh, na sirf kalaam,",
    deva: "न सिर्फ़ तस्बीह, न सिर्फ़ कलाम,"
  },
  "अमानत की हिफ़ाज़त भी नेक काम!": {
    urdu: "امانت کی حفاظت بھی نیک کام!",
    en: "Safeguarding creation is the truest righteous devotion!",
    rom: "Amaanat ki hifaazat bhi nek kaam!",
    deva: "अमानत की हिफ़ाज़त भी नेक काम!"
  },
  "या रब, फ़साद फ़िल-अर्ज़ क्या है?": {
    urdu: "یا رب، فساد فی الارض کیا ہے؟",
    en: "O Lord, what is the true meaning of 'Corruption upon the Earth'?",
    rom: "Ya Rab, fasaad fil-ardh kya hai?",
    deva: "या रब, फ़साद फ़िल-अर्ज़ क्या है?"
  },
  "क्या फ़ितरत की तबाही भी इसमें है?": {
    urdu: "کیا فطرت کی تباہی بھی اس میں ہے؟",
    en: "Does the destruction of nature belong to this grave transgression?",
    rom: "Kya fitrat ki tabaahi bhi is mein hai?",
    deva: "क्या फ़ितरत की तबाही भी इसमें है?"
  },
  "जो चश्मों में आलूदगी बहाए,": {
    urdu: "جو چشموں میں آلودگی بہائے،",
    en: "Those who dump filth into the pure mountain springs,",
    rom: "Jo chashmon mein aaloodgi bahaaye,",
    deva: "जो चश्मों में आलूदगी बहाए,"
  },
  "जो जंगल काटे, आब मिटाए?": {
    urdu: "جو جنگل کاٹے، آب مٹائے؟",
    en: "Those who fell the ancient forests and drain the living waters?",
    rom: "Jo jangal kaate, aab mitaaye?",
    deva: "जो जंगल काटे, आब मिटाए?"
  },
  "जो रिज़्क़ की ख़ातिर ज़हर फैलाए,": {
    urdu: "جو رزق کی خاطر زہر پھیلائے،",
    en: "Those who spread poisons across the soil for fleeting profit,",
    rom: "Jo rizq ki khaatir zehar phailaaye,",
    deva: "जो रिज़्क़ की ख़ातिर ज़हर फैलाए,"
  },
  "क्या वो तेरे मीज़ान को ठेस पहुँचाए?": {
    urdu: "کیا وہ تیرے میزان کو ٹھیس پہنچائے؟",
    en: "Do they not wound Your Divine Balance and order?",
    rom: "Kya woh Tere Meezan ko thes pahunchaaye?",
    deva: "क्या वो तेरे मीज़ान को ठेस पहुँचाए?"
  },
  "तू फ़साद को बस ख़ून समझे,": {
    urdu: "تو فساد کو بس خون سمجھے،",
    en: "You perceive corruption solely as bloodshed and violence,",
    rom: "Tu fasaad ko bas khoon samjhe,",
    deva: "तू फ़साद को बस ख़ून समझे,"
  },
  "ज़मीन के ज़ख़्मों को क्यों न समझे?": {
    urdu: "زمین کے زخموں کو کیوں نہ سمجھے؟",
    en: "Why do you not perceive the bleeding wounds of the earth?",
    rom: "Zameen ke zakhmon ko kyon na samjhe?",
    deva: "ज़मीन के ज़ख़्मों को क्यों न समझे?"
  },
  "तेरे हाथों के अमल का निशाँ,": {
    urdu: "تیرے ہاتھوں کے عمل کا نشاں،",
    en: "The consequences wrought by the labor of your own hands,",
    rom: "Tere haathon ke amal ka nishaan,",
    deva: "तेरे हाथों के अमल का निशाँ,"
  },
  "क्यों बिगड़ता जाए आब-ओ-जहाँ?": {
    urdu: "کیوں بگڑتا جائے آب و جہاں؟",
    en: "Why does the world of water and living lands decay under your touch?",
    rom: "Kyon bigadta jaaye aab-o-jahaan?",
    deva: "क्यों बिगड़ता जाए आब-ओ-जहाँ?"
  },
  "जो नेमत को बर्बाद करता रहे,": {
    urdu: "جو نعمت کو برباد کرتا رہے،",
    en: "One who continually squanders and defiles divine blessings,",
    rom: "Jo naemat ko barbaad karta rahe,",
    deva: "जो नेमत को बर्बाद करता रहे,"
  },
  "वो अपने ज़मीर से कैसे बचे?": {
    urdu: "وہ اپنے ضمیر سے کیسے بچے؟",
    en: "How can that soul escape the judgment of its own conscience?",
    rom: "Woh apne zameer se kaise bache?",
    deva: "वो अपने ज़मीर से कैसे बचे?"
  },
  "जो जानकर भी ख़ामोश रहे,": {
    urdu: "جو جان کر بھی خاموش رہے،",
    en: "Those who witness wrongdoing with full knowledge yet stay silent,",
    rom: "Jo jaan kar bhi khamosh rahe,",
    deva: "जो जानकर भी ख़ामोश रहे,"
  },
  "जो देखकर भी बेहोश रहे।": {
    urdu: "جو دیکھ کر بھی بےہوش رہے۔",
    en: "Those who observe destruction yet remain numb and unmoved.",
    rom: "Jo dekh kar bhi behosh rahe.",
    deva: "जो देखकर भी बेहोश रहे।"
  },
  "जो इल्म रखे, मगर बोल न पाए,": {
    urdu: "جو علم رکھے، مگر بول نہ پائے،",
    en: "Those who possess knowledge, yet fear to speak out,",
    rom: "Jo ilm rakhe, magar बोल na paaye,",
    deva: "जो इल्म रखे, मगर बोल न पाए,"
  },
  "क्या उसका ज़मीर उसे माफ़ कर पाए?": {
    urdu: "کیا اس کا ضمیر اسے معاف کر پائے؟",
    en: "Can their conscience ever truly forgive them?",
    rom: "Kya uska zameer use maaf kar paaye?",
    deva: "क्या उसका ज़मीर उसे माफ़ कर पाए?"
  },
  "तू बातिल के ख़ौफ़ से चुप हो जाए,": {
    urdu: "تو باطل کے خوف سے چپ ہو جائے،",
    en: "You submit to silence out of fear of false powers,",
    rom: "Tu baatil ke khauf se chup ho jaaye,",
    deva: "तू बातिल के ख़ौफ़ से चुप हो जाए,"
  },
  "फिर हक़ का अलम कैसे उठाए?": {
    urdu: "پھر حق کا علم کیسے اٹھائے؟",
    en: "How then will you ever raise the banner of Truth?",
    rom: "Phir Haq ka alam kaise uthaaye?",
    deva: "फिर हक़ का अलम कैसे उठाए?"
  },
  "न बेदलील इल्ज़ाम लगा,": {
    urdu: "نہ بےدلیل الزام لگا،",
    en: "Make no accusations without proof or reason,",
    rom: "Na be-daleel ilzaam laga,",
    deva: "न बेदलील इल्ज़ाम लगा,"
  },
  "न डर के मारे सच को छुपा!": {
    urdu: "نہ ڈر کے مارے سچ کو چھپا!",
    en: "Nor hide the sacred Truth out of fear!",
    rom: "Na dar ke maare sach ko chhupa!",
    deva: "न डर के मारे सच को छुपा!"
  },
  "इल्म को अपना रहनुमा कर,": {
    urdu: "علم کو اپنا رہنما کر،",
    en: "Let true knowledge be your guiding light,",
    rom: "Ilm ko apna rehnuma kar,",
    deva: "इल्म को अपना रहनुमा कर,"
  },
  "इंसाफ़ के साथ सवाल भी कर!": {
    urdu: "انصاف کے ساتھ سوال بھی کر!",
    en: "And let justice demand righteous answers!",
    rom: "Insaaf ke saath sawaal bhi kar!",
    deva: "इंसाफ़ के साथ सवाल भी कर!"
  },
  "रब, तू क़ादिर, तू बेनियाज़,": {
    urdu: "رب، تو قادر، تو بےنیاز،",
    en: "Lord, You are All-Powerful, Self-Sufficient beyond need,",
    rom: "Rab, Tu Qaadir, Tu Be-niyaaz,",
    deva: "रब, तू क़ादिर, तू बेनियाज़,"
  },
  "तेरे लिए क्या मुश्किल है ये राज़?": {
    urdu: "تیرے لیے کیا مشکل ہے یہ راز؟",
    en: "What difficulty could this mystery hold for You?",
    rom: "Tere liye kya mushkil hai yeh raaz?",
    deva: "तेरे लिए क्या मुश्किल है ये राज़?"
  },
  "तू चाहे तो सब फिर सँवार दे,": {
    urdu: "تو چاہے تو سب پھر سنوار دے،",
    en: "If You will, You could restore everything to beauty,",
    rom: "Tu chaahe toh sab phir sanwaar de,",
    deva: "तू चाहे तो सब फिर सँवार दे,"
  },
  "उजड़े चमन को बहार दे!": {
    urdu: "اجڑے چمن کو بہار دے!",
    en: "And bless the desolate garden with a new spring!",
    rom: "Ujde chaman ko bahaar de!",
    deva: "उजड़े चमन को बहार दे!"
  },
  "तू मेरे करम का मुंतज़िर रहे,": {
    urdu: "تو میرے کرم کا منتظر رہے،",
    en: "You wait passively for My grace to intervene,",
    rom: "Tu Mere karam ka muntazir rahe,",
    deva: "तू मेरे करम का मुंतज़िर रहे,"
  },
  "अपने फ़र्ज़ से बेख़बर रहे?": {
    urdu: "اپنے فرض سے بےخبر رہے؟",
    en: "While remaining oblivious to your own duty?",
    rom: "Apne farz se be-khabar rahe?",
    deva: "अपने फ़र्ज़ से बेख़बर रहे?"
  },
  "मैंने तुझे अक़्ल दी, इख़्तियार दिया,": {
    urdu: "میں نے تجھے عقل دی، اختیار دیا،",
    en: "I endowed you with intellect, I granted you free will,",
    rom: "Main ne tujhe aql di, ikhtiyaar diya,",
    deva: "मैंने तुझे अक़्ल दी, इख़्तियार दिया,"
  },
  "हर अमानत का एहसास दिया।": {
    urdu: "ہر امانت کا احساس دیا۔",
    en: "And inscribed the reverence of trust within your soul.",
    rom: "Har amaanat ka ehsaas diya.",
    deva: "हर अमानत का एहसास दिया।"
  },
  "तू दुआ में चमन माँगता रहा,": {
    urdu: "تو دعا میں چمن مانگتا رہا،",
    en: "You prayed for flourishing green gardens in your prayers,",
    rom: "Tu dua mein chaman maangta raha,",
    deva: "तू दुआ में चमन माँगता रहा,"
  },
  "मगर अपने हाथों से उसे मिटाता रहा?": {
    urdu: "مگر اپنے ہاتھوں سے اسے مٹاتا رہا؟",
    en: "Yet eradicated that very garden with your own hands?",
    rom: "Magar apne haathon se use mitaata raha?",
    deva: "मगर अपने हाथों से उसे मिटाता रहा?"
  },
  "अब न ख़ामोश! अब न ख़ामोश!": {
    urdu: "اب نہ خاموش! اب نہ خاموش!",
    en: "No more silence! No longer shall we be silent!",
    rom: "Ab na khamosh! Ab na khamosh!",
    deva: "अब न ख़ामोश! अब न ख़ामोश!"
  },
  "बेदार हुआ है अपना होश!": {
    urdu: "بیدار ہوا ہے اپنا ہوش!",
    en: "Our collective consciousness has finally awakened!",
    rom: "Bedaar hua hai apna hosh!",
    deva: "बेदार हुआ है अपना होश!"
  },
  "डल भी बचाएँ, वुलर भी बचाएँ,": {
    urdu: "ڈل بھی بچائیں، ولر بھی بچائیں،",
    en: "We shall save Dal Lake, we shall restore Wular,",
    rom: "Dal bhi bachaayein, Wular bhi bachaayein,",
    deva: "डल भी बचाएँ, वुलर भी बचाएँ,"
  },
  "झेलम के साहिल फिर से सजाएँ!": {
    urdu: "جہلم کے ساحل پھر سے سجائیں!",
    en: "And rekindle the living banks of river Jhelum!",
    rom: "Jhelum ke saahil phir se sajaayein!",
    deva: "झेलम के साहिल फिर से सजाएँ!"
  },
  "चश्मे बचाएँ, जंगल बचाएँ,": {
    urdu: "چشمے بچائیں، جنگل بچائیں،",
    en: "Protect the pristine springs, protect the sacred forests,",
    rom: "Chashme bachaayein, jangal bachaayein,",
    deva: "चश्मे बचाएँ, जंगल बचाएँ,"
  },
  "हर ज़ख़्म का सच सामने लाएँ!": {
    urdu: "ہر زخم کا سچ سامنے لائیں!",
    en: "And unveil the honest truth behind every wound!",
    rom: "Har zakhm ka sach saamne laayein!",
    deva: "हर ज़ख़्म का सच सामने लाएँ!"
  },
  "न ख़ौफ़ से झुकें, न सच से हटें,": {
    urdu: "نہ خوف سے جھکیں، نہ سچ سے ہٹیں،",
    en: "Neither bowing to fear, nor turning away from Truth,",
    rom: "Na khauf se jhukein, na sach se hatein,",
    deva: "न ख़ौफ़ से झुकें, न सच से हटें,"
  },
  "इल्म की राहों पे बढ़ते रहें!": {
    urdu: "علم کی راہوں پہ بڑھتے رہیں!",
    en: "Steadfastly walking upon the illuminated path of wisdom!",
    rom: "Ilm ki raahon pe badhte rahein!",
    deva: "इल्म की राहों पे बढ़ते रहें!"
  },
  "अब ज़िंदा है अपना होश!": {
    urdu: "اب زندہ ہے اپنا ہوش!",
    en: "Now our consciousness breathes and lives!",
    rom: "Ab zinda hai apna hosh!",
    deva: "अब ज़िंदा है अपना होश!"
  },
  "ज़िक्र भी करेंगे, फ़िक्र भी करेंगे,": {
    urdu: "ذکر بھی کریں گے، فکر بھی کریں گے،",
    en: "We shall praise Him in remembrance, and protect His creation in conscience,",
    rom: "Zikr bhi karenge, fikr bhi karenge,",
    deva: "ज़िक्र भी करेंगे, फ़िक्र भी करेंगे,"
  },
  "मीज़ान-ए-फ़ितरत की हिफ़ाज़त करेंगे!": {
    urdu: "میزانِ فطرت کی حفاظت کریں گے!",
    en: "We shall guard the Divine Balance of Nature with our lives!",
    rom: "Meezan-e-fitrat ki hifaazat karenge!",
    deva: "मीज़ान-ए-फ़ितरत की हिफ़ाज़त करेंगे!"
  },
  "कश्मीर की ख़ाक, कश्मीर का आब,": {
    urdu: "کشمیر کی خاک، کشمیر کا آب،",
    en: "The holy soil of Kashmir, the living waters of Kashmir,",
    rom: "Kashmir ki khaak, Kashmir ka aab,",
    deva: "कश्मीर की ख़ाक, कश्मीर का आब,"
  },
  "हर नेमत का देना है हिसाब!": {
    urdu: "ہر نعمت کا دینا ہے حساب!",
    en: "For every single blessing, an account must be given!",
    rom: "Har naemat ka dena hai hisaab!",
    deva: "हर नेमत का देना है हिसाब!"
  },
  "नुंद ऋषि का पैग़ाम सँभालो,": {
    urdu: "نند رشی کا پیغام سنبھالو،",
    en: "Hold close the sacred wisdom of Nund Rishi,",
    rom: "Nund Rishi ka paighaam sambhaalo,",
    deva: "नुंद ऋषि का पैग़ाम सँभालो,"
  },
  "औलिया का इरफ़ान सँभालो!": {
    urdu: "اولیاء کا عرفان سنبھالو!",
    en: "Preserve the mystical illumination of the Kashmiri saints!",
    rom: "Auliya ka irfaan sambhaalo!",
    deva: "औलिया का इरफ़ान सँभालो!"
  },
  "या रब, अगर फिर ख़ामोश रहे?": {
    urdu: "یا رب، اگر پھر خاموش رہے؟",
    en: "\"O Lord, what if we sink back into silence?\"",
    rom: "Ya Rab, agar phir khamosh rahe?",
    deva: "या रब, अगर फिर ख़ामोश रहे?"
  },
  "तो अमानत का हिसाब क्या दोगे?": {
    urdu: "تو امانت کا حساب کیا دو گے؟",
    en: "\"Then what answer will you give for the Divine Trust?\"",
    rom: "Toh amaanat ka hisaab kya doge?",
    deva: "तो अमानत का हिसाब क्या दोगे?"
  },
  "अगर फ़ितरत के हक़ में बोल उठें?": {
    urdu: "اگر فطرت کے حق میں بول اٹھیں؟",
    en: "\"What if we rise and speak for the sanctity of nature?\"",
    rom: "Agar fitrat ke haq mein bol uthein?",
    deva: "अगर फ़ितरत के हक़ में बोल उठें?"
  },
  "तो अपने अमल से सुबूत भी दोगे?": {
    urdu: "تو اپنے عمل سے ثبوت بھی دو گے؟",
    en: "\"Then will you prove it through the integrity of your deeds?\"",
    rom: "Toh apne amal se suboot bhi doge?",
    deva: "तो अपने अमल से सुबूत भी दोगे?"
  },
  "तो इश्क़-ए-इलाही की पहचान?": {
    urdu: "تو عشقِ الٰہی کی پہچان؟",
    en: "\"Then what is the true hallmark of Divine Love?\"",
    rom: "Toh Ishq-e-Ilahi ki pehchaan?",
    deva: "तो इश्क़-ए-इलाही की पहचान?"
  },
  "क्या सिर्फ़ लफ़्ज़ हैं, या अमल-ओ-ईमान?": {
    urdu: "کیا صرف لفظ ہیں، یا عمل و ایمان؟",
    en: "\"Is it merely hollow words, or righteous action and living faith?\"",
    rom: "Kya sirf lafz hain, ya amal-o-imaan?",
    deva: "क्या सिर्फ़ लफ़्ज़ हैं, या अमल-ओ-ईमान?"
  },
  "कब तक ख़ामोश...": {
    urdu: "کب تک خاموش...",
    en: "How long in silence...",
    rom: "Kab tak khamosh...",
    deva: "कब तक ख़ामोश..."
  },
  "ये ख़ाक अमानत... ये आब अमानत...": {
    urdu: "یہ خاک امانت... یہ آب امانت...",
    en: "This sacred earth is a trust... this living water is a trust...",
    rom: "Yeh khaak amaanat... yeh aab amaanat...",
    deva: "ये ख़ाक अमानत... ये आब अमानत..."
  },
  "ये जंगल अमानत... ये जान अमानत...": {
    urdu: "یہ جنگل امانت... یہ جان امانت...",
    en: "These forests are a trust... this very breath is a trust...",
    rom: "Yeh jangal amaanat... yeh jaan amaanat...",
    deva: "ये जंगल अमानत... ये जान अमानत..."
  },
  "मैं तुझे सज्दों में ढूँढ़ता रहा...": {
    urdu: "میں تجھے سجدوں میں ڈھونڈتا رہا...",
    en: "\"I sought You in my prostrations...\"",
    rom: "Main Tujhe sajdon mein dhoondhta raha...",
    deva: "मैं तुझे सज्दों में ढूँढ़ता रहा..."
  },
  "और मेरी अमानत तेरे सामने उजड़ती रही...": {
    urdu: "اور میری امانت تیرے سامنے اجڑتی رہی...",
    en: "\"While My sacred trust was ravaged right before your eyes...\"",
    rom: "Aur Meri amaanat tere saamne ujadti rahi...",
    deva: "और मेरी अमानत तेरे सामने उजड़ती रही..."
  },
  "कब तक ख़ामोश?": {
    urdu: "کب تک خاموش؟",
    en: "How long in silence?",
    rom: "Kab tak khamosh?",
    deva: "कब तक ख़ामोश?"
  },
  "अब तो बोल...": {
    urdu: "اب تو بول...",
    en: "Awake and speak now...",
    rom: "Ab toh bol...",
    deva: "अब तो बोल..."
  }
};

/**
 * Parses a raw canonical lyric document markdown string into structured AST elements.
 * Preserves the exact raw text without modifications.
 */
export function parseCanonicalPoemDocument(rawText: string): StructuredPoemDocument {
  const lines = (rawText || '').split('\n');

  let title = '';
  let thematicSubtitle = '';
  let currentSection = 'आग़ाज़';
  let currentSpeaker = 'शायर';

  const elements: ParsedLyricElement[] = [];
  const vocalLines: ParsedVocalLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // 1. Song Title
    if (trimmed.startsWith('# ')) {
      title = trimmed.replace(/^#\s*/, '').trim();
      elements.push({
        type: 'title',
        rawIndex: i,
        text: title,
      });
      continue;
    }

    // 2. Thematic Subtitle
    if (trimmed.startsWith('### ')) {
      thematicSubtitle = trimmed.replace(/^###\s*/, '').trim();
      elements.push({
        type: 'subtitle',
        rawIndex: i,
        text: thematicSubtitle,
      });
      continue;
    }

    // 3. Performance / Musical Direction: **[...]** or [...]
    const dirMatch = trimmed.match(/^\*\*\[(.*?)\]\*\*$/) || trimmed.match(/^\[(.*?)\]$/);
    if (dirMatch) {
      currentSection = dirMatch[1].trim();
      elements.push({
        type: 'direction',
        rawIndex: i,
        text: currentSection,
        section: currentSection,
      });
      continue;
    }

    // 4. Speaker Label: **Speaker:** or Speaker:
    const spkMatch = trimmed.match(/^\*\*(.*?):\*\*$/) || trimmed.match(/^(.*?):$/);
    if (spkMatch && (spkMatch[1].includes('शायर') || spkMatch[1].includes('रब') || spkMatch[1].includes('नौजवान') || spkMatch[1].includes('कोरस'))) {
      currentSpeaker = spkMatch[1].trim();
      elements.push({
        type: 'speaker',
        rawIndex: i,
        text: currentSpeaker,
        speaker: currentSpeaker,
      });
      continue;
    }

    // 5. Performed Vocal Line
    const cleanLyric = trimmed.replace(/^["“”]/, '').replace(/["“”]$/, '').trim();
    const vIndex = vocalLines.length + 1;

    // Check flagship lexicon for perfect 4-language mapping
    const lex = FLAGSHIP_KAB_TAK_KHAMOSH_LEXICON[cleanLyric] || FLAGSHIP_KAB_TAK_KHAMOSH_LEXICON[cleanLyric.replace(/[,\.?!]$/, '')];

    const vocalEntry: ParsedVocalLine = {
      vocalIndex: vIndex,
      lineIndex: i,
      section: currentSection,
      speaker: currentSpeaker || 'कोरस',
      text: cleanLyric,
      urduNastaliq: lex?.urdu,
      englishTranslation: lex?.en,
      romanUrdu: lex?.rom,
      devanagariUrdu: lex?.deva || cleanLyric,
      confidence: lex ? 0.98 : 0.85,
    };

    vocalLines.push(vocalEntry);
    elements.push({
      type: 'vocal_line',
      rawIndex: i,
      text: cleanLyric,
      speaker: currentSpeaker,
      section: currentSection,
      vocalIndex: vIndex,
    });
  }

  return {
    title: title || 'कब तक ख़ामोश?',
    thematicSubtitle: thematicSubtitle || 'फ़ितरत की तस्बीह, इंसान का हिसाब',
    rawText,
    totalElements: elements.length,
    vocalLineCount: vocalLines.length,
    elements,
    vocalLines,
  };
}

/**
 * Natural Phrased Timeline Aligner:
 * Replaces equal-duration slicing with natural phrase-based alignment.
 * Non-vocal intros, interludes, and pauses remain caption-free.
 * Subtitles stop cleanly before Part B.
 */
export function alignVocalPhrasesToTimeline(
  vocalLines: ParsedVocalLine[],
  masterDurationSeconds: number = 285.2
): ParsedVocalLine[] {
  if (vocalLines.length === 0) return [];

  // If this is the 136-line flagship poem, use the calibrated musical windows
  if (vocalLines.length === 136) {
    const SECTION_WINDOWS = [
      { name: 'आग़ाज़ | पुर-असरार सुकूत, गहरी सरगोशी', start: 6.2, end: 27.2 },
      { name: 'मुखड़ा | पुरजोश, सवालिया गूँज', start: 28.5, end: 44.5 },
      { name: 'पहला सवाल | तस्बीह-ए-कायनात', start: 46.0, end: 66.0 },
      { name: 'छोटा उठान | गहरी धड़कन', start: 66.5, end: 71.5 },
      { name: 'दूसरा सवाल | मीज़ान-ए-इलाही', start: 73.0, end: 97.0 },
      { name: 'मुखड़ा | बुलंद, हमआहंग', start: 98.5, end: 110.5 },
      { name: 'तीसरा सवाल | ख़लीफ़ा और अमानत', start: 112.0, end: 132.0 },
      { name: 'चौथा सवाल | ऋषि-सूफ़ी विरासत', start: 133.5, end: 157.5 },
      { name: 'रूहानी दोहराव | तेज़, पुरकैफ़', start: 159.0, end: 167.0 },
      { name: 'पाँचवाँ सवाल | फ़साद फ़िल-अर्ज़', start: 168.5, end: 192.5 },
      { name: 'छठा सवाल | ख़ामोशी का गुनाह', start: 194.0, end: 214.0 },
      { name: 'पुल | शायर की बेबाकी, रब की सरज़निश', start: 215.5, end: 235.5 },
      { name: 'उरूज | नौजवानों की बुलंद सदा', start: 237.0, end: 253.0 },
      { name: 'आख़िरी मुखड़ा | बुलंद रूहानी उरूज', start: 254.5, end: 270.5 },
      { name: 'इख़्तिताम | गहरा सुकूत, आख़िरी सवाल', start: 271.5, end: 278.5 },
      { name: 'आख़िरी गूँज | सिर्फ़ आवाज़', start: 278.5, end: 283.0 },
      { name: 'आख़िरी सरगोशी', start: 283.0, end: 285.0 },
    ];

    let curIdx = 0;
    const aligned: ParsedVocalLine[] = [];

    for (const win of SECTION_WINDOWS) {
      const sectionVocals: ParsedVocalLine[] = [];
      while (curIdx < vocalLines.length && vocalLines[curIdx].section === win.name) {
        sectionVocals.push(vocalLines[curIdx]);
        curIdx++;
      }

      const count = sectionVocals.length;
      if (count === 0) continue;

      const totalWindow = win.end - win.start;
      const weights = sectionVocals.map((v) => Math.max(10, v.text.length));
      const sumWeights = weights.reduce((a, b) => a + b, 0);

      let currentSec = win.start;
      for (let i = 0; i < count; i++) {
        const rawDur = (weights[i] / sumWeights) * totalWindow;
        const phraseDur = i === count - 1 ? (win.end - currentSec) : (rawDur * 0.92);
        const startSeconds = Number(currentSec.toFixed(2));
        const endSeconds = Number(Math.min(masterDurationSeconds - 0.2, currentSec + phraseDur).toFixed(2));

        aligned.push({
          ...sectionVocals[i],
          startSeconds,
          endSeconds,
          confidence: 0, // Estimated phrasing is not measured vocal confidence.
        });

        currentSec += rawDur;
      }
    }

    if (aligned.length === vocalLines.length) {
      return aligned;
    }
  }

  // Generalized phrase-based proportional alignment with intro/outro boundaries
  const introLead = Math.min(6.0, masterDurationSeconds * 0.05);
  const effectiveDuration = Math.max(10, masterDurationSeconds - introLead - 2.0);
  const weights = vocalLines.map((v) => Math.max(8, v.text.length));
  const sumWeights = weights.reduce((a, b) => a + b, 0);

  let currentSec = introLead;
  return vocalLines.map((v, i) => {
    const rawDur = (weights[i] / sumWeights) * effectiveDuration;
    const phraseDur = Math.max(1.2, rawDur * 0.90);
    const startSeconds = Number(currentSec.toFixed(2));
    const endSeconds = Number(Math.min(masterDurationSeconds - 0.2, currentSec + phraseDur).toFixed(2));
    currentSec += rawDur;

    return {
      ...v,
      startSeconds,
      endSeconds,
      confidence: 0, // Proportional estimates must never be labeled verified.
    };
  });
}
