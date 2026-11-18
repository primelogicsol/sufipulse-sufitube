import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ScrollToTop } from "@/app/components/navigation/ScrollToTop";

// Production canonical identity must not inherit a localhost or preview URL.
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const BASE_URL = IS_PRODUCTION ? 'https://sufipulse.com' : (process.env.NEXT_PUBLIC_APP_URL || 'https://sufipulse.com');

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SufiPulse USA | Sacred Sufi Music, Poetry & Kalam",
    template: "%s | SufiPulse USA",
  },
  description: "Discover original Sufi music, mystical poetry and Kashmiri kalam from SufiPulse USA. Watch full-length recordings and explore sacred music, lyrics and cultural heritage.",
  keywords: [
    "Sufi music", "Sufi poetry", "kalam", "qawwali", "Kashmir music",
    "Islamic devotional music", "Sufi literature", "sacred music India",
    "Urdu poetry", "Persian poetry", "Sufi artists", "SufiPulse", "Sufi Pulse", "SufiPulse USA", "SufiPulse.com",
    "devotional music", "spiritual music", "mystic poetry",
  ],
  authors: [{ name: "SufiPulse USA", url: BASE_URL }],
  creator: "SufiPulse USA",
  publisher: "Prime Logic Solutions LLC",
  applicationName: "SufiPulse USA",
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
    siteName: "SufiPulse USA",
    title: "SufiPulse USA | Sacred Sufi Music, Poetry & Kalam",
    description: "Discover original Sufi music, mystical poetry and Kashmiri kalam from SufiPulse USA. Watch full-length recordings and explore sacred music, lyrics and cultural heritage.",
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
        alt: "SufiPulse USA — Sacred Sufi Music & Poetry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SufiPulse USA | Sacred Sufi Music, Poetry & Kalam",
    description: "Discover original Sufi music, mystical poetry and Kashmiri kalam from SufiPulse USA. Watch full-length recordings and explore sacred music, lyrics and cultural heritage.",
    images: ["/banner1.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  category: "music",
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
  "@type": "Organization",
  "@id": "https://sufipulse.com/#organization",
  name: "SufiPulse USA",
  alternateName: ["SufiPulse", "Sufi Pulse"],
  url: BASE_URL,
  logo: `${BASE_URL}/brand/sufipulse-master-logo-512.png`,
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
    "https://sufipulse.com/verification",
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
  name: "SufiPulse USA",
  alternateName: ["SufiPulse", "Sufi Pulse", "SufiPulse.com"],
  url: BASE_URL,
  image: `${BASE_URL}/banner1.png`,
  description: "Discover original Sufi music, mystical poetry and Kashmiri kalam from SufiPulse USA. Watch full-length recordings and explore sacred music, lyrics and cultural heritage.",
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
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
