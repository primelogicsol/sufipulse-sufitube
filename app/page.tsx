"use client";
import { Layout } from './components/layout/Layout';
import { useState, useEffect } from 'react';
import { literaryArticles } from './data/literary-articles';
import { getBestReleaseDate, sortReleases } from '@/lib/release-utils';

// Home components
import { HeroSection } from './components/home/HeroSection';
import { GovernanceSection } from './components/home/GovernanceSection';
import { ArchitectureSection } from './components/home/ArchitectureSection';
import { PipelineSection } from './components/home/PipelineSection';
import { RegistrySection } from './components/home/RegistrySection';
import { ArticlesSection } from './components/home/ArticlesSection';
import { NetworkSection } from './components/home/NetworkSection';

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
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [latestPublications, setLatestPublications] = useState<Publication[]>([]);
  const [recentReleases, setRecentReleases] = useState<Publication[]>([]);
  const [pubsLoading, setPubsLoading] = useState(true);
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

  useEffect(() => {
    // Featured articles
    const featured = literaryArticles.filter(a => a.featured).slice(0, 3).map(a => ({
      ...a,
      author_name: a.author_name || 'Ahl-e-Tahreer Archive'
    }));
    setFeaturedArticles(featured as any);
    setArticlesLoading(false);

    // Latest publications
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
          fetch('/api/releases?status=published&limit=100'),
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
            recentMusic = data.filter((r: any) => r.youtube_video_id || r.youtubeId).map(toPublication);
          }
        }

        const sortedRecent = sortReleases(recentMusic, 'all').slice(0, 8);

        if (rankedMusic.length > 0 || sortedRecent.length > 0) {
          setLatestPublications(rankedMusic.length > 0 ? rankedMusic : sortedRecent);
          setRecentReleases(sortedRecent);
          setPubsLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching latest music releases:', err);
      } finally {
        setPubsLoading(false);
      }
    };

    fetchLatestPublications();

    const refreshTimer = setInterval(fetchLatestPublications, 15 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  return (
    <Layout>
      <HeroSection kpiStats={kpiStats} />
      
      <GovernanceSection />
      
      <ArchitectureSection />
      
      <PipelineSection />
      
      <RegistrySection 
        featuredReleases={featuredReleases} 
        recentReleases={recentReleases} 
        loading={pubsLoading} 
      />
      
      <ArticlesSection 
        featuredArticles={featuredArticles} 
        loading={articlesLoading} 
      />
      
      <NetworkSection />
    </Layout>
  );
}
