import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease, toPublicPremiereRelease } from '@/server/storage/release-dto';
import { NextRequest, NextResponse } from 'next/server';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';

const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=3600',
};

export async function GET(request: NextRequest) {
  try {
    const backend = getReleaseStorageBackend();
    let allReleases: CMSRelease[] = [];

    if (backend === 'postgres') {
      const store = getReleaseReadStore();
      const result = await store.query({ paginate: false });
      allReleases = result.items.map(toCanonicalCMSRelease);
    } else {
      allReleases = cmsServerStorage.getAllReleases();
    }

    // Filter publicly eligible premieres
    const now = new Date().getTime();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    const eligibleReleases = allReleases.filter(r => {
      if (r.status !== 'published') return false;
      if (r.visibility !== 'public') return false;
      if (r.premiereVisibility !== 'public') return false;

      const lifecycle = r.releaseLifecycle || '';
      if (lifecycle === 'released') {
        if (r.officialReleaseAt) {
          const releaseTime = new Date(r.officialReleaseAt).getTime();
          const age = now - releaseTime;
          if (age < 0 || age > THIRTY_DAYS_MS) {
            return false;
          }
        } else {
          return false;
        }
      } else if (!['upcoming', 'teaser_live', 'premiere_scheduled'].includes(lifecycle)) {
        return false;
      }
      return true;
    });

    let featured: CMSRelease | null = null;
    let upcoming: CMSRelease[] = [];

    // Find featured
    const explicitFeatured = eligibleReleases.find(r => r.isFeaturedPremiere);
    if (explicitFeatured) {
      featured = explicitFeatured;
    } else {
      // nearest upcoming with live premium teaser
      const withLiveTeaser = eligibleReleases.filter(r => 
        r.preReleaseAssets?.some(a => a.type === 'premium_teaser' && a.status === 'live')
      );
      if (withLiveTeaser.length > 0) {
        featured = withLiveTeaser.sort((a, b) => {
          const aDate = a.officialReleaseAt ? new Date(a.officialReleaseAt).getTime() : Infinity;
          const bDate = b.officialReleaseAt ? new Date(b.officialReleaseAt).getTime() : Infinity;
          return aDate - bDate;
        })[0];
      } else {
        // nearest publicly announced
        featured = eligibleReleases.sort((a, b) => {
          const aDate = a.officialReleaseAt ? new Date(a.officialReleaseAt).getTime() : Infinity;
          const bDate = b.officialReleaseAt ? new Date(b.officialReleaseAt).getTime() : Infinity;
          return aDate - bDate;
        })[0] || null;
      }
    }

    if (featured) {
      upcoming = eligibleReleases.filter(r => r.id !== featured!.id);
    } else {
      upcoming = [...eligibleReleases];
    }

    // Sort upcoming
    upcoming.sort((a, b) => {
      const aOfficial = a.officialReleaseAt ? new Date(a.officialReleaseAt).getTime() : Infinity;
      const bOfficial = b.officialReleaseAt ? new Date(b.officialReleaseAt).getTime() : Infinity;
      if (aOfficial !== bOfficial) return aOfficial - bOfficial;

      const aAnnounced = a.premiereAnnouncedAt ? new Date(a.premiereAnnouncedAt).getTime() : Infinity;
      const bAnnounced = b.premiereAnnouncedAt ? new Date(b.premiereAnnouncedAt).getTime() : Infinity;
      if (aAnnounced !== bAnnounced) return aAnnounced - bAnnounced;

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
      return aCreated - bCreated;
    });

    return NextResponse.json({
      featured: featured ? toPublicPremiereRelease(featured) : null,
      upcoming: upcoming.map(toPublicPremiereRelease),
      count: eligibleReleases.length
    }, { headers: cacheHeaders });

  } catch (err: any) {
    console.error('[API /api/release-premieres] GET ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
