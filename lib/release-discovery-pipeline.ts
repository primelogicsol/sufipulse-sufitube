/**
 * lib/release-discovery-pipeline.ts
 *
 * Automated Full-Song Release-to-Search Discovery Pipeline (Phase 5).
 *
 * STRICT GOVERNANCE CONSTRAINTS:
 * 1. Full-length songs are the primary promotional assets. NEVER creates or publishes Shorts,
 *    excerpts, or cutdowns.
 * 2. Preserves human publication approval: only publicly approved + published releases
 *    (status === 'published' && visibility === 'public') are eligible for sitemap/IndexNow dispatch.
 * 3. Never overwrites canonicalTitle with YouTube packaging variants.
 * 4. Never fabricates thin pages; connects releases ONLY to verified active nodes in registries.json.
 */

import { revalidatePath } from 'next/cache';
import { cmsServerStorage } from './cms-storage-server';
import type { CMSRelease } from './cms-storage';
import { graphResolver } from './graph-resolver';
import { registriesStorage } from './registries-storage';
import { canonicalUrl, resolveCanonicalSongTitle } from './canonical-seo';
import { evaluateReleaseScriptCoverage, type ReleaseScriptCoverage } from './search-demand-engine';
import { getUrlIndexingDiagnostics, submitUrlsViaIndexNow } from './search-indexing-service';
import { getYouTubeStudioSnapshot } from './youtube-studio-import';
import { discoveryAnalytics } from './discovery-analytics';
import { organicDiscoveryTelemetry } from './organic-discovery-telemetry';

export interface ReleaseSeoAuditItem {
  id: string;
  slug: string;
  canonicalTitle: string;
  canonicalUrl: string;
  youtubeId: string | null;
  status: string;
  visibility: string;
  readinessScore: number; // 0..100 transparent checklist score
  checks: {
    hasCanonicalTitle: boolean;
    hasRichDescription: boolean; // >= 120 chars
    hasYoutubeFullSongBinding: boolean;
    hasValidDuration: boolean;
    hasFourScriptLyrics: boolean;
    hasDiscoveryGraphLinks: boolean;
    hasStructuredDataReady: boolean;
    isInPublicSitemap: boolean;
  };
  scriptCoverage: ReleaseScriptCoverage;
  sourceRecoveryRequired: boolean;
  graphLinksCount: number;
  metrics: {
    youtubeViews: number;
    studioImpressions: number | null;
    studioCtr: number | null;
    websitePageViews: number;
    websiteEmbeddedPlays: number;
    websiteOutboundClicks: number;
    websiteVideoClicks: number;
    websiteToYoutubeCtr: number | null;
  };
  indexingState: string;
  missingItems: string[];
}

const CONCEPT_LEXICON: Array<{ code: string; patterns: RegExp }> = [
  { code: 'ishq', patterns: /\b(ishq|divine love|beloved|mahboob|عشق|इश्क़)\b/i },
  { code: 'fana', patterns: /\b(fana|annihilat|benishan|khud ko mita|فنا|फ़ना)\b/i },
  { code: 'baqa', patterns: /\b(baqa|subsisten|eternal|remain|footprints|بقا|बक़ा)\b/i },
  { code: 'sabr', patterns: /\b(sabr|patience|silent|khamosh|صبر|सब्र)\b/i },
  { code: 'tawakkul', patterns: /\b(tawakkul|trust|bharosa|توکل|तवक्कुल)\b/i },
  { code: 'dhikr', patterns: /\b(dhikr|zikr|allah hoo|allah hu|remembrance|ذکر|ज़िक्र)\b/i },
  { code: 'tasawwuf', patterns: /\b(sufi|tasawwuf|mystic|kalam|darvesh|تصوف|सूफी)\b/i },
  { code: 'marifa', patterns: /\b(marifa|gnosis|pehchaan|know yourself|khudi|معرفت|आत्मज्ञान)\b/i },
  { code: 'haqiqa', patterns: /\b(haqiqa|haq|ultimate truth|حقیقت|हक़ीक़त)\b/i },
  { code: 'faqr', patterns: /\b(faqr|faqir|qalandar|dervish|فقر|फ़क़ीर)\b/i },
  { code: 'shukr', patterns: /\b(shukr|gratitude|blessing|شکر|शुक्र)\b/i },
  { code: 'rida', patterns: /\b(rida|contentment|raza|رضا|रज़ा)\b/i },
];

