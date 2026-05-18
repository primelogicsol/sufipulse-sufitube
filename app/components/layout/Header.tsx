"use client";

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const DesktopNav = dynamic(() => import('./header/DesktopNav').then(m => m.DesktopNav), { ssr: false });
const MobileMenu = dynamic(() => import('./header/MobileMenu').then(m => m.MobileMenu), { ssr: false });

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
          duration-300
          z-50
          ${isScrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 shadow-2xl'
            : 'bg-transparent'
          }
        `.trim()}
      >
        <div className="h-full max-w-[1400px] mx-auto px-6 flex items-center justify-between gap-4">
          {/* Main Nav (Desktop) */}
          <div className="hidden xl:block flex-1">
            <DesktopNav />
          </div>

          {/* Mobile View */}
          <div className="xl:hidden flex items-center justify-between w-full">
            <Link href="/" className="shrink-0">
              <Image src="/sufipulse-logo-v5.png" alt="SufiPulse" width={40} height={40} className="h-10 w-auto" />
            </Link>
            
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="p-2 text-white hover:text-[#C8A75E] transition-colors"
            >
              <Menu size={28} />
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
