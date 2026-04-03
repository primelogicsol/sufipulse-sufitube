"use client";

interface EmptyStateProps {
  message: string;
  className?: string;
}

/**
 * Shared empty-results row used in admin data tables and lists.
 * Renders: centred, muted text with vertical padding.
 */
export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 text-[var(--dash-text-muted)] ${className}`}>
      {message}
    </div>
  );
}
