"use client";
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Music, Filter, Search, Play, Calendar, Eye, Youtube } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';
import GlobalReachStrip from '@/app/components/releases/GlobalReachStrip';

type FilterType = 'all' | 'native_governed' | 'legacy_registry';
type FormatFilter = 'all' | 'video' | 'audio' | 'short' | 'live' | 'playlist';
type DurationFilter = 'all' | 'short' | 'standard' | 'long';
type SortOrder = 'all' | 'new' | 'old' | 'popular';

const ITEMS_PER_PAGE = 12;
const REGISTRY_FETCH_LIMIT = 500;

interface YouTubeRelease {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    publishedDate: string;
    durationSeconds: number;
    durationFormatted: string;
    views: number;
    source: string;
    format: 'video' | 'audio' | 'short' | 'live' | 'playlist';
    govType: string;
}

export default function Releases() {
    const [releases, setReleases] = useState<YouTubeRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterFormat, setFilterFormat] = useState<FormatFilter>('all');
    const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchVideos = async (showLoader: boolean = false, mode: SortOrder = sortOrder) => {
        if (showLoader) {
            setLoading(true);
        }

        try {
            // 1. Fetch from CMS API (Robust Fetch with absolute URL fallback and retry)
            let cmsVideos: YouTubeRelease[] = [];
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            const endpoints = [
                '/api/releases?status=published',
                `${baseUrl}/api/releases?status=published`
            ];

            let lastFetchError = null;
            for (const url of endpoints) {
                try {
                    const cmsRes = await fetch(url, { cache: 'no-store' });
                    if (cmsRes.ok) {
                        const cmsData = await cmsRes.json();
                        cmsVideos = cmsData.map((r: any) => ({
                            id: r.youtubeId || r.id,
                            title: r.title,
                            description: r.description,
                            thumbnailUrl: r.thumbnailUrl,
                            publishedDate: r.releaseDate,
                            durationSeconds: r.durationSeconds,
                            durationFormatted: r.durationFormatted,
                            views: r.viewCount || 0,
                            source: 'native',
                            format: r.format || (Number(r.durationSeconds) <= 60 ? 'short' : 'video'),
                            govType: r.releaseType || '',
                        }));
                        break; // Success!
                    }
                } catch (e) {
                    lastFetchError = e;
                    console.warn(`Registry fetch failed for ${url}, trying next...`, e);
                }
            }

            // If everything failed, try one more time after a short delay
            if (cmsVideos.length === 0 && lastFetchError) {
                await new Promise(r => setTimeout(r, 1000));
                try {
                    const retryRes = await fetch('/api/releases?status=published', { cache: 'no-store' });
                    if (retryRes.ok) {
                        const cmsData = await retryRes.json();
                        cmsVideos = cmsData.map((r: any) => ({
                            id: r.youtubeId || r.id,
                            title: r.title,
                            description: r.description,
                            thumbnailUrl: r.thumbnailUrl,
                            publishedDate: r.releaseDate,
                            durationSeconds: r.durationSeconds,
                            durationFormatted: r.durationFormatted,
                            views: r.viewCount || 0,
                            source: 'native',
                            format: r.format || (Number(r.durationSeconds) <= 60 ? 'short' : 'video'),
                            govType: r.releaseType || '',
                        }));
                    }
                } catch (e) {
                    console.error("Final registry retry failed", e);
                }
            }

            // 2. Fetch from YouTube Service (Live API or Static Fallback)
            let youtubeVideos: YouTubeRelease[] = [];
            try {
                const { youtubeService } = await import('../../../lib/youtube-service');
                const raw = mode === 'popular'
                    ? await youtubeService.getPopularVideos(REGISTRY_FETCH_LIMIT)
                    : await youtubeService.getLatestVideos(REGISTRY_FETCH_LIMIT);
                youtubeVideos = (raw as any[]).map((v) => ({
                    ...v,
                    format: v.format || (Number(v.durationSeconds) <= 60 ? 'short' : 'video'),
                    govType: v.releaseType || v.govType || '',
                }));
            } catch (ytErr) {
                console.warn("YouTube Service fetch failed, using CMS data only", ytErr);
            }

            // 3. Merge: prefer CMS data for overlapping IDs, but include unique YouTube videos
            const cmsIds = new Set(cmsVideos.map(v => v.id));
            const uniqueYoutubeVideos = youtubeVideos.filter(v => !cmsIds.has(v.id));
            
            const combined = [...cmsVideos, ...uniqueYoutubeVideos];
            
            if (combined.length === 0 && !lastFetchError) {
                // If we got nothing at all and no error, maybe the CMS is empty?
                // But the user expects at least the 14 static ones.
                const { STATIC_YOUTUBE_VIDEOS } = await import('../../../app/data/youtube-videos');
                setReleases((STATIC_YOUTUBE_VIDEOS as any[]).map((v) => ({
                    ...v,
                    format: v.format || (Number(v.durationSeconds) <= 60 ? 'short' : 'video'),
                    govType: v.releaseType || v.govType || '',
                })));
            } else {
                setReleases(combined);
            }
            
            setError(null);
            setLastSync(new Date().toISOString());
        } catch (err: any) {
            console.error("Critical error fetching videos:", err);
            setError(err.message || "Failed to load videos");
            
            // Last resort: show static data if everything crashed
            try {
                const { STATIC_YOUTUBE_VIDEOS } = await import('../../../app/data/youtube-videos');
                setReleases((STATIC_YOUTUBE_VIDEOS as any[]).map((v) => ({
                    ...v,
                    format: v.format || (Number(v.durationSeconds) <= 60 ? 'short' : 'video'),
                    govType: v.releaseType || v.govType || '',
                })));
            } catch (e) {}
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos(true, sortOrder);

        // Keep releases automatically refreshed without manual intervention.
        const refreshTimer = setInterval(() => {
            fetchVideos(false, sortOrder);
        }, 15 * 60 * 1000);

        return () => clearInterval(refreshTimer);
    }, []);

    // Re-fetch with the right API order when switching to/from "popular"
    const prevSortRef = useRef<SortOrder>('all');
    const prev = prevSortRef.current;
    useEffect(() => {
        const changed = (sortOrder === 'popular') !== (prev === 'popular');
        prevSortRef.current = sortOrder;
        if (changed) {
            fetchVideos(true, sortOrder);
        }
    }, [sortOrder]);

    const years = useMemo(() => {
        const uniqueYears = new Set(
            releases.map(r => new Date(r.publishedDate).getFullYear())
        );
        return Array.from(uniqueYears).sort((a, b) => b - a);
    }, [releases]);

    const FORMAT_LABELS: Record<string, string> = {
        video: 'Videos',
        audio: 'Audios',
        short: 'Shorts',
        live: 'Live',
        playlist: 'Playlists',
    };
    const FORMAT_ORDER = ['video', 'audio', 'short', 'live', 'playlist'];

    const availableFormats = useMemo(() => {
        const present = new Set(releases.map(r => r.format));
        return FORMAT_ORDER.filter(f => present.has(f as any));
    }, [releases]);

    // If the active format filter is no longer present in loaded data, reset it
    useEffect(() => {
        if (filterFormat !== 'all' && !availableFormats.includes(filterFormat)) {
            setFilterFormat('all');
        }
    }, [availableFormats]);

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
                return release.title.toLowerCase().includes(query) ||
                    release.description.toLowerCase().includes(query);
            }

            return true;
        });

        if (sortOrder === 'new') {
            filtered.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
        } else if (sortOrder === 'old') {
            filtered.sort((a, b) => new Date(a.publishedDate).getTime() - new Date(b.publishedDate).getTime());
        } else if (sortOrder === 'popular') {
            filtered.sort((a, b) => b.views - a.views);
        }

        return filtered;
    }, [releases, filterType, filterFormat, durationFilter, yearFilter, searchQuery, sortOrder]);

    const totalPages = Math.ceil(filteredReleases.length / ITEMS_PER_PAGE);
    const paginatedReleases = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredReleases.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredReleases, currentPage]);

    const formatViewsDisplay = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return (
        <Layout>
            <Section className="pt-16 pb-6">
                <PageContainer>
                    <div className="max-w-5xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 leading-tight">
                            SufiTube
                        </h1>
                        <p className="text-2xl md:text-3xl text-amber-400/90 mb-3 font-light">
                            Official Visual Release Registry
                        </p>
                        <p className="text-lg text-neutral-300 leading-relaxed">
                            Experience the soulful renditions, studio sessions, and official visual releases from SufiPulse.
                        </p>
                    </div>
                </PageContainer>
            </Section>

            <PageContainer>
                <div className="max-w-7xl mx-auto">

                    {/* ── Global Reach Analytics Strip ── */}
                    <GlobalReachStrip />

                    <div className="mb-8 space-y-6">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-neutral-500" />
                            <span className="text-xs text-neutral-500 uppercase tracking-wider">Filters</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
                            <div>
                                <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Type</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => {
                                        setFilterType(e.target.value as FilterType);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700"
                                >
                                    <option value="all">All</option>
                                    <option value="native_governed">Native Governed</option>
                                    <option value="legacy_registry">Legacy Registry</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Format</label>
                                <select
                                    value={filterFormat}
                                    onChange={(e) => {
                                        setFilterFormat(e.target.value as FormatFilter);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700"
                                >
                                    <option value="all">All</option>
                                    {availableFormats.map(f => (
                                        <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Duration</label>
                                <select
                                    value={durationFilter}
                                    onChange={(e) => {
                                        setDurationFilter(e.target.value as DurationFilter);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700"
                                >
                                    <option value="all">All</option>
                                    <option value="short">Short (&lt; 3 min)</option>
                                    <option value="standard">Standard (3-8 min)</option>
                                    <option value="long">Long (&gt; 8 min)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Year</label>
                                <select
                                    value={yearFilter}
                                    onChange={(e) => {
                                        setYearFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700"
                                >
                                    <option value="all">All Years</option>
                                    {years.map(year => (
                                        <option key={year} value={year.toString()}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Sort</label>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => {
                                        setSortOrder(e.target.value as SortOrder);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-2 text-sm focus:outline-none focus:border-neutral-700"
                                >
                                    <option value="all">All</option>
                                    <option value="new">Newest</option>
                                    <option value="old">Oldest</option>
                                    <option value="popular">Most Popular</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 lg:col-span-2">
                                <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="Search releases..."
                                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neutral-700 placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 lg:col-span-1 flex items-end" style={{alignSelf:'end'}}>
                                <button
                                    onClick={() => fetchVideos(true)}
                                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 px-3 py-2 text-sm focus:outline-none hover:border-amber-400/50 hover:text-amber-300 transition-colors"
                                >
                                    Sync Latest Videos
                                </button>
                            </div>
                        </div>

                        {!loading && !error && filteredReleases.length > 0 && (
                            <div className="flex items-center justify-between text-xs text-neutral-500">
                                <span>
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredReleases.length)} of {filteredReleases.length} videos
                                </span>
                                <div className="flex items-center gap-4">
                                    {lastSync && <span>Synced: {new Date(lastSync).toLocaleString()}</span>}
                                    {totalPages > 1 && (
                                        <span>Page {currentPage} of {totalPages}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center min-h-96">
                            <div className="text-neutral-500 flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                                Loading SufiTube Archive...
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center min-h-96">
                            <div className="text-red-400 bg-red-400/10 px-6 py-4 rounded shadow-sm border border-red-400/20">
                                {error}
                            </div>
                        </div>
                    )}

                    {!loading && !error && releases.length === 0 && (
                        <div className="flex items-center justify-center min-h-96 border border-neutral-800 rounded bg-neutral-900/30">
                            <div className="text-center">
                                <Youtube className="w-16 h-16 text-neutral-700 mx-auto mb-4" strokeWidth={1} />
                                <div className="text-neutral-500">No videos found on the channel.</div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && filteredReleases.length === 0 && releases.length > 0 && (
                        <div className="flex items-center justify-center min-h-96 border border-neutral-800 rounded bg-neutral-900/30">
                            <div className="text-center">
                                <Search className="w-16 h-16 text-neutral-700 mx-auto mb-4" strokeWidth={1} />
                                <div className="text-neutral-500">No videos match your filters</div>
                                <button
                                    onClick={() => {
                                        setFilterType('all');
                                        setFilterFormat('all');
                                        setDurationFilter('all');
                                        setYearFilter('all');
                                        setSortOrder('all');
                                        setSearchQuery('');
                                    }}
                                    className="mt-4 text-amber-400 hover:text-amber-300 text-sm underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                    )}

                    {!loading && !error && paginatedReleases.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                                {paginatedReleases.map((video) => {
                                    const thumbnailCandidates = buildYouTubeThumbnailCandidates(video.id, [video.thumbnailUrl]);

                                    return (
                                        <Link
                                            key={video.id}
                                            href={`/release-detail/${video.id}`}
                                            className="group block bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl p-4 hover:border-amber-400/40 hover:bg-neutral-900/60 transition-all hover:shadow-xl hover:shadow-amber-400/10"
                                        >
                                        <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                                            <img
                                                src={thumbnailCandidates[0]}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                data-thumb-index="0"
                                                onError={(e) => {
                                                    advanceThumbnailFallback(e.currentTarget, thumbnailCandidates);
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl shadow-red-900/50">
                                                    <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
                                                </div>
                                            </div>

                                        </div>

                                        <h3 className="text-sm! font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                                            {video.title}
                                        </h3>

                                        <div className="flex items-center justify-between text-xs text-neutral-400 mt-4 pt-4 border-t border-neutral-800/60">
                                            <div className="flex items-center gap-1.5 font-medium tracking-wide">
                                                <Calendar className="w-3.5 h-3.5 opacity-70" />
                                                {new Date(video.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className='flex gap-2'>
                                                <div className="px-2 py-1 rounded text-xs font-medium text-white tracking-wide border border-white/10">
                                                    {video.durationFormatted}
                                                </div>
                                                <div className="flex items-center gap-1.5 font-medium tracking-wide">
                                                    <Eye className="w-3.5 h-3.5 opacity-70" />
                                                    {formatViewsDisplay(video.views)} views
                                                </div>
                                            </div>
                                        </div>
                                        </Link>
                                    );
                                })}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12 mb-8">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 text-sm border border-neutral-800 rounded bg-neutral-900/50 text-neutral-400 hover:border-amber-400/50 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-800 disabled:hover:text-neutral-400 transition-colors"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                            if (
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1)
                                            ) {
                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-10 h-10 rounded text-sm border transition-colors ${currentPage === page
                                                            ? 'border-amber-400 bg-amber-400/10 text-amber-400 font-bold'
                                                            : 'border-neutral-800 bg-neutral-900/50 text-neutral-500 hover:border-amber-400/50 hover:text-amber-400'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            } else if (
                                                page === currentPage - 2 ||
                                                page === currentPage + 2
                                            ) {
                                                return (
                                                    <span key={page} className="text-neutral-600 px-2">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 text-sm border border-neutral-800 rounded bg-neutral-900/50 text-neutral-400 hover:border-amber-400/50 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-neutral-800 disabled:hover:text-neutral-400 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </PageContainer>
        </Layout>
    );
}
