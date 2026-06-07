import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default async function KnowledgeEntityPage({ params }: { params: Promise<{ class: string, slug: string }> }) {
  const resolvedParams = await params;
  const { class: urlClass, slug } = resolvedParams;

  const dataPath = path.join(process.cwd(), '.data', 'unified_knowledge.json');
  const entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const entity = entities.find((e: any) => e.slug === slug || e.id === slug);

  if (!entity) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-serif text-[#3A322B] mb-4">Entity Not Found</h1>
        <p className="text-[#776B60] mb-8">This entity is not present in the current knowledge graph.</p>
        <Link href="/knowledge" className="text-[#2A241F] underline">Return to Archive</Link>
      </div>
    );
  }

  // Find relationships mapped dynamically
  const relatedEntities = entity.relationships ? entity.relationships.map((rel: any) => {
    const targetId = rel.target || rel.source;
    const resolved = entities.find((e: any) => e.id === targetId || e.slug === targetId);
    return { ...rel, resolved };
  }).filter((rel: any) => rel.resolved) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <Link href={`/knowledge/${urlClass}`} className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest hover:text-[#2A241F] mb-6 inline-block">
        ← Back to {urlClass} Archive
      </Link>
      
      {/* 1. Canonical Header & Overview */}
      <header className="mb-12 border-b border-[#d8d2c6] pb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-mono text-[#2A241F] uppercase tracking-widest bg-[#e8e2d5] px-2 py-1">
            {entity.class}
          </span>
          <span className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest border border-[#d8d2c6] px-2 py-1">
            Verification: {entity.verificationStatus}
          </span>
        </div>
        <h1 className="text-6xl font-serif text-[#2A241F] mb-4">{entity.title}</h1>
        {entity.aliases && entity.aliases.length > 0 && (
          <p className="text-[#776B60] italic mb-6">Also known as: {entity.aliases.join(', ')}</p>
        )}
        <p className="text-xl text-[#2F2A26] max-w-3xl leading-relaxed">{entity.sections?.overview || entity.summary}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-16">
          
          {/* Media Player for Releases */}
          {entity.metadata?.youtubeId && (
            <section>
              <div className="w-full aspect-video bg-[#2A241F] border border-[#d8d2c6] relative overflow-hidden">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${entity.metadata.youtubeId}?rel=0`} 
                  title={entity.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="absolute inset-0"
                ></iframe>
              </div>
            </section>
          )}

          {/* Canonical Documentation or Lyrics depending on class */}
          <section>
            <h2 className="text-3xl font-serif text-[#3A322B] mb-6 border-b border-[#e8e2d5] pb-2">
              {['release', 'song'].includes(entity.class) ? 'Kalam & Lyrics' : 'Canonical Documentation'}
            </h2>
            <div className="prose prose-stone prose-lg text-[#2F2A26]">
              {['release', 'song'].includes(entity.class) && entity.longDescription ? (
                <div className="whitespace-pre-wrap font-serif text-xl leading-loose italic">
                  {entity.longDescription}
                </div>
              ) : entity.sections?.biography ? (
                entity.sections.biography.split('\n').map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <p className="italic text-[#776B60]">
                  {['release', 'song'].includes(entity.class) 
                    ? 'Lyrics and translations are currently being finalized.'
                    : 'Historical and canonical documentation is currently being verified and assembled by the institutional review board.'}
                </p>
              )}
            </div>
          </section>

          {/* 3. Intellectual Contributions */}
          {entity.sections?.contributions && (
            <section>
              <h2 className="text-3xl font-serif text-[#3A322B] mb-6 border-b border-[#e8e2d5] pb-2">Intellectual Contributions</h2>
              <div className="prose prose-stone prose-lg text-[#2F2A26]">
                {entity.sections.contributions.split('\n').map((paragraph: string, idx: number) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {/* 4. Transmission Network */}
          <section>
            <h2 className="text-3xl font-serif text-[#3A322B] mb-6 border-b border-[#e8e2d5] pb-2">Transmission Network</h2>
            {relatedEntities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedEntities.map((rel: any, idx: number) => (
                  <Link key={idx} href={`/knowledge/${rel.resolved.class}s/${rel.resolved.slug}`} className="block border border-[#d8d2c6] p-4 bg-[#faf7f2] hover:border-[#2A241F] transition-colors">
                    <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest mb-1">
                      {rel.type === 'outgoing' ? `→ Transmits to (${rel.relation})` : `← Received from (${rel.relation})`}
                    </div>
                    <div className="font-serif text-lg text-[#2A241F]">{rel.resolved.title}</div>
                    <div className="text-sm text-[#776B60] capitalize">{rel.resolved.class}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[#776B60] italic">No transmission relationships have been officially verified for this entity.</p>
            )}
          </section>

          {/* 5. Evidence & Verification Archive */}
          <section>
            <h2 className="text-3xl font-serif text-[#3A322B] mb-6 border-b border-[#e8e2d5] pb-2">Evidence Archive</h2>
            <div className="bg-[#faf7f2] border border-[#d8d2c6] p-6">
              <div className="flex justify-between items-center mb-4">
                <span className="font-serif text-[#241F1B] text-xl">Primary Sources</span>
                <span className="text-[10px] font-mono text-[#2A241F] uppercase bg-[#e8e2d5] px-2 py-1">{entity.evidenceRecords} Records Verified</span>
              </div>
              {entity.evidenceRecords > 0 ? (
                <ul className="list-disc list-inside text-[#2F2A26] space-y-2">
                  {entity.metadata?.sourceReferences ? (
                    entity.metadata.sourceReferences.map((ref: string, idx: number) => (
                      <li key={idx} className="text-sm">{ref}</li>
                    ))
                  ) : (
                    <li className="text-sm italic">Citations are stored securely in the institutional CMS and will be hydrated here post-review.</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-[#776B60] italic">Evidence collection is currently ongoing.</p>
              )}
            </div>
          </section>

          {/* 6. Questions & AI Demand Generation */}
          {entity.sections?.questions && entity.sections.questions.length > 0 && (
            <section>
              <h2 className="text-3xl font-serif text-[#3A322B] mb-6 border-b border-[#e8e2d5] pb-2">Discovery Questions Library</h2>
              <div className="space-y-4">
                {entity.sections.questions.map((q: any, idx: number) => (
                  <div key={idx} className="border border-[#d8d2c6] p-4 bg-[#faf7f2]">
                    <div className="font-serif text-[#2A241F] text-lg mb-2">{q.q}</div>
                    <div className="text-[10px] font-mono text-[#776B60] uppercase">Status: <span className="text-[#2A241F]">{q.status.replace('_', ' ')}</span></div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Authority Scores */}
          <div className="border border-[#d8d2c6] p-6 bg-[#faf7f2]">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#776B60] mb-4">Authority Snapshot</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#2F2A26]">Readiness Score</span>
                  <span className="font-mono text-[#2A241F]">{entity.readinessScore}/100</span>
                </div>
                <div className="w-full bg-[#e8e2d5] h-1">
                  <div className="bg-[#2A241F] h-1" style={{ width: `${entity.readinessScore}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#2F2A26]">Resilience Score</span>
                  <span className="font-mono text-[#2A241F]">{entity.resilienceScore}/100</span>
                </div>
                <div className="w-full bg-[#e8e2d5] h-1">
                  <div className="bg-[#2A241F] h-1" style={{ width: `${entity.resilienceScore}%` }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-[#e8e2d5]">
                <div className="text-[10px] font-mono text-[#776B60] uppercase mb-1">Confidence Layer</div>
                <div className="text-[#2A241F]">{entity.confidenceLayer}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#776B60] uppercase mb-1">Disputes</div>
                <div className="text-[#2A241F]">{entity.disputeStatus}</div>
              </div>
            </div>
          </div>

          {/* Institutional Metadata */}
          <div className="border border-[#d8d2c6] p-6 bg-[#faf7f2]">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#776B60] mb-4">Registry Metadata</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-[#e8e2d5] pb-2">
                <span className="text-[#776B60]">Entity ID</span>
                <span className="font-mono text-[#2A241F] text-right truncate w-32" title={entity.id}>{entity.id}</span>
              </div>
              <div className="flex justify-between border-b border-[#e8e2d5] pb-2">
                <span className="text-[#776B60]">Data Source</span>
                <span className="font-mono text-[#2A241F] text-right truncate w-32">{entity.source}</span>
              </div>
              {entity.metadata && Object.entries(entity.metadata).slice(0, 5).map(([k, v]: [string, any], idx: number) => (
                typeof v === 'string' || typeof v === 'number' ? (
                  <div key={idx} className="flex justify-between border-b border-[#e8e2d5] pb-2">
                    <span className="text-[#776B60] capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-[#2A241F] text-right truncate w-32" title={String(v)}>{v}</span>
                  </div>
                ) : null
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}