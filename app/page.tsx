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
import { KnowledgeSection } from './components/home/KnowledgeSection';

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
        // Institutional Filter: Exclude Shorts, vertical teasers, and content under 90s from homepage
        const isOfficialLongForm = (r: any) => {
          if (r.format === 'short') return false;
          const duration = r.durationSeconds || (r.youtubeStats?.durationSeconds) || 0;
          if (duration > 0 && duration < 90) return false;
          
          const title = (r.title || '').toLowerCase();
          if (title.includes('teaser') || title.includes('teaser 2')) return false;
          if (title.includes('youtube short') || title.includes('short-form')) return false;
          
          return true;
        };

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

        // Fetch a substantial pool to ensure high-quality filtering
        const res = await fetch('/api/releases?status=published&limit=100&t=' + Date.now());
        
        if (res.ok) {
          const json = await res.json();
          const data = Array.isArray(json) ? json : json.items || [];
          
          if (Array.isArray(data)) {
            // 1. Filter for institutional long-form content
            // 2. Sort strictly by date descending
            const allMusic = data
              .filter((r: any) => (r.youtubeId || r.youtube_video_id) && isOfficialLongForm(r));
            
            const sortedMusic = sortReleases(allMusic, 'newest').map(toPublication);

            if (sortedMusic.length > 0) {
              // Featured Carousel: Top 5 absolute newest releases
              setLatestPublications(sortedMusic.slice(0, 5));
              
              // Recent Entries Grid: Next 8 releases
              // We use an offset if possible, or just the same pool if small
              const recent = sortedMusic.length > 5 ? sortedMusic.slice(0, 8) : sortedMusic;
              setRecentReleases(recent);
              
              setPubsLoading(false);
              return;
            }
          }
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
      
      <KnowledgeSection />
      
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
