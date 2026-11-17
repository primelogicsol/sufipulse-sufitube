import Link from 'next/link';
import { PageContainer } from '@/app/components/layout/PageContainer';
import { Section } from '@/app/components/layout/Section';
import {
  Compass,
  ShieldCheck,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Share2,
  FileText
} from 'lucide-react';

export const metadata = {
  title: 'Kashmir Cultural Partner Network | SufiPulse USA',
  description: 'A global cultural alliance organizing verified community custodians, artisan guilds, and youth forums across the 10 Kashmir Valley districts for authentic music distribution.',
};

export default function KashmirPartnersPublicPage() {
  const pillars = [
    {
      icon: '🌿',
      title: 'Ecological Conservation & Water Guardians',
      description: 'Preserving Kashmir’s sacred waters, wetlands, forests, and springs through spiritual ecology and ethical dialogue.',
      flagshipSong: 'How Long Will You Remain Silent? (Kab Tak Khamosh)',
      partners: 'Kashmir EcoWatch, Wular Lake Alliance, Lidder River Ecological Action',
    },
    {
      icon: '✨',
      title: 'Artisan Guilds & Living Craft Heritage',
      description: 'Honoring master craftspeople, woodcarvers, carpet weavers, and papier-mâché ustads with cultural dignity.',
      flagshipSong: 'Some People Leave Footprints Behind',
      partners: 'De Koshur Crafts, Hamadan Craft Revival, Craftlore Guild, Zadibal Syndicate',
    },
    {
      icon: '📜',
      title: 'Sacred Literature, Shrines & Reshi-Sufi',
      description: 'Safeguarding classical Kashmiri shruks, Nund Rishi (Sheikh Noorani) vakhs, and Khanqah devotional traditions.',
      flagshipSong: 'Institutional Sacred Kalams & Reshi Adaptations',
      partners: 'Chrar-i-Sharief Cultural Forum, Lall-Arifa Society, Khanqah-e-Moula Circle',
    },
    {
      icon: '🎓',
      title: 'Youth, Universities & Ethical Thinkers',
      description: 'Connecting science, technology ethics, and contemporary Sufi thought with university student debating clubs.',
      flagshipSong: 'Sufi Science Center Reflections',
      partners: 'Kashmir University Forum, IUST Youth Circle, NIT Srinagar Dialogue Club',
    },
  ];

  const districts = [
    'Srinagar', 'Budgam', 'Ganderbal', 'Anantnag', 'Pulwama',
    'Shopian', 'Kulgam', 'Baramulla', 'Kupwara', 'Bandipora'
  ];

  return (
    <div className="bg-[var(--color-midnight,#0B0F17)] text-white min-h-screen">
      {/* Hero Header */}
      <section className="relative pt-24 pb-20 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-gold,#D4AF37)]/10 via-transparent to-transparent opacity-40 pointer-events-none" />
        <PageContainer>
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--color-gold,#D4AF37)]/10 border border-[var(--color-gold,#D4AF37)]/30 rounded-full text-[11px] font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
              <Compass className="w-3.5 h-3.5" /> Cultural Distribution Alliance
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              SufiPulse Cultural <br className="hidden md:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold,#D4AF37)] to-[#FDE68A]">
                Partner Network
              </span>
            </h1>
            <p className="text-base md:text-lg text-neutral-300 leading-relaxed max-w-2xl mx-auto font-light">
              Connecting genuine community custodians, artisan guilds, and youth forums across the ten districts of the Kashmir Valley to distribute sacred music without commercial ad spam or unsolicited messaging.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/network/kashmir-partners/apply"
                className="px-6 py-3 bg-[var(--color-gold,#D4AF37)] hover:bg-[#FDE68A] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-2"
              >
                Apply to Join Network <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/network/kashmir-partners/directory"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
              >
                View Partner Directory
              </Link>
              <Link
                href="/network/kashmir-partners/guidelines"
                className="px-6 py-3 bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Guidelines
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* The 4 Strategic Pillars */}
      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                Distribution Architecture
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                The Four Cultural Pillars
              </h2>
              <p className="text-sm text-neutral-400 max-w-xl mx-auto">
                Every release produced by SufiPulse USA is matched with culturally aligned community stakeholders to ensure meaningful listening.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pillars.map((pillar, i) => (
                <div key={i} className="p-8 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4 hover:border-white/20 transition-all">
                  <div className="text-3xl">{pillar.icon}</div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{pillar.title}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">{pillar.description}</p>
                  <div className="pt-2 border-t border-white/5 space-y-1.5 text-xs">
                    <div className="text-neutral-400"><strong className="text-white">Flagship Release:</strong> {pillar.flagshipSong}</div>
                    <div className="text-neutral-400"><strong className="text-white">Verified Guilds:</strong> {pillar.partners}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* 10 Districts Coverage Banner */}
      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-5xl mx-auto p-8 md:p-10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/10 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-gold,#D4AF37)]">
                  Geographic Footprint
                </span>
                <h3 className="text-2xl font-bold text-white tracking-tight mt-1">
                  10 Kashmir Valley Districts Active
                </h3>
              </div>
              <span className="text-xs text-neutral-400">
                100% voluntary participation · Zero unverified claims
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {districts.map((d, i) => (
                <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-xl text-center">
                  <div className="text-xs font-bold text-white">{d}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">Active Chapter</div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      {/* Non-Commercial Covenant */}
      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-3xl mx-auto text-center space-y-6 border-t border-white/10 pt-12">
            <ShieldCheck className="w-8 h-8 text-[var(--color-gold,#D4AF37)] mx-auto" />
            <h3 className="text-2xl font-bold text-white tracking-tight">The Non-Commercial Distribution Covenant</h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              SufiPulse Cultural Partners do not pay membership fees, nor are they paid affiliate spammers. Partners are respected cultural, ecological, and educational organizations who share a common commitment to preserving classical poetry, environmental ethics, and living artisan heritage.
            </p>
            <div className="pt-4">
              <Link
                href="/network/kashmir-partners/apply"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-gold,#D4AF37)] text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#FDE68A] transition-all shadow-xl"
              >
                Apply for Verified Partnership <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </Section>
    </div>
  );
}
