"use client"
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import dynamic from 'next/dynamic';
import { Layout } from '../../../components/layout/Layout';
import { AuthContext } from '@/app/contexts/AuthContext';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Badge } from '../../../components/primitives/Badge';
import { Music, Lock, Calendar, Eye, ThumbsUp, MessageCircle, Clock, Share2, Copy, Facebook, CreditCard as Edit, FileText, Bubbles as Subtitles, Play, Pause, ChevronDown, X, Twitter, MessageSquare, Check, Mic, Users, CirclePlay as PlayCircle, Video, Shield, FileSliders as Sliders, Book, Award, Maximize, Minimize, Settings2, Save, Loader2, Info, Linkedin, Send, Download } from 'lucide-react';
// import { useRelease } from '../../../hooks/useRelease';
// import { formatDuration } from '../../../services/youtubeSync';
import Link from 'next/link';
import YouTube from 'react-youtube';
import { LanguageKey, LyricsTrack } from '../../../components/release/lyrics/lyricsData';
import { RecentAdopters } from '../../../components/release/adopt/RecentAdopters';
import { getYouTubeVideoId, buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';
import { LanguageManagerWithRelease, LanguageSelector, SideBySideComparison, SubtitlePasteEditor, getLanguageLabel, LANGUAGE_OPTIONS as PAGE_LANGUAGE_OPTIONS } from './components';
import type { SubtitleStatus } from './components';
import { useVideoTimeTracker, TimeDisplay } from './components/VideoTimeTracker';

// Lazy-load heavy components — not needed for initial render
const VideoOverlay = dynamic(
    () => import('../../../components/release/lyrics/VideoOverlay').then(m => ({ default: m.VideoOverlay })),
    { ssr: false }
);
const AdoptTab = dynamic(
    () => import('../../../components/release/adopt/AdoptTab').then(m => ({ default: m.AdoptTab })),
    { ssr: false, loading: () => <div className="h-32 rounded-2xl bg-neutral-900 animate-pulse" /> }
);
// Supabase removed — CMS file storage (.data/cms-releases.json) is the canonical data source

const LANGUAGE_OPTIONS = [
    { key: 'roman_urdu', label: 'Roman Urdu' },
    { key: 'urdu', label: 'Urdu' },
    { key: 'hindi', label: 'Hindi' },
    { key: 'arabic', label: 'Arabic' },
    { key: 'turkish', label: 'Turkish' },
    { key: 'persian', label: 'Persian (Farsi)' },
    { key: 'punjabi', label: 'Punjabi' },
    { key: 'indonesian', label: 'Indonesian' },
    { key: 'spanish', label: 'Spanish' },
    { key: 'portuguese', label: 'Portuguese' },
    { key: 'french', label: 'French' },
    { key: 'german', label: 'German' },
    { key: 'russian', label: 'Russian' },
    { key: 'bengali', label: 'Bengali' },
    { key: 'chinese', label: 'Chinese' },
    { key: 'japanese', label: 'Japanese' },
    { key: 'english', label: 'English' },
] as const;

const RTL_LANG_KEYS = new Set(['urdu', 'ar', 'arabic', 'fa', 'persian']);

const formatSecondsToTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const parseTimestampToSeconds = (timestamp?: string): number => {
    if (!timestamp) return 0;

    const normalized = timestamp.trim().replace(',', '.');
    const parts = normalized.split(':').map((part) => Number(part));

    if (parts.some((n) => Number.isNaN(n))) return 0;

    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
};

const languageCandidates = (selected: string): string[] => {
    const aliases: Record<string, string[]> = {
        roman_urdu: ['roman_urdu', 'roman-urdu', 'roman', 'ur_roman', 'ur'],
        urdu: ['urdu', 'ur'],
        english: ['english', 'en'],
        persian: ['persian', 'fa', 'farsi'],
        arabic: ['arabic', 'ar'],
    };

    const mapped = aliases[selected] || [selected];
    return Array.from(new Set(mapped.map((value) => value.toLowerCase())));
};

const buildCmsCaptionTrack = (release: any, selected: string): LyricsTrack | null => {
    const subtitleCues = Array.isArray(release?.subtitleCues) ? release.subtitleCues : (Array.isArray(release?.subtitle_cues) ? release.subtitle_cues : []);
    const subtitleTranslations = release?.subtitleTranslations || release?.subtitle_translations || {};
    const subtitleCueMetadata = release?.subtitle_cue_metadata || release?.subtitleCueMetadata || {};
    const subtitleStylePacks = release?.subtitle_style_packs || release?.subtitleStylePacks || {};
    const languageStyleOverrides = release?.language_style_overrides || release?.languageStyleOverrides || {};

    const candidates = languageCandidates(selected);
    const matchedLanguageKey = Object.keys(subtitleTranslations || {}).find((lang) =>
        candidates.includes(String(lang).toLowerCase())
    );

    const translationMap = matchedLanguageKey ? subtitleTranslations?.[matchedLanguageKey] : null;
    const languageOverride =
        languageStyleOverrides?.[matchedLanguageKey || selected] ||
        languageStyleOverrides?.[selected] ||
        {};
    const defaultStyleName = languageOverride?.stylePack;

    if (subtitleCues.length > 0 && translationMap && typeof translationMap === 'object') {
        const ordered = subtitleCues
            .filter((cue: any) => cue?.active !== false)
            .slice()
            .sort((a: any, b: any) => (a.cueNumber || 0) - (b.cueNumber || 0));

        const cues = ordered
            .map((cue: any, idx: number) => {
                const text = String(translationMap[cue.id] || '').trim();
                if (!text) return null;
                const cueMeta = subtitleCueMetadata?.[cue.id] || {};
                const styleName = cueMeta?.styleName || defaultStyleName;
                const stylePack = (styleName && subtitleStylePacks?.[styleName]) || {};
                return {
                    id: cue.id || `cms-cue-${idx + 1}`,
                    start: parseTimestampToSeconds(cue.startTime),
                    end: parseTimestampToSeconds(cue.endTime),
                    stanza: idx + 1,
                    line: 1,
                    text,
                    styleName,
                    alignment: cueMeta?.alignment ?? stylePack?.alignment,
                    positionX: cueMeta?.positionX,
                    positionY: cueMeta?.positionY,
                    fontFamily: stylePack?.fontFamily,
                    fontSize: stylePack?.fontSize,
                    primaryColor: stylePack?.primaryColor,
                    outlineColor: stylePack?.outlineColor,
                    backColor: stylePack?.backColor,
                    bold: stylePack?.bold,
                    italic: stylePack?.italic,
                    outline: stylePack?.outline,
                    shadow: stylePack?.shadow,
                    maxWidthPercent: stylePack?.maxWidthPercent,
                };
            })
            .filter(Boolean) as Array<{ id: string; start: number; end: number; stanza: number; line: number; text: string }>;

        if (cues.length > 0) {
            return {
                languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected) ? selected : 'english') as LanguageKey,
                label: selected.replace('_', ' '),
                direction: RTL_LANG_KEYS.has((matchedLanguageKey || selected).toLowerCase()) ? 'rtl' : 'ltr',
                versionType: 'translation',
                verified: true,
                fullLyrics: cues.map((cue, idx) => ({ stanza: idx + 1, lines: [cue.text] })),
                cues,
            };
        }
    }

    const cmsLyrics = release?.lyrics || {};
    const matchedLyricsKey = Object.keys(cmsLyrics).find((lang) =>
        candidates.includes(String(lang).toLowerCase())
    );

    const lyricRows = matchedLyricsKey ? cmsLyrics[matchedLyricsKey] : null;
    if (Array.isArray(lyricRows) && lyricRows.length > 0) {
        const cues = lyricRows
            .map((row: any, idx: number) => {
                const text = String(
                    row?.text ||
                    row?.translation ||
                    row?.transliteration ||
                    row?.urdu ||
                    ''
                ).trim();
                if (!text) return null;
                const start = parseTimestampToSeconds(row?.timestamp);
                const nextStart = parseTimestampToSeconds(lyricRows[idx + 1]?.timestamp);
                const end = nextStart > start ? nextStart : start + 4;
                return {
                    id: `cms-lyric-${idx + 1}`,
                    start,
                    end,
                    stanza: idx + 1,
                    line: 1,
                    text,
                };
            })
            .filter(Boolean) as Array<{ id: string; start: number; end: number; stanza: number; line: number; text: string }>;

        if (cues.length > 0) {
            return {
                languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected) ? selected : 'english') as LanguageKey,
                label: selected.replace('_', ' '),
                direction: RTL_LANG_KEYS.has((matchedLyricsKey || selected).toLowerCase()) ? 'rtl' : 'ltr',
                versionType: 'translation',
                verified: true,
                fullLyrics: cues.map((cue, idx) => ({ stanza: idx + 1, lines: [cue.text] })),
                cues,
            };
        }
    }

    return null;
};

// Fallback: generate caption cues from plain lyrics text (no timestamps)
const buildCaptionTrackFromPlainLyrics = (release: any, selected: string, durationSeconds?: number): LyricsTrack | null => {
    const cmsLyrics = release?.lyrics || {};
    const lyricsStructureMap = release?.lyrics_structure || release?.lyricsStructure || {};
    const candidates = languageCandidates(selected);
    const matchedLyricsKey = Object.keys(cmsLyrics || {}).find((lang) =>
        candidates.includes(String(lang).toLowerCase())
    ) || Object.keys(lyricsStructureMap || {}).find((lang) =>
        candidates.includes(String(lang).toLowerCase())
    );

    const legacyRows = matchedLyricsKey ? cmsLyrics[matchedLyricsKey] : null;
    const structuredBlocks = matchedLyricsKey ? lyricsStructureMap[matchedLyricsKey] : null;
    
    // Debug log
    if (process.env.NODE_ENV === 'development') {
        console.log('PlainLyrics Debug:', {
            selected,
            matchedLyricsKey,
            hasLegacyRows: !!legacyRows,
            hasStructuredBlocks: !!structuredBlocks,
            durationSeconds,
        });
    }
    
    // 1. Try new structured blocks format first (from lyrics_structure)
    if (Array.isArray(structuredBlocks) && structuredBlocks.length > 0 && durationSeconds && durationSeconds > 0) {
        const lines = structuredBlocks
            .filter((block: any) => block?.isPublished !== false)
            .flatMap((block: any) => Array.isArray(block.lines) ? block.lines : [])
            .map(l => String(l).trim())
            .filter(Boolean);
            
        if (lines.length > 0) {
            const cueDuration = durationSeconds / lines.length;
            const cues = lines.map((line: string, idx: number) => ({
                id: `struct-lyric-${idx + 1}`,
                start: idx * cueDuration,
                end: (idx + 1) * cueDuration,
                stanza: idx + 1,
                line: 1,
                text: line,
            }));
            
            return {
                languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected) ? selected : 'english') as LanguageKey,
                label: selected.replace('_', ' '),
                direction: RTL_LANG_KEYS.has((matchedLyricsKey || selected).toLowerCase()) ? 'rtl' : 'ltr',
                versionType: 'translation',
                verified: false,
                fullLyrics: cues.map((cue, idx) => ({ stanza: idx + 1, lines: [cue.text] })),
                cues,
            };
        }
    }
    
    // 2. Try legacy array format
    if (Array.isArray(legacyRows) && legacyRows.length > 0) {
        // Check if any row has timestamps
        const hasTimestamps = legacyRows.some((row: any) => row?.timestamp);
        
        if (hasTimestamps) {
            // Use existing timestamp-based logic
            const cues = legacyRows
                .map((row: any, idx: number) => {
                    const text = String(
                        row?.text ||
                        row?.translation ||
                        row?.transliteration ||
                        row?.urdu ||
                        ''
                    ).trim();
                    if (!text) return null;
                    const start = parseTimestampToSeconds(row?.timestamp);
                    const nextStart = parseTimestampToSeconds(legacyRows[idx + 1]?.timestamp);
                    const end = nextStart > start ? nextStart : start + 4;
                    return {
                        id: `cms-lyric-${idx + 1}`,
                        start,
                        end,
                        stanza: idx + 1,
                        line: 1,
                        text,
                    };
                })
                .filter(Boolean) as Array<{ id: string; start: number; end: number; stanza: number; line: number; text: string }>;

            if (cues.length > 0) {
                return {
                    languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected) ? selected : 'english') as LanguageKey,
                    label: selected.replace('_', ' '),
                    direction: RTL_LANG_KEYS.has((matchedLyricsKey || selected).toLowerCase()) ? 'rtl' : 'ltr',
                    versionType: 'translation',
                    verified: false,
                    fullLyrics: cues.map((cue, idx) => ({ stanza: idx + 1, lines: [cue.text] })),
                    cues,
                };
            }
        } else if (durationSeconds && durationSeconds > 0) {
            // Arrays without timestamps (e.g. array of strings or simple object arrays) array fallback
            const lines = legacyRows
                .map((row: any) => typeof row === 'string' ? row : String(row?.text || row?.translation || row?.transliteration || row?.urdu || '')).filter((l: string) => l.trim());

                
            if (lines.length > 0) {
                const cueDuration = durationSeconds / lines.length;
                const cues = lines.map((line: string, idx: number) => ({
                    id: `plain-lyric-${idx + 1}`,
                    start: idx * cueDuration,
                    end: (idx + 1) * cueDuration,
                    stanza: idx + 1,
                    line: 1,
                    text: line.trim(),
                }));
                
                return {
                    languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected) ? selected : 'english') as LanguageKey,
                    label: selected.replace('_', ' '),
                    direction: RTL_LANG_KEYS.has((matchedLyricsKey || selected).toLowerCase()) ? 'rtl' : 'ltr',
                    versionType: 'translation',
                    verified: false,
                    fullLyrics: cues.map((cue, idx) => ({ stanza: idx + 1, lines: [cue.text] })),
                    cues,
                };
            }
        }
    }
    
    // 3. Try string format (plain text) legacy fallback
    const plainTextLyrics = typeof legacyRows === 'string' ? legacyRows : null;
    if (plainTextLyrics) {
        const lines = plainTextLyrics.split('\n').filter((l: string) => l.trim());
        if (lines.length > 0 && durationSeconds && durationSeconds > 0) {
            const cueDuration = durationSeconds / lines.length;
            const cues = lines.map((line: string, idx: number) => ({
                id: `plain-lyric-${idx + 1}`,
                start: idx * cueDuration,
                end: (idx + 1) * cueDuration,
                stanza: idx + 1,
                line: 1,
                text: line.trim(),
            }));
            
            return {
                languageKey: (LANGUAGE_OPTIONS.some((option) => option.key === selected) ? selected : 'english') as LanguageKey,
                label: selected.replace('_', ' '),
                direction: RTL_LANG_KEYS.has((matchedLyricsKey || selected).toLowerCase()) ? 'rtl' : 'ltr',
                versionType: 'translation',
                verified: false,
                fullLyrics: cues.map((cue, idx) => ({ stanza: idx + 1, lines: [cue.text] })),
                cues,
            };
        }
    }

    return null;
};

const extractYouTubeChannelIdFromUrl = (url?: string): string => {
    if (!url) return '';
    const normalized = url.trim();
    const match = normalized.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/i);
    return match?.[1] || '';
};

