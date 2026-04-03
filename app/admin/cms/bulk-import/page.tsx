// app/admin/cms/bulk-import/page.tsx
"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import {
  getBulkImports,
  createBulkImport,
  getReleaseById,
  saveReleaseCreds,
  saveReleaseLyrics,
} from '@/lib/cms-api';
import type { BulkImport, ReleaseCredit, ReleaseLyrics } from '@/lib/cms-types';
import { Upload, Download, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react';

export default function BulkImportPage() {
  const [imports, setImports] = useState<BulkImport[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importType, setImportType] = useState<'releases' | 'credits' | 'lyrics' | 'media'>('releases');

  const templates = {
    releases: `title,slug,youtube_id,youtube_channel_id,youtube_channel_url,category,duration_formatted,status
"Qawwali Journey","qawwali-journey","lJIrF4E69e8","UCraDr3i5A3k0j7typ6tOOsQ","https://www.youtube.com/channel/UCraDr3i5A3k0j7typ6tOOsQ","Qawwali","8:45","draft"
"Divine Love","divine-love","LS8qPHGjQZU","","https://www.youtube.com/@SufiPulse","Sufi Poetry","12:30","draft"`,
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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const history = await getBulkImports();
        setImports(history.slice().reverse());
      } catch (error) {
        console.error('Failed to load bulk import history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const normalizeStatus = (value: string): 'draft' | 'in_review' | 'approved' | 'published' | 'unpublished' | 'archived' => {
    const cleaned = (value || '').trim().toLowerCase();
    const valid = ['draft', 'in_review', 'approved', 'published', 'unpublished', 'archived'];
    return valid.includes(cleaned) ? (cleaned as any) : 'draft';
  };

  const parseDurationToSeconds = (duration: string): number => {
    const input = (duration || '').trim();
    if (!input) return 0;
    const parts = input.split(':').map((p) => Number(p));
    if (parts.some((n) => Number.isNaN(n))) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const parseCsvRows = (content: string): string[][] => {
    const rows: string[][] = [];
    let currentField = '';
    let currentRow: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const next = content[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') i++;
        currentRow.push(currentField.trim());
        currentField = '';
        const hasValue = currentRow.some((cell) => cell.length > 0);
        if (hasValue) rows.push(currentRow);
        currentRow = [];
        continue;
      }

      currentField += char;
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      const hasValue = currentRow.some((cell) => cell.length > 0);
      if (hasValue) rows.push(currentRow);
    }

    return rows;
  };

  const parseReleaseCsv = (content: string) => {
    const rows = parseCsvRows(content);
    if (rows.length < 2) return [];

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const records = rows.slice(1);

    return records.map((cells, idx) => {
      const row: Record<string, string> = {};
      headers.forEach((header, hIdx) => {
        row[header] = (cells[hIdx] || '').replace(/^"|"$/g, '').trim();
      });

      const title = row.title || '';
      const slug = row.slug || '';
      const youtubeId = row.youtube_id || '';
      const durationFormatted = row.duration_formatted || '0:00';

      if (!title || !slug || !youtubeId) {
        throw new Error(`Row ${idx + 2}: title, slug, and youtube_id are required`);
      }

      return {
        title,
        slug,
        youtubeId,
        youtubeChannelId: row.youtube_channel_id || '',
        youtubeChannelUrl: row.youtube_channel_url || '',
        category: row.category || '',
        durationFormatted,
        durationSeconds: parseDurationToSeconds(durationFormatted),
        status: normalizeStatus(row.status || 'draft'),
      };
    });
  };

  const parseCreditsCsv = (content: string) => {
    const rows = parseCsvRows(content);
    if (rows.length < 2) return [];

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const records = rows.slice(1);

    return records.flatMap((cells, idx) => {
      const row: Record<string, string> = {};
      headers.forEach((header, hIdx) => {
        row[header] = (cells[hIdx] || '').replace(/^"|"$/g, '').trim();
      });

      const releaseId = row.release_id || '';
      const creditType = row.credit_type || '';
      const namesRaw = row.names || '';

      if (!releaseId || !creditType || !namesRaw) {
        throw new Error(`Row ${idx + 2}: release_id, credit_type, and names are required`);
      }

      const names = namesRaw.split('|').map((n) => n.trim()).filter(Boolean);
      if (!names.length) {
        throw new Error(`Row ${idx + 2}: names must contain at least one value`);
      }

      return names.map((name, nameIdx) => ({
        id: `credit_${Date.now()}_${idx}_${nameIdx}`,
        release_id: releaseId,
        role: row.category ? `${row.category}:${creditType}` : creditType,
        name,
        created_at: new Date().toISOString(),
      }));
    });
  };

  const parseLyricsCsv = (content: string) => {
    const rows = parseCsvRows(content);
    if (rows.length < 2) return [];

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const records = rows.slice(1);

    return records.map((cells, idx) => {
      const row: Record<string, string> = {};
      headers.forEach((header, hIdx) => {
        row[header] = (cells[hIdx] || '').replace(/^"|"$/g, '').trim();
      });

      const releaseId = row.release_id || '';
      const languageCode = row.language_code || '';
      const contentValue = row.content || '';

      if (!releaseId || !languageCode || !contentValue) {
        throw new Error(`Row ${idx + 2}: release_id, language_code, and content are required`);
      }

      return {
        id: `lyrics_${Date.now()}_${idx}`,
        release_id: releaseId,
        language: languageCode,
        title: row.format || undefined,
        lyrics_text: contentValue,
        metadata: row.format ? { format: row.format } : undefined,
        created_at: new Date().toISOString(),
      };
    });
  };

  const groupByReleaseId = <T extends { release_id: string }>(items: T[]): Record<string, T[]> => {
    return items.reduce((acc, item) => {
      if (!acc[item.release_id]) acc[item.release_id] = [];
      acc[item.release_id].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  };

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Only CSV upload is supported for now.');
      }

      const text = await file.text();

      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      let totalRows = 0;

      if (importType === 'releases') {
        const parsed = parseReleaseCsv(text);
        totalRows = parsed.length;

        for (let i = 0; i < parsed.length; i++) {
          const payload = parsed[i];
          try {
            const response = await fetch('/api/releases', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              failCount++;
              errors.push(`Row ${i + 2}: ${data?.error || 'Save failed'}`);
              continue;
            }

            successCount++;
          } catch (error: any) {
            failCount++;
            errors.push(`Row ${i + 2}: ${error?.message || 'Unknown error'}`);
          }
        }
      } else if (importType === 'credits') {
        const parsedCredits = parseCreditsCsv(text);
        totalRows = parsedCredits.length;
        const grouped = groupByReleaseId(parsedCredits);

        for (const [releaseId, credits] of Object.entries(grouped)) {
          try {
            const release = await getReleaseById(releaseId);
            if (!release) {
              failCount += credits.length;
              errors.push(`Release not found: ${releaseId}`);
              continue;
            }

            await saveReleaseCreds(releaseId, credits as ReleaseCredit[], { append: true });
            successCount += credits.length;
          } catch (error: any) {
            failCount += credits.length;
            errors.push(`Release ${releaseId}: ${error?.message || 'Failed to save credits'}`);
          }
        }
      } else if (importType === 'lyrics') {
        const parsedLyrics = parseLyricsCsv(text);
        totalRows = parsedLyrics.length;
        const grouped = groupByReleaseId(parsedLyrics);

        for (const [releaseId, lyrics] of Object.entries(grouped)) {
          try {
            const release = await getReleaseById(releaseId);
            if (!release) {
              failCount += lyrics.length;
              errors.push(`Release not found: ${releaseId}`);
              continue;
            }

            await saveReleaseLyrics(releaseId, lyrics as ReleaseLyrics[], { append: true });
            successCount += lyrics.length;
          } catch (error: any) {
            failCount += lyrics.length;
            errors.push(`Release ${releaseId}: ${error?.message || 'Failed to save lyrics'}`);
          }
        }
      } else {
        const importLog = await createBulkImport(importType, file.name, [], {
          successfulItems: 0,
          failedItems: 0,
          status: 'completed',
          errorLog: 'Parser not implemented yet for this import type.',
        });
        setImports([importLog, ...imports]);
        return;
      }

      const importLog = await createBulkImport(importType, file.name, Array.from({ length: totalRows }), {
        successfulItems: successCount,
        failedItems: failCount,
        status: failCount > 0 ? 'failed' : 'completed',
        errorLog: errors.length ? errors.slice(0, 5).join(' | ') : undefined,
      });

      setImports([importLog, ...imports]);

      if (failCount > 0) {
        alert(`Imported ${successCount}/${totalRows} ${importType}. ${failCount} failed.`);
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      e.target.value = '';
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

          {loading ? (
            <div className="p-12 text-center">
              <p className="text-[var(--dash-text-muted)]">Loading history...</p>
            </div>
          ) : imports.length === 0 ? (
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
