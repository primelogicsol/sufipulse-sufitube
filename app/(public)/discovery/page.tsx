import { entityStore } from '@/lib/atlas/atlas-entity';
import { DiscoveryBuilder } from '@/components/discovery/DiscoveryBuilder';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Global Sufi Music Intelligence & Discovery',
  description: 'Explore the global cultural knowledge graph of Sufi music, qawwali masters, sacred poets, and Kashmiri spiritual traditions from SufiPulse USA.',
};

export default function DiscoveryHubPage() {
  const entities = entityStore.findAll().filter(e => e.isActive && e.isPublic);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-300">
      <DiscoveryBuilder initialEntities={entities} />
    </div>
  );
}
