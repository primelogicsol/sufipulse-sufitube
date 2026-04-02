import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'gold' | 'neutral' | 'success' | 'error';
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  className = ''
}: BadgeProps) {
  const variantStyles = {
    gold: `
      bg-[var(--color-gold-muted)]
      text-[var(--color-gold)]
      border-[var(--color-gold)]
    `,
    neutral: `
      bg-[var(--color-slate)]
      text-[var(--color-text-secondary)]
      border-[var(--color-border-strong)]
    `,
    success: `
      bg-[rgba(45,106,79,0.1)]
      text-[var(--color-success)]
      border-[var(--color-success)]
    `,
    error: `
      bg-[rgba(159,43,43,0.1)]
      text-[var(--color-error)]
      border-[var(--color-error)]
    `
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        px-3
        py-1
        text-[var(--text-xs)]
        uppercase
        tracking-[var(--tracking-wider)]
        font-medium
        border
        rounded-[var(--radius-full)]
        ${variantStyles[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
