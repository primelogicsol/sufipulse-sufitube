"use client";
import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UpgradeModal } from '@/app/components/ui/UpgradeModal';

// Verified social channels — source: canonical Official Channels registry.
// Only verified=true AND non-null url entries are rendered.
const VERIFIED_SOCIAL = [
  {
    platform: 'YouTube',
    url: 'https://www.youtube.com/@SufiPulse-USA',
    label: 'SufiPulse on YouTube',
    tooltip: 'YouTube',
    hoverClass: 'hover:border-red-600/60 hover:text-red-400',
  },
  {
    platform: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61591758150138',
    label: 'Official — SufiPulse USA',
    tooltip: 'Official',
    hoverClass: 'hover:border-[#1877F2]/60 hover:text-[#1877F2]',
  },
  {
    platform: 'Instagram',
    url: 'https://www.instagram.com/sufipulseusa/',
    label: 'SufiPulse on Instagram',
    tooltip: 'Instagram',
    hoverClass: 'hover:border-[#E1306C]/60 hover:text-[#E1306C]',
  },
  {
    platform: 'Facebook',
    url: 'https://www.facebook.com/groups/1100263345262190',
    label: 'Group — SufiPulse USA Video Archive',
    tooltip: 'Group',
    hoverClass: 'hover:border-[#1877F2]/60 hover:text-[#1877F2]',
  },
  {
    platform: 'Facebook',
    url: 'https://www.facebook.com/profile.php?id=61585776993670',
    label: 'Co founders — Dr. Zarf-e-Noori',
    tooltip: 'Co founders',
    hoverClass: 'hover:border-[#1877F2]/60 hover:text-[#1877F2]',
  },
];

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.704 0-1.024.054-1.342.178a2.14 2.14 0 0 0-.912.685c-.247.33-.37.77-.37 1.332v1.785h4.102l-.546 3.667h-3.556v7.98H9.101Z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function FacebookGroupIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.62c0-1.17.68-2.25 1.76-2.73 1.17-.51 2.61-.9 4.24-.9zM4 13.5c.98 0 1.9.2 2.73.53-.4.67-.63 1.44-.68 2.27L6 16.5v1.5H2v-1.62c0-1.17.68-2.25 1.76-2.73.08-.03.16-.06.24-.09v-.06zm16 0c.08.03.16.06.24.09 1.08.48 1.76 1.56 1.76 2.73V18h-4v-1.5l-.05-.2c-.05-.83-.28-1.6-.68-2.27.83-.33 1.75-.53 2.73-.53zM12 4.5a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 0 1 0-7.5zm-6.5 2a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5zm13 0a2.75 2.75 0 1 1 0 5.5 2.75 2.75 0 0 1 0-5.5z"/>
    </svg>
  );
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  YouTube: <YouTubeIcon className="w-4 h-4" />,
  Facebook: <FacebookIcon className="w-4 h-4" />,
  Instagram: <InstagramIcon className="w-4 h-4" />,
  FacebookGroup: <FacebookGroupIcon className="w-4 h-4" />,
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
                    <div key={ch.url} className="relative group/social flex items-center justify-center">
                      <a
                        href={ch.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={ch.label}
                        title={ch.label}
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

                      {/* Instant hover tooltip */}
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/social:opacity-100 group-focus-within/social:opacity-100 transition-all duration-150 transform translate-y-1 group-hover/social:translate-y-0 z-30 flex flex-col items-center"
                      >
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide whitespace-nowrap bg-neutral-900/95 text-[var(--color-gold)] border border-[var(--color-gold)]/30 shadow-lg">
                          {ch.tooltip}
                        </span>
                        <span className="w-1.5 h-1.5 bg-neutral-900/95 border-r border-b border-[var(--color-gold)]/30 rotate-45 -mt-1" />
                      </div>
                    </div>
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
                    Rendered as <a href="#" onClick> when upgrading — identical element type
                    to ExtensionLink so there are zero UA padding or focus-ring differences. */}
                {PURPLE_SOUL.status === 'upgrading' ? (
                  <a
                    ref={purpleSoulTriggerRef as React.RefObject<HTMLAnchorElement>}
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPurpleSoulModalOpen(true); }}
                    className="group flex flex-col gap-0.5 py-2 border-b border-[var(--color-border)] hover:border-[var(--color-gold)]/20 transition-colors focus:outline-none focus-visible:outline-1 focus-visible:outline-white/40 focus-visible:outline-offset-2"
                  >
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors leading-tight">
                      {PURPLE_SOUL.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight">
                      {PURPLE_SOUL.desc}
                    </p>
                  </a>
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
      className="group flex flex-col gap-0.5 py-2 border-b border-[var(--color-border)] hover:border-[var(--color-gold)]/20 transition-colors focus:outline-none focus-visible:outline-1 focus-visible:outline-white/40 focus-visible:outline-offset-2"
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

