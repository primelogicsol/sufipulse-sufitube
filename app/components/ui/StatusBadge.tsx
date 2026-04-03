"use client";

type StatusVariant =
  | 'pending'
  | 'unread'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'read'
  | 'replied'
  | 'active'
  | 'draft'
  | 'published'
  | string;

const VARIANT_STYLES: Record<string, string> = {
  pending:      'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  unread:       'bg-amber-500/10 text-amber-400 border-amber-500/30',
  under_review: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  approved:     'bg-green-500/10 text-green-400 border-green-500/30',
  active:       'bg-green-500/10 text-green-400 border-green-500/30',
  published:    'bg-green-500/10 text-green-400 border-green-500/30',
  rejected:     'bg-red-500/10 text-red-400 border-red-500/30',
  archived:     'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
  read:         'bg-blue-500/10 text-blue-400 border-blue-500/30',
  replied:      'bg-green-500/10 text-green-400 border-green-500/30',
  draft:        'bg-neutral-500/10 text-neutral-400 border-neutral-500/30',
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const key = String(status || '').toLowerCase();
  const style = VARIANT_STYLES[key] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30';
  const displayLabel = label ?? key.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
