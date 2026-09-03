import Image from 'next/image';
import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { getReleaseStorageBackend, getReleaseReadStore } from '@/server/storage/release-read-backend';
import { toCanonicalCMSRelease, toPublicPremiereRelease } from '@/server/storage/release-dto';
import { type CMSRelease } from '@/lib/cms-storage';
import { cmsServerStorage } from '@/lib/cms-storage-server';
import { FeaturedPremiere } from './components/FeaturedPremiere';
import { UpcomingPremiereCard } from './components/UpcomingPremiereCard';

export const metadata = {
  title: 'The Premiere Room | SufiPulse Studio USA',
  description: 'Upcoming Releases, Premium Teasers, and First Listens from SufiPulse Studio.',
};

export const revalidate = 60;

async function getPremieres() {
  const backend = getReleaseStorageBackend();
  let allReleases: CMSRelease[] = [];

  if (backend === 'postgres') {
    const store = getReleaseReadStore();
    const result = await store.query({ paginate: false });
    allReleases = result.items.map(toCanonicalCMSRelease);
  } else {
    allReleases = cmsServerStorage.getAllReleases();
  }

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
        // Keep if it was released within the last 30 days or is scheduled for the future
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

  const explicitFeatured = eligibleReleases.find(r => r.isFeaturedPremiere);
  if (explicitFeatured) {
    featured = explicitFeatured;
  } else {
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

  return {
    featured: featured ? toPublicPremiereRelease(featured) : null,
    upcoming: upcoming.map(toPublicPremiereRelease)
  };
}

export default async function ReleasePremieresPage() {
  const { featured, upcoming } = await getPremieres();

  return (
    <>
      <section className="relative w-full min-h-[90vh] flex flex-col justify-center overflow-hidden bg-[var(--color-midnight)] pb-16 md:pb-24 border-b border-[var(--color-border)] hero-bleed">
        {/* Cinematic Background Banner matching global hero */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/banner5.png"
            alt="The Premiere Room"
            fill
            priority
            quality={95}
            className="object-cover object-center scale-105 transform motion-safe:animate-fade-in opacity-60"
          />
          {/* Layered brand gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <PageContainer>
            <div className="max-w-4xl mx-auto text-center mb-16">
              <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                <span className="text-xs text-[var(--color-gold)] uppercase tracking-widest font-bold">
                  SUFIPULSE USA — PREMIERE DIVISION
                </span>
              </div>

              <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-white leading-[1.1] tracking-tight drop-shadow-lg mb-2">
                The Premiere Room
              </h1>
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-bold text-[var(--color-gold)] leading-[1.1] tracking-tight drop-shadow-lg mb-8 italic">
                First Listen Before Release
              </h2>

              <p className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed font-light drop-shadow px-4">
                Discover forthcoming SufiPulse works before their official release. Experience governed premium teasers, scheduled premieres, and first-listen previews from SufiPulse Studio USA.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="#premieres-content" className="px-8 py-4 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-sm hover:bg-[#FDE68A] transition-all rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5">EXPLORE PREMIERES</a>
                <Link
                  href="/governance"
                  className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-all rounded-full backdrop-blur-sm"
                >
                  PREMIERE GOVERNANCE
                </Link>
              </div>
            </div>
          </PageContainer>
        </div>

        {/* 4-Column Principles Strip */}
        <div className="relative z-10 w-full bg-black/40 backdrop-blur-md border-t border-white/5 mt-8 hidden md:block">
          <PageContainer>
            <div className="grid grid-cols-4 divide-x divide-white/10 py-6">
              <div className="px-6">
                <h4 className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-widest mb-2">1. PREMIUM TEASERS</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">Curated previews of forthcoming governed releases.</p>
              </div>
              <div className="px-6">
                <h4 className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-widest mb-2">2. FIRST LISTEN</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">Early access to selected musical excerpts.</p>
              </div>
              <div className="px-6">
                <h4 className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-widest mb-2">3. RELEASE ALERTS</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">Follow announced releases through their launch cycle.</p>
              </div>
              <div className="px-6">
                <h4 className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-widest mb-2">4. CANONICAL CONTINUITY</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">Every teaser remains attached to the same governed song identity.</p>
              </div>
            </div>
          </PageContainer>
        </div>
      </section>

      <div id="premieres-content" className="w-full bg-[var(--color-midnight)] py-16 md:py-24">
        <PageContainer>

            {!featured && upcoming.length === 0 ? (
              <div className="py-20 text-center">
                <h3 className="text-2xl text-neutral-400 font-light">No premieres are currently announced.</h3>
                <p className="text-neutral-500 mt-4">Check back later for upcoming releases.</p>
              </div>
            ) : (
              <>
                {/* Featured Upcoming Release */}
                {featured && (
                  <FeaturedPremiere release={featured} />
                )}

                {/* Upcoming Releases Grid */}
                {upcoming.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase">
                        {featured ? "More Upcoming" : "Upcoming Releases"}
                      </h3>
                      <Link href="/releases" className="text-[var(--color-gold)] text-sm font-semibold hover:underline">
                        View Released Catalog →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {upcoming.map((release) => (
                        <UpcomingPremiereCard key={release.id} release={release} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </PageContainer>
        </div>
    </>

  );
}