import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";

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
  sameAs: [
    "https://www.youtube.com/@SufiPulse-USA",
    "https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ",
    "https://dkf.sufisciencecenter.info",
    `${BASE_URL}/verification`,
    "https://www.facebook.com/SufiPulse",
    "https://www.instagram.com/SufiPulse",
    "https://twitter.com/SufiPulse",
    "https://www.linkedin.com/company/sufipulse"
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
        <Script
          defer
          data-domain="sufipulse.com"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
