import { useState, useRef, useEffect } from 'react';

import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface DropdownItem {
  label: string;
  href: string;
}

interface DropdownMenuProps {
  label: string;
  items: DropdownItem[];
  className?: string;
  isActive?: boolean;
}

export function DropdownMenu({ label, items, className = '', isActive = false }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex
          items-center
          gap-1
          transition-colors
          duration-[var(--transition-base)]
          font-medium
          py-2
          ${isActive
            ? 'text-[var(--color-gold)]'
            : 'text-[var(--color-text-primary)] hover:text-[var(--color-gold)]'
          }
        `.trim()}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown
          size={16}
          className={`
            transition-transform
            duration-[var(--transition-base)]
            ${isOpen ? 'rotate-180' : ''}
          `.trim()}
        />
      </button>

      {isOpen && (
        <div
          className={`
            absolute
            top-full
            left-0
            mt-2
            min-w-[200px]
            bg-[var(--color-slate)]
            border
            border-[var(--color-border-strong)]
            border-l-2
            border-l-[var(--color-gold)]
            rounded-[var(--radius-base)]
            shadow-[var(--shadow-elevated)]
            py-2
            z-[var(--z-dropdown)]
            animate-[fadeSlideIn_200ms_ease-in-out]
          `.trim()}
        >
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`
                block
                px-4
                py-2
                text-[var(--color-text-primary)]
                hover:bg-[var(--color-midnight)]
                hover:text-[var(--color-gold)]
                transition-colors
                duration-[var(--transition-base)]
                text-sm
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
