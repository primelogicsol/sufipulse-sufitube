"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
import { ProfileLayout, Notification } from '../../../components/profile/ProfileLayout';
import { Loader, FileText } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { hasRoleAccess } from '@/app/lib/role-access';
import { getUserNotifications } from '@/app/lib/notifications';

interface StudioProfile {
  id: string;
  user_id?: string;
  profile_status?: string;
  studio_name: string;
  country: string;
  city: string;
  primary_contact_name: string;
  email: string;
  phone: string;
  recording_capabilities: string[];
  equipment_overview: string;
  years_in_operation: string;
  previous_work_link: string;
  agree_centralized_validation: boolean | null;
  agree_centralized_authorization: boolean | null;
  accept_terms: boolean;
  [key: string]: any;
}

const EMPTY: Omit<StudioProfile, 'id'> = {
  studio_name: '', country: '', city: '', primary_contact_name: '',
  email: '', phone: '', recording_capabilities: [], equipment_overview: '',
  years_in_operation: '', previous_work_link: '',
  agree_centralized_validation: null, agree_centralized_authorization: null,
  accept_terms: false,
};

export default function StudioProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudioProfile | null>(null);
  const [formData, setFormData] = useState<Omit<StudioProfile, 'id'>>(EMPTY);
  const [activeTab, setActiveTab] = useState<'submissions' | 'notifications'>('submissions');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!hasRoleAccess(user as any, 'studio')) { router.push('/'); return; }
    setNotifications(getUserNotifications(user.id).map(n => ({ ...n, notification_type: n.event })));
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/studio');
      const all: StudioProfile[] = res.ok ? await res.json() : [];
      const found = all.find(s => s.user_id === user?.id);
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
      const res = await fetch(`/api/studio/${profile.id}`, {
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
      const res = await fetch(`/api/studio/${profile.id}`, {
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

  const toggleCapability = (cap: string) =>
    setFormData(prev => ({
      ...prev,
      recording_capabilities: prev.recording_capabilities.includes(cap)
        ? prev.recording_capabilities.filter((c: string) => c !== cap)
        : [...prev.recording_capabilities, cap],
    }));

  const status = profile?.profile_status || '';

  return (
    <ProfileLayout loading={loading} activeTab={activeTab} setActiveTab={setActiveTab} notifications={notifications}>
      {!profile ? (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Profile yet</h3>
          <p className="text-neutral-400">Your profile will appear here once you apply or submit form.</p>
        </div>
      ) : (
        <form className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Studio Profile</h3>
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
                <h4 className="text-sm font-medium text-white mb-4">Studio Identity</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Studio Name</label>
                    <input type="text" required value={formData.studio_name as string}
                      onChange={e => setFormData({ ...formData, studio_name: DOMPurify.sanitize(e.target.value) })}
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
                    <label className="block text-neutral-400 text-xs mb-1.5">Primary Contact Name</label>
                    <input type="text" required value={formData.primary_contact_name as string}
                      onChange={e => setFormData({ ...formData, primary_contact_name: DOMPurify.sanitize(e.target.value) })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Email Address</label>
                    <input type="email" required value={formData.email as string}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Phone (optional)</label>
                    <input type="tel" value={formData.phone as string}
                      onChange={e => setFormData({ ...formData, phone: DOMPurify.sanitize(e.target.value) })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Technical Profile</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-2">Recording Capability</label>
                    <div className="space-y-2">
                      {['Vocal recording booth','Treated acoustic environment','Multi-track capability','Professional microphone chain','DAW-based recording system'].map(cap => (
                        <label key={cap} className="flex items-center gap-2 text-neutral-300 text-sm">
                          <input type="checkbox" checked={(formData.recording_capabilities as string[]).includes(cap)}
                            onChange={() => toggleCapability(cap)}
                            className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                          {cap}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Primary Equipment Overview</label>
                    <textarea rows={4} value={formData.equipment_overview as string}
                      onChange={e => setFormData({ ...formData, equipment_overview: DOMPurify.sanitize(e.target.value) })}
                      placeholder="Brief description of microphone, interface, DAW, monitoring"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-medium text-white mb-4">Operational Alignment</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Years in Operation</label>
                    <select required value={formData.years_in_operation as string} onChange={e => setFormData({ ...formData, years_in_operation: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm">
                      <option value="">Select experience</option>
                      {['0-1','1-3','3-5','5+'].map(v => <option key={v} value={v}>{v} years</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Previous Work (optional)</label>
                    <input type="url" value={formData.previous_work_link as string}
                      onChange={e => setFormData({ ...formData, previous_work_link: e.target.value })}
                      placeholder="https://"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.agree_centralized_validation === true}
                        onChange={e => setFormData({ ...formData, agree_centralized_validation: e.target.checked ? true : null })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Operate under centralized review and final master validation
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.agree_centralized_authorization === true}
                        onChange={e => setFormData({ ...formData, agree_centralized_authorization: e.target.checked ? true : null })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Mixing, mastering, and publication authorization remain centralized
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Governance Acknowledgment</h4>
                <div className="bg-neutral-900/30 border border-neutral-800 rounded p-4 mb-4">
                  <p className="text-neutral-300 text-xs leading-relaxed">
                    Network studios operate within a documented production framework. Recording sessions are assigned through centralized coordination and restricted to approved contributors.
                  </p>
                </div>
                <label className="flex items-start gap-2 text-neutral-300 text-sm">
                  <input type="checkbox" checked={formData.accept_terms as boolean}
                    onChange={e => setFormData({ ...formData, accept_terms: e.target.checked })}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0" />
                  <span>I acknowledge and accept these terms.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={handleDelete} disabled={saving}
              className="px-8 py-2.5 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-400 border font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete Profile'}
            </button>
            <button onClick={handleSave} disabled={saving || !formData.accept_terms || !formData.agree_centralized_authorization || !formData.agree_centralized_validation}
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
