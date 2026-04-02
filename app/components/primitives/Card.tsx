import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  hoverable = false,
  onClick
}: CardProps) {
  const hoverStyles = hoverable
    ? 'hover:shadow-[var(--shadow-gold-glow)] hover:border-[var(--color-gold)] hover:scale-[1.02] cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        bg-[var(--color-slate)]
        border
        border-[var(--color-border)]
        rounded-[var(--radius-base)]
        p-[var(--card-padding)]
        shadow-[var(--shadow-soft)]
        transition-all
        duration-[var(--transition-base)]
        ${hoverStyles}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}
