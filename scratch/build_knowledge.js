const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const constitutionalCore = [
  { class: 'root', slug: 'sufipulse-authority-doctrine', name: 'SufiPulse Authority Doctrine', aliases: [], canonicalImpact: 'The foundation of all knowledge.', readinessScore: 100, resilienceScore: 100, confidenceLayer: 'Constitutional', verificationStatus: 'Root', evidenceRecords: 0, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'persons', slug: 'jalal-al-din-rumi', name: 'Jalal al-Din Rumi', aliases: ['Rumi', 'Mevlana'], canonicalImpact: 'Architect of poetic Sufism.', readinessScore: 98, resilienceScore: 95, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 24, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'persons', slug: 'ibn-arabi', name: 'Ibn Arabi', aliases: ['Shaykh al-Akbar'], canonicalImpact: 'Founder of Wahdat al-Wujud.', readinessScore: 99, resilienceScore: 92, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 30, disputeStatus: 'Active', relatedQuestions: [] },
  { class: 'persons', slug: 'junayd-of-baghdad', name: 'Junayd of Baghdad', aliases: ['Sayyid al-Taifa'], canonicalImpact: 'Codifier of Sober Sufism.', readinessScore: 95, resilienceScore: 98, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 15, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'persons', slug: 'bayazid-bastami', name: 'Bayazid Bastami', aliases: ['Abu Yazid'], canonicalImpact: 'Pioneer of Ecstatic Sufism.', readinessScore: 92, resilienceScore: 88, confidenceLayer: 'Medium', verificationStatus: 'Verified', evidenceRecords: 12, disputeStatus: 'Resolved', relatedQuestions: [] },
  { class: 'persons', slug: 'abdul-qadir-gilani', name: 'Abdul Qadir Gilani', aliases: ['Ghaus-e-Azam'], canonicalImpact: 'Founder of the Qadiriyya order.', readinessScore: 97, resilienceScore: 96, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 40, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'tawhid', name: 'Tawhid', aliases: ['Divine Unity'], canonicalImpact: 'The core axiom of Islam.', readinessScore: 100, resilienceScore: 100, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 50, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'ihsan', name: 'Ihsan', aliases: ['Spiritual Excellence'], canonicalImpact: 'The goal of the spiritual path.', readinessScore: 98, resilienceScore: 98, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 20, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'dhikr', name: 'Dhikr', aliases: ['Remembrance', 'Zikr'], canonicalImpact: 'The primary method of purification.', readinessScore: 99, resilienceScore: 99, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 45, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'tazkiyah', name: 'Tazkiyah', aliases: ['Purification of the Soul'], canonicalImpact: 'The process of removing spiritual diseases.', readinessScore: 96, resilienceScore: 95, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 18, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'nafs', name: 'Nafs', aliases: ['Ego', 'Lower Self'], canonicalImpact: 'The primary obstacle to enlightenment.', readinessScore: 97, resilienceScore: 96, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 22, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'fana', name: 'Fana', aliases: ['Annihilation'], canonicalImpact: 'The state of losing oneself in the Divine.', readinessScore: 94, resilienceScore: 90, confidenceLayer: 'Medium', verificationStatus: 'Verified', evidenceRecords: 14, disputeStatus: 'Active', relatedQuestions: [] },
  { class: 'concepts', slug: 'baqa', name: 'Baqa', aliases: ['Subsistence'], canonicalImpact: 'The state of remaining in God after Fana.', readinessScore: 93, resilienceScore: 91, confidenceLayer: 'Medium', verificationStatus: 'Verified', evidenceRecords: 11, disputeStatus: 'Resolved', relatedQuestions: [] },
  { class: 'concepts', slug: 'murshid', name: 'Murshid', aliases: ['Spiritual Guide', 'Pir'], canonicalImpact: 'The essential living guide of the path.', readinessScore: 98, resilienceScore: 97, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 35, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'murid', name: 'Murid', aliases: ['Disciple', 'Seeker'], canonicalImpact: 'The traveler on the spiritual path.', readinessScore: 98, resilienceScore: 97, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 30, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'concepts', slug: 'silsila', name: 'Silsila', aliases: ['Chain of Transmission'], canonicalImpact: 'The guarantee of spiritual authenticity.', readinessScore: 99, resilienceScore: 98, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 42, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'works', slug: 'masnavi', name: 'Masnavi', aliases: ['Mathnawi'], canonicalImpact: 'The Quran in the Persian tongue.', readinessScore: 99, resilienceScore: 99, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 60, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'works', slug: 'fusus-al-hikam', name: 'Fusus al-Hikam', aliases: ['Bezels of Wisdom'], canonicalImpact: 'The definitive text on Wahdat al-Wujud.', readinessScore: 96, resilienceScore: 92, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 25, disputeStatus: 'Active', relatedQuestions: [] },
  { class: 'works', slug: 'futuhat-al-makkiyya', name: 'Futuhat al-Makkiyya', aliases: ['Meccan Revelations'], canonicalImpact: 'The encyclopedic summa of Sufi metaphysics.', readinessScore: 97, resilienceScore: 94, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 28, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'works', slug: 'kashf-al-mahjub', name: 'Kashf al-Mahjub', aliases: ['Unveiling the Hidden'], canonicalImpact: 'The first comprehensive manual of Sufism in Persian.', readinessScore: 98, resilienceScore: 98, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 32, disputeStatus: 'None', relatedQuestions: [] },
  { class: 'works', slug: 'ihya-ulum-al-din', name: 'Ihya Ulum al-Din', aliases: ['Revival of the Religious Sciences'], canonicalImpact: 'The reconciliation of orthodox law and Sufi inner life.', readinessScore: 100, resilienceScore: 100, confidenceLayer: 'High', verificationStatus: 'Verified', evidenceRecords: 80, disputeStatus: 'None', relatedQuestions: [] }
];

