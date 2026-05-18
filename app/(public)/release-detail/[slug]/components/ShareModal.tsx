"use client";

import React from "react";
import {
  X,
  Clock,
  Copy,
  Facebook,
  Twitter,
  MessageSquare,
  Linkedin,
  Send,
} from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resolvedVideoId: string | null;
  currentTime: number;
  formatDuration: (seconds: number) => string;
  handleShareMoment: () => void;
  handleCopyLink: () => void;
  handleShare: (platform: string) => void;
}

export function ShareModal({
  isOpen,
  onClose,
  resolvedVideoId,
  currentTime,
  formatDuration,
  handleShareMoment,
  handleCopyLink,
  handleShare,
}: ShareModalProps) {
  if (!isOpen) return null;

  const platforms = [
    {
      id: "facebook",
      label: "Facebook",
      desc: "Share on Facebook",
      icon: Facebook,
      color: "#1877F2",
    },
    {
      id: "twitter",
      label: "Twitter",
      desc: "Share on Twitter",
      icon: Twitter,
      color: "#1DA1F2",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      desc: "Share on WhatsApp",
      icon: MessageSquare,
      color: "#25D366",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      desc: "Share on LinkedIn",
      icon: Linkedin,
      color: "#0A66C2",
    },
    {
      id: "telegram",
      label: "Telegram",
      desc: "Share on Telegram",
      icon: Send,
      color: "#0088CC",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-[32px] p-6 max-w-[420px] w-full shadow-2xl relative select-none animate-in fade-in zoom-in-95 duration-200"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-1">
          <div className="flex items-center justify-start gap-3">
            <div className="w-1 h-8 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            <img
              src="/sufitube-logo-v5.png"
              alt="SufiTube Share"
              className="h-8 object-contain"
            />
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-neutral-400 hover:text-white transition-all border border-white/5"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Helper text */}
        <div className="mb-6 px-1">
          <p className="text-xs text-white/50 leading-relaxed font-light text-left">
            Social shares use the YouTube link — helping this reach more listeners.
          </p>
        </div>

        <div className="w-full space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
          {/* Share this moment - ENTIRE group anchored left */}
          {resolvedVideoId && currentTime > 5 && (
            <button
              onClick={() => {
                handleShareMoment();
                onClose();
              }}
              className="w-full flex items-start justify-start gap-3 px-4 py-4 bg-amber-900/10 border border-amber-800/20 hover:bg-amber-900/20 rounded-2xl transition-all text-left group"
            >
              <div className="shrink-0 mt-0.5">
                <div className="w-9 h-9 bg-amber-600 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/30">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-white font-semibold leading-tight">
                  Share this moment
                </span>
                <span className="text-white/40 text-sm leading-tight mt-1">
                  YouTube link at {formatDuration(Math.floor(currentTime))}
                </span>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              handleCopyLink();
              onClose();
            }}
            className="w-full flex items-start justify-start gap-3 px-4 py-4 bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 rounded-2xl transition-all text-left group"
          >
            <div className="shrink-0 mt-0.5">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Copy className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-white font-semibold leading-tight">
                Copy Page Link
              </span>
              <span className="text-white/40 text-sm leading-tight mt-1">
                sufipulse.com link to clipboard
              </span>
            </div>
          </button>

          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                handleShare(p.id);
                onClose();
              }}
              className="w-full flex items-start justify-start gap-3 px-4 py-4 bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 rounded-2xl transition-all text-left group"
            >
              <div className="shrink-0 mt-0.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                  style={{ backgroundColor: p.color }}
                >
                  <p.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-white font-semibold leading-tight">
                  {p.label}
                </span>
                <span className="text-white/40 text-sm leading-tight mt-1">
                  {p.desc}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
