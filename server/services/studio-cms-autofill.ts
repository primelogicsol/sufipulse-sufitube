import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { CMSRelease } from '@/lib/cms-storage';
import { pipelineDraftStorage } from '@/server/storage/pipeline-draft-storage';

type LyricRow = { translation: string; transliteration: string; urdu: string; timestamp: string };
const TRACKS: Record<string, { file: string; label: string }> = {
  roman_urdu: { file: 'en-rom.vtt', label: 'Roman Urdu' },
  urdu: { file: 'ur.vtt', label: 'Urdu' },
  english: { file: 'en.vtt', label: 'English' },
  hindi: { file: 'ur-deva.vtt', label: 'Urdu in Devanagari script' },
};
const textValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';

function parseVtt(content: string): LyricRow[] {
  const rows: LyricRow[] = [];
  const blocks = content.replace(/^\uFEFF/, '').replace(/\r/g, '').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex(line => /^\d\d:\d\d:\d\d\.\d{3}\s+-->/.test(line));
    if (timingIndex < 0) continue;
    const timestamp = lines[timingIndex].split('-->')[0].trim();
    const lyric = lines.slice(timingIndex + 1).filter(line => !/^NOTE\b/.test(line)).join(' ').replace(/<[^>]+>/g, '').trim();
    if (lyric) rows.push({ translation: lyric, transliteration: '', urdu: '', timestamp });
  }
  return rows;
}

