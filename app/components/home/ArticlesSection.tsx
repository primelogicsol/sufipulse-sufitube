"use client";
import Link from 'next/link';
import { FileText, Clock } from 'lucide-react';
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';
import { Card } from '../primitives/Card';
import { PrimaryButton } from '../primitives/PrimaryButton';

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

interface ArticlesSectionProps {
  featuredArticles: FeaturedArticle[];
  loading: boolean;
}

export function ArticlesSection({ featuredArticles, loading }: ArticlesSectionProps) {
  return (
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

        {loading ? (
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
  );
}
