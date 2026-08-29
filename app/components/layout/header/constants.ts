import { roleDisplayMap } from '../../lib/roleDisplayMap';

export const CONTRIBUTORS_ITEMS = [
  {
    public: roleDisplayMap.writer.public,
    mystical: roleDisplayMap.writer.mystical,
    href: '/writers',
    ariaLabel: 'Writers'
  },
  {
    public: roleDisplayMap.vocalist.public,
    mystical: roleDisplayMap.vocalist.mystical,
    href: '/vocalists',
    ariaLabel: 'Vocalists'
  },
  {
    public: roleDisplayMap.engineer.public,
    mystical: roleDisplayMap.engineer.mystical,
    href: '/producers',
    ariaLabel: 'Producers'
  },
  {
    public: 'Literary Contributors',
    mystical: 'Ahl-e-Tahreer',
    href: '/literary-contributors',
    ariaLabel: 'Literary Contributors'
  },
  {
    public: 'Literary Journal',
    mystical: 'Ahl-e-Tahreer Publications',
    href: '/literary-journal',
    ariaLabel: 'Literary Journal'
  },
  {
    public: 'Literary Journal',
    mystical: 'Ahl-e-Tahreer Publications',
    href: '/literary-journal',
    ariaLabel: 'Literary Journal'
  },
];

export const PRODUCTION_ITEMS = [
  {
    public: roleDisplayMap.studio.public,
    mystical: roleDisplayMap.studio.mystical,
    href: '/studio',
    ariaLabel: 'Studio'
  },
  {
    public: 'Inside Studio',
    mystical: 'Facilities & Technology',
    href: '/inside-studio',
    ariaLabel: 'Inside Studio'
  },
  {
    public: 'Studio Engineers',
    mystical: 'Technical Stewardship',
    href: '/studio-engineers',
    ariaLabel: 'Studio Engineers'
  },
  {
    public: 'Studio Sessions',
    mystical: 'Recording Access Framework',
    href: '/studio-sessions',
    ariaLabel: 'Studio Sessions'
  },
  {
    public: 'Music Style Selection',
    mystical: 'Sacred Music Theory',
    href: '/production/music-style-selection',
    ariaLabel: 'Music Style Selection'
  },
];

export const GOVERNANCE_ITEMS = [
  {
    public: 'Institutional Framework',
    mystical: 'Mithaq â€” Constitutional Charter',
    href: '/governance/mithaq',
    ariaLabel: 'Mithaq Constitutional Charter'
  },
  {
    public: 'Majlis-e-Nazr',
    mystical: 'Editorial Council',
    href: '/governance/majlis-e-nazr',
    ariaLabel: 'Majlis-e-Nazr Editorial Council'
  },
  {
    public: 'Production Oversight',
    mystical: 'Studio Integration',
    href: '/governance/production-oversight',
    ariaLabel: 'Production Oversight Studio Integration'
  },
  {
    public: 'Release Protocol',
    mystical: 'Publication Sequence',
    href: '/governance/release-protocol',
    ariaLabel: 'Release Protocol Publication Sequence'
  },
  {
    public: 'Diwan-e-Amanat',
    mystical: 'Registry Authority',
    href: '/governance/diwan-e-amanat',
    ariaLabel: 'Diwan-e-Amanat Registry Authority'
  },
  {
    public: 'Royalty Transparency',
    mystical: 'Economic Documentation',
    href: '/governance/royalty-transparency',
    ariaLabel: 'Royalty Transparency Economic Documentation'
  },
  {
    public: 'Content Stewardship',
    mystical: 'Linguistic & Thematic Oversight',
    href: '/governance/content-stewardship',
    ariaLabel: 'Content Stewardship Linguistic & Thematic Oversight'
  },
];

export const ABOUT_ITEMS = [
  { label: 'What is SufiPulse?', href: '/about/what-is-sufipulse' },
  { label: 'Founder', href: '/about/founder' },
  { label: 'Our Network', href: '/about/our-network' },
  { label: 'Institutional Partners', href: '/about/institutional-partners' },
  { label: 'Official Channels', href: '/official-channels' },
  { label: 'Institutional Collaboration', href: '/collaboration' },
  { label: 'Product Infrastructure', href: '/product-infrastructure' },
  { label: 'Contact', href: '/contact' },
];
