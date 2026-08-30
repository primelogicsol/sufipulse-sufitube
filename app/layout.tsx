import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ScrollToTop } from "@/app/components/navigation/ScrollToTop";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SufiPulse — Sacred Sufi Music, Poetry & Kalam",
    template: "%s | SufiPulse",
  },
  description: "SufiPulse is the premier platform for authentic Sufi music, sacred poetry (kalam), and literary works from Kashmir and the Indian Subcontinent. Discover devotional releases, connect with writers, vocalists, and producers.",
  keywords: [
    "Sufi music", "Sufi poetry", "kalam", "qawwali", "Kashmir music",
    "Islamic devotional music", "Sufi literature", "sacred music India",
    "Urdu poetry", "Persian poetry", "Sufi artists", "SufiPulse",
    "devotional music", "spiritual music", "mystic poetry",
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
    url: BASE_URL,
    siteName: "SufiPulse",
    title: "SufiPulse — Sacred Sufi Music, Poetry & Kalam",
    description: "The premier platform for authentic Sufi music, sacred poetry, and literary works from Kashmir and the Indian Subcontinent.",
    images: [
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
    title: "SufiPulse — Sacred Sufi Music, Poetry & Kalam",
    description: "The premier platform for authentic Sufi music, sacred poetry, and literary works from Kashmir and the Indian Subcontinent.",
    images: ["/og?title=Sacred+Sufi+Music+%26+Poetry&subtitle=Discover+kalam%2C+qawwali+and+Sufi+literature"],
    creator: "@sufipulse",
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "music",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/icon.svg',
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },
  manifest: '/site.webmanifest',
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "SufiPulse",
  url: BASE_URL,
  logo: `${BASE_URL}/sufipulse-logo-v5.png`,
  description: "The premier platform for authentic Sufi music, sacred poetry, and literary works from Kashmir and the Indian Subcontinent.",
  founder: {
    "@type": "Person",
    "@id": `${BASE_URL}/#founder`,
    name: "Dr. Fayaz Khan"
  },
  foundingLocation: {
    "@type": "Place",
    name: "Virginia, USA",
  },
  areaServed: ["US", "IN", "GB", "CA", "AE"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: `${BASE_URL}/contact`,
  },
  // sameAs: ONLY genuinely verified and controlled properties.
  // Unconfirmed social handles (Facebook, Instagram, X, LinkedIn) removed until
  // account ownership/control can be demonstrated. Re-add with confirmed URLs only.
  sameAs: [
    "https://www.youtube.com/@SufiPulse-USA",
    "https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ",
    "https://dkf.sufisciencecenter.info",
    `${BASE_URL}/verification`,
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
    "@id": `${BASE_URL}/#organization`
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${BASE_URL}/#website`,
  name: "SufiPulse",
  url: BASE_URL,
  description: "Sacred Sufi music, poetry, and literary works from Kashmir and the Indian Subcontinent.",
  publisher: {
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`
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
        {/* DIAGNOSTIC BOOT SCRIPT — runs before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){
  if('scrollRestoration'in history) history.scrollRestoration='manual';

  var t0 = performance.now();
  function ms(){ return (performance.now()-t0).toFixed(1)+'ms'; }
  function snap(){
    return {
      scrollY: window.scrollY,
      docH: document.documentElement.scrollHeight,
      navType: (performance.getEntriesByType('navigation')[0]||{}).type||'?',
      hash: location.hash||'none',
      sr: history.scrollRestoration,
      active: (document.activeElement&&document.activeElement!==document.body)
        ? document.activeElement.tagName+'#'+(document.activeElement.id||'')
        : 'body',
    };
  }

  console.log('[BOOT] script start', ms(), snap());

  window.addEventListener('scroll', function(){ console.log('[BOOT SCROLL]', ms(), 'scrollY='+window.scrollY, 'docH='+document.documentElement.scrollHeight); }, {passive:true, capture:true});
  document.addEventListener('focusin', function(e){ console.log('[BOOT FOCUS]', ms(), e.target&&(e.target.tagName+'#'+(e.target.id||'.'+(e.target.className||'').toString().slice(0,20)))); });

  document.addEventListener('DOMContentLoaded', function(){ console.log('[BOOT] DOMContentLoaded', ms(), snap()); });
  window.addEventListener('pageshow', function(e){ console.log('[BOOT] pageshow persisted='+e.persisted, ms(), snap()); });
  window.addEventListener('load', function(){ console.log('[BOOT] load', ms(), snap()); });

  [50,100,200,400,600,900,1200,1600,2000].forEach(function(d){
    setTimeout(function(){ console.log('[BOOT] T+'+d+'ms', snap()); }, d);
  });
})();` }} />
        <Script
          defer
          data-domain="sufipulse.com"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        <ScrollToTop />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
