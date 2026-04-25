"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
import { ProfileLayout, Notification } from '../../../components/profile/ProfileLayout';
import { Loader, FileText, ScrollText, ExternalLink } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { hasRoleAccess } from '@/app/lib/role-access';
import { ProfileCardEditor } from '@/app/components/profile/ProfileCardEditor';
import { getUserNotifications } from '@/app/lib/notifications';

interface WriterProfile {
  id: string;
  user_id?: string;
  profile_status?: string;
  full_name: string;
  pen_name: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  primary_languages: string | string[];
  writing_styles: string[];
  literary_background: string;
  thematic_focus: string;
  sample_kalam: string;
  previous_publications: string;
  editorial_review_experience: boolean;
  willing_editorial_process: boolean;
  revision_acknowledged: boolean;
  institutional_acknowledged: boolean;
  [key: string]: any;
}

const EMPTY: Omit<WriterProfile, 'id'> = {
  full_name: '', pen_name: '', country: '', city: '', email: '',
  years_experience: '', primary_languages: '', writing_styles: [],
  literary_background: '', thematic_focus: '', sample_kalam: '',
  previous_publications: '', editorial_review_experience: false,
  willing_editorial_process: false, revision_acknowledged: false,
  institutional_acknowledged: false,
};

export default function WriterProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<WriterProfile | null>(null);
  const [formData, setFormData] = useState<Omit<WriterProfile, 'id'>>(EMPTY);
  const [activeTab, setActiveTab] = useState<'submissions' | 'notifications'>('submissions');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!hasRoleAccess(user as any, 'writer')) { router.push('/'); return; }
    setNotifications(getUserNotifications(user.id).map(n => ({ ...n, notification_type: n.event })));
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/writers');
      const all: WriterProfile[] = res.ok ? await res.json() : [];
      const found = all.find(w => w.user_id === user?.id);
      if (found) {
        setProfile(found);
        setFormData({
          ...EMPTY,
          ...found,
          primary_languages: Array.isArray(found.primary_languages)
            ? found.primary_languages.join(', ')
            : found.primary_languages || '',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveMsg(null);
    const payload = {
      ...formData,
      primary_languages: typeof formData.primary_languages === 'string'
        ? formData.primary_languages.split(/[,\s]+/).filter(Boolean)
        : formData.primary_languages,
    };
    try {
      const res = await fetch(`/api/writers/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setProfile(updated);
      setSaveMsg({ type: 'success', text: 'Profile saved.' });
    } catch {
      setSaveMsg({ type: 'error', text: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/writers/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_status: 'deleted' }),
      });
      if (res.ok) {
        setProfile(null);
        setFormData(EMPTY);
        setSaveMsg({ type: 'success', text: 'Profile removed.' });
      }
    } catch {
      setSaveMsg({ type: 'error', text: 'Failed to delete profile.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleStyle = (style: string) =>
    setFormData(prev => ({
      ...prev,
      writing_styles: prev.writing_styles.includes(style)
        ? prev.writing_styles.filter((s: string) => s !== style)
        : [...prev.writing_styles, style],
    }));

  const status = profile?.profile_status || '';

  return (
    <ProfileLayout loading={loading} activeTab={activeTab} setActiveTab={setActiveTab} notifications={notifications}>
      <ProfileCardEditor role="writer" displayName={(formData.pen_name || formData.full_name) as string} status={status} />

      {/* ── Sample Kalam Display ── */}
      {profile && (
        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded p-6 mb-0">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-white">Your Sample Kalam</h4>
          </div>
          {profile.sample_kalam ? (
            <div>
              <pre className="text-neutral-300 text-sm font-mono whitespace-pre-wrap leading-loose bg-neutral-900/60 border border-neutral-800 rounded-lg p-5 max-h-72 overflow-y-auto">
                {profile.sample_kalam as string}
              </pre>
              {profile.previous_publications && (
                <div className="mt-4 pt-4 border-t border-neutral-800">
                  <p className="text-xs text-neutral-500 mb-1 uppercase tracking-wide">Previous Publications</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">{profile.previous_publications as string}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-6 text-center">
              <p className="text-neutral-500 text-sm">No sample kalam added yet.</p>
              <p className="text-neutral-600 text-xs mt-1">Paste your original kalam in the <strong className="text-neutral-500">Sample Kalam</strong> field in the form below, then save.</p>
            </div>
          )}
        </div>
      )}

      {!profile ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Profile yet</h3>
          <p className="text-neutral-400">Your profile will appear here once you apply or submit form.</p>
        </div>
      ) : (
        <form className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Writer Profile</h3>
            {status && <div className="bg-yellow-400 capitalize text-black rounded-lg px-4 py-2 text-sm">{status.replace(/_/g, ' ')}</div>}
            {profile.id && <span className="font-mono text-xs text-neutral-500 ml-auto">Profile ID: {profile.id}</span>}
          </div>

          {saveMsg && (
            <div className={`mb-6 p-4 rounded ${saveMsg.type === 'success' ? 'bg-green-900/20 border border-green-800/50' : 'bg-red-900/20 border border-red-800/50'}`}>
              <p className={`text-sm ${saveMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{saveMsg.text}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-white mb-4">Identity & Background</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Full Name</label>
                    <input type="text" required maxLength={200} value={formData.full_name as string}
                      onChange={e => setFormData({ ...formData, full_name: DOMPurify.sanitize(e.target.value) })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Pen Name (if applicable)</label>
                    <input type="text" maxLength={200} value={formData.pen_name as string}
                      onChange={e => setFormData({ ...formData, pen_name: DOMPurify.sanitize(e.target.value) })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Country</label>
                    <select required value={formData.country as string} onChange={e => setFormData({ ...formData, country: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm">
                      <option value="">Select country</option>
                      {['USA','Canada','UAE','India','UK','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">City</label>
                    <input type="text" required maxLength={200} value={formData.city as string}
                      onChange={e => setFormData({ ...formData, city: DOMPurify.sanitize(e.target.value) })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Email Address</label>
                    <input type="email" required value={formData.email as string}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Years of Writing Experience</label>
                    <select required value={formData.years_experience as string} onChange={e => setFormData({ ...formData, years_experience: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm">
                      <option value="">Select experience</option>
                      {['0-2','2-5','5-10','10+'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Literary Competence</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Primary Writing Languages</label>
                    <input type="text" maxLength={500} value={formData.primary_languages as string}
                      onChange={e => setFormData({ ...formData, primary_languages: DOMPurify.sanitize(e.target.value) })}
                      placeholder="e.g., Urdu, Arabic, Persian, English"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-2">Writing Style & Form</label>
                    <div className="space-y-2">
                      {['Classical Ghazal','Nazm','Qasida','Hamd & Naat','Contemporary devotional','Free verse'].map(style => (
                        <label key={style} className="flex items-center gap-2 text-neutral-300 text-sm">
                          <input type="checkbox" checked={(formData.writing_styles as string[]).includes(style)}
                            onChange={() => toggleStyle(style)}
                            className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                          {style}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Literary Background</label>
                    <textarea rows={4} maxLength={2000} value={formData.literary_background as string}
                      onChange={e => setFormData({ ...formData, literary_background: DOMPurify.sanitize(e.target.value) })}
                      placeholder="Brief overview of literary training, influences, or formal education"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Thematic Focus</label>
                    <textarea rows={3} maxLength={1000} value={formData.thematic_focus as string}
                      onChange={e => setFormData({ ...formData, thematic_focus: DOMPurify.sanitize(e.target.value) })}
                      placeholder="Core themes you explore in your writing"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-white mb-4">Sample Work & Publications</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Sample Kalam</label>
                    <textarea rows={8} maxLength={10000} value={formData.sample_kalam as string}
                      onChange={e => setFormData({ ...formData, sample_kalam: DOMPurify.sanitize(e.target.value) })}
                      placeholder="Paste original kalam (must be unpublished work)"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Previous Publications (optional)</label>
                    <textarea rows={3} maxLength={2000} value={formData.previous_publications as string}
                      onChange={e => setFormData({ ...formData, previous_publications: DOMPurify.sanitize(e.target.value) })}
                      placeholder="List any published works or credentials"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Workflow Alignment</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-2">Have you worked with editorial review processes before?</label>
                    <div className="space-y-2">
                      {[true, false].map(val => (
                        <label key={String(val)} className="flex items-center gap-2 text-neutral-300 text-sm">
                          <input type="radio" name="editorialExp" checked={formData.editorial_review_experience === val}
                            onChange={() => setFormData({ ...formData, editorial_review_experience: val })}
                            className="w-4 h-4" />
                          {val ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.willing_editorial_process as boolean}
                        onChange={e => setFormData({ ...formData, willing_editorial_process: e.target.checked })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Willing to participate in the structured editorial process
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.revision_acknowledged as boolean}
                        onChange={e => setFormData({ ...formData, revision_acknowledged: e.target.checked })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Submitted kalam may require revision before approval
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Governance Acknowledgment</h4>
                <div className="bg-neutral-900/30 border border-neutral-800 rounded p-4 mb-4">
                  <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
                    <p>All kalam submissions undergo institutional editorial review.</p>
                    <p>Writers do not independently authorize publication or production.</p>
                    <p>Origination does not equal production clearance or registry authorization.</p>
                  </div>
                </div>
                <label className="flex items-start gap-2 text-neutral-300 text-sm">
                  <input type="checkbox" checked={formData.institutional_acknowledged as boolean}
                    onChange={e => setFormData({ ...formData, institutional_acknowledged: e.target.checked })}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0" />
                  <span>I acknowledge and accept the institutional editorial framework.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={handleDelete} disabled={saving}
              className="px-8 py-2.5 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-400 border font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete Profile'}
            </button>
            <button onClick={handleSave} disabled={saving || !formData.institutional_acknowledged}
              className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </ProfileLayout>
  );
}
