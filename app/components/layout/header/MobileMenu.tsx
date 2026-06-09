"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, User, Shield, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { CONTRIBUTORS_ITEMS, PRODUCTION_ITEMS, GOVERNANCE_ITEMS, ABOUT_ITEMS } from './constants';
import { useAuth } from '../../../contexts/AuthContext';
import { canAccessAdmin } from '../../../lib/role-access';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const savedAvatar = localStorage.getItem(`sufipulse_avatar_${user.id}`);
      if (savedAvatar) setAvatarUrl(savedAvatar);
    }
  }, [user]);

  if (!isOpen) return null;

  const isAdmin = canAccessAdmin(user);

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
            className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] transition-colors rounded-full bg-white/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Account Section */}
        <div className="px-6 py-4 border-b border-white/5">
          {user ? (
            <div className="flex items-center gap-3 bg-[var(--color-midnight)]/40 p-3 rounded-lg border border-white/5">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-slate)] border border-white/10 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[var(--color-gold)] font-bold text-base">
                    {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                    {user.full_name || 'User'}
                  </span>
                  {isAdmin && (
                    <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded leading-none">
                      ADMIN
                    </span>
                  )}
                  {user.role === 'studio' && !isAdmin && (
                    <span className="text-[8px] uppercase tracking-widest font-bold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded leading-none">
                      STUDIO
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                  {user.email}
                </span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] font-bold uppercase tracking-wider">
                  <Link 
                    href={isAdmin ? "/admin" : `/user/${user.role || 'profile'}/dashboard`} 
                    onClick={onClose} 
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] transition-colors"
                  >
                    Dashboard
                  </Link>
                  <span className="text-white/10">|</span>
                  <Link 
                    href="/user/profile" 
                    onClick={onClose} 
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] transition-colors"
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <>
                      <span className="text-white/10">|</span>
                      <Link 
                        href="/admin/users" 
                        onClick={onClose} 
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] transition-colors"
                      >
                        Users
                      </Link>
                    </>
                  )}
                  <span className="text-white/10">|</span>
                  <button 
                    onClick={() => { logout(); onClose(); }} 
                    className="text-red-400/80 hover:text-red-400 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                onClick={onClose}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-center text-xs font-bold text-[var(--color-text-primary)] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="flex-1 py-2 bg-[var(--color-gold)] hover:bg-[var(--color-gold)]/90 text-[var(--color-midnight)] rounded-lg text-center text-xs font-bold transition-all"
              >
                Join Network
              </Link>
            </div>
          )}
        </div>

        <nav className="p-6 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <Link
              href="/"
              className="flex items-center justify-center p-3 bg-[var(--color-midnight)]/30 border border-white/5 rounded-xl hover:border-[var(--color-gold)]/30 transition-all group"
              onClick={onClose}
            >
              <Image
                src="/sufipulse-logo-v5.png"
                alt="SufiPulse"
                width={100}
                height={28}
                className="h-6 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </Link>

            <Link
              href="/releases"
              className="flex items-center justify-center p-3 bg-[var(--color-midnight)]/30 border border-white/5 rounded-xl hover:border-[var(--color-gold)]/30 transition-all group"
              onClick={onClose}
            >
              <Image
                src="/sufitube-logo-v5.png"
                alt="SufiTube"
                width={100}
                height={28}
                className="h-6 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>

          <Link
            href="/releases"
            className="flex flex-col items-start p-3 bg-white/5 rounded-lg border border-transparent hover:border-[var(--color-gold)]/20 transition-all mb-2"
            onClick={onClose}
          >
            <span className="text-[var(--color-text-primary)] hover:text-[var(--color-gold)] font-bold text-[10px] uppercase tracking-widest transition-colors text-left">
             Sufi Songs
            </span>
          </Link>

          <Link
            href="/literary-journal"
            className="flex flex-col items-start p-3 bg-white/5 rounded-lg border border-transparent hover:border-[var(--color-gold)]/20 transition-all mb-2"
            onClick={onClose}
          >
            <span className="text-[var(--color-text-primary)] hover:text-[var(--color-gold)] font-bold text-[10px] uppercase tracking-widest transition-colors text-left">
              Literary Journal
            </span>
          </Link>

          <MobileDualNameSection title="Creative Contributors" items={CONTRIBUTORS_ITEMS} onClose={onClose} />
          <MobileDualNameSection title="Production Infrastructure" items={PRODUCTION_ITEMS} onClose={onClose} />
          <MobileDualNameSection title="Governance" items={GOVERNANCE_ITEMS} onClose={onClose} />

          <div className="mt-1 pt-1 border-t border-white/5">
            <MobileNavSection title="About & Engagement" items={ABOUT_ITEMS} onClose={onClose} />
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
    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/5 mb-1.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-primary)] text-left flex-1">
          {title}
        </span>
        <span 
          className="text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-200 ml-4 text-[10px]" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="bg-[var(--color-midnight)]/30 border-t border-white/5 flex flex-col">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="w-full text-left px-4 py-3 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-gold)] hover:bg-white/5 transition-colors border-b border-white/5 last:border-none"
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
    <div className="bg-white/5 rounded-lg overflow-hidden border border-white/5 mb-1.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 hover:bg-white/5 transition-colors focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-primary)] text-left flex-1">
          {title}
        </span>
        <span 
          className="text-[var(--color-text-tertiary)] flex-shrink-0 transition-transform duration-200 ml-4 text-[10px]" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="bg-[var(--color-midnight)]/30 border-t border-white/5 flex flex-col">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none group"
              onClick={() => {
                setIsOpen(false);
                onClose();
              }}
              aria-label={item.ariaLabel}
            >
              <div className="flex flex-col gap-0.5 items-start">
                <span className="text-[11px] font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors">
                  {item.public}
                </span>
                <span className="text-[9px] text-[var(--color-gold)]/70">
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
