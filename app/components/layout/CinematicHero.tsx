'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PrimaryButton } from '../primitives/PrimaryButton';

interface CinematicHeroProps {
 eyebrow?: string;
 title: string;
 titleHighlight?: string;
 titleHighlightAfter?: string;
 subtitle: string;
 backgroundImage: string;
 backgroundAlt?: string;
 backgroundPosition?: string;
 overlayStrength?: 'light' | 'medium' | 'heavy';
 primaryCTA?: { label: string; href: string };
 secondaryCTA?: { label: string; href: string };
 children?: React.ReactNode; 
 minHeight?: string;
 alignment?: 'center' | 'left';
 priority?: boolean;
}

export function CinematicHero({
 eyebrow,
 title,
 titleHighlight,
 titleHighlightAfter,
 subtitle,
 backgroundImage,
 backgroundAlt = '',
 backgroundPosition = 'object-center',
 overlayStrength = 'medium',
 primaryCTA,
 secondaryCTA,
 children,
 minHeight = 'min-h-[85vh] md:min-h-[90vh]',
 alignment = 'center',
 priority = true,
}: CinematicHeroProps) {
 const overlayClass = {
 light: 'from-[var(--color-midnight)]/70 via-[var(--color-midnight)]/50 to-[var(--color-midnight)]/80',
 medium: 'from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]',
 heavy: 'from-[var(--color-midnight)]/95 via-[var(--color-midnight)]/85 to-[var(--color-midnight)]',
 }[overlayStrength];

 const alignClass = alignment === 'center' ? 'text-center mx-auto' : 'text-left';

 return (
 <section
 className="relative w-full overflow-hidden bg-[var(--color-midnight)] border-b border-[var(--color-border)] hero-bleed"
 style={{ paddingTop: 0 }}
 >
 {/* Full-bleed background — starts at viewport top, behind fixed header */}
 <div className="absolute inset-0 z-0 pointer-events-none">
 <Image
 src={backgroundImage}
 alt={backgroundAlt}
 fill
 priority={priority}
 quality={90}
 className={`object-cover ${backgroundPosition} scale-105 transform`}
 />
 <div className={`absolute inset-0 bg-gradient-to-b ${overlayClass}`} />
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
 </div>

 {/* Content — padded to clear fixed header */}
 <div className={`relative z-10 w-full ${minHeight} flex flex-col justify-center`}>
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
 <div className={`max-w-5xl ${alignClass}`} style={{ paddingTop: 'var(--hero-content-top)' }}>

 {eyebrow && (
 <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
 <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
 <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
 {eyebrow}
 </span>
 </div>
 )}

 <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
 {title}
 {titleHighlight && (
 <>
 <br className="hidden md:block" />
 <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
 {titleHighlight}
 </span>
 </>
 )}
 {titleHighlightAfter && <> {titleHighlightAfter}</>}
 </h1>

 <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed font-light max-w-3xl mx-auto mb-10 drop-shadow">
 {subtitle}
 </p>

 {(primaryCTA || secondaryCTA) && (
 <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14">
 {primaryCTA && (
 <Link href={primaryCTA.href}>
 <PrimaryButton size="medium" className="px-8 py-3.5 shadow-xl">
 {primaryCTA.label}
 </PrimaryButton>
 </Link>
 )}
 {secondaryCTA && (
 <Link href={secondaryCTA.href}>
 <PrimaryButton variant="outline" size="medium" className="px-8 py-3.5 backdrop-blur-md">
 {secondaryCTA.label}
 </PrimaryButton>
 </Link>
 )}
 </div>
 )}

 {children}
 </div>
 </div>
 </div>
 </section>
 );
}
