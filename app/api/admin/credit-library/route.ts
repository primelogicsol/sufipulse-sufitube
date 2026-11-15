import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';

export const dynamic = 'force-dynamic';

const sections = ['artistic', 'production', 'visual', 'literary', 'rights'] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const releases = cmsServerStorage.getAllReleases();
  const options: Record<string, Record<string, string[]>> = {};
  const sets: Record<string, Record<string, Set<string>>> = {};
  for (const section of sections) sets[section] = {};

  const sources = releases
    .map(r => {
      const legacyRights = (r as any).releaseRights || {};
      const existingRights = (r.publicCredits as any)?.rights || {};
      const rights = {
        ...legacyRights,
        ...(legacyRights.releaseDate ? { releaseDateText: legacyRights.releaseDate } : {}),
        ...(legacyRights.licensingPermissions ? { licensingText: legacyRights.licensingPermissions } : {}),
        ...existingRights,
      };
      const credits = { ...(r.publicCredits || {}), rights };
      return {
        id: r.id,
        title: r.title,
        youtubeId: r.youtubeId || '',
        source: r.source || 'cms',
        credits,
      };
    })
    .filter(r => sections.some(s =>
      Object.values((r.credits as any)[s] || {}).some(v => typeof v === 'string' && v.trim())))
    .sort((a, b) => a.title.localeCompare(b.title));

  for (const source of sources) {
    for (const section of sections) {
      const fields = (source.credits as any)?.[section] || {};
      for (const [field, value] of Object.entries(fields)) {
        if (typeof value !== 'string' || !value.trim()) continue;
        (sets[section][field] ||= new Set()).add(value.trim());
      }
    }
  }
  for (const section of sections) {
    options[section] = {};
    for (const [field, values] of Object.entries(sets[section])) {
      options[section][field] = [...values].sort((a, b) => a.localeCompare(b));
    }
  }

  const nextRegisteredReleaseId = cmsServerStorage.getNextRegisteredReleaseId();

  return NextResponse.json(
    {
      sources,
      options,
      totalReleases: releases.length,
      creditedReleases: sources.length,
      nextRegisteredReleaseId,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
