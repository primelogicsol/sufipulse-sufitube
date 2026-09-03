import { NextRequest, NextResponse } from 'next/server';

import { cmsServerStorage } from '@/lib/cms-storage-server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { privateProductionSourceStorage } from '@/server/storage/private-production-source-storage';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const release = cmsServerStorage.getRelease(id);
  if (!release) {
    return NextResponse.json({ error: 'Release not found' }, { status: 404 });
  }

  const source = privateProductionSourceStorage.get(id);
  const snapshot = source?.rollbackSnapshot;
  if (!snapshot) {
    return NextResponse.json(
      { error: 'No private rollback snapshot is available for this release.' },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body.confirmRestore !== true) {
    return NextResponse.json(
      {
        error: 'Rollback requires confirmRestore=true. No release data was changed.',
        rollbackCapturedAt: snapshot.capturedAt,
      },
      { status: 400 },
    );
  }

  const restored = cmsServerStorage.saveRelease({
    ...release,
    masterTimingVersion: snapshot.masterTimingVersion ?? release.masterTimingVersion ?? 1,
    subtitleCues: (Array.isArray(snapshot.subtitleCues) ? snapshot.subtitleCues : []) as any,
    subtitleTranslations: (snapshot.subtitleTranslations || {}) as any,
    subtitleLanguageStatuses: (snapshot.subtitleLanguageStatuses || {}) as any,
    subtitleCueMetadata: (snapshot.subtitleCueMetadata || {}) as any,
    availableLanguages: snapshot.availableLanguages || release.availableLanguages || [],
    defaultLanguage: snapshot.defaultLanguage || release.defaultLanguage || 'en',
    updatedAt: new Date().toISOString(),
  });

  const alreadyPublic = restored.status === 'published' && restored.visibility === 'public';

  return NextResponse.json({
    restored: true,
    releaseId: restored.id,
    rollbackCapturedAt: snapshot.capturedAt,
    masterTimingVersion: restored.masterTimingVersion,
    cueCount: restored.subtitleCues?.length || 0,
    languages: restored.availableLanguages || [],
    publicationActionPerformed: false,
    alreadyPublic,
    note: 'Only the captured subtitle/timing state was restored. The private production source remains linked.',
    warning: alreadyPublic
      ? 'This release is already public, so restored caption data may be visible immediately through existing public rendering. No new publish action was performed.'
      : undefined,
  });
}
