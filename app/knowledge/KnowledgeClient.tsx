"use client";

/**
 * KnowledgeClient.tsx
 *
 * URL-driven Knowledge browser with per-tab pagination.
 *
 * Processing order (MANDATORY — never change):
 *   canonical dataset → search filter → class filter → sort → paginate → render
 *
 * URL schema:
 *   /knowledge                           All Classes, page 1
 *   /knowledge?page=2                    All Classes, page 2
 *   /knowledge?class=singer              Singer, page 1
 *   /knowledge?class=singer&page=2       Singer, page 2
 *   /knowledge?class=singer&q=shafi      Singer + search, page 1
 *   /knowledge/singer                    Class sub-route (initialClass='singer')
 *   /knowledge/singer?page=2             Class sub-route, page 2
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Section } from '../components/layout/Section';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/primitives/Card';
import { Badge } from '../components/primitives/Badge';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

/** Display order preference for tabs. Classes present in data but not in this
 *  list are appended alphabetically — so future classes appear automatically. */
const PREFERRED_TAB_ORDER = [
  'singer', 'saint_poet', 'traditional_poet', 'song', 'release',
  'concept', 'practice', 'tradition', 'order', 'poet', 'writer',
  'person', 'article', 'scholar', 'album', 'saint',
];

const CLASS_LABELS: Record<string, string> = {
  singer: 'Singer',
  saint_poet: 'Saint Poet',
  traditional_poet: 'Traditional Poet',
  song: 'Song',
  release: 'Release',
  concept: 'Concept',
  practice: 'Practice',
  tradition: 'Tradition',
  order: 'Order',
  poet: 'Poet',
  writer: 'Writer',
  person: 'Person',
  article: 'Article',
  scholar: 'Scholar',
  album: 'Album',
  saint: 'Saint',
  kalam: 'Kalam',
  region: 'Region',
};

