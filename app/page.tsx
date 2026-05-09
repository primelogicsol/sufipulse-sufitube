"use client";
import { Music, Users, Shield, TrendingUp, Calendar, ArrowRight, Play, BookOpen, Clock, FileText, Headphones, Globe, Pen, Mic, Disc3, Feather, ChevronLeft, ChevronRight } from 'lucide-react';
import { Hero } from './components/primitives/Hero';
import { Card } from './components/primitives/Card';
import { PrimaryButton } from './components/primitives/PrimaryButton';
import { Badge } from './components/primitives/Badge';
import { Section } from './components/layout/Section';
import { PageContainer } from './components/layout/PageContainer';
import { Layout } from './components/layout/Layout';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Loader from './components/ui/Loader';
import { CountUp } from './components/ui/CountUp';
import { literaryArticles } from './data/literary-articles';
import Image from 'next/image';
import { buildYouTubeThumbnailCandidates, advanceThumbnailFallback } from '@/lib/youtube-thumbnails';
import { getBestReleaseDate, sortReleases } from '@/lib/release-utils';

interface FeaturedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author_name: string;
  reading_time_minutes: number;
  published_at: string;
}

interface Publication {
  id: string;
  type: 'music' | 'literary';
  title: string;
  slug: string;
  published_at: string;
  excerpt?: string;
  artwork_url?: string;
  youtube_video_id?: string;
  description?: string;
}

