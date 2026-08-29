import Image from 'next/image';
import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { Section } from '@/app/components/layout/Section';

export const metadata = {
  title: 'The Premiere Room | SufiPulse Studio USA',
  description: 'Upcoming Releases, Premium Teasers, and First Listens from SufiPulse Studio.',
};

export default function ReleasePremieresPage() {
  return (
    <>
      <Section background="midnight" spacing="loose" className="pt-24 md:pt-32 pb-12">
        <PageContainer>
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-[var(--text-4xl)] md:text-[var(--text-6xl)] font-bold text-white mb-6 font-serif">
              THE PREMIERE ROOM
            </h1>
            <p className="text-[var(--color-gold)] tracking-[0.2em] text-xs md:text-sm font-semibold uppercase">
              Upcoming Releases • Premium Teasers • First Listen
            </p>
          </div>

          {/* Featured Upcoming Release */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl mb-20 group">
            <div className="absolute inset-0 z-0">
              <Image 
                src="/banner1.png" 
                alt="Featured Premiere Background"
                fill
                className="object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-end justify-between p-8 md:p-12 min-h-[400px]">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 bg-[var(--color-gold)] text-black text-[10px] font-black uppercase tracking-widest rounded-sm mb-4">
                  Premium Teaser
                </span>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Kemis Taani Chhu Aav Aav
                </h2>
                <div className="flex items-center gap-4 text-neutral-300 text-sm mb-6">
                  <span className="font-semibold text-white">Official Release:</span>
                  <span>Upcoming</span>
                </div>
                <p className="text-neutral-400 text-base md:text-lg mb-8 max-w-xl">
                  A Kashmiri-English Sufi Kalam bringing the spiritual weight of Mahjoor's original verses into a contemporary global interpretation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="px-8 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-wider text-xs hover:bg-[#FDE68A] transition-colors rounded-full">
                    Watch Premium Teaser
                  </button>
                  <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-xs transition-colors rounded-full border border-white/20">
                    Notify Me
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Releases Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                UPCOMING RELEASES
              </h3>
              <Link href="/releases" className="text-[var(--color-gold)] text-sm font-semibold hover:underline">
                View All Catalog →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card placeholders - in production these would map from real database schedules */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden hover:border-[var(--color-gold)]/50 transition-colors">
                  <div className="aspect-video bg-neutral-800 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-neutral-600 text-sm font-semibold uppercase tracking-widest">Coming Soon</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest font-bold mb-2 block">First Listen</span>
                    <h4 className="text-lg font-bold text-white mb-2">Unannounced Title {i}</h4>
                    <p className="text-neutral-400 text-sm">Scheduled for Q3</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>
    </>
  );
}