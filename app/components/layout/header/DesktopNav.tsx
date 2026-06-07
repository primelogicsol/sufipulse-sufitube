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
    <nav className="hidden xl:flex items-center gap-5 flex-1 justify-center text-[15px]">
      <Link href={"/"} className="mt-2 flex items-center shrink-0">
        <Image
          src="/sufipulse-logo-v5.png"
          alt="sufipulse Studio"
          width={100}
          height={100}
          className="h-9 sm:h-10 lg:h-11 w-auto object-contain py-1"
        />
      </Link>
      <Link href={"/releases"} className="mt-2 flex items-center shrink-0">
        <Image
          src="/sufitube-logo-v5.png"
          alt="sufitube Studio"
          width={150}
          height={150}
          className="h-9 sm:h-10 lg:h-11 w-auto object-contain py-1"
        />
      </Link>
      <Link
        href="/knowledge"
        className={`
          text-nowrap
          transition-colors
          duration-[var(--transition-base)]
          font-medium
          ${pathname.startsWith('/knowledge')
            ? 'text-[var(--color-gold)]'
            : 'text-[var(--color-text-primary)] hover:text-[var(--color-gold)]'
          }
        `.trim()}
      >
        Knowledge Archive
      </Link>
      <Link
        href="/literary-journal"
        className={`
          text-nowrap
          transition-colors
          duration-[var(--transition-base)]
          font-medium
          ${pathname.startsWith('/literary-journal') || pathname.startsWith('/literary-')
            ? 'text-[var(--color-gold)]'
            : 'text-[var(--color-text-primary)] hover:text-[var(--color-gold)]'
          }
        `.trim()}
      >
        Literary Journal
      </Link>
      <DualNameDropdownMenu className='text-nowrap' label="Creative Contributors" items={CONTRIBUTORS_ITEMS} isActive={false} />
      <DualNameDropdownMenu className='text-nowrap' label="Production Infrastructure" items={PRODUCTION_ITEMS} isActive={false} />
      <DualNameDropdownMenu className='text-nowrap' label="Governance" items={GOVERNANCE_ITEMS} isActive={false} />
      <DropdownMenu className='text-nowrap' label="About" items={ABOUT_ITEMS} isActive={false} />
      <div className="shrink-0">
        <AvatarMenu />
      </div>
    </nav>
  );
}
