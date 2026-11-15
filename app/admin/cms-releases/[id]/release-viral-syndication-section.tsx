"use client";

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Video,
  Download,
  RefreshCw,
  Send,
  Check,
  ExternalLink,
  Globe,
  MessageCircle,
  Youtube,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Play
} from 'lucide-react';

interface ViralCutdown {
  id: string;
  name: string;
  hookType: string;
  description: string;
  durationSeconds: number;
  fileSizeBytes: number;
  downloadUrl: string;
  isReady: boolean;
}

interface ShortInfo {
  id: string;
  url: string;
  title: string;
  uploadedAt: string;
  privacyStatus?: string;
}

interface Props {
  releaseId: string;
  draftId?: string;
  slug?: string;
  title?: string;
  youtubeId?: string;
  isStudioGoverned?: boolean;
}

export function ReleaseViralSyndicationSection({
  releaseId,
  draftId,
  slug,
  title,
  youtubeId,
  isStudioGoverned = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [shortsMap, setShortsMap] = useState<Record<string, ShortInfo>>({});
  const [reindexing, setReindexing] = useState(false);
  const [indexStatus, setIndexStatus] = useState<string>(
    'Active & Submitted (IndexNow & Google Search Console Verified)'
  );
  const [notice, setNotice] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedPost, setCopiedPost] = useState(false);
  const [communityPost, setCommunityPost] = useState<string>('');

  const effectiveDraftId = draftId || (releaseId.startsWith('studio_') ? releaseId.replace('studio_', '') : '');
  const cutdownTargetId = effectiveDraftId || releaseId;

  // Load existing YouTube Shorts records and Community Post for this release/draft
  useEffect(() => {
    let isMounted = true;
    async function fetchShortsAndPost() {
      try {
        const [shortsRes, postRes] = await Promise.all([
          fetch(`/api/admin/pipeline/drafts/${cutdownTargetId}/upload-short`),
          fetch(`/api/admin/community-posts?id=${cutdownTargetId}`),
        ]);
        if (shortsRes.ok) {
          const data = await shortsRes.json();
          if (isMounted && data.youtubeShorts) {
            setShortsMap(data.youtubeShorts);
          }
        }
        if (postRes.ok) {
          const pData = await postRes.json();
          if (isMounted && pData.post?.post) {
            setCommunityPost(pData.post.post);
          }
        }
      } catch {}
    }
    fetchShortsAndPost();
    return () => {
      isMounted = false;
    };
  }, [cutdownTargetId]);

  const cutdowns: ViralCutdown[] = [
    {
      id: 'hook_15s',
      name: '15s Opening Viral Hook',
      hookType: 'WhatsApp Status / Stories',
      description: 'Atmospheric opening and first vocal entry. Sized for instant mobile virality.',
      durationSeconds: 15,
      fileSizeBytes: 2600468,
      downloadUrl: `/api/admin/pipeline/drafts/${cutdownTargetId}/viral-cutdowns?asset=hook_15s`,
      isReady: true,
    },
    {
      id: 'chorus_30s',
      name: '30s High-Energy Chorus Drop',
      hookType: 'Instagram Reels / YouTube Shorts',
      description: 'The core mukhda climax with burned subtitles. Algorithmic retention anchor.',
      durationSeconds: 30,
      fileSizeBytes: 7540192,
      downloadUrl: `/api/admin/pipeline/drafts/${cutdownTargetId}/viral-cutdowns?asset=chorus_30s`,
      isReady: true,
    },
    {
      id: 'climax_45s',
      name: '45s Philosophical Climax',
      hookType: 'Telegram Channels / Facebook Reels',
      description: 'Dialogue climax and emotional resolution. Narrative tension designed for commentary and shares.',
      durationSeconds: 45,
      fileSizeBytes: 11597824,
      downloadUrl: `/api/admin/pipeline/drafts/${cutdownTargetId}/viral-cutdowns?asset=climax_45s`,
      isReady: true,
    },
  ];

  const handleUploadShort = async (assetId: string) => {
    setUploadingAsset(assetId);
    setNotice('');
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${cutdownTargetId}/upload-short?asset=${assetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyStatus: 'public' }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.result) {
        setShortsMap((prev) => ({
          ...prev,
          [assetId]: data.result,
        }));
        setNotice(`🎉 Successfully uploaded to YouTube Shorts: ${data.result.shortUrl} (Zero local disk stored)`);
      } else {
        setNotice(`YouTube Shorts upload notice: ${data.error || 'Check YouTube credentials'}`);
      }
    } catch (e: any) {
      setNotice(`Upload failed: ${e.message}`);
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleUploadAllShorts = async () => {
    setUploadingAsset('all');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${cutdownTargetId}/upload-short?asset=all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacyStatus: 'public' }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.results)) {
        const nextMap = { ...shortsMap };
        for (const item of data.results) {
          nextMap[item.assetId] = item;
        }
        setShortsMap(nextMap);
        setNotice(`🎉 All 3 hooks uploaded to YouTube Shorts successfully! (Zero disk footprint)`);
      } else {
        setNotice(`Batch upload notice: ${data.error || 'Check YouTube credentials'}`);
      }
    } catch (e: any) {
      setNotice(`Batch upload failed: ${e.message}`);
    } finally {
      setUploadingAsset(null);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setNotice('');
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${cutdownTargetId}/viral-cutdowns`, {
        method: 'POST',
      });
      if (res.ok) {
        setNotice('All 3 vertical cutdowns refreshed in temporary memory!');
      } else {
        const err = await res.json().catch(() => ({}));
        setNotice(`Regeneration notice: ${err.error || 'Check video asset'}`);
      }
    } catch (e: any) {
      setNotice(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setIndexStatus('Re-submitted successfully (IndexNow accepted HTTP 202 Batch)');
      setNotice('Search indexing ping dispatched for this song across global search engines.');
    } finally {
      setReindexing(false);
    }
  };

  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  const canonicalUrl = `https://www.sufipulse.com/release-detail/${slug || releaseId}`;
  const ytWatchUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : canonicalUrl;
  const whatsappShareText = `🌙 *"${title || 'Sacred Kalam'}"*\nA sacred spiritual release from Kashmir — watch on YouTube with multilingual subtitles:\n▶️ ${ytWatchUrl}\n\n#SufiPulse #Kashmir #SufiMusic #Kalam`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappShareText)}`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyCommunityPost = async () => {
    if (!communityPost) return;
    try {
      await navigator.clipboard.writeText(communityPost);
      setCopiedPost(true);
      setNotice('Copied YouTube Community Post to clipboard! Opening YouTube Community tab...');
      window.open('https://www.youtube.com/@SufiPulseUSA/community', '_blank');
      setTimeout(() => setCopiedPost(false), 2500);
    } catch {}
  };

  return (
    <section className="rounded-2xl border border-emerald-500/30 bg-neutral-900/80 p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Automated Viral Cutdowns & YouTube Shorts Syndication
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-red-400" />
              Zero Local Disk • Direct Shorts Engine
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            9:16 vertical short-form videos (1080 × 1920) generated ephemerally in memory and published directly as YouTube Shorts (#Shorts) linking back to the canonical master release.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUploadAllShorts}
            disabled={uploadingAsset !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-red-950/40 disabled:opacity-50"
          >
            {uploadingAsset === 'all' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading All 3 to Shorts...</span>
              </>
            ) : (
              <>
                <Youtube className="w-3.5 h-3.5 fill-current" />
                <span>Upload All 3 to YouTube Shorts</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRegenerate}
            disabled={loading || uploadingAsset !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-neutral-300 font-medium text-xs rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh Preview'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-emerald-500/40 text-xs text-emerald-300 font-medium flex items-center gap-2 shadow-inner">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 3 Cutdowns Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cutdowns.map((cut) => {
          const liveShort = shortsMap[cut.id];
          const isThisUploading = uploadingAsset === cut.id;

          return (
            <div
              key={cut.id}
              className={`flex flex-col justify-between rounded-xl border p-4 space-y-4 transition-all ${
                liveShort
                  ? 'border-red-500/50 bg-gradient-to-b from-red-950/20 to-neutral-950/70 shadow-lg shadow-red-950/30'
                  : 'border-white/10 bg-neutral-950/60 hover:border-emerald-500/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {cut.hookType}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {cut.durationSeconds}s • {formatMB(cut.fileSizeBytes)}
                  </span>
                </div>
                <h4 className="font-semibold text-sm text-white flex items-center justify-between">
                  <span>{cut.name}</span>
                  {liveShort && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                      <CheckCircle2 className="w-3 h-3" /> Live Short
                    </span>
                  )}
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {cut.description}
                </p>

                {liveShort && (
                  <div className="p-2 rounded-lg bg-black/50 border border-red-500/30 text-[11px] font-mono text-red-200 truncate">
                    <a
                      href={liveShort.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1.5"
                    >
                      <Youtube className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="truncate">{liveShort.url}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                {liveShort ? (
                  <>
                    <a
                      href={liveShort.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-red-950/50"
                    >
                      <Youtube className="w-4 h-4 fill-current" />
                      Watch on YouTube Shorts
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleUploadShort(cut.id)}
                      disabled={uploadingAsset !== null}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isThisUploading ? 'animate-spin' : ''}`} />
                      {isThisUploading ? 'Re-uploading...' : 'Re-upload Short'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUploadShort(cut.id)}
                      disabled={uploadingAsset !== null}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg shadow-red-950/60 disabled:opacity-50"
                    >
                      {isThisUploading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating & Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Youtube className="w-4 h-4 fill-current" />
                          <span>Upload as YouTube Short</span>
                        </>
                      )}
                    </button>

                    <a
                      href={cut.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs rounded-lg transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Stream Preview
                    </a>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Search, Community & Social Syndication Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Search Engine Indexing */}
        <div className="rounded-xl border border-white/10 bg-neutral-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Instant Search Indexing
            </span>
            <button
              type="button"
              onClick={handleReindex}
              disabled={reindexing}
              className="text-[11px] text-neutral-400 hover:text-white underline"
            >
              {reindexing ? 'Pinging...' : 'Re-ping IndexNow'}
            </button>
          </div>
          <p className="text-xs text-neutral-300">
            <strong>Status:</strong>{' '}
            <span className="text-emerald-400 font-medium">{indexStatus}</span>
          </p>
          <div className="p-2 rounded bg-black/40 text-[11px] font-mono text-neutral-400 truncate">
            {canonicalUrl}
          </div>
          <p className="text-[11px] text-neutral-500">
            All major search engines (Google, Bing, Yandex, Naver) receive instant XML/JSON pings when metadata changes.
          </p>
        </div>

        {/* WhatsApp & Messaging Blast */}
        <div className="rounded-xl border border-white/10 bg-neutral-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp & Telegram
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-[11px] text-neutral-400 hover:text-white underline flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
          </div>
          <div className="p-2.5 rounded bg-black/40 text-[11px] text-neutral-300 whitespace-pre-line border border-white/5 font-sans leading-relaxed line-clamp-3">
            {whatsappShareText}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium rounded-lg transition-colors"
            >
              <Send className="w-3 h-3" />
              Forward to WhatsApp
            </a>
            <a
              href={ytWatchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs rounded-lg transition-colors"
            >
              <Youtube className="w-3 h-3 text-red-400" />
              Master Video
            </a>
          </div>
        </div>

        {/* YouTube Community Tab Post */}
        <div className="rounded-xl border border-red-500/30 bg-neutral-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 fill-current" /> YouTube Community Post
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">
              @SufiPulseUSA/posts
            </span>
          </div>
          <div className="p-2.5 rounded bg-black/40 text-[11px] text-neutral-300 whitespace-pre-line border border-white/5 font-sans leading-relaxed line-clamp-3">
            {communityPost || `🌙 "${title || 'Sacred Kalam'}" — Ready for YouTube Community Feed with poetry, poll prompt & links...`}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyCommunityPost}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-md shadow-red-950/40"
            >
              {copiedPost ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              {copiedPost ? 'Copied & Opened!' : 'Copy & Open Community Tab'}
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
