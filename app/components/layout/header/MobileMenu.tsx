"use client";
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import { CONTRIBUTORS_ITEMS, PRODUCTION_ITEMS, GOVERNANCE_ITEMS, ABOUT_ITEMS } from './constants';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-[var(--color-midnight)]/80 backdrop-blur-sm z-[var(--z-overlay)] transition-opacity duration-500"
        onClick={onClose}
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
            onClick={onClose}
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
              onClick={onClose}
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
              onClick={onClose}
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
            onClick={onClose}
          >
            Literary Journal
          </Link>

          <MobileDualNameSection title="Creative Contributors" items={CONTRIBUTORS_ITEMS} onClose={onClose} />
          <MobileDualNameSection title="Production Infrastructure" items={PRODUCTION_ITEMS} onClose={onClose} />
          <MobileDualNameSection title="Governance" items={GOVERNANCE_ITEMS} onClose={onClose} />

          <div className="mt-4 pt-4 border-t border-white/5">
            <MobileNavSection title="About & Engagement" items={ABOUT_ITEMS} onClose={onClose} />
          </div>

          <div className="mt-8 p-6 bg-[var(--color-midnight)]/50 rounded-2xl border border-[var(--color-gold)]/10 text-center">
            <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3">Institutional Access</p>
            <Link 
              href="/register" 
              className="inline-block w-full py-3 bg-[var(--color-gold)] text-[var(--color-midnight)] font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-[var(--color-gold)]/90 transition-colors"
              onClick={onClose}
            >
              Join the Network
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}

interface MobileNavSectionProps {
  title: string;
  items: { label: string; href: string }[];
  onClose: () => void;
}

function MobileNavSection({ title, items, onClose }: MobileNavSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left py-4 bg-transparent border-none cursor-pointer color-[var(--color-text-primary)] font-semibold"
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
              onClick={() => {
                setIsOpen(false);
                onClose();
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
  onClose: () => void;
}

function MobileDualNameSection({ title, items, onClose }: MobileDualNameSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left py-4 bg-transparent border-none cursor-pointer color-[var(--color-text-primary)] font-semibold"
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
              onClick={() => {
                onClose();
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