export function buildStudioCmsAutofill(release: CMSRelease) {
  if (release.source !== 'studio_pipeline' || !release.studioProduction?.approvedAt) {
    throw new Error('Only approved Hybrid Studio masters support Studio auto-fill.');
  }
  const draftId = release.studioProduction.draftId;
  if (!/^draft_[a-zA-Z0-9_]+$/.test(draftId)) throw new Error('Invalid Studio draft ID.');
  const draft = pipelineDraftStorage.getDraft(draftId);
  if (!draft || draft.downstreamStatus.approvalStatus !== 'approved_for_publishing' ||
      (draft.downstreamStatus as any).cmsReleaseId !== release.id ||
      !draft.downstreamStatus.subtitlesValid) {
    throw new Error('Approved Studio source could not be verified.');
  }
  const folder = path.join(process.cwd(), '.data', 'pipeline-drafts', draftId, 'subtitles');
  const tracks: Record<string, LyricRow[]> = {};
  const warnings: string[] = [];
  for (const [language, config] of Object.entries(TRACKS)) {
    const file = path.join(folder, config.file);
    if (!fs.existsSync(file)) {
      warnings.push(config.label + ': approved subtitle file not found');
      continue;
    }
    const rows = parseVtt(fs.readFileSync(file, 'utf8'));
    if (!rows.length) {
      warnings.push(config.label + ': no readable lyric cues');
      continue;
    }
    tracks[language] = rows;
  }
  // Strict identity matching to prevent cross-song contamination
  const titleLower = (release.title || '').toLowerCase().trim();
  const slugLower = (release.slug || '').toLowerCase().trim();

  const isKabTakKhamosh =
    draftId === 'draft_1775208600103_kab_tak_khamosh' ||
    slugLower === 'how-long-will-you-remain-silent' ||
    slugLower === 'kab-tak-khamosh' ||
    /^(how long will you remain silent|kab tak khamosh|कब तक ख़ामोश)/i.test(titleLower);

  const isFootprintsBehind =
    draftId === 'draft_1794752884539_0eb391d5' ||
    slugLower === 'footprints-behind' ||
    slugLower === 'some-people-leave-footprints-behind' ||
    /^(some people leave footprints behind|footprints behind|کچھ لوگ نشاں|कुछ लोग निशाँ)/i.test(titleLower);

  let description = [
    release.title + ' | SufiPulse USA',
    'An original musical reflection presented by SufiPulse USA, exploring the spiritual and poetic themes expressed in its approved canonical kalam.',
    'Official lyrics and available language tracks are sourced from the approved Hybrid Studio master.',
  ].join('\n\n');

  let premiereDescription = `Experience "${release.title}", a SufiPulse USA musical reflection rooted in the approved canonical kalam. Explore its lyrics, spiritual themes, and contemplative depth.`;
  let premiereCtaLabel = `Explore ${release.title}`;
  let commentary: any[] = [];
  let seoKeywords = [release.title, 'SufiPulse USA', 'Sufi music', 'Sufi poetry', 'mystical kalam'];
  let sponsorsIntro = `Support the cultural and educational outreach of "${release.title}", a SufiPulse USA original release. Only confirmed, approved sponsors will be acknowledged following editorial review. Sponsorship does not confer editorial control.`;

  if (isFootprintsBehind) {
    description = [
      'Some People Leave Footprints Behind (کچھ لوگ نشاں چھوڑ جاتے ہیں) | SufiPulse USA',
      'An original musical reflection by Dr. Zarf-e-Noori, presented by SufiPulse USA.\n\nSome People Leave Footprints Behind is a soulful reflection on those who make a difference through service, knowledge, compassion, courage, and quiet dedication—traveling through mountain trails, the writer’s inner world, the living dignity of Kashmir’s master artisans, fatherhood, and the enduring influence of those who help others turn ideas into meaningful action.\n\n“Some people leave footprints behind,\nNot carved in stone, but in our lives.”',
      'Official lyrics and available language tracks are sourced from the approved Hybrid Studio master.',
    ].join('\n\n');

    premiereDescription = "Some People Leave Footprints Behind (کچھ لوگ نشاں چھوڑ جاتے ہیں) is an original musical reflection by Dr. Zarf-e-Noori, presented by SufiPulse USA. A soulful tribute to those who make a difference through service, knowledge, compassion, and quiet dedication—traveling through mountain trails, the writer's inner world, the living dignity of Kashmir's master craftspeople, fatherhood, and the enduring influence of those who uplift others without seeking personal recognition or royal acclaim. Not every legacy needs a monument; some lives are remembered through the good they leave behind.";
    premiereCtaLabel = "Explore Footprints Behind";

    commentary = [
      {
        id: 'studio_crafts_heritage',
        title: 'Living Crafts of Kashmir: Devotion Woven into Art',
        content: "The song honors the master weavers and artisans of Kashmir—the practitioners of Sozni embroidery, Kani shawls, Pashmina weaving, carpet knotting, and walnut wood carving. In the Sufi tradition, honest manual craftsmanship is not mere commerce; it is an act of spiritual presence and patience (sabr). The kalam affirms the dignity of these quiet masters whose hands sustain Kashmir's cultural legacy.",
        isPublished: true,
      },
      {
        id: 'studio_mystical_altruism',
        title: 'Footprints in Living Hearts: The Ethos of Silent Service',
        content: "The central refrain, 'Na taaj ki khwaahish, na takht ka gumaan, bas dilon mein apna makaan chhod jaate hain,' expresses a core Sufi doctrine: the highest station of humanity is selfless service (khidmat) without the desire for worldly fame or royal recognition. True immortality is not built in stone monuments, but inscribed forever within the hearts and lives of those we uplift.",
        isPublished: true,
      },
    ];

    seoKeywords = [
      'Some People Leave Footprints Behind', 'Footprints Behind', 'Kuchh Log Nishaan Chhod Jaate Hain', 'कुछ लोग निशाँ छोड़ जाते हैं',
      'Dr. Zarf-e-Noori', 'Mahmood Ahmad Shah', 'SufiPulse USA', 'Kashmir master artisans', 'Kashmiri handicrafts', 'Pashmina weavers',
      'Sozni embroidery Kashmir', 'Kani shawl heritage', 'Walnut wood carving Kashmir', 'Craftlore', 'KHCRF',
      'Sufi poetry', 'Urdu Ghazal', 'Spiritual altruism', 'Silent guardians',
      'Living crafts of Kashmir', 'Dignity of labor Sufism', 'Mystical kalam SufiPulse'
    ];

    sponsorsIntro = "Support the cultural preservation and educational outreach of Some People Leave Footprints Behind, a SufiPulse USA original musical reflection by Dr. Zarf-e-Noori honoring Kashmir's master artisans, living craft traditions, and silent guardians. Verified contributions directly support authentic cultural documentation, artisan welfare advocacy, and global audience discovery. Sponsorship does not confer editorial control.";
  } else if (isKabTakKhamosh) {
    description = [
      release.title + ' | SufiPulse USA',
      'A contemporary mystical Sufi reflection on Kashmir, environmental responsibility, and the spiritual duty to protect the natural world and speak against its destruction.',
      'Official lyrics and available language tracks are sourced from the approved Hybrid Studio master.',
    ].join('\n\n');

    premiereDescription = "How Long Will You Remain Silent? asks Kashmir to confront the damage inflicted on its water, forests, and living landscape. In a searching conversation between the poet and Rabb, the kalam invokes Dal Lake, Wular, Jhelum, the balance of creation (Meezan), and the responsibility of human beings as trustees rather than owners of nature. Drawing on the region's Rishi-Sufi legacy, it calls on young people, scientists, community leaders, and every listener to replace silence with environmental awareness and responsible action. A SufiPulse USA original work of ecological conscience and spiritual accountability.";
    premiereCtaLabel = 'Explore Kashmir’s Call';

    commentary = [
      {
        id: 'studio_environmental_context',
        title: 'Kashmir, Creation and Environmental Responsibility',
        content: "The song gives Kashmir's ecological crisis a spiritual vocabulary. Dal Lake, Wular, Jhelum and the region's forests are not decorative scenery: they are signs of creation whose degradation raises questions of human responsibility. The poet's dialogue with Rabb is an artistic device that challenges the habit of admiring nature while ignoring its injuries.",
        isPublished: false,
      },
      {
        id: 'studio_mystical_interpretation',
        title: 'Meezan, Amaanat and the Call to Speak',
        content: "The kalam brings together Meezan, the balance of creation, and Amaanat, the trust placed in human hands. It recalls Kashmir's Rishi-Sufi inheritance to argue that remembrance without care is incomplete. Its refrain, 'Kab tak khamosh?', is a call to scientists, young people, institutions and communities to speak and act for environmental protection. These are the song's poetic themes, not claims that every specific environmental condition has been independently measured here.",
        isPublished: false,
      },
    ];

    seoKeywords = [
      'How Long Will You Remain Silent', 'Kab Tak Khamosh', 'SufiPulse USA',
      'Kashmir environmental awareness', 'Kashmir environmental protection',
      'Kashmir ecology', 'Dal Lake conservation', 'Wular Lake conservation',
      'Jhelum River pollution', 'Kashmir forests', 'environmental responsibility',
      'Islamic environmental ethics', 'Islamic environmental mysticism',
      'Sufi environmental consciousness', 'Kashmir Sufi poetry',
      'Rishi Sufi heritage', 'Lall Arifa', 'Nund Rishi',
      'Shah e Hamadan', 'environmental activism Kashmir',
      'Meezan balance of nature', 'Amaanat stewardship', 'Sufi music',
    ];

    sponsorsIntro = "Support the outreach of How Long Will You Remain Silent?, a SufiPulse USA kalam calling for environmental awareness and responsibility toward Kashmir's lakes, rivers, forests and living heritage. Individuals and organizations can support educational and cultural promotion. Only confirmed, approved sponsors will be acknowledged, and sponsorship does not confer editorial control.";
  }

  const safeCredits = {
    artistic: { musicProducer: 'SufiPulse USA', ...release.publicCredits?.artistic },
    production: { productionSupervision: 'SufiPulse Studio USA', ...release.publicCredits?.production },
    visual: { ...release.publicCredits?.visual },
    literary: { ...release.publicCredits?.literary },
    rights: { publishedBy: 'SufiPulse USA', ...release.publicCredits?.rights },
  };

  return { description, premiereDescription, premiereCtaLabel, commentary, sponsorsIntro, seoKeywords, tracks, credits: safeCredits, warnings, sourceDraftId: draftId };
}
