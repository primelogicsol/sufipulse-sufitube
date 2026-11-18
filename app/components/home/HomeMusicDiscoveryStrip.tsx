"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Play,
  Music,
  Compass,
  ArrowRight,
  X,
  FileText,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';

export interface DiscoveryReleaseItem {
  id: string;
  slug: string;
  title: string;
  canonicalTitle?: string;
  subtitle?: string;
  youtubeId: string;
  thumbnailUrl?: string;
  canonicalThumbnail?: string;
  durationFormatted?: string;
  writer?: string;
  vocalist?: string;
  tags?: string[];
  themes?: string[];
  description?: string;
}

interface HomeMusicDiscoveryStripProps {
  releases: DiscoveryReleaseItem[];
}

export type CategoryPill = 'all' | 'kashmir' | 'qawwali' | 'contemplative' | 'urdu' | 'flagship';

interface PillConfig {
  id: CategoryPill;
  label: string;
  icon: string;
  badgeLabel: string;
  badgeColor: string;
}

const PILLS: PillConfig[] = [
  {
    id: 'all',
    label: 'All Works',
    icon: '✦',
    badgeLabel: 'SufiPulse Catalog',
    badgeColor: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  },
  {
    id: 'kashmir',
    label: 'Kashmiri Kalam & Heritage',
    icon: '🌿',
    badgeLabel: 'Kashmir Heritage',
    badgeColor: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'urdu',
    label: 'Classical Urdu Poetry',
    icon: '📜',
    badgeLabel: 'Urdu Kalam',
    badgeColor: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
  },
  {
    id: 'qawwali',
    label: 'Qawwali & World Fusion',
    icon: '✨',
    badgeLabel: 'Qawwali & Fusion',
    badgeColor: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
  },
  {
    id: 'contemplative',
    label: 'Contemplative & Ambient',
    icon: '🕊️',
    badgeLabel: 'Contemplative Soundscape',
    badgeColor: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
  },
  {
    id: 'flagship',
    label: 'Flagship Releases',
    icon: '⭐',
    badgeLabel: 'Flagship Masterpiece',
    badgeColor: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
  },
];

// High-precision classifier that avoids matching boilerplate channel descriptions
function scoreRelease(r: DiscoveryReleaseItem) {
  const title = (r.canonicalTitle || r.title || '').toLowerCase();
  const sub = (r.subtitle || '').toLowerCase();
  // Read only the first 350 characters of description to isolate the song synopsis from boilerplate acknowledgments
  const descHead = (r.description || '').slice(0, 350).toLowerCase();
  const writer = (r.writer || '').toLowerCase();
  const vocalist = (r.vocalist || '').toLowerCase();
  const tags = (r.tags || []).join(' ').toLowerCase();

  const combined = `${title} ${sub} ${descHead} ${writer} ${vocalist} ${tags}`;

  const scores: Record<CategoryPill, number> = {
    all: 1,
    kashmir: 0,
    urdu: 0,
    qawwali: 0,
    contemplative: 0,
    flagship: 0,
  };

  // 1. Flagship Masterpieces
  if (
    title.includes('footprints behind') ||
    title.includes('pani gawah') ||
    title.includes('ik khamoshi') ||
    title.includes('pehchaan') ||
    title.includes('rehmat se likha') ||
    title.includes('how long will you remain silent')
  ) {
    scores.flagship += 12;
  }

  // 2. Kashmiri Kalam & Heritage
  if (
    combined.includes('kashmir') ||
    combined.includes('kashmiri') ||
    combined.includes('footprints behind') ||
    combined.includes('pani gawah')
  ) {
    scores.kashmir += 10;
  }
  if (
    combined.includes('habba') ||
    combined.includes('lalla') ||
    combined.includes('noorani') ||
    combined.includes('sheikh') ||
    combined.includes('nund rishi') ||
    combined.includes('shah-e-hamdan') ||
    combined.includes('hazratbal') ||
    combined.includes('ganderbal')
  ) {
    scores.kashmir += 12;
  }
  if (
    combined.includes('wanun traav') ||
    combined.includes('kemis taani') ||
    combined.includes('korthas') ||
    combined.includes('dapyomas') ||
    combined.includes('vitasta') ||
    combined.includes('jhelum') ||
    combined.includes('artisans') ||
    combined.includes('craft')
  ) {
    scores.kashmir += 12;
  }

  // 3. Devotional Qawwali & Zikr
  if (combined.includes('qawwali') || combined.includes('qalandar-e-zamaan')) {
    scores.qawwali += 12;
  }
  if (
    combined.includes('khwaja') ||
    combined.includes('bulla') ||
    combined.includes('ya ali') ||
    combined.includes('husain') ||
    combined.includes('ghaus') ||
    combined.includes('karbala') ||
    combined.includes('manqabat')
  ) {
    scores.qawwali += 10;
  }
  if (
    combined.includes('darood') ||
    combined.includes('mohammad') ||
    combined.includes('naat') ||
    combined.includes('hamd') ||
    combined.includes('sajda') ||
    combined.includes('dhikr') ||
    combined.includes('zikr')
  ) {
    scores.qawwali += 7;
  }

  // 4. Contemplative & Ambient
  if (
    combined.includes('aahista') ||
    combined.includes('mysteries') ||
    combined.includes('hu... hu...') ||
    combined.includes('khamosh') ||
    combined.includes('khamoshi')
  ) {
    scores.contemplative += 12;
  }
  if (
    combined.includes('silence') ||
    combined.includes('meditation') ||
    combined.includes('inner') ||
    combined.includes('peace') ||
    combined.includes('gardish') ||
    combined.includes('breath')
  ) {
    scores.contemplative += 8;
  }

  // 5. Classical Urdu & Kalam
  if (
    combined.includes('iqbal') ||
    combined.includes('shikwa') ||
    combined.includes('zarf') ||
    combined.includes('ishq') ||
    combined.includes('fana') ||
    combined.includes('fanā') ||
    combined.includes('baqa') ||
    combined.includes('baqā') ||
    combined.includes('bedil')
  ) {
    scores.urdu += 12;
  }
  if (
    combined.includes('kalam') ||
    combined.includes('ghazal') ||
    combined.includes('rooh') ||
    combined.includes('dil') ||
    combined.includes('saada') ||
    combined.includes('najaat') ||
    combined.includes('lakeerein') ||
    combined.includes('tahrirein')
  ) {
    scores.urdu += 7;
  }

  return scores;
}

