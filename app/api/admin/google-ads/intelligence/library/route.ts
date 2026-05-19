// app/api/admin/google-ads/intelligence/library/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { 
  LANGUAGE_PROFILES, 
  KEYWORD_CLUSTERS, 
  AUDIENCE_CLUSTERS, 
  TARGETING_PRESETS, 
  CAMPAIGN_STRATEGY_TEMPLATES, 
  CULTURAL_SEMANTICS 
} from '@/lib/google-ads/intelligence-library';

/**
 * GET /api/admin/google-ads/intelligence/library
 * Returns the full campaign intelligence library.
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  return NextResponse.json({
    languages: LANGUAGE_PROFILES,
    keywordClusters: KEYWORD_CLUSTERS,
    audienceClusters: AUDIENCE_CLUSTERS,
    presets: TARGETING_PRESETS,
    templates: CAMPAIGN_STRATEGY_TEMPLATES,
    semantics: CULTURAL_SEMANTICS
  });
}
