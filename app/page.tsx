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
        const toPublication = (r: any): Publication => ({
          id: r.id,
          type: 'music' as const,
          title: r.title,
          slug: r.youtubeId,
          published_at: getBestReleaseDate(r),
          description: r.description,
          artwork_url: r.thumbnailUrl,
          youtube_video_id: r.youtubeId,
        });

        const [rankedRes, recentRes] = await Promise.all([
          fetch('/api/releases?status=published&sort=ranked&limit=8'),
          fetch('/api/releases?status=published&limit=100'), // Fetch more to ensure correct sorting before slicing
        ]);

        let rankedMusic: Publication[] = [];
        if (rankedRes.ok) {
          const data: any[] = await rankedRes.json();
          if (Array.isArray(data)) rankedMusic = data.filter((r: any) => r.youtubeId).map(toPublication);
        }

        let recentMusic: Publication[] = [];
        if (recentRes.ok) {
          const data: any[] = await recentRes.json();
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
      <Section background="midnight" spacing="spacious">
        <PageContainer>
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 border border-[var(--color-gold)]/30 rounded-full text-[var(--text-sm)] text-[var(--color-gold)] uppercase tracking-wider font-medium">
                Welcome
              </span>
            </div>

            <h1 className="text-[var(--text-4xl)] md:text-[64px] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
              The House of Sacred<br />Word, Voice and Stewardship
            </h1>

            <p className="text-[var(--text-xl)] text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-10 leading-[var(--leading-relaxed)] font-light">
              SufiPulse Studio USA, managed by Dr. Kumar Foundation USA, is a disciplined institution dedicated to the authorship, performance, production, review, and entrusted release of sacred expression through structured governance and transparent stewardship.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/releases">
                <Image
                  src="/sufitube-logo-v5.png"
                  alt="Sufitube Logo"
                  width={200}
                  height={200}
                />
              </Link>
              <Link href="/governance">
                <PrimaryButton variant="outline" size="large">
                  Governance Framework
                </PrimaryButton>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-[var(--color-text-tertiary)]/20">
              <div>
                <div className="text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={kpiStats.releases} suffix="+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] uppercase tracking-wide">Releases</div>
              </div>
              <div>
                <div className="text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={kpiStats.writers} suffix="+" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] uppercase tracking-wide">Active Writers</div>
              </div>
              <div>
                <div className="text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={100} suffix="%" style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] uppercase tracking-wide">Transparency</div>
              </div>
              <div>
                <div className="text-[var(--text-3xl)] font-bold mb-1">
                  <CountUp target={kpiStats.institutions} style={{ color: 'var(--color-gold)' }} />
                </div>
                <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] uppercase tracking-wide">Institutions</div>
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
              <h2 className="text-[var(--text-3xl)] md:text-[48px] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                Governed Structure for Sacred Content
              </h2>
              <p className="inline text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl leading-[var(--leading-relaxed)]">
                SufiPulse operates under a comprehensive governance system with formal oversight mechanisms, transparent economic protocols, and institutional accountability standards.
              </p>
              {/* <div className="w-full">
              </div> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-[var(--color-text-tertiary)]/20 bg-[var(--color-midnight)]/30 p-8 rounded-lg">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Multi-Stakeholder Governance
                </h3>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-4">
                  Decision-making authority distributed across Diwan-e-Amanat, Majlis-e-Nazr, and specialized oversight committees with documented accountability trails.
                </p>
                <Link href="/governance" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-medium">
                  View Framework →
                </Link>
              </div>

              <div className="border border-[var(--color-text-tertiary)]/20 bg-[var(--color-midnight)]/30 p-8 rounded-lg">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Transparent Revenue Systems
                </h3>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-4">
                  All revenue streams tracked in real-time. Royalty agreements locked before production. Contributors receive quarterly statements with full audit trails.
                </p>
                <Link href="/governance/royalty-transparency" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-medium">
                  View Transparency Reports →
                </Link>
              </div>

              <div className="border border-[var(--color-text-tertiary)]/20 bg-[var(--color-midnight)]/30 p-8 rounded-lg">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <Music className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Content Integrity Standards
                </h3>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-4">
                  Every submission reviewed against established criteria. Release protocols ensure alignment with Sufi tradition and institutional quality benchmarks.
                </p>
                <Link href="/governance/release-protocol" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-medium">
                  View Protocol →
                </Link>
              </div>

              <div className="border border-[var(--color-text-tertiary)]/20 bg-[var(--color-midnight)]/30 p-8 rounded-lg">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-3">
                  Contributor Rights Protection
                </h3>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-4">
                  Writers, vocalists, and producers retain intellectual property rights. Formal agreements govern all collaborations with institutional mediation available.
                </p>
                <Link href="/contributor-policy" className="text-[var(--text-sm)] text-[var(--color-gold)] hover:underline font-medium">
                  View Policy →
                </Link>
              </div>
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
              <h2 className="text-[var(--text-3xl)] md:text-[48px] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                Two Channels of Sacred Transmission
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="border-l-2 border-[var(--color-gold)] pl-8">
                <div className="mb-6">
                  <Headphones className="w-10 h-10 text-[var(--color-gold)] mb-4" />
                  <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-2">
                    Musical Registry
                  </h3>
                  <div className="text-[var(--text-sm)] text-[var(--color-gold)] uppercase tracking-wider mb-4">
                    Studio Production Division
                  </div>
                </div>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Vocal performances, instrumental arrangements, and audio engineering governed by production oversight protocols. All releases pass through multi-stage approval before public distribution.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Writer-vocalist-producer coordination system</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Pre-production royalty agreement locking</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Studio session documentation and archiving</span>
                  </div>
                </div>
                <Link href="/releases">
                  <PrimaryButton variant="secondary" size="medium">
                    View Musical Registry
                  </PrimaryButton>
                </Link>
              </div>

              <div className="border-l-2 border-[var(--color-gold)] pl-8">
                <div className="mb-6">
                  <FileText className="w-10 h-10 text-[var(--color-gold)] mb-4" />
                  <h3 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-2">
                    Literary Division
                  </h3>
                  <div className="text-[var(--text-sm)] text-[var(--color-gold)] uppercase tracking-wider mb-4">
                    Editorial & Publishing Council
                  </div>
                </div>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Essays, scholarly reflections, and written kalam published under editorial oversight. Peer-reviewed content ensuring intellectual rigor and spiritual alignment.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Contributor credential verification system</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Multi-stage editorial review process</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[var(--color-gold)] rounded-full mt-2"></div>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">Intellectual property protection protocols</span>
                  </div>
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
              <h2 className="text-[var(--text-3xl)] md:text-[48px] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                Production Pipeline: Submission to Distribution
              </h2>
              <p className="inline text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl leading-[var(--leading-relaxed)]">
                A standardized, multi-stage approval process governs all content from initial submission through public release.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[var(--color-gold)] rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-[28px] font-bold text-[var(--color-midnight)]">01</span>
                  </div>
                  <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
                    Submission & Review
                  </h3>
                </div>
                <div className="border-l-2 border-[var(--color-text-tertiary)]/30 pl-6 ml-8 pb-6">
                  <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-4">
                    Writers submit kalam through formal application system. Content undergoes committee review for alignment with institutional standards and Sufi tradition.
                  </p>
                  <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    <strong className="text-[var(--color-text-primary)]">Review Period:</strong> 14-21 days
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[var(--color-gold)] rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-[28px] font-bold text-[var(--color-midnight)]">02</span>
                  </div>
                  <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
                    Assignment & Production
                  </h3>
                </div>
                <div className="border-l-2 border-[var(--color-text-tertiary)]/30 pl-6 ml-8 pb-6">
                  <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-4">
                    Approved content assigned to vocalists and producers. Royalty agreements finalized and locked. Studio sessions scheduled under oversight protocols.
                  </p>
                  <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    <strong className="text-[var(--color-text-primary)]">Production Phase:</strong> 4-8 weeks
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-[var(--color-gold)] rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-[28px] font-bold text-[var(--color-midnight)]">03</span>
                  </div>
                  <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)]">
                    Release & Revenue
                  </h3>
                </div>
                <div className="border-l-2 border-[var(--color-text-tertiary)]/30 pl-6 ml-8 pb-6">
                  <p className="text-[var(--text-base)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-4">
                    Final approval from governance body. Public distribution across platforms. Revenue tracking initiated with transparent reporting to all contributors.
                  </p>
                  <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                    <strong className="text-[var(--color-text-primary)]">Reporting:</strong> Quarterly statements
                  </div>
                </div>
              </div>
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
            <h2 className="text-[var(--text-3xl)] md:text-[48px] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Registry Highlights
            </h2>
            <p className="inline text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-2xl leading-[var(--leading-relaxed)]">
              Curated selections from the institutional registry of approved and distributed works.
            </p>
          </div>

          {pubsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--color-text-secondary)]">Loading featured releases...</div>
            </div>
          ) : featuredReleases.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Music className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <div className="text-[var(--color-text-secondary)]">No featured releases available yet</div>
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
                        <div className="relative w-full overflow-hidden rounded-lg shadow-2xl" style={{ aspectRatio: '16/9' }}>
                          <img
                            src={activeThumbnailCandidates[0]}
                            alt={featuredReleases[currentSlide]?.title}
                            className="w-full h-full object-cover bg-black group-hover:scale-[1.02] transition-transform duration-[var(--transition-base)]"
                            loading="lazy"
                            data-thumb-index="0"
                            onError={(e) => {
                              advanceThumbnailFallback(e.currentTarget, activeThumbnailCandidates);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--transition-base)] flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-[var(--color-gold)] flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-[var(--transition-base)]">
                              <Play className="w-12 h-12 text-[var(--color-midnight)] ml-1.5" fill="currentColor" />
                            </div>
                          </div>

                          <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 rounded-md text-[var(--text-sm)] text-white/90">
                            {currentSlide + 1} / {featuredReleases.length}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-gradient-to-br from-[var(--color-midnight)] to-[var(--color-slate)] rounded-lg flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                          <Music className="w-16 h-16 text-[var(--color-text-tertiary)]" />
                        </div>
                      )}
                    </div>
                  </Link>
                )}

                {featuredReleases.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        prevSlide();
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 bg-[var(--color-slate)] hover:bg-[var(--color-gold)] border border-[var(--color-border)] hover:border-[var(--color-gold)] rounded-full flex items-center justify-center transition-all duration-300 group z-10"
                      aria-label="Previous release"
                    >
                      <ChevronLeft className="w-6 h-6 text-[var(--color-text-primary)] group-hover:text-[var(--color-midnight)]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        nextSlide();
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 bg-[var(--color-slate)] hover:bg-[var(--color-gold)] border border-[var(--color-border)] hover:border-[var(--color-gold)] rounded-full flex items-center justify-center transition-all duration-300 group z-10"
                      aria-label="Next release"
                    >
                      <ChevronRight className="w-6 h-6 text-[var(--color-text-primary)] group-hover:text-[var(--color-midnight)]" />
                    </button>
                  </>
                )}
              </div>

              <div className="text-center mt-12">
                {lastReleaseSync && (
                  <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] mb-3">
                    Auto-synced: {formatDate(lastReleaseSync)}
                  </div>
                )}
                <Link href="/releases">
                  <PrimaryButton variant="secondary" size="large">
                    View Full Registry
                  </PrimaryButton>
                </Link>
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
            <h2 className="text-[var(--text-3xl)] md:text-[48px] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
              Ahl-e-Tahreer Archive
            </h2>
            <p className="inline text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-2xl leading-[var(--leading-relaxed)]">
              Essays, scholarly reflections, and written kalam from verified contributors under editorial oversight.
            </p>
          </div>

          {articlesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--color-text-secondary)]">Loading featured articles...</div>
            </div>
          ) : featuredArticles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4" />
                <div className="text-[var(--color-text-secondary)]">No featured articles available yet</div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/literary-journal/${article.slug}`}
                    className="group"
                  >
                    <Card hoverable>
                      <div className="relative">
                        <div className="aspect-[4/3] w-full mb-4 rounded overflow-hidden border border-[var(--color-text-tertiary)]/20 bg-gradient-to-br from-[var(--color-midnight)] to-[var(--color-slate)] flex items-center justify-center group-hover:border-[var(--color-gold)]/40 transition-colors">
                          <img
                            src="/literary-journal-icon.png"
                            alt="Literary Journal"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider border border-neutral-700 px-2 py-0.5 text-neutral-400">
                            {article.category}
                          </span>
                        </div>

                        <h3 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-gold)] transition-colors line-clamp-2">
                          {article.title}
                        </h3>

                        {article.excerpt && (
                          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-3 line-clamp-2 leading-[var(--leading-relaxed)]">
                            {article.excerpt}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--color-text-tertiary)] pt-3 border-t border-[var(--color-text-tertiary)]/20">
                          <span>{article.author_name}</span>
                          {article.reading_time_minutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{article.reading_time_minutes} min read</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link href="/literary-journal">
                  <PrimaryButton variant="secondary" size="large">
                    View Full Archive
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
            <div className="sm:text-center">
              <div className="mb-12">
                <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
                  Creative Ecosystem
                </div>
                <h2 className="text-[var(--text-3xl)] md:text-[48px] font-bold text-[var(--color-text-primary)] mb-4 leading-[1.2]">
                  Creative Contributors
                </h2>
                <p className="inline text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl leading-[var(--leading-relaxed)]">
                  Join a community of verified writers, vocalists, producers, and literary contributors creating sacred content under institutional oversight.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[var(--color-slate)] p-6 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 transition-colors group">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <Pen className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-2">
                  Writers
                </h3>
                <p className="text-[var(--text-sm)] text-[var(--color-gold)] mb-4 font-medium">
                  Ahl-e-Qalam
                </p>
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Submit original kalam for review and production assignment.
                </p>
                <Link
                  href="/writers#apply"
                  className="inline-flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-semibold transition-colors group-hover:gap-3 duration-300"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-[var(--color-slate)] p-6 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 transition-colors group">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-2">
                  Vocalists
                </h3>
                <p className="text-[var(--text-sm)] text-[var(--color-gold)] mb-4 font-medium">
                  Ahl-e-Sada
                </p>
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Perform sacred poetry with formal credit and royalty agreements.
                </p>
                <Link
                  href="/vocalists#apply"
                  className="inline-flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-semibold transition-colors group-hover:gap-3 duration-300"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-[var(--color-slate)] p-6 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 transition-colors group">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <Disc3 className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-2">
                  Producers
                </h3>
                <p className="text-[var(--text-sm)] text-[var(--color-gold)] mb-4 font-medium">
                  Ahl-e-Naghma
                </p>
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Create instrumental arrangements with transparent compensation.
                </p>
                <Link
                  href="/producers#apply"
                  className="inline-flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-semibold transition-colors group-hover:gap-3 duration-300"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-[var(--color-slate)] p-6 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-gold)]/50 transition-colors group">
                <div className="w-12 h-12 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded flex items-center justify-center mb-4">
                  <Feather className="w-6 h-6 text-[var(--color-gold)]" />
                </div>
                <h3 className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-2">
                  Literary Contributors
                </h3>
                <p className="text-[var(--text-sm)] text-[var(--color-gold)] mb-4 font-medium">
                  Ahl-e-Tahreer
                </p>
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] mb-6">
                  Publish essays and scholarly reflections under editorial review.
                </p>
                <Link
                  href="/literary-contributors#apply"
                  className="inline-flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 font-semibold transition-colors group-hover:gap-3 duration-300"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      {!pubsLoading && recentReleases.length > 0 && (
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="text-center mb-12">
              <Badge variant="gold">Latest Releases</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentReleases.map((pub) => {
                const cardContent = (
                  <Card hoverable>
                    {pub.type === 'music' && (pub.artwork_url || pub.youtube_video_id) ? (
                      // <div className="aspect-square w-full overflow-hidden rounded mb-4">
                      //   <img
                      //     src={pub.artwork_url || `https://i.ytimg.com/vi/${pub.youtube_video_id}/hqdefault.jpg`}
                      //     alt={pub.title}
                      //     className="w-full h-[90%] object-cover"
                      //     loading="lazy"
                      //   />
                      // </div>
                      <div
                        className="w-full h-full p-36 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${pub.artwork_url || `https://i.ytimg.com/vi/${pub.youtube_video_id}/hqdefault.jpg`
                            })`,
                        }}
                      />
                    ) : (
                      <div className="aspect-square w-full bg-gradient-to-br from-[var(--color-midnight)] to-[var(--color-slate)] mb-4 rounded flex items-center justify-center">
                        {pub.type === 'music' ? (
                          <Music className="w-12 h-12 text-[var(--color-text-tertiary)]" />
                        ) : (
                          <BookOpen className="w-12 h-12 text-[var(--color-text-tertiary)]" />
                        )}
                      </div>
                    )}

                    <div className="my-2">
                      <span className="text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-wider">
                        {pub.type === 'music' ? 'Studio Release' : 'Literary'}
                      </span>
                    </div>

                    <h3 className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-gold)] transition-colors line-clamp-2">
                      {pub.title}
                    </h3>

                    {(pub.description || pub.excerpt) && (
                      <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-3 line-clamp-2">
                        {pub.description || pub.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(pub.published_at)}</span>
                    </div>
                  </Card>
                );

                if (pub.type === 'music') {
                  return (
                    <Link
                      key={pub.id}
                      href={`/release-detail/${pub.youtube_video_id}`}
                      className="group block"
                    >
                      {cardContent}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={pub.id}
                    href={`/literary-journal/${pub.slug}`}
                    className="group block"
                  >
                    {cardContent}
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-8">
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
