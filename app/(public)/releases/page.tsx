"use client";
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { PrimaryButton } from '../../components/primitives/PrimaryButton';
import { 
    Music, Filter, Search, Play, Calendar, Eye, Youtube, Clock, ChevronLeft, 
    ChevronRight, RefreshCw, X, CheckCircle, AlertTriangle, Info, ExternalLink,
    Sparkles, Shield, Radio, ArrowRight, Mic, Feather, Disc3, Layers
} from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';
import GlobalReachStrip from '@/app/components/releases/GlobalReachStrip';
import { getBestReleaseDate, sortReleases, cleanDisplayTitle, getCanonicalTitle, getYoutubeTitle } from '@/lib/release-utils';
import { canAccessAdmin } from '@/app/lib/role-access';
import { StudioGovernancePanel } from '../../components/studio/StudioLayoutComponents';

type FilterType = 'all' | 'native_governed' | 'legacy_registry';
type FormatFilter = 'all' | 'video' | 'audio' | 'short' | 'live' | 'playlist';
type DurationFilter = 'default' | 'all' | 'short' | 'standard' | 'long';
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
    // Expanded fields for search and creative chain
    vocalist: string;
    writer: string;
    tags: string;
    youtubeId: string;
    rawTitle?: string;
    youtubeTitle?: string;
}

interface SyncResult {
    message?: string;
    newCount: number;
    updatedCount: number;
    skippedCount: number;
    errorCount: number;
    checkedCount: number;
    registryCount?: number;
    isFallback?: boolean;
    diagnostic?: {
        youtubeId: string;
        title: string;
        publishedAt: string;
        candidateForImport: boolean;
        importAction: string;
        importReason: string;
        existsInDb: boolean;
        publicVisibleAfterSync: boolean;
        reasonHiddenAfterSync: string;
        dbRecordId?: string;
        dbErrorMessage?: string;
        format?: string;
        durationSeconds?: number;
        visibleUnderCurrentFilters?: boolean;
        activeFilters?: string[];
    };
    details?: {
        lookbackDays: number;
        serverInfo?: {
            dataFile: string;
        };
    };
}

