export const roleDisplayMap = {
  // Writers (Ahl-e-Qalam)
  // Vocalists (Ahl-e-Sada)
  // Producers (Ahl-e-Naghma)
  // Literary Contributors (Ahl-e-Tahreer)
  // Studio (Karkhana-e-Sada)
  // Inside Studio (Andaroon-e-Karkhana)
  // Studio Engineers (Ahl-e-Handasa-e-Saut)
  // Studio Sessions (Majalis-e-Sabt)
  // Music Style Selection (Intikhab-e-Asaleeb-e-Mausiqi)
  // Institutional Framework (Mithaq-e-Idara)
  // Editorial Council (Majlis-e-Nazr)
  // Production Oversight (Nigrani-e-Intaj)
  // Release Protocol (Usool-e-Ishaat)
  // Registry Authority (Diwan-e-Amanat)
  // Royalty Transparency (Shafafiyat-e-Huqooq)
  // Content Stewardship (Amanat-e-Mazmoon)
  // What is SufiPulse? (Taruf-e-SufiPulse)
  // Founder (Bani)
  // Our Network (Shabaka-e-Ma)
  // Institutional Partners (Shuraka-e-Idari)
  // Official Channels (Majari-e-Rasmi)
  // Institutional Collaboration (Taawun-e-Idari)
  // Contact (Rabita)
  writer: {
    public: "Writers",
    mystical: "Ahl-e-Qalam"
  },
  vocalist: {
    public: "Vocalists",
    mystical: "Ahl-e-Sada"
  },
  engineer: {
    public: "Producers",
    mystical: "Ahl-e-Naghma"
  },
  studio: {
    public: "Studio",
    mystical: "Karkhana-e-Sada"
  },
  literary_contributor: {
    public: "Literary Contributors",
    mystical: "Ahl-e-Tahreer"
  },
  inside_studio: {
    public: "Inside Studio",
    mystical: "Andaroon-e-Karkhana"
  },
  studio_engineer: {
    public: "Studio Engineers",
    mystical: "Ahl-e-Handasa-e-Saut"
  },
  studio_sessions: {
    public: "Studio Sessions",
    mystical: "Majalis-e-Sabt"
  },
  production_oversight: {
    public: "Production Oversight",
    mystical: "Nigrani-e-Intaj"
  },
  release_protocol: {
    public: "Release Protocol",
    mystical: "Usool-e-Ishaat"
  },
  diwan_e_amanat: {
    public: "Diwan-e-Amanat",
    mystical: "Diwan-e-Amanat"
  },
  music_style_selection: {
    public: "Music Style Selection",
    mystical: "Intikhab-e-Asaleeb-e-Mausiqi"
  },
  institutional_framework: {
    public: "Institutional Framework",
    mystical: "Mithaq-e-Idara"
  },
  editor: {
    public: "Editorial Council",
    mystical: "Majlis-e-Nazr"
  },
  content_stewardship: {
    public: "Content Stewardship",
    mystical: "Amanat-e-Mazmoon"
  },
  what_is_sufipulse: {
    public: "What is SufiPulse?",
    mystical: "Taruf-e-SufiPulse"
  },
  founder: {
    public: "Founder",
    mystical: "Bani"
  },
  our_network: {
    public: "Our Network",
    mystical: "Shabaka-e-Ma"
  },
  institutional_partners: {
    public: "Institutional Partners",
    mystical: "Shuraka-e-Idari"
  },
  royalty_transparency: {
    public: "Royalty Transparency",
    mystical: "Shafafiyat-e-Huqooq"
  },
  scholar: {
    public: "Scholars",
    mystical: "Ahl-e-Tahqiq"
  },
  radio_host: {
    public: "Radio Hosts",
    mystical: "Ahl-e-Sada-e-Aalam"
  },
  chapter_admin: {
    public: "Chapters",
    mystical: "Rabita"
  }

};

export type RoleKey = keyof typeof roleDisplayMap;

export function getRoleDisplay(role: RoleKey) {
  return roleDisplayMap[role] || { public: role, mystical: role };
}
