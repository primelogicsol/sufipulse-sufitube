import { entityStore } from '@/lib/atlas/atlas-entity';
import { DiscoveryBuilder } from '@/components/discovery/DiscoveryBuilder';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Global Sufi Music Intelligence | SufiPulse Discovery',
  description: 'Explore the definitive cultural archive of Sufi music, qawwali, poets, and traditions.',
};

export default function DiscoveryHubPage() {
  const entities = entityStore.findAll().filter(e => e.isActive && e.isPublic);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-300">
      <DiscoveryBuilder initialEntities={entities} />
    </div>
  );
}