function SyncResultModal({ 
    open, 
    onClose, 
    result, 
    error,
    onRefresh,
    onClearFilters
}: { 
    open: boolean; 
    onClose: () => void; 
    result: SyncResult | null; 
    error: string | null;
    onRefresh: () => void;
    onClearFilters?: () => void;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-[var(--color-midnight)]/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            <div className="relative w-full max-w-2xl bg-[var(--color-slate)] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[var(--color-midnight)]/20">
                    <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-8 rounded-full ${error ? 'bg-red-500' : 'bg-[var(--color-gold)]'}`} />
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                {error ? 'Sync Failed' : 'Sync Registry Complete'}
                            </h2>
                            {!error && (
                                <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-widest font-medium mt-0.5">
                                    Official YouTube channel synchronized
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-[var(--color-text-tertiary)] hover:text-white transition-colors rounded-full hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {error ? (
                        <div className="flex flex-col items-center py-8 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
                            <p className="text-[var(--color-text-secondary)] max-w-sm mb-6">
                                {error}
                            </p>
                            <button 
                                onClick={onRefresh}
                                className="px-8 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                        </div>
                    ) : result ? (
                        <div className="space-y-8">
                            {/* Summary Chips */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Checked', value: result.checkedCount, color: 'text-blue-400' },
                                    { label: 'New', value: result.newCount, color: 'text-emerald-400' },
                                    { label: 'Updated', value: result.updatedCount, color: 'text-amber-400' },
                                    { label: 'Skipped', value: result.skippedCount, color: 'text-[var(--color-text-tertiary)]' }
                                ].map(chip => (
                                    <div key={chip.label} className="p-3 bg-[var(--color-midnight)]/40 border border-white/5 rounded-2xl text-center">
                                        <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-tighter font-bold mb-1">{chip.label}</p>
                                        <p className={`text-xl font-black ${chip.color}`}>{chip.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Lookback Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-3">
                                    <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-blue-400 uppercase font-black mb-1">Sync window</p>
                                        <p className="text-xs text-blue-100/70 leading-relaxed">
                                            Registry updated from last <strong>{result.details?.lookbackDays || 90} days</strong>.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-emerald-400 uppercase font-black mb-1">Registry Parity</p>
                                        <p className="text-xs text-emerald-100/70 leading-relaxed">
                                            Total stored releases: <strong>{result.registryCount || 'Calculating...'}</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Storage Proof (Admin only) */}
                            {result.details?.serverInfo && (
                                <div className="p-4 bg-[var(--color-midnight)]/60 border border-white/5 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ExternalLink className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                                        <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-black">Storage Proof (Absolute Path)</p>
                                    </div>
                                    <code className="text-[9px] text-zinc-500 break-all font-mono">
                                        {result.details.serverInfo.dataFile}
                                    </code>
                                </div>
                            )}

                            {/* Latest Upload Card */}
                            {result.diagnostic && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-[var(--color-gold)] uppercase tracking-[0.2em] ml-1">
                                        Latest YouTube Upload
                                    </h3>
                                    
                                    <div className="bg-[var(--color-midnight)]/60 border border-white/5 rounded-2xl p-6 space-y-6">
                                        <div className="flex flex-col gap-2">
                                            <h4 className="text-lg font-bold text-white leading-tight">
                                                {result.diagnostic.title}
                                            </h4>
                                            <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">
                                                <span>Published {new Date(result.diagnostic.publishedAt).toLocaleDateString()}</span>
                                                <span className="text-white/10">•</span>
                                                <span className="flex items-center gap-1">
                                                    ID: {result.diagnostic.youtubeId}
                                                    <a href={`https://youtube.com/watch?v=${result.diagnostic.youtubeId}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-gold)] transition-colors">
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Import Status</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                                        result.diagnostic.importAction === 'created' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        result.diagnostic.importAction === 'updated' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                                    }`}>
                                                        {result.diagnostic.importAction}
                                                    </span>
                                                    <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                                                        Candidate: {result.diagnostic.candidateForImport ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">Registry Status</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { label: 'In Registry', active: result.diagnostic.existsInDb },
                                                        { label: 'Public Visible', active: result.diagnostic.publicVisibleAfterSync },
                                                        { label: 'UI Filter Pass', active: result.diagnostic.visibleUnderCurrentFilters }
                                                    ].map(status => (
                                                        <div key={status.label} className="flex items-center gap-1 text-[10px] font-bold">
                                                            {status.active ? (
                                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                            ) : (
                                                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                                            )}
                                                            <span className={status.active ? 'text-emerald-500/80' : 'text-red-500/80'}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Final Visibility Context */}
                                        <div className={`p-4 rounded-xl border ${
                                            result.diagnostic.publicVisibleAfterSync && result.diagnostic.visibleUnderCurrentFilters
                                                ? 'bg-emerald-500/5 border-emerald-500/10'
                                                : 'bg-amber-500/5 border-amber-500/10'
                                        }`}>
                                            <p className="text-xs font-medium leading-relaxed">
                                                {result.diagnostic.publicVisibleAfterSync && result.diagnostic.visibleUnderCurrentFilters ? (
                                                    <span className="text-emerald-200/70">✓ Latest upload is imported and visible on this page.</span>
                                                ) : !result.diagnostic.publicVisibleAfterSync ? (
                                                    <span className="text-amber-200/70">⚠ Imported successfully, but restricted. Reason: {result.diagnostic.reasonHiddenAfterSync}.</span>
                                                ) : (
                                                    <span className="text-amber-200/70">⚠ Imported successfully, but hidden by active UI filters: {result.diagnostic.activeFilters?.length ? result.diagnostic.activeFilters.join(', ') : 'None'}.</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/5 bg-[var(--color-midnight)]/20 flex flex-wrap items-center justify-end gap-3">
                    {result?.diagnostic?.visibleUnderCurrentFilters === false && onClearFilters && (
                        <button 
                            onClick={() => { onClearFilters(); onRefresh(); }}
                            className="px-6 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all"
                        >
                            Clear Filters
                        </button>
                    )}
                    {result?.diagnostic?.youtubeId && (
                        <Link 
                            href={`/release-detail/${result.diagnostic.youtubeId}`}
                            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all"
                            onClick={onClose}
                        >
                            View Release
                        </Link>
                    )}
                    <button 
                        onClick={onRefresh}
                        className="px-6 py-2.5 bg-[var(--color-gold)] text-[var(--color-midnight)] rounded-xl text-xs font-bold hover:bg-[var(--color-gold)]/90 transition-all"
                    >
                        Refresh List
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-[var(--color-midnight)] border border-white/10 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Releases() {
    const { user } = useAuth();
    const router = useRouter();
    const [releases, setReleases] = useState<YouTubeRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [knowledgeData, setKnowledgeData] = useState<any>(null);

    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
    const [syncError, setSyncError] = useState<string | null>(null);

    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterFormat, setFilterFormat] = useState<FormatFilter>('all');
    const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const formatSeconds = (totalSeconds: number): string => {
        if (!totalSeconds) return '0:00';
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const fetchVideos = async (silent = false, refresh = false) => {
        if (!silent) setLoading(true);
        try {
            const url = `/api/releases?status=published&t=${Date.now()}${refresh ? '&refresh=1' : ''}`;
            const cmsRes = await fetch(url, { cache: 'no-store' });
            if (!cmsRes.ok) throw new Error('Failed to fetch releases');
            const responseData = await cmsRes.json();
            
            const cmsData = Array.isArray(responseData) 
                ? responseData 
                : (responseData.items || []);
            
            const mappedData = cmsData.map((r: any) => {
                const source = r.source || 'native';
                const durationSecs = Number(r.durationSeconds || r.youtubeStats?.durationSeconds || 0);
                const durationFormatted = r.durationFormatted || r.duration || formatSeconds(durationSecs);
                const canonicalTitle = r.canonicalTitle || r.title || 'Untitled Release';
                const youtubeTitle = r.youtubeTitle || r.youtubeStats?.title || '';
                const govType = r.governanceOrigin || (r.source === 'native' ? 'native_governed' : (r.govType || 'native_governed'));
                return {
                    id: r.youtubeId || r.id,
                    slug: r.slug,
                    title: canonicalTitle,
                    canonicalTitle: canonicalTitle,
                    subtitle: r.subtitle || '',
                    rawTitle: canonicalTitle,
                    youtubeTitle: youtubeTitle,
                    description: r.description || '',
                    thumbnailUrl: r.canonicalThumbnail || r.thumbnail || r.thumbnailUrl || '',
                    publishedAt: r.publishedAt || r.releaseDate || r.createdAt,
                    publishedDate: r.publishedAt || r.releaseDate || r.createdAt,
                    durationSeconds: durationSecs,
                    durationFormatted: durationFormatted,
                    views: Number(r.views || r.viewCount || 0),
                    source: source,
                    format: r.format || 'video',
                    govType: govType,
                    vocalist: typeof r.vocalist === 'string' 
                        ? r.vocalist 
                        : [r.vocalist?.name, r.vocalist?.nameUrdu].filter(Boolean).join(' '),
                    writer: typeof r.writer === 'string'
                        ? r.writer
                        : [r.writer?.name, r.writer?.nameUrdu].filter(Boolean).join(' '),
                    tags: Array.isArray(r.tags) ? r.tags.join(' ') : (r.description?.match(/#\w+/g)?.join(' ') || ''),
                    youtubeId: r.youtubeId || '',
                    lastYoutubeSyncAt: r.lastYoutubeSyncAt
                };
            });

            setReleases(mappedData);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching releases:", err);
            setError(err.message || "Failed to load releases");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setSyncError(null);
        try {
            const res = await fetch('/api/releases/import-youtube', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoIds: [], lookbackDays: 1000 }) 
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Sync failed');
            
            await fetchVideos(false, true);
            
            if (data.diagnostic) {
                const d = data.diagnostic;
                const govType = 'legacy_registry';
                const activeFilters: string[] = [];
                let visibleUnderCurrentFilters = true;

                if (filterType !== 'all' && govType !== filterType) {
                    visibleUnderCurrentFilters = false;
                    activeFilters.push(`Governance: ${filterType}`);
                }
                if (filterFormat !== 'all' && d.format !== filterFormat) {
                    visibleUnderCurrentFilters = false;
                    activeFilters.push(`Format: ${filterFormat}`);
                }
                if (durationFilter !== 'all') {
                    const seconds = d.durationSeconds || 0;
                    let hiddenByDuration = false;
                    
                    if (durationFilter === 'default') {
                        if ((seconds > 0 && seconds < 180) || d.format === 'short') hiddenByDuration = true;
                    } else if (durationFilter === 'short' && seconds >= 180) {
                        hiddenByDuration = true;
                    } else if (durationFilter === 'standard' && (seconds < 180 || seconds > 480) && seconds !== 0) {
                        hiddenByDuration = true;
                    } else if (durationFilter === 'long' && seconds <= 480 && seconds !== 0) {
                        hiddenByDuration = true;
                    }
                    
                    if (hiddenByDuration) {
                        visibleUnderCurrentFilters = false;
                        activeFilters.push(`Length: ${
                            durationFilter === 'default' ? 'Default (Standard/Long only)' :
                            durationFilter === 'long' ? 'Long (> 8m)' : 
                            durationFilter === 'standard' ? 'Standard (3-8m)' : 
                            'Short (< 3m)'
                        }`);
                    }
                }
                if (yearFilter !== 'all') {
                    const pubYear = new Date(d.publishedAt).getFullYear();
                    if (pubYear !== parseInt(yearFilter)) {
                        visibleUnderCurrentFilters = false;
                        activeFilters.push(`Year: ${yearFilter}`);
                    }
                }
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const title = (d.title || '').toLowerCase();
                    if (!title.includes(query)) {
                        visibleUnderCurrentFilters = false;
                        activeFilters.push(`Search: "${searchQuery}"`);
                    }
                }

                d.visibleUnderCurrentFilters = visibleUnderCurrentFilters;
                d.activeFilters = activeFilters;
            }

            setSyncResult(data);
            setSyncModalOpen(true);
        } catch (err: any) {
            console.error("Sync error:", err);
            setSyncError(err.message);
            setSyncModalOpen(true);
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchVideos();
        fetch('/api/knowledge')
            .then(res => res.json())
            .then(data => setKnowledgeData(data))
            .catch(err => console.error('Failed to load knowledge data:', err));
    }, []);

    const filteredReleases = useMemo(() => {
        let filtered = releases.filter(release => {
            if (filterType !== 'all') {
                if (filterType === 'native_governed' && release.govType !== 'native_governed') return false;
                if (filterType === 'legacy_registry' && release.govType !== 'legacy_registry') return false;
            }

            if (filterFormat !== 'all' && release.format !== filterFormat) return false;

            if (durationFilter !== 'all') {
                const seconds = release.durationSeconds || 0;
                if (durationFilter === 'default') {
                    if (seconds < 180 || release.format === 'short') return false;
                } else if (durationFilter === 'short' && seconds >= 180) {
                    return false;
                } else if (durationFilter === 'standard' && (seconds < 180 || seconds > 480)) {
                    return false;
                } else if (durationFilter === 'long' && seconds <= 480) {
                    return false;
                }
            }

            if (yearFilter !== 'all') {
                const releaseYear = new Date(release.publishedDate).getFullYear();
                if (releaseYear !== parseInt(yearFilter)) return false;
            }

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    release.title.toLowerCase().includes(query) ||
                    (Boolean(release.rawTitle) && release.rawTitle!.toLowerCase().includes(query)) ||
                    (Boolean(release.youtubeTitle) && release.youtubeTitle!.toLowerCase().includes(query)) ||
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

        const internalSortMap: Record<string, string> = {
            default: 'all',
            newest: 'new',
            oldest: 'old',
            popular: 'popular'
        };

        return sortReleases(filtered as any, internalSortMap[sortOrder]) as unknown as YouTubeRelease[];
    }, [releases, filterType, filterFormat, durationFilter, yearFilter, searchQuery, sortOrder]);
    
    // Featured flagship release (first governed release or highest views)
    const featuredRelease = useMemo(() => {
        if (!releases || releases.length === 0) return null;
        return releases.find(r => r.govType === 'native_governed') || releases[0];
    }, [releases]);

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

    const cataloguePrinciples = [
        {
            icon: Shield,
            title: 'Governed Production',
            description: 'Produced under strict lyrical, musical, and spiritual protocol.'
        },
        {
            icon: Feather,
            title: 'Linguistic Precision',
            description: 'Preservation of authentic Kashmiri, Urdu, Punjabi, Persian, and Arabic Kalam.'
        },
        {
            icon: Disc3,
            title: 'Archival Permanence',
            description: 'Documented registry records with immutable authorship provenance.'
        },
        {
            icon: Radio,
            title: 'Global Broadcast',
            description: 'High-fidelity multi-platform distribution across world streaming endpoints.'
        }
    ];

    return (
        <Layout>
            {/* ── 01. Dedicated ReleaseArchiveHero with banner28.png ── */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner28.png"
                        alt="SufiPulse Master Release Room and Completed Audio Catalogue"
                        fill
                        priority
                        quality={95}
                        className="object-cover object-center scale-105 transform motion-safe:animate-fade-in"
                    />
                    {/* Layered brand gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10">
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse USA — Official Release Archive
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Master Releases & Catalogue<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Diwan-e-Saut (Sacred Audio Archive)
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-10 drop-shadow">
                                Sacred words transformed into sound, preserved through governed production, validated by institutional registry, and released to the global audience.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
                                <a 
                                    href="#browse-releases"
                                    className="px-8 py-3.5 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-bold rounded-[var(--radius-sm)] shadow-xl transition-all uppercase tracking-wider text-sm flex items-center gap-2"
                                >
                                    <Disc3 className="w-4 h-4" /> Explore Catalogue
                                </a>
                                <Link href="/official-channels">
                                    <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
                                        <Radio className="w-4 h-4 inline mr-2 text-[var(--color-gold)]" /> Official Channels & Radio
                                    </PrimaryButton>
                                </Link>
                            </div>

                            {/* Catalogue Pillars Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                {cataloguePrinciples.map((item, idx) => (
                                    <div key={idx} className="text-center p-2">
                                        <item.icon className="w-7 h-7 text-[var(--color-gold)] mx-auto mb-2 opacity-90" />
                                        <div className="text-sm md:text-base font-bold text-[var(--color-text-primary)] mb-1">
                                            {item.title}
                                        </div>
                                        <div className="text-[11px] text-[var(--color-text-tertiary)] leading-snug line-clamp-2">
                                            {item.description}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </PageContainer>
                </div>
            </section>

            {/* ── 02. Featured Release Spotlight ── */}
            {featuredRelease && (
                <section className="py-16 bg-gradient-to-b from-[var(--color-midnight)] to-[var(--color-slate)] border-b border-white/5">
                    <PageContainer>
                        <div className="max-w-6xl mx-auto">
                            <div className="flex items-center gap-2 mb-6">
                                <Sparkles className="w-4 h-4 text-[var(--color-gold)]" />
                                <span className="text-xs font-black text-[var(--color-gold)] uppercase tracking-[0.3em]">
                                    Flagship Spotlight
                                </span>
                            </div>

                            <div className="elite-card overflow-hidden bg-gradient-to-br from-amber-400/[0.04] to-transparent border-amber-400/20 p-6 md:p-10 shadow-2xl">
                                <div className="grid md:grid-cols-12 gap-8 items-center">
                                    {/* Left: Artwork / Video Thumbnail */}
                                    <div className="md:col-span-6 relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl group">
                                        {(() => {
                                            const thumbCandidates = buildYouTubeThumbnailCandidates(featuredRelease.youtubeId || featuredRelease.id, [featuredRelease.thumbnailUrl]);
                                            return (
                                                <img 
                                                    src={thumbCandidates[0]} 
                                                    alt={featuredRelease.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    onError={(e) => advanceThumbnailFallback(e.currentTarget, thumbCandidates)}
                                                />
                                            );
                                        })()}
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                            <Link 
                                                href={`/release-detail/${featuredRelease.slug || featuredRelease.youtubeId || featuredRelease.id}`}
                                                className="w-16 h-16 rounded-full bg-[var(--color-gold)] flex items-center justify-center text-[var(--color-midnight)] shadow-2xl hover:scale-110 transition-transform duration-300"
                                            >
                                                <Play className="w-8 h-8 ml-1" fill="currentColor" />
                                            </Link>
                                        </div>
                                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white">
                                            {featuredRelease.durationFormatted}
                                        </div>
                                        <div className="absolute top-3 left-3 bg-amber-400 text-black px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                            {featuredRelease.govType === 'native_governed' ? 'Governed Production' : 'Legacy Registry'}
                                        </div>
                                    </div>

                                    {/* Right: Metadata & Context */}
                                    <div className="md:col-span-6 space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">
                                                <span>{new Date(featuredRelease.publishedDate).getFullYear() || 2026}</span>
                                                <span>•</span>
                                                <span>{featuredRelease.format.toUpperCase()}</span>
                                                <span>•</span>
                                                <span>{(Number(featuredRelease.views) || 0).toLocaleString()} Views</span>
                                            </div>
                                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                                                {featuredRelease.title}
                                            </h2>
                                        </div>

                                        {/* Authorship Chain Line */}
                                        <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2">
                                            <p className="text-[9px] text-[var(--color-gold)] font-black uppercase tracking-[0.3em]">Authorship & Lineage</p>
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-[var(--color-text-tertiary)] block text-[10px] uppercase font-bold">Vocalist</span>
                                                    <span className="text-white font-medium">{featuredRelease.vocalist || 'SufiPulse Vocal Ensemble'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--color-text-tertiary)] block text-[10px] uppercase font-bold">Kalam / Lyrics</span>
                                                    <span className="text-white font-medium">{featuredRelease.writer || 'Traditional Sacred Kalam'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                                            {featuredRelease.description || 'Institutional release preserving classical devotional poetry through contemporary arrangements and sacred sonic architecture.'}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 pt-2">
                                            <Link 
                                                href={`/release-detail/${featuredRelease.slug || featuredRelease.youtubeId || featuredRelease.id}`}
                                                className="px-6 py-3 bg-[var(--color-gold)] hover:bg-[#FDE68A] text-[var(--color-midnight)] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2"
                                            >
                                                <Play className="w-4 h-4" fill="currentColor" /> Watch & Listen
                                            </Link>
                                            {featuredRelease.youtubeId && (
                                                <a 
                                                    href={`https://youtube.com/watch?v=${featuredRelease.youtubeId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-6 py-3 bg-white/[0.04] hover:bg-white/10 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                                                >
                                                    <Youtube className="w-4 h-4 text-red-500" /> YouTube
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PageContainer>
                </section>
            )}

            {/* ── 04. Browse the Archive (Search + Filters Toolbar) ── */}
            <div id="browse-releases">
                <Section background="midnight" spacing="normal">
                    <PageContainer>
                        <div className="mb-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                                <div>
                                    <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[10px] text-[var(--color-gold)] uppercase tracking-widest font-bold mb-3">
                                        Catalogue Control
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-3 tracking-tight">
                                        Browse the Archive
                                    </h2>
                                    <p className="text-[var(--text-base)] md:text-lg text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                                        Filter and discover recordings by spiritual lineage, vocal contributors, musical format, and production protocol.
                                    </p>
                                </div>
                            </div>

                            {/* Refined Premium Catalogue Toolbar */}
                            <div className="p-6 md:p-8 elite-card border-white/5 shadow-2xl">
                                <div className="flex flex-col gap-6">
                                    {/* Prominent Search Bar */}
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-gold)] w-5 h-5 opacity-80" />
                                            <input 
                                                type="text" 
                                                placeholder="Search by song title, poet/writer, vocalist, theme, or tags..."
                                                className="w-full bg-[var(--color-midnight)]/90 border border-white/10 rounded-2xl py-4 pl-14 pr-12 text-sm md:text-base text-[var(--color-text-primary)] focus:border-[var(--color-gold)]/60 outline-none transition-all placeholder:text-[var(--color-text-tertiary)] shadow-inner"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                            />
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
                                                >
                                                    <X size={18} />
                                                </button>
                                            )}
                                        </div>
                                        {user?.role === 'admin' && (
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={handleSync}
                                                    disabled={syncing}
                                                    className="flex items-center justify-center gap-2 px-6 py-4 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded-2xl text-xs font-black uppercase tracking-widest text-[var(--color-gold)] hover:bg-[var(--color-gold)]/20 transition-all disabled:opacity-50 whitespace-nowrap h-[56px]"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                                    {syncing ? 'Syncing...' : 'Sync YouTube'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Secondary Filter Dropdowns */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/5">
                                        {/* Governance */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Governance</label>
                                            <select 
                                                value={filterType} 
                                                onChange={(e) => { setFilterType(e.target.value as FilterType); setCurrentPage(1); }}
                                                className="bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)]"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="native_governed">Governed Release</option>
                                                <option value="legacy_registry">Legacy Registry</option>
                                            </select>
                                        </div>

                                        {/* Format */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Format</label>
                                            <select 
                                                value={filterFormat} 
                                                onChange={(e) => { setFilterFormat(e.target.value as FormatFilter); setCurrentPage(1); }}
                                                className="bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)]"
                                            >
                                                <option value="all">All Formats</option>
                                                <option value="video">Videos</option>
                                                <option value="audio">Audios</option>
                                                <option value="short">Shorts</option>
                                                <option value="live">Live</option>
                                            </select>
                                        </div>

                                        {/* Duration */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Duration</label>
                                            <select 
                                                value={durationFilter} 
                                                onChange={(e) => { setDurationFilter(e.target.value as DurationFilter); setCurrentPage(1); }}
                                                className="bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)]"
                                            >
                                                <option value="default">Default (Standard/Long)</option>
                                                <option value="all">Any Duration</option>
                                                <option value="short">Short (&lt; 3m)</option>
                                                <option value="standard">Standard (3-8m)</option>
                                                <option value="long">Long (&gt; 8m)</option>
                                            </select>
                                        </div>

                                        {/* Year */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Year</label>
                                            <select 
                                                value={yearFilter} 
                                                onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                                                className="bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)]"
                                            >
                                                <option value="all">All Years</option>
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>

                                        {/* Sort */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Order</label>
                                            <select 
                                                value={sortOrder} 
                                                onChange={(e) => { setSortOrder(e.target.value as SortOrder); setCurrentPage(1); }}
                                                className="bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)]"
                                            >
                                                <option value="default">Default</option>
                                                <option value="newest">Newest First</option>
                                                <option value="oldest">Oldest First</option>
                                                <option value="popular">Most Popular</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── 05. Release Catalogue Grid ── */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="flex flex-col bg-[#101a33]/40 border border-white/5 rounded-2xl overflow-hidden h-[420px] animate-pulse">
                                        <div className="aspect-video bg-[var(--color-midnight)]/50"></div>
                                        <div className="p-5 flex flex-col gap-4">
                                            <div className="h-3 w-24 bg-[var(--color-midnight)]/50 rounded"></div>
                                            <div className="h-6 w-full bg-[var(--color-midnight)]/50 rounded"></div>
                                            <div className="h-6 w-3/4 bg-[var(--color-midnight)]/50 rounded"></div>
                                            <div className="mt-auto h-4 w-full bg-[var(--color-midnight)]/50 rounded"></div>
                                        </div>
                                    </div>
                                ))}
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
                                <p className="text-[var(--color-text-secondary)] text-xl mb-4">No releases found matching your criteria.</p>
                                <button 
                                    onClick={() => {
                                        setFilterType('all');
                                        setFilterFormat('all');
                                        setDurationFilter('all');
                                        setYearFilter('all');
                                        setSearchQuery('');
                                        setSortOrder('newest');
                                        setCurrentPage(1);
                                    }}
                                    className="px-6 py-2.5 bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-amber-500 transition-all shadow-xl"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {paginatedReleases.map((release) => {
                                        const thumbCandidates = buildYouTubeThumbnailCandidates(release.youtubeId || release.id, [release.thumbnailUrl]);
                                        const releaseYear = release.publishedDate ? new Date(release.publishedDate).getFullYear() : 2026;
                                        return (
                                            <Link 
                                                key={release.id || release.slug || release.title} 
                                                href={`/release-detail/${release.slug || release.youtubeId || release.id}`}
                                                className="group flex flex-col bg-[#101a33] border border-white/5 rounded-2xl overflow-hidden hover:border-[var(--color-gold)]/40 transition-all duration-300 shadow-xl min-h-[440px]"
                                            >
                                                <div className="relative aspect-video overflow-hidden bg-black">
                                                    <img 
                                                        src={thumbCandidates[0]} 
                                                        alt={release.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        onError={(e) => advanceThumbnailFallback(e.currentTarget, thumbCandidates)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-[var(--color-gold)]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 shadow-xl">
                                                            <Play className="w-6 h-6 text-[#101a33] ml-0.5" fill="currentColor" />
                                                        </div>
                                                    </div>
                                                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white backdrop-blur-sm">
                                                        {release.durationFormatted}
                                                    </div>
                                                    {release.format === 'live' && (
                                                        <div className="absolute top-2 left-2 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                                                            Live
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="p-5 flex flex-col flex-1 gap-3">
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${
                                                            release.govType === 'native_governed' 
                                                                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                                                                : 'bg-white/5 text-zinc-400 border border-white/10'
                                                        }`}>
                                                            {release.govType === 'native_governed' ? 'Governed Release' : 'Legacy Registry'}
                                                        </span>
                                                        <span className="text-[10px] text-white/20">•</span>
                                                        <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                                                            {release.format}
                                                        </span>
                                                    </div>
                                                    
                                                    <h3 className="text-base font-bold text-white/95 group-hover:text-[var(--color-gold)] transition-colors line-clamp-2 leading-snug">
                                                        {release.title}
                                                    </h3>

                                                    {/* Authorship Chain line */}
                                                    {(release.vocalist || release.writer) && (
                                                        <div className="text-xs text-[var(--color-text-tertiary)] space-y-1 line-clamp-2 pt-1 border-t border-white/5">
                                                            {release.vocalist && (
                                                                <div className="flex items-center gap-1.5 truncate">
                                                                    <Mic className="w-3 h-3 text-[var(--color-gold)] shrink-0 opacity-75" />
                                                                    <span className="truncate text-white/80">{release.vocalist}</span>
                                                                </div>
                                                            )}
                                                            {release.writer && (
                                                                <div className="flex items-center gap-1.5 truncate">
                                                                    <Feather className="w-3 h-3 text-amber-300 shrink-0 opacity-75" />
                                                                    <span className="truncate text-zinc-400">{release.writer}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-400 font-medium shrink-0 border-t border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-3.5 h-3.5 opacity-50" />
                                                                <span>{!isNaN(releaseYear) ? releaseYear : 2026}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Eye className="w-3.5 h-3.5 opacity-50" />
                                                                <span>{(Number(release.views) || 0).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                        {release.source === 'youtube' && (
                                                            <Youtube className="w-4 h-4 text-red-500/60" />
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
            </div>

            {/* ── 06. Archive & Governance Explanation ── */}
            <Section background="slate" spacing="normal">
                <PageContainer>
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="elite-card p-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <h3 className="text-xl font-bold text-white tracking-tight">Governed Releases</h3>
                                </div>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Original studio productions recorded, mixed, mastered, and cleared under the SufiPulse institutional charter. Every release satisfies strict linguistic oversight, verified attribution, and non-commercial sacred reverence.
                                </p>
                            </div>

                            <div className="elite-card p-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-zinc-400" />
                                    <h3 className="text-xl font-bold text-white tracking-tight">Legacy Registry</h3>
                                </div>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    Historical recordings, devotional archives, and regional audio captures indexed into the Diwan-e-Amanat registry for cultural preservation, scholarly citation, and global audience discovery.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            {/* ── 07. SufiPulse Global Reach Intelligence Strip ── */}
            <div className="bg-[var(--color-midnight)] border-t border-b border-white/5 py-12">
                <PageContainer>
                    <GlobalReachStrip />
                </PageContainer>
            </div>

            {/* ── 08. Official Listening Destinations Panel ── */}
            <StudioGovernancePanel 
                title="Official Broadcast Endpoints"
                description="Stream authentic SufiPulse master releases 24/7 across our verified streaming platforms, continuous radio service, and official YouTube channel."
                primaryCTA={{ label: "Access SufiPulse Radio", href: "/official-channels" }}
                secondaryCTA={{ label: "YouTube Channel", href: "https://www.youtube.com/@SufiPulse-USA" }}
                shieldText="Governed Broadcast Framework"
                background="midnight"
            />

            <SyncResultModal 
                open={syncModalOpen} 
                onClose={() => setSyncModalOpen(false)}
                result={syncResult}
                error={syncError}
                onRefresh={() => {
                    fetchVideos(false, true);
                    setSyncModalOpen(false);
                }}
            />

            <style jsx global>{`
                .elite-card {
                    background: rgba(18, 18, 18, 0.4);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    border-radius: 32px;
                    box-shadow: 
                        0 20px 40px rgba(0,0,0,0.4),
                        inset 0 1px 1px rgba(255,255,255,0.02);
                }
            `}</style>
        </Layout>
    );
}
