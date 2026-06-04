"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertCircle, RefreshCw, BookOpen, Globe, Info
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { useAuth } from '@/app/contexts/AuthContext';
import type { KnowledgeEntity, KnowledgeEntityType } from '@/lib/knowledge-storage';

const ENTITY_TABS: { key: KnowledgeEntityType; label: string }[] = [
  { key: 'poet', label: 'Poets' },
  { key: 'saint', label: 'Saints' },
  { key: 'scholar', label: 'Scholars' },
  { key: 'practice', label: 'Spiritual Practices' },
  { key: 'quranicTheme', label: 'Quranic Themes' },
  { key: 'spiritualState', label: 'Spiritual States' },
  { key: 'musicalTradition', label: 'Musical Traditions' },
  { key: 'literaryTradition', label: 'Literary Traditions' }
];

export default function KnowledgeRegistryAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role.includes('admin') ?? false;

  useEffect(() => {
    if (!isAdmin && user) {
      router.push('/admin');
    }
  }, [user, isAdmin]);

  const [activeTab, setActiveTab] = useState<KnowledgeEntityType>('poet');
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [editingEntity, setEditingEntity] = useState<Partial<KnowledgeEntity> | null>(null);
  const [formSlug, setFormSlug] = useState('');
  const [formName, setFormName] = useState('');
  const [formAlternateNames, setFormAlternateNames] = useState('');
  const [formShortDescription, setFormShortDescription] = useState('');
  const [formLongDescription, setFormLongDescription] = useState('');
  const [formTheologicalNotes, setFormTheologicalNotes] = useState('');
  const [formHistoricalNotes, setFormHistoricalNotes] = useState('');
  
  // Relations arrays (comma separated input)
  const [formRegionLinks, setFormRegionLinks] = useState('');
  const [formLanguageLinks, setFormLanguageLinks] = useState('');
  const [formRelatedConcepts, setFormRelatedConcepts] = useState('');
  const [formRelatedReleases, setFormRelatedReleases] = useState('');
  const [formRelatedArticles, setFormRelatedArticles] = useState('');
  const [formRelatedPlaylists, setFormRelatedPlaylists] = useState('');
  const [formSameAs, setFormSameAs] = useState('');
  const [formWikidataId, setFormWikidataId] = useState('');
  
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPublic, setFormIsPublic] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const fetchEntities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/entities');
      if (res.ok) {
        const list = await res.json();
        setEntities(list);
      } else {
        setError('Failed to fetch knowledge registry database.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while loading entities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEntities();
    }
  }, [isAdmin]);

  const resetForm = () => {
    setEditingEntity(null);
    setFormSlug('');
    setFormName('');
    setFormAlternateNames('');
    setFormShortDescription('');
    setFormLongDescription('');
    setFormTheologicalNotes('');
    setFormHistoricalNotes('');
    setFormRegionLinks('');
    setFormLanguageLinks('');
    setFormRelatedConcepts('');
    setFormRelatedReleases('');
    setFormRelatedArticles('');
    setFormRelatedPlaylists('');
    setFormSameAs('');
    setFormWikidataId('');
    setFormIsActive(true);
    setFormIsPublic(false);
    setIsNew(false);
    setValidationErrors([]);
  };

  const handleEditClick = (entity: KnowledgeEntity) => {
    setError(null);
    setSuccess(null);
    setValidationErrors([]);
    setEditingEntity(entity);
    setFormSlug(entity.slug);
    setFormName(entity.name);
    setFormAlternateNames((entity.alternateNames || []).join(', '));
    setFormShortDescription(entity.shortDescription || '');
    setFormLongDescription(entity.longDescription || '');
    setFormTheologicalNotes(entity.theologicalNotes || '');
    setFormHistoricalNotes(entity.historicalNotes || '');
    setFormRegionLinks((entity.regionLinks || []).join(', '));
    setFormLanguageLinks((entity.languageLinks || []).join(', '));
    setFormRelatedConcepts((entity.relatedConcepts || []).join(', '));
    setFormRelatedReleases((entity.relatedReleases || []).join(', '));
    setFormRelatedArticles((entity.relatedArticles || []).join(', '));
    setFormRelatedPlaylists((entity.relatedPlaylists || []).join(', '));
    setFormSameAs((entity.sameAs || []).join(', '));
    setFormWikidataId(entity.wikidataId || '');
    setFormIsActive(entity.isActive !== false);
    setFormIsPublic(entity.isPublic === true);
    setIsNew(false);
  };

  const handleCreateNewClick = () => {
    setError(null);
    setSuccess(null);
    resetForm();
    setIsNew(true);
  };

  const splitAndTrim = (str: string) => 
    str.split(',').map(s => s.trim()).filter(s => s.length > 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Name is required');
      return;
    }

    let slug = formSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!slug) {
      slug = formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    if (slug.length < 2) {
      setError('Slug must be at least 2 characters');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    const payload = {
      ...editingEntity,
      type: activeTab,
      slug,
      name: formName.trim(),
      alternateNames: splitAndTrim(formAlternateNames),
      shortDescription: formShortDescription.trim(),
      longDescription: formLongDescription.trim(),
      theologicalNotes: formTheologicalNotes.trim() || undefined,
      historicalNotes: formHistoricalNotes.trim() || undefined,
      regionLinks: splitAndTrim(formRegionLinks),
      languageLinks: splitAndTrim(formLanguageLinks),
      relatedConcepts: splitAndTrim(formRelatedConcepts),
      relatedReleases: splitAndTrim(formRelatedReleases),
      relatedArticles: splitAndTrim(formRelatedArticles),
      relatedPlaylists: splitAndTrim(formRelatedPlaylists),
      sameAs: splitAndTrim(formSameAs),
      wikidataId: formWikidataId.trim() || undefined,
      isActive: formIsActive,
      isPublic: formIsPublic
    };

    try {
      const res = await fetch('/api/admin/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        setSuccess(`Knowledge Entity "${result.name}" saved successfully.`);
        resetForm();
        fetchEntities();
      } else {
        setError(result.error || 'Validation failed to save item.');
        if (result.details && Array.isArray(result.details)) {
          setValidationErrors(result.details);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete the entity "${slug}"?`)) return;

    setError(null);
    setSuccess(null);
    setValidationErrors([]);
    try {
      const res = await fetch(`/api/admin/entities/${activeTab}/${slug}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess(`Knowledge Entity "${slug}" deleted.`);
        fetchEntities();
      } else {
        const result = await res.json();
        setError(result.error || 'Failed to delete entity.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while deleting.');
    }
  };

  const activeEntities = entities.filter(e => e.type === activeTab);

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
              <h1 className="text-3xl font-bold flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
                <BookOpen className="text-purple-500" /> Knowledge Entity Registry
              </h1>
              <p className="text-sm mt-1" style={{color: 'var(--dash-text-muted)'}}>
                Govern Saints, Scholars, Poets, Practices, and Traditions. Enforce editorial quality standards before publication.
              </p>
            </div>
          </div>
          <div>
            <button
              onClick={fetchEntities}
              className="dashboard-btn-secondary px-4 py-2 flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="mb-6 p-4 rounded-lg space-y-2" style={{backgroundColor: 'var(--dash-status-rejected-bg)', border: '1px solid var(--dash-status-rejected)'}}>
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5" style={{color: 'var(--dash-status-rejected)'}} />
              <p className="text-sm" style={{color: 'var(--dash-status-rejected)'}}><strong>Error:</strong> {error}</p>
            </div>
            {validationErrors.length > 0 && (
              <ul className="text-xs list-disc pl-9 space-y-1" style={{color: 'var(--dash-status-rejected)'}}>
                {validationErrors.map((errText, idx) => (
                  <li key={idx}>{errText}</li>
                ))}
              </ul>
            )}
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
          {ENTITY_TABS.map(tab => {
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
                {tab.label} ({entities.filter(e => e.type === tab.key).length})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List Section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="dashboard-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold" style={{color: 'var(--dash-text-primary)'}}>
                  Registered {ENTITY_TABS.find(t => t.key === activeTab)?.label}
                </h3>
                <button
                  onClick={handleCreateNewClick}
                  className="dashboard-btn-primary px-3 py-1.5 flex items-center gap-1.5 text-xs"
                >
                  <Plus size={14} /> Add Entity
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12" style={{color: 'var(--dash-text-muted)'}}>
                  <RefreshCw className="animate-spin mx-auto mb-2" />
                  Loading entities...
                </div>
              ) : activeEntities.length === 0 ? (
                <div className="text-center py-12 text-sm" style={{color: 'var(--dash-text-muted)'}}>
                  No entities found in this category. Click "Add Entity" to create one.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeEntities.map(entity => (
                    <div 
                      key={entity.slug}
                      className="p-3 rounded-lg border flex items-center justify-between hover:bg-[var(--dash-bg-hover)] transition"
                      style={{borderColor: 'var(--dash-border)'}}
                    >
                      <div className="max-w-[70%]">
                        <div className="font-semibold text-xs truncate" style={{color: 'var(--dash-text-primary)'}}>{entity.name}</div>
                        <div className="text-[10px] font-mono opacity-60 mt-0.5 truncate">{entity.slug}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        {entity.knowledgeDensityScore !== undefined && (
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${entity.knowledgeDensityScore >= 80 ? 'text-green-400 bg-green-500/5 border border-green-500/20' : entity.knowledgeDensityScore >= 50 ? 'text-amber-400 bg-amber-500/5 border border-amber-500/20' : 'text-red-400 bg-red-500/5 border border-red-500/20'}`} title="Knowledge Density Score">
                            {entity.knowledgeDensityScore}%
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase`} style={{
                          backgroundColor: entity.isPublic ? 'var(--dash-status-approved-bg)' : 'var(--dash-status-review-bg)',
                          color: entity.isPublic ? 'var(--dash-status-approved)' : 'var(--dash-status-review)'
                        }}>
                          {entity.isPublic ? 'Public' : 'Draft'}
                        </span>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEditClick(entity)}
                            className="p-1 hover:text-[var(--dash-accent)] text-neutral-400 transition"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(entity.slug)}
                            className="p-1 hover:text-red-500 text-neutral-400 transition"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            {(isNew || editingEntity) ? (
              <form onSubmit={handleSave} className="dashboard-card p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b pb-3" style={{borderColor: 'var(--dash-border)'}}>
                  <h3 className="text-lg font-bold flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
                    {isNew ? 'Create New Knowledge Entity' : 'Edit Knowledge Entity'}
                    {!isNew && editingEntity && editingEntity.knowledgeDensityScore !== undefined && (
                      <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${editingEntity.knowledgeDensityScore >= 80 ? 'bg-green-500/10 text-green-400' : editingEntity.knowledgeDensityScore >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`} title="Knowledge Density Score">
                        Density: {editingEntity.knowledgeDensityScore}%
                      </span>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 p-1.5 rounded-lg text-[10px]" style={{color: 'var(--dash-text-muted)'}}>
                    <Info size={12} className="text-amber-500" />
                    Publishing requires: 40+ short words, 150+ long words, 1+ connection, 3+ internal links.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Info */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="form-input w-full text-sm"
                      placeholder="e.g. Hazrat Shah-i-Hamadan"
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
                      placeholder="e.g. shah-hamadan"
                      disabled={!isNew}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Alternate Names / Spellings <span className="text-neutral-500">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formAlternateNames}
                      onChange={(e) => setFormAlternateNames(e.target.value)}
                      className="form-input w-full text-sm"
                      placeholder="Mir Sayyid Ali Hamadani, Ameer-e-Kabeer"
                    />
                  </div>

                  {/* Descriptions */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Short Description <span className="text-red-500">* (Min 40 words for public)</span>
                    </label>
                    <textarea
                      value={formShortDescription}
                      onChange={(e) => setFormShortDescription(e.target.value)}
                      className="form-input w-full text-sm"
                      rows={3}
                      placeholder="Enter short description..."
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Long Description <span className="text-red-500">* (Min 150 words for public)</span>
                    </label>
                    <textarea
                      value={formLongDescription}
                      onChange={(e) => setFormLongDescription(e.target.value)}
                      className="form-input w-full text-sm"
                      rows={6}
                      placeholder="Enter comprehensive long description..."
                      required
                    />
                  </div>

                  {/* Scholarly/Theological Notes */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Theological / Philosophical Notes
                    </label>
                    <textarea
                      value={formTheologicalNotes}
                      onChange={(e) => setFormTheologicalNotes(e.target.value)}
                      className="form-input w-full text-sm font-serif"
                      rows={3}
                      placeholder="Enter optional notes..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Historical Context Notes
                    </label>
                    <textarea
                      value={formHistoricalNotes}
                      onChange={(e) => setFormHistoricalNotes(e.target.value)}
                      className="form-input w-full text-sm"
                      rows={3}
                      placeholder="Enter optional historical context..."
                    />
                  </div>

                  {/* Relations lists */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Linked Concepts <span className="text-neutral-500">(comma separated slugs)</span>
                    </label>
                    <input
                      type="text"
                      value={formRelatedConcepts}
                      onChange={(e) => setFormRelatedConcepts(e.target.value)}
                      className="form-input w-full text-xs font-mono"
                      placeholder="sabr, ishq, fana"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Linked Releases <span className="text-neutral-500">(comma separated IDs)</span>
                    </label>
                    <input
                      type="text"
                      value={formRelatedReleases}
                      onChange={(e) => setFormRelatedReleases(e.target.value)}
                      className="form-input w-full text-xs font-mono"
                      placeholder="release_id_1, release_id_2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Linked Regions <span className="text-neutral-500">(comma separated slugs)</span>
                    </label>
                    <input
                      type="text"
                      value={formRegionLinks}
                      onChange={(e) => setFormRegionLinks(e.target.value)}
                      className="form-input w-full text-xs font-mono"
                      placeholder="pk, in, tr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      Linked Languages <span className="text-neutral-500">(comma separated slugs)</span>
                    </label>
                    <input
                      type="text"
                      value={formLanguageLinks}
                      onChange={(e) => setFormLanguageLinks(e.target.value)}
                      className="form-input w-full text-xs font-mono"
                      placeholder="ur, fa, tr"
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
                      placeholder="e.g. Q372332"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>
                      External Reference URLs <span className="text-neutral-500">(comma separated)</span>
                    </label>
                    <input
                      type="text"
                      value={formSameAs}
                      onChange={(e) => setFormSameAs(e.target.value)}
                      className="form-input w-full text-xs font-mono"
                      placeholder="https://en.wikipedia.org/wiki/Shah_Hamadan"
                    />
                  </div>

                  {/* Status checklist */}
                  <div className="md:col-span-2 flex gap-6 pt-3 border-t" style={{borderColor: 'var(--dash-border)'}}>
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
                      Public Published
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t" style={{borderColor: 'var(--dash-border)'}}>
                  <button
                    type="submit"
                    className="dashboard-btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5"
                    disabled={saving}
                  >
                    <Save size={14} />
                    {saving ? 'Saving Entity...' : 'Save Knowledge Entity'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="dashboard-btn-secondary px-4 py-2.5 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="dashboard-card p-12 text-center" style={{color: 'var(--dash-text-muted)'}}>
                <Globe className="w-16 h-16 mx-auto mb-4 opacity-25 animate-pulse" />
                <h4 className="text-sm font-semibold mb-1" style={{color: 'var(--dash-text-primary)'}}>No Entity Selected</h4>
                <p className="text-xs max-w-xs mx-auto">
                  Click "Edit" on a registered entity in the left list drawer, or click "Add Entity" to govern a new spiritual node.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
