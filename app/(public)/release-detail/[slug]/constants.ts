export const LANGUAGE_OPTIONS = [
  { key: "roman_urdu", label: "Roman Urdu" },
  { key: "urdu", label: "Urdu" },
  { key: "hindi", label: "Hindi" },
  { key: "arabic", label: "Arabic" },
  { key: "turkish", label: "Turkish" },
  { key: "persian", label: "Persian (Farsi)" },
  { key: "punjabi", label: "Punjabi" },
  { key: "indonesian", label: "Indonesian" },
  { key: "spanish", label: "Spanish" },
  { key: "portuguese", label: "Portuguese" },
  { key: "french", label: "French" },
  { key: "german", label: "German" },
  { key: "russian", label: "Russian" },
  { key: "bengali", label: "Bengali" },
  { key: "chinese", label: "Chinese" },
  { key: "japanese", label: "Japanese" },
  { key: "english", label: "English" },
] as const;

export const RTL_LANG_KEYS = new Set(["urdu", "ar", "arabic", "fa", "persian"]);
