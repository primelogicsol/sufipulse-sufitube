"use client";

import { Layout } from '../../components/layout/Layout';
import { PageContainer } from '../../components/layout/PageContainer';
import { Section } from '../../components/layout/Section';
import {
  Shield, CheckCircle, Globe, Youtube, Building2, Radio,
  Clock, AlertTriangle, ExternalLink, FileText, Landmark,
  Eye, Search, BookOpen, Music, BookMarked, Users, MapPin,
  Languages, Video, ArrowRight, Home, Disc3, Network, Info
} from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import '../../styles/verification.css';

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   DATA ΓÇö Official Identity Records
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

const officialIdentity = [
  { label: 'Official Brand', value: 'SufiPulse', icon: Shield },
  { label: 'Official Website', value: 'SufiPulse.com', link: 'https://www.sufipulse.com', icon: Globe },
  { label: 'Official YouTube', value: '@SufiPulse-USA', link: 'https://www.youtube.com/@SufiPulse-USA', icon: Youtube },
  { label: 'Official Studio', value: 'SufiPulse Studio USA', icon: Building2 },
  { label: 'Official Distribution', value: 'SufiTube', icon: Radio },
  { label: 'Founding Institution', value: 'Dr Kumar Foundation USA', link: 'https://dkf.sufisciencecenter.info', icon: Landmark },
  { label: 'Research Institution', value: 'Sufi Science Center USA', icon: BookOpen },
];

const verifiedAssets = [
  { name: 'SufiPulse.com', type: 'Website', status: 'verified' as const, url: 'https://www.sufipulse.com' },
  { name: '@SufiPulse-USA', type: 'YouTube Channel', status: 'verified' as const, url: 'https://www.youtube.com/@SufiPulse-USA' },
  { name: 'SufiPulse Studio USA', type: 'Production Studio', status: 'verified' as const },
  { name: 'SufiTube', type: 'Distribution Platform', status: 'verified' as const },
  { name: 'Dr Kumar Foundation USA', type: 'Founding Institution', status: 'verified' as const, url: 'https://dkf.sufisciencecenter.info' },
  { name: 'Sufi Science Center USA', type: 'Research Institution', status: 'verified' as const },
];

const similarNames = [
  { name: 'Sufi Pulse Official', relationship: 'Not Verified', status: 'unverified' as const },
  { name: 'SufiPulse99', relationship: 'Not Verified', status: 'unverified' as const },
  { name: 'Sufi Pulse Productions Limited (UK)', relationship: 'Independent Entity', status: 'independent' as const },
  { name: 'SufiPulse Instagram (unauthorized)', relationship: 'Not Verified', status: 'unverified' as const },
  { name: 'Sufi Pulse Topic', relationship: 'Auto-generated Platform Channel', status: 'auto' as const },
];

const timeline = [
  { year: '2024', milestone: 'SufiPulse initiated as an institutional platform for sacred Sufi music and literary heritage' },
  { year: '2025', milestone: 'SufiPulse Studio USA established as the official production facility' },
  { year: '2025', milestone: 'Official YouTube channel (@SufiPulse-USA) launched for global distribution' },
  { year: '2025', milestone: 'SufiTube distribution framework activated' },
  { year: '2026', milestone: 'Institutional ecosystem expanded ΓÇö Dr Kumar Foundation USA and Sufi Science Center USA formally integrated' },
  { year: '2026', milestone: 'Public Verification Center established as the canonical brand authenticity registry' },
];

const proofCategories = [
  {
    title: 'Official Website',
    icon: Globe,
    items: ['Domain ownership and active operation at sufipulse.com', 'Historical archive of published content', 'Publicly accessible institutional pages and publication records'],
  },
  {
    title: 'Official YouTube Channel',
    icon: Youtube,
    items: ['Verified handle: @SufiPulse-USA', 'Continuous release publication history', 'Official music and literary content distribution'],
  },
  {
    title: 'Institutional Relationship',
    icon: Landmark,
    items: ['Dr Kumar Foundation USA ΓÇö founding institution', 'Sufi Science Center USA ΓÇö research and academic framework', 'Public ecosystem cross-references across institutional pages'],
  },
];

