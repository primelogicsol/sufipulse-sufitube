
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`
        bg-[var(--color-slate)]
        border-t
        border-[var(--color-border-strong)]
        mt-[var(--section-spacing)]
      `.trim()}
    >
      <div
        className={`
          max-w-[var(--max-width-container)]
          mx-auto
          px-[var(--padding-mobile)]
          lg:px-[var(--padding-desktop)]
          py-[var(--space-12)]
        `.trim()}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h4
              className={`
                text-[var(--text-base)]
                font-medium
                mb-[var(--space-4)]
                uppercase-spaced
                leading-tight
              `.trim()}
              style={{ color: '#F4D03F' }}
            >
              Creative<br/>Contributors
            </h4>
            <ul className="space-y-[var(--space-2)]">
              <FooterLink href="/writers">Writers (Ahl-e-Qalam)</FooterLink>
              <FooterLink href="/vocalists">Vocalists (Ahl-e-Sada)</FooterLink>
              <FooterLink href="/producers">Producers (Ahl-e-Naghma)</FooterLink>
              <FooterLink href="/literary-contributors">Literary Writers (Ahl-e-Taḥreer)</FooterLink>
            </ul>
          </div>

          <div>
            <h4
              className={`
                text-[var(--text-base)]
                font-medium
                mb-[var(--space-4)]
                uppercase-spaced
                leading-tight
              `.trim()}
              style={{ color: '#F4D03F' }}
            >
              Production<br/>Infrastructure
            </h4>
            <ul className="space-y-[var(--space-2)]">
              <FooterLink href="/studio">Studio (Karkhana-e-Sada)</FooterLink>
              <FooterLink href="/studio-engineers">Studio Engineers</FooterLink>
              <FooterLink href="/literary-journal">Literary Journal</FooterLink>
              <FooterLink href="/releases">Releases</FooterLink>
            </ul>
          </div>

          <div>
            <h4
              className={`
                text-[var(--text-base)]
                font-medium
                mb-[var(--space-4)]
                uppercase-spaced
                leading-tight
              `.trim()}
              style={{ color: '#F4D03F' }}
            >
              Institutional<br/>Identity
            </h4>
            <ul className="space-y-[var(--space-2)]">
              <FooterLink href="/about/what-is-sufipulse">What is SufiPulse</FooterLink>
              <FooterLink href="/about/founder">Founder</FooterLink>
              <FooterLink href="/about/our-network">Our Network</FooterLink>
              <FooterLink href="/about/institutional-partners">Institutional Partners</FooterLink>
            </ul>
          </div>

          <div>
            <h4
              className={`
                text-[var(--text-base)]
                font-medium
                mb-[var(--space-4)]
                uppercase-spaced
                leading-tight
              `.trim()}
              style={{ color: '#F4D03F' }}
            >
              Institutional<br/>Engagement
            </h4>
            <ul className="space-y-[var(--space-2)]">
              <FooterLink href="/official-channels">Official Channels</FooterLink>
              <FooterLink href="/collaboration">Institutional Collaboration</FooterLink>
              <FooterLink href="/product-infrastructure">Product Infrastructure</FooterLink>
              <FooterLink href="/governance">Governance</FooterLink>
            </ul>
          </div>
        </div>

        {/* YouTube Subscribe Banner */}
        <div className="mt-[var(--space-12)] pt-[var(--space-6)] border-t border-[var(--color-border)]">
          <a
            href="https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 rounded-lg bg-[rgba(212,175,55,0.06)] border border-[rgba(212,175,55,0.2)] hover:border-[rgba(212,175,55,0.45)] hover:bg-[rgba(212,175,55,0.10)] transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
                </svg>
              </div>
              <div>
                <p className="text-[var(--text-sm)] font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors">
                  Subscribe to SufiPulse on YouTube
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                  New kalam and sacred music releases — every week
                </p>
              </div>
            </div>
            <span className="flex-shrink-0 px-4 py-1.5 rounded-full border border-red-700/60 text-[var(--text-xs)] text-red-400 font-medium group-hover:bg-red-700 group-hover:text-white group-hover:border-red-700 transition-all duration-200">
              Subscribe
            </span>
          </a>
        </div>

        <div
          className={`
            mt-[var(--space-6)]
            pt-[var(--space-6)]
            border-t
            border-[var(--color-border)]
            flex
            flex-wrap
            justify-center
            items-center
            gap-x-6
            gap-y-3
            text-[var(--text-sm)]
            text-[var(--color-text-tertiary)]
          `.trim()}
        >
          <Link
            href="/privacy-policy"
            className={`
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
            `.trim()}
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className={`
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
            `.trim()}
          >
            Terms of Service
          </Link>
          <Link
            href="/cookie-policy"
            className={`
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
            `.trim()}
          >
            Cookie Policy
          </Link>
          <Link
            href="/legal/disclaimer"
            className={`
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
            `.trim()}
          >
            Disclaimer
          </Link>
          <Link
            href="/contributor-policy"
            className={`
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
            `.trim()}
          >
            Contributor Policy
          </Link>
          <Link
            href="/royalty-policy"
            className={`
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
            `.trim()}
          >
            Royalty Policy
          </Link>
          <Link
            href="/release-policy"
            className={`
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
            `.trim()}
          >
            Release Policy
          </Link>
        </div>

        <div
          className={`
            mt-[var(--space-6)]
            pt-[var(--space-6)]
            border-t
            border-[var(--color-border)]
          `.trim()}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6">
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src="/sufipulse-logo-v5.png"
                  alt="SufiPulse"
                  width={140}
                  height={44}
                  className="h-11 w-auto object-contain object-left"
                />
                <Image
                  src="/sufitube-logo-v5.png"
                  alt="SufiTube Studio"
                  width={140}
                  height={44}
                  className="h-11 w-auto object-contain object-left"
                />
              </div>
              <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)]">
                Institutional stewardship of sacred kalam through transparent governance and disciplined production.
              </p>
              <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                &copy; {currentYear} All rights reserved.
              </p>
            </div>

            <div>
              <h4
                className={`
                  text-[var(--text-base)]
                  font-medium
                  mb-[var(--space-4)]
                  uppercase-spaced
                `.trim()}
                style={{ color: '#F4D03F' }}
              >
                Institutional Extensions
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <a
                  href="https://sufisciencecenter.info/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <p className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium leading-tight group-hover:text-[var(--color-gold)] transition-colors duration-[var(--transition-base)]">
                    Sufi Science Center USA
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight mt-1">
                    Sacred research and contemplative inquiry
                  </p>
                </a>
                <a
                  href="https://dkf.sufisciencecenter.info/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <p className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium leading-tight group-hover:text-[var(--color-gold)] transition-colors duration-[var(--transition-base)]">
                    Dr. Kumar Foundation USA
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight mt-1">
                    Spiritual stewardship and cultural awakening
                  </p>
                </a>
                <a
                  href="https://psc.dekoshurcrafts.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <p className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium leading-tight group-hover:text-[var(--color-gold)] transition-colors duration-[var(--transition-base)]">
                    Purple Soul Collective USA
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight mt-1">
                    Ethical commerce and creative expression
                  </p>
                </a>
                <a
                  href="https://primelogicsol.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <p className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium leading-tight group-hover:text-[var(--color-gold)] transition-colors duration-[var(--transition-base)]">
                    Prime Logic Solutions USA
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)] leading-tight mt-1">
                    Secure infrastructure and digital systems
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

function FooterLink({ href, children }: FooterLinkProps) {
  return (
    <li>
      <Link
        href={href}
        className={`
          text-[var(--text-xs)]
          text-[var(--color-text-secondary)]
          hover:text-[var(--color-gold)]
          transition-colors
          duration-[var(--transition-base)]
        `.trim()}
      >
        {children}
      </Link>
    </li>
  );
}