fs.writeFileSync(path.join(dataDir, 'constitutional_core.json'), JSON.stringify(constitutionalCore, null, 2));

const pageTsx = `import React from 'react';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default async function KnowledgeHome() {
  const dataPath = path.join(process.cwd(), '.data', 'constitutional_core.json');
  const entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <h1 className="text-5xl font-serif text-[#2A241F] mb-4">Institutional Knowledge Archive</h1>
      <p className="text-[#2F2A26] mb-12">SufiPulse Constitutional Core Entities</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entities.map(entity => (
          <Link key={entity.slug} href={\`/knowledge/\${entity.class}/\${entity.slug}\`} className="block">
            <div className="border border-[#d8d2c6] p-6 hover:border-[#2A241F] bg-[#faf7f2] transition-colors h-full flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest mb-3 bg-[#e8e2d5] inline-block px-2 py-1">
                  {entity.class}
                </div>
                <h2 className="font-serif text-2xl text-[#241F1B] mb-3">{entity.name}</h2>
                <p className="text-sm text-[#2F2A26] mb-4">{entity.canonicalImpact}</p>
              </div>
              <div className="flex justify-between border-t border-[#e8e2d5] pt-3 text-[10px] font-mono text-[#776B60]">
                <span>Score: <span className="text-[#2A241F]">{entity.readinessScore}</span></span>
                <span>Ev: <span className="text-[#2A241F]">{entity.evidenceRecords} Records</span></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}`;

