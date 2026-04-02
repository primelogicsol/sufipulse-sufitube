"use client";
import { useEffect, useState } from 'react';
import DOMPurify from "dompurify";
import { ProfileLayout, Notification } from '../../../components/profile/ProfileLayout';
import { Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Eye, Loader, FileText } from 'lucide-react';
import * as api from "../../../api/auth"
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProducerProfileType } from '@/app/types/producer.types';



export default function UserProfile() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'submissions' | 'notifications'>('submissions');
  const [status, setStatus] = useState("")
  const [producer, setProducer] = useState<ProducerProfileType>({
    full_name: '',
    professional_name: '',
    country: '',
    city: '',
    email: '',
    years_experience: '',
    primary_production_focus: [],
    primary_tools: '',
    musical_background: '',
    portfolio_link: '',
    worked_structured_production: null,
    willing_defined_sequence: null,
    acknowledge_centralized_control: false,
    accept_framework: false,
  });
  const [error, setError] = useState('');
  const router = useRouter()

  const loadProducerProfile = async () => {
    try {
      setLoading(true)
      const res: any = await api.readProducerProfile();
      if (res.data) {
        setProducer(prev => ({
          ...prev,
          ...res.data
        }));
        setStatus(res.data.profile_status);
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
    loadProducerProfile();
  }, [])



  const handleDeleteProducerProfile = async (e: any) => {
    e.preventDefault();
    try {
      const res: any = await api.deleteProducerProfile();
      alert(res.data?.message || "Profile deleted");
      // Reload profile to reset UI state
      window.location.reload();
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateProducerProfile = async (e: any) => {
    e.preventDefault()
    const payload = {
      ...producer
    };
    try {
      setLoading(true)
      const res: any = await api.updateProducerProfile(payload)
      if (res.data?.status === 401 || res.data?.status === 400) {
        router.push("/login")
      }
      alert("Producer profile Updated")
    } catch (err) {
      console.error(err)
      setError("Failed to update profile.")
    } finally {
      setLoading(false)
    }
  }



  const handleCheckboxChange = (value: string) => {
    setProducer(prev => ({
      ...prev,
      primary_production_focus: prev.primary_production_focus.includes(value)
        ? prev.primary_production_focus.filter(f => f !== value)
        : [...prev.primary_production_focus, value]
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
                    {!producer.email && !status ? (
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
                          <h3 className="text-lg font-semibold text-white">Producer Profile Status</h3>
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
                              <h4 className="text-sm font-medium text-white mb-4">Identity & Background</h4>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Full Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={producer.full_name}
                                    onChange={e => setProducer({ ...producer, full_name: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Professional Name (if applicable)</label>
                                  <input
                                    type="text"
                                    value={producer.professional_name}
                                    onChange={e => setProducer({ ...producer, professional_name: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Country</label>
                                  <select
                                    required
                                    value={producer.country}
                                    onChange={e => setProducer({ ...producer, country: e.target.value })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  >
                                    <option value="">Select country</option>
                                    <option value="USA">USA</option>
                                    <option value="Canada">Canada</option>
                                    <option value="UAE">UAE</option>
                                    <option value="India">India</option>
                                    <option value="Pakistan">Pakistan</option>
                                    <option value="UK">UK</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">City</label>
                                  <input
                                    type="text"
                                    required
                                    value={producer.city}
                                    onChange={e => setProducer({ ...producer, city: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Email Address</label>
                                  <input
                                    type="email"
                                    required
                                    value={producer.email}
                                    onChange={e => setProducer({ ...producer, email: e.target.value })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Years of Experience</label>
                                  <select
                                    required
                                    value={producer.years_experience}
                                    onChange={e => setProducer({ ...producer, years_experience: e.target.value })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  >
                                    <option value="">Select experience</option>
                                    <option value="0-2">0–2</option>
                                    <option value="2-5">2–5</option>
                                    <option value="5-10">5–10</option>
                                    <option value="10+">10+</option>
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
                                    {[
                                      'Vocal arrangement',
                                      'Composition structuring',
                                      'Instrumental arrangement',
                                      'Orchestration',
                                      'Digital production (DAW-based)',
                                      'Acoustic ensemble coordination'
                                    ].map(focus => (
                                      <label key={focus} className="flex items-center gap-2 text-neutral-300 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={producer.primary_production_focus?.includes(focus)}
                                          onChange={() => handleCheckboxChange(focus)}
                                          className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                                        />
                                        {focus}
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Primary Tools / DAW</label>
                                  <input
                                    type="text"
                                    required
                                    value={producer.primary_tools}
                                    onChange={e => setProducer({ ...producer, primary_tools: DOMPurify.sanitize(e.target.value) })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Musical Background</label>
                                  <textarea
                                    required
                                    rows={4}
                                    value={producer.musical_background}
                                    onChange={e => setProducer({ ...producer, musical_background: DOMPurify.sanitize(e.target.value) })}
                                    placeholder="Brief overview of training, influences, or structured experience"
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
                                  />
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-1.5">Portfolio Link (optional)</label>
                                  <input
                                    type="url"
                                    value={producer.portfolio_link}
                                    onChange={e => setProducer({ ...producer, portfolio_link: e.target.value })}
                                    className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-5">
                            <div>
                              <h4 className="text-sm font-medium text-white mb-4">Workflow Alignment</h4>

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-neutral-400 text-xs mb-2">
                                    Have you worked with structured vocal production before?
                                  </label>
                                  <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                                      <input
                                        type="radio"
                                        name="structuredExperience"
                                        required
                                        checked={producer.worked_structured_production === true}
                                        onChange={() => setProducer({ ...producer, worked_structured_production: true })}
                                        className="w-4 h-4"
                                      />
                                      Yes
                                    </label>
                                    <label className="flex items-center gap-2 text-neutral-300 text-sm">
                                      <input
                                        type="radio"
                                        name="structuredExperience"
                                        required
                                        checked={producer.worked_structured_production === false}
                                        onChange={() => setProducer({ ...producer, worked_structured_production: false })}
                                        className="w-4 h-4"
                                      />
                                      No
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-2">
                                    Are you willing to operate within a defined production sequence?
                                  </label>
                                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                                    <input
                                      type="checkbox"
                                      required
                                      checked={producer.willing_defined_sequence === true}
                                      onChange={e => setProducer({ ...producer, willing_defined_sequence: e.target.checked ? true : null })}
                                      className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                                    />
                                    Yes
                                  </label>
                                </div>

                                <div>
                                  <label className="block text-neutral-400 text-xs mb-2">
                                    Do you acknowledge that final mixing, mastering, and registry authorization remain centralized?
                                  </label>
                                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                                    <input
                                      type="checkbox"
                                      required
                                      checked={producer.acknowledge_centralized_control}
                                      onChange={e => setProducer({ ...producer, acknowledge_centralized_control: e.target.checked })}
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
                                <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
                                  <p>Producers operate within an approved kalam workflow.</p>
                                  <p>Assignments follow editorial confirmation and vocalist alignment.</p>
                                  <p>All releases pass through studio validation prior to registry authorization.</p>
                                </div>
                              </div>

                              <label className="flex items-start gap-2 text-neutral-300 text-sm">
                                <input
                                  type="checkbox"
                                  required
                                  checked={producer.accept_framework}
                                  onChange={e => setProducer({ ...producer, accept_framework: e.target.checked })}
                                  className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0"
                                />
                                <span>I acknowledge and accept the institutional production framework.</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                          <button
                            onClick={handleDeleteProducerProfile}
                            className="px-8 py-2.5 text-amber-400 hover:bg-amber-500 hover:text-black border-amber-400 border font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? <Loader /> : 'Delete Profile'}
                          </button>
                          <button
                            onClick={handleUpdateProducerProfile}
                            disabled={!producer.accept_framework || !producer.acknowledge_centralized_control}
                            className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? <Loader /> : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    )}
      </div>
    </ProfileLayout>
  );
}
