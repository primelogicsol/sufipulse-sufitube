"use client"
import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { BookOpen, Calendar, Clock, Tag, Search, ListFilter as Filter, Eye, TrendingUp, Sparkles, User, MapPin, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { literaryArticles, Article } from '../../data/literary-articles';

// Merge localStorage approved articles with static data
function getAllArticles(): Article[] {
    const staticArticles = [...literaryArticles];
    if (typeof window === 'undefined') return staticArticles;
    try {
        const raw = localStorage.getItem('sufipulse_articles');
        const all: any[] = raw ? JSON.parse(raw) : [];
        const published = all.filter((a: any) => a.status === 'approved' || a.status === 'published');
        const dynamic: Article[] = published.map((a: any) => ({
            id: a.id,
            title: a.title || 'Untitled',
            subtitle: a.abstract ? a.abstract.slice(0, 120) : null,
            slug: a.slug || `article-${a.id}`,
            category: a.article_type || 'reflective_essay',
            content: a.content || '',
            excerpt: a.excerpt || (a.content || '').replace(/<[^>]*>/g, '').slice(0, 200) + '...',
            reading_time_minutes: Math.max(1, Math.ceil(((a.content || '').replace(/<[^>]*>/g, '').split(' ').length) / 200)),
            featured: false,
            published_at: a.updated_at || a.created_at || new Date().toISOString(),
            tags: a.author_domain ? a.author_domain.split(',').map((t: string) => t.trim()) : [],
            view_count: 0,
            author_id: a.user_id || '',
            author_name: a.author_name || a.author_full_name || 'Ahl-e-Tahreer',
            author_professional_name: a.author_professional_name || '',
            author_country: a.author_country || '',
            author_city: a.author_city || '',
            author_domain: a.author_domain || '',
            author_photo: a.author_photo || '',
        }));
        // Avoid duplicate IDs
        const staticIds = new Set(staticArticles.map(a => a.id));
        const uniqueDynamic = dynamic.filter(a => !staticIds.has(a.id));
        return [...staticArticles, ...uniqueDynamic];
    } catch {
        return staticArticles;
    }
}

export default function LiteraryJournal() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({ totalArticles: 0, totalViews: 0, categories: 0 });

    const categories = [
        { value: 'all', label: 'All Articles' },
        { value: 'reflective_essay', label: 'Reflective Essays' },
        { value: 'spiritual_commentary', label: 'Spiritual Commentary' },
        { value: 'sufi_philosophy', label: 'Sufi Philosophy' },
        { value: 'contemporary_discourse', label: 'Contemporary Discourse' },
        { value: 'thematic_analysis', label: 'Thematic Analysis' },
        { value: 'institutional_guidance', label: 'Institutional Guidance' },
    ];

    useEffect(() => {
        setLoading(true);
        const allArticles = getAllArticles();
        let filtered = allArticles;

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(a => a.category === selectedCategory);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(q) ||
                a.excerpt.toLowerCase().includes(q)
            );
        }

        const featured = filtered.filter(a => a.featured).slice(0, 3);
        const regular = filtered.filter(a => !a.featured);

        setFeaturedArticles(featured);
        setArticles(regular);
        setLoading(false);
    }, [selectedCategory, searchQuery]);

    useEffect(() => {
        const allArticles = getAllArticles();
        const totalViews = allArticles.reduce((sum, article) => sum + (article.view_count || 0), 0);
        const uniqueCategories = new Set(allArticles.map(a => a.category)).size;
        setStats({
            totalArticles: allArticles.length,
            totalViews,
            categories: uniqueCategories
        });
    }, []);

    const formatCategory = (category: string) => {
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Layout>
            <Section className="pt-24 pb-12 ">
                <PageContainer>
                    <div className="max-w-5xl mx-auto text-center">
                        <div className="mb-6">
                            <span className="inline-block px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-full text-sm text-amber-400 uppercase tracking-wider font-medium">
                                Literary Division
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
                            Literary Journal
                        </h1>
                        <p className="text-2xl md:text-3xl text-amber-400/90 mb-8 font-light">
                            Ahl-e-Tahreer Archive
                        </p>

                        <div className="max-w-3xl mx-auto">
                            <p className="text-lg text-neutral-300 leading-relaxed">
                                A curated collection of reflective essays, spiritual commentary, and analytical discourse from Ahl-e-Tahreer contributors. All publications undergo editorial review to maintain institutional alignment and intellectual integrity.
                            </p>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-12 border-t border-neutral-800 bg-neutral-900/50">
                <PageContainer>
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-gradient-to-br from-amber-400/10 to-amber-400/5 border border-amber-400/20 rounded-xl p-8 group hover:border-amber-400/40 hover:shadow-xl hover:shadow-amber-400/5 transition-all hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                <BookOpen className="w-10 h-10 text-amber-400" />
                                <Sparkles className="w-6 h-6 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{stats.totalArticles}</div>
                            <div className="text-sm text-neutral-400 uppercase tracking-wider">Published Articles</div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 border border-emerald-400/20 rounded-xl p-8 group hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-400/5 transition-all hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                <Eye className="w-10 h-10 text-emerald-400" />
                                <TrendingUp className="w-6 h-6 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{stats.totalViews.toLocaleString()}</div>
                            <div className="text-sm text-neutral-400 uppercase tracking-wider">Total Readership</div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-400/10 to-blue-400/5 border border-blue-400/20 rounded-xl p-8 group hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-400/5 transition-all hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                <Tag className="w-10 h-10 text-blue-400" />
                                <Filter className="w-6 h-6 text-blue-400/60 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <div className="text-4xl font-bold text-white mb-2">{stats.categories}</div>
                            <div className="text-sm text-neutral-400 uppercase tracking-wider">Active Categories</div>
                        </div>
                    </div>
                </PageContainer>
            </Section>

            <Section className="py-8">
                <PageContainer>
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-10 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400/50 appearance-none cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {featuredArticles.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-amber-400/10 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-amber-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">
                                    Featured Articles
                                </h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {featuredArticles.map(article => (
                                    <ArticleCard key={article.id} article={article} featured />
                                ))}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
                            <p className="text-neutral-400">No articles found</p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">
                                Recent Publications
                            </h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {articles.map(article => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        </div>
                    )}
                </PageContainer>
            </Section>
        </Layout>
    );
}