const dynamicRouteTsx = `import React from 'react';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';

export default async function KnowledgeEntityPage({ params }: { params: Promise<{ class: string, slug: string }> }) {
  const resolvedParams = await params;
  const dataPath = path.join(process.cwd(), '.data', 'constitutional_core.json');
  const entities = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  const entity = entities.find((e: any) => e.class === resolvedParams.class && e.slug === resolvedParams.slug);
  
  if (!entity) return notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-12 border-b border-[#d8d2c6] pb-12 mb-12">
        <div className="md:w-3/5">
          <div className="flex flex-wrap gap-3 text-[10px] font-mono text-[#3A322B] uppercase tracking-widest mb-6">
            <span className="bg-[#e8e2d5] px-2 py-1 border border-[#d8d2c6]">Class: {entity.class}</span>
            {entity.aliases.length > 0 && <span className="bg-[#e8e2d5] px-2 py-1 border border-[#d8d2c6]">Has Aliases</span>}
          </div>
          
          <h1 className="text-5xl md:text-[80px] font-serif text-[#2A241F] leading-[0.9] tracking-tight mb-8">
            {entity.name}
          </h1>

          <div className="space-y-4">
            <div className="text-[10px] font-mono text-[#776B60] uppercase tracking-widest">Canonical Impact</div>
            <p className="text-xl font-serif leading-[160%] text-[#2F2A26] max-w-2xl">
              {entity.canonicalImpact}
            </p>
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4 text-xs font-mono text-[#776B60]">
            <span><strong className="text-[#3A322B]">Aliases:</strong> {entity.aliases.join(', ') || 'None'}</span>
          </div>
        </div>
        
        <div className="md:w-2/5 flex flex-col justify-center">
          <div className="bg-[#faf7f2] border border-[#d8d2c6] p-6 shadow-sm">
            <h2 className="text-[11px] font-mono text-[#3A322B] uppercase tracking-widest mb-4 border-b border-[#d8d2c6] pb-2">Authority Snapshot</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <div className="text-[10px] text-[#776B60] uppercase font-mono mb-1">Readiness Score</div>
                <div className="text-lg font-serif text-[#3A322B]">{entity.readinessScore}/100</div>
              </div>
              <div>
                <div className="text-[10px] text-[#776B60] uppercase font-mono mb-1">Resilience Score</div>
                <div className="text-lg font-serif text-[#3A322B]">{entity.resilienceScore}/100</div>
              </div>
              <div>
                <div className="text-[10px] text-[#776B60] uppercase font-mono mb-1">Confidence Layer</div>
                <div className="text-sm font-sans font-medium text-[#3A322B]">{entity.confidenceLayer}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#776B60] uppercase font-mono mb-1">Verification Status</div>
                <div className="text-sm font-sans font-medium text-[#3A322B]">{entity.verificationStatus}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#776B60] uppercase font-mono mb-1">Evidence Records</div>
                <div className="text-lg font-serif text-[#3A322B]">{entity.evidenceRecords} Nodes</div>
              </div>
              <div>
                <div className="text-[10px] text-[#776B60] uppercase font-mono mb-1">Dispute Status</div>
                <div className="text-sm font-sans font-medium text-[#3A322B]">{entity.disputeStatus}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="w-full bg-[#faf7f2] border-t border-[#d8d2c6] py-20 px-8">
        <h3 className="text-2xl font-serif text-[#3A322B] mb-8">Historical Record & Archive</h3>
        <p className="text-[#2F2A26]">Data connected from constitutional core.</p>
      </section>

      <section className="w-full bg-[#faf7f2] border-t border-[#d8d2c6] py-20 mt-12 px-8">
        <h3 className="text-xl font-serif text-[#3A322B] mb-8">AI Retrieval Payload</h3>
        <p className="text-sm text-[#5F554D]">{entity.name} is classified as {entity.class} with {entity.evidenceRecords} evidence records.</p>
      </section>
    </div>
  );
}`;

const knowledgeDir = path.join(process.cwd(), 'app', 'knowledge');
fs.writeFileSync(path.join(knowledgeDir, 'page.tsx'), pageTsx);

const dynamicDir = path.join(knowledgeDir, '[class]', '[slug]');
if (!fs.existsSync(dynamicDir)) fs.mkdirSync(dynamicDir, { recursive: true });
fs.writeFileSync(path.join(dynamicDir, 'page.tsx'), dynamicRouteTsx);

// Clean up old static folders
['concepts', 'questions', 'singers', 'songs', 'writers'].forEach(folder => {
  const folderPath = path.join(knowledgeDir, folder);
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
});

console.log('Knowledge system built successfully.');
