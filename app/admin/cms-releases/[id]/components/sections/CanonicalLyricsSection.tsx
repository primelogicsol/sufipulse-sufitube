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
  const displayedStatus = isLocked ? initialLyrics?.status || 'DRAFT' : status;

  // If editor modifies text or language, demote to DRAFT immediately in UI.
  useEffect(() => {
    if (isLocked) return;
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
  }, [text, primaryLanguage, languages, status, isLocked]);

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
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Locked to Studio Master
            </span>
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
        {isLocked && (
          <div className="p-3.5 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs text-purple-200/90 leading-relaxed">
            <strong>Immutable Production Lyrics:</strong> Canonical lyrics are approved and locked to the authoritative Studio vocal alignment. Modifications require creating a new revision in the Hybrid Studio Pipeline.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
              Primary Language
            </label>
            <select
              value={isLocked ? initialLyrics?.primaryLanguage || 'en-rom' : primaryLanguage}
              disabled={isLocked}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPrimaryLanguage(e.target.value)
              }
              className={`w-full px-3 py-2.5 border rounded-lg text-sm ${
                isLocked
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
              {isLocked ? 'Approved Language Tracks (Not Sung Languages)' : 'All Sung Languages'}
            </label>
            <div className="flex flex-wrap gap-2.5 mt-2">
              {(isLocked ? AVAILABLE_LANGS.filter(lang => (initialLyrics?.languages || []).includes(lang.id)) : AVAILABLE_LANGS).map((lang) => (
                <label
                  key={lang.id}
                  className={`inline-flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 ${
                    isLocked ? 'cursor-not-allowed text-neutral-400' : 'cursor-pointer text-white hover:bg-white/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(isLocked ? initialLyrics?.languages || [] : languages).includes(lang.id)}
                    disabled={isLocked}
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
            value={isLocked ? initialLyrics?.text || '' : text}
            readOnly={isLocked}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setText(e.target.value)
            }
            className={`w-full px-4 py-3 border rounded-xl font-mono text-xs md:text-sm leading-relaxed outline-none transition-colors ${
              isLocked
                ? 'bg-black/40 border-white/10 text-neutral-200 cursor-default'
                : 'bg-black/60 border-white/15 text-white focus:border-amber-400'
            }`}
          />
        </div>

        {!isLocked && (
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
            {status === "REVIEWED" && initialLyrics?.status === "REVIEWED" && (
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow"
              >
                Approve Canonical Lyrics
              </button>
            )}
            {status === "REVIEWED" && initialLyrics?.status !== "REVIEWED" && (
              <span className="text-xs text-neutral-400 py-2 self-center">
                Save changes to enable approval.
              </span>
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
