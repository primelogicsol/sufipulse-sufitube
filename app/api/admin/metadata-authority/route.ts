import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authenticate';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { checkMetadataDrift } from '@/lib/release-utils';
import type { CMSRelease } from '@/lib/cms-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const releases = cmsServerStorage.getAllReleases();
    const reviews = releases.map((r: CMSRelease) => {
      const drift = checkMetadataDrift(r);
      return {
        id: r.id,
        slug: r.slug,
        youtubeId: r.youtubeId,
        canonicalTitle: r.canonicalTitle || r.title,
        youtubeTitle: r.youtubeTitle || r.youtubeStats?.title || r.title,
        subtitle: r.subtitle || '',
        canonicalThumbnail: r.canonicalThumbnail || r.thumbnailUrl || '',
        youtubeThumbnailUrl: r.youtubeThumbnailUrl || r.youtubeStats?.thumbnailUrl || r.thumbnailUrl || '',
        canonicalStatus: r.canonicalStatus || 'verified',
        governanceOrigin: r.governanceOrigin || (r.source === 'native' ? 'native_governed' : 'native_governed'),
        metadataStatus: r.metadataStatus || (drift.hasTitleDrift ? 'drift_detected' : 'synced'),
        hasTitleDrift: drift.hasTitleDrift,
        hasThumbnailDrift: drift.hasThumbnailDrift,
        lastYoutubeSyncAt: r.lastYoutubeSyncAt || r.updatedAt,
        updatedAt: r.updatedAt,
        views: r.viewCount || r.youtubeStats?.viewCount || 0,
        format: r.format || 'video',
      };
    });

    return NextResponse.json({
      success: true,
      total: reviews.length,
      driftCount: reviews.filter(r => r.hasTitleDrift || r.hasThumbnailDrift).length,
      releases: reviews,
    });
  } catch (err: any) {
    console.error('[API /api/admin/metadata-authority] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { releaseId, action, newCanonicalTitle, newSubtitle, newGovernanceOrigin } = body;

    if (!releaseId || !action) {
      return NextResponse.json({ error: 'Missing releaseId or action' }, { status: 400 });
    }

    const existing = cmsServerStorage.getRelease(releaseId);
    if (!existing) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    let updated: CMSRelease = { ...existing, updatedAt: now };

    if (action === 'keep_canonical') {
      // Keep canonical title, dismiss drift
      updated = {
        ...updated,
        metadataStatus: 'synced',
        canonicalStatus: 'verified',
      };
    } else if (action === 'adopt_youtube') {
      // Adopt current YouTube packaging into canonical fields while keeping slug immutable
      const ytTitle = existing.youtubeTitle || existing.youtubeStats?.title;
      const ytThumb = existing.youtubeThumbnailUrl || existing.youtubeStats?.thumbnailUrl;
      
      if (!ytTitle && !ytThumb) {
        return NextResponse.json({ error: 'No YouTube packaging metadata available to adopt' }, { status: 400 });
      }

      updated = {
        ...updated,
        title: ytTitle || existing.title,
        canonicalTitle: ytTitle || existing.canonicalTitle || existing.title,
        thumbnailUrl: ytThumb || existing.thumbnailUrl,
        canonicalThumbnail: ytThumb || existing.canonicalThumbnail || existing.thumbnailUrl,
        metadataStatus: 'synced',
        canonicalStatus: 'verified',
        // Slug remains strictly unchanged to preserve URL permanence
      };
    } else if (action === 'edit_canonical') {
      // Explicit manual edit of canonical identity
      if (!newCanonicalTitle || !newCanonicalTitle.trim()) {
        return NextResponse.json({ error: 'Canonical title cannot be empty' }, { status: 400 });
      }

      const cleanTitle = newCanonicalTitle.trim();
      const ytTitle = existing.youtubeTitle || existing.youtubeStats?.title || '';
      const hasDrift = ytTitle && cleanTitle.toLowerCase() !== ytTitle.toLowerCase();

      updated = {
        ...updated,
        title: cleanTitle,
        canonicalTitle: cleanTitle,
        subtitle: newSubtitle !== undefined ? newSubtitle.trim() : existing.subtitle,
        governanceOrigin: newGovernanceOrigin || existing.governanceOrigin || 'native_governed',
        govType: newGovernanceOrigin || existing.govType || 'native_governed',
        canonicalStatus: 'verified',
        metadataStatus: hasDrift ? 'drift_detected' : 'synced',
      };
    } else {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    cmsServerStorage.saveRelease(updated);

    return NextResponse.json({
      success: true,
      message: `Metadata authority action '${action}' applied successfully to ${releaseId}`,
      release: updated,
    });
  } catch (err: any) {
    console.error('[API /api/admin/metadata-authority] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
