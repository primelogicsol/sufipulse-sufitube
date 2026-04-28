// app/admin/cms/media/page.tsx
"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { getMediaLibrary, deleteMedia } from '@/lib/cms-api';
import type { MediaLibrary as MediaItem } from '@/lib/cms-types';
import { Upload, X, Copy, Trash2, Image as ImageIcon, Video, Music, File, Grid } from 'lucide-react';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      setLoading(true);
      // Would load from Supabase
      // For now, show empty state
      setMedia([]);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    try {
      setUploading(true);
      // Upload logic would go here
      console.log('Uploading', files.length, 'files');
      loadMedia();
    } catch (error) {
      console.error('Error uploading:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function copyToClipboard(url: string, itemId: string) {
    navigator.clipboard.writeText(url);
    setCopied(itemId);
    setTimeout(() => setCopied(null), 2000);
  }

  async function deleteMedia(id: string) {
    if (!confirm('Delete this media file?')) return;
    try {
      // Delete logic would go here
      setMedia(media.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith('image')) return <ImageIcon size={32} />;
    if (fileType.startsWith('video')) return <Video size={32} />;
    if (fileType.startsWith('audio')) return <Music size={32} />;
    return <File size={32} />;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--dash-text-primary)] mb-6">Media Library</h1>
        {uploadError && (
          <div className="mb-4 p-3 rounded-lg text-sm flex items-center justify-between gap-2 bg-red-500/10 border border-red-500/25 text-red-400">
            <span>{uploadError}</span>
            <button type="button" onClick={() => setUploadError(null)} className="shrink-0 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
          </div>
        )}

        {/* Upload Section */}
        <div className="dashboard-card mb-6">
          <div className="border-2 border-dashed border-[var(--dash-border)] rounded-lg p-12 text-center hover:border-[var(--dash-accent)] transition">
            <label className="cursor-pointer">
              <Upload className="mx-auto mb-4 text-[var(--dash-text-muted)]" size={48} />
              <p className="text-lg font-semibold text-[var(--dash-text-primary)] mb-2">Upload Media</p>
              <p className="text-[var(--dash-text-secondary)] mb-4">Drag and drop files or click to browse</p>
              <input
                type="file"
                multiple
                onChange={handleUpload}
                disabled={uploading}
                accept="image/*,video/*,audio/*,.pdf"
                className="hidden"
              />
              <button
                disabled={uploading}
                className="dashboard-btn-primary disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Select Files'}
              </button>
            </label>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'thumbnail', 'poster', 'promotional', 'document'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'dashboard-btn-primary' : 'dashboard-btn-secondary'}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Media Grid */}
        <div className="dashboard-card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-[var(--dash-border)] border-t-[var(--dash-accent)] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--dash-text-secondary)]">Loading media...</p>
            </div>
          ) : media.length === 0 ? (
            <div className="p-12 text-center">
              <ImageIcon className="mx-auto text-[var(--dash-text-muted)] mb-4" size={48} />
              <p className="text-[var(--dash-text-secondary)]">No media files yet</p>
              <p className="text-[var(--dash-text-muted)] text-sm">Upload images, videos, and documents to populate the library</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
              {media.map((item) => (
                <div key={item.id} className="group relative bg-[var(--dash-bg-secondary)] rounded-lg overflow-hidden">
                  <div className="aspect-square flex items-center justify-center bg-[var(--dash-bg-tertiary)] text-[var(--dash-text-muted)] group-hover:bg-[var(--dash-border)] transition">
                    {getFileIcon(item.file_type)}
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => copyToClipboard(item.file_url, item.id)}
                      className="p-2 bg-[var(--dash-bg-primary)] rounded-lg hover:bg-[var(--dash-bg-secondary)]"
                      title="Copy URL"
                    >
                      <Copy size={20} style={{color: copied === item.id ? 'var(--dash-status-approved)' : 'var(--dash-text-secondary)'}} />
                    </button>
                    <button
                      onClick={() => deleteMedia(item.id)}
                      className="p-2 bg-[var(--dash-bg-primary)] rounded-lg hover:bg-[var(--dash-bg-secondary)]"
                      title="Delete"
                    >
                      <Trash2 size={20} style={{color: 'var(--dash-status-rejected)'}} />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--dash-text-secondary)] p-2 truncate">{item.file_name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
