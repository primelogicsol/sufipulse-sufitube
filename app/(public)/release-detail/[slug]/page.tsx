"use client"
import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Badge } from '../../../components/primitives/Badge';
import { Music, Lock, Calendar, Hash, Eye, ThumbsUp, MessageCircle, Clock, Share2, Copy, Facebook, CreditCard as Edit, FileText, Bubbles as Subtitles, Play, ChevronDown, X, Twitter, MessageSquare, Check, Mic, Users, CirclePlay as PlayCircle, Video, Shield, FileSliders as Sliders, Book, Award, Maximize, Minimize } from 'lucide-react';
// import { useRelease } from '../../../hooks/useRelease';
// import { formatDuration } from '../../../services/youtubeSync';
import Link from 'next/link';
import YouTube from 'react-youtube';
import { LyricsTab } from '../../../components/release/lyrics/LyricsTab';
import { VideoOverlay } from '../../../components/release/lyrics/VideoOverlay';
import { LanguageKey, dummyTracks } from '../../../components/release/lyrics/lyricsData';
import { AdoptTab } from '../../../components/release/adopt/AdoptTab';
import { supabase } from '../../../lib/supabase-client';

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

function Release() {
    const params = useParams();
    const slug = params?.slug as string;
    //   const { release, loading, error } = useRelease(slug || '');
    const [activeTab, setActiveTab] = useState<'overview' | 'subtitles' | 'lyrics' | 'production' | 'adopt' | 'credits' | 'commentary' | 'sponsors'>('credits');
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [selectedSubtitleLanguage, setSelectedSubtitleLanguage] = useState<string>('');
    const [selectedLyricsLanguage, setSelectedLyricsLanguage] = useState<LanguageKey>('roman_urdu');
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [release, setRelease] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [playerTarget, setPlayerTarget] = useState<any>(null);
    const [captionsEnabled, setCaptionsEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

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

    // Sync time interval
    useEffect(() => {
        if (!playerTarget) return;
        const interval = setInterval(async () => {
            if (playerTarget.getCurrentTime) {
                const time = await playerTarget.getCurrentTime();
                setCurrentTime(time);
            }
        }, 300);
        return () => clearInterval(interval);
    }, [playerTarget]);

    const handleSeekRequest = (time: number) => {
        if (playerTarget && playerTarget.seekTo) {
            playerTarget.seekTo(time, true);
        }
    };

    useEffect(() => {
        if (!slug) return;

        const fetchVideoDetails = async () => {
            try {
                // First, try to fetch from database
                const { data: dbRelease, error: dbError } = await supabase
                    .from('releases')
                    .select('*')
                    .eq('youtube_video_id', slug)
                    .eq('is_published', true)
                    .single();

                if (!dbError && dbRelease) {
                    console.log('Loaded release from database');
                    setRelease({
                        id: dbRelease.id,
                        release_title: dbRelease.release_title,
                        release_date: dbRelease.release_date,
                        description: dbRelease.description,
                        source: dbRelease.source || "youtube_legacy",
                        duration_seconds: dbRelease.duration_seconds,
                        views: dbRelease.views || 0,
                        likes: dbRelease.likes || 0,
                        youtube_video_id: dbRelease.youtube_video_id,
                        slug: dbRelease.slug,
                        thumbnail_url: dbRelease.thumbnail_url,
                        subtitles_available: false,
                        subtitle_languages: [],
                        lyrics: {},
                        credits: [],
                        lead_vocalists: [],
                        chorus_vocalists: [],
                        production_credits: {},
                        spotify_url: dbRelease.spotify_url || "",
                        apple_music_url: dbRelease.apple_music_url || ""
                    });
                    setLoading(false);
                    return;
                }

                // Fallback to YouTube API
                console.log('Database record not found, fetching from YouTube API...');
                const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyCw34bUCxl_8S5R8I-380YyFOLDqpWL-R4';
                const videoRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${slug}&key=${YOUTUBE_API_KEY}`
                );
                const data = await videoRes.json();

                if (!data.items || data.items.length === 0) {
                    setError("Video not found on SufiTube.");
                    setLoading(false);
                    return;
                }

                const v = data.items[0];

                const match = v.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                let h = 0, m = 0, s = 0;
                if (match) {
                    h = parseInt(match[1]) || 0;
                    m = parseInt(match[2]) || 0;
                    s = parseInt(match[3]) || 0;
                }
                const totalSeconds = h * 3600 + m * 60 + s;

                setRelease({
                    id: v.id,
                    release_title: v.snippet.title,
                    release_date: v.snippet.publishedAt,
                    description: v.snippet.description,
                    source: "youtube_legacy",
                    duration_seconds: totalSeconds,
                    views: parseInt(v.statistics.viewCount || '0'),
                    likes: parseInt(v.statistics.likeCount || '0'),
                    youtube_video_id: v.id,
                    slug: v.id,
                    subtitles_available: false,
                    subtitle_languages: [],
                    lyrics: {},
                    credits: [],
                    lead_vocalists: [],
                    chorus_vocalists: [],
                    production_credits: {},
                    spotify_url: "",
                    apple_music_url: ""
                });
            } catch (err: any) {
                console.error("Error fetching release:", err);
                setError(err.message || "Failed to load release details");
            } finally {
                setLoading(false);
            }
        };

        fetchVideoDetails();
    }, [slug]);
    if (loading) {
        return (
            <Layout>
                <PageContainer>
                    <div className="max-w-5xl mx-auto flex items-center justify-center min-h-96">
                        <div className="text-neutral-500">Loading release...</div>
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatCurrency = (cents: number) => {
        return (cents / 100).toFixed(2);
    };

    const formatDuration = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
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
    const writerCredits = release.credits?.filter((c: any) => c.credit_type === 'writer') || [];
    const vocalistCredits = release.credits?.filter((c: any) => c.credit_type === 'vocalist') || [];
    const producerCredits = release.credits?.filter((c: any) => c.credit_type === 'producer') || [];
    const engineerCredits = release.credits?.filter((c: any) => c.credit_type === 'engineer') || [];

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => {
            setCopySuccess(false);
            setShowCopyModal(false);
        }, 2000);
    };

    const handleShare = (platform: string) => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(release.release_title);

        const urls: Record<string, string> = {
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
    };

    const getAvailableLanguages = () => {
        if (!release.lyrics) return [];
        return Object.keys(release.lyrics).filter(key => release.lyrics![key as keyof typeof release.lyrics]);
    };

    return (
        <Layout>
            <PageContainer>
                <div className="max-w-7xl mx-auto">
                    {/* Admin Edit Button */}
                    {/* <div className="flex justify-end mb-4">
                        <Link
                            href={`/admin/release-credits/${release.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-neutral-400 hover:text-neutral-300 border border-neutral-800 hover:border-neutral-700 rounded transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Edit Production Credits
                        </Link>
                    </div> */}

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
                                <h1 className="text-5xl md:text-6xl font-serif font-light text-neutral-100 leading-tight flex-1">
                                    {release.release_title}
                                </h1>
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
                        {(release.youtube_video_id || (release.youtube_url && !release.youtube_url.includes('PLACEHOLDER'))) ? (
                            <div className="mb-8">
                                <div ref={containerRef} className={`bg-black overflow-hidden relative group ${isFullscreen ? 'fixed inset-0 z-[100] w-screen h-screen rounded-none' : 'aspect-video rounded-lg shadow-2xl border border-neutral-800'}`}>
                                    {!videoLoaded && (
                                        <>
                                            <img
                                                src={
                                                    release.thumbnail_url ||
                                                    `https://img.youtube.com/vi/${release.youtube_video_id || release.youtube_url?.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`
                                                }
                                                alt={release.release_title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const videoId = release.youtube_video_id || release.youtube_url?.split('v=')[1]?.split('&')[0];
                                                    if (e.currentTarget.src.includes('maxresdefault')) {
                                                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                                    } else if (e.currentTarget.src.includes('hqdefault')) {
                                                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                                                    } else if (!e.currentTarget.src.includes('default.jpg')) {
                                                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <button
                                                    onClick={() => setVideoLoaded(true)}
                                                    className="w-20 h-20 flex items-center justify-center bg-red-600 hover:bg-red-700 rounded-full shadow-2xl transform group-hover:scale-110 transition-all"
                                                    aria-label="Play video"
                                                >
                                                    <PlayCircle className="w-12 h-12 text-white" fill="white" />
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
                                            <div className="absolute inset-0 w-full h-full pointer-events-auto">
                                                <YouTube
                                                    videoId={release.youtube_video_id || slug}
                                                    opts={{
                                                        width: '100%',
                                                        height: '100%',
                                                        playerVars: {
                                                            autoplay: 1,
                                                            modestbranding: 1,
                                                            rel: 0,
                                                            playsinline: 1,
                                                            fs: 0
                                                        }
                                                    }}
                                                    onReady={(e) => setPlayerTarget(e.target)}
                                                    className="w-full h-full absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full"
                                                />
                                            </div>
                                            {/* Video Overlay for Captions */}
                                            {dummyTracks[selectedLyricsLanguage] && (
                                                <VideoOverlay
                                                    track={dummyTracks[selectedLyricsLanguage]}
                                                    currentTime={currentTime}
                                                    captionsEnabled={captionsEnabled}
                                                />
                                            )}
                                            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded text-xs text-neutral-400 pointer-events-none z-[11]">
                                                If video doesn't load, open this page in a new tab
                                            </div>
                                            <button
                                                onClick={toggleFullscreen}
                                                className="absolute top-4 right-4 z-[20] p-2 bg-black/60 hover:bg-black/90 rounded-md transition-all text-white opacity-0 group-hover:opacity-100 backdrop-blur-sm border border-white/10"
                                                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                                            >
                                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                                            </button>
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

                        {/* Tabs & Action Buttons */}
                        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4 mb-8 border-b border-neutral-800">
                            {/* Tabs Navigation */}
                            <div className="flex gap-1 overflow-x-auto pb-0">
                                <button
                                    onClick={() => setActiveTab('credits')}
                                    className={`px-4 sm:px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'credits'
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

                                {release.subtitles_available && release.subtitle_languages && release.subtitle_languages.length > 0 && (
                                    <button
                                        onClick={() => setActiveTab('subtitles')}
                                        className={`px-4 sm:px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'subtitles'
                                            ? 'text-neutral-100'
                                            : 'text-neutral-500 hover:text-neutral-300'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Subtitles className="w-4 h-4" />
                                            Subtitles
                                        </span>
                                        {activeTab === 'subtitles' && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                        )}
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('lyrics')}
                                    className={`px-4 sm:px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'lyrics'
                                        ? 'text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" />
                                        Select Lyrics Language
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
                                <button
                                    onClick={() => setActiveTab('adopt')}
                                    className={`px-4 sm:px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'adopt'
                                        ? 'text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    Adopt this Song
                                    {activeTab === 'adopt' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('commentary')}
                                    className={`px-4 sm:px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'commentary'
                                        ? 'text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4" />
                                        Commentary
                                    </span>
                                    {activeTab === 'commentary' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('sponsors')}
                                    className={`px-4 sm:px-6 py-3 font-medium text-sm transition-all relative whitespace-nowrap ${activeTab === 'sponsors'
                                        ? 'text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Award className="w-4 h-4" />
                                        Sponsors
                                    </span>
                                    {activeTab === 'sponsors' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-100"></div>
                                    )}
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 lg:pb-2">
                                {release.youtube_video_id && (
                                    <a
                                        href={`https://www.youtube.com/watch?v=${release.youtube_video_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-red-900/30 whitespace-nowrap"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                        Watch on YouTube
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
                        {activeTab === 'overview' && release.description && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-2xl font-medium text-neutral-100 mb-6">About This Release</h3>
                                    <div className="prose prose-invert max-w-none">
                                        <div className="text-neutral-300 leading-relaxed space-y-4 text-base">
                                            {formatDescription(release.description)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Credits Tab */}
                        {activeTab === 'credits' && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-3xl font-serif font-light text-neutral-100 mb-8">Official Credits</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Artistic Credits */}
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div> */}
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Mic className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Artistic Credits</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Lead Vocalist</p>
                                                    <p className="text-neutral-200">Ayaan Rahmani</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Lyricist</p>
                                                    <p className="text-neutral-200">Dr. Fayaz Khan</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Composer</p>
                                                    <p className="text-neutral-200">SufiPulse Studio</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Music Producer</p>
                                                    <p className="text-neutral-200">Hamza Qadri</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Background Vocals</p>
                                                    <p className="text-neutral-200">Studio Ensemble</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Production Credits */}
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div> */}
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Sliders className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Production Credits</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Recorded at</p>
                                                    <p className="text-neutral-200">SufiPulse Studio I</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Recording Engineer</p>
                                                    <p className="text-neutral-200">Bilal Ahmad</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Mix & Master</p>
                                                    <p className="text-neutral-200">Rehan Mir</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Sound Design</p>
                                                    <p className="text-neutral-200">SufiPulse Audio Unit</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual Credits */}
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div> */}
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Video className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Visual Credits</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Video Direction</p>
                                                    <p className="text-neutral-200">SufiTube Visual Desk</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Editing</p>
                                                    <p className="text-neutral-200">Danish Raina</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Thumbnail Design</p>
                                                    <p className="text-neutral-200">Creative Contributors Unit</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Artwork</p>
                                                    <p className="text-neutral-200">SufiPulse Studio Design Cell</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Literary & Language Credits */}
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            {/* <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div> */}
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Book className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Literary & Language</h4>
                                            </div>
                                            <div className="space-y-4 relative">
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Roman Transliteration</p>
                                                    <p className="text-neutral-200">Editorial Team</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">English Translation</p>
                                                    <p className="text-neutral-200">Language Desk</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Thematic Interpretation</p>
                                                    <p className="text-neutral-200">Literary Journal Team</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Proofreading</p>
                                                    <p className="text-neutral-200">Release Text Review Unit</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Release & Rights */}
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors md:col-span-2">
                                            {/* <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-105"></div> */}
                                            <div className="flex items-center gap-3 mb-6 relative">
                                                <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center">
                                                    <Shield className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <h4 className="text-xl font-medium text-neutral-100">Release & Rights</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Published by</p>
                                                    <p className="text-neutral-200">SufiPulse</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Platform</p>
                                                    <p className="text-neutral-200">SufiTube</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Registered Release ID</p>
                                                    <p className="text-neutral-200 font-mono text-sm">SP-RR-2026-021</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Release Date</p>
                                                    <p className="text-neutral-200">February 7, 2026</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Copyright Holder</p>
                                                    <p className="text-neutral-200 flex items-center gap-2">SufiPulse Studio <Check className="w-3 h-3 text-cyan-400" /></p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Licensing / Permissions</p>
                                                    <Link href="#" className="text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-400/30 text-sm">official contact or form</Link>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lyrics Tab */}
                        {activeTab === 'lyrics' && (
                            <LyricsTab
                                selectedLanguage={selectedLyricsLanguage}
                                onLanguageChange={setSelectedLyricsLanguage}
                                currentTime={currentTime}
                                onSeekRequest={handleSeekRequest}
                                captionsEnabled={captionsEnabled}
                                onToggleCaptions={() => setCaptionsEnabled(!captionsEnabled)}
                            />
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
                        {activeTab === 'adopt' && (
                            <AdoptTab release={release} />
                        )}

                        {/* Subtitles Tab */}
                        {activeTab === 'subtitles' && release.subtitles_available && release.subtitle_languages && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-xl font-medium text-neutral-100 mb-6">Select Subtitle Language</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                                        {release.subtitle_languages.map((lang: any) => {
                                            const langLabel = LANGUAGE_OPTIONS.find(opt => opt.key === lang)?.label || lang.toUpperCase();
                                            return (
                                                <button
                                                    key={lang}
                                                    onClick={() => setSelectedSubtitleLanguage(lang)}
                                                    className={`px-5 py-3 rounded-lg border font-medium transition-all ${selectedSubtitleLanguage === lang
                                                        ? 'bg-neutral-700 border-neutral-600 text-white shadow-lg'
                                                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:border-neutral-600'
                                                        }`}
                                                >
                                                    {langLabel}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedSubtitleLanguage && release.lyrics?.[selectedSubtitleLanguage as keyof typeof release.lyrics] && (
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 mt-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <Subtitles className="w-5 h-5 text-neutral-400" />
                                                <h4 className="text-lg font-medium text-neutral-100">
                                                    {LANGUAGE_OPTIONS.find(opt => opt.key === selectedSubtitleLanguage)?.label || selectedSubtitleLanguage.toUpperCase()} Subtitles
                                                </h4>
                                            </div>
                                            <div className="text-neutral-300 whitespace-pre-line leading-relaxed text-base">
                                                {release.lyrics[selectedSubtitleLanguage as keyof typeof release.lyrics]}
                                            </div>
                                        </div>
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
                                                    onClick={() => setSelectedLyricsLanguage(lang)}
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

                        {activeTab === 'lyrics' && getAvailableLanguages().length > 0 && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-xl font-medium text-neutral-100 mb-6">Select Lyrics Language</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                                        {getAvailableLanguages().map((lang) => {
                                            const langLabel = LANGUAGE_OPTIONS.find(opt => opt.key === lang)?.label || lang.toUpperCase();
                                            return (
                                                <button
                                                    key={lang}
                                                    onClick={() => setSelectedLyricsLanguage(lang as any)}
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
                        {activeTab === 'commentary' && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-3xl font-serif font-light text-neutral-100 mb-8">Commentary & Insights</h3>

                                    <div className="space-y-8">
                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            <h4 className="text-xl font-medium text-amber-400 mb-3">Historical Context</h4>
                                            <p className="text-neutral-300 leading-relaxed text-sm">
                                                This piece reflects a deep historical tradition of poetry that emphasizes the inward journey and the necessity of stepping away from the self. Drawing from classical metaphors, it connects the modern listener with timeless themes of devotion and surrender.
                                            </p>
                                        </div>

                                        <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-900/50 border border-neutral-800 rounded-xl relative overflow-hidden group hover:border-amber-400/30 transition-colors">
                                            <h4 className="text-xl font-medium text-amber-400 mb-3">Thematic Interpretation</h4>
                                            <p className="text-neutral-300 leading-relaxed text-sm">
                                                The core theme orbits around the dissolution of the ego (Fana). By using restrained instrumentation and a close-mic vocal approach, the focus remains fiercely locked on the lyrics, ensuring that the listener's attention is constantly brought back to the meaning rather than being distracted by spectacle.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sponsors Tab */}
                        {activeTab === 'sponsors' && (
                            <div className="pt-8">
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8">
                                    <h3 className="text-3xl font-serif font-light text-neutral-100 mb-8">Our Sponsors</h3>

                                    <p className="text-neutral-400 mb-8 max-w-2xl leading-relaxed">
                                        We are deeply grateful for the generous support of our sponsors who make these releases possible and contribute to the preservation of sacred arts.
                                    </p>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {/* Sponsor 1 */}
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center aspect-square group hover:border-amber-400/30 transition-colors">
                                            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Award className="w-8 h-8 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                                            </div>
                                            <p className="text-neutral-300 font-medium text-center">Global Trust</p>
                                            <p className="text-neutral-500 text-xs mt-1 text-center">Foundational Partner</p>
                                        </div>

                                        {/* Sponsor 2 */}
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center aspect-square group hover:border-amber-400/30 transition-colors">
                                            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Shield className="w-8 h-8 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                                            </div>
                                            <p className="text-neutral-300 font-medium text-center">Heritage Arts</p>
                                            <p className="text-neutral-500 text-xs mt-1 text-center">Cultural Sponsor</p>
                                        </div>

                                        {/* Sponsor 3 */}
                                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center justify-center aspect-square group hover:border-amber-400/30 transition-colors">
                                            <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Book className="w-8 h-8 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                                            </div>
                                            <p className="text-neutral-300 font-medium text-center">Sufi Institute</p>
                                            <p className="text-neutral-500 text-xs mt-1 text-center">Academic Partner</p>
                                        </div>

                                        {/* Placeholder for more */}
                                        <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center aspect-square hover:bg-neutral-900 transition-colors cursor-pointer group">
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

                    {/* Streaming Links - Below Tabs */}
                    {!isLegacy && (
                        <section className="mb-16">
                            <h2 className="text-2xl font-serif font-light text-neutral-100 mb-8">Streaming Platforms</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                                    <span className="text-neutral-300">Spotify</span>
                                    <span className="text-sm text-neutral-500">{release.spotify_url ? 'Available' : 'Distribution Pending'}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg">
                                    <span className="text-neutral-300">Apple Music</span>
                                    <span className="text-sm text-neutral-500">{release.apple_music_url ? 'Available' : 'Distribution Pending'}</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Economic Transparency - Below Tabs */}
                    {!isLegacy && (
                        <section className="mb-16">
                            <h2 className="text-2xl font-serif font-light text-neutral-100 mb-8">Economic Transparency</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                                    <div className="text-sm text-neutral-500 mb-2">Royalty Split</div>
                                    <div className="text-xl text-neutral-100">{release.royalty_split_percentage || 0}%</div>
                                </div>
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                                    <div className="text-sm text-neutral-500 mb-2">Royalty Agreements</div>
                                    <div className="text-xl text-neutral-100">{release.royalty_agreements?.length || 0} agreement{release.royalty_agreements?.length !== 1 ? 's' : ''}</div>
                                </div>
                                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6">
                                    <div className="text-sm text-neutral-500 mb-2">Revenue Records</div>
                                    <div className="text-xl text-neutral-100">{release.revenue_records?.length || 0} transaction{release.revenue_records?.length !== 1 ? 's' : ''}</div>
                                </div>
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
                                <h3 className="text-xl font-medium text-neutral-100">Share</h3>
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={() => handleCopyLink()}
                                    className="w-full flex items-center gap-4 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <Copy className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">Copy Link Text</div>
                                        {/* <div className="text-sm text-neutral-500">Share on Facebook</div> */}
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleShare('facebook')}
                                    className="w-full flex items-center gap-4 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
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
                                    className="w-full flex items-center gap-4 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
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
                                    className="w-full flex items-center gap-4 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left"
                                >
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <MessageSquare className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="text-neutral-100 font-medium">WhatsApp</div>
                                        <div className="text-sm text-neutral-500">Share on WhatsApp</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </PageContainer>
        </Layout>
    );
}

export default Release;
