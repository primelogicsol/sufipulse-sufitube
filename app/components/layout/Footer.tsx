
import Link from 'next/link';
import { Logo } from './Logo';

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
              <FooterLink href="/production/music-style-selection">Music Style Selection</FooterLink>
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
              <FooterLink href="/governance">Governance</FooterLink>
              <FooterLink href="/literary-journal">Literary Journal</FooterLink>
            </ul>
          </div>
        </div>

        <div
          className={`
            mt-[var(--space-12)]
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
            <div className="flex items-start gap-3">
              <Logo showText={false} />
              <div>
                <h3
                  className={`
                    text-[var(--text-lg)]
                    font-[var(--font-headline)]
                    font-semibold
                    leading-tight
                    mb-2
                  `.trim()}
                  style={{ color: '#F4D03F' }}
                >
                  SufiPulse
                </h3>
                <p
                  className={`
                    text-[var(--text-sm)]
                    text-[var(--color-text-secondary)]
                    leading-[var(--leading-relaxed)]
                  `.trim()}
                >
                  Institutional stewardship of sacred kalam through transparent governance and disciplined production.
                </p>
                <p className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mt-3">
                  &copy; {currentYear} All rights reserved.
                </p>
              </div>
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
