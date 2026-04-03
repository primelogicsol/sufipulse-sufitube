"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Layout } from '../../../components/layout/Layout';
import { Calendar, Clock, Tag, ArrowLeft, Eye, BookOpen, Share2, MapPin, Briefcase, ChevronRight } from 'lucide-react';
import { literaryArticles, Article } from '../../../data/literary-articles';

// -- Reading progress bar --
function ReadingProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setPct(total > 0 ? (scrolled / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 'var(--z-header)' as any, background: 'var(--color-border)' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-hover))', transition: 'width 80ms linear' }} />
    </div>
  );
}

// -- Find article: static data first, then localStorage --
function findArticle(slug: string): Article | null {
  const staticMatch = literaryArticles.find(a => a.slug === slug);
  if (staticMatch) return staticMatch;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('sufipulse_articles');
    const all: any[] = raw ? JSON.parse(raw) : [];
    const found = all.find((a: any) => (a.slug === slug) && (a.status === 'approved' || a.status === 'published'));
    if (!found) return null;
    return {
      id: found.id,
      title: found.title || 'Untitled',
      subtitle: found.abstract ? found.abstract.slice(0, 120) : null,
      slug: found.slug || slug,
      category: found.article_type || 'reflective_essay',
      content: found.content || '',
      excerpt: found.excerpt || (found.content || '').replace(/<[^>]*>/g, '').slice(0, 200) + '...',
      reading_time_minutes: Math.max(1, Math.ceil(((found.content || '').replace(/<[^>]*>/g, '').split(' ').length) / 200)),
      featured: false,
      published_at: found.updated_at || found.created_at || new Date().toISOString(),
      tags: found.author_domain ? found.author_domain.split(',').map((t: string) => t.trim()) : [],
      view_count: 0,
      author_id: found.user_id || '',
      author_name: found.author_name || found.author_full_name || 'Ahl-e-Tahreer',
      author_professional_name: found.author_professional_name || '',
      author_country: found.author_country || '',
      author_city: found.author_city || '',
      author_domain: found.author_domain || '',
      author_photo: found.author_photo || '',
    } as any;
  } catch { return null; }
}

// -- Render article body: drop cap, pull-quotes, clean paragraphs --
function renderContent(content: string) {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
  return paragraphs.map((para, idx) => {
    const text = para.trim();

    // First paragraph — large drop cap
    if (idx === 0) {
      const firstChar = text.charAt(0);
      const rest = text.slice(1);
      return (
        <p key={idx} style={{ fontSize: 'var(--text-lg)', lineHeight: '1.9', color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-8)' }}>
          <span style={{
            float: 'left', fontSize: '4.5rem', lineHeight: '0.82',
            paddingRight: '0.14em', paddingTop: '0.08em',
            fontFamily: 'var(--font-headline)', color: 'var(--color-gold)', fontWeight: 700,
          }}>{firstChar}</span>
          {rest}
        </p>
      );
    }

    // Every 3rd paragraph — pull-quote then full paragraph
    if (idx % 3 === 2) {
      const pullSentence = text.split(/[.!?]/)[0].trim() + '.';
      return (
        <div key={idx}>
          <blockquote style={{
            borderLeft: '3px solid var(--color-gold)',
            paddingLeft: 'var(--space-6)',
            margin: 'var(--space-8) 0',
          }}>
            <p style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 'var(--text-xl)',
              fontStyle: 'italic',
              color: 'var(--color-gold)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 0,
            }}>{pullSentence}</p>
          </blockquote>
          <p style={{ fontSize: 'var(--text-lg)', lineHeight: '1.9', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 'var(--space-8)' }}>{text}</p>
        </div>
      );
    }

    return (
      <p key={idx} style={{
        fontSize: 'var(--text-lg)',
        lineHeight: '1.9',
        color: idx % 2 === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        fontFamily: 'var(--font-body)',
        marginBottom: 'var(--space-8)',
      }}>{text}</p>
    );
  });
}

