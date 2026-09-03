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
      setIsScrolled(window.scrollY > 30);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 h-20 md:h-24 z-50 flex items-center"
        style={{
          background: isScrolled
            ? 'rgba(5, 12, 28, 0.92)'
            : 'linear-gradient(to bottom, rgba(5,12,28,0.80) 0%, rgba(5,12,28,0.35) 60%, transparent 100%)',
          backdropFilter: isScrolled ? 'blur(18px)' : 'blur(4px)',
          WebkitBackdropFilter: isScrolled ? 'blur(18px)' : 'blur(4px)',
          borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
          boxShadow: isScrolled ? '0 4px 32px rgba(0,0,0,0.4)' : 'none',
          transition: 'background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Main Nav (Desktop) */}
          <div className="hidden xl:flex items-center justify-between w-full">
            <DesktopNav />
          </div>

          {/* Mobile & Tablet View */}
          <div className="xl:hidden flex items-center justify-between w-full">
            <Link href="/" className="shrink-0 flex items-center gap-2">
              <Image
                src="/sufipulse-logo-v5.png"
                alt="SufiPulse"
                width={120}
                height={36}
                className="h-8 sm:h-9 w-auto object-contain"
                priority
              />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-white hover:text-[var(--color-gold)] transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
