"use client";
/**
 * UpgradeModal — reusable "Platform Upgrade in Progress" modal.
 *
 * Used for institutional partners that are currently being upgraded.
 * Wires directly into the existing /api/subscribe backend.
 *
 * Props
 * -----
 * open          – controlled open state
 * onClose       – called when the modal should close
 * title         – modal heading (e.g. "Purple Soul Collective USA Upgrade in Progress")
 * body          – descriptive paragraph
 * source        – subscriber source tag sent to /api/subscribe (e.g. "purple-soul-upgrade")
 * triggerRef    – ref of the element that opened the modal; focus returns here on close
 */
import { useEffect, useRef, useState, useCallback } from "react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional gold subtitle rendered under the title — e.g. "A De Koshur Crafts USA Initiative" */
  initiative?: string;
  body: string;
  /** Custom success message line 2 — defaults to generic copy */
  successMessage?: string;
  source: string;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

type Phase = "form" | "submitting" | "success" | "error";

export function UpgradeModal({
  open,
  onClose,
  title,
  initiative,
  body,
  successMessage = "We'll notify you when the platform becomes available.",
  source,
  triggerRef,
}: UpgradeModalProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ── Focus management ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      // Reset state on open
      setEmail("");
      setEmailError("");
      setPhase("form");
      setSubmitting(false);
      // Defer focus until animation frame
      requestAnimationFrame(() => {
        if (phase === "success") {
          closeBtnRef.current?.focus();
        } else {
          firstFocusRef.current?.focus();
        }
      });
    } else {
      // Return focus to trigger element
      triggerRef?.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Keyboard trap ─────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose]
  );

  // ── Validation ────────────────────────────────────────────────────────────
  function validateEmail(val: string): string {
    const trimmed = val.trim();
    if (!trimmed) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return "Please enter a valid email address.";
    return "";
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      firstFocusRef.current?.focus();
      return;
    }
    setEmailError("");
    setSubmitting(true);
    setPhase("submitting");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), source }),
      });

      if (res.ok) {
        setPhase("success");
        requestAnimationFrame(() => closeBtnRef.current?.focus());
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        onKeyDown={handleKeyDown}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-[520px] bg-[var(--color-midnight)] border border-[var(--color-gold)]/20 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Header */}
          <div className="relative px-7 pt-7 pb-5 border-b border-[var(--color-gold)]/10">
            <div className="w-5 h-px bg-[var(--color-gold)]/40 mb-3" aria-hidden="true" />
            <h2
              id="upgrade-modal-title"
              className="font-serif text-lg font-bold text-[var(--color-text-primary)] leading-snug max-w-[85%]"
            >
              {title}
            </h2>
            {initiative && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-gold)]/75 mt-1.5">
                {initiative}
              </p>
            )}
            {/* Close X — absolutely positioned so it never overlaps title */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-[var(--color-text-tertiary)] hover:border-[var(--color-gold)]/30 hover:text-[var(--color-gold)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/50"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5" aria-hidden="true">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-7 py-6">
            {phase === "success" ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-[var(--color-gold)]" aria-hidden="true">
                    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-[var(--color-text-primary)] font-semibold mb-1">
                  You&apos;re on the list.
                </p>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {successMessage}
                </p>
              </div>
            ) : (
              <>
                {/* Body — split into paragraphs on '. ' boundary if present */}
                {(() => {
                  const splitIdx = body.indexOf('. ');
                  if (splitIdx === -1) {
                    return <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">{body}</p>;
                  }
                  const para1 = body.slice(0, splitIdx + 1);
                  const para2 = body.slice(splitIdx + 2);
                  return (
                    <div className="mb-6 space-y-3">
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{para1}</p>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{para2}</p>
                    </div>
                  );
                })()}

                {phase === "error" && (
                  <p role="alert" className="text-xs text-red-400 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    Something went wrong. Please try again in a moment.
                  </p>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <label htmlFor="upgrade-email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-gold)]/70 mb-2">
                    Email Address
                  </label>
                  <input
                    ref={firstFocusRef}
                    id="upgrade-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(validateEmail(e.target.value));
                    }}
                    placeholder="Enter your email address"
                    aria-describedby={emailError ? "upgrade-email-error" : undefined}
                    aria-invalid={!!emailError}
                    disabled={submitting}
                    className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.04] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus-visible:border-[var(--color-gold)]/40 focus-visible:ring-1 focus-visible:ring-[var(--color-gold)]/20 disabled:opacity-50 transition-colors"
                  />
                  {emailError && (
                    <p id="upgrade-email-error" role="alert" className="text-xs text-red-400 mt-1.5">
                      {emailError}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 px-5 bg-[var(--color-gold)] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FDE68A] disabled:opacity-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/50"
                    >
                      {submitting ? "Submitting…" : "Notify Me"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="px-5 py-3 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] hover:border-white/20 hover:text-[var(--color-text-secondary)] disabled:opacity-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    >
                      Close
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Success close button */}
            {phase === "success" && (
              <div className="mt-5 flex justify-center">
                <button
                  ref={closeBtnRef}
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] hover:border-[var(--color-gold)]/30 hover:text-[var(--color-gold)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]/40"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
