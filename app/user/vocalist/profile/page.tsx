"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
import { ProfileLayout, Notification } from '../../../components/profile/ProfileLayout';
import { Loader, FileText, ExternalLink, Music } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { hasRoleAccess } from '@/app/lib/role-access';
import { ProfileCardEditor } from '@/app/components/profile/ProfileCardEditor';
import { getUserNotifications } from '@/app/lib/notifications';

interface VocalistProfile {
  id: string;
  user_id?: string;
  profile_status?: string;
  full_name: string;
  performance_name: string;
  country: string;
  city: string;
  email: string;
  years_experience: string;
  vocal_range: string;
  performance_styles: string[];
  languages_performed: string | string[];
  musical_training: string;
  sample_link: string;
  worked_in_studio: boolean | null;
  willing_editorial_approval: boolean | null;
  accept_producer_coordination: boolean;
  accept_framework: boolean;
  [key: string]: any;
}

const EMPTY: Omit<VocalistProfile, 'id'> = {
  full_name: '', performance_name: '', country: '', city: '', email: '',
  years_experience: '', vocal_range: '', performance_styles: [],
  languages_performed: '', musical_training: '', sample_link: '',
  worked_in_studio: null, willing_editorial_approval: null,
  accept_producer_coordination: false, accept_framework: false,
};

