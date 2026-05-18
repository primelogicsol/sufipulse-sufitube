"use client";

import React, { ReactNode } from 'react';
import { LucideIcon, ChevronDown } from 'lucide-react';

interface IconInputProps {
  icon: LucideIcon;
  label?: string;
  error?: string;
  children: ReactNode;
  rightIcon?: boolean;
}

export function IconInput({ icon: Icon, label, error, children, rightIcon = false }: IconInputProps) {
  return (
    <div className="space-y-2 w-full group">
      {label && (
        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {/* Left Icon */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none z-10 group-focus-within:text-amber-400/60 transition-colors">
          <Icon size={20} />
        </div>

        {children}

        {/* Right Icon (Optional, e.g. for selects) */}
        {rightIcon && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 pointer-events-none">
            <ChevronDown size={20} />
          </div>
        )}
      </div>
      {error && (
        <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1 animate-fade-in">
          {error}
        </p>
      )}
    </div>
  );
}
