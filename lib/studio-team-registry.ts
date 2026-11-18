/** SufiPulse staff registry. Appointments confirmed by the platform owner; independent credential checks are separate. */
export type StudioTeamArea = 'studio-operations' | 'creative-assets' | 'cinematic-video' | 'platform-release' | 'distribution';
export type StaffRecord = {
  id: string;
  name: string;
  designation: string;
  area: StudioTeamArea;
  background: 'American' | 'Kashmiri' | 'Indian' | 'Pakistani';
  gender: 'female' | 'male';
  status: 'owner-confirmed';
};
const staff = (id: string, name: string, designation: string, area: StudioTeamArea, background: StaffRecord['background'], gender: StaffRecord['gender']): StaffRecord => ({
  id, name, designation, area, background, gender, status: 'owner-confirmed',
});
export const studioSpecialists: readonly StaffRecord[] = [
  staff('SP-001', 'Jonathan Mitchell', 'Studio Systems & Infrastructure Specialist', 'studio-operations', 'American', 'male'),
  staff('SP-002', 'Zoya Mushtaq Mir', 'Studio Production Workflow Specialist', 'studio-operations', 'Kashmiri', 'female'),
  staff('SP-003', 'Hamza Farooq', 'Production Pipeline Automation Engineer', 'studio-operations', 'Pakistani', 'male'),
  staff('SP-004', 'Olivia Reynolds', 'Senior Visual Design Specialist', 'creative-assets', 'American', 'female'),
  staff('SP-005', 'Adil Shafi Bhat', 'Cinematic Concept & Storyboard Artist', 'creative-assets', 'Kashmiri', 'male'),
  staff('SP-006', 'Ananya Rao', 'Album Artwork & Graphic Designer', 'creative-assets', 'Indian', 'female'),
  staff('SP-007', 'Bilal Ahmed Qureshi', 'Motion Graphics & Visual Effects Artist', 'creative-assets', 'Pakistani', 'male'),
  staff('SP-008', 'Priya Menon', 'Creative Asset Library & Production Specialist', 'creative-assets', 'Indian', 'female'),
  staff('SP-009', 'Christopher Hayes', 'Senior Cinematic Video Specialist', 'cinematic-video', 'American', 'male'),
  staff('SP-010', 'Mehak Rafiq Lone', 'Full-Length Music Video Editor', 'cinematic-video', 'Kashmiri', 'female'),
  staff('SP-011', 'Karan Malhotra', 'Video Rendering & Encoding Engineer', 'cinematic-video', 'Indian', 'male'),
  staff('SP-012', 'Nadia Kamal', 'Lyric Video Visual Composition Specialist', 'cinematic-video', 'Pakistani', 'female'),
  staff('SP-013', 'David Peterson', 'Full-Stack Platform & Integration Engineer', 'platform-release', 'American', 'male'),
  staff('SP-014', 'Rida Bashir Khan', 'Release Registry, CMS & Publishing Specialist', 'platform-release', 'Kashmiri', 'female'),
  staff('SP-015', 'Rachel Sullivan', 'Global Music Distribution Specialist', 'distribution', 'American', 'female'),
  staff('SP-016', 'Imran Nisar Rather', 'Kashmir Cultural Partner Network Specialist', 'distribution', 'Kashmiri', 'male'),
  staff('SP-017', 'Pooja Sethi', 'Facebook, Instagram & Digital Distribution Specialist', 'distribution', 'Indian', 'female'),
  staff('SP-018', 'Saad Mahmood', 'WhatsApp, Telegram & Community Outreach Specialist', 'distribution', 'Pakistani', 'male'),
];
export const plannedRolesByArea = (area: StudioTeamArea): readonly StaffRecord[] =>
  studioSpecialists.filter((specialist) => specialist.area === area);

export const studioSpecialistSlug = (member: StaffRecord): string =>
  member.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const studioSpecialistBySlug = (slug: string): StaffRecord | undefined =>
  studioSpecialists.find((member) => studioSpecialistSlug(member) === slug);

