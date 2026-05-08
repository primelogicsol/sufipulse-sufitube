"use client";
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Music, Filter, Search, Play, Calendar, Eye, Youtube, Clock, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';
import GlobalReachStrip from '@/app/components/releases/GlobalReachStrip';
import { getBestReleaseDate, sortReleases } from '@/lib/release-utils';

type FilterType = 'all' | 'native_governed' | 'legacy_registry';
type FormatFilter = 'all' | 'video' | 'audio' | 'short' | 'live' | 'playlist';
type DurationFilter = 'all' | 'short' | 'standard' | 'long';
type SortOrder = 'default' | 'newest' | 'oldest' | 'popular';

const ITEMS_PER_PAGE = 12;

interface YouTubeRelease {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnailUrl: string;
    publishedDate: string;
    durationSeconds: number;
    durationFormatted: string;
    views: number;
    source: string;
    format: 'video' | 'audio' | 'short' | 'live' | 'playlist';
    govType: string;
    // Expanded fields for search
    vocalist: string;
    writer: string;
    tags: string;
    youtubeId: string;
}

export default function Releases() {
    const { user } = useAuth();
    const [releases, setReleases] = useState<YouTubeRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterFormat, setFilterFormat] = useState<FormatFilter>('all');
    const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('default');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchVideos = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const url = new URL('/api/releases', window.location.origin);
            url.searchParams.set('status', 'published');
            
            const cmsRes = await fetch(url.toString(), { cache: 'no-store' });
            if (!cmsRes.ok) throw new Error('Failed to fetch releases');
            const responseData = await cmsRes.json();
            const cmsData = responseData.items || [];
            
            const mappedData = cmsData.map((r: any) => ({
                id: r.youtubeId || r.id,
                slug: r.slug,
                title: r.title,
                description: r.description || '',
                thumbnailUrl: r.thumbnail || '',
                publishedDate: r.publishedAt,
                durationSeconds: Number(r.durationSeconds || 0),
                durationFormatted: r.duration || '0:00',
                views: Number(r.viewCount || 0),
                source: r.source || 'native',
                format: r.format || 'video',
                govType: r.releaseType || 'native_governed',
                // Metadata for search
                vocalist: [r.vocalist?.name, r.vocalist?.nameUrdu].filter(Boolean).join(' '),
                writer: [r.writer?.name, r.writer?.nameUrdu].filter(Boolean).join(' '),
                tags: Array.isArray(r.tags) ? r.tags.join(' ') : (r.description?.match(/#\w+/g)?.join(' ') || ''),
                youtubeId: r.youtubeId || '',
                lastYoutubeSyncAt: r.lastYoutubeSyncAt
            }));

            setReleases(mappedData);
            setError(null);
            
            if (responseData.needsRefresh && !silent) {
                console.log('🔄 YouTube metadata is stale (>24h). Background refresh recommended.');
            }
        } catch (err: any) {
            console.error("Error fetching releases:", err);
            setError(err.message || "Failed to load releases");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/releases/import-youtube', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoIds: [] }) // Empty array = fetch latest 100
            });
            if (!res.ok) throw new Error('Sync failed');
            await fetchVideos(true);
            alert('Sync complete! Latest videos imported.');
        } catch (err: any) {
            console.error("Sync error:", err);
            alert('Failed to sync: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const filteredReleases = useMemo(() => {
        let filtered = releases.filter(release => {
            if (filterType !== 'all' && release.govType !== filterType) return false;
            if (filterFormat !== 'all' && release.format !== filterFormat) return false;
            if (durationFilter !== 'all') {
                const minutes = release.durationSeconds / 60;
                if (durationFilter === 'short' && minutes >= 3) return false;
                if (durationFilter === 'standard' && (minutes < 3 || minutes > 8)) return false;
                if (durationFilter === 'long' && minutes <= 8) return false;
            }
            if (yearFilter !== 'all') {
                const releaseYear = new Date(release.publishedDate).getFullYear();
                if (releaseYear !== parseInt(yearFilter)) return false;
            }
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    release.title.toLowerCase().includes(query) ||
                    release.description.toLowerCase().includes(query) ||
                    release.vocalist.toLowerCase().includes(query) ||
                    release.writer.toLowerCase().includes(query) ||
                    release.tags.toLowerCase().includes(query) ||
                    release.youtubeId.toLowerCase().includes(query) ||
                    release.slug.toLowerCase().includes(query)
                );
            }
            return true;
        });

        // Use standard sort names but map to utility or implement directly
        // Mapping: default -> all, newest -> new, oldest -> old, popular -> popular
        const internalSortMap: Record<string, string> = {
            default: 'all',
            newest: 'new',
            oldest: 'old',
            popular: 'popular'
        };

        return sortReleases(filtered as any, internalSortMap[sortOrder]) as unknown as YouTubeRelease[];
    }, [releases, filterType, filterFormat, durationFilter, yearFilter, searchQuery, sortOrder]);
    
    const totalPages = Math.ceil(filteredReleases.length / ITEMS_PER_PAGE);
    const paginatedReleases = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReleases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredReleases, currentPage]);

    const years = useMemo(() => {
        const yearSet = new Set<number>();
        releases.forEach(r => {
            const year = new Date(r.publishedDate).getFullYear();
            if (!isNaN(year)) yearSet.add(year);
        });
        return Array.from(yearSet).sort((a, b) => b - a);
    }, [releases]);

    return (
        <Layout>
            <section className="w-full overflow-hidden pt-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <GlobalReachStrip />
                </div>
            </section>
            
            <Section background="midnight" spacing="normal">
                <PageContainer>
                    <div className="mb-8">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                            <div>
                                <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
                                    Musical Registry
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4">
                                    Browse Releases
                                </h1>
                                <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
                                    Explore the institutional registry of sacred words, voices, and productions.
                                </p>
                            </div>
                        </div>

                        {/* Unified Toolbar Panel */}
                        <div className="p-5 bg-[var(--color-slate)]/50 border border-white/5 rounded-2xl overflow-hidden">
                            <div className="flex flex-wrap items-end gap-6">
                                {/* Filters Label */}
                                <div className="flex items-center gap-2 mb-2 mr-2 shrink-0">
                                    <Filter className="w-4 h-4 text-[var(--color-gold)]" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]">Filters:</span>
                                </div>

                                {/* Type */}
                                <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold ml-1">Type</span>
                                    <select 
                                        value={filterType} 
                                        onChange={(e) => { setFilterType(e.target.value as FilterType); setCurrentPage(1); }}
                                        className="bg-[var(--color-midnight)] border border-white/10 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="native_governed">Governed</option>
                                        <option value="legacy_registry">Legacy Registry</option>
                                    </select>
                                </div>

                                {/* Format */}
                                <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold ml-1">Format</span>
                                    <select 
                                        value={filterFormat} 
                                        onChange={(e) => { setFilterFormat(e.target.value as FormatFilter); setCurrentPage(1); }}
                                        className="bg-[var(--color-midnight)] border border-white/10 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full"
                                    >
                                        <option value="all">All Formats</option>
                                        <option value="video">Videos</option>
                                        <option value="audio">Audios</option>
                                        <option value="short">Shorts</option>
                                        <option value="live">Live</option>
                                    </select>
                                </div>

                                {/* Duration */}
                                <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold ml-1">Duration</span>
                                    <select 
                                        value={durationFilter} 
                                        onChange={(e) => { setDurationFilter(e.target.value as DurationFilter); setCurrentPage(1); }}
                                        className="bg-[var(--color-midnight)] border border-white/10 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full"
                                    >
                                        <option value="all">All Durations</option>
                                        <option value="short">Short (&lt; 3m)</option>
                                        <option value="standard">Standard (3-8m)</option>
                                        <option value="long">Long (&gt; 8m)</option>
                                    </select>
                                </div>

                                {/* Year */}
                                <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold ml-1">Year</span>
                                    <select 
                                        value={yearFilter} 
                                        onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                                        className="bg-[var(--color-midnight)] border border-white/10 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full"
                                    >
                                        <option value="all">All Years</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>

                                {/* Sort */}
                                <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto md:max-w-[240px]">
                                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold ml-1">Sort</span>
                                    <select 
                                        value={sortOrder} 
                                        onChange={(e) => { setSortOrder(e.target.value as SortOrder); setCurrentPage(1); }}
                                        className="bg-[var(--color-midnight)] border border-white/10 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full"
                                    >
                                        <option value="default">Default</option>
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="popular">Most Popular</option>
                                    </select>
                                </div>

                                {/* Search & Sync Container */}
                                <div className="flex flex-1 items-end gap-3 min-w-[280px] w-full lg:w-auto">
                                    <div className="relative flex-1 min-w-0">
                                        <span className="block text-[10px] text-neutral-500 uppercase tracking-widest font-bold ml-1 mb-1.5">Search</span>
                                        <div className="relative">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-4.5 h-4.5" />
                                            <input 
                                                type="text" 
                                                placeholder="Search registry..."
                                                className="w-full bg-[var(--color-midnight)] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-gold)]/50 outline-none transition-all"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {user?.role === 'admin' && (
                                        <button
                                            onClick={handleSync}
                                            disabled={syncing}
                                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-xl text-sm font-bold text-[var(--color-gold)] hover:bg-[var(--color-gold)]/20 transition-all disabled:opacity-50 whitespace-nowrap h-[42px] shrink-0"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                            {syncing ? 'Syncing...' : 'Sync Latest'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-2 border-[var(--color-gold)]/20 border-t-[var(--color-gold)] rounded-full animate-spin mb-4"></div>
                            <p className="text-[var(--color-text-secondary)]">Accessing registry records...</p>
                        </div>
                    ) : error ? (
                        <div className="py-24 text-center">
                            <p className="text-red-400 mb-4">{error}</p>
                            <button 
                                onClick={() => fetchVideos()}
                                className="px-6 py-2 bg-[var(--color-gold)] text-[var(--color-midnight)] rounded font-bold"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredReleases.length === 0 ? (
                        <div className="py-24 text-center">
                            <Music className="w-16 h-16 text-[var(--color-border)] mx-auto mb-4" />
                            <p className="text-[var(--color-text-secondary)] text-xl">No releases found matching your criteria.</p>
                            <button 
                                onClick={() => {
                                    setFilterType('all');
                                    setFilterFormat('all');
                                    setDurationFilter('all');
                                    setYearFilter('all');
                                    setSearchQuery('');
                                    setSortOrder('default');
                                    setCurrentPage(1);
                                }}
                                className="mt-4 text-[var(--color-gold)] hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {paginatedReleases.map((release) => {
                                    const thumbCandidates = buildYouTubeThumbnailCandidates(release.id, [release.thumbnailUrl]);
                                    return (
                                        <Link 
                                            key={release.id + release.slug} 
                                            href={`/release-detail/${release.slug || release.id}`}
                                            className="group flex flex-col bg-[#101a33] border border-white/5 rounded-2xl overflow-hidden hover:border-[var(--color-gold)]/40 transition-all duration-300 shadow-xl min-h-[420px]"
                                        >
                                            <div className="relative aspect-video overflow-hidden bg-black">
                                                <img 
                                                    src={thumbCandidates[0]} 
                                                    alt={release.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => advanceThumbnailFallback(e.currentTarget, thumbCandidates)}
                                                />
                                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-full bg-[var(--color-gold)]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
                                                        <Play className="w-6 h-6 text-[#101a33] ml-0.5" fill="currentColor" />
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm">
                                                    {release.durationFormatted}
                                                </div>
                                                {release.format === 'live' && (
                                                    <div className="absolute top-2 left-2 bg-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                                        Live
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="p-5 flex flex-col flex-1 gap-4">
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-gold)]/80">
                                                        {release.govType === 'native_governed' ? 'Governed' : 'Registry'}
                                                    </span>
                                                    <span className="text-[10px] text-white/20">•</span>
                                                    <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                                                        {release.format}
                                                    </span>
                                                </div>
                                                
                                                <h3 className="text-lg font-semibold text-white/90 group-hover:text-[var(--color-gold)] transition-colors line-clamp-3 leading-snug min-h-[5.4rem]">
                                                    {release.title}
                                                </h3>
                                                
                                                <div className="mt-auto flex items-center justify-between pt-1 text-xs text-zinc-400 font-medium shrink-0">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-4 h-4 opacity-50" />
                                                            <span>{new Date(release.publishedDate).getFullYear()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Eye className="w-4 h-4 opacity-50" />
                                                            <span>{release.views.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    {release.source === 'youtube' && (
                                                        <Youtube className="w-4 h-4 text-red-500/50" />
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-16 flex items-center justify-center gap-4">
                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                                                    currentPage === page 
                                                        ? 'bg-[var(--color-gold)] text-[var(--color-midnight)]' 
                                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-gold)]'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="w-10 h-10 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </PageContainer>
            </Section>
        </Layout>
    );
}
