import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';

export interface HeroActionProps {
  label: string;
  href: string;
  icon?: ReactNode;
}

export function HeroCatalogCTA({ asPrimary = false }: { asPrimary?: boolean }) {
  return (
    <Link
      href="/releases"
      className="group flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-[var(--color-slate)]/80 hover:bg-[var(--color-slate)] border border-[var(--color-gold)]/30 hover:border-[var(--color-gold)]/60 transition-all duration-300 shadow-xl backdrop-blur-md hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
      aria-label="Explore SufiTube Catalog"
    >
      <Image
        src="/sufitube-logo-v5.png"
        alt="Sufitube Logo"
        width={160}
        height={40}
        className="h-8 md:h-10 w-auto object-contain"
      />
      <span className="text-xs font-bold text-[var(--color-gold)] group-hover:text-[var(--color-gold-hover)] uppercase tracking-wider pl-2 border-l border-white/10">
        Explore Catalog &rarr;
      </span>
    </Link>
  );
}

export function HeroPrimaryCTA({ label, href, icon }: HeroActionProps) {
  const isHash = href.startsWith('#');
  const Component = isHash ? 'a' : Link;
  return (
    <Component
      href={href}
      className="group flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-transparent border border-white/20 text-white hover:bg-white/10 transition-all duration-300 shadow-xl backdrop-blur-md hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
    >
      {icon}
      <span className="text-[13px] md:text-sm font-bold uppercase tracking-widest">
        {label}
      </span>
    </Component>
  );
}

export function HeroSecondaryCTA({ label, href, icon }: HeroActionProps) {
  const isHash = href.startsWith('#');
  const Component = isHash ? 'a' : Link;
  return (
    <Component
      href={href}
      className="group flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-transparent border border-white/10 text-white/80 hover:bg-white/5 hover:text-white transition-all duration-300 shadow-xl backdrop-blur-md hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)]"
    >
      {icon}
      <span className="text-[13px] md:text-sm font-bold uppercase tracking-widest">
        {label}
      </span>
    </Component>
  );
}

export interface HeroCTAGroupProps {
  primary?: HeroActionProps;
  secondary?: HeroActionProps;
}

export function HeroCTAGroup({ primary, secondary }: HeroCTAGroupProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 w-full flex-wrap">
      {primary && <HeroPrimaryCTA {...primary} />}
      {secondary && <HeroSecondaryCTA {...secondary} />}
      <HeroCatalogCTA />
    </div>
  );
}
