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
}

const AVAILABLE_LANGS = [
  { id: "ur", label: "Urdu (Roman / Native)" },
  { id: "pa", label: "Punjabi" },
  { id: "ks", label: "Kashmiri" },
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
];

export function CanonicalLyricsSection({
  initialLyrics,
  onUpdate,
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

  // If editor modifies text or language, demote to DRAFT immediately in UI.
  useEffect(() => {
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
  }, [text, primaryLanguage, languages, status]);

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
    <div className="bg-white border rounded-lg shadow-sm mt-8">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Canonical Original Lyrics (Part I)
        </h2>
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${status === "APPROVED" ? "bg-green-100 text-green-800" : status === "REVIEWED" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}
        >
          {status}
        </span>
      </div>
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Language
            </label>
            <select
              value={primaryLanguage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPrimaryLanguage(e.target.value)
              }
              className="w-full px-3 py-2 border rounded-md bg-white"
            >
              {AVAILABLE_LANGS.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              All Sung Languages
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_LANGS.map((lang) => (
                <label
                  key={lang.id}
                  className="inline-flex items-center space-x-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={languages.includes(lang.id)}
                    onChange={() => toggleLanguage(lang.id)}
                    className="rounded border-gray-300"
                  />
                  <span>{lang.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lyrics Text (Part I Only)
          </label>
          <textarea
            rows={12}
            placeholder="Paste canonical original lyrics here..."
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setText(e.target.value)
            }
            className="w-full px-3 py-2 border rounded-md font-mono text-sm"
          />
        </div>

        <div className="flex justify-end space-x-2">
          {status === "DRAFT" && text.trim().length > 0 && (
            <button
              type="button"
              onClick={handleReview}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Mark as Reviewed
            </button>
          )}
          {status === "REVIEWED" && initialLyrics?.status === "REVIEWED" && (
            <button
              type="button"
              onClick={handleApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
            >
              Approve Canonical Lyrics
            </button>
          )}
          {status === "REVIEWED" && initialLyrics?.status !== "REVIEWED" && (
            <span className="text-sm text-gray-500 py-2 self-center">
              Save changes to enable approval.
            </span>
          )}
        </div>

        {status === "APPROVED" && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
            ✓ Lyrics have been editorially verified and approved. Modifying the
            text or language will revoke approval.
          </div>
        )}
      </div>
    </div>
  );
}
