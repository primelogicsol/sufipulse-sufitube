"use client";

import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import {
  Shield, Globe, Youtube, Building2, Radio,
  Clock, Eye, Search, BookOpen, Landmark,
  Users, MapPin, CheckCircle, Network, Info
} from 'lucide-react';
import Link from 'next/link';
import '../../styles/verification.css';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "SufiPulse",
  alternateName: ["SufiPulse Studio USA", "SufiTube", "Sufi Pulse", "SufiPulse-USA"],
  url: BASE_URL,
  logo: `${BASE_URL}/sufipulse-logo-v5.png`,
  description: "SufiPulse is the official institutional platform for authentic Sufi music, sacred poetry (kalam), and literary heritage from Kashmir and the Indian Subcontinent.",
  founder: {
    "@type": "Person",
    "@id": `${BASE_URL}/#founder`,
    name: "Dr. Fayaz Khan"
  },
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    name: "Virginia, USA"
  },
  sameAs: [
    "https://www.youtube.com/@SufiPulse-USA",
    "https://www.facebook.com/SufiPulse",
    "https://www.instagram.com/SufiPulse",
    "https://twitter.com/SufiPulse",
    "https://www.linkedin.com/company/sufipulse"
  ],
};

export default function VerificationCenter() {
  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <div className="verification-page">
        {/* HERO */}
        <section className="verify-hero">
          <div className="verify-hero-badge">
            <span className="badge-dot" />
            Institutional Registry
          </div>
          <h1>
            <span className="shimmer-text">Official Verification & Entity Registry</span>
          </h1>
          <p className="verify-hero-desc">
            The canonical authority page for the SufiPulse institutional ecosystem. Verify official channels, brand properties, and institutional assets.
          </p>
          <div className="verify-hero-meta">
            <span><Shield size={13} /> Brand Authenticity Registry</span>
            <span><Clock size={13} /> Last Updated: June 2026</span>
            <span><Eye size={13} /> Public Access</span>
          </div>
        </section>

        {/* ENTITY */}
        <Section background="midnight" spacing="compact">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 01</span>
                <h2 className="v-section-title">Entity</h2>
              </div>
              <div className="v-card" style={{ padding: '2rem' }}>
                <ul className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                  <li><strong style={{ color: 'var(--color-text-primary)' }}>Official Name:</strong> SufiPulse</li>
                  <li><strong style={{ color: 'var(--color-text-primary)' }}>Entity Type:</strong> Cultural Media Institution</li>
                  <li><strong style={{ color: 'var(--color-text-primary)' }}>Headquarters:</strong> Virginia, USA</li>
                  <li><strong style={{ color: 'var(--color-text-primary)' }}>Founder:</strong> Dr. Fayaz Khan</li>
                  <li><strong style={{ color: 'var(--color-text-primary)' }}>Website:</strong> SufiPulse.com</li>
                </ul>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* OFFICIAL CHANNELS & BRANDS */}
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              
              <div>
                <div className="v-section-header" style={{ marginBottom: '1.5rem' }}>
                  <span className="v-section-number">Section 02</span>
                  <h2 className="v-section-title" style={{ fontSize: '1.5rem' }}>Official Channels</h2>
                </div>
                <div className="v-card" style={{ padding: '2rem' }}>
                  <ul className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                    <li className="flex items-center gap-3"><Youtube size={16} className="text-red-500" /> SufiPulse-USA (YouTube)</li>
                    <li className="flex items-center gap-3"><Globe size={16} className="text-blue-500" /> Facebook</li>
                    <li className="flex items-center gap-3"><Globe size={16} className="text-pink-500" /> Instagram</li>
                    <li className="flex items-center gap-3"><Globe size={16} /> X</li>
                    <li className="flex items-center gap-3"><Users size={16} className="text-blue-400" /> LinkedIn</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="v-section-header" style={{ marginBottom: '1.5rem' }}>
                  <span className="v-section-number">Section 03</span>
                  <h2 className="v-section-title" style={{ fontSize: '1.5rem' }}>Official Brands</h2>
                </div>
                <div className="v-card" style={{ padding: '2rem' }}>
                  <ul className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                    <li className="flex items-center gap-3"><Shield size={16} className="text-amber-400" /> SufiPulse</li>
                    <li className="flex items-center gap-3"><Radio size={16} className="text-amber-400" /> SufiTube</li>
                    <li className="flex items-center gap-3"><Building2 size={16} className="text-amber-400" /> SufiPulse Studio</li>
                  </ul>
                </div>
              </div>

            </div>
          </PageContainer>
        </Section>

        {/* OFFICIAL DOMAINS & EXTENSIONS */}
        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              
              <div>
                <div className="v-section-header" style={{ marginBottom: '1.5rem' }}>
                  <span className="v-section-number">Section 04</span>
                  <h2 className="v-section-title" style={{ fontSize: '1.5rem' }}>Official Domains</h2>
                </div>
                <div className="v-card" style={{ padding: '2rem' }}>
                  <ul className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                    <li className="flex items-center gap-3"><Globe size={16} className="text-amber-400" /> sufipulse.com</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="v-section-header" style={{ marginBottom: '1.5rem' }}>
                  <span className="v-section-number">Section 05</span>
                  <h2 className="v-section-title" style={{ fontSize: '1.5rem' }}>Institutional Extensions</h2>
                </div>
                <div className="v-card" style={{ padding: '2rem' }}>
                  <ul className="space-y-4" style={{ color: 'var(--color-text-secondary)' }}>
                    <li className="flex items-center gap-3"><BookOpen size={16} /> Sufi Science Center USA</li>
                    <li className="flex items-center gap-3"><Landmark size={16} /> Dr. Kumar Foundation USA</li>
                    <li className="flex items-center gap-3"><CheckCircle size={16} /> Purple Soul Collective USA</li>
                    <li className="flex items-center gap-3"><Building2 size={16} /> Prime Logic Solutions USA</li>
                  </ul>
                </div>
              </div>

            </div>
          </PageContainer>
        </Section>

        {/* ENTITY RELATIONSHIP GRAPH */}
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 06</span>
                <h2 className="v-section-title">Entity Relationship Graph</h2>
              </div>
              <div className="v-card overflow-x-auto" style={{ padding: '2rem', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>
                <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
{`SufiPulse
│
├── SufiPulse-USA
├── SufiTube
├── SufiPulse Studio
├── Governance
├── Writers
├── Vocalists
├── Producers
├── Literary Contributors
├── Studio
└── Releases`}
                </pre>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* OFFICIAL NOTICE */}
        <Section background="midnight" spacing="compact">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-canonical-statement" style={{ borderLeftColor: 'var(--color-gold)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--color-gold-muted)',
                    border: '1px solid rgba(200,167,94,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Info size={15} style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <h2 style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    color: 'var(--color-gold)',
                  }}>
                    Official Notice
                  </h2>
                </div>
                <p>
                  Only entities, channels, domains, brands, and profiles listed on this page are official representations of SufiPulse.
                </p>
              </div>
            </div>
          </PageContainer>
        </Section>

      </div>
    </Layout>
  );
}
