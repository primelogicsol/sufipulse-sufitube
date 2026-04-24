"use client";

import React from 'react';

/**
 * Accessible Button Component
 * 
 * Features:
 * - Proper ARIA labels
 * - Keyboard navigation support
 * - Focus management
 * - Disabled state handling
 */

interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function AccessibleButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
  ariaLabel,
  variant = 'primary',
  className = '',
  onKeyDown,
}: AccessibleButtonProps) {
  const variantClasses = {
    primary: 'bg-[var(--color-gold)] text-[var(--color-midnight)] hover:bg-[var(--color-gold)]/90',
    secondary: 'bg-[var(--color-midnight)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-slate)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      onKeyDown={onKeyDown}
      className={`
        flex items-center justify-center gap-2 px-6 py-2.5 rounded font-medium 
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </button>
  );
}