// -------------------------------------------------------------------------
export default function LiteraryArticleClient() {
  const params = useParams();
  const slug = params?.slug as string;
  const article = findArticle(slug);
  const authorExtras = article as any;
  const [copied, setCopied] = useState(false);

  const relatedArticles = article
    ? literaryArticles.filter(a => a.id !== article.id && a.category === article.category).slice(0, 3)
    : [];
  if (relatedArticles.length < 3 && article) {
    const more = literaryArticles
      .filter(a => a.id !== article.id && !relatedArticles.find(r => r.id === a.id))
      .slice(0, 3 - relatedArticles.length);
    relatedArticles.push(...more);
  }

  const formatCategory = (cat: string) =>
    cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleShare = () => {
    if (typeof navigator === 'undefined') return;
    if (navigator.share) {
      navigator.share({ title: article?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Article not found
  if (!article) {
    return (
      <Layout>
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)', color: 'var(--color-gold)', opacity: 0.4 }}>✦</div>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)', fontFamily: 'var(--font-headline)' }}>Article not found</p>
            <Link href="/literary-journal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-gold)', textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Back to Literary Journal
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const initials = (article.author_name || 'A').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Layout>
      {/* Sticky reading progress bar */}
      <ReadingProgress />

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(180deg, #080d18 0%, var(--color-midnight) 65%, transparent 100%)',
        paddingTop: '6rem',
        paddingBottom: 0,
        borderBottom: '1px solid var(--color-border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative gold orb */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '520px', height: '520px',
          background: 'radial-gradient(circle, rgba(200,167,94,0.07) 0%, transparent 68%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 var(--space-6)' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)' }}>
            <Link href="/literary-journal"
              style={{ color: 'var(--color-text-tertiary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'color var(--transition-base)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
            >
              <ArrowLeft size={14} /> Literary Journal
            </Link>
            <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
            <span style={{ color: 'var(--color-text-tertiary)' }}>{formatCategory(article.category)}</span>
          </div>

          {/* Category pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.3rem 0.9rem',
            background: 'var(--color-gold-muted)',
            border: '1px solid rgba(200,167,94,0.25)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--color-gold)',
            fontSize: 'var(--text-xs)', fontWeight: 600,
            letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase',
            marginBottom: 'var(--space-6)',
          }}>
            <Tag size={11} /> {formatCategory(article.category)}
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-headline)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--leading-tight)',
            letterSpacing: 'var(--tracking-tight)',
            marginBottom: article.subtitle ? 'var(--space-4)' : 'var(--space-8)',
          }}>{article.title}</h1>

          {/* Subtitle */}
          {article.subtitle && (
            <p style={{
              fontFamily: 'var(--font-headline)',
              fontSize: 'var(--text-xl)',
              fontStyle: 'italic',
              color: 'var(--color-gold)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-8)',
              opacity: 0.85,
            }}>{article.subtitle}</p>
          )}

          {/* Meta bar */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center',
            gap: 'var(--space-4)',
            paddingBottom: 'var(--space-8)',
            borderBottom: '1px solid var(--color-border)',
            fontSize: 'var(--text-sm)',
          }}>
            {/* Author avatar + name + location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--color-gold-muted)',
                border: '2px solid rgba(200,167,94,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {authorExtras?.author_photo
                  ? <img src={authorExtras.author_photo} alt={article.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontWeight: 700, color: 'var(--color-gold)', fontSize: '0.8rem' }}>{initials}</span>
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, display: 'block' }}>{article.author_name}</span>
                {(authorExtras?.author_city || authorExtras?.author_country) && (
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                    {[authorExtras.author_city, authorExtras.author_country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-tertiary)' }}>
                <Calendar size={13} /> {formatDate(article.published_at)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-tertiary)' }}>
                <Clock size={13} /> {article.reading_time_minutes} min read
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-tertiary)' }}>
                <Eye size={13} /> {article.view_count.toLocaleString()} views
              </span>
              <button onClick={handleShare} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                color: copied ? 'var(--color-gold)' : 'var(--color-text-tertiary)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-sm)', padding: 0,
                transition: 'color var(--transition-base)',
              }}>
                <Share2 size={14} /> {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ARTICLE BODY */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'var(--space-12) var(--space-6)' }}>

        {/* Prose column — uses the reading-width token (720px) */}
        <div style={{ maxWidth: 'var(--max-width-reading)' }}>
          {renderContent(article.content)}
        </div>

        {/* Decorative section divider */}
        <div style={{
          textAlign: 'center',
          color: 'var(--color-gold)',
          opacity: 0.35,
          fontSize: '1.25rem',
          letterSpacing: '1.2rem',
          margin: 'var(--space-12) 0 var(--space-8)',
        }}>
          ✦ ✦ ✦
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <p style={{
              fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)',
              letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase',
              marginBottom: 'var(--space-4)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              <Tag size={12} /> Topics
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {article.tags.map((tag, i) => (
                <span key={i} style={{
                  padding: '0.35rem 0.9rem',
                  background: 'var(--color-slate)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-sm)',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Author card */}
        {article.author_name && (
          <div style={{
            marginTop: 'var(--space-12)',
            padding: 'var(--space-8)',
            background: 'linear-gradient(135deg, rgba(200,167,94,0.07) 0%, rgba(30,41,59,0.55) 100%)',
            border: '1px solid rgba(200,167,94,0.18)',
            borderRadius: 'var(--radius-base)',
            display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start',
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--color-gold-muted)',
              border: '2px solid rgba(200,167,94,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {authorExtras?.author_photo
                ? <img src={authorExtras.author_photo} alt={article.author_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontWeight: 700, color: 'var(--color-gold)', fontSize: 'var(--text-xl)' }}>{initials}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gold)', fontWeight: 600, letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>About the Author</p>
              <h3 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{article.author_name}</h3>
              {authorExtras?.author_professional_name && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={13} /> {authorExtras.author_professional_name}
                </p>
              )}
              {(authorExtras?.author_city || authorExtras?.author_country) && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={13} /> {[authorExtras.author_city, authorExtras.author_country].filter(Boolean).join(', ')}
                </p>
              )}
              {authorExtras?.author_domain && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                  {authorExtras.author_domain.split(',').map((d: string, i: number) => (
                    <span key={i} style={{
                      padding: '0.2rem 0.75rem',
                      background: 'var(--color-gold-muted)',
                      border: '1px solid rgba(200,167,94,0.22)',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--color-gold)',
                      fontSize: 'var(--text-xs)',
                    }}>{d.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTINUE READING */}
      {relatedArticles.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--color-border)',
          background: 'linear-gradient(180deg, var(--color-slate) 0%, var(--color-midnight) 100%)',
          padding: 'var(--space-12) var(--space-6) var(--space-16)',
        }}>
          <div style={{ maxWidth: '860px', margin: '0 auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
              <div style={{ width: '3px', height: '26px', background: 'var(--color-gold)', borderRadius: '2px' }} />
              <BookOpen size={20} style={{ color: 'var(--color-gold)' }} />
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)', fontWeight: 700 }}>Continue Reading</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-6)' }}>
              {relatedArticles.map(rel => (
                <Link key={rel.id} href={`/literary-journal/${rel.slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      background: 'rgba(15,23,42,0.6)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-base)',
                      padding: 'var(--space-6)',
                      height: '100%',
                      transition: 'border-color var(--transition-base), transform var(--transition-base), box-shadow var(--transition-base)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'rgba(200,167,94,0.35)';
                      el.style.transform = 'translateY(-3px)';
                      el.style.boxShadow = 'var(--shadow-gold-glow)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = 'var(--color-border)';
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'none';
                    }}
                  >
                    <span style={{
                      display: 'inline-block', marginBottom: 'var(--space-4)',
                      padding: '0.2rem 0.7rem',
                      background: 'var(--color-gold-muted)',
                      border: '1px solid rgba(200,167,94,0.2)',
                      borderRadius: 'var(--radius-full)',
                      color: 'var(--color-gold)',
                      fontSize: 'var(--text-xs)', fontWeight: 600,
                      letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase',
                    }}>{formatCategory(rel.category)}</span>
                    <h3 style={{
                      fontFamily: 'var(--font-headline)', fontSize: 'var(--text-lg)',
                      color: 'var(--color-text-primary)', fontWeight: 700,
                      lineHeight: 'var(--leading-tight)', marginBottom: 'var(--space-2)',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{rel.title}</h3>
                    <p style={{
                      fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)',
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{rel.excerpt}</p>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={11} /> {formatDate(rel.published_at)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={11} /> {rel.reading_time_minutes} min</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