function classLabel(cls: string): string {
  return (
    CLASS_LABELS[cls] ??
    cls.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

const CLASS_EMOJI: Record<string, string> = {
  singer: '🎤',
  poet: '📜',
  saint_poet: '📜',
  traditional_poet: '✍️',
  writer: '✍️',
  song: '🎵',
  kalam: '🎵',
  release: '🎵',
  album: '🎙',
  concept: '✨',
  tradition: '🌍',
  saint: '🕌',
  article: '📚',
  practice: '🙏',
  scholar: '🎓',
  order: '⚜️',
  person: '👤',
  region: '🗺️',
};

function getEmoji(cls: string): string {
  return CLASS_EMOJI[cls] ?? '🔹';
}

// ─── Pagination component ─────────────────────────────────────────────────────
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

function KnowledgePagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, totalCount);

  // Build numbered sequence with ellipsis for large totals
  const pageNumbers = useMemo<(number | 'ellipsis')[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    if (currentPage > 3) pages.push('ellipsis');
    for (
      let p = Math.max(2, currentPage - 1);
      p <= Math.min(totalPages - 1, currentPage + 1);
      p++
    ) {
      pages.push(p);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  const base =
    'rounded text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40';
  const enabled =
    'px-3 py-2 text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)]/40';
  const disabled =
    'px-3 py-2 text-[var(--color-text-tertiary)] border border-[var(--color-border)] opacity-40 cursor-not-allowed';
  const active =
    'w-10 py-2 bg-[var(--color-gold)] text-[var(--color-midnight)] border border-[var(--color-gold)] font-bold';
  const inactive =
    'w-10 py-2 text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)]/40';

  return (
    <nav aria-label="Knowledge page navigation" className="mt-12 flex flex-col items-center gap-4">
      {/* Range label */}
      <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
        Showing {start}–{end} of {totalCount} entities
      </p>

      {/* Mobile: simplified */}
      <div className="flex sm:hidden items-center gap-3">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={`${base} px-4 ${currentPage === 1 ? disabled : enabled}`}
        >
          ← Previous
        </button>
        <span className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className={`${base} px-4 ${currentPage === totalPages ? disabled : enabled}`}
        >
          Next →
        </button>
      </div>

      {/* Desktop: numbered */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className={`${base} px-4 ${currentPage === 1 ? disabled : enabled}`}
        >
          ← Previous
        </button>

        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 text-[var(--color-text-tertiary)] text-sm select-none"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
              className={`${base} ${p === currentPage ? active : inactive}`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className={`${base} px-4 ${currentPage === totalPages ? disabled : enabled}`}
        >
          Next →
        </button>
      </div>
    </nav>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function KnowledgeClient({
  entities,
  initialClass = 'all',
  stats,
}: {
  entities: any[];
  initialClass?: string;
  stats?: any;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // "Main mode": rendered at /knowledge with tabs + class URL param.
  // "Class mode": rendered at /knowledge/[class] — initialClass is fixed.
  const isMainMode = initialClass === 'all';

  // ── Read URL state ──────────────────────────────────────────────────────────
  const activeClass = isMainMode
    ? (searchParams.get('class') ?? 'all')
    : initialClass;
  const urlSearch = searchParams.get('q') ?? '';
  const rawPage = parseInt(searchParams.get('page') ?? '1', 10);

  // Local state for search input so typing is instant.
  // Changes are debounced → URL push (resets to page 1).
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Sync local input when URL changes (e.g. browser Back/Forward)
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Debounce: push URL 350 ms after the user stops typing
  useEffect(() => {
    if (searchInput === urlSearch) return;
    const t = setTimeout(() => {
      navigateTo({ q: searchInput, page: 1 });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── URL navigation helper ───────────────────────────────────────────────────
  const navigateTo = useCallback(
    (updates: { class?: string; q?: string; page?: number }) => {
      const sp = new URLSearchParams();
      const cls =
        updates.class !== undefined ? updates.class : activeClass;
      const q =
        updates.q !== undefined ? updates.q : urlSearch;
      const page =
        updates.page !== undefined ? updates.page : rawPage;

      if (isMainMode && cls !== 'all') sp.set('class', cls);
      if (q) sp.set('q', q);
      if (page > 1) sp.set('page', String(page));

      const qs = sp.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, {
        scroll: false,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeClass, urlSearch, rawPage, isMainMode, pathname]
  );

  // ── Global class counts (full dataset — never changes per page) ─────────────
  const classCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = { all: entities.length };
    for (const entity of entities) {
      const eClasses: string[] =
        entity.classes ?? [entity.class ?? entity.type].filter(Boolean);
      for (const c of eClasses) {
        if (c) counts[c] = (counts[c] ?? 0) + 1;
      }
    }
    return counts;
  }, [entities]);

  // ── Dynamic tabs (main mode only) — derived from real data ─────────────────
  const tabClasses = useMemo<string[]>(() => {
    if (!isMainMode) return [];
    const allClasses = Array.from(
      new Set(
        entities
          .flatMap((e: any) =>
            e.classes ?? [e.class ?? e.type].filter(Boolean)
          )
          .filter(Boolean)
      )
    );
    const withData = allClasses.filter(
      (c) => (classCounts[c] ?? 0) > 0
    );
    const preferred = PREFERRED_TAB_ORDER.filter((c) =>
      withData.includes(c)
    );
    const rest = withData
      .filter((c) => !PREFERRED_TAB_ORDER.includes(c))
      .sort();
    return [...preferred, ...rest];
  }, [entities, classCounts, isMainMode]);

  // ── Filter pipeline: search → class → sort ─────────────────────────────────
  // (Publication/visibility filter: applied here if field is added later)
  const fullFiltered = useMemo(() => {
    const q = urlSearch.toLowerCase().trim();
    return entities
      .filter((entity) => {
        // Class filter
        const eClasses: string[] =
          entity.classes ??
          [entity.class ?? entity.type].filter(Boolean);
        const matchClass =
          activeClass === 'all' || eClasses.includes(activeClass);
        if (!matchClass) return false;

        // Search filter
        const haystack = [
          entity.name ?? entity.title ?? '',
          ...(entity.alternateNames ?? entity.aliases ?? []),
          entity.shortDescription ?? entity.summary ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort((a, b) =>
        (a.name ?? a.title ?? '').localeCompare(b.name ?? b.title ?? '')
      );
  }, [entities, activeClass, urlSearch]);

  // ── Pagination calculation ──────────────────────────────────────────────────
  const totalCount = fullFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  // Normalize invalid/out-of-range pages safely
  const safePage = isNaN(rawPage)
    ? 1
    : Math.min(Math.max(1, rawPage), totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return fullFiltered.slice(start, start + PAGE_SIZE);
  }, [fullFiltered, safePage]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTabChange = useCallback(
    (cls: string) => {
      // Tab change always resets to page 1
      navigateTo({ class: cls, q: urlSearch, page: 1 });
    },
    [navigateTo, urlSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      navigateTo({ page });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigateTo]
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    navigateTo({ class: 'all', q: '', page: 1 });
  }, [navigateTo]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* HERO / SEARCH / TABS */}
      <Section
        background="midnight"
        className="pt-8 md:pt-12 pb-4 border-b border-[var(--color-border)]"
      >
        <PageContainer>
          <div className="max-w-4xl mx-auto text-center mb-8">
            {!isMainMode ? (
              <>
                <div className="mb-4 text-[var(--text-xs)] uppercase tracking-wider font-medium text-[var(--color-text-secondary)]">
                  <Link
                    href="/"
                    className="hover:text-[var(--color-gold)] transition-colors"
                  >
                    Home
                  </Link>
                  <span className="mx-2 opacity-50">&gt;</span>
                  <Link
                    href="/knowledge"
                    className="hover:text-[var(--color-gold)] transition-colors"
                  >
                    Knowledge
                  </Link>
                  <span className="mx-2 opacity-50">&gt;</span>
                  <span className="text-[var(--color-gold)]">
                    {classLabel(initialClass)}
                  </span>
                </div>
                <h1 className="text-[var(--text-3xl)] md:text-[var(--text-4xl)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.1] tracking-tight capitalize">
                  {classLabel(initialClass)} Archive
                </h1>
                <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-[var(--leading-relaxed)] font-light">
                  Viewing all verified entities in the{' '}
                  {classLabel(initialClass)} class.
                </p>
              </>
            ) : (
              <>
                <div className="mb-4">
                  <span className="inline-block px-4 py-1 border border-[var(--color-gold)]/30 rounded-full text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-wider font-medium">
                    Institutional Archive
                  </span>
                </div>
                <h1 className="text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
                  SufiPulse Knowledge
                </h1>
                <p className="text-[var(--text-lg)] md:text-[var(--text-xl)] text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-[var(--leading-relaxed)] font-light">
                  Explore the wisdom, voices, traditions, and sacred heritage
                  of Sufism through a living digital knowledge library.
                </p>
              </>
            )}
          </div>

          {/* Stats strip — main mode only */}
          {isMainMode && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-16">
              {[
                { label: 'Knowledge Nodes', value: stats.atlasNodes },
                { label: 'Singers', value: stats.singers },
                { label: 'Saints & Poets', value: stats.poetsWriters },
                {
                  label: 'Songs & Releases',
                  value: stats.releases + stats.songs,
                },
                { label: 'Concepts', value: stats.concepts },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="text-center p-6 bg-[var(--color-slate)]/50 backdrop-blur-sm border-[var(--color-border-strong)]"
                >
                  <div className="text-[var(--text-3xl)] font-bold mb-2 text-[var(--color-gold)]">
                    {stat.value}
                  </div>
                  <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                    {stat.label}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Search + tabs */}
          <div className="flex flex-col gap-6 max-w-5xl mx-auto mb-8">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder={
                  isMainMode
                    ? 'Search singers, poets, releases, concepts...'
                    : `Search ${classLabel(initialClass)}...`
                }
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-[var(--color-slate)] border border-[var(--color-border-strong)] rounded-[var(--radius-base)] p-4 md:p-6 text-[var(--text-lg)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-gold)] focus:shadow-[var(--shadow-gold-glow)] transition-all placeholder-[var(--color-text-tertiary)]"
              />
              <div className="absolute right-6 top-6 text-[var(--color-text-tertiary)] pointer-events-none">
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Typeahead suggestions — from full filtered set (no page limit) */}
              {searchInput && fullFiltered.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-[var(--color-midnight)] border border-[var(--color-gold)]/30 rounded-[var(--radius-lg)] shadow-2xl overflow-hidden animate-fade-in text-left">
                  <div className="max-h-[350px] overflow-y-auto">
                    {fullFiltered.slice(0, 6).map((e: any) => (
                      <Link
                        key={e.slug ?? e.id}
                        href={`/knowledge/${e.class ?? e.type}/${e.slug}`}
                        className="block px-6 py-4 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-slate)]/50 transition-colors group"
                      >
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors">
                            {e.name ?? e.title}
                          </div>
                          <div className="text-[var(--text-xs)] text-[var(--color-gold)]/80 uppercase tracking-widest font-medium">
                            {e.class ?? e.type}
                          </div>
                        </div>
                        {(e.shortDescription ?? e.summary) && (
                          <div className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mt-1 truncate">
                            {e.shortDescription ?? e.summary}
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                  {fullFiltered.length > 6 && (
                    <div className="px-6 py-3 bg-[var(--color-slate)]/30 text-[var(--text-xs)] text-[var(--color-text-tertiary)] text-center border-t border-[var(--color-border)] uppercase tracking-wider font-semibold">
                      +{fullFiltered.length - 6} more results — scroll down to
                      view grid
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs — main mode only, dynamically derived from real data */}
            {isMainMode && (
              <div className="flex flex-wrap justify-center gap-3">
                {/* All Classes tab */}
                <button
                  onClick={() => handleTabChange('all')}
                  className={`px-6 py-3 rounded-[var(--radius-base)] text-[var(--text-sm)] font-medium transition-all ${
                    activeClass === 'all'
                      ? 'bg-[var(--color-gold)] text-[var(--color-midnight)] shadow-[var(--shadow-gold-glow)]'
                      : 'bg-[var(--color-slate)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  🌐 All Classes ({classCounts.all ?? entities.length})
                </button>

                {/* Dynamic class tabs */}
                {tabClasses.map((c) => {
                  const count = classCounts[c] ?? 0;
                  if (count === 0) return null;
                  const isActive = activeClass === c;
                  return (
                    <button
                      key={c}
                      onClick={() => handleTabChange(isActive ? 'all' : c)}
                      className={`px-5 py-3 rounded-[var(--radius-base)] text-[var(--text-sm)] font-medium transition-all flex items-center gap-2 ${
                        isActive
                          ? 'bg-[var(--color-gold)] text-[var(--color-midnight)] shadow-[var(--shadow-gold-glow)]'
                          : 'bg-[var(--color-slate)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <span>{getEmoji(c)}</span>
                      <span>{classLabel(c)}</span>
                      {/* Count is always global — never per-page */}
                      <span className="opacity-70 text-xs">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PageContainer>
      </Section>

      {/* ENTITY GRID */}
      <Section
        background="midnight"
        spacing="normal"
        className="pt-0 pb-24 border-t border-[var(--color-text-tertiary)]/10"
      >
        <PageContainer>
          <div className="pt-12">
            {paginated.length === 0 ? (
              <div className="text-center py-24 max-w-2xl mx-auto bg-[var(--color-slate)] border border-[var(--color-border-strong)] rounded-[var(--radius-base)]">
                <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-4">
                  No entities found
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-8">
                  Try adjusting your search criteria or selecting a different
                  class.
                </p>
                {isMainMode && (
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3 bg-[var(--color-midnight)] border border-[var(--color-border-strong)] rounded-full text-[var(--color-text-primary)] hover:border-[var(--color-gold)] transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Entity cards — identical design to existing */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {paginated.map((entity) => (
                    <Link
                      key={entity.id ?? entity.slug}
                      href={`/knowledge/${entity.class ?? entity.type}/${entity.slug}`}
                      className="block h-full group"
                    >
                      <Card
                        hoverable
                        className="h-full flex flex-col bg-[var(--color-slate)]/30 backdrop-blur-sm border-[var(--color-border-strong)]"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-4">
                            <Badge
                              variant="gold"
                              className="bg-[var(--color-gold)]/10"
                            >
                              {getEmoji(entity.class ?? entity.type)}{' '}
                              {entity.class ?? entity.type}
                            </Badge>
                            {entity.source === 'constitutional_core' && (
                              <Badge
                                variant="neutral"
                                className="border-[var(--color-gold)]/20 text-[var(--color-gold)]"
                              >
                                Constitutional
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-gold)] transition-colors">
                            {entity.name ?? entity.title}
                          </h2>
                          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed mb-6">
                            {entity.shortDescription ?? entity.summary}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-[var(--color-border-strong)]">
                          <div className="flex items-center gap-4 text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">
                            <span>
                              Edges:{' '}
                              <span className="text-[var(--color-gold)]">
                                {entity.relationships?.length ?? 0}
                              </span>
                            </span>
                            <span>
                              Score:{' '}
                              <span className="text-[var(--color-gold)]">
                                {entity.readinessScore ?? 'N/A'}
                              </span>
                            </span>
                          </div>
                          <div className="text-[var(--color-gold)] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                            Explore →
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <KnowledgePagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </PageContainer>
      </Section>
    </>
  );
}