const THEME_LEXICON: Array<{ slug: string; code: string; patterns: RegExp }> = [
  { slug: 'divine-love', code: 'divine_love', patterns: /\b(divine love|ishq|beloved|heart|dil|عشق)\b/i },
  { slug: 'seeking-union', code: 'seeking_union', patterns: /\b(union|wasl|longing|meet|seeking|وصال)\b/i },
  { slug: 'praise-hamd', code: 'praise_hamd', patterns: /\b(hamd|praise|allah|creator|rab|khuda|حمد)\b/i },
  { slug: 'devotion-naat', code: 'devotion_naat', patterns: /\b(naat|prophet|madina|mustafa|rasool|نعت)\b/i },
  { slug: 'spiritual-journey', code: 'spiritual_journey', patterns: /\b(journey|safar|path|wayfarer|footprints|سفر)\b/i },
  { slug: 'annihilation-fana', code: 'annihilation_fana', patterns: /\b(fana|ego|nafs|silence|mirror|فنا)\b/i },
  { slug: 'repentance-tawbah', code: 'repentance_tawbah', patterns: /\b(tawbah|repent|forgive|mercy|rehmat|توبہ)\b/i },
];

const MOOD_LEXICON: Array<{ code: string; patterns: RegExp }> = [
  { code: 'contemplative', patterns: /\b(contemplat|fikr|reflect|meditat|silence|خاموش|تفکر)\b/i },
  { code: 'longing', patterns: /\b(longing|shawq|yearn|tadap|intezaar|شوق)\b/i },
  { code: 'serene', patterns: /\b(serene|peace|sukoon|calm|gentle|سکون)\b/i },
  { code: 'ecstatic', patterns: /\b(ecsta|wajd|mast|qawwali|qalandar|وجد|مست)\b/i },
  { code: 'reflective', patterns: /\b(reflect|legacy|life|truth|mirror|آئینہ)\b/i },
];

/**
 * Safely enriches a published release's taxonomy arrays & Discovery Graph joins
 * using ONLY active, verified items in registries.json. Never modifies canonicalTitle or slug.
 */
export function autoEnrichReleaseGraphLinks(
  release: CMSRelease,
  persistRelease = true
): { addedConcepts: string[]; addedThemes: string[]; addedMoods: string[]; addedRegions: string[]; totalJoins: number } {
  registriesStorage.init();
  graphResolver.init();

  const textCorpus = [
    release.canonicalTitle,
    release.title,
    release.description,
    ...(release.tags || []),
  ]
    .filter(Boolean)
    .join(' ');

  const activeConcepts = new Set(
    registriesStorage.getItems('concepts').filter((i) => i.isActive).map((i) => i.slug)
  );
  const activeThemes = new Set(
    registriesStorage.getItems('themes').filter((i) => i.isActive).map((i) => i.slug)
  );
  const activeMoods = new Set(
    registriesStorage.getItems('moods').filter((i) => i.isActive).map((i) => i.slug)
  );
  const activeRegions = new Set(
    registriesStorage.getItems('regions').filter((i) => i.isActive).map((i) => i.slug)
  );
  const activeLanguages = new Set(
    registriesStorage.getItems('languages').filter((i) => i.isActive).map((i) => i.slug)
  );

  const concepts = new Set((release.sufiConcepts || []).filter((c) => activeConcepts.has(c)));
  const themes = new Set(
    (release.themes || [])
      .map((t) => t.replace(/-/g, '_'))
      .filter((code) => activeThemes.has(code.replace(/_/g, '-')))
  );
  const moods = new Set((release.moods || []).filter((m) => activeMoods.has(m)));
  const regions = new Set((release.targetRegions || []).filter((r) => activeRegions.has(r)));
  const languages = new Set((release.targetLanguages || []).filter((l) => activeLanguages.has(l)));

  const beforeConcepts = concepts.size;
  const beforeThemes = themes.size;
  const beforeMoods = moods.size;
  const beforeRegions = regions.size;

  for (const rule of CONCEPT_LEXICON) {
    if (activeConcepts.has(rule.code) && rule.patterns.test(textCorpus)) {
      concepts.add(rule.code);
    }
  }
  if (concepts.size === 0 && activeConcepts.has('tasawwuf')) {
    concepts.add('tasawwuf');
  }

  for (const rule of THEME_LEXICON) {
    if (activeThemes.has(rule.slug) && rule.patterns.test(textCorpus)) {
      themes.add(rule.code);
    }
  }
  if (themes.size === 0 && activeThemes.has('spiritual-journey')) {
    themes.add('spiritual_journey');
  }

  for (const rule of MOOD_LEXICON) {
    if (activeMoods.has(rule.code) && rule.patterns.test(textCorpus)) {
      moods.add(rule.code);
    }
  }
  if (moods.size === 0 && activeMoods.has('contemplative')) {
    moods.add('contemplative');
  }

  // Policy invariant (Section 13): Do NOT auto-classify songs with country origin/promotional tags
  // ('in', 'pk', 'bd', 'us') merely because global audiences in those countries listen to SufiPulse.
  // Only preserve targetRegions when explicitly assigned by editors.

  const audioLang = (release.defaultAudioLanguage || 'ur').toLowerCase().slice(0, 2);
  if (activeLanguages.has(audioLang)) languages.add(audioLang);
  if (activeLanguages.has('en')) languages.add('en');

  const updatedRelease: CMSRelease = {
    ...release,
    sufiConcepts: Array.from(concepts),
    themes: Array.from(themes),
    moods: Array.from(moods),
    targetRegions: Array.from(regions),
    targetLanguages: Array.from(languages),
  };

  if (persistRelease) {
    cmsServerStorage.saveRelease(updatedRelease);
  }
  graphResolver.syncReleaseJoins(updatedRelease);

  const totalJoins = graphResolver.getRawJoins().filter((j) => j.releaseId === release.id).length;

  return {
    addedConcepts: Array.from(concepts).slice(beforeConcepts),
    addedThemes: Array.from(themes).slice(beforeThemes),
    addedMoods: Array.from(moods).slice(beforeMoods),
    addedRegions: Array.from(regions).slice(beforeRegions),
    totalJoins,
  };
}

