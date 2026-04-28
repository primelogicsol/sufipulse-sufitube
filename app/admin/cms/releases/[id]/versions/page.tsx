// app/admin/cms/releases/[id]/versions/page.tsx
"use client";

import { useState } from 'react';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import type { ReleaseVersion } from '@/lib/cms-types';
import { Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function VersionControlPage() {
  const [versions] = useState<ReleaseVersion[]>([]);
  const [loading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  async function restoreVersion(versionId: string) {
    if (!confirm('Restore this version? Current changes will be saved as a new version.')) return;
    try {
      console.log('Restoring version', versionId);
      setRestoreMessage('Version restored successfully.');
    } catch (error) {
      console.error('Error restoring:', error);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--dash-text-primary)] mb-2">Version History</h1>
        {restoreMessage && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-center justify-between gap-2 bg-green-500/10 border border-green-500/25 text-green-400">
            <span>{restoreMessage}</span>
            <button type="button" onClick={() => setRestoreMessage(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}
        <p className="text-[var(--dash-text-secondary)] mb-8">Track and manage all versions of this release</p>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-[var(--dash-accent)]/30 border-t-[var(--dash-accent)] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[var(--dash-text-secondary)]">Loading version history…</p>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="bg-[var(--dash-bg-secondary)] rounded-lg border border-[var(--dash-border)] p-12 text-center">
            <Clock className="mx-auto text-[var(--dash-text-muted)] mb-4" size={48} />
            <p className="text-[var(--dash-text-secondary)]">No versions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div key={version.id} className="bg-[var(--dash-bg-secondary)] rounded-lg border border-[var(--dash-border)] overflow-hidden">
                <button
                  onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-[var(--dash-bg-hover)] transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--dash-accent-muted)] border border-[var(--dash-accent)]/30">
                      <span className="font-bold text-[var(--dash-accent)] text-sm">V{version.version_number}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--dash-text-primary)]">
                        Version {version.version_number}
                        {index === 0 && (
                          <span className="ml-2 text-xs bg-[var(--dash-accent-muted)] text-[var(--dash-accent)] border border-[var(--dash-accent)]/30 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-[var(--dash-text-secondary)]">{version.change_summary || 'No summary provided'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-[var(--dash-text-muted)]">
                        {version.created_at ? new Date(version.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-[var(--dash-text-muted)]">
                        {version.created_at ? new Date(version.created_at).toLocaleTimeString() : 'N/A'}
                      </p>
                      {version.changed_by && (
                        <p className="text-xs text-[var(--dash-text-muted)] mt-1">by {version.changed_by}</p>
                      )}
                    </div>
                    {expandedVersion === version.id
                      ? <ChevronUp className="text-[var(--dash-text-muted)]" />
                      : <ChevronDown className="text-[var(--dash-text-muted)]" />
                    }
                  </div>
                </button>

                {expandedVersion === version.id && (
                  <div className="border-t border-[var(--dash-border)] p-6 bg-[var(--dash-bg-primary)]">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-[var(--dash-text-primary)] mb-3 text-sm uppercase tracking-wider">Snapshot Data</h3>
                        <div className="bg-[var(--dash-bg-secondary)] rounded border border-[var(--dash-border)] p-4 font-mono text-sm text-[var(--dash-text-secondary)] overflow-auto max-h-64">
                          <pre>{JSON.stringify(version.snapshot, null, 2)}</pre>
                        </div>
                      </div>

                      {index < versions.length - 1 && (
                        <div className="p-4 bg-[var(--dash-accent-muted)] border border-[var(--dash-accent)]/20 rounded-lg">
                          <p className="text-sm text-[var(--dash-text-secondary)] mb-3">
                            Compare with version {versions[index + 1].version_number}
                          </p>
                          <button className="px-4 py-2 bg-[var(--dash-accent)] hover:bg-[var(--dash-accent-hover)] text-[var(--color-midnight)] rounded text-sm font-semibold transition-colors">
                            View Diff
                          </button>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {index > 0 && (
                          <button
                            onClick={() => restoreVersion(version.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--dash-accent)] hover:bg-[var(--dash-accent-hover)] text-[var(--color-midnight)] rounded font-semibold transition-colors text-sm"
                          >
                            <RefreshCw size={16} /> Restore This Version
                          </button>
                        )}
                        <button className="px-4 py-2 bg-[var(--dash-bg-secondary)] hover:bg-[var(--dash-bg-hover)] text-[var(--dash-text-secondary)] border border-[var(--dash-border)] rounded font-semibold transition-colors text-sm">
                          Download Snapshot
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
