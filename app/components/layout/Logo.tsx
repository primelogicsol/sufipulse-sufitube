import Link from "next/link";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <Link
      href="/"
      className={`
        flex
        items-center
        gap-3
        group
        ${className}
      `.trim()}
    >
      <div
        className={`
          w-10
          h-10
          rounded-full
          bg-linear-to-br
          from-[var(--color-gold)]
          to-amber-600
          flex
          items-center
          justify-center
          transition-transform
          duration-[var(--transition-base)]
          group-hover:scale-110
        `.trim()}
      >
        <span
          className={`
            text-[var(--color-midnight)]
            text-lg
            font-bold
            font-[var(--font-headline)]
          `.trim()}
        >
          SP
        </span>
      </div>

      {showText && (
        <span
          className={`
            text-[var(--text-xl)]
            font-[var(--font-headline)]
            font-semibold
            tracking-[var(--tracking-tight)]
            text-[var(--color-text-primary)]
            group-hover:text-[var(--color-gold)]
            transition-colors
            duration-[var(--transition-base)]
          `.trim()}
        >
          SufiPulse
        </span>
      )}
    </Link>
  );
}