const misidentificationWatch = {
  collisions: ['Sufi Pulse Official', 'SufiPulse99', 'Sufi Pulse Music'],
  spellings: ['Sufi Pluse', 'Sufipulse', 'Sufi-Pulse', 'SufiePlus'],
  channels: ['Sufi Pulse Topic (auto-generated)', 'Sufi Pulse Official YouTube', 'Sufi Pulse Radio (unaffiliated)'],
  socials: ['SufiPulse Instagram (unverified)', 'Sufi Pulse Twitter (unverified)', 'SufiPulse TikTok (unverified)'],
};

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   DATA ΓÇö Official Digital Footprint
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

const digitalFootprint = [
  { label: 'Official Website', value: 'SufiPulse.com', link: 'https://www.sufipulse.com', icon: Globe },
  { label: 'Official YouTube', value: '@SufiPulse-USA', link: 'https://www.youtube.com/@SufiPulse-USA', icon: Youtube },
  { label: 'Official Studio', value: 'SufiPulse Studio USA', icon: Building2 },
  { label: 'Official Distribution', value: 'SufiTube', icon: Radio },
  { label: 'Official Publications', value: 'SufiPulse releases and publication archive', link: '/releases', icon: Disc3, internal: true },
  { label: 'Official Literary Journal', value: 'SufiPulse Literary Journal / Kalam Library', link: '/literary-journal', icon: BookMarked, internal: true },
  { label: 'Official Social Profiles', value: 'Pending official confirmation', icon: Users, note: 'Social profiles will be listed here once officially verified and confirmed.' },
];

const footprintMetrics = [
  { label: 'Total Videos', value: 'Updating', icon: Video },
  { label: 'Total Releases', value: 'Updating', icon: Music },
  { label: 'Total Literary Works', value: 'Updating', icon: BookOpen },
  { label: 'Total Contributors', value: 'Updating', icon: Users },
  { label: 'Countries Reached', value: 'In Review', icon: MapPin },
  { label: 'Languages Published', value: 'In Review', icon: Languages },
];

