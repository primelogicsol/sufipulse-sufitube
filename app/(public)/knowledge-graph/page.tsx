"use client";

import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import { Database, Link as LinkIcon, Network } from 'lucide-react';
import '../../styles/verification.css';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

const knowledgeGraphSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "SufiPulse",
      "description": "Root Entity",
      "department": [
        {
          "@type": "Organization",
          "name": "Writers",
          "description": "Contributor Group"
        },
        {
          "@type": "Organization",
          "name": "Releases",
          "description": "Content Registry"
        }
      ],
      "brand": [
        {
          "@type": "Brand",
          "name": "SufiTube",
          "description": "Internal Brand"
        },
        {
          "@type": "Brand",
          "name": "SufiPulse Studio",
          "description": "Internal Brand"
        }
      ],
      "sameAs": [
        "https://www.youtube.com/@SufiPulse-USA"
      ]
    }
  ]
};

export default function KnowledgeGraph() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(knowledgeGraphSchema) }}
      />
      
      <div className="verification-page">
        <section className="verify-hero">
          <div className="verify-hero-badge">
            <span className="badge-dot" />
            Machine Readable
          </div>
          <h1>
            <span className="shimmer-text">SufiPulse Knowledge Graph</span>
          </h1>
          <p className="verify-hero-desc">
            This page provides structured entity relationships for search engines, AI models, and automated discovery systems.
          </p>
          <div className="verify-hero-meta">
            <span><Database size={13} /> JSON-LD Schema</span>
            <span><Network size={13} /> Entity Resolution</span>
          </div>
        </section>

        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Entities</span>
                <h2 className="v-section-title">Entity Relationship Registry</h2>
              </div>
              
              <div className="overflow-x-auto v-card">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th className="p-4 text-sm font-bold uppercase tracking-wider text-amber-400">Entity</th>
                      <th className="p-4 text-sm font-bold uppercase tracking-wider text-amber-400">Type</th>
                      <th className="p-4 text-sm font-bold uppercase tracking-wider text-amber-400">Relationship</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: 'var(--color-text-secondary)' }}>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 font-semibold text-white">SufiPulse</td>
                      <td className="p-4">Organization</td>
                      <td className="p-4"><span className="v-status v-status--verified"><span className="v-status-dot" />Root Entity</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 font-semibold text-white">SufiPulse-USA</td>
                      <td className="p-4">YouTube Channel</td>
                      <td className="p-4"><span className="v-status v-status--verified"><span className="v-status-dot" />Official Channel</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 font-semibold text-white">SufiTube</td>
                      <td className="p-4">Media Brand</td>
                      <td className="p-4"><span className="v-status v-status--verified"><span className="v-status-dot" />Internal Brand</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 font-semibold text-white">SufiPulse Studio</td>
                      <td className="p-4">Production Infrastructure</td>
                      <td className="p-4"><span className="v-status v-status--verified"><span className="v-status-dot" />Internal Brand</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 font-semibold text-white">Writers</td>
                      <td className="p-4">Contributor Group</td>
                      <td className="p-4"><span className="v-status v-status--verified"><span className="v-status-dot" />Division</span></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td className="p-4 font-semibold text-white">Releases</td>
                      <td className="p-4">Content Registry</td>
                      <td className="p-4"><span className="v-status v-status--verified"><span className="v-status-dot" />Division</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </PageContainer>
        </Section>
      </div>
    </>
  );
}
