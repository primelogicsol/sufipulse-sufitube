interface DualNameHeroProps {
  publicName: string;
  mysticalName: string;
  description?: string;
  className?: string;
}

export function DualNameHero({ publicName, mysticalName, description, className = '' }: DualNameHeroProps) {
  return (
    <div className={`text-center ${className}`}>
      <h1
        className={`
          text-[var(--text-4xl)]
          lg:text-[var(--text-5xl)]
          font-[var(--font-headline)]
          font-bold
          text-[var(--color-text-primary)]
          mb-[var(--space-2)]
        `.trim()}
      >
        {publicName}
      </h1>
      <p
        className={`
          text-[var(--color-gold)]
          text-[var(--text-sm)]
          lg:text-[var(--text-base)]
          font-medium
          tracking-wide
          mb-[var(--space-4)]
        `.trim()}
      >
        {mysticalName}
      </p>
      {description && (
        <p
          className={`
            text-[var(--color-text-secondary)]
            text-[var(--text-base)]
            lg:text-[var(--text-lg)]
            max-w-2xl
            mx-auto
            leading-relaxed
          `.trim()}
        >
          {description}
        </p>
      )}
    </div>
  );
}
