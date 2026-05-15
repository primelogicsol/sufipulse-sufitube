"use client";
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { DesktopNav } from './header/DesktopNav';
import { MobileMenu } from './header/MobileMenu';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          {/* Desktop Navigation */}
          <DesktopNav />

          {/* Mobile logo and hamburger */}
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

      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
}
