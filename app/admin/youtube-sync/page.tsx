"use client";
import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Youtube, RefreshCw, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase-client';

const isStandaloneMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function YouTubeSync() {
    const [syncing, setSyncing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const syncFromYouTube = async () => {
        setSyncing(true);
        setStatus('syncing');
        setMessage('Fetching videos from YouTube...');
        setProgress(0);

        try {
            const { youtubeService } = await import('../../../lib/youtube-service');

            // Check if quota is exceeded
            if (youtubeService.isQuotaExceeded()) {
                const resetTime = youtubeService.getQuotaResetTime();
                setStatus('error');
                setMessage(`YouTube API quota exceeded. ${resetTime ? `Resets at ${resetTime.toLocaleString()}` : 'Please try again later.'}`);
                setSyncing(false);
                return;
            }

            // Get all videos (this will use the service's search method)
            const videos = await youtubeService.searchVideos('', 50, 'date'); // Get latest 50 videos

            if (!supabase) {
                setStatus('error');
                setMessage('Supabase is not configured. Cannot sync to database in standalone mode.');
                setSyncing(false);
                return;
            }

            setTotal(videos.length);
            setMessage(`Found ${videos.length} videos. Syncing to database...`);

            let syncedCount = 0;
            for (const video of videos) {
                const { error } = await supabase
                    .from('releases')
                    .upsert({
                        youtube_video_id: video.id,
                        slug: video.id,
                        release_title: video.title,
                        description: video.description,
                        release_date: video.publishedDate,
                        duration_seconds: video.durationSeconds,
                        views: video.views,
                        thumbnail_url: video.thumbnailUrl,
                        source: 'youtube_legacy',
                        workflow_state: 'published',
                        is_published: true
                    }, {
                        onConflict: 'youtube_video_id'
                    });

                if (!error) {
                    syncedCount++;
                }

                setProgress(syncedCount);
                setMessage(`Synced ${syncedCount} of ${videos.length} videos...`);
            }

            setStatus('success');
            setMessage(`Successfully synced ${syncedCount} videos to database!`);
        } catch (err: any) {
            setStatus('error');
            setMessage(`Error: ${err.message}`);
            console.error(err);
        } finally {
            setSyncing(false);
        }
    };

    if (isStandaloneMode) {
        return (
            <Layout>
                <PageContainer>
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-4xl font-serif font-light text-neutral-100 mb-4">
                                YouTube Sync
                            </h1>
                            <p className="text-neutral-400">
                                Sync all videos from your YouTube channel to the CMS database.
                            </p>
                        </div>
                        <div className="bg-amber-950/40 border border-amber-700/50 rounded-lg p-8 flex items-start gap-4">
                            <Database className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-lg font-semibold text-amber-300 mb-2">Backend Required</h2>
                                <p className="text-amber-200/80 text-sm leading-relaxed">
                                    YouTube Sync writes directly to a Supabase database and is only available when the
                                    full backend is configured. In standalone mode, releases are managed through the
                                    CMS Dashboard and stored locally in your browser.
                                </p>
                                <p className="text-amber-200/60 text-xs mt-3">
                                    To enable: set <code className="bg-amber-950 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
                                    <code className="bg-amber-950 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment.
                                </p>
                            </div>
                        </div>
                    </div>
                </PageContainer>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageContainer>
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-serif font-light text-neutral-100 mb-4">
                            YouTube Sync
                        </h1>
                        <p className="text-neutral-400">
                            Sync all videos from your YouTube channel to the CMS database.
                        </p>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center">
                                <Youtube className="w-8 h-8 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-medium text-neutral-100">Sync from YouTube</h2>
                                <p className="text-sm text-neutral-500">
                                    This will fetch all videos and save them to your database
                                </p>
                            </div>
                        </div>

                        {status === 'idle' && (
                            <button
                                onClick={syncFromYouTube}
                                disabled={syncing}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Start Sync
                            </button>
                        )}

                        {status === 'syncing' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-blue-400">
                                    <Loader className="w-5 h-5 animate-spin" />
                                    <span>{message}</span>
                                </div>
                                {total > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-neutral-400">
                                            <span>Progress</span>
                                            <span>{progress} / {total}</span>
                                        </div>
                                        <div className="w-full bg-neutral-800 rounded-full h-2">
                                            <div
                                                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${(progress / total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-green-400">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>{message}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        setProgress(0);
                                        setTotal(0);
                                        setMessage('');
                                    }}
                                    className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
                                >
                                    Sync Again
                                </button>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <span>{message}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setStatus('idle');
                                        setProgress(0);
                                        setTotal(0);
                                        setMessage('');
                                    }}
                                    className="w-full px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-300">
                                <p className="font-medium mb-1">What does this do?</p>
                                <ul className="space-y-1 text-blue-400">
                                    <li>• Fetches all videos from your YouTube channel</li>
                                    <li>• Saves video metadata to the database</li>
                                    <li>• Updates existing records if videos already exist</li>
                                    <li>• Allows you to manage and enhance releases in the CMS</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </PageContainer>
        </Layout>
    );
}
