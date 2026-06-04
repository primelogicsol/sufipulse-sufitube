"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, Globe } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useAuth } from '@/app/contexts/AuthContext';
import type { RegistryItem, RegistriesData } from '@/lib/registries-storage';

type RegistryType = keyof RegistriesData;

const TABS: { key: RegistryType; label: string }[] = [
  { key: 'concepts', label: 'Sufi Concepts' },
  { key: 'themes', label: 'Spiritual Themes' },
  { key: 'moods', label: 'Moods & Atmosphere' },
  { key: 'regions', label: 'Target Regions' },
  { key: 'languages', label: 'Target Languages' },
  { key: 'diasporaMarkets', label: 'Diaspora Markets' },
  { key: 'playlists', label: 'Playlists' }
];

export default function RegistriesAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role.includes('admin') ?? false;

  useEffect(() => {
    if (!isAdmin && user) {
      router.push('/admin');
    }
  }, [user, isAdmin]);

  const [activeTab, setActiveTab] = useState<RegistryType>('concepts');
  const [data, setData] = useState<RegistriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [editingItem, setEditingItem] = useState<Partial<RegistryItem> | null>(null);
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTheologicalNotes, setFormTheologicalNotes] = useState('');
  const [formSynonyms, setFormSynonyms] = useState('');
  const [formWikidataId, setFormWikidataId] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPublic, setFormIsPublic] = useState(true);

  const [isNew, setIsNew] = useState(false);

  const fetchRegistries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/registries');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        setError('Failed to fetch master registries database.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching registries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchRegistries();
    }
  }, [isAdmin]);

  const resetForm = () => {
    setEditingItem(null);
    setFormSlug('');
    setFormTitle('');
    setFormDescription('');
    setFormTheologicalNotes('');
    setFormSynonyms('');
    setFormWikidataId('');
    setFormIsActive(true);
    setFormIsPublic(true);
    setIsNew(false);
  };

  const handleEditClick = (item: RegistryItem) => {
    setError(null);
    setSuccess(null);
    setEditingItem(item);
    setFormSlug(item.slug);
    setFormTitle(item.title);
    setFormDescription(item.description);
    setFormTheologicalNotes(item.theologicalNotes || '');
    setFormSynonyms((item.synonyms || []).join(', '));
    setFormWikidataId(item.wikidataId || '');
    setFormIsActive(item.isActive !== false);
    setFormIsPublic(item.isPublic !== false);
    setIsNew(false);
  };

  const handleCreateNewClick = () => {
    setError(null);
    setSuccess(null);
    resetForm();
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError('Title is required');
      return;
    }

    let slug = formSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) {
      slug = formTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    if (slug.length < 2) {
      setError('Slug must be at least 2 characters');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const synonymsArr = formSynonyms
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      type: activeTab,
      item: {
        ...editingItem,
        slug,
        title: formTitle.trim(),
        description: formDescription.trim(),
        theologicalNotes: formTheologicalNotes.trim() || undefined,
        synonyms: synonymsArr,
        wikidataId: formWikidataId.trim() || undefined,
        isActive: formIsActive,
        isPublic: formIsPublic
      }
    };

    try {
      const res = await fetch('/api/admin/registries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        setSuccess(`Registry item "${result.title}" saved successfully.`);
        resetForm();
        fetchRegistries();
      } else {
        setError(result.error || 'Validation failed to save item.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete the registry item "${slug}"?`)) return;

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/registries/${activeTab}/${slug}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess(`Registry item "${slug}" deleted.`);
        fetchRegistries();
      } else {
        const result = await res.json();
        setError(result.error || 'Failed to delete item.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while deleting.');
    }
  };

  const activeItems = data ? data[activeTab] || [] : [];

  return (
    <DashboardLayout>
      <div className="px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="flex items-center gap-2 transition" style={{color: 'var(--dash-text-secondary)'}}>
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold" style={{color: 'var(--dash-text-primary)'}}>
                Master Registries & Taxonomy
              </h1>
              <p className="text-sm mt-1" style={{color: 'var(--dash-text-muted)'}}>
                Manage governed concepts, spiritual themes, moods, and target markets to maintain clean relationship graphs.
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={fetchRegistries}
              className="dashboard-btn-secondary px-4 py-2 flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{backgroundColor: 'var(--dash-status-rejected-bg)', border: '1px solid var(--dash-status-rejected)'}}>
            <AlertCircle size={18} className="mt-0.5" style={{color: 'var(--dash-status-rejected)'}} />
            <p className="text-sm" style={{color: 'var(--dash-status-rejected)'}}><strong>Error:</strong> {error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg flex items-start gap-3" style={{backgroundColor: 'var(--dash-status-approved-bg)', border: '1px solid var(--dash-status-approved)'}}>
            <CheckCircle size={18} className="mt-0.5" style={{color: 'var(--dash-status-approved)'}} />
            <p className="text-sm" style={{color: 'var(--dash-status-approved)'}}><strong>Success:</strong> {success}</p>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 mb-8 border-b" style={{ borderColor: 'var(--dash-border)' }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); resetForm(); }}
                className="px-4 py-3 text-sm font-semibold border-b-2 transition"
                style={{
                  color: isActive ? 'var(--dash-accent)' : 'var(--dash-text-secondary)',
                  borderBottomColor: isActive ? 'var(--dash-accent)' : 'transparent',
                }}
              >
                {tab.label} ({(data?.[tab.key] || []).length})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="dashboard-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{color: 'var(--dash-text-primary)'}}>
                  Current {TABS.find(t => t.key === activeTab)?.label}
                </h3>
                <button
                  onClick={handleCreateNewClick}
                  className="dashboard-btn-primary px-3 py-1.5 flex items-center gap-1.5 text-xs"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12" style={{color: 'var(--dash-text-muted)'}}>
                  <LoaderIcon className="animate-spin mx-auto mb-2" />
                  Loading registry data...
                </div>
              ) : activeItems.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{color: 'var(--dash-text-muted)'}}>
                  No registry items found in this category. Click "Add Item" to add one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--dash-border)' }}>
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--dash-text-muted)'}}>Title / Slug</th>
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--dash-text-muted)'}}>Description</th>
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider" style={{color: 'var(--dash-text-muted)'}}>Status</th>
                        <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-right" style={{color: 'var(--dash-text-muted)'}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--dash-border)' }}>
                      {activeItems.map(item => (
                        <tr key={item.slug} className="hover:bg-[var(--dash-bg-hover)] transition">
                          <td className="py-4 pr-3">
                            <div className="font-semibold text-sm" style={{color: 'var(--dash-text-primary)'}}>{item.title}</div>
                            <div className="text-xs font-mono" style={{color: 'var(--dash-text-muted)'}}>{item.slug}</div>
                            {item.synonyms && item.synonyms.length > 0 && (
                              <div className="text-[10px] mt-1" style={{color: 'var(--dash-text-secondary)'}}>
                                Syn: {item.synonyms.join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="py-4 pr-3 max-w-xs truncate text-xs" style={{color: 'var(--dash-text-secondary)'}}>
                            {item.description || '—'}
                          </td>
                          <td className="py-4 pr-3 text-xs">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1">
                                {item.isActive ? (
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                )}
                                {item.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="flex items-center gap-1 text-[10px]" style={{color: 'var(--dash-text-muted)'}}>
                                {item.isPublic ? 'Public' : 'Private'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1 hover:text-[var(--dash-accent)] text-neutral-400 transition"
                              title="Edit item"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.slug)}
                              className="p-1 hover:text-red-500 text-neutral-400 transition"
                              title="Delete item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Form Side Card */}
          <div>
            {(isNew || editingItem) ? (
              <form onSubmit={handleSave} className="dashboard-card p-6 space-y-4 animate-in fade-in duration-200">
                <h3 className="text-lg font-semibold" style={{color: 'var(--dash-text-primary)'}}>
                  {isNew ? 'Create New Item' : 'Edit Registry Item'}
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="form-input w-full text-sm"
                      placeholder="e.g. Sabr (Spiritual Patience)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="form-input w-full text-sm font-mono"
                      placeholder="sabr"
                      disabled={!isNew}
                      required
                    />
                    {isNew && (
                      <p className="text-[10px] mt-1" style={{color: 'var(--dash-text-muted)'}}>
                        Standardized to url-friendly slug automatically
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Description / Explanation
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="form-input w-full text-sm"
                      rows={3}
                      placeholder=" Steafast patience and self-restraint..."
                    />
                  </div>

                  {activeTab === 'concepts' && (
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                        Theological/Historical Notes
                      </label>
                      <textarea
                        value={formTheologicalNotes}
                        onChange={(e) => setFormTheologicalNotes(e.target.value)}
                        className="form-input w-full text-sm font-serif"
                        rows={3}
                        placeholder=" Notes on station of Sabr in Sufi poetry..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Synonyms <span className="text-neutral-500">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formSynonyms}
                      onChange={(e) => setFormSynonyms(e.target.value)}
                      className="form-input w-full text-sm"
                      placeholder="patience, endurance, sabar"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Wikidata Entity ID <span className="text-neutral-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formWikidataId}
                      onChange={(e) => setFormWikidataId(e.target.value)}
                      className="form-input w-full text-sm font-mono"
                      placeholder="e.g. Q3359005"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs" style={{color: 'var(--dash-text-primary)'}}>
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        style={{accentColor: 'var(--dash-accent)'}}
                      />
                      Active Status
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs" style={{color: 'var(--dash-text-primary)'}}>
                      <input
                        type="checkbox"
                        checked={formIsPublic}
                        onChange={(e) => setFormIsPublic(e.target.checked)}
                        style={{accentColor: 'var(--dash-accent)'}}
                      />
                      Public Visible
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t" style={{borderColor: 'var(--dash-border)'}}>
                  <button
                    type="submit"
                    className="dashboard-btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                    disabled={saving}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save Item'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="dashboard-btn-secondary px-3 py-2 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="dashboard-card p-6 text-center py-12" style={{color: 'var(--dash-text-muted)'}}>
                <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <h4 className="text-sm font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>No item selected</h4>
                <p className="text-xs max-w-xs mx-auto">
                  Click "Edit" on an item or click "Add Item" to create a new managed taxonomy node.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LoaderIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
