import { ReactNode } from 'react';

interface HeroProps {
  headline: string;
  subtext?: string;
  children?: ReactNode;
  className?: string;
}

export function Hero({ headline, subtext, children, className = '' }: HeroProps) {
  return (
    <div
      className={`
        text-center
        py-16
        md:py-24
        ${className}
      `.trim()}
    >
      <h1
        className={`
          font-[var(--font-headline)]
          text-[var(--text-hero)]
          font-semibold
          leading-[var(--leading-tight)]
          tracking-[var(--tracking-tight)]
          mb-6
          text-[var(--color-text-primary)]
        `.trim()}
      >
        {headline}
      </h1>

      {headline.includes('.') && (
        <div
          className={`
            w-24
            h-1
            bg-[var(--color-gold)]
            mx-auto
            mb-6
          `.trim()}
        />
      )}

      {subtext && (
        <p
          className={`
            text-[var(--text-lg)]
            md:text-[var(--text-xl)]
            text-[var(--color-text-secondary)]
            max-w-[var(--max-width-reading)]
            mx-auto
            leading-[var(--leading-relaxed)]
            mb-8
          `.trim()}
        >
          {subtext}
        </p>
      )}

      {children && (
        <div
          className={`
            flex
            flex-col
            sm:flex-row
            gap-4
            justify-center
            items-center
            mt-8
          `.trim()}
        >
          {children}
        </div>
      )}
    </div>
  );
}