export function auditAllPublishedReleasesSeo(): ReleaseSeoAuditItem[] {
  const releases = cmsServerStorage
    .getPublicReleases()
    .filter((r) => r.status === 'published' && (r.visibility || 'public') === 'public');

  graphResolver.init();
  const joins = graphResolver.getRawJoins();
  const studio = getYouTubeStudioSnapshot();
  const studioByVideoId = new Map((studio?.rows ?? []).map((r) => [r.videoId, r]));

  const releaseTallies = discoveryAnalytics.getTalliesForType('release');
  const organicSummary = organicDiscoveryTelemetry.getFunnelSummary();
  const organicBySlug = new Map(organicSummary.perReleaseConversion.map((c) => [c.slug, c]));

  const tallyMap = new Map<string, { pageViews: number; videoClicks: number }>();
  for (const t of releaseTallies) {
    const cur = tallyMap.get(t.sourceSlug) || { pageViews: 0, videoClicks: 0 };
    if (t.actionType === 'page_view') cur.pageViews += t.count;
    if (t.actionType === 'video_click' || t.actionType === 'subscribe_click') cur.videoClicks += t.count;
    tallyMap.set(t.sourceSlug, cur);
  }

  return releases
    .map((r) => {
      const cTitle = resolveCanonicalSongTitle(r);
      const cUrl = canonicalUrl(`/release-detail/${r.slug}`);
      const scriptCoverage = evaluateReleaseScriptCoverage(r);
      const graphLinksCount = joins.filter((j) => j.releaseId === r.id).length;
      const st = r.youtubeId ? studioByVideoId.get(r.youtubeId) : undefined;
      const idxDiag = getUrlIndexingDiagnostics(cUrl);

      const checks = {
        hasCanonicalTitle: cTitle.length >= 3,
        hasRichDescription: String(r.description || '').trim().length >= 120,
        hasYoutubeFullSongBinding: Boolean(r.youtubeId && String(r.youtubeId).trim().length === 11),
        hasValidDuration: Number(r.durationSeconds || 0) >= 60,
        hasFourScriptLyrics: scriptCoverage.coveredCount === 4,
        hasDiscoveryGraphLinks: graphLinksCount >= 3,
        hasStructuredDataReady: Boolean(cTitle && r.slug && r.youtubeId),
        isInPublicSitemap: Boolean(r.slug && r.status === 'published' && (r.visibility || 'public') === 'public'),
      };

      let score = 0;
      if (checks.hasCanonicalTitle) score += 15;
      if (checks.hasRichDescription) score += 15;
      if (checks.hasYoutubeFullSongBinding) score += 15;
      if (checks.hasValidDuration) score += 10;
      score += Math.round((scriptCoverage.coveredCount / 4) * 20);
      if (checks.hasDiscoveryGraphLinks) score += 15;
      else if (graphLinksCount > 0) score += 8;
      if (checks.hasStructuredDataReady && checks.isInPublicSitemap) score += 10;

      const missingItems: string[] = [];
      if (!checks.hasRichDescription) missingItems.push('Expand description (>=120 chars with poetic/thematic context)');
      if (scriptCoverage.sourceRecoveryRequired) {
        missingItems.push('Source recovery required: supply authoritative original kalam/lyrics before 4-script generation');
      } else {
        if (!scriptCoverage.english) missingItems.push('English translation track');
        if (!scriptCoverage.romanUrdu) missingItems.push('Roman Urdu transliteration track');
        if (!scriptCoverage.urduNastaliq) missingItems.push('Urdu Nastaliq (اردو) script track');
        if (!scriptCoverage.devanagari) missingItems.push('Devanagari (देवनागरी) script track');
      }
      if (!checks.hasDiscoveryGraphLinks) missingItems.push('Connect >=3 Discovery Graph concepts/themes');

      const tally = tallyMap.get((r.slug || '').toLowerCase()) || { pageViews: 0, videoClicks: 0 };
      const ode = organicBySlug.get(r.slug || '');
      // Prevent double-counting when both /api/track-click and OrganicDiscoveryTracker observe the same visit/click
      const websitePageViews = Math.max(tally.pageViews, ode?.releaseViews || 0);
      const websiteEmbeddedPlays = ode?.embeddedPlays || 0;
      const websiteOutboundClicks = Math.max(tally.videoClicks, ode?.outboundClicks || 0);
      const websiteVideoClicks = websiteEmbeddedPlays + websiteOutboundClicks;

      return {
        id: r.id,
        slug: r.slug,
        canonicalTitle: cTitle,
        canonicalUrl: cUrl,
        youtubeId: r.youtubeId || null,
        status: r.status,
        visibility: r.visibility || 'public',
        readinessScore: Math.min(100, score),
        checks,
        scriptCoverage,
        sourceRecoveryRequired: Boolean(scriptCoverage.sourceRecoveryRequired),
        graphLinksCount,
        metrics: {
          youtubeViews: Number(r.viewCount || st?.views || 0),
          studioImpressions: st?.impressions ?? null,
          studioCtr: st?.ctr ?? null,
          websitePageViews,
          websiteEmbeddedPlays,
          websiteOutboundClicks,
          websiteVideoClicks,
          websiteToYoutubeCtr:
            websitePageViews > 0 ? Number(((websiteVideoClicks / websitePageViews) * 100).toFixed(1)) : null,
        },
        indexingState: idxDiag.currentState,
        missingItems,
      };
    })
    .sort((a, b) => b.metrics.youtubeViews - a.metrics.youtubeViews);
}

