"use client";
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Music, ListFilter as Filter, Search, Play, Calendar, Eye, Youtube } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase-client';

type FilterType = 'all' | 'native' | 'legacy';
type DurationFilter = 'all' | 'short' | 'standard' | 'long';
type SortOrder = 'new' | 'old' | 'popular';

const ITEMS_PER_PAGE = 12;

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
}

export default function Releases() {
    const [releases, setReleases] = useState<YouTubeRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<FilterType>('all');
    const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('new');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                // First, try to fetch from database
                const { data: dbReleases, error: dbError } = await supabase
                    .from('releases')
                    .select('*')
                    .eq('is_published', true)
                    .order('release_date', { ascending: false });

                if (!dbError && dbReleases && dbReleases.length > 0) {
                    // Format database releases
                    const formatted = dbReleases.map((release: any) => {
                        const totalSeconds = release.duration_seconds || 0;
                        let h = Math.floor(totalSeconds / 3600);
                        let m = Math.floor((totalSeconds % 3600) / 60);
                        let s = totalSeconds % 60;

                        let durationFormatted = '';
                        if (h > 0) {
                            durationFormatted = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                        } else {
                            durationFormatted = `${m}:${s.toString().padStart(2, '0')}`;
                        }

                        return {
                            id: release.youtube_video_id || release.id,
                            title: release.release_title,
                            description: release.description || '',
                            thumbnailUrl: release.thumbnail_url || '',
                            publishedDate: release.release_date,
                            durationSeconds: totalSeconds,
                            durationFormatted,
                            views: release.views || 0,
                            source: release.source || 'youtube_legacy'
                        };
                    });

                    console.log(`Fetched ${formatted.length} videos from database`);
                    setReleases(formatted);
                    setLoading(false);
                    return;
                }

                // Fallback to YouTube API if database is empty
                console.log('Database empty, fetching from YouTube API...');
                const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyCw34bUCxl_8S5R8I-380YyFOLDqpWL-R4";
                const CHANNEL_ID = 'UCraDr3i5A3k0j7typ6tOOsQ';

                let allVideoIds: string[] = [];
                let nextPageToken = '';

                do {
                    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&order=date&type=video&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
                    const searchRes = await fetch(searchUrl);
                    const searchData = await searchRes.json();

                    if (searchData.items && searchData.items.length > 0) {
                        const videoIds = searchData.items.map((item: any) => item.id.videoId);
                        allVideoIds = [...allVideoIds, ...videoIds];
                    }

                    nextPageToken = searchData.nextPageToken || '';
                } while (nextPageToken);

                if (allVideoIds.length === 0) {
                    setReleases([]);
                    setLoading(false);
                    return;
                }

                const allVideos: any[] = [];
                for (let i = 0; i < allVideoIds.length; i += 50) {
                    const batchIds = allVideoIds.slice(i, i + 50).join(',');
                    const videosRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${batchIds}&key=${YOUTUBE_API_KEY}`
                    );
                    const videosData = await videosRes.json();

                    if (videosData.items) {
                        allVideos.push(...videosData.items);
                    }
                }

                const formatted = allVideos.map((video: any) => {
                    const match = video.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                    let h = 0, m = 0, s = 0;
                    if (match) {
                        h = parseInt(match[1]) || 0;
                        m = parseInt(match[2]) || 0;
                        s = parseInt(match[3]) || 0;
                    }
                    const totalSeconds = h * 3600 + m * 60 + s;

                    let durationFormatted = '';
                    if (h > 0) {
                        durationFormatted = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    } else {
                        durationFormatted = `${m}:${s.toString().padStart(2, '0')}`;
                    }

                    return {
                        id: video.id,
                        title: video.snippet.title,
                        description: video.snippet.description,
                        thumbnailUrl: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
                        publishedDate: video.snippet.publishedAt,
                        durationSeconds: totalSeconds,
                        durationFormatted,
                        views: parseInt(video.statistics.viewCount || '0'),
                        source: 'youtube_legacy'
                    };
                });

                console.log(`Fetched ${formatted.length} videos from YouTube`);
                setReleases(formatted);
            } catch (err: any) {
                console.error("Error fetching videos:", err);
                setError(err.message || "Failed to load videos");
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    const years = useMemo(() => {
        const uniqueYears = new Set(
            releases.map(r => new Date(r.publishedDate).getFullYear())
        );
        return Array.from(uniqueYears).sort((a, b) => b - a);
    }, [releases]);

    const filteredReleases = useMemo(() => {
        let filtered = releases.filter(release => {
            if (filterType === 'native' && release.source !== 'native') return false;
            if (filterType === 'legacy' && release.source !== 'youtube_legacy') return false;

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
    }, [releases, filterType, durationFilter, yearFilter, searchQuery, sortOrder]);

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
            <Section className="pt-24 pb-12">
                <PageContainer>
                    <div className="max-w-5xl mx-auto text-center">
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                            SufiTube
                        </h1>
                        <p className="text-2xl md:text-3xl text-amber-400/90 mb-8 font-light">
                            Official Visual Release Registry
                        </p>

                        <div className="max-w-3xl mx-auto">
                            <p className="text-lg text-neutral-300 leading-relaxed">
                                Experience the soulful renditions, studio sessions, and official visual releases from SufiPulse. All productions are subject to quality assurance and creative oversight.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <PageContainer>
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 space-y-6">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-neutral-500" />
                            <span className="text-xs text-neutral-500 uppercase tracking-wider">Filters</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                                    <option value="native">Native Governed</option>
                                    <option value="legacy">Legacy Registry</option>
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
                                    <option value="new">Newest</option>
                                    <option value="old">Oldest</option>
                                    <option value="popular">Most Popular</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wider">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
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
                        </div>

                        {!loading && !error && filteredReleases.length > 0 && (
                            <div className="flex items-center justify-between text-xs text-neutral-500">
                                <span>
                                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredReleases.length)} of {filteredReleases.length} videos
                                </span>
                                {totalPages > 1 && (
                                    <span>Page {currentPage} of {totalPages}</span>
                                )}
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
                                        setDurationFilter('all');
                                        setYearFilter('all');
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
                                {paginatedReleases.map((video) => (
                                    <Link
                                        key={video.id}
                                        href={`/release-detail/${video.id}`}
                                        className="group block bg-gradient-to-b from-neutral-900/40 to-neutral-900/10 border border-neutral-800 rounded-xl p-4 hover:border-amber-400/40 hover:bg-neutral-900/60 transition-all hover:shadow-xl hover:shadow-amber-400/10"
                                    >
                                        <div className="relative aspect-video w-full mb-4 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                                            <img
                                                src={video.thumbnailUrl}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                                ))}
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
