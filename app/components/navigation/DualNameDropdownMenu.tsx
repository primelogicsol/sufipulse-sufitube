import { useState, useRef, useEffect } from 'react';
// import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface DualNameItem {
  public: string;
  mystical: string;
  href: string;
  ariaLabel: string;
}

interface DualNameDropdownMenuProps {
  label: string;
  items: DualNameItem[];
  className?: string;
  isActive?: boolean;
}

export function DualNameDropdownMenu({ label, items, className = '', isActive = false }: DualNameDropdownMenuProps) {
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
            min-w-[240px]
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
                py-3
                hover:bg-[var(--color-midnight)]
                transition-colors
                duration-[var(--transition-base)]
                group
              `.trim()}
              onClick={(e) => {
                setIsOpen(false);
              }}
              aria-label={item.ariaLabel}
            >
              <div className="flex flex-col gap-1">
                <span
                  className={`
                    text-[var(--color-text-primary)]
                    group-hover:text-[var(--color-gold)]
                    font-medium
                    text-sm
                    transition-colors
                    duration-[var(--transition-base)]
                  `.trim()}
                >
                  {item.public}
                </span>
                <span
                  className={`
                    text-[var(--color-gold)]
                    text-xs
                    opacity-70
                    group-hover:opacity-100
                    transition-opacity
                    duration-[var(--transition-base)]
                  `.trim()}
                >
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