export const studioTeamAreaDetails: Record<StudioTeamArea, { title: string; href: string; overview: string }> = {
  'studio-operations': {
    title: 'Studio Operations & Technical Infrastructure',
    href: '/studio/operations',
    overview: 'Studio infrastructure, asset intake, production workflows and reliable handoffs through the release lifecycle.',
  },
  'creative-assets': {
    title: 'Creative Asset Production',
    href: '/studio/creative-assets',
    overview: 'Visual design, artwork, storyboard development and media assets for approved SufiPulse releases.',
  },
  'cinematic-video': {
    title: 'Cinematic Video Production',
    href: '/studio',
    overview: 'Visual composition, full-length editing, rendering and technical finishing of approved music videos.',
  },
  'platform-release': {
    title: 'Platform & Release Operations',
    href: '/studio/operations',
    overview: 'SufiPulse platform integrations, CMS records and orderly publication of approved releases.',
  },
  distribution: {
    title: 'Global Distribution & Cultural Outreach',
    href: '/official-channels',
    overview: 'Authorized platform publishing, cultural partner coordination and distribution performance.',
  },
};

/** Role-based responsibilities, not statements of completed achievements. */
export const studioRoleResponsibilities: Record<string, readonly string[]> = {
  'SP-001': ['Maintain production infrastructure readiness and technical operating standards.', 'Coordinate infrastructure requirements with studio operations.', 'Document technical handoffs and equipment or environment issues.'],
  'SP-002': ['Coordinate production stages and status updates.', 'Track workflow blockers and readiness for handoff.', 'Maintain accurate stage records for the release team.'],
  'SP-003': ['Maintain automated production pipeline integrations.', 'Monitor job completion, errors and retry handling.', 'Improve production reliability under approved change control.'],
  'SP-004': ['Develop and review visual treatments for releases.', 'Maintain consistent visual standards.', 'Coordinate deliverables with artwork and video specialists.'],
  'SP-005': ['Translate approved creative briefs into shot concepts and storyboards.', 'Develop coherent scene sequences for full-length music videos.', 'Document visual direction for production handoff.'],
  'SP-006': ['Prepare cover artwork and release graphics.', 'Maintain accessible typography and artwork specifications.', 'Deliver validated artwork to publishing operations.'],
  'SP-007': ['Produce motion graphics and visual effects for approved concepts.', 'Prepare reusable visual elements and transitions.', 'Validate effect quality and export specifications.'],
  'SP-008': ['Organize creative source files and approved assets.', 'Maintain versioning and usage records.', 'Prepare asset packages for video and publishing teams.'],
  'SP-009': ['Translate approved visual plans into video production deliverables.', 'Coordinate cinematic consistency across a full-length release.', 'Review visual continuity before technical finishing.'],
  'SP-010': ['Edit complete music videos to approved visual sequences.', 'Maintain editorial continuity from opening to closing.', 'Prepare edit decisions for rendering and quality review.'],
  'SP-011': ['Generate technical video masters in required formats.', 'Verify resolution, encoding and playback integrity.', 'Report rendering failures and produce reproducible outputs.'],
  'SP-012': ['Integrate already-approved lyric alignment data into visual compositions.', 'Maintain readable caption placement across aspect ratios.', 'Review visual synchronization without altering canonical lyric timing.'],
  'SP-013': ['Maintain SufiPulse application interfaces and service integrations.', 'Implement reviewed fixes to production and publishing workflows.', 'Test platform behavior across relevant user journeys.'],
  'SP-014': ['Maintain release metadata and CMS publication records.', 'Confirm approved files, links and release status.', 'Coordinate accurate catalog delivery across publishing channels.'],
  'SP-015': ['Prepare approved releases for global distribution.', 'Track distributor handoffs and publishing status.', 'Coordinate distribution information with catalog operations.'],
  'SP-016': ['Support onboarding and coordination of Kashmir cultural partners.', 'Maintain approved partner communications and consent records.', 'Match relevant releases to participating cultural communities.'],
  'SP-017': ['Prepare approved material for authorized Facebook and Instagram accounts.', 'Monitor publishing outcomes and platform requirements.', 'Track source-attributed referral performance.'],
  'SP-018': ['Coordinate opt-in WhatsApp and Telegram community distribution.', 'Maintain approved outreach materials and subscription preferences.', 'Monitor delivery outcomes and respond to community inquiries.'],
};