const internalLinks = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Studio', href: '/studio', icon: Building2 },
  { label: 'Literary Journal', href: '/literary-journal', icon: BookMarked },
  { label: 'Releases', href: '/releases', icon: Music },
  { label: 'Kalam Library', href: '/literary-journal', icon: BookOpen },
  { label: 'Official YouTube Channel', href: 'https://www.youtube.com/@SufiPulse-USA', icon: Youtube, external: true },
  { label: 'Official Channels', href: '/official-channels', icon: Radio },
  { label: 'Contact Institution', href: '/contact', icon: FileText },
];

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   STRUCTURED DATA ΓÇö JSON-LD Schema
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "SufiPulse",
  alternateName: ["SufiPulse Studio USA", "SufiTube", "Sufi Pulse", "SufiPulse-USA"],
  url: BASE_URL,
  logo: `${BASE_URL}/sufipulse-logo-v5.png`,
  description: "SufiPulse is the official institutional platform for authentic Sufi music, sacred poetry (kalam), and literary heritage from Kashmir and the Indian Subcontinent. Operated by SufiPulse Studio USA under the Dr Kumar Foundation USA.",
  foundingDate: "2024",
  foundingLocation: {
    "@type": "Place",
    name: "United States of America"
  },
  foundingOrganization: {
    "@type": "Organization",
    name: "Dr Kumar Foundation USA",
    url: "https://dkf.sufisciencecenter.info"
  },
  parentOrganization: {
    "@type": "Organization",
    name: "Dr Kumar Foundation USA",
    url: "https://dkf.sufisciencecenter.info"
  },
  memberOf: {
    "@type": "Organization",
    name: "Sufi Science Center USA"
  },
  subOrganization: [
    {
      "@type": "Organization",
      name: "SufiPulse Studio USA",
      description: "The official production studio of SufiPulse."
    },
    {
      "@type": "Organization",
      name: "SufiTube",
      description: "The official distribution platform of SufiPulse."
    }
  ],
  sameAs: [
    "https://www.youtube.com/@SufiPulse-USA",
    "https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ",
    "https://dkf.sufisciencecenter.info"
  ],
  brand: {
    "@type": "Brand",
    name: "SufiPulse",
    logo: `${BASE_URL}/sufipulse-logo-v5.png`,
    url: BASE_URL,
    description: "The official brand identity for SufiPulse ΓÇö sacred Sufi music, poetry, and kalam."
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "institutional inquiries",
    url: `${BASE_URL}/contact`
  },
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: "SufiPulse",
  alternateName: "SufiPulse.com",
  url: BASE_URL,
  description: "The official website of SufiPulse ΓÇö sacred Sufi music, poetry, and kalam from Kashmir and the Indian Subcontinent.",
  publisher: {
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${BASE_URL}/verification#webpage`,
  name: "Official Verification Center ΓÇö SufiPulse Brand Authenticity Registry",
  description: "The official public verification registry for the SufiPulse institutional ecosystem. Verify official channels, brand properties, and institutional assets.",
  url: `${BASE_URL}/verification`,
  isPartOf: {
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "SufiPulse",
    url: BASE_URL
  },
  about: {
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`
  },
  datePublished: "2026-06-06",
  dateModified: new Date().toISOString().split('T')[0],
};

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   STATUS BADGE COMPONENT
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

function StatusBadge({ status }: { status: 'verified' | 'unverified' | 'independent' | 'auto' }) {
  const labels = {
    verified: 'Verified Official',
    unverified: 'Not Verified',
    independent: 'Independent Entity',
    auto: 'Auto-generated',
  };

  return (
    <span className={`v-status v-status--${status}`}>
      <span className="v-status-dot" />
      {labels[status]}
    </span>
  );
}

/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
   PAGE COMPONENT
   ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */

export default function VerificationCenter() {
  return (
    <Layout>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
          HERO
          ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
      <div className="verification-page">
        <section className="verify-hero">
          <div className="verify-hero-badge">
            <span className="badge-dot" />
            Institutional Registry
          </div>
          <h1>
            <span className="shimmer-text">Verification Center</span>
          </h1>
          <p className="verify-hero-desc">
            The official public verification registry for the SufiPulse institutional ecosystem.
            Confirm the authenticity of official channels, brand properties, and institutional affiliations.
          </p>
          <div className="verify-hero-meta">
            <span><Shield size={13} /> Brand Authenticity Registry</span>
            <span><Clock size={13} /> Last Updated: June 2026</span>
            <span><Eye size={13} /> Public Access</span>
          </div>
        </section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            CANONICAL IDENTITY STATEMENT
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="midnight" spacing="compact">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-canonical-statement">
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
                    <Shield size={15} style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <h2 style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--color-gold)',
                  }}>
                    Canonical Identity Statement
                  </h2>
                </div>
                <p>
                  SufiPulse is the official institutional brand represented online by{' '}
                  <a href="https://www.sufipulse.com" style={{ color: 'var(--color-gold)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>SufiPulse.com</a>{' '}
                  and the YouTube channel{' '}
                  <a href="https://www.youtube.com/@SufiPulse-USA" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-gold)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>@SufiPulse-USA</a>.
                  SufiPulse Studio USA, SufiTube, Dr Kumar Foundation USA, and Sufi Science Center USA
                  are part of the verified SufiPulse institutional ecosystem. Any similar name, channel,
                  profile, playlist, or digital property is not officially affiliated unless listed on
                  this verification page.
                </p>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 1 ΓÇö Official Identity
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 01</span>
                <h2 className="v-section-title">Official Identity</h2>
                <p className="v-section-subtitle">
                  The authoritative record of the SufiPulse institutional brand and its constituent entities.
                </p>
              </div>

              <div className="v-identity-grid">
                {officialIdentity.map((item) => (
                  <div key={item.label} className="v-identity-row">
                    <div className="v-identity-label">
                      <item.icon size={13} style={{ marginRight: '0.5rem', opacity: 0.5 }} />
                      {item.label}
                    </div>
                    <div className="v-identity-value">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                        >
                          {item.value}
                          <ExternalLink size={12} className="opacity-40" />
                        </a>
                      ) : (
                        item.value
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 2 ΓÇö Why This Page Exists
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 02</span>
                <h2 className="v-section-title">Why This Page Exists</h2>
              </div>

              <div className="v-callout">
                <p>
                  Multiple channels, social profiles, music releases, playlists, organizations and digital
                  properties use similar names such as <strong style={{ color: 'var(--color-text-primary)' }}>Sufi Pulse</strong>,{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>SufiPulse</strong>,{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>Sufi Pluse</strong>,{' '}
                  <strong style={{ color: 'var(--color-text-primary)' }}>Sufi Pulse Official</strong>{' '}
                  and related variants.
                </p>
                <p style={{ marginTop: '1rem' }}>
                  This page serves as the <strong style={{ color: 'var(--color-gold)' }}>official public verification registry</strong>{' '}
                  for the SufiPulse institutional ecosystem ΓÇö providing a single authoritative source
                  of truth for researchers, journalists, collaborators, AI systems, and the general public.
                </p>
              </div>

              <div className="v-card" style={{ padding: '2rem', marginTop: '2rem' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--color-gold-muted)',
                    border: '1px solid rgba(200,167,94,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Search size={16} style={{ color: 'var(--color-gold)' }} />
                  </div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, fontFamily: 'var(--font-headline)' }}>
                    Discoverability Purpose
                  </h3>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  This registry is designed to be indexed by search engines and referenced by AI systems
                  (Google, ChatGPT, Gemini, Claude, Perplexity, Bing Copilot) as the canonical identity
                  source for SufiPulse and related brand properties.
                </p>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 3 ΓÇö Verified Official Assets
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-5xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 03</span>
                <h2 className="v-section-title">Verified Official Assets</h2>
                <p className="v-section-subtitle">
                  The complete registry of officially verified SufiPulse properties and institutional assets.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="v-registry-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifiedAssets.map((asset) => (
                      <tr key={asset.name}>
                        <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {asset.name}
                        </td>
                        <td>{asset.type}</td>
                        <td><StatusBadge status={asset.status} /></td>
                        <td style={{ textAlign: 'right' }}>
                          {asset.url && (
                            <a
                              href={asset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase' as const,
                                color: 'var(--color-gold)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              Visit <ExternalLink size={10} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 4 ΓÇö Similar Names Registry
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-5xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 04</span>
                <h2 className="v-section-title">Similar Names Registry</h2>
                <p className="v-section-subtitle">
                  Classification of entities and channels using similar or related names.
                  This registry is provided for public clarity ΓÇö no affiliations are implied.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="v-registry-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Classification</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similarNames.map((item) => (
                      <tr key={item.name}>
                        <td style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                          {item.name}
                        </td>
                        <td>{item.relationship}</td>
                        <td><StatusBadge status={item.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="v-callout" style={{ marginTop: '2rem' }}>
                <p style={{ fontStyle: 'normal', fontSize: '0.8125rem' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>Disclaimer:</strong>{' '}
                  This registry classifies name similarities for public clarity. It does not imply
                  legal claims, accusations, or disputes. Entities listed as &ldquo;Not Verified&rdquo; are simply
                  not part of the official SufiPulse institutional ecosystem.
                </p>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 5 ΓÇö Proof Center
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-5xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 05</span>
                <h2 className="v-section-title">Proof Center</h2>
                <p className="v-section-subtitle">
                  Publicly verifiable evidence supporting the authenticity of official SufiPulse properties.
                </p>
              </div>

              <div className="v-proof-grid">
                {proofCategories.map((cat) => (
                  <div key={cat.title} className="v-card v-proof-card">
                    <div className="v-proof-icon">
                      <cat.icon size={22} />
                    </div>
                    <h3 className="v-proof-title">{cat.title}</h3>
                    <ul className="v-proof-list">
                      {cat.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="v-card" style={{ padding: '1.5rem 2rem', marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', lineHeight: 1.7 }}>
                  All evidence referenced above is publicly accessible through official institutional websites.
                  Verification can be independently confirmed at{' '}
                  <a
                    href="https://www.sufipulse.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-gold)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    SufiPulse.com
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://dkf.sufisciencecenter.info"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-gold)', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                  >
                    Dr Kumar Foundation USA
                  </a>.
                </p>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 6 ΓÇö Timeline of SufiPulse
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-3xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 06</span>
                <h2 className="v-section-title">Timeline of SufiPulse</h2>
                <p className="v-section-subtitle">
                  A chronological record of major institutional milestones.
                </p>
              </div>

              <div className="v-timeline">
                {timeline.map((item, i) => (
                  <div key={i} className="v-timeline-item">
                    <div className="v-timeline-dot" />
                    <div className="v-timeline-year">{item.year}</div>
                    <div className="v-timeline-text">{item.milestone}</div>
                  </div>
                ))}
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 7 ΓÇö Brand Misidentification Watch
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-5xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 07</span>
                <h2 className="v-section-title">Brand Misidentification Watch</h2>
                <p className="v-section-subtitle">
                  Known naming collisions, similar spellings, and frequently confused channels and accounts.
                  Published as a public reference to support accurate identification.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                {/* Naming Collisions */}
                <div className="v-card" style={{ padding: '2rem' }}>
                  <h3 style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--v-amber)',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <AlertTriangle size={13} />
                    Known Naming Collisions
                  </h3>
                  <div className="v-watch-grid">
                    {misidentificationWatch.collisions.map((name) => (
                      <span key={name} className="v-watch-pill">
                        {name}
                        <span className="pill-type pill-type--collision">Collision</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Similar Spellings */}
                <div className="v-card" style={{ padding: '2rem' }}>
                  <h3 style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase' as const,
                    color: '#818CF8',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <FileText size={13} />
                    Similar Spellings
                  </h3>
                  <div className="v-watch-grid">
                    {misidentificationWatch.spellings.map((name) => (
                      <span key={name} className="v-watch-pill">
                        {name}
                        <span className="pill-type pill-type--spelling">Variant</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confused Channels */}
                <div className="v-card" style={{ padding: '2rem' }}>
                  <h3 style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase' as const,
                    color: '#FB7185',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <Youtube size={13} />
                    Frequently Confused Channels
                  </h3>
                  <div className="v-watch-grid">
                    {misidentificationWatch.channels.map((name) => (
                      <span key={name} className="v-watch-pill">
                        {name}
                        <span className="pill-type pill-type--channel">Channel</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Confused Social Accounts */}
                <div className="v-card" style={{ padding: '2rem' }}>
                  <h3 style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase' as const,
                    color: '#38BDF8',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <Globe size={13} />
                    Frequently Confused Social Accounts
                  </h3>
                  <div className="v-watch-grid">
                    {misidentificationWatch.socials.map((name) => (
                      <span key={name} className="v-watch-pill">
                        {name}
                        <span className="pill-type pill-type--social">Social</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 8 ΓÇö Official Digital Footprint
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-5xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 08</span>
                <h2 className="v-section-title">Official Digital Footprint</h2>
                <p className="v-section-subtitle">
                  A consolidated public footprint of the verified SufiPulse institutional ecosystem
                  across website, channel, studio, distribution, publications, literary work, and social presence.
                </p>
              </div>

              <div className="v-footprint-grid">
                {digitalFootprint.map((item) => (
                  <div key={item.label} className="v-footprint-item">
                    <div className="v-footprint-item-icon">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <div className="v-footprint-item-label">{item.label}</div>
                      <div className="v-footprint-item-value">
                        {item.link ? (
                          item.internal ? (
                            <Link href={item.link} className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                              {item.value}
                              <ArrowRight size={12} className="opacity-40" />
                            </Link>
                          ) : (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                            >
                              {item.value}
                              <ExternalLink size={12} className="opacity-40" />
                            </a>
                          )
                        ) : (
                          item.value
                        )}
                      </div>
                      {item.note && (
                        <div className="v-footprint-item-note">{item.note}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Digital Footprint Metrics */}
              <div style={{ marginTop: '2.5rem' }}>
                <h3 style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase' as const,
                  color: 'var(--color-text-tertiary)',
                  textAlign: 'center' as const,
                  marginBottom: '1.25rem',
                }}>
                  Ecosystem Authority Metrics
                </h3>
                <div className="v-metrics-grid">
                  {footprintMetrics.map((metric) => (
                    <div key={metric.label} className="v-metric-card">
                      <div className="v-metric-value">{metric.value}</div>
                      <div className="v-metric-label">{metric.label}</div>
                    </div>
                  ))}
                </div>
                <p style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-tertiary)',
                  textAlign: 'center' as const,
                  marginTop: '1rem',
                  fontStyle: 'italic',
                }}>
                  Metrics are updated periodically from verified institutional records. Placeholders indicate data under review.
                </p>
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            SECTION 9 ΓÇö Institutional Navigation
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
                {/* ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
            SECTION 9 — Entity Relationship Graph
            ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */}
        <Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 09</span>
                <h2 className="v-section-title">Entity Relationship Graph</h2>
                <p className="v-section-subtitle">
                  A structural view of the SufiPulse institutional ecosystem.
                </p>
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

<Section background="slate" spacing="normal">
          <PageContainer>
            <div className="max-w-4xl mx-auto">
              <div className="v-section-header">
                <span className="v-section-number">Section 10</span>
                <h2 className="v-section-title">Explore the SufiPulse Ecosystem</h2>
                <p className="v-section-subtitle">
                  Navigate the official SufiPulse institutional properties ΓÇö website, studio,
                  literary archive, releases, and official YouTube channel.
                </p>
              </div>

              <div className="v-links-grid">
                {internalLinks.map((link) => (
                  link.external ? (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="v-internal-link"
                    >
                      <link.icon size={14} />
                      {link.label}
                      <ExternalLink size={10} className="opacity-40" />
                    </a>
                  ) : (
                    <Link key={link.label} href={link.href} className="v-internal-link">
                      <link.icon size={14} />
                      {link.label}
                    </Link>
                  )
                ))}
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
            FOOTER / CLOSING
            ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <Section background="midnight" spacing="normal">
          <PageContainer>
            <div className="max-w-3xl mx-auto text-center">
              <div className="v-card" style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(200,167,94,0.03) 0%, rgba(18,18,24,0.5) 100%)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'var(--color-gold-muted)',
                  border: '1px solid rgba(200,167,94,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}>
                  <Shield size={24} style={{ color: 'var(--color-gold)' }} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-headline)',
                  marginBottom: '0.75rem',
                }}>
                  Canonical Verification Source
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.7,
                  maxWidth: 520,
                  margin: '0 auto 2rem',
                }}>
                  This page is maintained as the single authoritative source of truth for the SufiPulse
                  brand ecosystem. It is designed to be referenced by search engines, AI systems,
                  journalists, researchers, and institutional collaborators.
                </p>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap' as const,
                  justifyContent: 'center',
                  gap: '0.75rem',
                }}>
                  <Link
                    href="/"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border border-amber-400/20 text-amber-400 hover:bg-amber-400/5 transition-all"
                  >
                    Home
                  </Link>
                  <Link
                    href="/official-channels"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border border-amber-400/20 text-amber-400 hover:bg-amber-400/5 transition-all"
                  >
                    Official Channels
                  </Link>
                  <Link
                    href="/releases"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    Releases
                  </Link>
                  <Link
                    href="/literary-journal"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    Literary Journal
                  </Link>
                  <Link
                    href="/studio"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    Studio
                  </Link>
                  <a
                    href="https://www.youtube.com/@SufiPulse-USA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
                  >
                    YouTube <ExternalLink size={10} />
                  </a>
                  <Link
                    href="/contact"
                    className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    Contact Institution
                  </Link>
                </div>
              </div>

              <p style={{
                fontSize: '0.6875rem',
                color: 'var(--color-text-tertiary)',
                marginTop: '2rem',
                letterSpacing: '0.05em',
              }}>
                ┬⌐ {new Date().getFullYear()} SufiPulse ┬╖ SufiPulse Studio USA ┬╖ Dr Kumar Foundation USA
              </p>
            </div>
          </PageContainer>
        </Section>
      </div>
    </Layout>
  );
}