export default function VocalistProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [profile, setProfile] = useState<VocalistProfile | null>(null);
  const [formData, setFormData] = useState<Omit<VocalistProfile, 'id'>>(EMPTY);
  const [activeTab, setActiveTab] = useState<'submissions' | 'notifications'>('submissions');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (!hasRoleAccess(user as any, 'vocalist')) { router.push('/'); return; }
    setNotifications(getUserNotifications(user.id).map(n => ({ ...n, notification_type: n.event })));
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vocalists');
      const all: VocalistProfile[] = res.ok ? await res.json() : [];
      const found = all.find(v => v.user_id === user?.id);
      if (found) {
        setProfile(found);
        setFormData({
          ...EMPTY,
          ...found,
          languages_performed: Array.isArray(found.languages_performed)
            ? found.languages_performed.join(', ')
            : found.languages_performed || '',
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
    setSaveStatus('saving');
    setSaveMsg(null);
    const payload = {
      ...formData,
      languages_performed: typeof formData.languages_performed === 'string'
        ? formData.languages_performed.split(/[,\s]+/).filter(Boolean)
        : formData.languages_performed,
    };
    try {
      const res = await fetch(`/api/vocalists/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      setProfile(updated);
      setSaveMsg({ type: 'success', text: 'Profile saved.' });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveMsg({ type: 'error', text: 'Failed to save. Please try again.' });
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/vocalists/${profile.id}`, {
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
      performance_styles: prev.performance_styles.includes(style)
        ? prev.performance_styles.filter((s: string) => s !== style)
        : [...prev.performance_styles, style],
    }));

  const status = profile?.profile_status || '';

  function extractYouTubeId(url: string): string | null {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/\s]+)/);
    return m ? m[1] : null;
  }

  return (
    <ProfileLayout loading={loading} activeTab={activeTab} setActiveTab={setActiveTab} notifications={notifications}>
      <ProfileCardEditor role="vocalist" displayName={(formData.performance_name || formData.full_name) as string} status={status} />

      {/* ── Vocal Sample Preview ── */}
      {profile && (
        <div className="bg-neutral-950/50 border border-neutral-800/50 rounded p-6 mb-0">
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-semibold text-white">Your Vocal Sample</h4>
          </div>
          {profile.sample_link ? (
            (() => {
              const ytId = extractYouTubeId(profile.sample_link as string);
              return ytId ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={profile.sample_link as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-amber-400 text-sm hover:text-amber-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Sample Link
                </a>
              );
            })()
          ) : (
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg p-6 text-center">
              <p className="text-neutral-500 text-sm">No sample link added yet.</p>
              <p className="text-neutral-600 text-xs mt-1">Upload your vocal sample to YouTube and paste the link in the <strong className="text-neutral-500">Performance Sample Link</strong> field in the form below, then save.</p>
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
            <h3 className="text-lg font-semibold text-white">Vocalist Profile</h3>
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
                    <label className="block text-neutral-400 text-xs mb-1.5">Performance Name (if applicable)</label>
                    <input type="text" value={formData.performance_name as string}
                      onChange={e => setFormData({ ...formData, performance_name: DOMPurify.sanitize(e.target.value) })}
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
                    <label className="block text-neutral-400 text-xs mb-1.5">Years of Vocal Performance</label>
                    <select required value={formData.years_experience as string} onChange={e => setFormData({ ...formData, years_experience: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm">
                      <option value="">Select experience</option>
                      {['0-2','2-5','5-10','10+'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Vocal Competence</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Vocal Range</label>
                    <select required value={formData.vocal_range as string} onChange={e => setFormData({ ...formData, vocal_range: e.target.value })}
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm">
                      <option value="">Select vocal range</option>
                      {['soprano','mezzo-soprano','alto','tenor','baritone','bass','other'].map(r => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-2">Performance Style</label>
                    <div className="space-y-2">
                      {['Classical devotional','Qawwali','Contemporary devotional','Traditional hymnal','Sufi melodic','World fusion'].map(style => (
                        <label key={style} className="flex items-center gap-2 text-neutral-300 text-sm">
                          <input type="checkbox" checked={(formData.performance_styles as string[]).includes(style)}
                            onChange={() => toggleStyle(style)}
                            className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                          {style}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Languages Performed</label>
                    <input type="text" required value={formData.languages_performed as string}
                      onChange={e => setFormData({ ...formData, languages_performed: DOMPurify.sanitize(e.target.value) })}
                      placeholder="e.g., Urdu, Arabic, Persian, English"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Musical Training</label>
                    <textarea rows={4} value={formData.musical_training as string}
                      onChange={e => setFormData({ ...formData, musical_training: DOMPurify.sanitize(e.target.value) })}
                      placeholder="Brief overview of vocal training, teachers, or structured practice"
                      className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1.5">Performance Sample Link</label>
                    <p className="text-neutral-500 text-xs mb-1">Upload sample to YouTube and share the link</p>
                    <input type="url" value={formData.sample_link as string}
                      onChange={e => setFormData({ ...formData, sample_link: e.target.value })}
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
                    <label className="block text-neutral-400 text-xs mb-2">Have you worked in professional studio recording environments?</label>
                    <div className="space-y-2">
                      {[true, false].map(val => (
                        <label key={String(val)} className="flex items-center gap-2 text-neutral-300 text-sm">
                          <input type="radio" name="studioExp" checked={formData.worked_in_studio === val}
                            onChange={() => setFormData({ ...formData, worked_in_studio: val })}
                            className="w-4 h-4" />
                          {val ? 'Yes' : 'No'}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.willing_editorial_approval === true}
                        onChange={e => setFormData({ ...formData, willing_editorial_approval: e.target.checked ? true : null })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Willing to perform assigned kalam following editorial approval
                    </label>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input type="checkbox" checked={formData.accept_producer_coordination as boolean}
                        onChange={e => setFormData({ ...formData, accept_producer_coordination: e.target.checked })}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded" />
                      Vocal interpretation operates within producer and studio coordination
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-white mb-4">Governance Acknowledgment</h4>
                <div className="bg-neutral-900/30 border border-neutral-800 rounded p-4 mb-4">
                  <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
                    <p>Vocalists receive assigned kalam after editorial approval.</p>
                    <p>Performance operates within producer and studio framework.</p>
                    <p>Vocal delivery does not equal publication or registry authorization.</p>
                  </div>
                </div>
                <label className="flex items-start gap-2 text-neutral-300 text-sm">
                  <input type="checkbox" checked={formData.accept_framework as boolean}
                    onChange={e => setFormData({ ...formData, accept_framework: e.target.checked })}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0" />
                  <span>I acknowledge and accept the institutional performance framework.</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={handleDelete} disabled={saving}
              className="px-8 py-2.5 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-400 border font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : 'Delete Profile'}
            </button>
            <button onClick={handleSave} disabled={saving || saveStatus === 'saved' || !formData.accept_framework || !formData.accept_producer_coordination}
              className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {saveStatus === 'saving' && <Loader className="w-4 h-4 animate-spin" />}
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save Failed' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}
    </ProfileLayout>
  );
}
