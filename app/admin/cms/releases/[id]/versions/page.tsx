// app/admin/cms/releases/[id]/versions/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { getReleaseVersions } from '@/lib/cms-api';
import type { ReleaseVersion } from '@/lib/cms-types';
import { Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function VersionControlPage() {
  const params = useParams();
  const releaseId = params?.id as string;
  const [versions, setVersions] = useState<ReleaseVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<ReleaseVersion | null>(null);

  useEffect(() => {
    loadVersions();
  }, [releaseId]);

  async function loadVersions() {
    try {
      setLoading(true);
      // Load versions from database
      // For now, mock data
      const mockVersions: ReleaseVersion[] = [
        {
          id: '3',
          release_id: releaseId,
          version_number: 3,
          snapshot: { title: 'Current Version' } as any,
          change_summary: 'Updated credits and lyrics',
          changed_by: 'admin@sufipulse.local',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          release_id: releaseId,
          version_number: 2,
          snapshot: { title: 'Previous Version' } as any,
          change_summary: 'Added commentary',
          changed_by: 'editor@sufipulse.local',
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '1',
          release_id: releaseId,
          version_number: 1,
          snapshot: { title: 'Initial Version' } as any,
          change_summary: 'Release created',
          changed_by: 'author@sufipulse.local',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      setVersions(mockVersions);
      if (mockVersions.length > 0) {
        setCurrentVersion(mockVersions[0]);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function restoreVersion(versionId: string) {
    if (!confirm('Restore this version? Current changes will be saved as a new version.')) return;
    try {
      // Restore logic
      console.log('Restoring version', versionId);
      alert('Version restored successfully');
    } catch (error) {
      console.error('Error restoring:', error);
    }
  }

  function toggleExpanded(versionId: string) {
    setExpandedVersion(expandedVersion === versionId ? null : versionId);
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Version History</h1>
        <p className="text-neutral-600 mb-8">Track and manage all versions of this release</p>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading version history...</p>
            </div>
          </div>
        ) : versions.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <Clock className="mx-auto text-neutral-300 mb-4" size={48} />
            <p className="text-neutral-600">No versions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                {/* Version Header */}
                <button
                  onClick={() => toggleExpanded(version.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100">
                      <span className="font-bold text-indigo-600 text-sm">V{version.version_number}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">
                        Version {version.version_number}
                        {index === 0 && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Current</span>}
                      </p>
                      <p className="text-sm text-neutral-600">{version.change_summary || 'No summary provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">{version.created_at ? new Date(version.created_at).toLocaleDateString() : 'N/A'}</p>
                      <p className="text-xs text-neutral-500">{version.created_at ? new Date(version.created_at).toLocaleTimeString() : 'N/A'}</p>
                      {version.changed_by && (
                        <p className="text-xs text-neutral-500 mt-1">by {version.changed_by}</p>
                      )}
                    </div>
                    
                    {expandedVersion === version.id ? (
                      <ChevronUp className="text-neutral-400" />
                    ) : (
                      <ChevronDown className="text-neutral-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedVersion === version.id && (
                  <div className="border-t border-neutral-200 p-6 bg-neutral-50">
                    <div className="space-y-6">
                      {/* Snapshot Details */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-3">Snapshot Data</h3>
                        <div className="bg-white rounded p-4 font-mono text-sm text-neutral-700 overflow-auto max-h-64">
                          <pre>{JSON.stringify(version.snapshot, null, 2)}</pre>
                        </div>
                      </div>

                      {/* Comparison Option */}
                      {index < versions.length - 1 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-900 mb-3">
                            Compare with version {versions[index + 1].version_number}
                          </p>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
                            View Diff
                          </button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {index > 0 && (
                          <button
                            onClick={() => restoreVersion(version.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                          >
                            <RefreshCw size={18} /> Restore This Version
                          </button>
                        )}
                        <button className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg font-semibold transition">
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
