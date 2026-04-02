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

      <div className="h-16" aria-hidden="true" />

      <main className="flex-1 mt-20">
        {children}
      </main>

      <Footer />
    </div>
  );
}
