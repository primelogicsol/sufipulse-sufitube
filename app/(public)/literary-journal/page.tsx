"use client"
import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { BookOpen, Calendar, Clock, Tag, Search, ListFilter as Filter, Eye, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { literaryArticles, Article } from '../../data/literary-articles';

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
        let filtered = literaryArticles;

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
        const totalViews = literaryArticles.reduce((sum, article) => sum + (article.view_count || 0), 0);
        const uniqueCategories = new Set(literaryArticles.map(a => a.category)).size;
        setStats({
            totalArticles: literaryArticles.length,
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400/50"
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-lg text-white focus:outline-none focus:border-amber-400/50 appearance-none cursor-pointer"
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
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Link
            href={`/literary-journal/${article.slug}`}
            className={`group block bg-gradient-to-b from-neutral-900/40 to-neutral-900/20 border border-neutral-800 rounded-xl p-6 hover:border-amber-400/40 hover:bg-neutral-900/60 transition-all hover:shadow-xl hover:shadow-amber-400/10 hover:-translate-y-2 ${featured ? 'ring-2 ring-amber-400/20 bg-gradient-to-br from-amber-400/5 to-transparent' : ''
                }`}
        >
            <div className="relative flex flex-col h-full">
                {featured && (
                    <div className="mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400/20 to-amber-400/10 border border-amber-400/40 rounded-full text-amber-400 text-xs font-semibold uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            Featured
                        </span>
                    </div>
                )}

                <div className="flex items-start gap-2 mb-4">
                    <div className="px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-md text-amber-400 text-xs font-semibold uppercase tracking-wider">
                        {formatCategory(article.category)}
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
                    {article.title}
                </h3>

                {article.subtitle && (
                    <p className="text-sm text-amber-400/70 mb-3 line-clamp-1 font-medium">
                        {article.subtitle}
                    </p>
                )}

                <p className="text-neutral-300 text-sm leading-relaxed mb-5 line-clamp-3 flex-grow">
                    {article.excerpt}
                </p>

                <div className="flex items-center justify-between text-xs text-neutral-400 pt-4 border-t border-neutral-800/50">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(article.published_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {article.reading_time_minutes} min
                        </span>
                    </div>
                </div>

                <div className="mt-3 text-xs text-neutral-500">
                    By {article.author_name}
                </div>

                {article.tags && article.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.slice(0, 3).map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-1 bg-neutral-800/50 border border-neutral-700/50 text-neutral-400 text-xs rounded"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
