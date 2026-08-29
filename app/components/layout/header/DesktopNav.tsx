"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { DropdownMenu } from '../../navigation/DropdownMenu';
import { DualNameDropdownMenu } from '../../navigation/DualNameDropdownMenu';
import { AvatarMenu } from '../../navigation/AvatarMenu';
import { CONTRIBUTORS_ITEMS, PRODUCTION_ITEMS, GOVERNANCE_ITEMS, ABOUT_ITEMS } from './constants';

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between w-full text-[14px] 2xl:text-[15px]">
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/" className="flex items-center shrink-0 hover:opacity-90 transition-opacity">
          <Image
            src="/sufipulse-logo-v5.png"
            alt="SufiPulse Studio"
            width={110}
            height={36}
            className="h-8 2xl:h-9 w-auto object-contain"
            priority
          />
        </Link>
        <Link href="/releases" className="flex items-center shrink-0 hover:opacity-90 transition-opacity">
          <Image
            src="/sufitube-logo-v5.png"
            alt="SufiTube"
            width={140}
            height={36}
            className="h-8 2xl:h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-4 2xl:gap-5">
        <Link
          href="/releases"
          className={`
            text-nowrap
            transition-colors
            duration-[var(--transition-base)]
            font-medium
            ${pathname.startsWith('/releases') || pathname.startsWith('/release-detail')
              ? 'text-[var(--color-gold)] font-semibold'
              : 'text-[var(--color-text-primary)] hover:text-[var(--color-gold)]'
            }
          `.trim()}
        >
          Sufi Songs
        </Link>
        <Link
          href="/release-premieres"
          className={`
            text-nowrap
            transition-colors
            duration-[var(--transition-base)]
            font-medium
            ${pathname.startsWith('/release-premieres')
              ? 'text-[var(--color-gold)] font-semibold'
              : 'text-[var(--color-text-primary)] hover:text-[var(--color-gold)]'
            }
          `.trim()}
        >
          Premieres
        </Link>
        <DualNameDropdownMenu className="text-nowrap" label="Creative Contributors" items={CONTRIBUTORS_ITEMS} isActive={false} />
        <DualNameDropdownMenu className="text-nowrap" label="Production Infrastructure" items={PRODUCTION_ITEMS} isActive={false} />
        <DualNameDropdownMenu className="text-nowrap" label="Governance" items={GOVERNANCE_ITEMS} isActive={false} />
        <DropdownMenu className="text-nowrap" label="About" items={ABOUT_ITEMS} isActive={false} />
      </div>

      <div className="shrink-0 pl-2">
        <AvatarMenu />
      </div>
    </nav>
  );
}
