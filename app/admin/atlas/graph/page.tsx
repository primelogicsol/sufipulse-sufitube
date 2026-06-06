import { entityStore } from '@/lib/atlas/atlas-entity';
import { relationshipStore } from '@/lib/atlas/atlas-relationship';
import { buildGraphIndex, calculateGraphStats } from '@/lib/atlas/atlas-graph-engine';
import { calculateStrategicGPS } from '@/lib/atlas/atlas-scoring-engine';

export default function AtlasAdminGraphPage() {
  const entities = entityStore.findAll();
  const relationships = relationshipStore.findAll();
  const graph = buildGraphIndex(entities, relationships);
  const stats = calculateGraphStats(graph, relationships);

  const topConverting = entities
    .filter(e => e.hopsToSufiPulseContent <= 1 && e.entityType !== 'release')
    .sort((a, b) => b.strategicGPS - a.strategicGPS)
    .slice(0, 10);

  const orphans = entities
    .filter(e => e.hopsToSufiPulseContent > 3)
    .sort((a, b) => b.strategicGPS - a.strategicGPS)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Graph Explorer</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Total Entities</p>
          <p className="text-3xl font-bold text-white">{stats.totalEntities}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Total Edges</p>
          <p className="text-3xl font-bold text-white">{stats.totalEdges}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Average Hops</p>
          <p className="text-3xl font-bold text-emerald-400">{stats.averageHops}</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Orphan Rate</p>
          <p className={`text-3xl font-bold ${stats.orphanRate > 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {stats.orphanRate}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-white">Top Converting Entities (Hop 1)</h2>
            <p className="text-sm text-slate-400">Entities with direct paths to SufiPulse content.</p>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {topConverting.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-emerald-400 font-medium">{e.canonicalName}</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{e.entityType}</td>
                    <td className="px-4 py-3 text-right text-white font-bold">{e.strategicGPS}</td>
                  </tr>
                ))}
                {topConverting.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No Hop 1 entities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800 p-4">
            <h2 className="text-lg font-semibold text-white text-rose-400">Strategic Orphans (Hop &gt; 3)</h2>
            <p className="text-sm text-slate-400">High GPS entities with no path to SufiPulse content.</p>
          </div>
          <div className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium text-right">GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orphans.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 text-rose-400 font-medium">{e.canonicalName}</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{e.entityType}</td>
                    <td className="px-4 py-3 text-right text-white font-bold">{e.strategicGPS}</td>
                  </tr>
                ))}
                {orphans.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                      No orphans found! The graph is fully connected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
