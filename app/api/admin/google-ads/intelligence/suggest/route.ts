// app/api/admin/google-ads/intelligence/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { 
  LANGUAGE_PROFILES, 
  KEYWORD_CLUSTERS, 
  AUDIENCE_CLUSTERS, 
  TARGETING_PRESETS,
  CULTURAL_SEMANTICS
} from '@/lib/google-ads/intelligence-library';
import { IntelligencePlan } from '@/lib/google-ads/intelligence-types';

/**
 * POST /api/admin/google-ads/intelligence/suggest
 * Generates campaign intelligence suggestions based on request context.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { adoptionId, releaseTitle, releaseType, campaignIntention, selectedPresets = [] } = await request.json();

    // Logic to aggregate suggestions from selected presets
    const presets = TARGETING_PRESETS.filter(p => selectedPresets.includes(p.id));
    
    const suggestedKeywords = new Set<string>();
    const suggestedNegativeKeywords = new Set<string>();
    const suggestedAudiences = new Set<string>();
    const suggestedRegions = new Set<string>();
    const suggestedLanguages = new Set<string>();

    presets.forEach(p => {
      p.keywordClusters.forEach(cid => {
        const cluster = KEYWORD_CLUSTERS.find(c => c.id === cid);
        cluster?.keywords.forEach(k => suggestedKeywords.add(k));
      });
      p.negativeKeywords.forEach(k => suggestedNegativeKeywords.add(k));
      p.audienceArchetypes.forEach(a => suggestedAudiences.add(a));
      p.regions.forEach(r => suggestedRegions.add(r));
      p.languages.forEach(l => suggestedLanguages.add(l));
    });

    return NextResponse.json({
      keywords: Array.from(suggestedKeywords),
      negativeKeywords: Array.from(suggestedNegativeKeywords),
      audiences: Array.from(suggestedAudiences),
      regions: Array.from(suggestedRegions),
      languages: Array.from(suggestedLanguages),
      resonanceNotes: "High resonance expected in diaspora clusters for this spiritual release."
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
