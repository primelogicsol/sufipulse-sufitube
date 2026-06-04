"use client"
import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { Card } from '../../components/primitives/Card';
import { BookOpen, Calendar, Clock, Tag, Search, ListFilter as Filter, Eye, TrendingUp, Sparkles, User, MapPin, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { literaryArticles, Article } from '../../data/literary-articles';

export default function LiteraryJournal() {
    const [allArticles, setAllArticles] = useState<Article[]>([]);
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

    // Load dynamic articles on mount
    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const res = await fetch('/api/public/articles');
                const data = res.ok ? await res.json() : [];
                
                const staticArticles = [...literaryArticles];
                const staticIds = new Set(staticArticles.map(a => a.id));
                const uniqueDynamic = (Array.isArray(data) ? data : []).filter((a: any) => !staticIds.has(a.id));
                const merged = [...staticArticles, ...uniqueDynamic];
                
                setAllArticles(merged);

                // Stats calculation
                const totalViews = merged.reduce((sum, article) => sum + (article.view_count || 0), 0);
                const uniqueCategories = new Set(merged.map(a => a.category)).size;
                setStats({
                    totalArticles: merged.length,
                    totalViews,
                    categories: uniqueCategories
                });
            } catch (err) {
                console.error('Failed to load dynamic articles:', err);
                setAllArticles(literaryArticles);
            }
        };

        fetchArticles();
    }, []);

    // Filter articles based on input state changes
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            let filtered = allArticles;

            if (selectedCategory !== 'all') {
                filtered = filtered.filter(a => a.category === selectedCategory);
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(a =>
                    a.title.toLowerCase().includes(q) ||
                    (a.excerpt && a.excerpt.toLowerCase().includes(q))
                );
            }

            const featured = filtered.filter(a => a.featured).slice(0, 3);
            const regular = filtered.filter(a => !a.featured);

            setFeaturedArticles(featured);
            setArticles(regular);
            setLoading(false);
        }, 300); // reduced delay for snappier experience
        return () => clearTimeout(timer);
    }, [allArticles, selectedCategory, searchQuery]);

    return (
        <Layout>
            <Section background="midnight" spacing="spacious">
                <PageContainer>
                    <div className="max-w-5xl mx-auto text-center">
                        <div className="mb-6">
                            <Badge variant="gold">Literary Division</Badge>
                        </div>
                        <h1 className="text-[var(--text-4xl)] md:text-[64px] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight">
                            Literary Journal
                        </h1>
                        <p className="text-[var(--text-xl)] text-[var(--color-gold)] font-medium mb-10 tracking-wide uppercase">
                            Ahl-e-Tahreer Archive
                        </p>
                        <p className="text-[var(--text-lg)] text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto">
                            A curated collection of reflective essays, spiritual commentary, and analytical discourse from Ahl-e-Tahreer contributors. All publications undergo editorial review to maintain institutional alignment and intellectual integrity.
                        </p>
                    </div>
                </PageContainer>
            </Section>

            <Section background="slate" spacing="normal" className="border-y border-white/5">
                <PageContainer>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: BookOpen, label: 'Published Articles', value: stats.totalArticles, color: 'gold' },
                            { icon: Eye, label: 'Total Readership', value: stats.totalViews.toLocaleString(), color: 'gold' },
                            { icon: Tag, label: 'Active Categories', value: stats.categories, color: 'gold' }
                        ].map((stat, i) => (
                            <Card key={i} className="bg-[var(--color-midnight)]/30 border-white/5 p-8 text-center group">
                                <stat.icon className="w-10 h-10 text-[var(--color-gold)] mx-auto mb-4 opacity-80 group-hover:scale-110 transition-transform" />
                                <div className="text-4xl font-bold text-[var(--color-text-primary)] mb-1">{stat.value}</div>
                                <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold">{stat.label}</div>
                            </Card>
                        ))}
                    </div>
                </PageContainer>
            </Section>

            <Section background="midnight" spacing="normal">
                <PageContainer>
                    {/* Search & Filter Toolbar */}
                    <div className="flex flex-col md:flex-row gap-6 mb-12">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
                            <input
                                type="text"
                                placeholder="Search articles, authors, or themes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[var(--color-slate)]/40 border border-white/10 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-gold)]/50 transition-all shadow-inner"
                            />
                        </div>
                        <div className="relative min-w-[220px]">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)] pointer-events-none" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-[var(--color-slate)]/40 border border-white/10 rounded-xl text-[var(--color-text-primary)] text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:border-[var(--color-gold)]/50 transition-all shadow-inner"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex flex-col bg-[var(--color-slate)]/20 border border-white/5 rounded-2xl overflow-hidden h-[420px] animate-pulse">
                                    <div className="h-1 w-full bg-white/5"></div>
                                    <div className="p-6 flex flex-col gap-4">
                                        <div className="h-4 w-24 bg-white/5 rounded"></div>
                                        <div className="h-8 w-full bg-white/5 rounded"></div>
                                        <div className="h-20 w-full bg-white/5 rounded"></div>
                                        <div className="mt-auto flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                            <div className="h-4 w-32 bg-white/5 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {featuredArticles.length > 0 && (
                                <div className="mb-20">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-[var(--color-gold)]/10 rounded-lg flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-[var(--color-gold)]" />
                                        </div>
                                        <h2 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)]">
                                            Featured Discourse
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {featuredArticles.map(article => (
                                            <ArticleCard key={article.id} article={article} featured />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {articles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 bg-[var(--color-slate)]/10 rounded-3xl border border-dashed border-white/10">
                                    <BookOpen className="w-16 h-16 text-[var(--color-text-tertiary)] mb-6 opacity-30" />
                                    <p className="text-[var(--color-text-secondary)] text-xl font-medium">No publications found in this category.</p>
                                    <button 
                                        onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                                        className="mt-6 text-[var(--color-gold)] hover:underline font-bold text-sm tracking-widest uppercase"
                                    >
                                        Clear Archive Filters
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)] mb-8 flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[var(--color-gold)] rounded-full"></div>
                                        Recent Publications
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {articles.map(article => (
                                            <ArticleCard key={article.id} article={article} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
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
      return (parts[0][0] + (parts[parts.length - 1]?.[0] || '')).toUpperCase();
    })();

    return (
        <Link
            href={`/literary-journal/${article.slug}`}
            className={`group flex flex-col bg-[var(--color-slate)]/30 border border-white/5 rounded-2xl overflow-hidden hover:border-[var(--color-gold)]/30 transition-all duration-500 shadow-xl h-full ${
                featured ? 'bg-gradient-to-b from-[var(--color-gold)]/5 to-[var(--color-slate)]/30' : ''
            }`}
        >
            <div className={`h-1 w-full ${featured ? 'bg-[var(--color-gold)]' : 'bg-white/5 group-hover:bg-[var(--color-gold)]/50'} transition-colors duration-500`} />

            <div className="flex flex-col flex-1 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-2.5 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 rounded text-[10px] font-bold text-[var(--color-gold)] uppercase tracking-[0.15em]">
                        {formatCategory(article.category)}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5 text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3 text-[var(--color-gold)]/60" />
                        {article.reading_time_minutes} MIN
                    </span>
                </div>

                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[var(--color-gold)] transition-colors line-clamp-2 leading-tight">
                    {article.title}
                </h3>

                {article.subtitle && (
                    <p className="text-sm text-[var(--color-gold)]/60 mb-4 line-clamp-1 italic font-light">
                        {article.subtitle}
                    </p>
                )}

                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed line-clamp-3 mb-8 font-light">
                    {article.excerpt}
                </p>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/20 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[var(--color-gold)]/40 transition-colors">
                            {authorExtras.author_photo ? (
                                <img src={authorExtras.author_photo} alt={article.author_name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-[var(--color-gold)]">{initials}</span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-sm)] font-bold text-[var(--color-text-primary)] truncate leading-tight">
                                {article.author_name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold mt-1">
                                {(authorExtras.author_city || authorExtras.author_country) ? (
                                    <>
                                        <MapPin className="w-3 h-3 opacity-50" />
                                        <span className="truncate">{[authorExtras.author_city, authorExtras.author_country].filter(Boolean).join(', ')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="w-3 h-3 opacity-50" />
                                        <span>{formatDate(article.published_at)}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[var(--color-gold)] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