/**
 * Executes the automated post-publish organic search discovery pipeline for a human-approved
 * public full-length release.
 */
export async function runPublishedReleaseDiscoveryPipeline(
  releaseIdOrSlug: string,
  triggeredBy = 'cms_publish_pipeline'
) {
  const release =
    cmsServerStorage.getRelease(releaseIdOrSlug) ||
    cmsServerStorage.getReleaseBySlug(releaseIdOrSlug);

  if (!release) {
    throw new Error(`Release "${releaseIdOrSlug}" not found.`);
  }

  // Enforce human publication gate: never syndicate unpublished, draft, approved, or private records.
  if (release.status !== 'published' || (release.visibility || 'public') !== 'public') {
    return {
      executed: false,
      reason: `Release "${release.slug}" is status="${release.status}", visibility="${release.visibility || 'private'}". Search discovery syndication runs only for human-approved published + public full songs.`,
      canonicalUrl: canonicalUrl(`/release-detail/${release.slug}`),
    };
  }

  // 1. Auto-sync verified Discovery Graph connections
  const graphSync = autoEnrichReleaseGraphLinks(release, true);

  // 2. Revalidate public SEO & sitemap routes
  try {
    revalidatePath('/sitemap.xml');
    revalidatePath('/discovery');
    revalidatePath('/releases');
    revalidatePath(`/release-detail/${release.slug}`);
  } catch {}

  // 3. Notify IndexNow (honest verification — checks live keyLocation before claiming accepted)
  const targetUrl = canonicalUrl(`/release-detail/${release.slug}`);
  const indexNowResult = await submitUrlsViaIndexNow([targetUrl], triggeredBy);

  return {
    executed: true,
    releaseId: release.id,
    slug: release.slug,
    canonicalTitle: resolveCanonicalSongTitle(release),
    canonicalUrl: targetUrl,
    graphSync,
    indexNow: {
      accepted: indexNowResult.accepted,
      state: indexNowResult.state,
      httpStatus: indexNowResult.httpStatus,
      message: indexNowResult.message,
    },
  };
}
