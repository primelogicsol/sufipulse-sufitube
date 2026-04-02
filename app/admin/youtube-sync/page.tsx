"use client";
import { useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Youtube, RefreshCw, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase-client';

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
            const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyCw34bUCxl_8S5R8I-380YyFOLDqpWL-R4';
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

            setTotal(allVideoIds.length);
            setMessage(`Found ${allVideoIds.length} videos. Syncing to database...`);

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

            let syncedCount = 0;
            for (const video of allVideos) {
                const match = video.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                let h = 0, m = 0, s = 0;
                if (match) {
                    h = parseInt(match[1]) || 0;
                    m = parseInt(match[2]) || 0;
                    s = parseInt(match[3]) || 0;
                }
                const totalSeconds = h * 3600 + m * 60 + s;

                const { error } = await supabase
                    .from('releases')
                    .upsert({
                        youtube_video_id: video.id,
                        slug: video.id,
                        release_title: video.snippet.title,
                        description: video.snippet.description,
                        release_date: video.snippet.publishedAt,
                        duration_seconds: totalSeconds,
                        views: parseInt(video.statistics.viewCount || '0'),
                        likes: parseInt(video.statistics.likeCount || '0'),
                        thumbnail_url: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
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
                setMessage(`Synced ${syncedCount} of ${allVideos.length} videos...`);
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
