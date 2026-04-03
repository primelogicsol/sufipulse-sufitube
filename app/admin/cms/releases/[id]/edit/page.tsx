// app/admin/cms/releases/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import { getReleaseById, updateRelease, createRelease } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import { Save, ArrowLeft } from 'lucide-react';

export default function ReleaseEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [chorusVocalistsText, setChorusVocalistsText] = useState('');
  const [form, setForm] = useState<Partial<Release>>({
    title: '',
    slug: '',
    status: 'draft',
    youtube_id: '',
    description: '',
    duration_formatted: '',
    view_count: 0,
    like_count: 0,
    enable_lyrics: true,
    enable_commentary: true,
    enable_sponsors: false,
    enable_adoption: true,
    enable_credits: true,
    show_views: true,
    show_likes: true
  });

  useEffect(() => {
    if (!isNew) {
      loadRelease();
    }
  }, [id, isNew]);

  async function loadRelease() {
    try {
      if (id && id !== 'new') {
        const data = await getReleaseById(id);
        if (data) {
          setForm(data);
          setChorusVocalistsText((data.chorus_vocalists || []).join(', '));
        }
      }
    } catch (error) {
      console.error('Error loading release:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      
      if (isNew) {
        const chorusVocalists = chorusVocalistsText.split(',').map((v) => v.trim()).filter(Boolean);
        await createRelease({
          ...form,
          title: form.title || 'Untitled',
          slug: form.slug || 'untitled',
          status: 'draft',
          view_count: 0,
          like_count: 0,
          show_views: true,
          show_likes: true,
          enable_lyrics: true,
          enable_commentary: true,
          enable_sponsors: false,
          enable_adoption: true,
          enable_credits: true,
          chorus_vocalists: chorusVocalists,
          default_language: 'en',
          available_languages: ['en', 'ur']
        } as any);
      } else {
        const chorusVocalists = chorusVocalistsText.split(',').map((v) => v.trim()).filter(Boolean);
        await updateRelease(id, {
          ...form,
          chorus_vocalists: chorusVocalists,
        });
      }
      
      alert('Release saved successfully!');
      router.push('/admin/cms/releases');
    } catch (error) {
      console.error('Error saving release:', error);
      alert('Error saving release');
    } finally {
      setSaving(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen" style={{backgroundColor: 'var(--dash-bg-primary)'}}>
          <div className="text-center">
            <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4" style={{borderColor: 'var(--dash-border)', borderTopColor: 'var(--dash-accent)'}}></div>
            <p style={{color: 'var(--dash-text-secondary)'}}>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6" style={{backgroundColor: 'var(--dash-bg-primary)', color: 'var(--dash-text-primary)', minHeight: '100vh'}}>
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-semibold"
          style={{color: 'var(--dash-accent)', background: 'none', border: 'none', cursor: 'pointer'}}
        >
          <ArrowLeft size={20} /> Back
        </button>

        <h1 className="text-3xl font-bold mb-8" style={{color: 'var(--dash-text-primary)'}}>
          {isNew ? 'Create New Release' : 'Edit Release'}
        </h1>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Information */}
          <div className="rounded-lg border p-6" style={{backgroundColor: 'var(--dash-bg-secondary)', borderColor: 'var(--dash-border)'}}>
            <h2 className="text-xl font-bold mb-4" style={{color: 'var(--dash-text-primary)'}}>Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  placeholder="Release title"
                  style={{
                    backgroundColor: 'var(--form-bg-default)',
                    borderColor: 'var(--form-border-default)',
                    color: 'var(--dash-text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  placeholder="url-slug"
                  style={{
                    backgroundColor: 'var(--form-bg-default)',
                    borderColor: 'var(--form-border-default)',
                    color: 'var(--dash-text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description || ''}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  placeholder="Release description"
                  style={{
                    backgroundColor: 'var(--form-bg-default)',
                    borderColor: 'var(--form-border-default)',
                    color: 'var(--dash-text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                  Chorus Vocalists
                </label>
                <input
                  type="text"
                  value={chorusVocalistsText}
                  onChange={(e) => setChorusVocalistsText(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                  placeholder="Comma separated names"
                  style={{
                    backgroundColor: 'var(--form-bg-default)',
                    borderColor: 'var(--form-border-default)',
                    color: 'var(--dash-text-primary)'
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    YouTube ID
                  </label>
                  <input
                    type="text"
                    name="youtube_id"
                    value={form.youtube_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                    placeholder="YouTube video ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status || 'draft'}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Media Information */}
          <div className="rounded-lg border p-6" style={{backgroundColor: 'var(--dash-bg-secondary)', borderColor: 'var(--dash-border)'}}>
            <h2 className="text-xl font-bold mb-4" style={{color: 'var(--dash-text-primary)'}}>Media Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                    YouTube ID
                  </label>
                  <input
                    type="text"
                    name="youtube_id"
                    value={form.youtube_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    placeholder="e.g., dQw4w9WgXcQ"
                    style={{
                      backgroundColor: 'var(--form-bg-default)',
                      borderColor: 'var(--form-border-default)',
                      color: 'var(--dash-text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                    Duration (formatted)
                  </label>
                  <input
                    type="text"
                    name="duration_formatted"
                    value={form.duration_formatted || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    placeholder="e.g., 8:45"
                    style={{
                      backgroundColor: 'var(--form-bg-default)',
                      borderColor: 'var(--form-border-default)',
                      color: 'var(--dash-text-primary)'
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={form.category || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    placeholder="e.g., Qawwali"
                    style={{
                      backgroundColor: 'var(--form-bg-default)',
                      borderColor: 'var(--form-border-default)',
                      color: 'var(--dash-text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                    Release Date
                  </label>
                  <input
                    type="date"
                    name="release_date"
                    value={form.release_date || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    style={{
                      backgroundColor: 'var(--form-bg-default)',
                      borderColor: 'var(--form-border-default)',
                      color: 'var(--dash-text-primary)'
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                    Views
                  </label>
                  <input
                    type="number"
                    name="view_count"
                    value={form.view_count || 0}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    style={{
                      backgroundColor: 'var(--form-bg-default)',
                      borderColor: 'var(--form-border-default)',
                      color: 'var(--dash-text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{color: 'var(--dash-text-primary)'}}>
                    Likes
                  </label>
                  <input
                    type="number"
                    name="like_count"
                    value={form.like_count || 0}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none"
                    style={{
                      backgroundColor: 'var(--form-bg-default)',
                      borderColor: 'var(--form-border-default)',
                      color: 'var(--dash-text-primary)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-lg border p-6" style={{backgroundColor: 'var(--dash-bg-secondary)', borderColor: 'var(--dash-border)'}}>
            <h2 className="text-xl font-bold mb-4" style={{color: 'var(--dash-text-primary)'}}>Features</h2>
            
            <div className="space-y-3">
              {[
                { key: 'enable_lyrics', label: 'Enable Lyrics' },
                { key: 'enable_commentary', label: 'Enable Commentary' },
                { key: 'enable_sponsors', label: 'Enable Sponsors' },
                { key: 'enable_adoption', label: 'Enable Song Adoption' },
                { key: 'enable_credits', label: 'Enable Credits' },
                { key: 'show_views', label: 'Show View Count' },
                { key: 'show_likes', label: 'Show Like Count' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer" style={{color: 'var(--dash-text-primary)'}}>
                  <input
                    type="checkbox"
                    name={key}
                    checked={(form as any)[key] || false}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded"
                    style={{
                      borderColor: 'var(--form-border-default)',
                      accentColor: 'var(--dash-accent)'
                    }}
                  />
                  <span className="font-semibold">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition"
              style={{
                backgroundColor: 'var(--dash-accent)',
                color: '#000',
                opacity: saving ? 0.6 : 1,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              <Save size={20} /> {saving ? 'Saving...' : 'Save Release'}
            </button>
            
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 rounded-lg font-semibold transition"
              style={{
                backgroundColor: 'var(--dash-bg-hover)',
                color: 'var(--dash-text-secondary)',
                border: `1px solid var(--dash-border)`,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
