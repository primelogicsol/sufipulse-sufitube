import React, { useState, useEffect } from "react";

type LyricSource = "YOUTUBE_DESCRIPTION_EXTRACTION" | "MANUAL" | "IMPORT";

interface CanonicalLyricsProps {
  initialLyrics?: {
    text: string;
    primaryLanguage: string;
    languages: string[];
    source: LyricSource;
    status: "DRAFT" | "REVIEWED" | "APPROVED";
    reviewedAt?: string;
    reviewedBy?: string;
    approvedAt?: string;
    approvedBy?: string;
  };
  onUpdate: (lyrics: any) => void;
  isLocked?: boolean;
}

const AVAILABLE_LANGS = [
  { id: "ur", label: "Urdu" },
  { id: "en-rom", label: "Roman Urdu" },
  { id: "ur-Latn", label: "Roman Urdu" },
  { id: "pa", label: "Punjabi" },
  { id: "ks", label: "Kashmiri" },
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
];

export function CanonicalLyricsSection({
  initialLyrics,
  onUpdate,
  isLocked = false,
}: CanonicalLyricsProps) {
  const [adminOverrideUnlocked, setAdminOverrideUnlocked] = useState(false);
  const effectiveLocked = isLocked && !adminOverrideUnlocked;

  const [text, setText] = useState(initialLyrics?.text || "");
  const [primaryLanguage, setPrimaryLanguage] = useState(
    initialLyrics?.primaryLanguage || "ur",
  );
  const [languages, setLanguages] = useState<string[]>(
    initialLyrics?.languages || ["ur"],
  );
  const [status, setStatus] = useState<"DRAFT" | "REVIEWED" | "APPROVED">(
    initialLyrics?.status || "DRAFT",
  );

  // Sync state if initialLyrics updates from server
  useEffect(() => {
    if (initialLyrics?.text && initialLyrics.text !== text) {
      setText(initialLyrics.text);
    }
    if (initialLyrics?.primaryLanguage) {
      setPrimaryLanguage(initialLyrics.primaryLanguage);
    }
    if (initialLyrics?.languages) {
      setLanguages(initialLyrics.languages);
    }
    if (initialLyrics?.status) {
      setStatus(initialLyrics.status);
    }
  }, [initialLyrics?.text, initialLyrics?.primaryLanguage, initialLyrics?.status]);

  const displayedStatus = effectiveLocked ? initialLyrics?.status || 'DRAFT' : status;

  // If editor modifies text or language, demote to DRAFT immediately in UI.
  useEffect(() => {
    if (effectiveLocked) return;
    const textModified = text !== (initialLyrics?.text || "");
    const primaryModified =
      primaryLanguage !== (initialLyrics?.primaryLanguage || "");
    const langsModified =
      JSON.stringify(languages) !==
      JSON.stringify(initialLyrics?.languages || []);

    let currentStatus = status;

    if (
      (textModified || primaryModified || langsModified) &&
      (status === "APPROVED" || status === "REVIEWED")
    ) {
      currentStatus = "DRAFT";
      setStatus("DRAFT");
    }

    if (text.trim() === "") {
      onUpdate(undefined); // Remove canonicalLyrics if empty
    } else {
      onUpdate({
        text,
        primaryLanguage,
        languages,
        source: initialLyrics?.source || "MANUAL",
        status: currentStatus,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, primaryLanguage, languages, status, effectiveLocked]);

  const handleReview = () => {
    setStatus("REVIEWED");
  };

  const handleApprove = () => {
    setStatus("APPROVED");
  };

  const toggleLanguage = (langId: string) => {
    setLanguages((prev) =>
      prev.includes(langId)
        ? prev.filter((id) => id !== langId)
        : [...prev, langId],
    );
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 space-y-5 mb-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Canonical Original Lyrics (Part I)
        </h2>
        <div className="flex items-center gap-2">
          {isLocked && (
            <button
              type="button"
              onClick={() => setAdminOverrideUnlocked(!adminOverrideUnlocked)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                adminOverrideUnlocked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30'
              }`}
              title={adminOverrideUnlocked ? 'Click to re-lock to Studio Master' : 'Click to unlock for editorial edits'}
            >
              <span>{adminOverrideUnlocked ? '🔓 Editing Unlocked' : '🔒 Locked to Studio Master'}</span>
            </button>
          )}
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              displayedStatus === "APPROVED"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : displayedStatus === "REVIEWED"
                ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}
          >
            {displayedStatus}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {effectiveLocked && (
          <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200/90 leading-relaxed flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>Locked to Studio Master:</strong> Canonical lyrics are linked to the authoritative vocal alignment. Click unlock to make editorial modifications.
            </div>
            <button
              type="button"
              onClick={() => setAdminOverrideUnlocked(true)}
              className="px-3 py-1.5 bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-400/40 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              🔓 Unlock for Editorial Edit
            </button>
          </div>
        )}

        {adminOverrideUnlocked && (
          <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200 leading-relaxed flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong>🔓 Editorial Edit Mode Active:</strong> You can freely edit the lyrics text, primary language, or language tracks below.
            </div>
            <button
              type="button"
              onClick={() => setAdminOverrideUnlocked(false)}
              className="px-3 py-1.5 bg-amber-600/40 hover:bg-amber-600/60 text-amber-200 border border-amber-400/40 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
            >
              🔒 Re-lock to Master
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Primary Language
            </label>
            <select
              value={effectiveLocked ? initialLyrics?.primaryLanguage || 'ur' : primaryLanguage}
              disabled={effectiveLocked}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPrimaryLanguage(e.target.value)
              }
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${
                effectiveLocked
                  ? 'bg-neutral-950/70 border-white/10 text-neutral-300 cursor-not-allowed'
                  : 'bg-neutral-950 border-white/10 text-white focus:border-amber-400'
              }`}
            >
              {AVAILABLE_LANGS.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-neutral-900 text-white">
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              {effectiveLocked ? 'Approved Language Tracks (Not Sung Languages)' : 'All Sung Languages'}
            </label>
            <div className="flex flex-wrap gap-2.5 mt-2">
              {(effectiveLocked ? AVAILABLE_LANGS.filter(lang => (initialLyrics?.languages || []).includes(lang.id)) : AVAILABLE_LANGS).map((lang) => (
                <label
                  key={lang.id}
                  className={`inline-flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 ${
                    effectiveLocked ? 'cursor-not-allowed text-neutral-400' : 'cursor-pointer text-white hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(effectiveLocked ? initialLyrics?.languages || [] : languages).includes(lang.id)}
                    disabled={effectiveLocked}
                    onChange={() => toggleLanguage(lang.id)}
                    className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span>{lang.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
            Lyrics Text (Part I Only)
          </label>
          <textarea
            rows={14}
            placeholder="Paste canonical original lyrics here..."
            value={effectiveLocked ? (initialLyrics?.text || text) : text}
            readOnly={effectiveLocked}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setText(e.target.value);
            }}
            className={`w-full px-4 py-3 border rounded-xl font-mono text-xs md:text-sm leading-relaxed outline-none transition-colors ${
              effectiveLocked
                ? 'bg-black/40 border-white/10 text-neutral-200 cursor-default'
                : 'bg-black/60 border-amber-500/50 text-white focus:border-amber-400 shadow-inner'
            }`}
          />
        </div>

        {!effectiveLocked && (
          <div className="flex justify-end space-x-2 pt-2">
            {status === "DRAFT" && text.trim().length > 0 && (
              <button
                type="button"
                onClick={handleReview}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-colors shadow"
              >
                Mark as Reviewed
              </button>
            )}
            {status === "REVIEWED" && (
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow"
              >
                Approve Canonical Lyrics
              </button>
            )}
          </div>
        )}

        {displayedStatus === "APPROVED" && (
          <div className="text-xs text-emerald-300 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20 flex items-center gap-2">
            <span>✓</span>
            <span>
              Lyrics have been editorially verified and approved. Modifying the text or language will revoke approval.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
