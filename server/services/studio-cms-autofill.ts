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
  const approvedText = textValue(release.canonicalLyrics?.text) || textValue(draft.canonicalLyrics?.text);
  const environmental = /कश्मीर|डल|वुलर|झेलम|जंगल|शजर|फ़ितरत|environment|kashmir/i.test(approvedText);
  const description = [
    release.title + ' | SufiPulse USA',
    environmental
      ? 'A contemporary mystical Sufi reflection on Kashmir, environmental responsibility, and the spiritual duty to protect the natural world and speak against its destruction.'
      : 'A contemporary SufiPulse USA music and poetry release, exploring the themes and questions expressed in its original approved kalam.',
    'Official lyrics and available language tracks are sourced from the approved Hybrid Studio master.',
  ].join('\n\n');
  const safeCredits = {
    artistic: { musicProducer: 'SufiPulse USA', ...release.publicCredits?.artistic },
    production: { productionSupervision: 'SufiPulse Studio USA', ...release.publicCredits?.production },
    visual: { ...release.publicCredits?.visual },
    literary: { ...release.publicCredits?.literary },
    rights: { publishedBy: 'SufiPulse USA', ...release.publicCredits?.rights },
  };
  const premiereDescription = environmental
    ? "How Long Will You Remain Silent? asks Kashmir to confront the damage inflicted on its water, forests, and living landscape. In a searching conversation between the poet and Rabb, the kalam invokes Dal Lake, Wular, Jhelum, the balance of creation (Meezan), and the responsibility of human beings as trustees rather than owners of nature. Drawing on the region's Rishi-Sufi legacy, it calls on young people, scientists, community leaders, and every listener to replace silence with environmental awareness and responsible action. A SufiPulse USA original work of ecological conscience and spiritual accountability."
    : "Experience " + release.title + ", a SufiPulse USA musical reflection rooted in the approved original kalam. Explore its lyrics, spiritual themes, and the questions it poses for the listener.";
  const commentary = environmental ? [
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
  ] : [];
  const seoKeywords = environmental ? [
    'How Long Will You Remain Silent', 'Kab Tak Khamosh', 'SufiPulse USA',
    'Kashmir environmental awareness', 'Kashmir environmental protection',
    'Kashmir ecology', 'Dal Lake conservation', 'Wular Lake conservation',
    'Jhelum River pollution', 'Kashmir forests', 'environmental responsibility',
    'Islamic environmental ethics', 'Islamic environmental mysticism',
    'Sufi environmental consciousness', 'Kashmir Sufi poetry',
    'Rishi Sufi heritage', 'Lall Arifa', 'Nund Rishi',
    'Shah e Hamadan', 'environmental activism Kashmir',
    'Meezan balance of nature', 'Amaanat stewardship', 'Sufi music',
  ] : [release.title, 'SufiPulse USA', 'Sufi music', 'Sufi poetry', 'mystical kalam'];
  const sponsorsIntro = environmental
    ? "Support the outreach of How Long Will You Remain Silent?, a SufiPulse USA kalam calling for environmental awareness and responsibility toward Kashmir's lakes, rivers, forests and living heritage. Individuals and organizations can support educational and cultural promotion. Only confirmed, approved sponsors will be acknowledged, and sponsorship does not confer editorial control."
    : 'Support the responsible cultural outreach of this SufiPulse USA original release. Confirmed supporters may be acknowledged here following editorial review. Sponsorship does not confer editorial control.';
  const premiereCtaLabel = environmental ? 'Explore Kashmir’s Call' : 'Explore the Release';
  return { description, premiereDescription, premiereCtaLabel, commentary, sponsorsIntro, seoKeywords, tracks, credits: safeCredits, warnings, sourceDraftId: draftId };
}
