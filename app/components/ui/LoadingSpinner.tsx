"use client";

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  /** Displayed below the spinner. Defaults to "Loading…" */
  message?: string;
  /** "inline" renders a single-line spinner+text; "page" renders a full-height centred block */
  variant?: 'inline' | 'page';
  className?: string;
}

/**
 * Shared loading indicator used across admin pages and detail views.
 *
 * @example
 * if (loading) return <LoadingSpinner />;
 * if (loading) return <LoadingSpinner variant="page" message="Loading releases…" />;
 */
export function LoadingSpinner({ message = 'Loading…', variant = 'inline', className = '' }: LoadingSpinnerProps) {
  if (variant === 'page') {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center gap-4 ${className}`}
        style={{ backgroundColor: 'var(--dash-bg-secondary)' }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-[var(--dash-text-muted)]" />
        <p className="text-sm text-[var(--dash-text-muted)]">{message}</p>
      </div>
    );
  }

  return (
    <div className={`p-8 text-center text-[var(--dash-text-muted)] flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}
