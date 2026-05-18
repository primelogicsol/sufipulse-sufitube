"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut } from 'lucide-react';
import Link from 'next/link';

export function AvatarMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-[#C8A75E] text-[#C8A75E] flex items-center justify-center font-semibold text-sm hover:bg-[#C8A75E]/10 transition-all duration-300 shadow-lg shadow-[#C8A75E]/5"
      >
        <User size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-48 bg-[#0B1223] border border-white/10 rounded-xl shadow-2xl py-2 z-50">
          {user ? (
            <>
              <div className="px-4 py-2 border-b border-white/5 mb-1">
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
              </div>
              <Link href="/user/profile" className="block px-4 py-2 text-neutral-300 hover:bg-white/5 text-sm" onClick={() => setIsOpen(false)}>Profile</Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 w-full text-left text-sm"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block px-4 py-2 text-neutral-300 hover:bg-white/5 text-sm" onClick={() => setIsOpen(false)}>Sign In</Link>
              <Link href="/writers/apply" className="block px-4 py-2 text-amber-400 hover:bg-amber-400/5 text-sm font-bold" onClick={() => setIsOpen(false)}>Apply</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
