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
    { label: 'Product Infrastructure', href: '/product-infrastructure' },
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
            xl:px-[var(--padding-desktop)]
            flex
            items-center
            justify-between
            gap-4
          `.trim()}
        >
          {/* Desktop Navigation - Always visible on xl screens and above */}
          <nav className="hidden xl:flex items-center gap-5 flex-1 justify-center text-[15px]">

            <Link href={"/"} className="mt-2 flex items-center shrink-0">
              <Image
                src="/sufipulse-logo-v5.png"
                alt="sufipulse Studio"
                width={100}
                height={100}
                className="h-9 sm:h-10 lg:h-11 w-auto object-contain py-1"
              />
            </Link>
            <Link href={"/releases"} className="mt-2 flex items-center shrink-0">
              <Image
                src="/sufitube-logo-v5.png"
                alt="sufitube Studio"
                width={150}
                height={150}
                className="h-9 sm:h-10 lg:h-11 w-auto object-contain py-1"
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
            <div className="shrink-0">
              <AvatarMenu />
            </div>
          </nav>

          {/* Mobile logo and hamburger - Only visible on screens smaller than xl */}
          <div className="xl:hidden flex items-center gap-3 shrink-0">
            <Link href="/" className="mt-1 flex items-center shrink-0" aria-label="Go to homepage">
              <Image
                src="/sufipulse-logo-v5.png"
                alt="sufipulse Studio"
                width={84}
                height={84}
                className="h-8 w-auto object-contain py-1"
              />
            </Link>
            <Link href="/releases" className="mt-1 flex items-center shrink-0" aria-label="Go to SufiTube">
              <Image
                src="/sufitube-logo-v5.png"
                alt="sufitube Studio"
                width={120}
                height={120}
                className="h-8 w-auto object-contain py-1"
              />
            </Link>
          </div>

          {/* Mobile hamburger - Only visible on screens smaller than xl */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`
              xl:hidden
              text-[var(--color-text-primary)]
              hover:text-[var(--color-gold)]
              transition-colors
              duration-[var(--transition-base)]
              p-2
              text-nowrap
              block
              shrink-0
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
            className="fixed inset-0 bg-[var(--color-midnight)]/80 backdrop-blur-sm z-[var(--z-overlay)] transition-opacity duration-500"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            className={`
              fixed
              top-0
              right-0
              bottom-0
              w-full
              xs:w-[320px]
              bg-[var(--color-slate)]
              z-[var(--z-modal)]
              shadow-2xl
              overflow-y-auto
              transition-transform
              duration-500
              border-l border-white/5
            `.trim()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[var(--color-midnight)]/20">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-[var(--color-gold)] rounded-full"></div>
                <span className="text-lg font-bold text-[var(--color-text-primary)] uppercase tracking-widest">
                  Menu
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] transition-colors rounded-full bg-white/5"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="p-6 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Link
                  href="/"
                  className="flex items-center justify-center p-4 bg-[var(--color-midnight)]/30 border border-white/5 rounded-2xl hover:border-[var(--color-gold)]/30 transition-all group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Image
                    src="/sufipulse-logo-v5.png"
                    alt="SufiPulse"
                    width={100}
                    height={28}
                    className="h-7 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </Link>

                <Link
                  href="/releases"
                  className="flex items-center justify-center p-4 bg-[var(--color-midnight)]/30 border border-white/5 rounded-2xl hover:border-[var(--color-gold)]/30 transition-all group"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Image
                    src="/sufitube-logo-v5.png"
                    alt="SufiTube"
                    width={100}
                    height={28}
                    className="h-7 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </Link>
              </div>

              <Link
                href="/literary-journal"
                className="flex items-center justify-between p-4 text-[var(--color-text-primary)] hover:text-[var(--color-gold)] font-bold text-sm uppercase tracking-widest bg-white/5 rounded-xl border border-transparent hover:border-[var(--color-gold)]/20 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Literary Journal
              </Link>

              <MobileDualNameSection title="Creative Contributors" items={contributorsItems} />
              <MobileDualNameSection title="Production Infrastructure" items={productionItems} />
              <MobileDualNameSection title="Governance" items={governanceItems} />

              <div className="mt-4 pt-4 border-t border-white/5">
                <MobileNavSection title="About & Engagement" items={aboutItems} />
              </div>

              <div className="mt-8 p-6 bg-[var(--color-midnight)]/50 rounded-2xl border border-[var(--color-gold)]/10 text-center">
                <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3">Institutional Access</p>
                <Link 
                  href="/register" 
                  className="inline-block w-full py-3 bg-[var(--color-gold)] text-[var(--color-midnight)] font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-[var(--color-gold)]/90 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Join the Network
                </Link>
              </div>
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
        style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '1rem 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 600 }}
      >
        <span>{title}</span>
        <span style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="pb-[var(--space-4)]">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="block text-left py-[var(--space-2)] pl-[var(--space-4)] text-[var(--text-sm)] text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] transition-colors duration-[var(--transition-base)]"
              onClick={() => setIsOpen(false)}
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
        style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '1rem 0', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-primary)', fontWeight: 600 }}
      >
        <span>{title}</span>
        <span style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="pb-[var(--space-4)]">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="block text-left py-[var(--space-3)] pl-[var(--space-4)] hover:bg-[var(--color-midnight)] transition-colors duration-[var(--transition-base)]"
              onClick={() => {}}
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
