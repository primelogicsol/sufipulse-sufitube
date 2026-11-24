import { entityStore } from '@/lib/atlas/atlas-entity';
import { relationshipStore } from '@/lib/atlas/atlas-relationship';
import { determineDiscoveryStatus } from '@/lib/atlas/atlas-scoring-engine';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Flagship Authority Dashboard | Admin',
};

export default function FlagshipsDashboardPage() {
  const allEntities = entityStore.findAll();
  const allEdges = relationshipStore.findAll();

  const entitiesData = allEntities
    .sort((a, b) => b.strategicGPS - a.strategicGPS)
    .slice(0, 50)
    .map((entity) => {
      const edges = allEdges.filter(
        (e) => e.sourceEntityId === entity.id || e.targetEntityId === entity.id
      );
      const relatedIds = new Set(
        edges.map((e) => (e.sourceEntityId === entity.id ? e.targetEntityId : e.sourceEntityId))
      );

      const releaseCount = (entity.connectedReleaseIds || []).length;
      const publicationCount = (entity.connectedArticleIds || []).length;
      const videoCount = (entity.connectedVideoIds || []).length;
      const conversionPathwayCount = entity.hopsToSufiPulseContent <= 1 ? 1 : 0;

      const status = determineDiscoveryStatus({
        discoveryReadinessScore: entity.discoveryReadinessScore,
        strategicGPS: entity.strategicGPS,
        advantageScore: entity.advantageScore,
        relationshipCount: edges.length,
        relatedEntityCount: relatedIds.size,
        releaseCount,
        publicationCount,
        videoCount,
        conversionPathwayCount,
      });

      return {
        ...entity,
        relationshipCount: edges.length,
        relatedEntityCount: relatedIds.size,
        releaseCount,
        publicationCount,
        videoCount,
        conversionPathwayCount,
        status,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Flagship Authority Dashboard</h1>
          <p className="text-slate-400 mt-2">
            Editorial priority & graph connectivity across Atlas entities (no random simulated metrics).
          </p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs">Entity</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-center">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">GPS (Editorial)</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">Advantage</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-center">Graph Edges</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-center">Connected Releases</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-center">Connected Articles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {entitiesData.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{e.canonicalName}</div>
                    <div className="text-xs text-emerald-500 uppercase tracking-wide">{e.entityType}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full text-xs font-medium">
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-white">{e.strategicGPS}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-400">{e.advantageScore}</td>
                  <td className="px-6 py-4 text-center text-slate-300">{e.relationshipCount}</td>
                  <td className="px-6 py-4 text-center text-amber-300 font-mono">{e.releaseCount}</td>
                  <td className="px-6 py-4 text-center text-blue-300 font-mono">{e.publicationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
