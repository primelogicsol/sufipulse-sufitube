import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ScrollToTop } from "@/app/components/navigation/ScrollToTop";
import { OrganicDiscoveryTracker } from "@/app/components/seo/OrganicDiscoveryTracker";

// Canonical authority always resolves to https://sufipulse.com (non-www).
const BASE_URL = 'https://sufipulse.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SufiPulse (Sufi Pulse) — Official Website | SufiPulse USA & SufiTube",
    template: "%s | SufiPulse",
  },
  description: "SufiPulse.com is the official website of SufiPulse (Sufi Pulse), SufiPulse USA, SufiPulse Studio USA, and SufiTube (Sufi Tube) — discover original full-length Sufi music, sacred kalam, mystical poetry, and verified releases.",
  keywords: [
    "SufiPulse", "Sufi Pulse", "SufiPulse.com", "SufiPulse USA", "SufiPulse Studio USA",
    "SufiTube", "Sufi Tube", "Sufi music", "Sufi poetry", "kalam", "qawwali", "Kashmir music",
    "Islamic devotional music", "Sufi literature", "Urdu poetry", "Persian poetry",
    "Sufi artists", "devotional music", "spiritual music", "mystic poetry",
  ],
  authors: [{ name: "SufiPulse", url: BASE_URL }],
  creator: "SufiPulse",
  publisher: "Prime Logic Solutions LLC",
  applicationName: "SufiPulse",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SufiPulse",
    title: "SufiPulse (Sufi Pulse) — Official Website | SufiPulse USA & SufiTube",
    description: "SufiPulse.com is the official website of SufiPulse (Sufi Pulse), SufiPulse USA, SufiPulse Studio USA, and SufiTube (Sufi Tube) — original Sufi music, sacred kalam, and mystical poetry.",
    images: [
      {
        url: "/banner1.png",
        width: 1672,
        height: 941,
        alt: "SufiPulse Studio — Sacred Music & Recording Sessions",
      },
      {
        url: "/og?title=Sacred+Sufi+Music+%26+Poetry&subtitle=Discover+kalam%2C+qawwali+and+Sufi+literature",
        width: 1200,
        height: 630,
        alt: "SufiPulse — Sacred Sufi Music & Poetry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SufiPulse (Sufi Pulse) — Official Website | SufiPulse USA & SufiTube",
    description: "SufiPulse.com is the official website of SufiPulse (Sufi Pulse), SufiPulse USA, SufiPulse Studio USA, and SufiTube (Sufi Tube).",
    images: ["/banner1.png"],
  },
  category: "music",
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : {}),
    ...(process.env.BING_SITE_VERIFICATION
      ? { other: { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } }
      : {}),
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=20261118', sizes: 'any' },
      { url: '/icon.svg?v=20261118', type: 'image/svg+xml' },
      { url: '/favicon-48x48.png?v=20261118', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-32x32.png?v=20261118', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png?v=20261118', type: 'image/png', sizes: '16x16' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=20261118', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=20261118',
    other: [
      { rel: 'manifest', url: '/site.webmanifest?v=20261118' },
    ],
  },
  manifest: '/site.webmanifest?v=20261118',
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": ["Organization", "MusicGroup"],
  "@id": "https://sufipulse.com/#organization",
  name: "SufiPulse",
  legalName: "SufiPulse USA",
  alternateName: [
    "Sufi Pulse",
    "SufiPulse USA",
    "SufiPulse Studio USA",
    "SufiTube",
    "Sufi Tube",
    "SufiPulse.com",
  ],
  url: BASE_URL,
  mainEntityOfPage: `${BASE_URL}/official-identity`,
  logo: {
    "@type": "ImageObject",
    url: `${BASE_URL}/brand/sufipulse-master-logo-512.png`,
    width: 512,
    height: 512,
  },
  description: "SufiPulse (also searched as Sufi Pulse) is the official institutional and creative media platform at SufiPulse.com for original Sufi music, sacred kalam, mystical poetry, and cultural heritage, operating through SufiPulse USA, SufiPulse Studio USA, and SufiTube (Sufi Tube).",
  founder: {
    "@type": "Person",
    "@id": `${BASE_URL}/#founder`,
    name: "Dr. Fayaz Khan"
  },
  foundingLocation: {
    "@type": "Place",
    name: "Virginia, USA",
  },
  brand: [
    {
      "@type": "Brand",
      name: "SufiPulse",
      alternateName: "Sufi Pulse",
      url: BASE_URL,
      description: "Institutional and creative media identity of SufiPulse at SufiPulse.com.",
    },
    {
      "@type": "Brand",
      name: "SufiPulse USA",
      url: `${BASE_URL}/official-identity`,
      description: "Official public music and distribution identity of SufiPulse.",
    },
    {
      "@type": "Brand",
      name: "SufiPulse Studio USA",
      url: `${BASE_URL}/studio`,
      description: "Production and creative studio identity of SufiPulse.",
    },
    {
      "@type": "Brand",
      name: "SufiTube",
      alternateName: "Sufi Tube",
      url: `${BASE_URL}/sufitube`,
      description: "Official video and sacred-media publishing identity of SufiPulse USA.",
    },
  ],
  subOrganization: [
    {
      "@type": "Organization",
      name: "SufiPulse USA",
      url: `${BASE_URL}/official-identity`,
    },
    {
      "@type": "Organization",
      name: "SufiPulse Studio USA",
      url: `${BASE_URL}/studio`,
    },
    {
      "@type": "Organization",
      name: "SufiTube",
      alternateName: "Sufi Tube",
      url: `${BASE_URL}/sufitube`,
    },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${BASE_URL}/contact`,
  },
  sameAs: [
    "https://sufipulse.com/official-identity",
    "https://sufipulse.com/verification",
    "https://sufipulse.com/sufitube",
    "https://www.youtube.com/@SufiPulse-USA",
    "https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ",
    "https://www.instagram.com/sufipulseusa/",
    "https://www.facebook.com/profile.php?id=61591758150138",
    "https://www.facebook.com/groups/1100263345262190",
    "https://dkf.sufisciencecenter.info",
  ],
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${BASE_URL}/#founder`,
  name: "Dr. Fayaz Khan",
  url: BASE_URL,
  jobTitle: "Founder",
  worksFor: {
    "@type": "Organization",
    "@id": "https://sufipulse.com/#organization"
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: "SufiPulse",
  alternateName: [
    "Sufi Pulse",
    "SufiPulse USA",
    "SufiPulse.com",
    "SufiPulse Studio USA",
    "SufiTube",
    "Sufi Tube",
  ],
  url: BASE_URL,
  inLanguage: ["en", "ur", "ur-Latn", "hi"],
  image: `${BASE_URL}/banner1.png`,
  description: "Official website of SufiPulse (Sufi Pulse), SufiPulse USA, SufiPulse Studio USA, and SufiTube (Sufi Tube) — original full-length Sufi music, sacred kalam, and mystical poetry.",
  publisher: {
    "@type": "Organization",
    "@id": "https://sufipulse.com/#organization"
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/releases?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0F172A" />
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="SufiPulse (Sufi Pulse)"
          href="/opensearch.xml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* Pre-hydration scroll reset — runs synchronously before React boots.
            Contract:
              navigate / reload + no hash  → force scrollY = 0
              back_forward                 → leave alone (ScrollToTop SPA manager restores)
              any hash                     → leave alone (browser anchor handling)
        */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){
  if('scrollRestoration'in history) history.scrollRestoration='manual';

  var nav=performance.getEntriesByType('navigation')[0];
  var navType=nav?nav.type:'navigate';
  var shouldTop=!location.hash && navType!=='back_forward';

  if(shouldTop){
    var reset=function(){
      window.scrollTo(0,0);
      document.documentElement.scrollTop=0;
      document.body.scrollTop=0;
    };
    reset();
    // pageshow fires after bfcache restore; only reset when NOT a bfcache hit.
    window.addEventListener('pageshow',function(e){
      if(!e.persisted) reset();
    },{once:true});
  }
})();` }} />
        <Script
          defer
          data-domain="sufipulse.com"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        <ScrollToTop />
        <OrganicDiscoveryTracker />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
