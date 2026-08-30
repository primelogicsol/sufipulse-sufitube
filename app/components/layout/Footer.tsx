"use client";
import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UpgradeModal } from '@/app/components/ui/UpgradeModal';

// Verified social channels — source: canonical Official Channels registry.
// Only verified=true AND non-null url entries are rendered.
// DO NOT add URLs not confirmed in official-channels/page.tsx.
const VERIFIED_SOCIAL = [
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@SufiPulse-USA',
    label: 'SufiPulse on YouTube',
    hoverClass: 'hover:border-red-600/60 hover:text-red-400',
  },
  // Spotify, Apple Music, Instagram, X, Facebook -> verified=false -> not rendered
];

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  YouTube: <YouTubeIcon className="w-4 h-4" />,
};

// ─── Institutional partner status config ─────────────────────────────────────
// To restore normal navigation when Purple Soul is ready:
//   change status from 'upgrading' to 'live'
// No JSX changes needed.
const PURPLE_SOUL = {
  url: 'https://purplesoul.shop',
  status: 'upgrading' as 'upgrading' | 'live',
  // FROZEN CANONICAL BRAND NAME — do not abbreviate
  title: 'Purple Soul Collectives USA',
  initiative: 'A De Koshur Crafts USA Initiative',
  desc: 'Ethical commerce and creative expression',
} as const;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [purpleSoulModalOpen, setPurpleSoulModalOpen] = useState(false);
  const purpleSoulTriggerRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);

  return (
    <footer className="relative bg-[var(--color-midnight)] border-t border-[var(--color-border-strong)] mt-[var(--section-spacing)] overflow-hidden">
      {/* Subtle procedural dot texture at 3% opacity — no external asset */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(200,167,94,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Soft gold glow on top edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-gold)]/30 to-transparent"
      />

      <div className="relative z-10 max-w-[var(--max-width-container)] mx-auto px-[var(--padding-mobile)] lg:px-[var(--padding-desktop)] pt-16 md:pt-20 pb-10">

        {/* 1. NAVIGATION GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-x-8 gap-y-12 lg:divide-x lg:divide-[var(--color-gold)]/8">
          <FooterSection title="Creative Contributors">
            <FooterLink href="/writers">Writers (Ahl-e-Qalam)</FooterLink>
            <FooterLink href="/vocalists">Vocalists (Ahl-e-Sada)</FooterLink>
            <FooterLink href="/producers">Producers (Ahl-e-Naghma)</FooterLink>
            <FooterLink href="/literary-contributors">Literary Contributors (Ahl-e-Tahreer)</FooterLink>
            <FooterLink href="/literary-journal">Literary Journal (Ahl-e-Tahreer Publications)</FooterLink>
          </FooterSection>

          <FooterSection title="Production Infrastructure" padLeft>
            <FooterLink href="/studio">Studio (Karkhana-e-Sada)</FooterLink>
            <FooterLink href="/studio-engineers">Studio Engineers</FooterLink>
            {/* SufiTube -> dedicated brand identity page */}
            <FooterLink href="/sufitube">SufiTube</FooterLink>
            <FooterLink href="/releases">Releases</FooterLink>
            <FooterLink href="/release-premieres">Premiere Room</FooterLink>
          </FooterSection>

          <FooterSection title="Institutional Identity" padLeft>
            <FooterLink href="/official-identity">Official Identity</FooterLink>
            <FooterLink href="/about/what-is-sufipulse">What is SufiPulse</FooterLink>
            <FooterLink href="/about/founder">Founder</FooterLink>
            <FooterLink href="/about/our-network">Our Network</FooterLink>
            <FooterLink href="/about/institutional-partners">Institutional Partners</FooterLink>
          </FooterSection>

          <FooterSection title="Institutional Engagement" padLeft>
            <FooterLink href="/official-channels">Official Channels</FooterLink>
            <FooterLink href="/collaboration">Institutional Collaboration</FooterLink>
            <FooterLink href="/product-infrastructure">Product Infrastructure</FooterLink>
            <FooterLink href="/governance">Governance</FooterLink>
            <FooterLink href="/contact">Contact SufiPulse</FooterLink>
          </FooterSection>
        </div>

        {/* 2. YOUTUBE SUBSCRIBE PANEL */}
        <div className="mt-14 pt-8 border-t border-[var(--color-gold)]/10">
          <a
            href="https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 px-7 py-5 rounded-xl bg-[rgba(200,167,94,0.04)] border border-[rgba(200,167,94,0.15)] hover:border-[rgba(200,167,94,0.35)] hover:bg-[rgba(200,167,94,0.08)] transition-all duration-300 group"
          >
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-700 flex items-center justify-center shadow-[0_0_14px_rgba(185,28,28,0.35)]">
                <YouTubeIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors leading-tight">
                  Subscribe to SufiPulse on YouTube
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  New kalam and sacred music releases — every week
                </p>
              </div>
            </div>
            <span className="flex-shrink-0 px-5 py-2 rounded-full border border-red-700/50 text-xs text-red-400 font-semibold tracking-wide group-hover:bg-red-700 group-hover:text-white group-hover:border-red-700 transition-all duration-200">
              Subscribe
            </span>
          </a>
        </div>

        {/* 3. LEGAL POLICY ROW */}
        <div className="mt-8 pt-6 border-t border-[var(--color-gold)]/10">
          <nav
            aria-label="Legal policies"
            className="flex flex-wrap justify-center items-center gap-y-2 text-xs text-[var(--color-text-tertiary)]"
          >
            {([
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms of Service', href: '/terms-of-service' },
              { label: 'Cookie Policy', href: '/cookie-policy' },
              { label: 'Disclaimer', href: '/legal/disclaimer' },
              { label: 'Contributor Policy', href: '/contributor-policy' },
              { label: 'Royalty Policy', href: '/royalty-policy' },
              { label: 'Release Policy', href: '/release-policy' },
              { label: 'Knowledge Base', href: '/knowledge' },
            ] as const).map((item, i, arr) => (
              <span key={item.href} className="flex items-center gap-2">
                <Link href={item.href} scroll={true} className="hover:text-[var(--color-gold)] transition-colors py-1 px-0.5">
                  {item.label}
                </Link>
                {i < arr.length - 1 && (
                  <span aria-hidden="true" className="inline-block w-[3px] h-[3px] rounded-full bg-[var(--color-gold)]/25 flex-shrink-0" />
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* 4. LOWER INSTITUTIONAL BLOCK */}
        <div className="mt-8 pt-8 border-t border-[var(--color-gold)]/10">
          <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-10">

            {/* LEFT — logos, statement, social */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Image src="/sufipulse-logo-v5.png" alt="SufiPulse" width={140} height={44} className="h-11 w-auto object-contain object-left" />
                <Image src="/sufitube-logo-v5.png" alt="SufiTube Studio" width={140} height={44} className="h-11 w-auto object-contain object-left" />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-xs">
                Institutional stewardship of sacred kalam through transparent governance and disciplined production.
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Sponsored by{' '}
                <a href="https://primelogicsol.com/" target="_blank" rel="noopener noreferrer" className="!text-[var(--color-gold)] hover:underline">
                  Prime Logic Solutions USA
                </a>
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                &copy; {currentYear} All rights reserved.
              </p>
              {/* Social icons — only verified channels */}
              {VERIFIED_SOCIAL.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  {VERIFIED_SOCIAL.map((ch) => (
                    <a
                      key={ch.platform}
                      href={ch.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={ch.label}
                      className={[
                        'w-9 h-9 rounded-full flex items-center justify-center',
                        'border border-white/10 bg-white/[0.03]',
                        'text-[var(--color-text-tertiary)]',
                        'transition-all duration-200 hover:scale-105 hover:bg-white/[0.07]',
                        ch.hoverClass,
                      ].join(' ')}
                    >
                      {SOCIAL_ICONS[ch.platform]}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — Institutional Extensions */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px flex-1 bg-[var(--color-gold)]/15" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-gold)]/70">
                  Institutional Extensions
                </h4>
                <div className="h-px flex-1 bg-[var(--color-gold)]/15" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                <ExtensionLink href="https://sufisciencecenter.info/" title="Sufi Science Center USA" desc="Sacred research and contemplative inquiry" />
                <ExtensionLink href="https://dkf.sufisciencecenter.info/" title="Dr. Kumar Foundation USA" desc="Spiritual stewardship and cultural awakening" />

                {/* Purple Soul Collectives USA — status-controlled.
                    Change PURPLE_SOUL.status to 'live' to restore normal navigation.
                    Button styled to be pixel-identical to ExtensionLink's <a> tag. */}
                {PURPLE_SOUL.status === 'upgrading' ? (
                  <button
                    ref={purpleSoulTriggerRef as React.RefObject<HTMLButtonElement>}
                    type="button"
                    onClick={() => setPurpleSoulModalOpen(true)}
                    className="group flex flex-col items-start gap-0.5 py-2 border-b border-[var(--color-border)] hover:border-[var(--color-gold)]/20 transition-colors text-left w-full bg-transparent p-0 cursor-pointer"
                    style={{ font: 'inherit' }}
                  >
                    <span className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors leading-tight block w-full text-left">
                      {PURPLE_SOUL.title}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)] leading-tight block w-full text-left">
                      {PURPLE_SOUL.desc}
                    </span>
                  </button>
                ) : (
                  <ExtensionLink href={PURPLE_SOUL.url} title={PURPLE_SOUL.title} desc={PURPLE_SOUL.desc} />
                )}

                <ExtensionLink href="https://ifpb.sufisciencecenter.info/" title="Interfaith Peace Bridge USA" desc="Peace and dialogue platform." />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Purple Soul Collectives USA — Upgrade in Progress modal */}
      <UpgradeModal
        open={purpleSoulModalOpen}
        onClose={() => setPurpleSoulModalOpen(false)}
        title="Purple Soul Collectives USA Upgrade in Progress"
        initiative={PURPLE_SOUL.initiative}
        body="Purple Soul Collectives USA is being upgraded as a dedicated platform for craftsmen, artisans and creative communities whose work engages Abrahamic spiritual heritage, Sufi-influenced craft traditions, sacred symbolism and cultural expression. The renewed platform will support artisan discovery, provenance-rich cultural storytelling, creative collaboration and responsible access to handmade works shaped by living craft traditions and spiritual heritage."
        successMessage="We'll notify you when the upgraded Purple Soul Collectives USA platform becomes available."
        source="purple-soul-upgrade"
        triggerRef={purpleSoulTriggerRef as React.RefObject<HTMLElement>}
      />
    </footer>
  );
}

// Sub-components

function FooterSection({
  title, children, padLeft = false,
}: {
  title: string; children: React.ReactNode; padLeft?: boolean;
}) {
  return (
    <div className={['footer-group text-left', padLeft ? 'lg:pl-8' : ''].join(' ')}>
      <div className="w-5 h-px bg-[var(--color-gold)]/40 mb-3" aria-hidden="true" />
      <h3 className="font-serif text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-gold)] leading-tight mb-5">
        {title}
      </h3>
      <nav aria-label={title}>
        <ul className="space-y-3">
          {children}
        </ul>
      </nav>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        scroll={true}
        className="group inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] transition-colors duration-200"
      >
        <span className="w-0 group-hover:w-1.5 h-px bg-[var(--color-gold)] transition-all duration-200 flex-shrink-0 overflow-hidden" aria-hidden="true" />
        {children}
      </Link>
    </li>
  );
}

function ExtensionLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-0.5 py-2 border-b border-[var(--color-border)] hover:border-[var(--color-gold)]/20 transition-colors"
    >
      <p className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors leading-tight">
        {title}
      </p>
      <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight">
        {desc}
      </p>
    </a>
  );
}
