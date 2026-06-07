import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';

export default async function ArchiveHome() {
  const dataPath = path.join(process.cwd(), '.data', 'constitutional_core.json');
  let entities: any[] = [];
  try {
    if (fs.existsSync(dataPath)) {
      entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (e) {}
  
  // Fake some archive entries for functionality
  const archiveRecords = entities.slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div className="mb-8 border-b border-[#d8d2c6] pb-8">
        <Link href="/knowledge" className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest hover:text-[#2A241F] mb-6 inline-block">
          ← Back to Knowledge Archive
        </Link>
        <h1 className="text-5xl font-serif text-[#2A241F] mb-4">Historical Evidence Archive</h1>
        <p className="text-[#2F2A26] max-w-2xl">The primary source repository verifying the constitutional core layer.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {archiveRecords.map(record => (
          <div key={record.slug} className="border border-[#d8d2c6] p-6 hover:border-[#2A241F] bg-[#faf7f2] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest bg-[#e8e2d5] px-2 py-1">
                Evidence Record
              </div>
              <div className="text-[10px] font-mono text-[#2A241F] font-bold">Tier 1</div>
            </div>
            <h2 className="font-serif text-2xl text-[#241F1B] mb-3">{record.name} Source Document</h2>
            <p className="text-sm text-[#2F2A26] mb-6">Historical primary source establishing canonical impact: {record.canonicalImpact}</p>
            <Link href={`/knowledge/${record.class}/${record.slug}`} className="text-xs font-mono uppercase tracking-widest text-[#2A241F] hover:underline">
              View Connected Entity →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
