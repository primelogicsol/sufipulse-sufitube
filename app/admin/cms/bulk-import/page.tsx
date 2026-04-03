// app/admin/cms/bulk-import/page.tsx
"use client";

import { useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getBulkImports, createBulkImport } from '@/lib/cms-api';
import type { BulkImport } from '@/lib/cms-types';
import { Upload, Download, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react';

export default function BulkImportPage() {
  const [imports, setImports] = useState<BulkImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importType, setImportType] = useState<'releases' | 'credits' | 'lyrics' | 'media'>('releases');

  const templates = {
    releases: `title,slug,youtube_id,category,duration_formatted,status
"Qawwali Journey","qawwali-journey","lJIrF4E69e8","Qawwali","8:45","draft"
"Divine Love","divine-love","LS8qPHGjQZU","Sufi Poetry","12:30","draft"`,
    credits: `release_id,category,credit_type,names
"abc-123","artistic","Lead Vocalist","Nusrat Fateh Ali Khan"
"abc-123","production","Producer","Ahmed Hassan|Hamza Malik"`,
    lyrics: `release_id,language_code,format,content
"abc-123","ur","urdu","یہ لیریکس ہے..."
"abc-123","en","translation","These are the lyrics..."`,
    media: `release_id,file_name,file_url,media_category,file_type
"abc-123","thumbnail.jpg","https://...jpg","thumbnail","image/jpeg"
"abc-123","poster.png","https://...png","poster","image/png"`
  };

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Upload logic would go here
      console.log('Importing', file.name);
      
      // Simulate import
      const newImport: BulkImport = {
        id: Date.now().toString(),
        file_name: file.name,
        import_type: importType as any,
        status: 'processing',
        total_items: 10,
        successful_items: 0,
        failed_items: 0,
        created_at: new Date().toISOString()
      };
      
      setImports([newImport, ...imports]);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function downloadTemplate(type: keyof typeof templates) {
    const content = templates[type];
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-template.csv`;
    a.click();
  }

  const statusConfig = {
    pending:    { icon: Clock,         iconColor: 'var(--dash-status-pending)',  rowStyle: { background: 'var(--dash-status-pending-bg)' } },
    processing: { icon: Clock,         iconColor: 'var(--dash-accent)',          rowStyle: { background: 'rgba(var(--dash-accent-rgb,99,102,241),0.08)' } },
    completed:  { icon: CheckCircle,   iconColor: 'var(--dash-status-approved)', rowStyle: { background: 'var(--dash-status-approved-bg)' } },
    failed:     { icon: AlertCircle,   iconColor: 'var(--dash-status-rejected)', rowStyle: { background: 'var(--dash-status-rejected-bg)' } },
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)] mb-6">Bulk Import</h1>

        {/* Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Import Type Selection */}
          <div className="dashboard-card">
            <h2 className="text-base font-semibold text-[var(--dash-text-primary)] mb-4">Select Import Type</h2>
            <div className="space-y-3">
              {(['releases', 'credits', 'lyrics', 'media'] as const).map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer p-3 border border-[var(--dash-border)] rounded-lg hover:bg-[var(--dash-bg-secondary)] transition">
                  <input
                    type="radio"
                    name="importType"
                    value={type}
                    checked={importType === type}
                    onChange={(e) => setImportType(e.target.value as any)}
                    className="w-4 h-4 accent-[var(--dash-accent)]"
                  />
                  <span className="font-medium text-[var(--dash-text-primary)] capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Template Download */}
          <div className="dashboard-card">
            <h2 className="text-base font-semibold text-[var(--dash-text-primary)] mb-4">CSV Template</h2>
            <p className="text-sm text-[var(--dash-text-secondary)] mb-4">Download the template for <span className="text-[var(--dash-text-primary)] font-medium capitalize">{importType}</span>:</p>
            <button
              onClick={() => downloadTemplate(importType)}
              className="dashboard-btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Download size={18} /> Download {importType} Template
            </button>
            <p className="text-xs text-[var(--dash-text-muted)] mt-4">
              The template shows the required columns. Fill in your data and upload the CSV file.
            </p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="dashboard-card mb-6">
          <div className="border-2 border-dashed border-[var(--dash-border)] rounded-lg p-12 text-center hover:border-[var(--dash-accent)] transition">
            <label className="cursor-pointer">
              <Upload className="mx-auto mb-4 text-[var(--dash-text-muted)]" size={48} />
              <p className="text-lg font-semibold text-[var(--dash-text-primary)] mb-2">Upload CSV File</p>
              <p className="text-[var(--dash-text-secondary)] mb-4">Drag and drop your CSV or click to browse</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
              <button
                disabled={uploading}
                className="dashboard-btn-primary disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Select File'}
              </button>
            </label>
          </div>
        </div>

        {/* Import History */}
        <div className="dashboard-card overflow-hidden p-0">
          <div className="p-5 border-b border-[var(--dash-border)]">
            <h2 className="text-base font-semibold text-[var(--dash-text-primary)]">Import History</h2>
          </div>

          {imports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[var(--dash-text-muted)]">No imports yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--dash-border)]">
              {imports.map((imp) => {
                const Status = statusConfig[imp.status];
                return (
                  <div key={imp.id} className="p-5" style={Status.rowStyle}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Status.icon size={22} style={{ color: Status.iconColor }} />
                        <div>
                          <p className="font-medium text-[var(--dash-text-primary)]">{imp.file_name || imp.import_type}</p>
                          <p className="text-xs text-[var(--dash-text-secondary)] capitalize">{imp.import_type} · {imp.created_at ? new Date(imp.created_at).toLocaleString() : 'N/A'}</p>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-[var(--dash-bg-secondary)] rounded-lg transition">
                        <Trash2 size={16} className="text-[var(--dash-text-muted)]" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--dash-text-muted)] text-xs">Total Items</p>
                        <p className="font-semibold text-[var(--dash-text-primary)]">{imp.total_items}</p>
                      </div>
                      <div>
                        <p className="text-[var(--dash-text-muted)] text-xs">Successful</p>
                        <p className="font-semibold" style={{ color: 'var(--dash-status-approved)' }}>{imp.successful_items}</p>
                      </div>
                      <div>
                        <p className="text-[var(--dash-text-muted)] text-xs">Failed</p>
                        <p className="font-semibold" style={{ color: 'var(--dash-status-rejected)' }}>{imp.failed_items}</p>
                      </div>
                    </div>

                    {imp.error_log && (
                      <div className="mt-4 p-3 rounded text-sm" style={{ background: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)', border: '1px solid var(--dash-status-rejected)' }}>
                        {imp.error_log}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
