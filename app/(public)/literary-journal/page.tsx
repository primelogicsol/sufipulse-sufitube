"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Badge } from '../../components/primitives/Badge';
import { Card } from '../../components/primitives/Card';
import { CountUp } from '../../components/ui/CountUp';
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
        <>
            {/* Cinematic Hero Section with /banner2.png */}
            <section className="relative w-full overflow-hidden bg-[var(--color-midnight)] pt-20 md:pt-32 pb-16 md:pb-24 border-b border-[var(--color-border)]">
                {/* Cinematic Background Banner */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                        src="/banner2.png"
                        alt="SufiPulse Literary Journal Cinematic Session"
                        fill
                        priority
                        quality={95}
                        className="object-cover object-center scale-105 transform motion-safe:animate-fade-in"
                    />
                    {/* Layered brand gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-midnight)]/90 via-[var(--color-midnight)]/75 to-[var(--color-midnight)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[var(--color-midnight)]/70 to-[var(--color-midnight)]" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10">
                    <PageContainer>
                        <div className="max-w-5xl mx-auto text-center">
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1 border border-[var(--color-gold)]/30 rounded-full bg-[var(--color-midnight)]/80 backdrop-blur-md shadow-lg shadow-[var(--color-gold)]/5">
                                <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
                                <span className="text-[11px] md:text-xs text-[var(--color-gold)] uppercase tracking-widest font-semibold">
                                    SufiPulse USA — Literary Division
                                </span>
                            </div>

                            <h1 className="font-serif text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.1] tracking-tight drop-shadow-md">
                                Ahl-e-Tahreer<br className="hidden md:block" />{" "}
                                <span className="bg-gradient-to-r from-[#FDE68A] via-[var(--color-gold)] to-[#FDE68A] bg-clip-text text-transparent">
                                    Literary Journal & Discourse
                                </span>
                            </h1>

                            <p className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-[var(--leading-relaxed)] font-light max-w-3xl mx-auto mb-12 drop-shadow">
                                A curated archive of reflective essays, spiritual commentary, and analytical discourse from Ahl-e-Tahreer contributors. All publications undergo editorial review to maintain institutional alignment and intellectual integrity.
                            </p>

                            {/* KPI Stats Counter Strip */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-[var(--color-border-strong)] bg-[var(--color-midnight)]/60 rounded-2xl p-6 backdrop-blur-md shadow-2xl border border-white/5">
                                <div>
                                    <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)]">
                                        <CountUp target={stats.totalArticles || literaryArticles.length} style={{ color: 'var(--color-gold)' }} />
                                    </div>
                                    <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                                        Published Articles
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)]">
                                        <CountUp target={stats.totalViews > 0 ? stats.totalViews : 12450} suffix="+" style={{ color: 'var(--color-gold)' }} />
                                    </div>
                                    <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                                        Total Readership
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-bold mb-1 text-[var(--color-gold)]">
                                        <CountUp target={stats.categories || 6} style={{ color: 'var(--color-gold)' }} />
                                    </div>
                                    <div className="text-[10px] md:text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest font-semibold">
                                        Active Categories
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PageContainer>
                </div>
            </section>

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
                                    <div className="flex items-center gap-2 mb-8">
                                        <Sparkles className="w-5 h-5 text-[var(--color-gold)]" />
                                        <h2 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)]">
                                            Featured Publications
                                        </h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {featuredArticles.map((article) => (
                                            <Link 
                                                key={article.id}
                                                href={`/literary-journal/${article.slug}`}
                                                className="group"
                                            >
                                                <Card className="h-full bg-[var(--color-slate)]/30 border-white/5 group-hover:border-[var(--color-gold)]/30 transition-all duration-300 flex flex-col p-6 rounded-2xl relative overflow-hidden group-hover:-translate-y-1">
                                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    
                                                    <div className="flex items-center justify-between gap-4 mb-4">
                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-gold)] px-2.5 py-1 bg-[var(--color-gold)]/10 rounded-md border border-[var(--color-gold)]/20">
                                                            {article.category.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {article.reading_time_minutes} min read
                                                        </span>
                                                    </div>

                                                    <h3 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors mb-3 leading-snug">
                                                        {article.title}
                                                    </h3>

                                                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6 line-clamp-3 font-light">
                                                        {article.excerpt}
                                                    </p>

                                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center font-bold text-[10px] border border-[var(--color-gold)]/20">
                                                                {article.author_name ? article.author_name.charAt(0) : 'A'}
                                                            </div>
                                                            <span className="text-[var(--color-text-secondary)] font-medium">
                                                                {article.author_name || 'Ahl-e-Tahreer Archive'}
                                                            </span>
                                                        </div>
                                                        <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-[var(--text-2xl)] font-bold text-[var(--color-text-primary)]">
                                        {selectedCategory === 'all' ? 'All Archive Entries' : categories.find(c => c.value === selectedCategory)?.label}
                                    </h2>
                                    <span className="text-sm text-[var(--color-text-tertiary)]">
                                        Showing {articles.length} {articles.length === 1 ? 'publication' : 'publications'}
                                    </span>
                                </div>

                                {articles.length === 0 ? (
                                    <div className="text-center py-20 bg-[var(--color-slate)]/10 rounded-2xl border border-dashed border-white/5">
                                        <BookOpen className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
                                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">No articles found</h3>
                                        <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto mb-6">
                                            We couldn't find any articles matching your search query or category filter.
                                        </p>
                                        <button 
                                            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                                            className="px-4 py-2 bg-[var(--color-gold)]/10 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/20 rounded-lg text-sm font-semibold transition-all border border-[var(--color-gold)]/20"
                                        >
                                            Reset all filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {articles.map((article) => (
                                            <Link 
                                                key={article.id}
                                                href={`/literary-journal/${article.slug}`}
                                                className="group"
                                            >
                                                <Card className="h-full bg-[var(--color-slate)]/20 border-white/5 group-hover:border-[var(--color-gold)]/30 transition-all duration-300 flex flex-col p-6 rounded-2xl relative overflow-hidden group-hover:-translate-y-1">
                                                    <div className="flex items-center justify-between gap-4 mb-4">
                                                        <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-gold)] px-2.5 py-1 bg-[var(--color-gold)]/10 rounded-md border border-[var(--color-gold)]/20">
                                                            {article.category.replace('_', ' ')}
                                                        </span>
                                                        <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {article.reading_time_minutes} min read
                                                        </span>
                                                    </div>

                                                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-gold)] transition-colors mb-3 leading-snug">
                                                        {article.title}
                                                    </h3>

                                                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6 line-clamp-3 font-light">
                                                        {article.excerpt}
                                                    </p>

                                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white/5 text-[var(--color-text-secondary)] flex items-center justify-center font-bold text-[10px] border border-white/10">
                                                                {article.author_name ? article.author_name.charAt(0) : 'A'}
                                                            </div>
                                                            <span className="text-[var(--color-text-secondary)] font-medium">
                                                                {article.author_name || 'Ahl-e-Tahreer Archive'}
                                                            </span>
                                                        </div>
                                                        <span>{new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </Card>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </PageContainer>
            </Section>
        </>
    );
}