export default function Home() {
  // const { releases, loading } = useReleases();
  // const featuredReleases = releases
  //   .filter(r => r.youtube_video_id && r.source === 'youtube_legacy')
  //   .slice(0, 6);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [latestPublications, setLatestPublications] = useState<Publication[]>([]);
  const [recentReleases, setRecentReleases] = useState<Publication[]>([]);
  const [pubsLoading, setPubsLoading] = useState(true);
  const [lastReleaseSync, setLastReleaseSync] = useState<string | null>(null);
  const [kpiStats, setKpiStats] = useState({ releases: 81, writers: literaryArticles.length, institutions: 4 });

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .then(data => {
        if (!data) return;
        setKpiStats({
          releases: data.releases > 0 ? data.releases : 81,
          writers: data.writers > 0 ? data.writers : literaryArticles.length,
          institutions: data.institutions > 0 ? data.institutions : 4,
        });
      });
  }, []);

  const featuredReleases = latestPublications.filter(p => p.type === 'music');
  const activeRelease = featuredReleases[currentSlide];
  const activeVideoId = activeRelease?.youtube_video_id || activeRelease?.slug;
  const activeThumbnailCandidates = buildYouTubeThumbnailCandidates(activeVideoId, [activeRelease?.artwork_url]);

  const nextSlide = () => {
    if (featuredReleases.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % featuredReleases.length);
  };

  const prevSlide = () => {
    if (featuredReleases.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + featuredReleases.length) % featuredReleases.length);
  };

  useEffect(() => {
    // Featured articles
    const featured = literaryArticles.filter(a => a.featured).slice(0, 3).map(a => ({
      ...a,
      author_name: a.author_name || 'Ahl-e-Tahreer Archive'
    }));
    setFeaturedArticles(featured as any);
    setArticlesLoading(false);

    // Latest publications — fetch ranked (carousel) and date-sorted (grid) in parallel
    const fetchLatestPublications = async () => {
      try {
        const toPublication = (r: any): Publication => {
          const videoId = r.youtubeId || r.youtube_video_id || r.videoId || '';
          return {
            id: r.id,
            type: 'music' as const,
            title: r.title,
            slug: videoId,
            published_at: getBestReleaseDate(r),
            description: r.description,
            artwork_url: r.thumbnail || r.thumbnail_url || r.thumbnailUrl,
            youtube_video_id: videoId,
          };
        };

        const [rankedRes, recentRes] = await Promise.all([
          fetch('/api/releases?status=published&sort=ranked&limit=8'),
          fetch('/api/releases?status=published&limit=100'), // Fetch more to ensure correct sorting before slicing
        ]);

        let rankedMusic: Publication[] = [];
        if (rankedRes.ok) {
          const json = await rankedRes.json();
          const data = Array.isArray(json) ? json : json.items || [];
          if (Array.isArray(data)) rankedMusic = data.filter((r: any) => r.youtubeId).map(toPublication);
        }

        let recentMusic: Publication[] = [];
        if (recentRes.ok) {
          const json = await recentRes.json();
          const data = Array.isArray(json) ? json : json.items || [];
          if (Array.isArray(data)) {
            console.log(`[Homepage] Fetched ${data.length} recent releases.`);
            recentMusic = data.filter((r: any) => r.youtube_video_id || r.youtubeId).map(toPublication);
          }
        }

        const sortedRecent = sortReleases(recentMusic, 'all').slice(0, 8);
        console.log(`[Homepage] Sorted recent count: ${sortedRecent.length}`);
        if (sortedRecent.length > 0) {
          console.log(`[Homepage] Top item: ${sortedRecent[0].title}`);
        }

        if (rankedMusic.length > 0 || sortedRecent.length > 0) {
          setLatestPublications(rankedMusic.length > 0 ? rankedMusic : sortedRecent);
          setRecentReleases(sortedRecent);
          setLastReleaseSync(new Date().toISOString());
          setPubsLoading(false);
          return;
        }

        // Fallback: If everything else failed, use static data if we have it
      } catch (err) {
        console.error('Error fetching latest music releases:', err);
        setLatestPublications([]);
        setRecentReleases([]);
      } finally {
        setPubsLoading(false);
      }
    };

    fetchLatestPublications();

    // Auto-refresh latest releases every 15 minutes.
    const refreshTimer = setInterval(fetchLatestPublications, 15 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    if (currentSlide >= featuredReleases.length) {
      setCurrentSlide(0);
    }
  }, [currentSlide, featuredReleases.length]);

  useEffect(() => {
    if (featuredReleases.length <= 1) return;
    const carouselTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredReleases.length);
    }, 7000);

    return () => clearInterval(carouselTimer);
  }, [featuredReleases.length]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <Section background="midnight" spacing="normal" className="pt-20 md:pt-32">
        <PageContainer>
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-4">
              <span className="inline-block px-4 py-1 border border-[var(--color-gold)]/30 rounded-full text-[var(--text-xs)] md:text-[var(--text-sm)] text-[var(--color-gold)] uppercase tracking-wider font-medium">
                Institutional Archive
              </span>
            </div>

            <h1 className="text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
              The House of Sacred<br className="hidden md:block" /> Word, Voice and Stewardship
            </h1>

            <p className="text-[var(--text-lg)] md:text-[var(--text-xl)] text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-[var(--leading-relaxed)] font-light">
              SufiPulse Studio USA, managed by Dr. Kumar Foundation USA, is a disciplined institution dedicated to the authorship, performance, production, and entrusted release of sacred expression.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Link href="/releases">
                <Image
                  src="/sufitube-logo-v5.png"
                  alt="Sufitube Logo"
                  width={180}
                  height={45}
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </Link>
              <Link href="/governance">
                <PrimaryButton variant="outline" size="medium" className="px-8">
                  Governance Framework
                </PrimaryButton>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-12 border-t border-[var(--color-text-tertiary)]/10">
              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={kpiStats.releases} suffix="+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Releases</div>
              </div>
              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={kpiStats.writers} suffix="+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Active Writers</div>
              </div>
              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={100} suffix="%" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Transparency</div>
              </div>
              <div>
                <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={kpiStats.institutions} style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">Institutions</div>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 sm:text-center">
              <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
                Institutional Framework
              </div>
              <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                Governed Structure for Sacred Content
              </h2>
              <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl md:mx-auto leading-[var(--leading-relaxed)]">
                SufiPulse operates under a comprehensive governance system with formal oversight mechanisms, transparent economic protocols, and institutional accountability standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Multi-Stakeholder Governance
                </h3>
                <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Decision-making authority distributed across specialized oversight committees with documented accountability trails and constitutional alignment.
                </p>
                <Link href="/governance" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                  View Framework <ArrowRight size={14} />
                </Link>
              </Card>

              <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Transparent Revenue Systems
                </h3>
                <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  All revenue streams tracked in real-time. Royalty agreements locked before production. Contributors receive quarterly statements with full audit trails.
                </p>
                <Link href="/governance/royalty-transparency" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                  View Transparency Reports <ArrowRight size={14} />
                </Link>
              </Card>

              <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                  <Music className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Content Integrity Standards
                </h3>
                <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Every submission reviewed against established criteria. Release protocols ensure alignment with Sufi tradition and institutional quality benchmarks.
                </p>
                <Link href="/governance/release-protocol" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                  View Protocol <ArrowRight size={14} />
                </Link>
              </Card>

              <Card className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-6 md:p-8">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Contributor Rights Protection
                </h3>
                <p className="text-[var(--text-sm)] md:text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Writers, vocalists, and producers retain intellectual property rights. Formal agreements govern all collaborations with institutional mediation available.
                </p>
                <Link href="/contributor-policy" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-semibold flex items-center gap-2">
                  View Policy <ArrowRight size={14} />
                </Link>
              </Card>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
                Dual-Medium Architecture
              </div>
              <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                Two Channels of Sacred Transmission
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="border-l-2 border-[var(--color-gold)] pl-6 md:pl-8">
                <div className="mb-6">
                  <Headphones className="w-10 h-10 text-[var(--color-gold)] mb-4" />
                  <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-2">
                    Musical Registry
                  </h3>
                  <div className="text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-bold mb-4">
                    Studio Production Division
                  </div>
                </div>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-8">
                  Vocal performances, instrumental arrangements, and audio engineering governed by production oversight protocols.
                </p>
                <div className="space-y-4 mb-10">
                  {[
                    "Writer-vocalist-producer coordination system",
                    "Pre-production royalty agreement locking",
                    "Studio session documentation and archiving"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/releases">
                  <PrimaryButton variant="secondary" size="medium">
                    View Musical Registry
                  </PrimaryButton>
                </Link>
              </div>

              <div className="border-l-2 border-[var(--color-gold)] pl-6 md:pl-8">
                <div className="mb-6">
                  <FileText className="w-10 h-10 text-[var(--color-gold)] mb-4" />
                  <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-2">
                    Literary Division
                  </h3>
                  <div className="text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-bold mb-4">
                    Editorial & Publishing Council
                  </div>
                </div>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-8">
                  Essays, scholarly reflections, and written kalam published under editorial oversight ensuring intellectual rigor.
                </p>
                <div className="space-y-4 mb-10">
                  {[
                    "Contributor credential verification system",
                    "Multi-stage editorial review process",
                    "Intellectual property protection protocols"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{item}</span>
                    </div>
                  ))}
                </div>
                <Link href="/literary-journal">
                  <PrimaryButton variant="secondary" size="medium">
                    View Literary Division
                  </PrimaryButton>
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 sm:text-center">
              <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
                Institutional Workflow
              </div>
              <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                Production Pipeline
              </h2>
              <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl md:mx-auto leading-[var(--leading-relaxed)]">
                A standardized, multi-stage approval process governs all content from initial submission through public release.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { 
                  step: '01', 
                  title: 'Submission & Review', 
                  desc: 'Writers submit kalam through formal application system for committee review.',
                  meta: 'Review Period: 14-21 days'
                },
                { 
                  step: '02', 
                  title: 'Production', 
                  desc: 'Approved content assigned to vocalists and producers under oversight protocols.',
                  meta: 'Phase: 4-8 weeks'
                },
                { 
                  step: '03', 
                  title: 'Registry Lock', 
                  desc: 'Final approval from governance body before public distribution across platforms.',
                  meta: 'Reporting: Quarterly'
                }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[var(--color-gold)] rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--color-midnight)] font-bold text-xl">
                      {item.step}
                    </div>
                    <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </h3>
                  </div>
                  <div className="border-l-2 border-[var(--color-gold)]/20 pl-6 ml-6 pb-2">
                    <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed mb-4">
                      {item.desc}
                    </p>
                    <div className="text-[11px] text-[var(--color-gold)] uppercase tracking-widest font-bold">
                      {item.meta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto mb-12 sm:text-center">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Registry Highlights
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Registry Highlights
            </h2>
            <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-2xl md:mx-auto leading-[var(--leading-relaxed)]">
              Curated selections from the institutional registry of approved and distributed works.
            </p>
          </div>

          {pubsLoading ? (
            <div className="max-w-4xl mx-auto">
              <div className="aspect-video w-full bg-[var(--color-slate)]/20 animate-pulse rounded-xl border border-[var(--color-text-tertiary)]/10 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--color-gold)]/20 border-t-[var(--color-gold)] rounded-full animate-spin"></div>
              </div>
            </div>
          ) : featuredReleases.length === 0 ? (
            <div className="flex items-center justify-center py-20 bg-[var(--color-slate)]/10 rounded-2xl border border-dashed border-[var(--color-text-tertiary)]/20">
              <div className="text-center">
                <Music className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
                <div className="text-[var(--color-text-secondary)] font-medium">Registry archive empty</div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative max-w-4xl mx-auto">
                {featuredReleases.length > 0 && (
                  <Link
                    href={`/release-detail/${featuredReleases[currentSlide]?.youtube_video_id || featuredReleases[currentSlide]?.slug}`}
                    className="group block"
                  >
                    <div className="relative">
                      {featuredReleases[currentSlide]?.youtube_video_id || featuredReleases[currentSlide]?.slug ? (
                        <div className="relative w-full overflow-hidden rounded-xl shadow-2xl border border-[var(--color-text-tertiary)]/10" style={{ aspectRatio: '16/9' }}>
                          <img
                            key={activeVideoId}
                            src={activeThumbnailCandidates[0]}
                            alt={featuredReleases[currentSlide]?.title}
                            className="w-full h-full object-cover bg-black group-hover:scale-[1.02] transition-transform duration-700"
                            loading="lazy"
                            data-thumb-index="0"
                            onError={(e) => {
                              advanceThumbnailFallback(e.currentTarget, activeThumbnailCandidates);
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                          
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-[var(--color-gold)] flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                              <Play className="w-10 h-10 text-[var(--color-midnight)] ml-1" fill="currentColor" />
                            </div>
                          </div>

                          <div className="absolute bottom-6 left-6 right-6">
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-1 group-hover:text-[var(--color-gold)] transition-colors">
                              {featuredReleases[currentSlide]?.title}
                            </h3>
                            <div className="flex items-center gap-4 text-[var(--text-xs)] text-white/70 uppercase tracking-widest font-bold">
                              <span>{formatDate(featuredReleases[currentSlide]?.published_at)}</span>
                              <span className="w-1 h-1 bg-[var(--color-gold)] rounded-full"></span>
                              <span>{currentSlide + 1} / {featuredReleases.length}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-[var(--color-slate)]/20 rounded-xl flex items-center justify-center border border-[var(--color-text-tertiary)]/10" style={{ aspectRatio: '16/9' }}>
                          <Music className="w-12 h-12 text-[var(--color-text-tertiary)] opacity-30" />
                        </div>
                      )}
                    </div>
                  </Link>
                )}

                {featuredReleases.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.preventDefault(); prevSlide(); }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 md:-translate-x-16 w-12 h-12 bg-[var(--color-midnight)]/80 backdrop-blur-sm border border-[var(--color-border-strong)] hover:border-[var(--color-gold)] rounded-full flex items-center justify-center transition-all duration-300 group z-10 text-white hover:text-[var(--color-gold)]"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); nextSlide(); }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 md:translate-x-16 w-12 h-12 bg-[var(--color-midnight)]/80 backdrop-blur-sm border border-[var(--color-border-strong)] hover:border-[var(--color-gold)] rounded-full flex items-center justify-center transition-all duration-300 group z-10 text-white hover:text-[var(--color-gold)]"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </PageContainer>
      </Section>

      <Section background="slate" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto mb-12 sm:text-center">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              Literary Journal
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Ahl-e-Tahreer Archive
            </h2>
            <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-2xl md:mx-auto leading-[var(--leading-relaxed)]">
              Essays, scholarly reflections, and written kalam from verified contributors.
            </p>
          </div>

          {articlesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[var(--color-midnight)]/20 animate-pulse rounded-xl h-64 border border-[var(--color-text-tertiary)]/5"></div>
              ))}
            </div>
          ) : featuredArticles.length === 0 ? (
            <div className="flex items-center justify-center py-16 bg-[var(--color-midnight)]/10 rounded-2xl border border-dashed border-[var(--color-text-tertiary)]/10">
              <div className="text-center">
                <FileText className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
                <div className="text-[var(--color-text-secondary)]">Journal archive empty</div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <Link key={article.id} href={`/literary-journal/${article.slug}`} className="group">
                    <Card hoverable className="h-full bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/5 p-5">
                      <div className="relative mb-6 rounded-lg overflow-hidden aspect-[16/9] bg-black/20">
                        <img
                          src="/literary-journal-icon.png"
                          alt="Literary Journal"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                        />
                        <div className="absolute inset-0 bg-[var(--color-gold)]/5 group-hover:bg-transparent transition-colors"></div>
                      </div>

                      <div className="mb-3">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-gold)] px-2 py-0.5 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded">
                          {article.category}
                        </span>
                      </div>

                      <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-gold)] transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>

                      <p className="text-[var(--text-xs)] text-[var(--color-text-secondary)] mb-6 line-clamp-3 leading-relaxed">
                        {article.excerpt}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)] pt-4 border-t border-[var(--color-text-tertiary)]/10 uppercase tracking-widest font-bold">
                        <span>{article.author_name}</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{article.reading_time_minutes} MIN</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link href="/literary-journal">
                  <PrimaryButton variant="secondary" size="medium">
                    Browse Full Archive
                  </PrimaryButton>
                </Link>
              </div>
            </>
          )}
        </PageContainer>
      </Section>

      <Section background="midnight" spacing="normal">
        <PageContainer>
          <div className="max-w-6xl mx-auto">
            <div className="sm:text-center mb-16">
              <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
                Creative Ecosystem
              </div>
              <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                Verified Contributors
              </h2>
              <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl md:mx-auto leading-[var(--leading-relaxed)]">
                Join a community of vocalists, writers, and producers creating sacred content under institutional oversight.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Pen, label: 'Writers', mystical: 'Ahl-e-Qalam', href: '/writers' },
                { icon: Mic, label: 'Vocalists', mystical: 'Ahl-e-Sada', href: '/vocalists' },
                { icon: Disc3, label: 'Producers', mystical: 'Ahl-e-Naghma', href: '/producers' },
                { icon: Feather, label: 'Journalists', mystical: 'Ahl-e-Tahreer', href: '/literary-contributors' }
              ].map((role, i) => (
                <Link key={i} href={role.href} className="group">
                  <Card className="h-full bg-[var(--color-slate)]/20 border-[var(--color-text-tertiary)]/10 p-8 hover:border-[var(--color-gold)]/40 transition-all duration-500 text-center">
                    <div className="w-14 h-14 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-500">
                      <role.icon className="w-6 h-6 text-[var(--color-gold)]" />
                    </div>
                    <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-1 uppercase tracking-wide group-hover:text-[var(--color-gold)] transition-colors">
                      {role.label}
                    </h3>
                    <p className="text-[var(--text-xs)] text-[var(--color-gold)] font-bold uppercase tracking-[0.2em] mb-4 opacity-70">
                      {role.mystical}
                    </p>
                    <div className="text-[var(--text-xs)] text-[var(--color-gold)] font-bold flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      APPLY NOW <ArrowRight size={12} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </PageContainer>
      </Section>

      {!pubsLoading && recentReleases.length > 0 && (
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="text-center mb-16">
              <Badge variant="gold">Latest Submissions</Badge>
              <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mt-4">
                Recent Registry Entries
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentReleases.map((pub) => {
                const cardContent = (
                  <Card hoverable className="bg-[var(--color-midnight)]/40 border-[var(--color-text-tertiary)]/10 p-4">
                    {pub.type === 'music' && (pub.artwork_url || pub.youtube_video_id) ? (
                      <div className="aspect-video w-full overflow-hidden rounded-lg mb-6 bg-black border border-[var(--color-text-tertiary)]/10">
                        <img
                          src={pub.artwork_url || `https://i.ytimg.com/vi/${pub.youtube_video_id}/hqdefault.jpg`}
                          alt={pub.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-[var(--color-slate)]/30 mb-6 rounded-lg flex items-center justify-center border border-[var(--color-text-tertiary)]/10">
                        {pub.type === 'music' ? (
                          <Music className="w-12 h-12 text-[var(--color-text-tertiary)] opacity-30" />
                        ) : (
                          <BookOpen className="w-12 h-12 text-[var(--color-text-tertiary)] opacity-30" />
                        )}
                      </div>
                    )}

                    <div className="px-2">
                      <div className="mb-3">
                        <span className="text-[10px] text-[var(--color-gold)] uppercase tracking-widest font-bold border border-[var(--color-gold)]/20 px-2 py-0.5 rounded bg-[var(--color-gold)]/5">
                          {pub.type === 'music' ? 'Studio Release' : 'Literary'}
                        </span>
                      </div>

                      <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-4 group-hover:text-[var(--color-gold)] transition-colors line-clamp-1 leading-tight">
                        {pub.title}
                      </h3>

                      <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-[0.15em] font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-gold)]" />
                        <span>{formatDate(pub.published_at)}</span>
                      </div>
                    </div>
                  </Card>
                );

                return (
                  <Link
                    key={pub.id}
                    href={pub.type === 'music' ? `/release-detail/${pub.youtube_video_id}` : `/literary-journal/${pub.slug}`}
                    className="group block"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-16">
              <Link href="/releases">
                <PrimaryButton variant="secondary" size="large">
                  Browse All Releases
                </PrimaryButton>
              </Link>
            </div>
          </PageContainer>
        </Section>
      )}

    </Layout>
  );
}