interface ArticleCardProps {
    article: Article;
    featured?: boolean;
}

function ArticleCard({ article, featured }: ArticleCardProps) {
    const formatCategory = (category: string) => {
        return category
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const authorExtras = article as any;
    const initials = (() => {
      const name = article.author_name || 'A';
      if (name === 'Ahl-e-Tahreer Archive') return '✦';
      const parts = name.split(' ').filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    })();

    return (
        <Link
            href={`/literary-journal/${article.slug}`}
            className={`group flex flex-col bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden hover:border-amber-400/40 hover:shadow-xl hover:shadow-amber-400/5 transition-all duration-300 hover:-translate-y-1 ${
                featured ? 'ring-1 ring-amber-400/25 bg-gradient-to-b from-amber-400/5 to-neutral-900/40' : ''
            }`}
        >
            {/* Top accent bar */}
            <div className={`h-1 w-full transition-all duration-300 ${
                featured
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600/70'
                    : 'bg-neutral-800 group-hover:bg-gradient-to-r group-hover:from-amber-400/50 group-hover:to-amber-600/30'
            }`} />

            <div className="flex flex-col flex-1 p-6">
                {/* Badges row */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {featured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-400/20 border border-amber-400/40 rounded-full text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            Featured
                        </span>
                    )}
                    <span className="px-2.5 py-1 bg-neutral-800/80 border border-neutral-700/60 rounded-md text-neutral-400 text-[11px] font-medium uppercase tracking-wider">
                        {formatCategory(article.category)}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-neutral-600">
                        <Clock className="w-3 h-3" />
                        {article.reading_time_minutes} min
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                    {article.title}
                </h3>

                {/* Subtitle */}
                {article.subtitle && (
                    <p className="text-sm text-amber-400/60 mb-3 line-clamp-1 italic">
                        {article.subtitle}
                    </p>
                )}

                {/* Excerpt */}
                <p className="text-neutral-400 text-sm leading-relaxed line-clamp-3 flex-grow mb-4">
                    {article.excerpt}
                </p>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 bg-neutral-800/80 border border-neutral-700/40 text-neutral-500 text-[11px] rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Author footer */}
                <div className="border-t border-neutral-800/60 pt-4 mt-auto">
                    <div className="flex items-center gap-3">
                        {/* Author photo or initials */}
                        <div className="w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/25 flex items-center justify-center overflow-hidden shrink-0">
                            {authorExtras.author_photo ? (
                                <img src={authorExtras.author_photo} alt={article.author_name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-amber-400">{initials}</span>
                            )}
                        </div>

                        {/* Author name + location */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-neutral-200 truncate leading-tight">
                                {article.author_name || 'Ahl-e-Tahreer'}
                            </p>
                            <div className="flex items-center gap-1 text-neutral-500 text-[11px] mt-0.5">
                                {(authorExtras.author_city || authorExtras.author_country) ? (
                                    <>
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{[authorExtras.author_city, authorExtras.author_country].filter(Boolean).join(', ')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-3 h-3 shrink-0" />
                                        <span>{formatDate(article.published_at)}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Date (if location shown) */}
                        {(authorExtras.author_city || authorExtras.author_country) && (
                            <p className="text-[11px] text-neutral-600 shrink-0">{formatDate(article.published_at)}</p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
