"use client";

import React, { useState } from 'react';
import { Sparkles, Video, Download, RefreshCw, Send, Check, ExternalLink, Globe, MessageCircle } from 'lucide-react';

const VIDEO = 'https://www.youtube.com/watch?v=wYFfuBS78ZI';
const TITLE = 'Kashmir, How Long Will You Remain Silent?';
const FACEBOOK = [
  TITLE,
  '',
  "Kashmir lakes, rivers, forests and wetlands need informed action, not silence. This original Urdu Sufi environmental kalam challenges us to protect the creation entrusted to humanity.",
  '',
  'Watch the complete SufiPulse USA film: ' + VIDEO,
  '',
  'What environmental problem needs urgent action in your district?',
  '#SufiPulseUSA #KashmirEnvironment #KabTakKhamosh #Kashmir',
].join('\n');

const INSTAGRAM = [
  'KAB TAK KHAMOSH? | HOW LONG WILL YOU REMAIN SILENT?',
  '',
  "From Dal Lake and Wular to the Jhelum, Kashmir’s environment is calling for accountability. A Sufi kalam about our responsibility toward creation.",
  '',
  'Watch the complete film on YouTube @SufiPulse-USA (link in profile, when added).',
  'What is the most urgent environmental concern in your district?',
  '',
  '#SufiPulseUSA #KashmirEnvironment #KabTakKhamosh #SufiMusic #Kashmir',
].join('\n');

export function SocialDistributionPanel({ draftId, youtubeVideoId }: { draftId: string; youtubeVideoId?: string }) {
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const videoUrl = youtubeVideoId ? 'https://www.youtube.com/watch?v=' + youtubeVideoId : VIDEO;
  const fbPost = FACEBOOK.replace(VIDEO, videoUrl);

  const copy = async (value: string, name: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(name + ' copied.');
      setTimeout(() => setNotice(''), 2500);
    } catch {
      setNotice('Clipboard permission denied. Select and copy the text manually.');
    }
  };

  const handleRegenerateCutdowns = async () => {
    setLoading(true);
    setNotice('');
    try {
      const res = await fetch(`/api/admin/pipeline/drafts/${draftId}/viral-cutdowns`, {
        method: 'POST',
      });
      if (res.ok) {
        setNotice('All 3 vertical cutdowns regenerated successfully from master!');
      } else {
        const err = await res.json().catch(() => ({}));
        setNotice(`Regeneration: ${err.error || 'Failed'}`);
      }
    } catch (e: any) {
      setNotice(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cutdowns = [
    {
      id: 'hook_15s',
      name: '15s Opening Viral Hook',
      target: 'WhatsApp Status / Stories',
      desc: '2.5 MB • Atmospheric opening + vocal hook',
      url: `/api/admin/pipeline/drafts/${draftId}/viral-cutdowns?asset=hook_15s`,
    },
    {
      id: 'chorus_30s',
      name: '30s High-Energy Chorus Drop',
      target: 'Instagram Reels / Shorts',
      desc: '7.2 MB • Main mukhda climax with burned captions',
      url: `/api/admin/pipeline/drafts/${draftId}/viral-cutdowns?asset=chorus_30s`,
    },
    {
      id: 'climax_45s',
      name: '45s Dialogue Climax',
      target: 'Telegram / Facebook Reels',
      desc: '11.1 MB • Shayar vs. Rab interrogation',
      url: `/api/admin/pipeline/drafts/${draftId}/viral-cutdowns?asset=climax_45s`,
    },
  ];

  return (
    <section className="space-y-4 rounded-xl border border-emerald-500/30 bg-neutral-900/90 p-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Viral Short-Form Cutdowns & Kashmir Syndication
          </h4>
          <p className="text-xs text-white/70 mt-0.5">
            Standard 9:16 vertical short-form reels (1080 × 1920) automatically generated with burned captions.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRegenerateCutdowns}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {notice && (
        <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
          {notice}
        </div>
      )}

      {/* 3 Cutdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {cutdowns.map((cut) => (
          <div key={cut.id} className="rounded-lg border border-white/10 bg-black/40 p-3 space-y-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 block w-fit">
              {cut.target}
            </span>
            <div className="text-xs font-semibold text-white">{cut.name}</div>
            <div className="text-[11px] text-neutral-400 font-mono">{cut.desc}</div>
            <div className="pt-1 flex flex-col gap-1.5">
              <a
                href={cut.url}
                download
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download MP4
              </a>
              <a
                href={cut.url}
                target="_blank"
                rel="noreferrer"
                className="text-center text-[11px] text-neutral-400 hover:text-white"
              >
                Preview Video
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Social Platforms & Direct Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
          <h5 className="text-xs font-semibold text-white flex items-center justify-between">
            <span>Facebook Page & Reels</span>
            <a href="https://www.facebook.com/profile.php?id=61591758150138" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-[11px]">Open Page</a>
          </h5>
          <button
            type="button"
            className="w-full rounded bg-blue-600/80 hover:bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
            onClick={() => copy(fbPost, 'Facebook caption')}
          >
            Copy Facebook Caption
          </button>
        </div>

        <div className="space-y-2 rounded-lg border border-white/10 bg-black/30 p-3">
          <h5 className="text-xs font-semibold text-white flex items-center justify-between">
            <span>Instagram Reels</span>
            <a href="https://www.instagram.com/sufipulseusa/" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline text-[11px]">Open Instagram</a>
          </h5>
          <button
            type="button"
            className="w-full rounded bg-fuchsia-700/80 hover:bg-fuchsia-700 px-3 py-1.5 text-xs font-semibold text-white"
            onClick={() => copy(INSTAGRAM, 'Instagram caption')}
          >
            Copy Instagram Caption
          </button>
        </div>
      </div>
    </section>
  );
}
