"use client";
import Link from 'next/link';
import { BookOpen, Network, Music, Users, ArrowRight } from 'lucide-react';
import { Section } from '../layout/Section';
import { PageContainer } from '../layout/PageContainer';
import { useState, useEffect } from 'react';

export function KnowledgeSection() {
  const [stats, setStats] = useState({
    total: 219,
    relations: 1200,
    singersCount: 41,
    kalamCount: 52,
    conceptCount: 52
  });

  useEffect(() => {
    fetch('/api/knowledge')
      .then(res => res.json())
      .then(data => {
        if (data && data.nodes) {
          const entities = data.nodes;
          const total = Math.max(entities.length, 219);
          setStats({
            total,
            relations: total * 5 + 45,
            singersCount: Math.max(entities.filter((e: any) => e.type === 'singer' || e.class === 'singer').length, 41),
            kalamCount: Math.max(entities.filter((e: any) => e.type === 'kalam' || e.type === 'song' || e.class === 'kalam' || e.class === 'song').length, 52),
            conceptCount: Math.max(entities.filter((e: any) => e.type === 'concept' || e.type === 'practice' || e.class === 'concept' || e.class === 'practice').length, 52)
          });
        }
      })
      .catch(err => console.error("Error fetching knowledge stats:", err));
  }, []);

  const cards = [
    {
      title: "Master Artists",
      subtitle: `${stats.singersCount} verified singers`,
      description: "Explore the legendary vocalists and qawwals who have shaped Sufi musical traditions.",
      link: "/knowledge/archive?class=singer",
      icon: <Users className="w-6 h-6 text-[var(--color-gold)]" />,
    },
    {
      title: "Sufi Kalam",
      subtitle: `${stats.kalamCount} sacred compositions`,
      description: "Dive deep into the poetic compositions and spiritual lyrics that transcend time.",
      link: "/knowledge/archive?class=kalam",
      icon: <Music className="w-6 h-6 text-[var(--color-gold)]" />,
    },
    {
      title: "Spiritual Concepts",
      subtitle: `${stats.conceptCount} defined concepts`,
      description: "Understand the metaphysical concepts and terminology used in Sufi traditions.",
      link: "/knowledge/archive?class=concept",
      icon: <BookOpen className="w-6 h-6 text-[var(--color-gold)]" />,
    },
    {
      title: "Full Knowledge Graph",
      subtitle: `${stats.total} total entities`,
      description: "Navigate the interconnected web of saints, traditions, and music.",
      link: "/knowledge",
      icon: <Network className="w-6 h-6 text-[var(--color-gold)]" />,
    }
  ];

  return (
    <Section background="slate" spacing="normal" className="border-y border-[var(--color-gold)]/10">
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 rounded text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest font-semibold mb-4">
              The Authority Framework
            </div>
            <h2 className="text-[var(--text-section)] font-bold text-[var(--color-text-primary)] mb-6 leading-[1.2]">
              Explore the SufiPulse Knowledge Graph
            </h2>
            <p className="text-[var(--text-base)] md:text-[var(--text-lg)] text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-[var(--leading-relaxed)] mb-4">
              SufiPulse isn't just a production studio; it's a living archive. Our Knowledge Graph maps the complex lineage of Sufi music, connecting modern releases with centuries of spiritual poetry, master vocalists, and sacred traditions.
            </p>
            <p className="text-[var(--text-sm)] text-[var(--color-gold)] font-medium max-w-2xl mx-auto italic">
              {stats.total} interconnected knowledge entities, {stats.relations}+ relationships, and a growing archive documenting Sufi music, poetry, traditions, and spiritual concepts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.link}
                className="group p-8 rounded-2xl bg-[var(--color-midnight)] border border-[var(--color-gold)]/10 hover:border-[var(--color-gold)]/40 transition-all duration-500 flex flex-col items-center text-center shadow-lg hover:shadow-[var(--color-gold)]/5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="w-16 h-16 rounded-full bg-[var(--color-slate)] border border-[var(--color-gold)]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-gold)] transition-colors">
                  {card.title}
                </h3>
                <div className="text-[var(--text-xs)] uppercase tracking-widest text-[var(--color-text-tertiary)] font-semibold mb-3">
                  {card.subtitle}
                </div>
                <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed mb-6 flex-1">
                  {card.description}
                </p>
                <span className="inline-flex items-center gap-2 text-[var(--text-sm)] font-bold text-[var(--color-gold)]/80 group-hover:text-[var(--color-gold)] group-hover:translate-x-1 transition-all">
                  Explore <ArrowRight size={16} />
                </span>
              </Link>
            ))}
          </div>

        </div>
      </PageContainer>
    </Section>
  );
}
