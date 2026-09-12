"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';

type QueueItem = {
  releaseId: string;
  title: string;
  sourceCount: number;
  primarySourceId: string;
  extensionCount: number;
  alignmentStatus: string;
  assemblyStatus: string;
  masterTimingStatus: string;
  captionStatus: string;
  updatedAt: string;
};

export default function ProductionQueuePage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.includes('admin') ?? false;

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/admin/production-queue');
        if (res.ok) {
          const data = await res.json();
          setQueue(data.queue || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, [isAdmin]);

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
        <h1 className="text-2xl font-semibold text-white">Studio Production Queue</h1>
        <p className="text-sm text-white/60">Manage SufiPulse Studio USA Private Production Sources.</p>

        {loading ? (
          <div className="text-sm text-white/60">Loading queue...</div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70 min-w-max">
              <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Release</th>
                  <th className="px-4 py-3">Primary Source</th>
                  <th className="px-4 py-3">Extensions</th>
                  <th className="px-4 py-3">Alignment</th>
                  <th className="px-4 py-3">Assembly</th>
                  <th className="px-4 py-3">Master Timing</th>
                  <th className="px-4 py-3">Captions</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {queue.map((item) => (
                  <tr key={item.releaseId} className="hover:bg-white/5">
                    <td className="px-4 py-3 text-white font-medium">{item.title}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-white/60">{item.primarySourceId}</td>
                    <td className="px-4 py-3">{item.extensionCount}</td>
                    <td className="px-4 py-3">
                      <span className={item.alignmentStatus === 'Configured' ? 'text-emerald-400' : 'text-amber-400'}>{item.alignmentStatus}</span>
                    </td>
                    <td className="px-4 py-3">{item.assemblyStatus}</td>
                    <td className="px-4 py-3">{item.masterTimingStatus}</td>
                    <td className="px-4 py-3">{item.captionStatus}</td>
                    <td className="px-4 py-3 text-white/40">{new Date(item.updatedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/cms-releases/${item.releaseId}/production-sources`} className="text-amber-400 hover:text-amber-300 whitespace-nowrap">
                        Open Workspace &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-white/40">
                      No private production sources found. Start by importing a source into a release.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
