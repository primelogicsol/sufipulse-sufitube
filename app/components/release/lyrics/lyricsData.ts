export const LYRIC_LANGUAGES = [
  { key: "roman_urdu", label: "Roman Urdu", direction: "ltr", order: 1 },
  { key: "urdu", label: "Urdu", direction: "rtl", order: 2 },
  { key: "hindi", label: "Hindi", direction: "ltr", order: 3 },
  { key: "arabic", label: "Arabic", direction: "rtl", order: 4 },
  { key: "turkish", label: "Turkish", direction: "ltr", order: 5 },
  { key: "persian", label: "Persian", direction: "rtl", order: 6 },
  { key: "punjabi", label: "Punjabi", direction: "ltr", order: 7 },
  { key: "indonesian", label: "Indonesian", direction: "ltr", order: 8 },
  { key: "spanish", label: "Spanish", direction: "ltr", order: 9 },
  { key: "portuguese", label: "Portuguese", direction: "ltr", order: 10 },
  { key: "french", label: "French", direction: "ltr", order: 11 },
  { key: "german", label: "German", direction: "ltr", order: 12 },
  { key: "russian", label: "Russian", direction: "ltr", order: 13 },
  { key: "bengali", label: "Bengali", direction: "ltr", order: 14 },
  { key: "chinese", label: "Chinese", direction: "ltr", order: 15 },
  { key: "japanese", label: "Japanese", direction: "ltr", order: 16 },
  { key: "english", label: "English", direction: "ltr", order: 17 }
] as const;

export type LanguageKey = typeof LYRIC_LANGUAGES[number]["key"];

export type CaptionCue = {
  id: string;
  start: number;
  end: number;
  text: string;
  stanza?: number;
  line?: number;
};

export type LyricsTrack = {
  languageKey: LanguageKey;
  label: string;
  direction: "ltr" | "rtl";
  versionType?: "original" | "translation" | "transliteration" | "adaptation";
  verified?: boolean;
  translator?: string;
  fullLyrics: { stanza: number; lines: string[] }[];
  cues: CaptionCue[];
};

// Dummy Master Cues
export const masterCues = [
  { id: "c1", start: 0, end: 4, stanza: 1, line: 1 },
  { id: "c2", start: 4, end: 8, stanza: 1, line: 2 },
  { id: "c3", start: 8, end: 12, stanza: 2, line: 1 },
  { id: "c4", start: 12, end: 16, stanza: 2, line: 2 },
  { id: "c5", start: 16, end: 20, stanza: 3, line: 1 },
  { id: "c6", start: 20, end: 25, stanza: 3, line: 2 },
];

