import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-midnight)]">
      <Header />

      <main className="flex-1 pt-[144px] has-[.hero-bleed]:pt-0">
        {children}
      </main>

      <Footer />
    </div>
  );
}
