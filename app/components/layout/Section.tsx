import { ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: 'midnight' | 'slate';
  spacing?: 'normal' | 'compact' | 'spacious';
}

export function Section({
  children,
  className = '',
  background = 'midnight',
  spacing = 'normal'
}: SectionProps) {
  const bgStyles = {
    midnight: 'bg-[var(--color-midnight)]',
    slate: 'bg-[var(--color-slate)]'
  };

  const spacingStyles = {
    compact: 'py-8 md:py-12',
    normal: 'py-12 md:py-16',
    spacious: 'py-16 md:py-[var(--section-spacing)]'
  };

  return (
    <section
      className={`
        ${bgStyles[background]}
        ${spacingStyles[spacing]}
        ${className}
      `.trim()}
    >
      {children}
    </section>
  );
}