function Release() {
    // Auth context for admin detection
    const { user } = useContext(AuthContext);
    const isAdmin = user?.role === 'admin';
    
    // Debug: log user and isAdmin (only in development)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('AuthContext user:', user);
        // eslint-disable-next-line no-console
        console.log('isAdmin:', isAdmin);
    }
    
    const params = useParams();
    const slug = params?.slug as string;
    //   const { release, loading, error } = useRelease(slug || '');
    const [activeTab, setActiveTab] = useState<'overview' | 'subtitles' | 'lyrics' | 'production' | 'adopt' | 'credits' | 'commentary' | 'sponsors'>('credits');
    const [isEditing, setIsEditing] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [selectedSubtitleLanguage, setSelectedSubtitleLanguage] = useState<string>('roman_urdu');
    const [selectedLyricsLanguage, setSelectedLyricsLanguage] = useState<LanguageKey>('roman_urdu');
    const [selectedCaptionLanguage, setSelectedCaptionLanguage] = useState<string>('roman_urdu');
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [release, setRelease] = useState<any>(null);
    const [resolutionSource, setResolutionSource] = useState<'cms_slug' | 'cms_youtube_compat' | 'external_youtube_fallback' | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handlePlatformStatusChange = async (idx: number, newStatus: string) => {
        if (!release) return;
        const fallbackPlatforms = [
            { platform: 'SufiPulse Radio', status: 'Distribution Pending' },
            { platform: 'YouTube', status: 'Distribution Pending' },
            { platform: 'Spotify', status: release.spotify_url ? 'Live' : 'Distribution Pending' },
            { platform: 'Apple Music', status: release.apple_music_url ? 'Live' : 'Distribution Pending' },
            { platform: 'Instagram', status: 'Distribution Pending' },
            { platform: 'X', status: 'Distribution Pending' },
            { platform: 'Facebook', status: 'Distribution Pending' },
        ];
        const currentPlatforms = release.streaming_platforms && release.streaming_platforms.length > 0 
            ? [...release.streaming_platforms]
            : fallbackPlatforms;
        
        currentPlatforms[idx] = { ...currentPlatforms[idx], status: newStatus };
        setRelease({ ...release, streaming_platforms: currentPlatforms });

        try {
            await fetch(`/api/releases/${release.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...release, streamingPlatforms: currentPlatforms })
            });
        } catch (e) {
            console.error('Failed to update platform status', e);
        }
    };

    // Multi-language selection state
    const [comparisonLanguage, setComparisonLanguage] = useState<string | null>(null);
    const [showComparisonMode, setShowComparisonMode] = useState(false);

    // Admin editing state for languages
    const [editAvailableLanguages, setEditAvailableLanguages] = useState<string[]>([]);
    const [editDefaultLanguage, setEditDefaultLanguage] = useState<string>('');
    const [editLanguageStatuses, setEditLanguageStatuses] = useState<Record<string, SubtitleStatus>>({});

    // Subtitle editing state
    const [editSubtitleCues, setEditSubtitleCues] = useState<any[]>([]);
    const [editSubtitleTranslations, setEditSubtitleTranslations] = useState<Record<string, Record<string, string>>>({});

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'info'>('success');

    const [currentTime, setCurrentTime] = useState(0);
    const [playerTarget, setPlayerTarget] = useState<any>(null);
    const [captionsEnabled, setCaptionsEnabled] = useState(true);
    const [subtitleFontScale, setSubtitleFontScale] = useState<number>(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showPlayerSettings, setShowPlayerSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [playbackQuality, setPlaybackQuality] = useState<string>('auto');
    const [availableRates, setAvailableRates] = useState<number[]>([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
    const [availableQualities, setAvailableQualities] = useState<string[]>(['auto', 'hd1080', 'hd720', 'large', 'medium', 'small']);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVideoEnded, setIsVideoEnded] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const [officialSubscribeReady, setOfficialSubscribeReady] = useState(false);
    
    // Master Timing Generator State
    const [masterTimingText, setMasterTimingText] = useState('');
    const [masterTimingDuration, setMasterTimingDuration] = useState(0);
    const [showMasterTimingTool, setShowMasterTimingTool] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Memoized derived values to avoid re-computation on every render
    const publicCredits = useMemo(() => release?.public_credits || {}, [release?.public_credits]);
    const commentaryBlocks = useMemo(() =>
        Array.isArray(release?.public_commentary) && release.public_commentary.length > 0
            ? release.public_commentary.filter((block: any) => block?.isPublished !== false)
            : [
                { id: 'context', title: 'Historical Context', content: 'No commentary added yet.' },
                { id: 'theme', title: 'Thematic Interpretation', content: 'No thematic interpretation added yet.' },
            ],
        [release?.public_commentary]
    );
    const sponsorsList = useMemo(() =>
        Array.isArray(release?.public_sponsors)
            ? release.public_sponsors.filter((sponsor: any) => sponsor?.isPublished !== false)
            : [],
        [release?.public_sponsors]
    );
    const sponsorsIntro = useMemo(() =>
        release?.public_sponsors_intro || 'We are deeply grateful for the generous support of our sponsors who make these releases possible and contribute to the preservation of sacred arts.',
        [release?.public_sponsors_intro]
    );
    const lyricsStructureMap = useMemo(() =>
        release?.lyrics_structure || release?.lyricsStructure || {},
        [release?.lyrics_structure, release?.lyricsStructure]
    );
    const chorusVocalistsLabel = useMemo(() => {
        const chorusVocalists = (release?.chorus_vocalists || []) as Array<string | { name?: string }>;
        return chorusVocalists
            .map((entry) => (typeof entry === 'string' ? entry : (entry?.name || '')))
            .filter(Boolean)
            .join(', ');
    }, [release?.chorus_vocalists]);

    // Memoized format functions
    const formatDuration = useCallback((totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, []);

    const releaseChannelId =
        release?.youtube_channel_id ||
        release?.youtubeChannelId ||
        release?.public_youtube_channel_id ||
        release?.publicYouTubeChannelId ||
        '';
    const releaseChannelUrl =
        release?.youtube_channel_url ||
        release?.youtubeChannelUrl ||
        release?.public_youtube_channel_url ||
        release?.publicYouTubeChannelUrl ||
        '';

    const envChannelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID || 'UCraDr3i5A3k0j7typ6tOOsQ';
    const envChannelUrl = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || `https://www.youtube.com/channel/${envChannelId}`;

    const effectiveYouTubeChannelId = releaseChannelId || extractYouTubeChannelIdFromUrl(releaseChannelUrl) || envChannelId;
    const effectiveYouTubeChannelUrl = releaseChannelUrl || envChannelUrl || `https://www.youtube.com/channel/${effectiveYouTubeChannelId}`;
    const youtubeSubscribeUrl = effectiveYouTubeChannelId
        ? `https://www.youtube.com/channel/${effectiveYouTubeChannelId}?sub_confirmation=1`
        : `${effectiveYouTubeChannelUrl}${effectiveYouTubeChannelUrl.includes('?') ? '&' : '?'}sub_confirmation=1`;
    const joinSufiPulseUrl = process.env.NEXT_PUBLIC_JOIN_URL || '/register';

    const resolvedVideoId = release?.youtube_video_id || getYouTubeVideoId(release?.youtube_url) || slug;
    const thumbnailCandidates = buildYouTubeThumbnailCandidates(resolvedVideoId, [
        release?.thumbnail_url,
        release?.thumbnailUrl,
        release?.artwork_url,
    ]);

    const updateActiveLanguage = (language: string) => {
        setSelectedSubtitleLanguage(language);
        if (PAGE_LANGUAGE_OPTIONS.some((option) => option.code === language)) {
            setSelectedLyricsLanguage(language as LanguageKey);
        }
    };

    // Derive available languages from release data
    const getDerivedAvailableLanguages = (): string[] => {
        if (!release) return [];

        const fromStatuses = Object.keys(release.subtitleLanguageStatuses || {});
        const fromTranslations = Object.keys(release.subtitle_translations || {});
        const fromLyrics = Object.keys(release.lyrics || {});
        const fromAvailable = release.availableLanguages || [];
        const fromStructure = Object.keys(release.lyrics_structure || {});

        return Array.from(new Set([
            ...fromAvailable,
            ...fromStatuses,
            ...fromTranslations,
            ...fromLyrics,
            ...fromStructure,
        ])).filter(Boolean);
    };

    // Initialize edit state when release loads
    useEffect(() => {
        if (release) {
            const derived = getDerivedAvailableLanguages();
            setEditAvailableLanguages(derived);
            setEditDefaultLanguage(release.defaultLanguage || derived[0] || '');
            setEditLanguageStatuses(release.subtitleLanguageStatuses || {});
            setEditSubtitleCues(release.subtitle_cues || []);
            setEditSubtitleTranslations(release.subtitle_translations || {});
        }
    }, [release]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (!videoLoaded) {
            setShowPlayerSettings(false);
        }
    }, [videoLoaded]);

    useEffect(() => {
        const existingScript = document.querySelector('script[data-ytsubscribe-script="1"]') as HTMLScriptElement | null;

        const initializeSubscribe = () => {
            try {
                (window as any)?.gapi?.ytsubscribe?.go?.();
                setOfficialSubscribeReady(true);
            } catch {
                setOfficialSubscribeReady(false);
            }
        };

        if (existingScript) {
            initializeSubscribe();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/platform.js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-ytsubscribe-script', '1');
        script.onload = initializeSubscribe;
        script.onerror = () => setOfficialSubscribeReady(false);
        document.body.appendChild(script);
    }, [effectiveYouTubeChannelId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!showPlayerSettings) return;
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setShowPlayerSettings(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPlayerSettings]);

    // Sync time interval - reduced to 1000ms to minimize re-renders
    useEffect(() => {
        if (!playerTarget) return;
        const interval = setInterval(async () => {
            if (playerTarget.getCurrentTime) {
                const time = await playerTarget.getCurrentTime();
                setCurrentTime(time);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [playerTarget]);

    const handleSeekRequest = (time: number) => {
        if (playerTarget && playerTarget.seekTo) {
            playerTarget.seekTo(time, true);
        }
    };

    const setPlayerRate = (rate: number) => {
        try {
            playerTarget?.setPlaybackRate?.(rate);
            setPlaybackRate(rate);
        } catch (err) {
            console.debug('Unable to set playback rate', err);
        }
    };

    const setPlayerQuality = (quality: string) => {
        try {
            if (quality !== 'auto') {
                playerTarget?.setPlaybackQuality?.(quality);
            }
            setPlaybackQuality(quality);
        } catch (err) {
            console.debug('Unable to set playback quality', err);
        }
    };

    const togglePlayback = () => {
        try {
            if (!playerTarget) return;
            if (isPlaying) {
                playerTarget.pauseVideo?.();
            } else {
                playerTarget.playVideo?.();
            }
        } catch (err) {
            console.debug('Unable to toggle playback', err);
        }
    };

    const scrubTo = (value: number) => {
        if (!playerTarget?.seekTo) return;
        playerTarget.seekTo(value, true);
        setCurrentTime(value);
    };

    const autoGenerateMasterCues = (text: string, duration: number) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0 || duration <= 0) return;

        const interval = duration / lines.length;
        const newCues = lines.map((line, idx) => {
            const start = idx * interval;
            const end = (idx + 1) * interval;
            return {
                id: `master-cue-${idx + 1}`,
                startTime: formatSecondsToTimestamp(start),
                endTime: formatSecondsToTimestamp(end),
                active: true,
                cueNumber: idx + 1
            };
        });

        // Update cues
        setEditSubtitleCues(newCues);
        
        // Update master translations (default to Roman Urdu if none set)
        const masterLang = editDefaultLanguage || 'roman_urdu';
        if (!editAvailableLanguages.includes(masterLang)) {
            setEditAvailableLanguages(prev => [...prev, masterLang]);
        }
        
        const translations: Record<string, string> = {};
        newCues.forEach((cue, idx) => {
            translations[cue.id] = lines[idx];
        });

        setEditSubtitleTranslations(prev => ({
            ...prev,
            [masterLang]: translations
        }));
        
        setToastMessage(`Generated ${newCues.length} master timing cues!`);
        setToastType('success');
    };

    useEffect(() => {
        if (!slug) return;

        const fetchVideoDetails = async () => {
            try {
                const mapCmsRelease = (cmsRelease: any) => ({
                    id: cmsRelease.id,
                    release_title: cmsRelease.title,
                    release_date: cmsRelease.releaseDate,
                    description: cmsRelease.description,
                    source: "cms",
                    duration_seconds: cmsRelease.durationSeconds,
                    views: cmsRelease.viewCount || 0,
                    likes: cmsRelease.likeCount || 0,
                    youtube_video_id: cmsRelease.youtubeId,
                    slug: cmsRelease.slug,
                    thumbnail_url: cmsRelease.thumbnailUrl,
                    subtitles_available: false,
                    subtitle_languages: [],
                    lyrics: cmsRelease.lyrics || {},
                    subtitle_cues: cmsRelease.subtitleCues || [],
                    subtitle_translations: cmsRelease.subtitleTranslations || {},
                    subtitle_cue_metadata: cmsRelease.subtitleCueMetadata || {},
                    subtitle_style_packs: cmsRelease.subtitleStylePacks || {},
                    language_style_overrides: cmsRelease.languageStyleOverrides || {},
                    lyrics_structure: cmsRelease.lyricsStructure || {},
                    enable_credits: cmsRelease.enableCredits !== false,
                    enable_commentary: cmsRelease.enableCommentary !== false,
                    enable_sponsors: !!cmsRelease.enableSponsors,
                    enable_adoption: cmsRelease.enableAdoption !== false,
                    public_commentary: cmsRelease.publicCommentary || [],
                    public_sponsors_intro: cmsRelease.publicSponsorsIntro || '',
                    public_sponsors: cmsRelease.publicSponsors || [],
                    public_credits: cmsRelease.publicCredits || {},
                    credits: [],
                    lead_vocalists: cmsRelease.vocalist ? [cmsRelease.vocalist] : [],
                    chorus_vocalists: cmsRelease.chorusVocalists || cmsRelease.chorus_vocalists || [],
                    production_credits: cmsRelease.producer ? { producer: cmsRelease.producer } : {},
                    streaming_platforms: cmsRelease.streamingPlatforms || [],
                    spotify_url: "",
                    apple_music_url: ""
                });

                setError(null);

                let resolvedRelease: any = null;
                let resolvedSource: 'cms_slug' | 'cms_youtube_compat' | 'external_youtube_fallback' | null = null;

                // 1) Try by slug — isolated so a network failure doesn't skip the youtubeId fallback
                try {
                    const slugRes = await fetch(`/api/releases?slug=${encodeURIComponent(slug)}`);
                    if (slugRes.ok) {
                        const data = await slugRes.json();
                        if (data && !data.error) {
                            resolvedRelease = data;
                            resolvedSource = 'cms_slug' as const;
                        }
                    }
                } catch {
                    // Slug lookup failed — continue to youtubeId fallback
                }

                // 2) Try by youtubeId (URL slug may be a YouTube video ID)
                if (!resolvedRelease) {
                    try {
                        const compatRes = await fetch(`/api/releases?youtubeId=${encodeURIComponent(slug)}`);
                        if (compatRes.ok) {
                            const data = await compatRes.json();
                            if (data && !data.error) {
                                resolvedRelease = data;
                                resolvedSource = 'cms_youtube_compat' as const;
                            }
                        }
                    } catch {
                        // YoutubeId lookup also failed — will fall through to YouTube API
                    }
                }

                if (resolvedRelease) {
                    setResolutionSource(resolvedSource);
                    setRelease(mapCmsRelease(resolvedRelease));
                    setLoading(false);
                    return;
                }

                // Supabase fallback removed — CMS file storage is the only data source

                // Fallback to YouTube API
                console.log('Fetching from YouTube API...');
                const { youtubeService } = await import('../../../../lib/youtube-service');
                const videos = await youtubeService.getVideosByIds(slug);

                if (!videos || videos.length === 0) {
                    setError("Video not found on SufiTube.");
                    setLoading(false);
                    return;
                }

                const v = videos[0];
                setResolutionSource('external_youtube_fallback');

                setRelease({
                    id: v.id,
                    release_title: v.snippet.title,
                    release_date: v.snippet.publishedAt,
                    description: v.snippet.description,
                    source: "youtube_legacy",
                    duration_seconds: youtubeService['parseDuration'](v.contentDetails.duration),
                    views: parseInt(v.statistics.viewCount || '0'),
                    likes: parseInt(v.statistics.likeCount || '0'),
                    youtube_video_id: v.id,
                    thumbnail_url: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.standard?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url,
                    slug: v.id,
                    subtitles_available: false,
                    subtitle_languages: [],
                    lyrics: {},
                    subtitle_cues: [],
                    subtitle_translations: {},
                    subtitle_cue_metadata: {},
                    subtitle_style_packs: {},
                    language_style_overrides: {},
                    lyrics_structure: {},
                    enable_credits: true,
                    enable_commentary: true,
                    enable_sponsors: false,
                    enable_adoption: true,
                    public_commentary: [],
                    public_sponsors_intro: '',
                    public_sponsors: [],
                    public_credits: {},
                    credits: [],
                    lead_vocalists: [],
                    chorus_vocalists: [],
                    production_credits: {},
                    streaming_platforms: [],
                    spotify_url: "",
                    apple_music_url: ""
                });
            } catch (err: any) {
                console.error("Critical error in fetchVideoDetails:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                setError(`Failed to load release details: ${errorMessage}`);
            } finally {
                setLoading(false);
            }
        };

        fetchVideoDetails();
    }, [slug]);

    // Use edited translations when available (after admin paste)
    const effectiveSubtitleTranslations = editSubtitleTranslations && Object.keys(editSubtitleTranslations).length > 0
        ? editSubtitleTranslations
        : (release?.subtitle_translations || {});

    const effectiveSubtitleCues = editSubtitleCues && editSubtitleCues.length > 0
        ? editSubtitleCues
        : (release?.subtitle_cues || []);

    const captionLanguageOptions = useMemo(() => {
        const map = new Map<string, string>();

        for (const option of LANGUAGE_OPTIONS) {
            map.set(option.key, option.label);
        }

        const lyricsStructureMap = release?.lyrics_structure || release?.lyricsStructure || {};
        const cmsKeys = [
            ...Object.keys(effectiveSubtitleTranslations),
            ...Object.keys(release?.lyrics || {}),
            ...Object.keys(lyricsStructureMap),
        ];

        // Alias map to expand common abbreviations found in CMS keys
        const aliases: Record<string, string> = {
            'ur': 'Urdu',
            'en': 'English',
            'hi': 'Hindi',
            'tr': 'Turkish',
            'ar': 'Arabic',
            'fa': 'Persian',
            'pa': 'Punjabi',
            'bn': 'Bengali',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'id': 'Indonesian',
            'pt': 'Portuguese'
        };

        for (const key of cmsKeys) {
            const normalized = String(key || '').trim().toLowerCase();
            if (!normalized) continue;
            
            // Check if we already have this key (maybe the user used the full name as the key)
            if (!map.has(key)) {
                // Check if it's an abbreviation we know
                if (aliases[normalized]) {
                    map.set(key, aliases[normalized]);
                } else {
                    const label = normalized
                        .replace(/[_-]/g, ' ')
                        .replace(/\b\w/g, (char) => char.toUpperCase());
                    map.set(key, label);
                }
            }
        }

        // Deduplicate by Label: If multiple keys map to the same label (e.g., 'ur' and 'urdu' both -> 'Urdu'),
        // we keep only one. We prefer keys that are already in the system constants.
        const dedupedResults: { key: string; label: string }[] = [];
        const seenLabels = new Set<string>();

        // Sort entries to process 'standard' keys first
        const entries = Array.from(map.entries()).sort((a, b) => {
            const aIsStandard = LANGUAGE_OPTIONS.some(opt => opt.key === a[0]);
            const bIsStandard = LANGUAGE_OPTIONS.some(opt => opt.key === b[0]);
            if (aIsStandard && !bIsStandard) return -1;
            if (!aIsStandard && bIsStandard) return 1;
            return 0;
        });

        for (const [key, label] of entries) {
            if (!seenLabels.has(label)) {
                dedupedResults.push({ key, label });
                seenLabels.add(label);
            }
        }

        return dedupedResults;
    }, [effectiveSubtitleTranslations, release?.lyrics, release?.lyrics_structure]);

    // Build a temporary release object with effective subtitle data for caption track
    const effectiveReleaseForCaptions = useMemo(() => ({
        ...release,
        subtitle_cues: effectiveSubtitleCues,
        subtitle_translations: effectiveSubtitleTranslations,
    }), [release, effectiveSubtitleCues, effectiveSubtitleTranslations]);

    const cmsCaptionTrack = buildCmsCaptionTrack(effectiveReleaseForCaptions, selectedCaptionLanguage);
    // Fallback to plain lyrics if no timed caption track exists
    const plainLyricsTrack = !cmsCaptionTrack 
        ? buildCaptionTrackFromPlainLyrics(effectiveReleaseForCaptions, selectedCaptionLanguage, release?.duration_seconds)
        : null;
    const activeOverlayTrack = cmsCaptionTrack || plainLyricsTrack;

    // Debug logging for caption track (development only)
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('CC Debug:', {
                selectedCaptionLanguage,
                hasCmsCaptionTrack: !!cmsCaptionTrack,
                hasPlainLyricsTrack: !!plainLyricsTrack,
                activeOverlayTrack: activeOverlayTrack ? '✓' : '✗',
                cueCount: activeOverlayTrack?.cues?.length || 0,
                hasSubtitleCues: !!release?.subtitle_cues?.length,
                hasSubtitleTranslations: !!(release?.subtitle_translations?.[selectedCaptionLanguage]),
                hasLyrics: !!(release?.lyrics?.[selectedCaptionLanguage]),
                lyricsType: typeof release?.lyrics?.[selectedCaptionLanguage],
                durationSeconds: release?.duration_seconds,
                captionsEnabled,
                currentTime,
            });
        }
    }, [cmsCaptionTrack, plainLyricsTrack, activeOverlayTrack, selectedCaptionLanguage, release, captionsEnabled, currentTime]);

    useEffect(() => {
        if (!captionLanguageOptions.length) return;
        if (!captionLanguageOptions.some((option) => option.key === selectedCaptionLanguage)) {
            setSelectedCaptionLanguage(captionLanguageOptions[0].key);
        }
    }, [captionLanguageOptions, selectedCaptionLanguage]);

    // Local state for editing - MUST be before early returns
    // Edit state for various release fields
    const [editCredits, setEditCredits] = useState<any>({});
    const [editLyrics, setEditLyrics] = useState<any>([]);
    const [editCommentary, setEditCommentary] = useState<string>('');
    const [editSponsors, setEditSponsors] = useState<any[]>([]);
    const [editSponsorsIntro, setEditSponsorsIntro] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStructuredLyrics, setEditStructuredLyrics] = useState<any>({});

    // Feature toggles
    const [editEnableCredits, setEditEnableCredits] = useState(true);
    const [editEnableCommentary, setEditEnableCommentary] = useState(true);
    const [editEnableSponsors, setEditEnableSponsors] = useState(false);
    const [editEnableAdoption, setEditEnableAdoption] = useState(true);
    const [editEnableLyrics, setEditEnableLyrics] = useState(true);

    // Sync edit state when entering edit mode or when release/selectedLyricsLanguage changes
    useEffect(() => {
        if (isEditing) {
            setEditCredits(release?.public_credits || {});
            setEditLyrics((release?.lyrics && release?.lyrics[selectedLyricsLanguage]) || []);
            const blocks = Array.isArray(release?.public_commentary) ? release.public_commentary : [];
            setEditCommentary(blocks.map((b: any) => b.content || '').join('\n\n') || '');
            setEditSponsors(Array.isArray(release?.public_sponsors) ? release.public_sponsors : []);
            setEditSponsorsIntro(release?.public_sponsors_intro || '');
            setEditTitle(release?.release_title || '');
            setEditDescription(release?.description || '');
            setEditStructuredLyrics(release?.lyrics_structure || {});
            setEditEnableCredits(release?.enable_credits !== false);
            setEditEnableCommentary(release?.enable_commentary !== false);
            setEditEnableSponsors(!!release?.enable_sponsors);
            setEditEnableAdoption(release?.enable_adoption !== false);
            setEditEnableLyrics(release?.enable_lyrics !== false);
        }
    }, [isEditing, release, selectedLyricsLanguage]);

    // Handlers for editing
    const handleCreditChange = (key: string, value: string) => {
        setEditCredits((prev: any) => ({ ...prev, [key]: value }));
    };
    const handleLyricChange = (idx: number, value: string) => {
        setEditLyrics((prev: any[]) => prev.map((line, i) => (i === idx ? value : line)));
    };
    const handleCommentaryChange = (value: string) => {
        setEditCommentary(value);
    };

    // Language management handlers
    const handleAvailableLanguagesChange = (languages: string[]) => {
        setEditAvailableLanguages(languages);
    };

    const handleDefaultLanguageChange = (language: string) => {
        setEditDefaultLanguage(language);
    };

    const handleLanguageStatusChange = (language: string, status: SubtitleStatus) => {
        setEditLanguageStatuses((prev) => ({ ...prev, [language]: status }));
    };

    // Subtitle translations handler
    const handleSubtitleTranslationsChange = (language: string, translations: Record<string, string>) => {
        setEditSubtitleTranslations((prev) => ({ ...prev, [language]: translations }));
    };

    // Sponsors handlers
    const handleAddSponsor = () => {
        setEditSponsors((prev) => [...prev, { id: `sponsor_${Date.now()}`, name: '', role: '', logoUrl: '', isPublished: true }]);
    };
    const handleRemoveSponsor = (idx: number) => {
        setEditSponsors((prev) => prev.filter((_, i) => i !== idx));
    };
    const handleSponsorChange = (idx: number, field: string, value: string | boolean) => {
        setEditSponsors((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    };

    // Structured lyrics handlers
    const handleAddLyricsBlock = (language: string) => {
        setEditStructuredLyrics((prev: any) => {
            const langBlocks = Array.isArray(prev?.[language]) ? prev[language] : [];
            return {
                ...prev,
                [language]: [...langBlocks, {
                    id: `block_${Date.now()}`,
                    type: 'verse',
                    heading: '',
                    order: langBlocks.length,
                    lines: [''],
                    isPublished: true,
                }],
            };
        });
    };
    const handleRemoveLyricsBlock = (language: string, blockIdx: number) => {
        setEditStructuredLyrics((prev: any) => {
            const langBlocks = Array.isArray(prev?.[language]) ? prev[language] : [];
            return { ...prev, [language]: langBlocks.filter((_: any, i: number) => i !== blockIdx) };
        });
    };
    const handleLyricsBlockChange = (language: string, blockIdx: number, field: string, value: any) => {
        setEditStructuredLyrics((prev: any) => {
            const langBlocks = Array.isArray(prev?.[language]) ? prev[language] : [];
            return {
                ...prev,
                [language]: langBlocks.map((b: any, i: number) => i === blockIdx ? { ...b, [field]: value } : b),
            };
        });
    };
    const handleLyricsLineChange = (language: string, blockIdx: number, lineIdx: number, value: string) => {
        setEditStructuredLyrics((prev: any) => {
            const langBlocks = Array.isArray(prev?.[language]) ? prev[language] : [];
            return {
                ...prev,
                [language]: langBlocks.map((b: any, i: number) =>
                    i === blockIdx
                        ? { ...b, lines: b.lines.map((l: string, j: number) => j === lineIdx ? value : l) }
                        : b
                ),
            };
        });
    };
    const handleAddLyricsLine = (language: string, blockIdx: number) => {
        setEditStructuredLyrics((prev: any) => {
            const langBlocks = Array.isArray(prev?.[language]) ? prev[language] : [];
            return {
                ...prev,
                [language]: langBlocks.map((b: any, i: number) =>
                    i === blockIdx ? { ...b, lines: [...b.lines, ''] } : b
                ),
            };
        });
    };

    // Real save handler
    const handleSave = async () => {
        if (!release?.id) {
            setSaveError('No release ID available');
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            const updatedRelease = {
                // Basic fields (camelCase to match CMS)
                title: editTitle,
                description: editDescription,
                // Feature toggles
                enableCredits: editEnableCredits,
                enableCommentary: editEnableCommentary,
                enableSponsors: editEnableSponsors,
                enableAdoption: editEnableAdoption,
                enableLyrics: editEnableLyrics,
                durationSeconds: masterTimingDuration || release?.duration_seconds || 0,
                // Language/subtitle fields
                availableLanguages: editAvailableLanguages,
                defaultLanguage: editDefaultLanguage,
                subtitleLanguageStatuses: editLanguageStatuses,
                subtitleCues: editSubtitleCues,
                subtitleTranslations: editSubtitleTranslations,
                // Content fields
                publicCredits: editCredits,
                publicCommentary: [{ id: 'main', type: 'text', title: 'Commentary & Insights', content: editCommentary, isPublished: true }],
                publicSponsors: editSponsors,
                publicSponsorsIntro: editSponsorsIntro,
                lyricsStructure: editStructuredLyrics,
                lyrics: {
                    ...(release.lyrics || {}),
                    [selectedLyricsLanguage]: editLyrics,
                },
            };

            const response = await fetch(`/api/releases/${release.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedRelease),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Save failed: ${response.status}`);
            }

            const saved = await response.json();
            // Update local release state with saved data (normalized)
            setRelease((prev: any) => ({
                ...prev,
                ...saved,
                release_title: editTitle,
                description: editDescription,
                enable_credits: editEnableCredits,
                enable_commentary: editEnableCommentary,
                enable_sponsors: editEnableSponsors,
                enable_adoption: editEnableAdoption,
                enable_lyrics: editEnableLyrics,
                duration_seconds: masterTimingDuration || release?.duration_seconds || 0,
                availableLanguages: editAvailableLanguages,
                defaultLanguage: editDefaultLanguage,
                subtitleLanguageStatuses: editLanguageStatuses,
                subtitle_cues: editSubtitleCues,
                subtitle_translations: editSubtitleTranslations,
                public_credits: editCredits,
                public_commentary: [{ id: 'main', type: 'text', title: 'Commentary & Insights', content: editCommentary, isPublished: true }],
                public_sponsors: editSponsors,
                public_sponsors_intro: editSponsorsIntro,
                lyrics_structure: editStructuredLyrics,
            }));
            setSaveSuccess(true);

            // Clear success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error saving release:', err);
            setSaveError(err.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <PageContainer>
                    <div className="max-w-7xl mx-auto animate-pulse">
                        {/* Title skeleton */}
                        <div className="mb-8">
                            <div className="h-4 w-24 bg-neutral-800 rounded mb-5" />
                            <div className="h-12 w-3/4 bg-neutral-800 rounded mb-4" />
                            <div className="h-12 w-1/2 bg-neutral-800 rounded mb-6" />
                            <div className="flex gap-4">
                                <div className="h-4 w-28 bg-neutral-800 rounded" />
                                <div className="h-4 w-20 bg-neutral-800 rounded" />
                                <div className="h-4 w-24 bg-neutral-800 rounded" />
                            </div>
                        </div>
                        {/* Video placeholder */}
                        <div className="relative w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden mb-8" style={{ paddingBottom: '56.25%' }}>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center">
                                        <Play className="w-7 h-7 text-neutral-700 ml-1" />
                                    </div>
                                    <div className="h-3 w-32 bg-neutral-800 rounded" />
                                </div>
                            </div>
                        </div>
                        {/* Tab bar skeleton */}
                        <div className="flex gap-2 mb-8">
                            {[80, 64, 72, 60, 68].map((w, i) => (
                                <div key={i} className="h-9 rounded-full bg-neutral-800" style={{ width: w }} />
                            ))}
                        </div>
                        {/* Content skeleton */}
                        <div className="space-y-4 max-w-2xl">
                            <div className="h-4 w-full bg-neutral-800 rounded" />
                            <div className="h-4 w-5/6 bg-neutral-800 rounded" />
                            <div className="h-4 w-4/6 bg-neutral-800 rounded" />
                            <div className="h-4 w-3/4 bg-neutral-800 rounded" />
                        </div>
                    </div>
                </PageContainer>
            </Layout>
        );
    }

    if (error || !release) {
        return (
            <Layout>
                <PageContainer>
                    <div className="max-w-5xl mx-auto flex items-center justify-center min-h-96">
                        <div className="text-neutral-500">{error || 'Release not found'}</div>
                    </div>
                </PageContainer>
            </Layout>
        );
    }

    const formatCurrency = (cents: number) => {
        return (cents / 100).toFixed(2);
    };

    const formatDescription = (text: string) => {
        const sections = text.split(/\n{2,}/);
        return sections.map((section, index) => {
            const lines = section.split('\n').filter(line => line.trim());
            return (
                <div key={index} className={index > 0 ? 'mt-6' : ''}>
                    {lines.map((line, lineIndex) => {
                        if (line.match(/^\d{2}:\d{2}/)) {
                            return (
                                <div key={lineIndex} className="text-neutral-400 text-base mb-1.5 font-medium">
                                    {line}
                                </div>
                            );
                        }
                        if (line.includes('Language:') || line.includes('Theme:') || line.includes('Produced under')) {
                            return (
                                <div key={lineIndex} className="text-neutral-400 text-base mb-1.5 flex items-center gap-2">
                                    {line.split('◆').map((part, i) =>
                                        i === 0 ? <span key={i}>{part}</span> : <span key={i} className="text-neutral-500">◆ {part}</span>
                                    )}
                                </div>
                            );
                        }
                        if (line.startsWith('#')) {
                            return (
                                <div key={lineIndex} className="text-neutral-500 text-sm mt-4">
                                    {line}
                                </div>
                            );
                        }
                        return (
                            <p key={lineIndex} className="text-neutral-300 text-base leading-relaxed mb-3">
                                {line}
                            </p>
                        );
                    })}
                </div>
            );
        });
    };

    const isLegacy = release.source === 'youtube_legacy';
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => {
            setCopySuccess(false);
            setShowCopyModal(false);
        }, 2000);
    };

    const getYouTubeShareUrl = (withTimestamp = false) => {
        if (!resolvedVideoId) return window.location.href;
        const t = withTimestamp ? Math.floor(currentTime || 0) : 0;
        return t > 0
            ? `https://www.youtube.com/watch?v=${resolvedVideoId}&t=${t}`
            : `https://www.youtube.com/watch?v=${resolvedVideoId}`;
    };

    const handleShare = (platform: string) => {
        // Social platforms: share YouTube URL so YouTube records external traffic
        const ytUrl = encodeURIComponent(getYouTubeShareUrl());
        const siteUrl = encodeURIComponent(window.location.href);
        const title = release?.release_title || 'SufiPulse Release';
        const shareText = encodeURIComponent(
            `🎵 "${title}" — Sacred Sufi music with multilingual lyrics`
        );
        const hashTags = 'SufiMusic,Kalam,SufiPulse';

        const urls: Record<string, string> = {
            twitter:  `https://twitter.com/intent/tweet?url=${ytUrl}&text=${shareText}&hashtags=${hashTags}`,
            whatsapp: `https://wa.me/?text=${shareText}%0A${ytUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${ytUrl}`,
            telegram: `https://t.me/share/url?url=${ytUrl}&text=${shareText}`,
            // LinkedIn keeps website URL — professional context
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${siteUrl}`,
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
    };

    const handleShareMoment = () => {
        const ytUrl = getYouTubeShareUrl(true);
        navigator.clipboard.writeText(ytUrl);
        setToastMessage('Timestamped YouTube link copied!');
        setToastType('success');
        setTimeout(() => setToastMessage(null), 3000);
    };

    const getAvailableLanguages = () => {
        const legacy = release.lyrics ? Object.keys(release.lyrics).filter((key) => release.lyrics[key]) : [];
        const structured = Object.keys(lyricsStructureMap || {}).filter((key) => Array.isArray(lyricsStructureMap[key]));
        return Array.from(new Set([...legacy, ...structured]));
    };

    const exportVttFile = () => {
        const lang = selectedLyricsLanguage || 'english';
        
        // Use actively edited state if editing, otherwise fallback to saved DB state
        const cues = isEditing ? editSubtitleCues : (release?.subtitleCues || []);
        const translations = isEditing 
            ? (editSubtitleTranslations[lang] || {})
            : (release?.subtitleTranslations?.[lang] || {});

        if (!cues.length) {
            alert("No timestamp cues found to export. Please generate master timing first.");
            return;
        }

        const toVTTTime = (timeStr: string) => {
            let parts = timeStr.trim().split(':');
            let secPart = parts[parts.length - 1] || "00";
            let minPart = parts.length > 1 ? parts[parts.length - 2] : "00";
            let hrPart = parts.length > 2 ? parts[parts.length - 3] : "00";
            
            let seconds = secPart;
            if (!seconds.includes('.')) {
                seconds += '.000';
            } else {
                let [s, ms] = seconds.split('.');
                ms = ms.padEnd(3, '0').slice(0,3);
                seconds = `${s.padStart(2, '0')}.${ms}`;
            }
            
            return `${hrPart.padStart(2, '0')}:${minPart.padStart(2, '0')}:${seconds}`;
        };

        let vttContent = "WEBVTT\n\n";

        cues.forEach((cue: any, idx: number) => {
            const text = translations[cue.id] || "";
            if (!text.trim()) return;
            
            const startStr = toVTTTime(cue.startTime);
            const endStr = toVTTTime(cue.endTime);

            vttContent += `${idx + 1}\n`;
            vttContent += `${startStr} --> ${endStr}\n`;
            vttContent += `${text}\n\n`;
        });

        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${release?.slug || 'video'}-${lang}.vtt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Layout>
            <PageContainer>
                <div className="max-w-7xl mx-auto">
                    <div className="sr-only" aria-hidden="true" data-resolution-source={resolutionSource || 'unknown'}>
                        resolution_source: {resolutionSource || 'unknown'}
                    </div>
                    {/* Admin Edit Controls */}
                    {isAdmin && (
                        <div className="flex justify-end mb-4 gap-3">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-amber-400 hover:text-amber-300 border border-amber-800/50 hover:border-amber-700/60 rounded transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Inline Edit
                                    </button>
                                    {release?.id && (
                                        <Link
                                            href={`/admin/cms-releases/${release.id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 border border-blue-800/50 hover:border-blue-700/60 rounded transition-colors"
                                        >
                                            <Sliders className="w-4 h-4" />
                                            Full CMS Editor
                                        </Link>
                                    )}
                                </>
                            ) : (
                                <div className="text-sm text-amber-400 flex items-center gap-2">
                                    <Edit className="w-4 h-4" />
                                    <span>Inline editing mode active - use the save bar at the bottom</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Inline Editing Info Panel */}
                    {isAdmin && isEditing && (
                        <div className="mb-6 p-4 bg-amber-900/10 border border-amber-800/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Edit className="w-5 h-5 text-amber-400 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-amber-300 mb-2">Inline Editing for Legacy Releases</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-400">
                                        <div>
                                            <span className="text-neutral-300 font-medium">Quick edits available:</span>
                                            <ul className="mt-1 space-y-0.5">
                                                <li>• Title & description</li>
                                                <li>• Production credits</li>
                                                <li>• Commentary blocks</li>
                                                <li>• Sponsors & sponsors intro</li>
                                                <li>• Feature toggles</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="text-neutral-300 font-medium">Lyrics & Languages:</span>
                                            <ul className="mt-1 space-y-0.5">
                                                <li>• Add up to 17 languages</li>
                                                <li>• Master timed lyrics (with timestamps)</li>
                                                <li>• Auto-sync translations to master timing</li>
                                                <li>• CC language display on video</li>
                                                <li>• Language status management</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="text-neutral-300 font-medium">Advanced editing (use Full CMS Editor):</span>
                                            <ul className="mt-1 space-y-0.5">
                                                <li>• Subtitle cues & fine-tuned timing</li>
                                                <li>• ASS style packs for lyrics</li>
                                                <li>• YouTube sync & delivery</li>
                                                <li>• Bulk operations</li>
                                                <li>• Live ASS preview</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hero Section */}
                    <div className="mb-12">
                        {/* Badge and Title */}
                        <div className="mb-8">
                            {isLegacy ? (
                                <Badge variant="neutral" className="mb-4">
                                    Registered Release
                                </Badge>
                            ) : (
                                <Badge variant="gold" className="mb-4 gap-2">
                                    <Lock className="w-3 h-3" />
                                    Governed Release
                                </Badge>
                            )}
                            <div className="flex items-start justify-between gap-4 mb-6">
                                {isEditing ? (
                                    <input
                                        className="text-3xl md:text-4xl font-serif font-light text-neutral-100 leading-tight flex-1 bg-neutral-800 border border-amber-800/50 rounded-lg px-4 py-3 focus:outline-none focus:border-amber-600"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        placeholder="Release title"
                                    />
                                ) : (
                                    <h1 className="text-5xl md:text-6xl font-serif font-light text-neutral-100 leading-tight flex-1">
                                        {release.release_title}
                                    </h1>
                                )}
                                {/* <Link
                                    href={`/admin/releases/${release.slug}/credits`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded transition-colors text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Production Credits
                                </Link> */}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(release.release_date)}</span>
                                </div>
                                {release.duration_seconds && (
                                    <>
                                        <span className="text-neutral-700">•</span>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{formatDuration(release.duration_seconds)}</span>
                                        </div>
                                    </>
                                )}
                                {isLegacy && release.views !== undefined && release.views > 0 && (
                                    <>
                                        <span className="text-neutral-700">•</span>
                                        <div className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            <span>{release.views.toLocaleString()} views</span>
                                        </div>
                                    </>
                                )}
                                {isLegacy && release.likes !== undefined && release.likes > 0 && (
                                    <>
                                        <span className="text-neutral-700">•</span>
                                        <div className="flex items-center gap-2">
                                            <ThumbsUp className="w-4 h-4" />
                                            <span>{release.likes.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Video Player - Hero Position */}
                        {(resolvedVideoId || (release.youtube_url && !release.youtube_url.includes('PLACEHOLDER'))) ? (
                            <div className="mb-8">
                                <div
                                    ref={containerRef}
                                    onContextMenu={(e) => e.preventDefault()}
                                    className={`bg-black overflow-hidden relative group ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none' : 'aspect-video rounded-lg shadow-2xl border border-neutral-800'}`}
                                >
                                    {!videoLoaded && (
                                        <>
                                            <img
                                                src={thumbnailCandidates[0]}
                                                alt={release.release_title}
                                                className="w-full h-full object-cover"
                                                data-thumb-index="0"
                                                onError={(e) => {
                                                    advanceThumbnailFallback(e.currentTarget, thumbnailCandidates);
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <button
                                                    onClick={() => {
                                                        setVideoReady(false);
                                                        setVideoLoaded(true);
                                                    }}
                                                    className="w-20 h-20 flex items-center justify-center bg-white hover:bg-white/95 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.3)] transform group-hover:scale-110 transition-all"
                                                    aria-label="Play video"
                                                >
                                                    <Play className="w-10 h-10 text-red-600 ml-1.5" fill="currentColor" />
                                                </button>
                                            </div>
                                            {release.duration_seconds && (
                                                <div className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded text-sm text-white font-medium">
                                                    {formatDuration(release.duration_seconds)}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {videoLoaded && (
                                        <>
                                            <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                                <YouTube
                                                    videoId={resolvedVideoId}
                                                    opts={{
                                                        width: '100%',
                                                        height: '100%',
                                                        playerVars: {
                                                            controls: 0,
                                                            autoplay: 1,
                                                            modestbranding: 1,
                                                            rel: 0,
                                                            playsinline: 1,
                                                            disablekb: 1,
                                                            fs: 0,
                                                            cc_load_policy: 0,
                                                            iv_load_policy: 3
                                                        }
                                                    }}
                                                    onReady={(e) => {
                                                        setPlayerTarget(e.target);
                                                        try {
                                                            const currentRate = e.target?.getPlaybackRate?.();
                                                            if (currentRate) {
                                                                setPlaybackRate(Number(currentRate));
                                                            }
                                                            const rates = e.target?.getAvailablePlaybackRates?.();
                                                            if (rates && Array.isArray(rates) && rates.length > 0) {
                                                                setAvailableRates(rates);
                                                            }
                                                            const qualities = e.target?.getAvailableQualityLevels?.();
                                                            if (qualities && Array.isArray(qualities) && qualities.length > 0) {
                                                                setAvailableQualities(qualities);
                                                            }
                                                            const duration = e.target?.getDuration?.();
                                                            if (duration) {
                                                                setVideoDuration(Number(duration));
                                                            }
                                                        } catch {
                                                            // ignore read failures
                                                        }
                                                        try {
                                                            // Force-hide YouTube native captions so only CMS-managed captions are shown.
                                                            e.target?.setOption?.('captions', 'track', {});
                                                        } catch (err) {
                                                            console.debug('Unable to override YouTube caption track', err);
                                                        }
                                                        setVideoReady(true);
                                                    }}
                                                    onStateChange={(event) => {
                                                        const state = event?.data;
                                                        setIsPlaying(state === 1);
                                                        if (state === 1) {
                                                            setIsVideoEnded(false);
                                                        }
                                                        if (state === 0) {
                                                            setIsVideoEnded(true);
                                                        }
                                                    }}
                                                    className="w-full h-full absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full"
                                                />
                                            </div>
                                            {/* Video Overlay for Captions */}
                                            {activeOverlayTrack && (
                                                <VideoOverlay
                                                    track={activeOverlayTrack}
                                                    currentTime={currentTime}
                                                    captionsEnabled={captionsEnabled}
                                                    fontSizeScale={subtitleFontScale}
                                                />
                                            )}
                                            {/* CC Language Indicator Badge */}
                                            {captionsEnabled && selectedCaptionLanguage && (
                                                <div className="absolute top-4 left-4 z-[25] bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-blue-500/30 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                    <span className="text-xs text-blue-200 font-medium">
                                                        CC: {getLanguageLabel(selectedCaptionLanguage)}
                                                        {!activeOverlayTrack && ' (no timed lyrics)'}
                                                    </span>
                                                </div>
                                            )}
                                            {/* No Caption Track Warning (admin only) */}
                                            {isAdmin && isEditing && captionsEnabled && !activeOverlayTrack && (
                                                <div className="absolute top-4 right-4 z-[25] bg-amber-900/90 backdrop-blur-sm px-3 py-2 rounded-md border border-amber-500/30 max-w-xs">
                                                    <p className="text-xs text-amber-200 font-medium mb-1">⚠️ No Timed Lyrics</p>
                                                    <p className="text-[10px] text-amber-300/80 leading-relaxed">
                                                        Add subtitle cues with translations in the Subtitles tab, or add lyrics with timestamps in the Lyrics tab.
                                                    </p>
                                                </div>
                                            )}
                                            {!videoReady && (
                                                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded text-xs text-neutral-400 pointer-events-none z-[11]">
                                                    If video doesn't load, open this page in a new tab
                                                </div>
                                            )}

                                            <div className="absolute left-0 right-0 bottom-0 z-[24] p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={togglePlayback}
                                                        className="p-2 rounded-md bg-black/55 hover:bg-black/80 text-white border border-white/10"
                                                        title={isPlaying ? 'Pause' : 'Play'}
                                                    >
                                                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </button>

                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={videoDuration || 0}
                                                        value={Math.min(currentTime, videoDuration || currentTime)}
                                                        onChange={(e) => scrubTo(Number(e.target.value))}
                                                        className="flex-1 accent-amber-500"
                                                    />

                                                    <span className="text-xs text-neutral-200 min-w-[84px] text-right">
                                                        {formatDuration(Math.floor(currentTime || 0))} / {formatDuration(Math.floor(videoDuration || 0))}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="absolute top-4 right-4 z-[25] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setShowPlayerSettings((prev) => !prev)}
                                                    className="p-2 bg-black/60 hover:bg-black/90 rounded-md text-white backdrop-blur-sm border border-white/10"
                                                    title="Player settings"
                                                >
                                                    <Settings2 className="w-5 h-5" />
                                                </button>

                                                {showPlayerSettings && (
                                                    <div className="absolute right-0 mt-2 w-64 bg-neutral-900/95 border border-neutral-700 rounded-lg shadow-2xl p-3 space-y-3 backdrop-blur-md">
                                                        <div className="flex items-center gap-2 pb-2 border-b border-neutral-800">
                                                            <img
                                                                src="/sufipulse-logo-v5.png"
                                                                alt="SufiPulse"
                                                                className="w-6 h-6 rounded object-cover"
                                                            />
                                                            <div>
                                                                <p className="text-xs font-semibold text-neutral-100">SufiPulse Player</p>
                                                                <p className="text-[10px] text-neutral-500">Web App Controls</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs uppercase tracking-wide text-neutral-400">Playback</p>
                                                            <button
                                                                onClick={toggleFullscreen}
                                                                className="text-xs text-neutral-200 hover:text-white inline-flex items-center gap-1"
                                                            >
                                                                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                                                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                                            </button>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-neutral-400 mb-1">Speed</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {availableRates.map((rate) => (
                                                                    <button
                                                                        key={rate}
                                                                        onClick={() => setPlayerRate(rate)}
                                                                        className={`text-xs rounded px-2 py-1 flex-1 min-w-[36px] ${playbackRate === rate ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                                                                    >
                                                                        {rate}x
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-neutral-400 mb-1">Quality</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {availableQualities.map((quality) => (
                                                                    <button
                                                                        key={quality}
                                                                        onClick={() => setPlayerQuality(quality)}
                                                                        className={`text-[11px] rounded px-2 py-1 flex-1 min-w-[50px] ${playbackQuality === quality ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                                                                    >
                                                                        {quality}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-neutral-400 mb-1">Text Size</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {[{ label: '50%', scale: 0.5 }, { label: '75%', scale: 0.75 }, { label: '100%', scale: 1 }, { label: '150%', scale: 1.5 }, { label: '200%', scale: 2 }, { label: '300%', scale: 3 }].map((fontSettings) => (
                                                                    <button
                                                                        key={fontSettings.label}
                                                                        onClick={() => setSubtitleFontScale(fontSettings.scale)}
                                                                        className={`text-[11px] rounded px-2 py-1 flex-1 min-w-[42px] ${subtitleFontScale === fontSettings.scale ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                                                                    >
                                                                        {fontSettings.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-neutral-400 mb-1">Captions Source</p>
                                                            <div className="text-xs text-neutral-200 bg-neutral-800 rounded px-2 py-1 mb-2">
                                                                SufiPulse CMS (Internal)
                                                            </div>
                                                            <select
                                                                value={selectedCaptionLanguage}
                                                                onChange={(e) => {
                                                                    const nextLang = e.target.value;
                                                                    setSelectedCaptionLanguage(nextLang);
                                                                    setSelectedSubtitleLanguage(nextLang);
                                                                    if (LANGUAGE_OPTIONS.some((option) => option.key === nextLang)) {
                                                                        setSelectedLyricsLanguage(nextLang as LanguageKey);
                                                                    }
                                                                }}
                                                                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1.5 text-xs text-neutral-200"
                                                            >
                                                                {captionLanguageOptions.map((option) => (
                                                                    <option key={option.key} value={option.key}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {!cmsCaptionTrack && (
                                                                <p className="mt-2 text-[11px] text-amber-300">
                                                                    {getLanguageLabel(selectedCaptionLanguage)} subtitles not yet updated
                                                                </p>
                                                            )}
                                                            <button
                                                                onClick={() => setCaptionsEnabled((prev) => !prev)}
                                                                className={`mt-2 text-xs rounded px-2 py-1 ${captionsEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
                                                            >
                                                                {captionsEnabled ? 'CC On' : 'CC Off'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video bg-neutral-900 border border-neutral-800 rounded-lg mb-8 flex items-center justify-center">
                                <div className="text-center">
                                    <Music className="w-16 h-16 text-neutral-700 mx-auto mb-4" strokeWidth={1} />
                                    <div className="text-neutral-500">Video Distribution Pending</div>
                                </div>
                            </div>
                        )}

                        {isVideoEnded && (
                            <div className="mb-8 rounded-xl border border-amber-500/20 bg-gradient-to-r from-neutral-900 via-neutral-900/95 to-neutral-900 p-4 sm:p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Playback Complete</p>
                                        <h3 className="mt-1 text-lg font-semibold text-neutral-100">Continue the SufiPulse Journey</h3>
                                        <p className="mt-1 text-sm text-neutral-400">Listen to another release, subscribe on YouTube, or join SufiPulse.</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            href="/releases"
                                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700"
                                        >
                                            <Music className="h-4 w-4" />
                                            Next Song
                                        </Link>
                                        <a
                                            href="https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ?sub_confirmation=1"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                            </svg>
                                            Subscribe
                                        </a>
                                        <Link
                                            href={joinSufiPulseUrl}
                                            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/20"
                                        >
                                            Join SufiPulse
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tabs & Action Buttons */}
                        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 mb-8 border-b border-neutral-800">
                            <div className="flex justify-between w-full lg:w-auto gap-0.5 sm:gap-2 pb-0">
                                {release.enable_credits !== false && (
                                    <button
                                        onClick={() => setActiveTab('credits')}
                                        className={`px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap ${activeTab === 'credits'
                                            ? 'text-neutral-100'
                                            : 'text-neutral-500 hover:text-neutral-300'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Credits
                                        </span>
                                        {activeTab === 'credits' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                        )}
                                    </button>
                                )}
                                {/* <button
                                    onClick={() => setActiveTab('production')}
                                    className={`px-4 sm:px-6 py-3 font-medium transition-all relative whitespace-nowrap ${activeTab === 'production'
                                        ? 'text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    Production
                                    {activeTab === 'production' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                    )}
                                </button> */}


                                <button
                                    onClick={() => setActiveTab('lyrics')}
                                    className={`px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap ${activeTab === 'lyrics'
                                        ? 'text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    <span className="flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">LYRICS IN 17 LANGUAGES</span>
                                        <span className="inline sm:hidden">LYRICS</span>
                                    </span>
                                    {activeTab === 'lyrics' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                    )}
                                </button>
                                {/* <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`px-4 sm:px-6 py-3 font-medium transition-all relative whitespace-nowrap ${activeTab === 'overview'
                                        ? 'text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    Overview
                                    {activeTab === 'overview' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                    )}
                                </button> */}
                                {release.enable_adoption !== false && (
                                    <button
                                        onClick={() => setActiveTab('adopt')}
                                        className={`px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap ${activeTab === 'adopt'
                                            ? 'text-neutral-100'
                                            : 'text-neutral-500 hover:text-neutral-300'
                                            }`}
                                    >
                                        Adopt
                                        {activeTab === 'adopt' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                        )}
                                    </button>
                                )}
                                {release.enable_commentary !== false && (
                                    <button
                                        onClick={() => setActiveTab('commentary')}
                                        className={`px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap ${activeTab === 'commentary'
                                            ? 'text-neutral-100'
                                            : 'text-neutral-500 hover:text-neutral-300'
                                            }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Commentary</span>
                                            <span className="inline sm:hidden">Notes</span>
                                        </span>
                                        {activeTab === 'commentary' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                        )}
                                    </button>
                                )}
                                {release.enable_sponsors && (
                                    <button
                                        onClick={() => setActiveTab('sponsors')}
                                        className={`px-2 sm:px-4 py-3 font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap ${activeTab === 'sponsors'
                                            ? 'text-neutral-100'
                                            : 'text-neutral-500 hover:text-neutral-300'
                                            }`}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            Sponsors
                                        </span>
                                        {activeTab === 'sponsors' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 sm:gap-3 lg:pb-2 flex-shrink-0">
                                <a
                                    href="https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ?sub_confirmation=1"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-red-900/30 whitespace-nowrap"
                                    aria-label="Subscribe to SufiPulse on YouTube"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                    Subscribe
                                </a>
                                {resolvedVideoId && (
                                    <a
                                        href={`https://www.youtube.com/watch?v=${resolvedVideoId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-red-900/30 whitespace-nowrap"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        <span className="hidden sm:inline">Watch on YouTube</span>
                                        <span className="inline sm:hidden">YouTube</span>
                                    </a>
                                )}
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mb-16">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-2xl font-medium text-neutral-100 mb-6">About This Release</h3>
                                    {isEditing ? (
                                        <textarea
                                            className="w-full bg-neutral-950 border border-amber-800/50 rounded-lg p-4 text-sm text-neutral-200 font-serif leading-relaxed focus:outline-none focus:border-amber-600 placeholder:text-neutral-600"
                                            rows={12}
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                            placeholder="Description / About text for this release..."
                                        />
                                    ) : (
                                        <div className="prose prose-invert max-w-none">
                                            <div className="text-neutral-300 leading-relaxed space-y-4 text-base">
                                                {formatDescription(release.description)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Credits Tab */}
                        {activeTab === 'credits' && release.enable_credits !== false && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-3xl font-serif font-light text-neutral-100">Official Credits</h3>
                                        {isEditing && (
                                            <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 px-3 py-1 rounded">
                                                ✏️ Editing Mode — click any field to edit
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Artistic Credits */}
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Mic className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Artistic Credits</h4>
                                            </div>
                                            <div className="space-y-4">
                                                {(() => {
                                                    const ARTISTIC_SEEDS: Record<string, string> = {
                                                        lyricist: 'Dr. Zarf-e-Noori',
                                                        composer: 'Dr. Zarf-e-Noori',
                                                        musicProducer: 'Dr. Zarf-e-Noori',
                                                        backgroundVocals: '',
                                                        leadVocalist: ''
                                                    };

                                                    return [
                                                        { label: 'Lead Vocalist', section: 'artistic', key: 'leadVocalist' },
                                                        { label: 'Lyricist', section: 'artistic', key: 'lyricist' },
                                                        { label: 'Composer', section: 'artistic', key: 'composer' },
                                                        { label: 'Music Producer', section: 'artistic', key: 'musicProducer' },
                                                        { label: 'Background Vocals', section: 'artistic', key: 'backgroundVocals' },
                                                    ].map((field) => {
                                                        const seed = ARTISTIC_SEEDS[field.key] || '';
                                                        const actualVal = isEditing 
                                                            ? editCredits?.[field.section]?.[field.key]
                                                            : (release?.public_credits?.[field.section]?.[field.key]);
                                                        
                                                        const val = (actualVal !== undefined && actualVal !== null && actualVal !== '') ? actualVal : seed;

                                                        return isEditing ? (
                                                            <div key={field.key}>
                                                                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{field.label}</p>
                                                                <input
                                                                    className="w-full bg-neutral-800 border border-amber-800/40 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-600 placeholder:text-neutral-600"
                                                                    value={val}
                                                                    placeholder={field.label}
                                                                    onChange={e => setEditCredits((prev: any) => ({
                                                                        ...prev,
                                                                        [field.section]: { ...(prev[field.section] || {}), [field.key]: e.target.value },
                                                                    }))}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div key={field.key}>
                                                                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{field.label}</p>
                                                                <p className="text-neutral-200">{val || '—'}</p>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>

                                        {(() => {
                                            const CREDITS_SEEDS: Record<string, Record<string, string>> = {
                                                production: {
                                                    recordedAt: 'SufiPulse Studio',
                                                    recordingEngineer: 'Lucas Ray, Michael "SufiPulse" Hartman',
                                                    mixMaster: 'Ryan Cole, Elijah James',
                                                    soundDesign: 'Elijah James',
                                                },
                                                visual: {
                                                    videoDirection: 'SufiPulse Visuals',
                                                    editing: 'SufiPulse Media Team',
                                                    thumbnailDesign: 'SufiPulse Design Team',
                                                    artwork: 'SufiPulse Design Team',
                                                },
                                                literary: {
                                                    romanTransliteration: 'SufiPulse Editorial',
                                                    englishTranslation: 'Literary Committee',
                                                    thematicInterpretation: 'Literary Committee',
                                                    proofreading: 'SufiPulse Editorial',
                                                },
                                                rights: {
                                                    publishedBy: 'SufiPulse USA',
                                                    platform: 'SufiTube',
                                                    registeredReleaseId: 'KS-2026',
                                                    releaseDateText: 'Public Release',
                                                    copyrightHolder: 'SufiPulse USA',
                                                    licensingUrl: 'Standard SufiPulse License',
                                                }
                                            };

                                            const renderSeededSection = (icon: any, title: string, sectionKey: string, fields: {label: string, key: string}[]) => (
                                                <div className={`p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl ${sectionKey === 'rights' ? 'md:col-span-2' : ''}`}>
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                            {icon}
                                                        </div>
                                                        <h4 className="text-xl font-medium text-neutral-100">{title}</h4>
                                                    </div>
                                                    <div className={sectionKey === 'rights' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                                                        {fields.map(field => {
                                                            const seed = CREDITS_SEEDS[sectionKey]?.[field.key] || '';
                                                            // For editing, show the actual stored value so the placeholder acts as hint, or if empty, forcefully seed it
                                                            const actualVal = isEditing
                                                                ? editCredits?.[sectionKey]?.[field.key]
                                                                : (release?.public_credits?.[sectionKey]?.[field.key]);
                                                            const displayVal = (actualVal !== undefined && actualVal !== null) ? actualVal : seed;
                                                            
                                                            return isEditing ? (
                                                                <div key={field.key}>
                                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{field.label}</p>
                                                                    <input
                                                                        className="w-full bg-neutral-800 border border-amber-800/40 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-600 placeholder:text-neutral-500"
                                                                        value={displayVal}
                                                                        placeholder={`e.g. ${seed}`}
                                                                        onChange={e => setEditCredits((prev: any) => ({
                                                                            ...prev,
                                                                            [sectionKey]: { ...(prev[sectionKey] || {}), [field.key]: e.target.value },
                                                                        }))}
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div key={field.key}>
                                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">{field.label}</p>
                                                                    <p className="text-neutral-200">{displayVal || '—'}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );

                                            return (
                                                <>
                                                    {renderSeededSection(<Sliders className="w-5 h-5 text-amber-400" />, "Production Credits", "production", [
                                                        { label: 'Recorded at', key: 'recordedAt' },
                                                        { label: 'Recording Engineer', key: 'recordingEngineer' },
                                                        { label: 'Mix & Master', key: 'mixMaster' },
                                                        { label: 'Sound Design', key: 'soundDesign' },
                                                    ])}
                                                    {renderSeededSection(<Video className="w-5 h-5 text-amber-400" />, "Visual Credits", "visual", [
                                                        { label: 'Video Direction', key: 'videoDirection' },
                                                        { label: 'Editing', key: 'editing' },
                                                        { label: 'Thumbnail Design', key: 'thumbnailDesign' },
                                                        { label: 'Artwork', key: 'artwork' },
                                                    ])}
                                                    {renderSeededSection(<Book className="w-5 h-5 text-amber-400" />, "Literary & Language", "literary", [
                                                        { label: 'Roman Transliteration', key: 'romanTransliteration' },
                                                        { label: 'English Translation', key: 'englishTranslation' },
                                                        { label: 'Thematic Interpretation', key: 'thematicInterpretation' },
                                                        { label: 'Proofreading', key: 'proofreading' },
                                                    ])}
                                                    {renderSeededSection(<Shield className="w-5 h-5 text-amber-400" />, "Release & Rights", "rights", [
                                                        { label: 'Published by', key: 'publishedBy' },
                                                        { label: 'Platform', key: 'platform' },
                                                        { label: 'Registered Release ID', key: 'registeredReleaseId' },
                                                        { label: 'Release Date', key: 'releaseDateText' },
                                                        { label: 'Copyright Holder', key: 'copyrightHolder' },
                                                        { label: 'Licensing / Permissions', key: 'licensingUrl' },
                                                    ])}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Production Tab */}
                        {/* {activeTab === 'production' && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-3xl font-serif font-light text-neutral-100 mb-8">Production Record</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        
                                        Production Summary
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors md:col-span-2">
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Production Summary</h4>
                                            </div>
                                            <div className="relative text-neutral-300 leading-relaxed max-w-4xl">
                                                <p>This release was developed as a studio devotional recording with an accompanying visual presentation. The production focused on a restrained sonic atmosphere so the lyrical invocation remained central. Final output includes video, synchronized lyrics, and registered release metadata.</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-800/50">
                                                    <div><span className="block text-xs text-neutral-500 uppercase">Type</span><span className="text-sm text-neutral-200">Studio Audio/Visual</span></div>
                                                    <div><span className="block text-xs text-neutral-500 uppercase">Format</span><span className="text-sm text-neutral-200">Digital Release</span></div>
                                                    <div><span className="block text-xs text-neutral-500 uppercase">Status</span><span className="text-sm text-neutral-200">Final Master</span></div>
                                                    <div><span className="block text-xs text-neutral-500 uppercase">Location</span><span className="text-sm text-neutral-200">SufiPulse Studio</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        Audio Production
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Sliders className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Audio Production</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <p className="text-neutral-300 text-sm leading-relaxed mb-4">Vocals were recorded in a controlled studio session with a close-mic intimate delivery style. The arrangement was intentionally minimal, using soft harmonic support and light rhythmic depth to preserve meditative concentration. Mixing prioritized vocal clarity, warmth, and lyrical intelligibility.</p>
                                                <div className="space-y-3">
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Method:</span><span className="text-sm text-neutral-200">Close-mic studio capture</span></div>
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Arrangement:</span><span className="text-sm text-neutral-200">Minimalist ambient support</span></div>
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Mix/Master:</span><span className="text-sm text-neutral-200">Vocal-forward clarity</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        Visual Production
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Video className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Visual Production</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <p className="text-neutral-300 text-sm leading-relaxed mb-4">The visual treatment followed a contemplative studio aesthetic rather than a narrative cinematic structure. Editing was paced to support reflection, with clean transitions and restrained motion. Thumbnail and frame composition were designed to align with the spiritual seriousness of the release.</p>
                                                <div className="space-y-3">
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Type:</span><span className="text-sm text-neutral-200">Studio Performance</span></div>
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Editing Style:</span><span className="text-sm text-neutral-200">Paced for reflection</span></div>
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Visual Tone:</span><span className="text-sm text-neutral-200">Restrained & Contemplative</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        Creative Direction
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Book className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Creative Direction</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <p className="text-neutral-300 text-sm leading-relaxed mb-4">The production approach was shaped by the central theme of stepping away from ego. Both the sonic and visual language were kept uncluttered so the release conveyed inwardness, humility, and invitation rather than performance spectacle.</p>
                                                <div className="space-y-3">
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Thematic Objective:</span><span className="text-sm text-neutral-200">Inwardness & Humility</span></div>
                                                    <div><span className="text-xs text-neutral-500 uppercase mr-2">Spiritual Framing:</span><span className="text-sm text-neutral-200">Stepping away from ego</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        Production Workflow
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Clock className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Workflow Timeline</h4>
                                            </div>
                                            <div className="relative">
                                                <div className="space-y-4 relative before:absolute before:inset-0 before:left-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
                                                    {[
                                                        "Concept alignment",
                                                        "Studio recording",
                                                        "Mix/Master approved",
                                                        "Visual edit finalized",
                                                        "Metadata review",
                                                        "Distribution linked to YouTube"
                                                    ].map((step, i) => (
                                                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                                            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-neutral-800 bg-neutral-900 group-hover:bg-amber-400/20 group-hover:border-amber-400/50 transition-colors shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                                <Check className="w-3 h-3 text-amber-500" />
                                                            </div>
                                                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] pl-3 md:pl-0 md:group-odd:pr-3 md:group-even:pl-3">
                                                                <div className="text-sm font-medium text-neutral-300">{step}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        Production Notes
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <MessageSquare className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Production Notes</h4>
                                            </div>
                                            <div className="relative">
                                                <p className="text-neutral-300 text-sm leading-relaxed mb-4 italic border-l-2 border-neutral-700 pl-4 py-1">
                                                    "The raw acoustic resonance of the recording space was intentionally preserved to give a sense of physical closeness and authenticity... The entire session maintained an atmosphere of reverence."
                                                </p>
                                                <ul className="space-y-2 text-sm text-neutral-400 mt-4">
                                                    <li className="flex items-start gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0"></div>
                                                        <span>Archival observation: Exceptional vocal take retained despite minor room noise for emotional impact.</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )} */}

                        {/* Adopt this Song Tab */}
                        {activeTab === 'adopt' && release.enable_adoption !== false && (
                            <AdoptTab release={release} />
                        )}

                        {/* Subtitles Tab */}
                        {activeTab === 'subtitles' && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-neutral-100">Subtitles & Lyrics Languages</h3>
                                        {isEditing && (
                                            <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 px-3 py-1 rounded">
                                                ✏️ Step 1: Manage Languages → Step 2: Create Master Cues → Step 3: Add translations
                                            </span>
                                        )}
                                    </div>

                                    {isEditing && (
                                        <>
                                            {/* Inline Language Management Panel */}
                                            <div className="bg-neutral-800 border border-amber-800/40 rounded-lg p-6 mb-8">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 text-sm font-bold">0</div>
                                                    <h4 className="text-lg font-medium text-neutral-100">Language Management (Up to 17 Languages)</h4>
                                                </div>
                                                <p className="text-sm text-neutral-500 mb-4">
                                                    Select which languages to enable for this release. One language must be set as the master (with timing).
                                                </p>

                                                {/* Master Language Selector */}
                                                <div className="flex items-center gap-4 mb-6">
                                                    <label className="text-sm text-neutral-400">Master Language (with timing):</label>
                                                    <select
                                                        value={editDefaultLanguage || ''}
                                                        onChange={(e) => {
                                                            const newLang = e.target.value;
                                                            setEditDefaultLanguage(newLang);
                                                            // Also set as CC language if not already set
                                                            if (!selectedCaptionLanguage) {
                                                                setSelectedCaptionLanguage(newLang);
                                                            }
                                                        }}
                                                        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-amber-600"
                                                    >
                                                        {PAGE_LANGUAGE_OPTIONS.map((lang) => (
                                                            <option key={lang.code} value={lang.code}>
                                                                {lang.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span className="text-xs text-amber-400">
                                                        ✓ This language's lyrics will have timestamps - other languages sync to it
                                                    </span>
                                                </div>

                                                {/* CC Display Language Selector */}
                                                <div className="flex items-center gap-4 mb-6">
                                                    <label className="text-sm text-neutral-400">CC Display Language (on video):</label>
                                                    <select
                                                        value={selectedCaptionLanguage || ''}
                                                        onChange={(e) => setSelectedCaptionLanguage(e.target.value)}
                                                        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-blue-600"
                                                    >
                                                        {editAvailableLanguages.length > 0 ? (
                                                            editAvailableLanguages.map((lang) => (
                                                                <option key={lang} value={lang}>
                                                                    {getLanguageLabel(lang)}
                                                                </option>
                                                            ))
                                                        ) : (
                                                            <option value="">No languages enabled</option>
                                                        )}
                                                    </select>
                                                    <button
                                                        onClick={() => setCaptionsEnabled(!captionsEnabled)}
                                                        className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                                                            captionsEnabled
                                                                ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-300'
                                                                : 'bg-neutral-700 border-neutral-600 text-neutral-400'
                                                        }`}
                                                    >
                                                        {captionsEnabled ? '✓ CC Enabled' : '○ CC Disabled'}
                                                    </button>
                                                </div>

                                                {/* Language Grid */}
                                                <div>
                                                    <p className="text-sm text-neutral-500 mb-3">Available Languages (check to enable):</p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                                        {PAGE_LANGUAGE_OPTIONS.map((lang) => {
                                                            const isActive = editAvailableLanguages.includes(lang.code);
                                                            const isMaster = lang.code === editDefaultLanguage;
                                                            const isCcDisplay = lang.code === selectedCaptionLanguage;
                                                            const status = editLanguageStatuses?.[lang.code] || 'draft';
                                                            const hasSubtitles = editSubtitleTranslations?.[lang.code] && Object.keys(editSubtitleTranslations[lang.code] || {}).length > 0;
                                                            const hasLyrics = release?.lyrics?.[lang.code] || editStructuredLyrics?.[lang.code];

                                                            return (
                                                                <div
                                                                    key={lang.code}
                                                                    className={`rounded-lg border p-3 space-y-2 transition-colors ${
                                                                        isActive
                                                                            ? 'bg-neutral-800 border-neutral-700'
                                                                            : 'bg-neutral-900 border-neutral-800 opacity-60'
                                                                    }`}
                                                                >
                                                                    {/* Checkbox + Label */}
                                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isActive}
                                                                            onChange={() => {
                                                                                const current = editAvailableLanguages;
                                                                                if (current.includes(lang.code)) {
                                                                                    // Removing
                                                                                    const next = current.filter((c: string) => c !== lang.code);
                                                                                    // If removing master, pick new master
                                                                                    if (lang.code === editDefaultLanguage) {
                                                                                        setEditDefaultLanguage(next[0] || '');
                                                                                    }
                                                                                    // If removing CC display, clear it
                                                                                    if (lang.code === selectedCaptionLanguage) {
                                                                                        setSelectedCaptionLanguage(next[0] || '');
                                                                                    }
                                                                                    setEditAvailableLanguages(next);
                                                                                } else {
                                                                                    // Adding
                                                                                    setEditAvailableLanguages([...current, lang.code]);
                                                                                    // If first language, make it master
                                                                                    if (!editDefaultLanguage) {
                                                                                        setEditDefaultLanguage(lang.code);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="accent-amber-500 w-4 h-4"
                                                                        />
                                                                        <span className="text-sm text-neutral-200 truncate">{lang.label}</span>
                                                                    </label>

                                                                    {/* Status badges */}
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {isMaster && (
                                                                            <span className="text-[9px] bg-amber-900/40 text-amber-300 border border-amber-800/40 px-1.5 py-0.5 rounded">
                                                                                master
                                                                            </span>
                                                                        )}
                                                                        {isCcDisplay && isActive && (
                                                                            <span className="text-[9px] bg-blue-900/40 text-blue-300 border border-blue-800/40 px-1.5 py-0.5 rounded">
                                                                                CC display
                                                                            </span>
                                                                        )}
                                                                        {hasSubtitles && (
                                                                            <span className="text-[9px] bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                                                                                subs
                                                                            </span>
                                                                        )}
                                                                        {hasLyrics && (
                                                                            <span className="text-[9px] bg-purple-900/40 text-purple-300 border border-purple-800/40 px-1.5 py-0.5 rounded">
                                                                                lyrics
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Status Dropdown (only for active languages) */}
                                                                    {isActive && (
                                                                        <select
                                                                            value={status}
                                                                            onChange={(e) => handleLanguageStatusChange(lang.code, e.target.value as SubtitleStatus)}
                                                                            className="w-full text-xs bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 text-neutral-300 focus:outline-none"
                                                                        >
                                                                            <option value="draft">Draft</option>
                                                                            <option value="in_translation">In Translation</option>
                                                                            <option value="under_review">Under Review</option>
                                                                            <option value="verified">Verified</option>
                                                                            <option value="published">Published</option>
                                                                        </select>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="border-t border-neutral-800 mb-8" />
                                        </>
                                    )}
                                    {isEditing ? (
                                        <div className="space-y-8">
                                            {/* STEP 1: Master Cue Creator */}
                                            <div className="bg-neutral-800 border border-amber-800/40 rounded-lg p-6">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center text-amber-400 text-sm font-bold">1</div>
                                                    <h4 className="text-lg font-medium text-neutral-100">Master Subtitle Cues (Timing)</h4>
                                                </div>
                                                <p className="text-sm text-neutral-500 mb-4">
                                                    Paste the full song — one line per subtitle cue. Set the video duration, and timing will auto-generate.
                                                </p>

                                                {/* Video Duration Input */}
                                                <div className="flex items-center gap-4 mb-4">
                                                    <label className="text-sm text-neutral-400">Video Duration (seconds):</label>
                                                    <input
                                                        type="number"
                                                        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-100 w-32 focus:outline-none focus:border-amber-600"
                                                        value={release.duration_seconds || 0}
                                                        onChange={e => setRelease((prev: any) => ({ ...prev, duration_seconds: parseInt(e.target.value) || 0 }))}
                                                    />
                                                    <span className="text-xs text-neutral-600">
                                                        {release.duration_seconds ? `${Math.floor(release.duration_seconds / 60)}:${(release.duration_seconds % 60).toString().padStart(2, '0')} mm:ss` : 'Set this first'}
                                                    </span>
                                                </div>

                                                {/* Master Text Area */}
                                                <textarea
                                                    className="w-full bg-neutral-950 border border-amber-800/40 rounded-lg p-4 text-sm text-neutral-200 font-mono leading-relaxed focus:outline-none focus:border-amber-600 placeholder:text-neutral-600"
                                                    rows={12}
                                                    value={(() => {
                                                        // Reconstruct master text from existing cues + translations
                                                        const cues = editSubtitleCues || [];
                                                        const masterTranslations = editSubtitleTranslations?.[selectedLyricsLanguage] || {};
                                                        return cues
                                                            .sort((a, b) => (a.cueNumber || 0) - (b.cueNumber || 0))
                                                            .map((cue: any) => masterTranslations[cue.id] || '')
                                                            .filter(Boolean)
                                                            .join('\n');
                                                    })()}
                                                    onChange={e => {
                                                        const lines = e.target.value.split('\n').filter((l: string) => l.trim());
                                                        const duration = release.duration_seconds || 0;
                                                        const cueDuration = lines.length > 0 ? duration / lines.length : 3;

                                                        const newCues = lines.map((line: string, idx: number) => {
                                                            const startTime = idx * cueDuration;
                                                            const endTime = startTime + cueDuration;
                                                            const formatTime = (sec: number) => {
                                                                const h = Math.floor(sec / 3600);
                                                                const m = Math.floor((sec % 3600) / 60);
                                                                const s = Math.floor(sec % 60);
                                                                const ms = Math.floor((sec % 1) * 1000);
                                                                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
                                                            };
                                                            return {
                                                                id: `cue_${idx + 1}`,
                                                                cueNumber: idx + 1,
                                                                startTime: formatTime(startTime),
                                                                endTime: formatTime(endTime),
                                                                active: true,
                                                                sourceType: 'manual',
                                                            };
                                                        });

                                                        const translations: Record<string, string> = {};
                                                        lines.forEach((line: string, idx: number) => {
                                                            translations[`cue_${idx + 1}`] = line;
                                                        });

                                                        setEditSubtitleCues(newCues);
                                                        setEditDefaultLanguage(selectedLyricsLanguage);
                                                        setEditSubtitleTranslations((prev: any) => ({
                                                            ...prev,
                                                            [selectedLyricsLanguage]: translations,
                                                        }));
                                                    }}
                                                    placeholder={`Paste the master subtitle text here — one line per cue.\n\nExample:\nIn the name of love and light\nThe heart remembers what the mind forgets\nEvery breath is a prayer\n...`}
                                                />

                                                {/* Cue Preview */}
                                                {editSubtitleCues.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm text-neutral-400">
                                                                {editSubtitleCues.length} master cues generated
                                                                {editSubtitleTranslations[editDefaultLanguage] && ` • ${Object.keys(editSubtitleTranslations[editDefaultLanguage]).length} translations`}
                                                            </span>
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded p-3">
                                                            {editSubtitleCues
                                                                .sort((a: any, b: any) => (a.cueNumber || 0) - (b.cueNumber || 0))
                                                                .slice(0, 50)
                                                                .map((cue: any) => {
                                                                    const text = editSubtitleTranslations[editDefaultLanguage]?.[cue.id] || '';
                                                                    return (
                                                                        <div key={cue.id} className="flex items-start gap-3 py-1.5 border-b border-neutral-900 last:border-0 text-xs">
                                                                            <span className="text-neutral-600 font-mono w-8 flex-shrink-0">#{cue.cueNumber}</span>
                                                                            <span className="text-neutral-500 font-mono w-28 flex-shrink-0">{cue.startTime}</span>
                                                                            <span className="text-neutral-200 truncate">{text || <span className="text-neutral-600 italic">(empty)</span>}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            {editSubtitleCues.length > 50 && (
                                                                <div className="text-neutral-600 text-xs italic py-1">... and {editSubtitleCues.length - 50} more cues</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* STEP 2: Translation per Language */}
                                            {editSubtitleCues.length > 0 && (
                                                <div className="bg-neutral-800 border border-blue-800/40 rounded-lg p-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 rounded-full bg-blue-400/10 flex items-center justify-center text-blue-400 text-sm font-bold">2</div>
                                                        <h4 className="text-lg font-medium text-neutral-100">Translations (each language follows master timing)</h4>
                                                    </div>
                                                    <p className="text-sm text-neutral-500 mb-4">
                                                        Select a language, paste the translated text (one line per cue). Timing is inherited from master cues.
                                                    </p>

                                                    {/* Language Tabs */}
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {editAvailableLanguages
                                                            .filter((lang) => lang !== editDefaultLanguage)
                                                            .map((lang) => {
                                                                const transCount = Object.keys(editSubtitleTranslations?.[lang] || {}).length;
                                                                const isSelected = selectedSubtitleLanguage === lang;
                                                                return (
                                                                    <button
                                                                        key={lang}
                                                                        onClick={() => setSelectedSubtitleLanguage(lang)}
                                                                        className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                                                                            isSelected
                                                                                ? 'bg-blue-900/30 border-blue-600 text-blue-200'
                                                                                : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                                                                        }`}
                                                                    >
                                                                        {getLanguageLabel(lang)}
                                                                        {transCount > 0 && (
                                                                            <span className="ml-1 text-blue-400">({transCount}/{editSubtitleCues.length})</span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>

                                                    {/* Translation Editor for Selected Language */}
                                                    {selectedSubtitleLanguage && selectedSubtitleLanguage !== editDefaultLanguage && (() => {
                                                        const langTranslations = editSubtitleTranslations?.[selectedSubtitleLanguage] || {};
                                                        const sortedCues = [...editSubtitleCues].sort((a, b) => (a.cueNumber || 0) - (b.cueNumber || 0));
                                                        const existingText = sortedCues
                                                            .map((cue: any) => langTranslations[cue.id] || '')
                                                            .filter(Boolean)
                                                            .join('\n');

                                                        return (
                                                            <div>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-sm text-neutral-300">
                                                                        Translating to: <span className="text-blue-400 font-medium">{getLanguageLabel(selectedSubtitleLanguage)}</span>
                                                                    </span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-neutral-500">
                                                                            {Object.keys(langTranslations).length}/{editSubtitleCues.length} cues translated
                                                                        </span>
                                                                        <button
                                                                            onClick={() => {
                                                                                // Copy master translations as base for this language
                                                                                const masterTranslations = editSubtitleTranslations?.[editDefaultLanguage] || {};
                                                                                const newTranslations: Record<string, string> = {};
                                                                                sortedCues.forEach((cue: any) => {
                                                                                    newTranslations[cue.id] = masterTranslations[cue.id] || '';
                                                                                });
                                                                                setEditSubtitleTranslations((prev: any) => ({
                                                                                    ...prev,
                                                                                    [selectedSubtitleLanguage]: newTranslations,
                                                                                }));
                                                                                setToastType('info');
                                                                                setToastMessage(`Copied ${editDefaultLanguage} as base for ${getLanguageLabel(selectedSubtitleLanguage)}. Now replace with actual translation.`);
                                                                                setTimeout(() => setToastMessage(null), 4000);
                                                                            }}
                                                                            className="text-xs px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-200 transition-colors"
                                                                            title="Use master language text as starting point"
                                                                        >
                                                                            📋 Use master as base
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Bulk Paste Area */}
                                                                <textarea
                                                                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg p-4 text-sm text-neutral-200 font-mono leading-relaxed focus:outline-none focus:border-blue-600 placeholder:text-neutral-600"
                                                                    rows={12}
                                                                    value={existingText}
                                                                    onChange={e => {
                                                                        const lines = e.target.value.split('\n');
                                                                        const translations: Record<string, string> = {};
                                                                        sortedCues.forEach((cue: any, idx: number) => {
                                                                            if (lines[idx] && lines[idx].trim()) {
                                                                                translations[cue.id] = lines[idx].trim();
                                                                            }
                                                                        });
                                                                        setEditSubtitleTranslations((prev: any) => ({
                                                                            ...prev,
                                                                            [selectedSubtitleLanguage]: translations,
                                                                        }));
                                                                    }}
                                                                    placeholder={`Paste ${getLanguageLabel(selectedSubtitleLanguage)} translation here — one line per cue.\nMust have same number of lines as master cues (${editSubtitleCues.length}).`}
                                                                />

                                                                {/* Cue-by-Cue Preview */}
                                                                <div className="mt-4 max-h-60 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded p-3">
                                                                    {sortedCues.slice(0, 30).map((cue: any, idx: number) => {
                                                                        const masterText = editSubtitleTranslations[editDefaultLanguage]?.[cue.id] || '';
                                                                        const transText = langTranslations[cue.id] || '';
                                                                        return (
                                                                            <div key={cue.id} className={`flex items-start gap-3 py-1.5 border-b border-neutral-900 last:border-0 text-xs ${transText ? '' : 'opacity-40'}`}>
                                                                                <span className="text-neutral-600 font-mono w-8 flex-shrink-0">#{cue.cueNumber}</span>
                                                                                <span className="text-neutral-500 font-mono w-28 flex-shrink-0">{cue.startTime}</span>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-neutral-500 truncate">{masterText}</div>
                                                                                    <div className="text-neutral-200 truncate">{transText || <span className="text-neutral-600 italic">—</span>}</div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {editSubtitleCues.length > 30 && (
                                                                        <div className="text-neutral-600 text-xs italic py-1">... and {editSubtitleCues.length - 30} more cues</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* Read-Only View */
                                        <>
                                            {editAvailableLanguages.length > 0 ? (
                                                <>
                                                    <LanguageSelector
                                                        availableLanguages={editAvailableLanguages}
                                                        selectedLanguage={selectedSubtitleLanguage}
                                                        languageStatuses={editLanguageStatuses}
                                                        onSelect={(code) => {
                                                            setSelectedSubtitleLanguage(code);
                                                            setSelectedCaptionLanguage(code);
                                                            if (PAGE_LANGUAGE_OPTIONS.some((o) => o.code === code)) {
                                                                setSelectedLyricsLanguage(code as LanguageKey);
                                                            }
                                                        }}
                                                        release={release}
                                                        allowComparison={false}
                                                        isAdmin={false}
                                                    />
                                                    {selectedSubtitleLanguage && release.lyrics?.[selectedSubtitleLanguage as keyof typeof release.lyrics] && (
                                                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mt-6">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <Subtitles className="w-5 h-5 text-neutral-400" />
                                                                <h4 className="text-lg font-medium text-neutral-100">
                                                                    {getLanguageLabel(selectedSubtitleLanguage)} Subtitles
                                                                    {editLanguageStatuses[selectedSubtitleLanguage] === 'verified' && (
                                                                        <Check className="w-4 h-4 text-emerald-400 ml-2" />
                                                                    )}
                                                                </h4>
                                                            </div>
                                                            <div className="text-neutral-300 whitespace-pre-line leading-relaxed text-base">
                                                                {release.lyrics[selectedSubtitleLanguage as keyof typeof release.lyrics]}
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-neutral-500 text-center py-12">
                                                    <p className="text-lg">No subtitles available yet.</p>
                                                    <p className="text-sm mt-2">Click "Edit Release" to add subtitle cues and translations.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Lyrics Tab */}
                        {/* {activeTab === 'lyrics' && getAvailableLanguages().length > 0 && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-xl font-medium text-neutral-100 mb-6">Select Lyrics Language</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                                        {getAvailableLanguages().map((lang) => {
                                            const langLabel = LANGUAGE_OPTIONS.find(opt => opt.key === lang)?.label || lang.toUpperCase();
                                            return (
                                                <button
                                                    key={lang}
                                                    onClick={() => {
                                                        setSelectedLyricsLanguage(lang as LanguageKey);
                                                        setSelectedCaptionLanguage(lang);
                                                    }}
                                                    className={`px-5 py-3 rounded-lg border font-medium transition-all ${selectedLyricsLanguage === lang
                                                        ? 'bg-neutral-700 border-neutral-600 text-white shadow-lg'
                                                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-600'
                                                        }`}
                                                >
                                                    {langLabel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedLyricsLanguage && release.lyrics?.[selectedLyricsLanguage as keyof typeof release.lyrics] && (
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mt-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <FileText className="w-5 h-5 text-neutral-400" />
                                                <h4 className="text-lg font-medium text-neutral-100">
                                                    {LANGUAGE_OPTIONS.find(opt => opt.key === selectedLyricsLanguage)?.label || selectedLyricsLanguage.toUpperCase()} Lyrics
                                                </h4>
                                            </div>
                                            <div className="text-neutral-300 whitespace-pre-line leading-relaxed text-base font-serif">
                                                {release.lyrics[selectedLyricsLanguage as keyof typeof release.lyrics]}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )} */}

                        {activeTab === 'lyrics' && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-medium text-neutral-100">Lyrics</h3>
                                        {isEditing && (
                                            <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 px-3 py-1 rounded">
                                                ✏️ Master language has timing - translations sync automatically
                                            </span>
                                        )}
                                    </div>

                                    {/* Master Language Info for Admin */}
                                    {isEditing && (
                                        <div className="space-y-6 mb-8">
                                            {/* Step 1: Master Timing Generator */}
                                            {/* Interactive Sync Tool */}
                                            {editDefaultLanguage && editSubtitleCues.length > 0 && (
                                                <div className="p-6 bg-neutral-900 border border-amber-800/40 rounded-xl shadow-2xl mt-6 flex flex-col max-h-[600px]">
                                                    <div className="flex items-center justify-between mb-4 shrink-0">
                                                        <div>
                                                            <h4 className="text-lg font-medium text-amber-400">Interactive Video Sync</h4>
                                                            <p className="text-xs text-neutral-500">Play the video and click to capture timestamps live.</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={exportVttFile}
                                                                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded shadow-inner border border-neutral-700 font-medium text-xs tracking-wider flex items-center gap-2 transition"
                                                                title="Download .VTT file for YouTube"
                                                            >
                                                                <Download size={14} /> Export .VTT
                                                            </button>
                                                            <div className="px-3 py-1.5 bg-black rounded shadow-inner border border-neutral-800 text-amber-500 font-mono text-sm tracking-wider">
                                                                {formatDuration(Math.floor(currentTime || 0))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                                                        {editSubtitleCues.map((cue, idx) => (
                                                            <div key={cue.id} className="flex flex-col gap-3 p-4 bg-black/40 border border-neutral-800 rounded-lg group hover:border-neutral-700 transition-colors">
                                                                {/* First Row: Number and Text Input */}
                                                                <div className="flex items-center gap-3 w-full">
                                                                    <div className="w-8 h-8 rounded shrink-0 bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 text-xs font-mono shadow-inner">
                                                                        {idx + 1}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <input
                                                                            type="text"
                                                                            value={editSubtitleTranslations[selectedLyricsLanguage]?.[cue.id] || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setEditSubtitleTranslations(prev => ({
                                                                                    ...prev,
                                                                                    [selectedLyricsLanguage]: {
                                                                                        ...(prev[selectedLyricsLanguage] || {}),
                                                                                        [cue.id]: val
                                                                                    }
                                                                                }));
                                                                            }}
                                                                            className="w-full bg-[#1a1d24] border border-neutral-700/60 hover:border-neutral-500 focus:border-amber-500 rounded p-2 text-sm font-medium text-neutral-200 focus:outline-none transition-all placeholder:text-neutral-700 shadow-inner"
                                                                            placeholder="Type or edit lyric line..."
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Second Row: Timing Controls */}
                                                                <div className="flex w-full">
                                                                    <div className="flex flex-wrap items-center gap-3 w-full bg-neutral-900/40 p-2 rounded-lg border border-neutral-800/80">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 w-8">Start</span>
                                                                            <div className="flex items-stretch bg-black border border-neutral-700 rounded overflow-hidden focus-within:border-amber-500 transition-colors">
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        const secs = Math.max(0, parseTimestampToSeconds(cue.startTime) - 0.1);
                                                                                        const ts = formatSecondsToTimestamp(secs);
                                                                                        setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, startTime: ts } : c));
                                                                                    }}
                                                                                    className="px-1.5 bg-neutral-900/50 hover:bg-neutral-800/80 hover:text-amber-400 text-neutral-400 focus:outline-none select-none transition-colors border-r border-neutral-800 flex flex-col justify-center font-bold text-xs"
                                                                                    title="Decrease time by 0.1s"
                                                                                >-</button>
                                                                                <input 
                                                                                    type="text" 
                                                                                    value={cue.startTime} 
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, startTime: val } : c));
                                                                                    }}
                                                                                    className="w-[124px] bg-[#1a1d24] px-1 py-1.5 text-xs text-neutral-200 font-mono text-center focus:outline-none" 
                                                                                />
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        const secs = parseTimestampToSeconds(cue.startTime) + 0.1;
                                                                                        const ts = formatSecondsToTimestamp(secs);
                                                                                        setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, startTime: ts } : c));
                                                                                    }}
                                                                                    className="px-1.5 bg-neutral-900/50 hover:bg-neutral-800/80 hover:text-amber-400 text-neutral-400 focus:outline-none select-none transition-colors border-l border-neutral-800 flex flex-col justify-center font-bold text-xs"
                                                                                    title="Increase time by 0.1s"
                                                                                >+</button>
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const ts = formatSecondsToTimestamp(currentTime);
                                                                                    setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, startTime: ts } : c));
                                                                                }}
                                                                                className="px-2 py-1.5 bg-amber-900/30 hover:bg-amber-600 hover:text-black text-amber-500 text-xs font-medium rounded border border-amber-800/40 transition-colors shadow-inner"
                                                                                title="Capture current video time"
                                                                            >
                                                                                📍 Sync
                                                                            </button>
                                                                        </div>
                                                                        <div className="hidden sm:block w-px h-6 bg-neutral-800"></div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-[10px] uppercase tracking-wider text-neutral-500 w-8">End</span>
                                                                            <div className="flex items-stretch bg-black border border-neutral-700 rounded overflow-hidden focus-within:border-neutral-500 transition-colors">
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        const secs = Math.max(0, parseTimestampToSeconds(cue.endTime) - 0.1);
                                                                                        const ts = formatSecondsToTimestamp(secs);
                                                                                        setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, endTime: ts } : c));
                                                                                    }}
                                                                                    className="px-1.5 bg-neutral-900/50 hover:bg-neutral-800/80 hover:text-white text-neutral-400 focus:outline-none select-none transition-colors border-r border-neutral-800 flex flex-col justify-center font-bold text-xs"
                                                                                    title="Decrease time by 0.1s"
                                                                                >-</button>
                                                                                <input 
                                                                                    type="text" 
                                                                                    value={cue.endTime} 
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value;
                                                                                        setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, endTime: val } : c));
                                                                                    }}
                                                                                    className="w-[124px] bg-[#1a1d24] px-1 py-1.5 text-xs text-neutral-200 font-mono text-center focus:outline-none" 
                                                                                />
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        const secs = parseTimestampToSeconds(cue.endTime) + 0.1;
                                                                                        const ts = formatSecondsToTimestamp(secs);
                                                                                        setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, endTime: ts } : c));
                                                                                    }}
                                                                                    className="px-1.5 bg-neutral-900/50 hover:bg-neutral-800/80 hover:text-white text-neutral-400 focus:outline-none select-none transition-colors border-l border-neutral-800 flex flex-col justify-center font-bold text-xs"
                                                                                    title="Increase time by 0.1s"
                                                                                >+</button>
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const ts = formatSecondsToTimestamp(currentTime);
                                                                                    setEditSubtitleCues(prev => prev.map(c => c.id === cue.id ? { ...c, endTime: ts } : c));
                                                                                }}
                                                                                className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-600 text-neutral-300 text-xs font-medium rounded border border-neutral-700 transition-colors shadow-inner"
                                                                                title="Capture current video time"
                                                                            >
                                                                                📍 Sync
                                                                            </button>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => {
                                                                                if (scrubTo && parseTimestampToSeconds) {
                                                                                    scrubTo(parseTimestampToSeconds(cue.startTime));
                                                                                }
                                                                            }}
                                                                            className="ml-2 p-1.5 bg-black rounded-lg border border-neutral-700 hover:border-blue-500 hover:text-blue-400 text-neutral-400 transition-colors shadow-inner"
                                                                            title="Play from start time"
                                                                        >
                                                                            <Play className="w-4 h-4 pl-0.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="p-6 bg-neutral-900 border border-amber-800/40 rounded-xl shadow-2xl">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                        <Clock className="w-5 h-5 text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-medium text-neutral-100">Master Subtitle Cues (Timing)</h4>
                                                        <p className="text-xs text-neutral-500">Create the primary timing structure for synchronization.</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Video Duration (seconds):</label>
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="number"
                                                                value={masterTimingDuration || release?.duration_seconds || 0}
                                                                onChange={(e) => setMasterTimingDuration(Number(e.target.value))}
                                                                className="w-32 bg-neutral-950 border border-neutral-800 rounded px-4 py-2 text-neutral-100 focus:outline-none focus:border-amber-600 font-mono"
                                                            />
                                                            <span className="text-xs text-neutral-500 italic">
                                                                {formatDuration(Math.floor(masterTimingDuration || release?.duration_seconds || 0))} mm:ss
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Paste Master Lyrics (one line per cue):</label>
                                                        <textarea
                                                            value={masterTimingText}
                                                            onChange={(e) => setMasterTimingText(e.target.value)}
                                                            placeholder="Paste the full song here — each line will become a master timestamped cue..."
                                                            rows={8}
                                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-200 font-serif leading-relaxed focus:outline-none focus:border-amber-600 placeholder:text-neutral-700"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={() => autoGenerateMasterCues(masterTimingText, masterTimingDuration || release?.duration_seconds || 0)}
                                                        disabled={!masterTimingText.trim() || !(masterTimingDuration || release?.duration_seconds)}
                                                        className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium text-black shadow-lg"
                                                    >
                                                        Generate Master Timing & Synchronize
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Status Info */}
                                            {editDefaultLanguage && (
                                                <div className="p-4 bg-amber-900/10 border border-amber-800/30 rounded-lg flex items-start gap-3">
                                                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm text-amber-300">
                                                            Master Timing Set: <strong className="text-neutral-100">{editSubtitleCues.length} cues</strong> generated using <strong className="text-neutral-100">{getLanguageLabel(editDefaultLanguage || 'roman_urdu')}</strong>.
                                                        </p>
                                                        <p className="text-xs text-neutral-500 mt-1">
                                                            Switch to any other language below to paste translations. They will automatically map to these timestamps.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Language Selector */}
                                    {captionLanguageOptions.length > 0 ? (
                                        <>
                                            <div className="flex flex-wrap items-center gap-3 mb-8">
                                                {(() => {
                                                    // priorityKeys match the high-priority ones the user expects
                                                    const priorityKeys = ['roman_urdu', 'urdu', 'english', 'hindi', 'arabic', 'turkish'];
                                                    
                                                    // Map keys to full objects from the integrated captionLanguageOptions
                                                    const availableOptions = (captionLanguageOptions || []).map(opt => ({
                                                        key: opt.key,
                                                        label: opt.label,
                                                        status: editLanguageStatuses?.[opt.key] || 'draft'
                                                    }));

                                                    // Separate into Primary and Other
                                                    const primaryOptions = availableOptions
                                                        .filter(opt => priorityKeys.includes(opt.key))
                                                        .sort((a, b) => priorityKeys.indexOf(a.key) - priorityKeys.indexOf(b.key));
                                                    
                                                    const otherOptions = availableOptions
                                                        .filter(opt => !priorityKeys.includes(opt.key));

                                                    const isOtherSelected = otherOptions.some(opt => opt.key === selectedLyricsLanguage);

                                                    return (
                                                        <>
                                                            {/* Priority Language Buttons (Direct siblings for better flex control) */}
                                                            {primaryOptions.map((opt) => {
                                                                const isSelected = selectedLyricsLanguage === opt.key;
                                                                return (
                                                                    <button
                                                                        key={opt.key}
                                                                        onClick={() => {
                                                                            setSelectedLyricsLanguage(opt.key as LanguageKey);
                                                                            setSelectedCaptionLanguage(opt.key);
                                                                        }}
                                                                        className={`px-5 py-3 rounded-lg border font-medium transition-all text-sm min-w-[120px] relative ${
                                                                            isSelected
                                                                                ? 'bg-neutral-700 border-neutral-600 text-white shadow-lg ring-1 ring-neutral-500'
                                                                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:border-neutral-600 hover:text-neutral-200'
                                                                        }`}
                                                                    >
                                                                        <span className="truncate">{opt.label}</span>
                                                                        {isEditing && (
                                                                            <span className={`absolute top-1 right-1.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                                                                opt.status === 'verified' ? 'text-emerald-400 bg-emerald-900/30' :
                                                                                opt.status === 'published' ? 'text-green-400 bg-green-900/30' :
                                                                                'text-neutral-500 bg-neutral-800'
                                                                            }`}>
                                                                                {opt.status.replace('_', ' ')}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}

                                                            {/* Integrated Dropdown for Remaining Languages - Expanded to fill space */}
                                                            {otherOptions.length > 0 && (
                                                                <div className="relative min-w-[280px] flex-1">
                                                                    <select
                                                                        value={isOtherSelected ? (selectedLyricsLanguage || '') : ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            if (val) {
                                                                                setSelectedLyricsLanguage(val as LanguageKey);
                                                                                setSelectedCaptionLanguage(val);
                                                                            }
                                                                        }}
                                                                        className={`w-full appearance-none px-4 py-3 pr-10 rounded-lg border font-medium transition-all text-sm outline-none cursor-pointer text-center ${
                                                                            isOtherSelected
                                                                                ? 'bg-neutral-700 border-neutral-600 text-white shadow-lg ring-1 ring-neutral-500'
                                                                                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:border-neutral-600 hover:text-neutral-200'
                                                                        }`}
                                                                    >
                                                                        <option value="" disabled>... More Languages</option>
                                                                        {otherOptions.map((opt) => (
                                                                            <option key={opt.key} value={opt.key}>
                                                                                {opt.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                                                                        <ChevronDown className="w-4 h-4" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Lyrics Editor for Selected Language */}
                                            {selectedLyricsLanguage && (() => {
                                                const activeLanguage = String(selectedLyricsLanguage || '');
                                                const structuredBlocks = Array.isArray(lyricsStructureMap?.[activeLanguage])
                                                    ? lyricsStructureMap[activeLanguage].filter((block: any) => block?.isPublished !== false)
                                                    : [];
                                                const legacyRows = Array.isArray(release.lyrics?.[activeLanguage]) ? release.lyrics[activeLanguage] : [];
                                                
                                                // Support fetching cleanly from editSubtitleTranslations to surface ghost data
                                                const hiddenTranslations = editSubtitleTranslations?.[activeLanguage] 
                                                    ? (editSubtitleCues && editSubtitleCues.length > 0
                                                        ? editSubtitleCues.map((c: any) => editSubtitleTranslations[activeLanguage][c.id]).filter(Boolean).join('\n')
                                                        : Object.values(editSubtitleTranslations[activeLanguage]).filter(Boolean).join('\n'))
                                                    : '';

                                                const flatLyricsText = hiddenTranslations.length > 0
                                                    ? hiddenTranslations
                                                    : legacyRows.length > 0
                                                    ? legacyRows.map((row: any) => String(row?.translation || row?.transliteration || row?.urdu || '').replace(/\[.*?\]\s*/g, '')).filter(Boolean).join('\n')
                                                    : structuredBlocks.length > 0
                                                    ? structuredBlocks
                                                        .sort((a: any, b: any) => (a?.order || 0) - (b?.order || 0))
                                                        .flatMap((block: any) => Array.isArray(block.lines) ? block.lines : [])
                                                        .map(l => String(l).replace(/\[.*?\]\s*/g, ''))
                                                        .filter(Boolean)
                                                        .join('\n')
                                                    : '';

                                                return isEditing ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-lg font-medium text-amber-400">
                                                                Editing: {getLanguageLabel(selectedLyricsLanguage)}
                                                            </h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const active = String(selectedLyricsLanguage);
                                                                    setEditSubtitleTranslations(prev => ({ ...prev, [active]: {} }));
                                                                    setEditLyrics([]);
                                                                    setRelease((prev: any) => ({
                                                                        ...prev,
                                                                        lyrics: { ...(prev?.lyrics || {}), [active]: [] },
                                                                        lyrics_structure: { ...(prev?.lyrics_structure || {}), [active]: [] },
                                                                        lyricsStructure: { ...(prev?.lyricsStructure || {}), [active]: [] },
                                                                        subtitle_translations: { ...(prev?.subtitle_translations || {}), [active]: {} },
                                                                        subtitleTranslations: { ...(prev?.subtitleTranslations || {}), [active]: {} }
                                                                    }));
                                                                }}
                                                                className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 px-3 py-1.5 rounded border border-red-900/50 transition-colors"
                                                            >
                                                                Clear Track
                                                            </button>
                                                        </div>
                                                        <textarea
                                                            className="w-full bg-neutral-950 border border-amber-800/40 rounded-lg p-4 text-sm text-neutral-200 font-serif leading-relaxed focus:outline-none focus:border-amber-600 placeholder:text-neutral-600"
                                                            rows={20}
                                                            value={flatLyricsText}
                                                            onChange={e => {
                                                                const rawText = e.target.value;
                                                                
                                                                // 1. Update basic lyrics text
                                                                const lines = rawText.split('\n').filter((l: string) => l.trim());
                                                                const parsed = lines.map((line: string) => ({
                                                                    translation: line,
                                                                    transliteration: '',
                                                                    urdu: '',
                                                                    timestamp: '',
                                                                }));
                                                                
                                                                setRelease((prev: any) => ({
                                                                    ...prev,
                                                                    lyrics: {
                                                                        ...(prev?.lyrics || {}),
                                                                        [selectedLyricsLanguage]: parsed,
                                                                    },
                                                                }));
                                                                setEditLyrics(parsed);

                                                                // 2. Auto-map to Master Subtitle Timing Cues
                                                                if (editSubtitleCues && editSubtitleCues.length > 0) {
                                                                    const allLines = rawText.split('\n').map(l => l.trim());
                                                                    const newTranslations: Record<string, string> = {};
                                                                    
                                                                    editSubtitleCues.forEach((cue: any, idx: number) => {
                                                                        if (allLines[idx] !== undefined) {
                                                                            newTranslations[cue.id] = allLines[idx];
                                                                        }
                                                                    });
                                                                    
                                                                    setEditSubtitleTranslations(prev => ({
                                                                        ...prev,
                                                                        [selectedLyricsLanguage]: newTranslations
                                                                    }));
                                                                } else if (rawText.trim() === '') {
                                                                    // Panic override: if no cues exist but user deletes the text, wipe the hidden dictionary and structure fallbacks
                                                                    setEditSubtitleTranslations(prev => ({
                                                                        ...prev,
                                                                        [selectedLyricsLanguage]: {}
                                                                    }));
                                                                    setRelease((prev: any) => ({
                                                                        ...prev,
                                                                        lyrics_structure: { ...(prev?.lyrics_structure || {}), [selectedLyricsLanguage]: [] },
                                                                        lyricsStructure: { ...(prev?.lyricsStructure || {}), [selectedLyricsLanguage]: [] },
                                                                        subtitle_translations: { ...(prev?.subtitle_translations || {}), [selectedLyricsLanguage]: {} },
                                                                        subtitleTranslations: { ...(prev?.subtitleTranslations || {}), [selectedLyricsLanguage]: {} }
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder={`Paste translations here — one line per master cue.\n(They will instantly auto-sync with the Interactive Video Panel above.)`}

                                                        />
                                                        <div className="text-xs text-neutral-500">
                                                            {legacyRows.length > 0
                                                                ? `${legacyRows.length} lines loaded`
                                                                : structuredBlocks.length > 0
                                                                ? `${structuredBlocks.length} blocks (${structuredBlocks.reduce((sum: number, b: any) => sum + (Array.isArray(b.lines) ? b.lines.length : 0), 0)} lines) loaded`
                                                                : 'No existing lyrics — paste new ones above'
                                                            }
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {flatLyricsText.trim().length > 0 ? (
                                                            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mt-6">
                                                                <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed text-base font-serif">
                                                                    {flatLyricsText}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mt-6">
                                                                <p className="text-neutral-400">
                                                                    No lyrics published yet for {getLanguageLabel(selectedLyricsLanguage)}.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
                                            <p className="text-neutral-400">No lyrics available yet.</p>
                                            {isEditing && (
                                                <p className="text-xs text-neutral-500 mt-2">Add languages in the Language Management panel above, then paste lyrics here.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}


                        {/* Recording & Production Tab */}
                        {activeTab === 'production' && release.production_credits && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-2xl font-medium text-neutral-100 mb-8">Recording & Production</h3>

                                    {release.production_credits.studio_name && (
                                        <div className="mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                                            <div className="flex items-start gap-4">
                                                <span className="text-3xl">🎛️</span>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-medium text-neutral-100 mb-2">Recording Studio</h4>
                                                    <p className="text-xl text-neutral-300 font-medium mb-3">{release.production_credits.studio_name}</p>
                                                    {release.production_credits.studio_description && (
                                                        <p className="text-neutral-500 italic leading-relaxed">{release.production_credits.studio_description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {release.production_credits.lead_engineer && (
                                        <div className="mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                                            <div className="flex items-start gap-4">
                                                <span className="text-3xl">🎚️</span>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-medium text-neutral-100 mb-4">Engineering</h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <span className="text-sm text-neutral-500">Lead Engineer</span>
                                                            <p className="text-lg text-neutral-300 font-medium">{release.production_credits.lead_engineer}</p>
                                                        </div>

                                                        {release.production_credits.engineering_crew && release.production_credits.engineering_crew.length > 0 && (
                                                            <div className="mt-4 pt-4 border-t border-neutral-800">
                                                                <span className="text-sm text-neutral-500 block mb-3">Engineering Crew</span>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {release.production_credits.engineering_crew.map((member: any, idx: any) => (
                                                                        <div key={idx} className="flex justify-between items-center bg-neutral-950 rounded px-4 py-2">
                                                                            <span className="text-neutral-300">{member.name}</span>
                                                                            <span className="text-sm text-neutral-600">{member.role}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {release.production_credits.music_director && (
                                                            <div className="mt-4 pt-4 border-t border-neutral-800">
                                                                <span className="text-sm text-neutral-500">Music Director</span>
                                                                <p className="text-lg text-neutral-300 font-medium">{release.production_credits.music_director}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {release.production_credits.instrumentalists && release.production_credits.instrumentalists.length > 0 && (
                                        <div className="mb-8 p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                                            <div className="flex items-start gap-4">
                                                <span className="text-3xl">🎸</span>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-medium text-neutral-100 mb-4">Instrumentalists</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {release.production_credits.instrumentalists.map((musician: any, idx: any) => (
                                                            <div key={idx} className="flex justify-between items-center bg-neutral-950 rounded px-4 py-3">
                                                                <span className="text-neutral-300">{musician.name}</span>
                                                                <span className="text-sm text-neutral-600">{musician.instrument}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {release.production_credits.creative_direction_by && (
                                        <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-lg">
                                            <div className="flex items-start gap-4">
                                                <span className="text-3xl">🎨</span>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-medium text-neutral-100 mb-2">Creative Direction & Media</h4>
                                                    <p className="text-lg text-neutral-300 font-medium">{release.production_credits.creative_direction_by}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Commentary Tab */}
                        {activeTab === 'commentary' && release.enable_commentary !== false && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-3xl font-serif font-light text-neutral-100">Commentary & Insights</h3>
                                        {isEditing && (
                                            <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/40 px-3 py-1 rounded">
                                                ✏️ Edit Mode
                                            </span>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-6">
                                            <div className="bg-neutral-800 border border-amber-800/30 rounded-xl p-6">
                                                <textarea
                                                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-4 py-3 text-sm text-neutral-200 leading-relaxed focus:outline-none focus:border-amber-600 placeholder:text-neutral-600"
                                                    rows={15}
                                                    value={editCommentary}
                                                    onChange={e => handleCommentaryChange(e.target.value)}
                                                    placeholder="Paste full commentary and insights here..."
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl hover:border-amber-400/30 transition-colors">
                                                <p className="text-neutral-300 whitespace-pre-line leading-relaxed text-sm">
                                                    {commentaryBlocks.length > 0 ? commentaryBlocks.map((b: any) => b.content).filter(Boolean).join('\n\n') : 'No content yet.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Sponsors Tab */}
                        {activeTab === 'sponsors' && release.enable_sponsors && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-3xl font-serif font-light text-neutral-100 mb-8">Our Sponsors</h3>

                                    <p className="text-neutral-400 mb-8 max-w-2xl leading-relaxed">
                                        {sponsorsIntro}
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {sponsorsList.map((sponsor: any, idx: number) => (
                                            <div key={sponsor.id || idx} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center aspect-square group hover:border-amber-400/30 transition-colors">
                                                <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Award className="w-8 h-8 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                                                </div>
                                                <p className="text-neutral-300 font-medium text-center">{sponsor.name || 'Sponsor'}</p>
                                                <p className="text-neutral-500 text-xs mt-1 text-center">{sponsor.role || 'Partner'}</p>
                                            </div>
                                        ))}

                                        {/* Placeholder for more */}
                                        <div 
                                            onClick={() => { setActiveTab('adopt'); }}
                                            className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center aspect-square hover:bg-neutral-900 transition-colors cursor-pointer group"
                                        >
                                            <div className="w-12 h-12 rounded-full border border-neutral-700 border-dashed flex items-center justify-center mb-3">
                                                <span className="text-neutral-500 text-2xl group-hover:text-amber-400 font-light">+</span>
                                            </div>
                                            <p className="text-neutral-500 text-sm text-center group-hover:text-amber-400 transition-colors">Become a Sponsor</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Recent Adopters Section */}
                    {release.enable_adoption !== false && (
                        <section className="mb-16">
                            <RecentAdopters 
                                releaseId={release.id} 
                                onAdoptClick={() => {
                                    setActiveTab('adopt');
                                }}
                            />
                        </section>
                    )}

                    {/* Streaming Links - Below Tabs */}
                    {!isLegacy && (
                        <section className="mb-16">
                            <h2 className="text-2xl font-serif font-light text-neutral-100 mb-8">Streaming Platforms</h2>
                            <div className="space-y-3">
                                {release.streaming_platforms && release.streaming_platforms.length > 0 ? (
                                    release.streaming_platforms.map((p: any, idx: number) => {
                                        const statusDisplay = isAdmin ? (
                                            <select
                                                value={p.status === 'Available' ? 'Live' : p.status}
                                                onChange={(e) => handlePlatformStatusChange(idx, e.target.value)}
                                                className="bg-transparent border-0 text-sm focus:ring-0 cursor-pointer outline-none appearance-none font-medium text-amber-500 text-right w-auto min-w-[120px]"
                                                title="Edit Status (Admin)"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="Live">Live</option>
                                                <option value="Distribution Pending">Distribution Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Not Planned">Not Planned</option>
                                                <option value="Archived">Archived</option>
                                            </select>
                                        ) : (
                                            <span className="text-sm text-amber-500">{p.status === 'Available' ? 'Live' : p.status}</span>
                                        );
                                        return p.url ? (
                                            <a key={idx} href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors cursor-pointer group">
                                                <span className="text-neutral-300 group-hover:text-amber-400 transition-colors">{p.platform}</span>
                                                {statusDisplay}
                                            </a>
                                        ) : (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                                                <span className="text-neutral-300">{p.platform}</span>
                                                {statusDisplay}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <>
                                        {[
                                            { platform: 'SufiPulse Radio', status: 'Distribution Pending' },
                                            { platform: 'YouTube', status: 'Distribution Pending' },
                                            { platform: 'Spotify', status: release.spotify_url ? 'Live' : 'Distribution Pending' },
                                            { platform: 'Apple Music', status: release.apple_music_url ? 'Live' : 'Distribution Pending' },
                                            { platform: 'Instagram', status: 'Distribution Pending' },
                                            { platform: 'X', status: 'Distribution Pending' },
                                            { platform: 'Facebook', status: 'Distribution Pending' },
                                        ].map((p, idx) => {
                                            const statusDisplay = isAdmin ? (
                                                <select
                                                    value={p.status === 'Available' ? 'Live' : p.status}
                                                    onChange={(e) => handlePlatformStatusChange(idx, e.target.value)}
                                                    className="bg-transparent border-0 text-sm focus:ring-0 cursor-pointer outline-none appearance-none font-medium text-neutral-500 text-right w-auto min-w-[120px]"
                                                    title="Edit Status (Admin)"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="Live">Live</option>
                                                    <option value="Distribution Pending">Distribution Pending</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Not Planned">Not Planned</option>
                                                    <option value="Archived">Archived</option>
                                                </select>
                                            ) : (
                                                <span className="text-sm text-neutral-500">{p.status === 'Available' ? 'Live' : p.status}</span>
                                            );
                                            return (
                                                <div key={`fallback-${idx}`} className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                                                    <span className="text-neutral-300">{p.platform}</span>
                                                    {statusDisplay}
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        </section>
                    )}

                    {/* YouTube Comment CTA */}
                    {resolvedVideoId && (
                        <section className="mb-16">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-700/20 border border-red-700/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-400">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-200">Did this kalam move you?</p>
                                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                            Leave a comment on YouTube — it helps the algorithm promote this to more listeners worldwide.
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.youtube.com/watch?v=${resolvedVideoId}#lc`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                                    </svg>
                                    Comment on YouTube
                                </a>
                            </div>
                        </section>
                    )}

                </div>

                {/* Copy Link Modal */}
                {showCopyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowCopyModal(false)}>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-medium text-neutral-100">Copy Link</h3>
                                <button
                                    onClick={() => setShowCopyModal(false)}
                                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-4 mb-6">
                                <p className="text-sm text-neutral-400 break-all">{window.location.href}</p>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                disabled={copySuccess}
                                className={`w-full py-3 rounded-lg font-medium transition-all ${copySuccess
                                    ? 'bg-green-900/30 border border-green-800 text-green-400'
                                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-100'
                                    }`}
                            >
                                {copySuccess ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Check className="w-5 h-5" />
                                        Copied to Clipboard
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <Copy className="w-5 h-5" />
                                        Copy to Clipboard
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Share Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowShareModal(false)}>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <img src="/sufitube-logo-v5.png" alt="SufiTube Share" className="h-10 object-contain" />
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            {/* YouTube promotion note */}
                            <p className="text-xs text-amber-400/70 text-center mb-1">Social shares use the YouTube link — helping this reach more listeners</p>
                            <div className="space-y-3">
                                {/* Share this moment */}
                                {resolvedVideoId && currentTime > 5 && (
                                    <button
                                        onClick={() => { handleShareMoment(); setShowShareModal(false); }}
                                        className="w-full flex items-center justify-start gap-4 px-6 py-4 bg-amber-900/30 border border-amber-700/40 hover:bg-amber-900/50 rounded-lg transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-amber-200 font-medium">Share this moment</div>
                                            <div className="text-sm text-amber-400/60">YouTube link at {formatDuration(Math.floor(currentTime))}</div>
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleCopyLink()}
                                    className="w-full flex items-center justify-start gap-4 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <Copy className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">Copy Page Link</div>
                                        <div className="text-sm text-neutral-500">sufipulse.com link to clipboard</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleShare('facebook')}
                                    className="w-full flex items-center justify-start gap-4 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <Facebook className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">Facebook</div>
                                        <div className="text-sm text-neutral-500">Share on Facebook</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleShare('twitter')}
                                    className="w-full flex items-center justify-start gap-4 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-sky-600 rounded-full flex items-center justify-center">
                                        <Twitter className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">Twitter</div>
                                        <div className="text-sm text-neutral-500">Share on Twitter</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleShare('whatsapp')}
                                    className="w-full flex items-center justify-start gap-4 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">WhatsApp</div>
                                        <div className="text-sm text-neutral-500">Share on WhatsApp</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleShare('linkedin')}
                                    className="w-full flex items-center justify-start gap-4 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                                        <Linkedin className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">LinkedIn</div>
                                        <div className="text-sm text-neutral-500">Share on LinkedIn</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleShare('telegram')}
                                    className="w-full flex items-center justify-start gap-4 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                                        <Send className="w-5 h-5 text-white -ml-0.5 mt-0.5" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">Telegram</div>
                                        <div className="text-sm text-neutral-500">Share on Telegram</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </PageContainer>

            {/* Toast Notifications */}
            {toastMessage && (
                <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl border backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                    toastType === 'success'
                        ? 'bg-emerald-900/90 border-emerald-700/50 text-emerald-100'
                        : 'bg-blue-900/90 border-blue-700/50 text-blue-100'
                }`}>
                    <div className="flex items-center gap-3">
                        {toastType === 'success' ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <Info className="w-5 h-5" />
                        )}
                        <span className="text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* Sticky Edit Mode Save Bar */}
            {isAdmin && isEditing && (
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 border-t border-amber-800/50 backdrop-blur-md shadow-2xl">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center">
                                <Edit className="w-4 h-4 text-amber-400" />
                            </div>
                            <span className="text-sm text-neutral-200 font-medium">Editing Release</span>
                            {saveSuccess && (
                                <span className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/40 px-2 py-0.5 rounded">
                                    ✓ Saved
                                </span>
                            )}
                            {saveError && (
                                <span className="text-xs text-red-400 bg-red-900/20 border border-red-800/40 px-2 py-0.5 rounded">
                                    ✗ {saveError}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setSaveError(null);
                                    setSaveSuccess(false);
                                }}
                                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-300 border border-neutral-700 rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium rounded bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-amber-900/30"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

export default Release;