export const dummyTracks: Record<LanguageKey, LyricsTrack> = {
  roman_urdu: {
    languageKey: "roman_urdu",
    label: "Roman Urdu",
    direction: "ltr",
    versionType: "original",
    verified: true,
    translator: "SufiPulse Editorial",
    fullLyrics: [
        { stanza: 1, lines: ["Tu hi hai mera asra", "Dil mein bas tera basera"] },
        { stanza: 2, lines: ["Tere siva koi nahi apna", "Roshni tera naam likha"] },
        { stanza: 3, lines: ["Bandagi mein mile sukoon", "Dua hai meri har peher"] }
    ],
    cues: [
        { id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Tu hi hai mera asra" },
        { id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "Dil mein bas tera basera" },
        { id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Tere siva koi nahi apna" },
        { id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Roshni tera naam likha" },
        { id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "Bandagi mein mile sukoon" },
        { id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Dua hai meri har peher" }
    ]
  },
  urdu: {
      languageKey: "urdu",
      label: "Urdu",
      direction: "rtl",
      versionType: "original",
      verified: true,
      translator: "SufiPulse Editorial",
      fullLyrics: [
          { stanza: 1, lines: ["تو ہی ہے میرا آسرا", "دل میں بس تیرا بسیرا"] },
          { stanza: 2, lines: ["تیرے سوا کوئی نہیں اپنا", "روشنی تیرا نام لکھا"] },
          { stanza: 3, lines: ["بندگی میں ملے سکون", "دعا ہے میری ہر پہر"] }
      ],
      cues: [
          { id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "تو ہی ہے میرا آسرا" },
          { id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "دل میں بس تیرا بسیرا" },
          { id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "تیرے سوا کوئی نہیں اپنا" },
          { id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "روشنی تیرا نام لکھا" },
          { id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "بندگی میں ملے سکون" },
          { id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "دعا ہے میری ہر پہر" }
      ]
  },
  english: {
      languageKey: "english",
      label: "English",
      direction: "ltr",
      versionType: "translation",
      verified: true,
      translator: "Language Desk",
      fullLyrics: [
          { stanza: 1, lines: ["You alone are my refuge", "In my heart is Your dwelling"] },
          { stanza: 2, lines: ["Besides You, there is no other", "Light is written as Your name"] },
          { stanza: 3, lines: ["In devotion is peace found", "This is my prayer every moment"] }
      ],
      cues: [
          { id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "You alone are my refuge" },
          { id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "In my heart is Your dwelling" },
          { id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Besides You, there is no other" },
          { id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Light is written as Your name" },
          { id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "In devotion is peace found" },
          { id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "This is my prayer every moment" }
      ]
  },
  arabic: { languageKey: "arabic", label: "Arabic", direction: "rtl", fullLyrics: [{ stanza: 1, lines: ["أنت وحدك ملجئي", "في قلبي مسكنك"] }, { stanza: 2, lines: ["لا أحد سواك", "النور هو اسمك"] }, { stanza: 3, lines: ["في العبادة يكمن السلام", "دعائي كل لحظة"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "أنت وحدك ملجئي"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "في قلبي مسكنك"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "لا أحد سواك"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "النور هو اسمك"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "في العبادة يكمن السلام"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "دعائي كل لحظة"}] },
  persian: { languageKey: "persian", label: "Persian", direction: "rtl", fullLyrics: [{ stanza: 1, lines: ["تو تنها پناه منی", "در قلبم مسکن توست"] }, { stanza: 2, lines: ["جز تو هیچکس نیست", "نور نام توست"] }, { stanza: 3, lines: ["در عبادت آرامش است", "دعای من هر لحظه"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "تو تنها پناه منی"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "در قلبم مسکن توست"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "جز تو هیچکس نیست"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "نور نام توست"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "در عبادت آرامش است"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "دعای من هر لحظه"}] },
  hindi: { languageKey: "hindi", label: "Hindi", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["तू ही मेरा आसरा", "दिल में तेरा बसेरा"] }, { stanza: 2, lines: ["तेरे सिवा कोई नहीं", "रोशनी तेरा नाम"] }, { stanza: 3, lines: ["भक्ति में सुकून", "दुआ है यही"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "तू ही मेरा आसरा"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "दिल में तेरा बसेरा"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "तेरे सिवा कोई नहीं"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "रोशनी तेरा नाम"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "भक्ति में सुकून"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "दुआ है यही"}] },
  turkish: { languageKey: "turkish", label: "Turkish", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Tek sığınağım sensin", "Kalbimde senin yerin"] }, { stanza: 2, lines: ["Senden başka kimse yok", "Işık senin adındır"] }, { stanza: 3, lines: ["Huzur ibadettedir", "Duam her anadır"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Tek sığınağım sensin"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "Kalbimde senin yerin"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Senden başka kimse yok"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Işık senin adındır"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "Huzur ibadettedir"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Duam her anadır"}] },
  punjabi: { languageKey: "punjabi", label: "Punjabi", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Tu hi mera asra", "Dil vich tera vasera"] }, { stanza: 2, lines: ["Tere siva koi nahi", "Roshni tera naam"] }, { stanza: 3, lines: ["Bandagi vich sukoon", "Dua meri har veleh"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Tu hi mera asra"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "Dil vich tera vasera"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Tere siva koi nahi"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Roshni tera naam"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "Bandagi vich sukoon"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Dua meri har veleh"}] },
  indonesian: { languageKey: "indonesian", label: "Indonesian", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Hanya Engkau perlindunganku", "Di hatiku Engkau tinggal"] }, { stanza: 2, lines: ["Tiada yang lain selain Engkau", "Cahaya adalah nama-Mu"] }, { stanza: 3, lines: ["Dalam pengabdian ada kedamaian", "Doaku setiap waktu"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Hanya Engkau perlindunganku"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "Di hatiku Engkau tinggal"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Tiada yang lain selain Engkau"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Cahaya adalah nama-Mu"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "Dalam pengabdian ada kedamaian"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Doaku setiap waktu"}] },
  spanish: { languageKey: "spanish", label: "Spanish", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Solo tú eres mi refugio", "En mi corazón moras"] }, { stanza: 2, lines: ["No hay otro además de Ti", "La luz es tu nombre"] }, { stanza: 3, lines: ["En la devoción está la paz", "Mi oración de cada momento"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Solo tú eres mi refugio"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "En mi corazón moras"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "No hay otro además de Ti"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "La luz es tu nombre"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "En la devoción está la paz"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Mi oración de cada momento"}] },
  portuguese: { languageKey: "portuguese", label: "Portuguese", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Só tu és o meu refúgio", "Em meu coração resides"] }, { stanza: 2, lines: ["Não há outro além de Ti", "Luz é o teu nome"] }, { stanza: 3, lines: ["Na devoção há paz", "Minha oração de cada instante"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Só tu és o meu refúgio"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "Em meu coração resides"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Não há outro além de Ti"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Luz é o teu nome"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "Na devoção há paz"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Minha oração de cada instante"}] },
  french: { languageKey: "french", label: "French", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Toi seul es mon refuge", "Dans mon cœur tu résides"] }, { stanza: 2, lines: ["Il n'y en a pas d'autre que Toi", "La lumière est ton nom"] }, { stanza: 3, lines: ["Dans la dévotion se trouve la paix", "Ma prière de chaque instant"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Toi seul es mon refuge"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "Dans mon cœur tu résides"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Il n'y en a pas d'autre que Toi"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "La lumière est ton nom"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "Dans la dévotion se trouve la paix"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Ma prière de chaque instant"}] },
  german: { languageKey: "german", label: "German", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Du allein bist meine Zuflucht", "In meinem Herzen wohnst Du"] }, { stanza: 2, lines: ["Es gibt keinen anderen als Dich", "Licht ist Dein Name"] }, { stanza: 3, lines: ["In der Hingabe ist Frieden", "Mein Gebet jeden Moment"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Du allein bist meine Zuflucht"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "In meinem Herzen wohnst Du"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Es gibt keinen anderen als Dich"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Licht ist Dein Name"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "In der Hingabe ist Frieden"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Mein Gebet jeden Moment"}] },
  russian: { languageKey: "russian", label: "Russian", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["Только Ты мое убежище", "В моем сердце Ты живешь"] }, { stanza: 2, lines: ["Нет никого, кроме Тебя", "Свет - это Твое имя"] }, { stanza: 3, lines: ["В преданности - мир", "Моя молитва каждый миг"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "Только Ты мое убежище"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "В моем сердце Ты живешь"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "Нет никого, кроме Тебя"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "Свет - это Твое имя"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "В преданности - мир"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "Моя молитва каждый миг"}] },
  bengali: { languageKey: "bengali", label: "Bengali", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["তুমিই আমার আশ্রয়", "আমার অন্তরে তোমার বাস"] }, { stanza: 2, lines: ["তুমি ছাড়া আর কেউ নেই", "আলো তোমার নাম"] }, { stanza: 3, lines: ["ভক্তিতে শান্তি", "আমার প্রার্থনা প্রতি মুহূর্তে"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "তুমিই আমার আশ্রয়"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "আমার অন্তরে তোমার বাস"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "তুমি ছাড়া আর কেউ নেই"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "আলো তোমার নাম"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "ভক্তিতে শান্তি"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "আমার প্রার্থনা প্রতি মুহূর্তে"}] },
  chinese: { languageKey: "chinese", label: "Chinese", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["唯有你是我的避难所", "你在我心里"] }, { stanza: 2, lines: ["除了你别无他人", "光是你的名字"] }, { stanza: 3, lines: ["在奉献中找到平静", "这是我每时每刻的祈祷"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "唯有你是我的避难所"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "你在我心里"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "除了你别无他人"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "光是你的名字"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "在奉献中找到平静"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "这是我每时每刻的祈祷"}] },
  japanese: { languageKey: "japanese", label: "Japanese", direction: "ltr", fullLyrics: [{ stanza: 1, lines: ["あなただけが私の避難所です", "私の心の中にあなたはいます"] }, { stanza: 2, lines: ["あなた以外には誰もいません", "光はあなたの名前です"] }, { stanza: 3, lines: ["献身に平和があります", "これは私の毎瞬の祈りです"] }], cues: [{id: "c1", start: 0, end: 4, stanza: 1, line: 1, text: "あなただけが私の避難所です"}, {id: "c2", start: 4, end: 8, stanza: 1, line: 2, text: "私の心の中にあなたはいます"}, {id: "c3", start: 8, end: 12, stanza: 2, line: 1, text: "あなた以外には誰もいません"}, {id: "c4", start: 12, end: 16, stanza: 2, line: 2, text: "光はあなたの名前です"}, {id: "c5", start: 16, end: 20, stanza: 3, line: 1, text: "献身に平和があります"}, {id: "c6", start: 20, end: 25, stanza: 3, line: 2, text: "これは私の毎瞬の祈りです"}] },
};
