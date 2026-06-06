import { entityStore } from '@/lib/atlas/atlas-entity';
import { relationshipStore } from '@/lib/atlas/atlas-relationship';
import { determineDiscoveryStatus } from '@/lib/atlas/atlas-scoring-engine';
import Link from 'next/link';

export const metadata = {
  title: 'Flagship Authority Dashboard | Admin',
};

export default function FlagshipsDashboardPage() {
  const allEntities = entityStore.findAll();
  const allEdges = relationshipStore.findAll();

  // For this dashboard, we just take all entities and sort by GPS for now
  // In a full implementation, you might filter by a boolean `isFlagship` 
  // or by reading the static list. We'll show the top ones.
  
  const entitiesData = allEntities
    .sort((a, b) => b.strategicGPS - a.strategicGPS)
    .slice(0, 50)
    .map(entity => {
      // Calculate real relationship count
      const edges = allEdges.filter(e => e.sourceEntityId === entity.id || e.targetEntityId === entity.id);
      const relatedIds = new Set(edges.map(e => e.sourceEntityId === entity.id ? e.targetEntityId : e.sourceEntityId));
      
      const releaseCount = entity.connectedReleaseIds.length;
      const publicationCount = entity.connectedArticleIds.length;
      const videoCount = entity.connectedVideoIds.length;
      
      // Calculate conversion pathways (Hop <= 1 means a conversion pathway exists)
      const conversionPathwayCount = entity.hopsToSufiPulseContent <= 1 ? 1 : 0; // Simplified
      
      const status = determineDiscoveryStatus({
        discoveryReadinessScore: entity.discoveryReadinessScore,
        strategicGPS: entity.strategicGPS,
        advantageScore: entity.advantageScore,
        relationshipCount: edges.length,
        relatedEntityCount: relatedIds.size,
        releaseCount,
        publicationCount,
        videoCount,
        conversionPathwayCount
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
        mockTraffic: Math.floor(Math.random() * 5000) + 100,
        mockAICitations: Math.floor(Math.random() * 20),
        mockSubscribers: Math.floor(Math.random() * 50),
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Flagship Authority Dashboard</h1>
          <p className="text-slate-400 mt-2">Command center for the Top 50 Flagship Experiences.</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs">Entity</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-center">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">GPS</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">Advantage</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">Readiness</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-center">Rels</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">Monthly Traffic</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">AI Citations</th>
                <th className="px-6 py-4 font-semibold tracking-wider uppercase text-xs text-right">Subscribers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {entitiesData.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{e.canonicalName}</div>
                    <div className="text-xs text-emerald-500 uppercase tracking-wide">{e.entityType}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {e.status === 'public' ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full text-xs font-medium">
                        Public
                      </span>
                    ) : e.status === 'review' ? (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-full text-xs font-medium">
                        Review
                      </span>
                    ) : (
                      <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-1 rounded-full text-xs font-medium">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-white">{e.strategicGPS}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-400">{e.advantageScore}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-300">{e.discoveryReadinessScore}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-1 text-slate-400">
                      <span>{e.relationshipCount}</span>
                      {e.relationshipCount < 5 && <span className="text-rose-500 text-xs" title="Needs 5">(⚠️)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400">{e.mockTraffic.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-blue-400">{e.mockAICitations}</td>
                  <td className="px-6 py-4 text-right text-emerald-400 font-medium">+{e.mockSubscribers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
