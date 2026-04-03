"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
import { ProfileLayout, Notification } from '../../../components/profile/ProfileLayout';
import { Loader, FileText } from 'lucide-react';
import * as api from "../../../api/auth"
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { StudioProfileType } from '@/app/types/studio.types';
import { hasRoleAccess } from '@/app/lib/role-access';



export default function UserProfile() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'submissions' | 'notifications'>('submissions');
  const [status, setStatus] = useState("")
  const [formData, setFormData] = useState<StudioProfileType>({
    studio_name: '',
    country: '',
    city: '',
    primary_contact_name: '',
    email: '',
    phone: '',
    recording_capabilities: [],
    equipment_overview: '',
    years_in_operation: '',
    previous_work_link: '',
    agree_centralized_validation: null,
    agree_centralized_authorization: null,
    accept_terms: false,
  });
  const [error, setError] = useState('');
  const router = useRouter()

  const loadStudioProfile = async () => {
    try {
      setLoading(true)
      const res: any = await api.readStudioProfile();
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          ...res.data
        }));
        setStatus(res.data.profile_status || "");
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error(err);
      }
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!hasRoleAccess(user as any, 'studio')) {
      alert('You do not have studio role access.');
      router.push('/');
      return;
    }

    loadStudioProfile();
  }, [user])



  const handleDeleteProfile = async (e: any) => {
    e.preventDefault();
    try {
      const res: any = await api.deleteStudioProfile();
      alert(res.data?.message || "Profile deleted");
      window.location.reload();
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateProfile = async (e: any) => {
    e.preventDefault()
    try {
      setLoading(true)
      const res: any = await api.updateStudioProfile(formData)
      if (res.data?.status === 401 || res.data?.status === 400) {
        router.push("/login")
      }
      alert("Studio profile Updated")
    } catch (err) {
      console.error(err)
      setError("Failed to update profile.")
    } finally {
      setLoading(false)
    }
  }



  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      recording_capabilities: prev.recording_capabilities.includes(value)
        ? prev.recording_capabilities.filter(c => c !== value)
        : [...prev.recording_capabilities, value]
    }));
  };

  return (
    <ProfileLayout
      loading={loading}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      notifications={notifications}
    >
      <div className="space-y-4">
                    {!formData.email && !status ? (
                      <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-12 text-center">
                        <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Profile yet</h3>
                        <p className="text-neutral-400 mb-4">
                          Your profile will appear here once you apply or submit form.
                        </p>
                      </div>
                    ) : (
                      <form className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <h3 className="text-lg font-semibold text-white">Studio Profile</h3>
                          {status && <div className="bg-yellow-400 capitalize text-black rounded-lg px-4 py-2">{status.replace(/_/g, " ")}</div>}
                        </div>
                        {error && (
                          <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded">
                            <p className="text-red-400 text-sm">{error}</p>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-5">
                            <div>
                              <h4 className="text-sm font-medium text-white mb-4">Studio Identity</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Studio Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={formData.studio_name}
                                    onChange={(e) => setFormData({ ...formData, studio_name: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Country</label>
                                  <select
                                    required
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  >
                                    <option value="">Select country</option>
                                    <option value="USA">United States</option>
                                    <option value="Canada">Canada</option>
                                    <option value="UAE">United Arab Emirates</option>
                                    <option value="India">India</option>
                                    <option value="Pakistan">Pakistan</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">City</label>
                                  <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Primary Contact Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={formData.primary_contact_name}
                                    onChange={(e) => setFormData({ ...formData, primary_contact_name: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Email Address</label>
                                  <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Phone (optional)</label>
                                  <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-white mb-4">Technical Profile</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-2">Recording Capability</label>
                                  <div className="space-y-2">
                                    {[
                                      'Vocal recording booth',
                                      'Treated acoustic environment',
                                      'Multi-track capability',
                                      'Professional microphone chain',
                                      'DAW-based recording system'
                                    ].map(cap => (
                                      <label key={cap} className="flex items-center gap-2 text-neutral-300 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={formData.recording_capabilities.includes(cap)}
                                          onChange={() => handleCheckboxChange(cap)}
                                          className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                                        />
                                        {cap}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Primary Equipment Overview</label>
                                  <textarea
                                    required
                                    rows={4}
                                    value={formData.equipment_overview}
                                    onChange={(e) => setFormData({ ...formData, equipment_overview: DOMPurify.sanitize(e.target.value) })}
                                    placeholder="Brief description of microphone, interface, DAW, monitoring"
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
                                  />
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
                                  <select
                                    required
                                    value={formData.years_in_operation}
                                    onChange={(e) => setFormData({ ...formData, years_in_operation: e.target.value })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  >
                                    <option value="">Select experience</option>
                                    <option value="0-1">0–1 years</option>
                                    <option value="1-3">1–3 years</option>
                                    <option value="3-5">3–5 years</option>
                                    <option value="5+">5+ years</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Previous Work (optional)</label>
                                  <input
                                    type="url"
                                    value={formData.previous_work_link}
                                    onChange={(e) => setFormData({ ...formData, previous_work_link: e.target.value })}
                                    placeholder="https://"
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-2">
                                    Do you agree to operate under centralized review and final master validation?
                                  </label>
                                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                                    <input
                                      type="checkbox"
                                      required
                                      checked={formData.agree_centralized_validation === true}
                                      onChange={(e) => setFormData({ ...formData, agree_centralized_validation: e.target.checked ? true : null })}
                                      className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                                    />
                                    Yes
                                  </label>
                                </div>
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-2">
                                    Do you agree that mixing, mastering, and publication authorization remain centralized?
                                  </label>
                                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                                    <input
                                      type="checkbox"
                                      required
                                      checked={formData.agree_centralized_authorization === true}
                                      onChange={(e) => setFormData({ ...formData, agree_centralized_authorization: e.target.checked ? true : null })}
                                      className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                                    />
                                    Yes
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
                                <input
                                  type="checkbox"
                                  required
                                  checked={formData.accept_terms}
                                  onChange={(e) => setFormData({ ...formData, accept_terms: e.target.checked })}
                                  className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0"
                                />
                                <span>I acknowledge and accept these terms.</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                          <button
                            onClick={handleDeleteProfile}
                            className="px-8 py-2.5 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-400 border font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? <Loader /> : 'Delete Profile'}
                          </button>
                          <button
                            onClick={handleUpdateProfile}
                            disabled={!formData.accept_terms || !formData.agree_centralized_authorization || !formData.agree_centralized_validation}
                            className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {loading && <Loader className="w-4 h-4 animate-spin" />}
                            {loading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    )}
      </div>
    </ProfileLayout>
  );
}