export function HomeMusicDiscoveryStrip({ releases }: HomeMusicDiscoveryStripProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPill, setSelectedPill] = useState<CategoryPill>('all');
  const [visibleCount, setVisibleCount] = useState<number>(6);

  // Compute scored catalogue
  const scoredCatalog = useMemo(() => {
    return releases.map((release) => {
      const scores = scoreRelease(release);
      // Determine dominant category for badge display
      let bestPill: CategoryPill = 'all';
      let maxScore = 0;
      (['flagship', 'kashmir', 'qawwali', 'contemplative', 'urdu'] as CategoryPill[]).forEach((p) => {
        if (scores[p] > maxScore) {
          maxScore = scores[p];
          bestPill = p;
        }
      });
      return {
        release,
        scores,
        dominantPill: bestPill,
      };
    });
  }, [releases]);

  // Pill count summaries
  const pillCounts = useMemo(() => {
    const counts: Record<CategoryPill, number> = {
      all: releases.length,
      kashmir: 0,
      urdu: 0,
      qawwali: 0,
      contemplative: 0,
      flagship: 0,
    };
    scoredCatalog.forEach((item) => {
      (['kashmir', 'urdu', 'qawwali', 'contemplative', 'flagship'] as CategoryPill[]).forEach((p) => {
        if (item.scores[p] > 0) counts[p]++;
      });
    });
    return counts;
  }, [scoredCatalog, releases.length]);

  // Dynamic Filtering and Relevance Sorting
  const filteredAndSorted = useMemo(() => {
    let result = scoredCatalog;

    // 1. Cultural Pillar Filter + Relevance Sort
    if (selectedPill !== 'all') {
      result = result
        .filter((item) => item.scores[selectedPill] > 0)
        .sort((a, b) => b.scores[selectedPill] - a.scores[selectedPill]);
    }

    // 2. Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(({ release }) => {
        const titleMatch = (release.canonicalTitle || release.title).toLowerCase().includes(q);
        const writerMatch = (release.writer || '').toLowerCase().includes(q);
        const vocalistMatch = (release.vocalist || '').toLowerCase().includes(q);
        const tagsMatch = (release.tags || []).some((t) => t.toLowerCase().includes(q));
        const descMatch = (release.description || '').toLowerCase().includes(q);
        return titleMatch || writerMatch || vocalistMatch || tagsMatch || descMatch;
      });
    }

    return result.map((item) => item.release);
  }, [scoredCatalog, selectedPill, searchQuery]);

  const displayedReleases = filteredAndSorted.slice(0, visibleCount);
  const activePillConfig = PILLS.find((p) => p.id === selectedPill) || PILLS[0];

  const handlePillChange = (pillId: CategoryPill) => {
    setSelectedPill(pillId);
    setVisibleCount(6); // Reset pagination on tab change
  };

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, filteredAndSorted.length));
  };

  return (
    <section className="relative py-14 bg-gradient-to-b from-[var(--color-midnight)] via-[#0d131f] to-[var(--color-midnight)] border-b border-neutral-800/80">
      <PageContainer>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-bold uppercase tracking-widest mb-2">
                <Compass className="w-3.5 h-3.5" />
                <span>SufiPulse Instant Music Discovery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Discover Original Sufi Music &amp; Mystical Kalam
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
                Explore full-length releases across Kashmiri sacred poetry, classical Urdu treatises, devotional qawwali, and contemplative soundscapes.
              </p>
            </div>

            <Link
              href="/releases"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors self-start md:self-end"
            >
              <span>View All 99+ Releases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search & Category Bar */}
          <div className="space-y-3 pt-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(6);
                }}
                placeholder="Search by song title, poet (e.g. Nund Rishi, Bedil, Iqbal), theme (Fana, Ishq), or keyword..."
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setVisibleCount(6);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Cultural Taxonomy Pills with Distinct Counters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PILLS.map((pill) => {
                const isActive = selectedPill === pill.id;
                const count = pillCounts[pill.id];
                return (
                  <button
                    key={pill.id}
                    onClick={() => handlePillChange(pill.id)}
                    className={`whitespace-nowrap flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20'
                        : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                    }`}
                  >
                    <span>{pill.icon}</span>
                    <span>{pill.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-neutral-950/20 text-neutral-950 font-black'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metadata Count & Active Filter Indicator */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
            <span className="flex items-center gap-2">
              <span>
                Showing <strong className="text-white">{displayedReleases.length}</strong> of{' '}
                <strong className="text-white">{filteredAndSorted.length}</strong> in{' '}
                <span className="text-amber-400 font-semibold">{activePillConfig.label}</span>
              </span>
            </span>
            {(searchQuery || selectedPill !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPill('all');
                  setVisibleCount(6);
                }}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 underline"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* Dynamic Cards Grid */}
          {displayedReleases.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedReleases.map((release) => {
                const videoId = release.youtubeId || release.id;
                const releaseSlug = release.slug || videoId;
                const title = release.canonicalTitle || release.title;
                const thumbCandidates = buildYouTubeThumbnailCandidates(videoId, [
                  release.canonicalThumbnail,
                  release.thumbnailUrl,
                ]);

                // Determine matching cultural badge
                const itemMeta = scoredCatalog.find((c) => c.release.id === release.id);
                const badgePillId = selectedPill !== 'all' ? selectedPill : (itemMeta?.dominantPill || 'all');
                const badgeConfig = PILLS.find((p) => p.id === badgePillId) || PILLS[0];

                return (
                  <div
                    key={release.id}
                    className="group bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-400/40 rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <Link
                        href={`/release-detail/${releaseSlug}`}
                        className="block relative aspect-video bg-black overflow-hidden"
                      >
                        <img
                          src={thumbCandidates[0]}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => advanceThumbnailFallback(e.currentTarget, thumbCandidates)}
                        />
                        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-amber-400/90 text-neutral-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
                          </div>
                        </div>

                        {/* Cultural Badge on Image */}
                        <span
                          className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md shadow-md ${badgeConfig.badgeColor}`}
                        >
                          {badgeConfig.icon} {badgeConfig.badgeLabel}
                        </span>

                        {/* Duration Badge */}
                        {release.durationFormatted && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-white border border-white/10">
                            {release.durationFormatted}
                          </span>
                        )}
                      </Link>

                      {/* Content Body */}
                      <div className="p-4 space-y-2">
                        <Link href={`/release-detail/${releaseSlug}`}>
                          <h3 className="text-sm font-bold text-white line-clamp-2 hover:text-amber-400 transition-colors leading-snug">
                            {title}
                          </h3>
                        </Link>

                        <div className="flex flex-col gap-0.5 text-[11px] text-neutral-400">
                          {release.vocalist && (
                            <div>
                              <span className="text-neutral-500">Vocalist: </span>
                              <span className="text-neutral-300 font-medium">{release.vocalist}</span>
                            </div>
                          )}
                          {release.writer && (
                            <div>
                              <span className="text-neutral-500">Kalam / Poetry: </span>
                              <span className="text-neutral-300 font-medium">{release.writer}</span>
                            </div>
                          )}
                        </div>

                        {release.description && (
                          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed pt-1">
                            {release.description.split(/━━━━━━━━━━━━━━━━━━━━━━|◆/)[0].trim()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-4 pb-4 pt-2 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                      <Link
                        href={`/release-detail/${releaseSlug}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-bold transition-colors"
                      >
                        <Play className="w-3 h-3 fill-amber-400" />
                        <span>Listen Now</span>
                      </Link>
                      <Link
                        href={`/release-detail/${releaseSlug}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                        title="View Lyrics & Translation"
                      >
                        <FileText className="w-3 h-3 text-neutral-400" />
                        <span className="hidden sm:inline">Lyrics</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30">
              <Music className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white mb-1">No matching recordings found</h4>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mb-4">
                We couldn&apos;t find releases matching &quot;{searchQuery}&quot; under &quot;{activePillConfig.label}&quot;. Try a different keyword or reset filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedPill('all');
                  setVisibleCount(6);
                }}
                className="px-4 py-2 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 transition-colors"
              >
                Clear Search &amp; Show All
              </button>
            </div>
          )}

          {/* Load More Button */}
          {filteredAndSorted.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleShowMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-neutral-200 transition-colors shadow-lg hover:border-amber-400/40"
              >
                <span>Load More Releases ({filteredAndSorted.length - visibleCount} remaining)</span>
                <ChevronDown className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          )}
        </div>
      </PageContainer>
    </section>
  );
}
