import { entityStore } from '@/lib/atlas/atlas-entity';
import { DiscoveryBuilder } from '@/components/discovery/DiscoveryBuilder';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Global Sufi Music Intelligence | SufiPulse Discovery',
  description: 'Explore the definitive cultural archive of Sufi music, qawwali, poets, and traditions.',
};

export default function DiscoveryHubPage() {
  const entities = entityStore.findAll().filter(e => e.isActive && e.isPublic);

  // Group Flagship Clusters
  const flagships = entities.filter(e => e.strategicGPS >= 90 || e.authorityMetadata?.relatedConcepts);
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-300">
      <DiscoveryBuilder initialEntities={entities} flagships={flagships} />
    </div>
  );
}
