import type { Metadata } from 'next';
import { entityStore } from '@/lib/atlas/atlas-entity';
import { DiscoveryBuilder } from '@/components/discovery/DiscoveryBuilder';
import { CANONICAL_ORIGIN, canonicalUrl } from '@/lib/canonical-seo';
import { getEntityRoute } from '@/lib/utils/pluralize';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sufi Music, Mystical Poetry & Cultural Discovery',
  description:
    'Explore Sufi music, Kashmiri Sufi kalam, Urdu mystical poetry, classical saints, spiritual themes, and original full-length recordings from SufiPulse USA.',
  alternates: {
    canonical: canonicalUrl('/discovery'),
  },
  openGraph: {
    title: 'Sufi Music, Mystical Poetry & Cultural Discovery | SufiPulse USA',
    description:
      'Explore Sufi music, Kashmiri Sufi kalam, Urdu mystical poetry, classical saints, spiritual themes, and original full-length recordings from SufiPulse USA.',
    url: canonicalUrl('/discovery'),
    siteName: 'SufiPulse USA',
    type: 'website',
  },
};

export default function DiscoveryHubPage() {
  const entities = entityStore
    .findAll()
    .filter((e: any) => e.status === 'published' && e.isPublic !== false);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Discovery Hub', item: `${CANONICAL_ORIGIN}/discovery` },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${CANONICAL_ORIGIN}/discovery#webpage`,
        url: `${CANONICAL_ORIGIN}/discovery`,
        name: 'SufiPulse Global Sufi Music & Cultural Discovery Hub',
        description:
          'Explore Sufi traditions, saints, poets, spiritual concepts, and connected original full-length SufiPulse USA songs.',
        isPartOf: { '@id': `${CANONICAL_ORIGIN}/#website` },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: entities.length,
          itemListElement: entities.map((e: any, idx: number) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: e.canonicalName,
            url: `${CANONICAL_ORIGIN}${getEntityRoute(e.entityType, e.slug)}`,
          })),
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DiscoveryBuilder initialEntities={entities as any} />
    </div>
  );
}
