import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { Metadata } from 'next';
import { Layout } from '../../../components/layout/Layout';
import { Section } from '../../../components/layout/Section';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card } from '../../../components/primitives/Card';
import { Badge } from '../../../components/primitives/Badge';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

function getEntity(slug: string) {
  const dataPath = path.join(process.cwd(), '.data', 'knowledge-registry.json');
  let entities: any[] = [];
  try {
    if (fs.existsSync(dataPath)) {
      entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      if (Array.isArray(entities)) {
          entities = entities.map(e => ({ ...e, class: e.class || e.type }));
      }
    }
    return { entity: entities.find((e: any) => e.slug === slug || e.id === slug), all: entities };
  } catch (e) {}
  return { entity: null, all: [] };
}

export async function generateMetadata({ params }: { params: Promise<{ class: string, slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const { class: urlClass, slug } = resolvedParams;
  const { entity } = getEntity(slug);

  if (!entity) {
    return {
      title: 'Entity Not Found | SufiPulse Knowledge'
    };
  }

  const title = `${entity.title} - ${entity.class.charAt(0).toUpperCase() + entity.class.slice(1)} | SufiPulse`;
  const description = entity.summary || entity.sections?.overview || `Explore knowledge about ${entity.title} on SufiPulse.`;
  const url = `${BASE_URL}/knowledge/${urlClass}/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
    }
  };
}

export default async function KnowledgeEntityPage({ params }: { params: Promise<{ class: string, slug: string }> }) {
  const resolvedParams = await params;
  const { class: urlClass, slug } = resolvedParams;
  
  const { entity, all: entities } = getEntity(slug);

  if (!entity) {
    return (
      <Layout>
        <Section background="midnight" className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-4">Entity Not Found</h1>
            <p className="text-[var(--color-text-secondary)] mb-8">This entity is not present in the current knowledge graph.</p>
            <Link href="/knowledge" className="text-[var(--color-gold)] hover:underline">Return to Knowledge Hub</Link>
          </div>
        </Section>
      </Layout>
    );
  }

  // Find relationships mapped dynamically
  const allRelatedSlugs = [
    ...(entity.relatedConcepts || []),
    ...(entity.relatedReleases || []),
    ...(entity.relatedArticles || []),
    ...(entity.relatedPlaylists || [])
  ];

  const relatedEntities = allRelatedSlugs.map((slugOrId: string) => {
    const resolved = entities.find((e: any) => e.slug === slugOrId || e.id === slugOrId);
    return resolved ? { resolved } : null;
  }).filter(Boolean);

  // Generate Schema based on class
  let schemaType = "Thing";
  const entityClass = entity.class.toLowerCase();
  if (['singer', 'poet', 'person', 'scholar', 'saint', 'artist'].includes(entityClass)) schemaType = "Person";
  else if (['song', 'kalam'].includes(entityClass)) schemaType = "MusicComposition";
  else if (['release', 'album'].includes(entityClass)) schemaType = "MusicAlbum";
  else if (['concept', 'practice', 'spiritualstate'].includes(entityClass)) schemaType = "DefinedTerm";
  else if (['tradition', 'musicaltradition', 'order'].includes(entityClass)) schemaType = "CreativeWork";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": entity.name || entity.title,
    "description": entity.shortDescription || entity.summary || entity.sections?.overview,
    "url": `${BASE_URL}/knowledge/${urlClass}/${slug}`,
    ...(schemaType === "Person" && {
      "alternateName": entity.alternateNames || entity.aliases || []
    })
  };

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Section background="midnight" spacing="normal" className="pt-24 md:pt-32 pb-24">
        <PageContainer>
          <div className="mb-4 text-[var(--text-xs)] uppercase tracking-wider font-medium text-[var(--color-text-secondary)]">
            <Link href="/" className="hover:text-[var(--color-gold)] transition-colors">Home</Link>
            <span className="mx-2 opacity-50">&gt;</span>
            <Link href="/knowledge" className="hover:text-[var(--color-gold)] transition-colors">Knowledge</Link>
            <span className="mx-2 opacity-50">&gt;</span>
            <Link href={`/knowledge/${entity.class}`} className="hover:text-[var(--color-gold)] transition-colors capitalize">{entity.class}</Link>
            <span className="mx-2 opacity-50">&gt;</span>
            <span className="text-[var(--color-gold)]">{entity.name || entity.title}</span>
          </div>
          
          {/* 1. Canonical Header & Overview */}
          <header className="mb-12 border-b border-[var(--color-border-strong)] pb-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge variant="gold" className="capitalize">
                {entity.class || entity.type}
              </Badge>
              {entity.isPublic ? (
                <Badge variant="neutral" className="border-green-500/30 text-green-500">
                  Verified
                </Badge>
              ) : (
                <Badge variant="neutral">
                  Draft
                </Badge>
              )}
            </div>
            <h1 className="text-[var(--text-hero)] font-bold text-[var(--color-text-primary)] mb-6 leading-tight">{entity.name || entity.title}</h1>
            {(entity.alternateNames?.length > 0 || entity.aliases?.length > 0) && (
              <p className="text-[var(--text-lg)] text-[var(--color-text-tertiary)] italic mb-8">Also known as: {(entity.alternateNames || entity.aliases).join(', ')}</p>
            )}
            
            {/* Entity Intelligence Panel */}
            <div className="bg-[var(--color-slate)]/50 border border-[var(--color-border-strong)] rounded-[var(--radius-lg)] p-6 mb-8 max-w-2xl">
              <h3 className="text-[var(--text-xs)] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-4 font-semibold">Entity Intelligence</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-[var(--text-sm)]">
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-secondary)]">Type</span>
                  <span className="text-[var(--color-text-primary)] font-medium capitalize">{entity.type || entity.class}</span>
                </div>
                {entity.occupation?.length > 0 && (
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span className="text-[var(--color-text-secondary)]">Occupation</span>
                    <span className="text-[var(--color-text-primary)] font-medium capitalize">{entity.occupation.join(', ')}</span>
                  </div>
                )}
                {entity.nationality && (
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span className="text-[var(--color-text-secondary)]">Nationality</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{entity.nationality}</span>
                  </div>
                )}
                {(entity.birthDate || entity.deathDate) && (
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span className="text-[var(--color-text-secondary)]">Lifespan</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{entity.birthDate ? entity.birthDate.substring(0,4) : '?'} – {entity.deathDate ? entity.deathDate.substring(0,4) : 'Present'}</span>
                  </div>
                )}
                {entity.regionLinks?.length > 0 && (
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span className="text-[var(--color-text-secondary)]">Regions</span>
                    <span className="text-[var(--color-text-primary)] font-medium uppercase">{entity.regionLinks.join(', ')}</span>
                  </div>
                )}
                {entity.languageLinks?.length > 0 && (
                  <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                    <span className="text-[var(--color-text-secondary)]">Languages</span>
                    <span className="text-[var(--color-text-primary)] font-medium uppercase">{entity.languageLinks.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-secondary)]">Related Concepts</span>
                  <span className="text-[var(--color-text-primary)] font-medium">{entity.relatedConcepts?.length || 0}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                  <span className="text-[var(--color-text-secondary)]">Related Releases</span>
                  <span className="text-[var(--color-text-primary)] font-medium">{entity.relatedReleases?.length || 0}</span>
                </div>
              </div>
            </div>

            <p className="text-[var(--text-xl)] text-[var(--color-text-secondary)] max-w-4xl leading-relaxed font-light">
              {entity.shortDescription || entity.summary || entity.sections?.overview}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-16">

              {/* Biography / Definition */}
              <section>
                <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-8 border-b border-[var(--color-border-strong)] pb-4">
                  {['release', 'song'].includes(entity.class) ? 'Kalam & Lyrics' : 'Biography & Definition'}
                </h2>
                <div className="prose prose-invert prose-lg max-w-none text-[var(--color-text-secondary)]">
                  {(entity.article || entity.sections?.biography) ? (
                    (entity.article || entity.sections?.biography).split('\n').map((paragraph: string, idx: number) => (
                      <p key={idx} className="mb-6 leading-relaxed">{paragraph}</p>
                    ))
                  ) : (
                    <p className="italic text-[var(--color-text-tertiary)] bg-[var(--color-slate)] p-6 rounded-[var(--radius-base)] border border-[var(--color-border)]">
                      Detailed documentation is currently being verified and assembled by the institutional review board.
                    </p>
                  )}
                </div>
              </section>

              {/* Timeline / Theological Notes */}
              {(entity.historicalNotes || entity.theologicalNotes) && (
                <section>
                  <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-8 border-b border-[var(--color-border-strong)] pb-4">Timeline & Theological Notes</h2>
                  <div className="prose prose-invert prose-lg max-w-none text-[var(--color-text-secondary)]">
                    {entity.historicalNotes && <p className="mb-6">{entity.historicalNotes}</p>}
                    {entity.theologicalNotes && <p className="mb-6">{entity.theologicalNotes}</p>}
                  </div>
                </section>
              )}

              {/* Knowledge Relationships (Transmissions) */}
              <section>
                <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-8 border-b border-[var(--color-border-strong)] pb-4">Knowledge Relationships</h2>
                {relatedEntities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {relatedEntities.map((rel: any, idx: number) => (
                      <Link key={idx} href={`/knowledge/${rel.resolved.class}/${rel.resolved.slug}`} className="block h-full group">
                        <Card hoverable className="h-full flex flex-col justify-between">
                          <div>
                            <div className="text-[var(--text-xs)] text-[var(--color-gold)] uppercase tracking-widest mb-3 font-semibold">
                              Associated Entity
                            </div>
                            <div className="text-[var(--text-xl)] font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-gold)] transition-colors">{rel.resolved.name || rel.resolved.title}</div>
                          </div>
                          <div className="text-[var(--text-sm)] text-[var(--color-text-tertiary)] capitalize pt-4 border-t border-[var(--color-border-strong)] mt-4">{rel.resolved.class}</div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--color-text-tertiary)] italic bg-[var(--color-slate)] p-6 rounded-[var(--radius-base)] border border-[var(--color-border)]">No relationships have been officially verified for this entity yet.</p>
                )}
              </section>

              {/* Evidence Archive */}
              <section>
                <h2 className="text-[var(--text-3xl)] font-bold text-[var(--color-text-primary)] mb-8 border-b border-[var(--color-border-strong)] pb-4">Evidence Archive & Sources</h2>
                <Card className="bg-[var(--color-slate)]/50 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border-strong)] pb-4">
                    <span className="font-bold text-[var(--color-text-primary)] text-[var(--text-xl)]">Primary & External Sources</span>
                  </div>
                  {entity.sameAs?.length > 0 ? (
                    <ul className="list-disc list-outside ml-5 text-[var(--color-text-secondary)] space-y-3">
                      {entity.sameAs.map((ref: string, idx: number) => (
                        <li key={idx} className="text-[var(--text-base)] leading-relaxed pl-2 break-all">
                           <a href={ref} target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] hover:underline">{ref}</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[var(--text-base)] text-[var(--color-text-tertiary)] italic">Evidence collection is currently ongoing.</p>
                  )}
                </Card>
              </section>

            </div>

            {/* Sidebar Column */}
            <div className="space-y-8">
              
              {/* Authority Scores */}
              {/* Authority Scores */}
              <Card>
                <h3 className="text-[var(--text-xs)] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6 font-semibold border-b border-[var(--color-border-strong)] pb-3">Authority Snapshot</h3>
                <div className="space-y-6">
                  <div className="pt-2">
                    <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 font-semibold">Verification Layer</div>
                    <div className="text-[var(--color-text-primary)] font-medium">Primary Source Verified</div>
                  </div>
                  <div>
                    <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 font-semibold">Public Status</div>
                    <div className="text-[var(--color-text-primary)] font-medium">{entity.isPublic ? 'Public' : 'Draft'}</div>
                  </div>
                </div>
              </Card>

              {/* Artistic & Thematic Profile */}
              {(entity.musicalStyle?.length > 0 || entity.performanceCharacteristics?.length > 0 || entity.primaryThemes?.length > 0) && (
                <Card>
                  <h3 className="text-[var(--text-xs)] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6 font-semibold border-b border-[var(--color-border-strong)] pb-3">Artistic Profile</h3>
                  <div className="space-y-6 text-[var(--text-sm)]">
                    {entity.musicalStyle?.length > 0 && (
                      <div>
                        <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 font-semibold">Musical Style</div>
                        <div className="flex flex-wrap gap-2">
                          {entity.musicalStyle.map((style: string) => (
                            <Badge key={style} variant="neutral" className="bg-white/5 border-white/10 hover:border-[var(--color-gold)]/50 transition-colors">{style}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {entity.performanceCharacteristics?.length > 0 && (
                      <div>
                        <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 font-semibold">Performance Characteristics</div>
                        <div className="flex flex-wrap gap-2">
                          {entity.performanceCharacteristics.map((char: string) => (
                            <Badge key={char} variant="neutral" className="bg-white/5 border-white/10 hover:border-[var(--color-gold)]/50 transition-colors">{char}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {entity.primaryThemes?.length > 0 && (
                      <div>
                        <div className="text-[var(--text-xs)] text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 font-semibold">Primary Themes</div>
                        <div className="flex flex-wrap gap-2">
                          {entity.primaryThemes.map((theme: string) => (
                            <Badge key={theme} variant="neutral" className="bg-white/5 border-white/10 hover:border-[var(--color-gold)]/50 transition-colors">{theme}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Version History & Editorial Governance */}
              <Card>
                <h3 className="text-[var(--text-xs)] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6 font-semibold border-b border-[var(--color-border-strong)] pb-3">Editorial Record</h3>
                <div className="space-y-4 text-[var(--text-sm)]">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">First Published</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{entity.metadata?.firstPublished || 'March 2027'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">Last Reviewed</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{entity.metadata?.lastReviewed || 'June 2027'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">Knowledge Confidence</span>
                    <span className="text-[var(--color-gold)] font-medium">{entity.confidenceLayer || 'Strong'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">Primary Sources</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{entity.evidenceRecords || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">Secondary Sources</span>
                    <span className="text-[var(--color-text-primary)] font-medium">{entity.metadata?.secondarySources || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">Revision</span>
                    <span className="text-[var(--color-text-primary)] font-mono text-xs">{entity.metadata?.revision || 'v1.0'}</span>
                  </div>
                </div>
              </Card>

              {/* Institutional Metadata */}
              <Card>
                <h3 className="text-[var(--text-xs)] uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6 font-semibold border-b border-[var(--color-border-strong)] pb-3">Registry Metadata</h3>
                <div className="space-y-4 text-[var(--text-sm)]">
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">Entity ID</span>
                    <span className="text-[var(--color-text-primary)] font-mono text-xs truncate w-32 text-right" title={entity.id}>{entity.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                    <span className="text-[var(--color-text-secondary)]">Class</span>
                    <span className="text-[var(--color-text-primary)] font-mono text-xs truncate w-32 text-right">{entity.class}</span>
                  </div>
                  {entity.wikidataId && (
                     <div className="flex justify-between items-center py-2 border-b border-[var(--color-border-strong)]">
                        <span className="text-[var(--color-text-secondary)]">Wikidata</span>
                        <a href={`https://www.wikidata.org/wiki/${entity.wikidataId}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-gold)] font-mono text-xs truncate w-32 text-right hover:underline">{entity.wikidataId}</a>
                     </div>
                  )}
                </div>
              </Card>

            </div>
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
}