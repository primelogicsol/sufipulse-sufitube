"use client";
import { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { DropdownMenu } from '../navigation/DropdownMenu';
import { DualNameDropdownMenu } from '../navigation/DualNameDropdownMenu';
import { AvatarMenu } from '../navigation/AvatarMenu';
import { roleDisplayMap } from '../lib/roleDisplayMap';
import { Logo } from './Logo';
import Link from 'next/link';
import { usePathname } from "next/navigation";
import Image from 'next/image';
// import {SufitubeLogo} from './SufitubeLogo';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname()
  // const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const contributorsItems = [
    {
      public: roleDisplayMap.writer.public,
      mystical: roleDisplayMap.writer.mystical,
      href: '/writers',
      ariaLabel: 'Writers'
    },
    {
      public: roleDisplayMap.vocalist.public,
      mystical: roleDisplayMap.vocalist.mystical,
      href: '/vocalists',
      ariaLabel: 'Vocalists'
    },
    {
      public: roleDisplayMap.engineer.public,
      mystical: roleDisplayMap.engineer.mystical,
      href: '/producers',
      ariaLabel: 'Producers'
    },
    {
      public: 'Literary Contributors',
      mystical: 'Ahl-e-Tahreer',
      href: '/literary-contributors',
      ariaLabel: 'Literary Contributors'
    },
  ];

  const productionItems = [
    {
      public: roleDisplayMap.studio.public,
      mystical: roleDisplayMap.studio.mystical,
      href: '/studio',
      ariaLabel: 'Studio'
    },
    {
      public: 'Inside Studio',
      mystical: 'Facilities & Technology',
      href: '/inside-studio',
      ariaLabel: 'Inside Studio'
    },
    {
      public: 'Studio Engineers',
      mystical: 'Technical Stewardship',
      href: '/studio-engineers',
      ariaLabel: 'Studio Engineers'
    },
    {
      public: 'Studio Sessions',
      mystical: 'Recording Access Framework',
      href: '/studio-sessions',
      ariaLabel: 'Studio Sessions'
    },
    {
      public: 'Music Style Selection',
      mystical: 'Sacred Music Theory',
      href: '/production/music-style-selection',
      ariaLabel: 'Music Style Selection'
    },
  ];

  const governanceItems = [
    {
      public: 'Institutional Framework',
      mystical: 'Mithaq — Constitutional Charter',
      href: '/governance/mithaq',
      ariaLabel: 'Mithaq Constitutional Charter'
    },
    {
      public: 'Majlis-e-Nazr',
      mystical: 'Editorial Council',
      href: '/governance/majlis-e-nazr',
      ariaLabel: 'Majlis-e-Nazr Editorial Council'
    },
    {
      public: 'Production Oversight',
      mystical: 'Studio Integration',
      href: '/governance/production-oversight',
      ariaLabel: 'Production Oversight Studio Integration'
    },
    {
      public: 'Release Protocol',
      mystical: 'Publication Sequence',
      href: '/governance/release-protocol',
      ariaLabel: 'Release Protocol Publication Sequence'
    },
    {
      public: 'Diwan-e-Amanat',
      mystical: 'Registry Authority',
      href: '/governance/diwan-e-amanat',
      ariaLabel: 'Diwan-e-Amanat Registry Authority'
    },
    {
      public: 'Royalty Transparency',
      mystical: 'Economic Documentation',
      href: '/governance/royalty-transparency',
      ariaLabel: 'Royalty Transparency Economic Documentation'
    },
    {
      public: 'Content Stewardship',
      mystical: 'Linguistic & Thematic Oversight',
      href: '/governance/content-stewardship',
      ariaLabel: 'Content Stewardship Linguistic & Thematic Oversight'
    },
  ];

  const aboutItems = [
    { label: 'What is SufiPulse?', href: '/about/what-is-sufipulse' },
    { label: 'Founder', href: '/about/founder' },
    { label: 'Our Network', href: '/about/our-network' },
    { label: 'Institutional Partners', href: '/about/institutional-partners' },
    { label: 'Official Channels', href: '/official-channels' },
    { label: 'Institutional Collaboration', href: '/collaboration' },
    { label: 'Contact', href: '/contact' },
  ];

  // const isContributorsActive = contributorsItems.some(item => pathname === item.href);
  // const isProductionActive = productionItems.some(item => pathname.startsWith(item.href));
  // const isGovernanceActive = governanceItems.some(item => pathname === item.href);
  // const isAboutActive = aboutItems.some(item => pathname === item.href);

  return (
    <>
      <header
        className={`
          fixed
          top-0
          left-0
          right-0
          h-28
          py-8
          transition-all
          duration-[var(--transition-base)]
          z-[var(--z-header)]
          ${isScrolled
            ? 'bg-[var(--color-midnight)] shadow-[var(--shadow-soft)]'
            : 'bg-transparent'
          }
        `.trim()}
      >
        <div
          className={`
            h-full
            max-w-[1400px]
            mx-auto
            px-[var(--padding-mobile)]
            lg:px-[var(--padding-desktop)]
            flex
            items-center
            justify-between
          `.trim()}
        >
          {/* <Logo /> */}

          <nav className="hidden lg:flex items-center gap-8">

            {/* <img src="/sufitube-logo.png" alt="SufiTube Studio" className="h-44 py-2 w-auto object-contain" /> */}
            <Link href={"/"} className="mt-2">
              <Image
                src="/sufipulse-logo-v5.png"
                alt="sufipulse Studio"
                width={100}
                height={100}
                className='py-2'
              />
            </Link>
            <Link href={"/releases"} className="mt-2">
              <Image
                src="/sufitube-logo-v5.png"
                alt="sufitube Studio"
                width={150}
                height={150}
                className='py-2'
              />
            </Link>
            <Link
              href="/literary-journal"
              className={`
                text-nowrap
                transition-colors
                duration-[var(--transition-base)]
                font-medium
                ${pathname.startsWith('/literary-journal') || pathname.startsWith('/literary-')
                  ? 'text-[var(--color-gold)]'
                  : 'text-[var(--color-text-primary)] hover:text-[var(--color-gold)]'
                }
              `.trim()}
            >
              Literary Journal
            </Link>
            <DualNameDropdownMenu className='text-nowrap' label="Creative Contributors" items={contributorsItems} isActive={false} />
            <DualNameDropdownMenu className='text-nowrap' label="Production Infrastructure" items={productionItems} isActive={false} />
            <DualNameDropdownMenu className='text-nowrap' label="Governance" items={governanceItems} isActive={false} />
            <DropdownMenu className='text-nowrap' label="About" items={aboutItems} isActive={false} />

            <AvatarMenu />
          </nav>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`
              lg:hidden
              text-[var(--color-text-primary)]
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
              p-2
                text-nowrap

            `.trim()}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <div
            className={`
              fixed
              inset-0
              bg-black
              bg-opacity-50
              z-[var(--z-overlay)]
              transition-opacity
              duration-[var(--transition-base)]
              pointer-events-auto
              
            `.trim()}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`
              fixed
              top-0
              right-0
              bottom-0
              w-[280px]
              bg-[var(--color-slate)]
              z-[var(--z-modal)]
              shadow-[var(--shadow-elevated)]
              overflow-y-auto
              transition-transform
              duration-[var(--transition-base)]
            `.trim()}
          >
            <div className="flex items-center justify-between p-[var(--space-4)] border-b border-[var(--color-border-strong)]">
              <span
                className={`
                  text-[var(--text-lg)]
                  font-[var(--font-headline)]
                  font-semibold
                  text-[var(--color-text-primary)]
                `.trim()}
              >
                Menu
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  text-[var(--color-text-primary)]
                  hover:text-[var(--color-gold)]
                  transition-colors
                  duration-[var(--transition-base)]
                  p-2
                `.trim()}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="p-[var(--space-4)]">
              <Link
                href="/releases"
                className={`
                  flex
                  items-center
                  py-[var(--space-4)]
                  border-b
                  border-[var(--color-border)]
                  transition-colors
                  duration-[var(--transition-base)]
                `.trim()}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                }}
              >
                <img src="/sufitube-logo.png" alt="SufiTube Studio" className="h-8 w-auto object-contain" />
              </Link>

              <Link
                href="/literary-journal"
                className={`
                  block
                  py-[var(--space-4)]
                  text-[var(--color-text-primary)]
                  hover:text-[var(--color-gold)]
                  font-medium
                  border-b
                  border-[var(--color-border)]
                  transition-colors
                  duration-[var(--transition-base)]
                `.trim()}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                }}
              >
                Literary Journal
              </Link>

              <MobileDualNameSection title="Creative Contributors" items={contributorsItems} />
              <MobileDualNameSection title="Production Infrastructure" items={productionItems} />
              <MobileDualNameSection title="Governance" items={governanceItems} />

              <MobileNavSection title="About" items={aboutItems} />
            </nav>
          </div>
        </>
      )}
    </>
  );
}

interface MobileNavSectionProps {
  title: string;
  items: { label: string; href: string }[];
}

function MobileNavSection({ title, items }: MobileNavSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full
          flex
          items-center
          justify-between
          py-[var(--space-4)]
          text-[var(--color-text-primary)]
          font-medium
          transition-colors
          duration-[var(--transition-base)]
        `.trim()}
      >
        <span>{title}</span>
        <span
          className={`
            transition-transform
            duration-[var(--transition-base)]
            ${isOpen ? 'rotate-180' : ''}
          `.trim()}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="pb-[var(--space-4)]">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`
                block
                py-[var(--space-2)]
                pl-[var(--space-4)]
                text-[var(--text-sm)]
                text-[var(--color-text-secondary)]
                hover:text-[var(--color-gold)]
                transition-colors
                duration-[var(--transition-base)]
              `.trim()}
              onClick={(e) => {
                setIsOpen(false);
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface MobileDualNameSectionProps {
  title: string;
  items: { public: string; mystical: string; href: string; ariaLabel: string }[];
}

function MobileDualNameSection({ title, items }: MobileDualNameSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full
          flex
          items-center
          justify-between
          py-[var(--space-4)]
          text-[var(--color-text-primary)]
          font-medium
          transition-colors
          duration-[var(--transition-base)]
        `.trim()}
      >
        <span>{title}</span>
        <span
          className={`
            transition-transform
            duration-[var(--transition-base)]
            ${isOpen ? 'rotate-180' : ''}
          `.trim()}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="pb-[var(--space-4)]">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`
                block
                py-[var(--space-3)]
                pl-[var(--space-4)]
                hover:bg-[var(--color-midnight)]
                transition-colors
                duration-[var(--transition-base)]
              `.trim()}
              onClick={(e) => {
                // Let React Router handle navigation
              }}
              aria-label={item.ariaLabel}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium">
                  {item.public}
                </span>
                <span className="text-xs text-[var(--color-gold)] opacity-70">
                  {item.mystical}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
