"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
import { ProfileLayout, Notification } from '../../../components/profile/ProfileLayout';
import { Loader, FileText, ExternalLink, Layers } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { hasRoleAccess } from '@/app/lib/role-access';
import { ProfileCardEditor } from '@/app/components/profile/ProfileCardEditor';
import { getUserNotifications } from '@/app/lib/notifications';

interface ProducerProfile {
  id: string;
  user_id?: string;
  profile_status?: string;
  full_name: string;
  professional_name: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  primary_production_focus: string[];
  primary_tools: string;
  musical_background: string;
  portfolio_link: string;
  worked_structured_production: boolean | null;
  willing_defined_sequence: boolean | null;
  acknowledge_centralized_control: boolean;
  accept_framework: boolean;
  [key: string]: any;
}

const EMPTY: Omit<ProducerProfile, 'id'> = {
  full_name: '', professional_name: '', country: '', city: '', email: '',
  years_experience: '', primary_production_focus: [], primary_tools: '',
  musical_background: '', portfolio_link: '',
  worked_structured_production: null, willing_defined_sequence: null,
  acknowledge_centralized_control: false, accept_framework: false,
};

export default function ProducerProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProducerProfile | null>(null);
  const [formData, setFormData] = useState<Omit<ProducerProfile, 'id'>>(EMPTY);
  const [activeTab, setActiveTab] = useState<'submissions' | 'notifications'>('submissions');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!hasRoleAccess(user as any, 'producer')) { router.push('/'); return; }
    setNotifications(getUserNotifications(user.id).map(n => ({ ...n, notification_type: n.event })));
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/producers');
      const all: ProducerProfile[] = res.ok ? await res.json() : [];
      const found = all.find(p => p.user_id === user?.id);
      if (found) {
        setProfile(found);
        setFormData({ ...EMPTY, ...found });
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
    try {
      const res = await fetch(`/api/producers/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
      const res = await fetch(`/api/producers/${profile.id}`, {
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

  const toggleFocus = (focus: string) =>
    setFormData(prev => ({
      ...prev,
      primary_production_focus: prev.primary_production_focus.includes(focus)
        ? prev.primary_production_focus.filter((f: string) => f !== focus)
        : [...prev.primary_production_focus, focus],
    }));

  const status = profile?.profile_status || '';

  return (
    <ProfileLayout loading={loading} activeTab={activeTab} setActiveTab={setActiveTab} notifications={notifications}>
      <ProfileCardEditor role="producer" displayName={(formData.professional_name || formData.full_name) as string} status={status} />

      {/* ── Portfolio & Production Summary ── */}
      {profile && (
        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded p-6 mb-0">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-white">Your Portfolio</h4>
          </div>
          <div className="space-y-4">
            {profile.portfolio_link ? (
              <a
                href={profile.portfolio_link as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg text-sm font-medium transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Open Portfolio
              </a>
            ) : (
              <p className="text-neutral-500 text-sm">No portfolio link added yet. Add one in the <strong className="text-neutral-400">Portfolio Link</strong> field below.</p>
            )}
            {(profile.primary_production_focus as string[])?.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Production Focus</p>
                <div className="flex flex-wrap gap-2">
                  {(profile.primary_production_focus as string[]).map((f: string) => (
                    <span key={f} className="px-2.5 py-1 bg-neutral-800/60 border border-neutral-700 text-neutral-300 text-xs rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.primary_tools && (
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Tools / DAW</p>
                <p className="text-sm text-neutral-400">{profile.primary_tools as string}</p>
              </div>
            )}
          </div>
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
            <h3 className="text-lg font-semibold text-white">Producer Profile</h3>
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
                    <input type="text" required value={formData.full_name as string}
                      onChange={e => setFormData({ ...formData, full_name: DOMPurify.sanitize(e.target.value) })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Professional Name (if applicable)</label>
                    <input type="text" value={formData.professional_name as string}
                      onChange={e => setFormData({ ...formData, professional_name: DOMPurify.sanitize(e.target.value) })}
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
                    <input type="text" required value={formData.city as string}
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
                    <label className="block text-neutral-400 text-xs mb-1.5">Years of Experience</label>
                    <select required value={formData.years_experience as string} onChange={e => setFormData({ ...formData, years_experience: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm">
                      <option value="">Select experience</option>
                      {['0-2','2-5','5-10','10+'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Musical Competence</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-2">Primary Production Focus</label>
                    <div className="space-y-2">
                      {['Vocal arrangement','Composition structuring','Instrumental arrangement','Orchestration','Digital production (DAW-based)','Acoustic ensemble coordination'].map(focus => (
                        <label key={focus} className="flex items-center gap-2 text-neutral-300 text-sm">
                          <input type="checkbox" checked={(formData.primary_production_focus as string[]).includes(focus)}
                            onChange={() => toggleFocus(focus)}
                            className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                          {focus}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Primary Tools / DAW</label>
                    <input type="text" value={formData.primary_tools as string}
                      onChange={e => setFormData({ ...formData, primary_tools: DOMPurify.sanitize(e.target.value) })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Musical Background</label>
                    <textarea rows={4} value={formData.musical_background as string}
                      onChange={e => setFormData({ ...formData, musical_background: DOMPurify.sanitize(e.target.value) })}
                      placeholder="Brief overview of training, influences, or structured experience"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Portfolio Link (optional)</label>
                    <input type="url" value={formData.portfolio_link as string}
                      onChange={e => setFormData({ ...formData, portfolio_link: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-white mb-4">Workflow Alignment</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-2">Have you worked with structured vocal production before?</label>
                    <div className="space-y-2">
                      {[true, false].map(val => (
                        <label key={String(val)} className="flex items-center gap-2 text-neutral-300 text-sm">
                          <input type="radio" name="structuredExp" checked={formData.worked_structured_production === val}
                            onChange={() => setFormData({ ...formData, worked_structured_production: val })}
                            className="w-4 h-4" />
                          {val ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.willing_defined_sequence === true}
                        onChange={e => setFormData({ ...formData, willing_defined_sequence: e.target.checked ? true : null })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Willing to operate within a defined production sequence
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.acknowledge_centralized_control as boolean}
                        onChange={e => setFormData({ ...formData, acknowledge_centralized_control: e.target.checked })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Final mixing, mastering, and registry authorization remain centralized
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Governance Acknowledgment</h4>
                <div className="bg-neutral-900/30 border border-neutral-800 rounded p-4 mb-4">
                  <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
                    <p>Producers operate within an approved kalam workflow.</p>
                    <p>Assignments follow editorial confirmation and vocalist alignment.</p>
                    <p>All releases pass through studio validation prior to registry authorization.</p>
                  </div>
                </div>
                <label className="flex items-start gap-2 text-neutral-300 text-sm">
                  <input type="checkbox" checked={formData.accept_framework as boolean}
                    onChange={e => setFormData({ ...formData, accept_framework: e.target.checked })}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0" />
                  <span>I acknowledge and accept the institutional production framework.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={handleDelete} disabled={saving}
              className="px-8 py-2.5 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-400 border font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete Profile'}
            </button>
            <button onClick={handleSave} disabled={saving || !formData.accept_framework || !formData.acknowledge_centralized_control}
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
