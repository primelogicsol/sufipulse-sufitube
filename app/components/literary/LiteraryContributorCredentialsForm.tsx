"use client";
import { useState } from 'react';
import DOMPurify from "dompurify";
import * as api from "../../api/auth";
import { useAuth } from '@/app/contexts/AuthContext';
import Loader from '../../components/ui/Loader';
import { LiteraryProfileType } from '@/app/types/literary.types';
import Link from 'next/link';

export function LiteraryContributorCredentialsForm() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LiteraryProfileType>({
    full_name: '',
    professional_name: '',
    country: '',
    city: '',
    email: '',
    years_experience: '',
    writing_focus: [],
    languages: '',
    background: '',
    portfolio_link: '',
    worked_editorial_process: null,
    willing_review_process: null,
    acknowledge_editorial_control: false,
    accept_framework: false,
  });

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      writing_focus: prev.writing_focus.includes(value)
        ? prev.writing_focus.filter(f => f !== value)
        : [...prev.writing_focus, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.is_verified) {
      alert("Please verify your email before submitting your profile.");
      return;
    }
    setLoading(true);

    // Convert comma-separated string to array for backend
    const payload = {
      ...formData,
      languages:
        typeof formData.languages === 'string'
          ? formData.languages.split(',').map(lang => lang.trim()).filter(Boolean)
          : formData.languages
    };

    try {
      await api.createLiteraryProfile(payload as LiteraryProfileType);
      console.log("Profile submitted successfully");
      setSubmitted(true);
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to submit profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8 text-center space-y-4">
        <p className="text-neutral-300">You must be logged in to submit a Literary Contributor Profile.</p>
        <Link href="/login" className="inline-block px-6 py-2 bg-amber-400 text-black font-medium rounded hover:bg-amber-500 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Profile Submitted Successfully</h3>
        <p className="text-neutral-300 text-sm">
          Your profile has been received for institutional review. You will be notified of the outcome shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
      <h3 className="text-lg font-semibold text-white mb-6">Submit Literary Contributor Profile</h3>

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
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: DOMPurify.sanitize(e.target.value) })}
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Professional Name (if applicable)</label>
                <input
                  type="text"
                  value={formData.professional_name}
                  onChange={e => setFormData({ ...formData, professional_name: DOMPurify.sanitize(e.target.value) })}
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Country</label>
                <select
                  required
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
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
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: DOMPurify.sanitize(e.target.value) })}
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Years of Writing Experience</label>
                <select
                  required
                  value={formData.years_experience}
                  onChange={e => setFormData({ ...formData, years_experience: e.target.value })}
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
            <h4 className="text-sm font-medium text-white mb-4">Literary Competence</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-neutral-400 text-xs mb-2">Primary Writing Focus</label>
                <div className="space-y-2">
                  {[
                    'Spiritual essays',
                    'Philosophical discourse',
                    'Sufi thought analysis',
                    'Contemporary reflection',
                    'Thematic commentary',
                    'Historical contextualization'
                  ].map(focus => (
                    <label key={focus} className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.writing_focus.includes(focus)}
                        onChange={() => handleCheckboxChange(focus)}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                      />
                      {focus}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Primary Languages</label>
                <input
                  type="text"
                  required
                  value={formData.languages as string}
                  onChange={e => setFormData({ ...formData, languages: DOMPurify.sanitize(e.target.value) })}
                  placeholder="e.g., English, Urdu, Arabic"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Academic or Literary Background</label>
                <textarea
                  required
                  rows={4}
                  value={formData.background}
                  onChange={e => setFormData({ ...formData, background: DOMPurify.sanitize(e.target.value) })}
                  placeholder="Brief overview of education, training, or literary experience"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Portfolio or Published Work Link (optional)</label>
                <input
                  type="url"
                  value={formData.portfolio_link}
                  onChange={e => setFormData({ ...formData, portfolio_link: e.target.value })}
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Editorial Alignment</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-neutral-400 text-xs mb-2">
                  Have you worked with editorial review processes before?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                    <input
                      type="radio"
                      name="editorialExperience"
                      required
                      checked={formData.worked_editorial_process === true}
                      onChange={() => setFormData({ ...formData, worked_editorial_process: true })}
                      className="w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                    <input
                      type="radio"
                      name="editorialExperience"
                      required
                      checked={formData.worked_editorial_process === false}
                      onChange={() => setFormData({ ...formData, worked_editorial_process: false })}
                      className="w-4 h-4"
                    />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-2">
                  Are you willing to participate in a structured review and revision process?
                </label>
                <label className="flex items-center gap-2 text-neutral-300 text-sm">
                  <input
                    type="checkbox"
                    required
                    checked={formData.willing_review_process === true}
                    onChange={e => setFormData({ ...formData, willing_review_process: e.target.checked ? true : null })}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                  />
                  Yes
                </label>
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-2">
                  Do you acknowledge that publication decisions remain under editorial authority?
                </label>
                <label className="flex items-center gap-2 text-neutral-300 text-sm">
                  <input
                    type="checkbox"
                    required
                    checked={formData.acknowledge_editorial_control}
                    onChange={e => setFormData({ ...formData, acknowledge_editorial_control: e.target.checked })}
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
                <p>Literary Contributors operate within an editorial review framework.</p>
                <p>Submissions undergo structured evaluation and revision cycles.</p>
                <p>All publications require formal editorial clearance and institutional alignment.</p>
              </div>
            </div>

            <label className="flex items-start gap-2 text-neutral-300 text-sm">
              <input
                type="checkbox"
                required
                checked={formData.accept_framework}
                onChange={e => setFormData({ ...formData, accept_framework: e.target.checked })}
                className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0"
              />
              <span>I acknowledge and accept the institutional editorial framework.</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={loading || !formData.accept_framework || !formData.acknowledge_editorial_control || !user?.is_verified}
          className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader /> : null}
          {loading ? 'Submitting...' : 'Submit Literary Contributor Profile'}
        </button>
      </div>
    </form>
  );
}
