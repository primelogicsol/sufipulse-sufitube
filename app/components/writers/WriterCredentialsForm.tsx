import { useState } from 'react';
import DOMPurify from "dompurify";
import { WriterSubmissionSuccessModal } from './WriterSubmissionSuccessModal';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import * as api from "../../api/auth";
import { useRouter } from 'next/navigation';
import { WriterFormData } from '@/app/types/writer.types';
import { storage } from '@/app/lib/storage';
import { notifyApplicationReceived, notifyAdmin } from '@/app/lib/notifications';

export function WriterCredentialsForm() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submissionId] = useState(`SP-WRT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);
  const [formData, setFormData] = useState<WriterFormData>({
    full_name: user ? user.full_name : "",
    pen_name: "",
    country: "",
    city: "",
    email: user ? user.email : "",
    years_experience: "",
    primary_languages: "",
    writing_styles: [],
    literary_background: "",
    thematic_focus: "",
    sample_kalam: "",
    previous_publications: "",
    editorial_review_experience: false,
    willing_editorial_process: false,
    revision_acknowledged: false,
    institutional_acknowledged: false,

  });

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      writing_styles: prev.writing_styles.includes(value)
        ? prev.writing_styles.filter(s => s !== value)
        : [...prev.writing_styles, value]
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.country || !formData.sample_kalam.trim()) {
      setError('Please fill in all required fields: Full Name, Email, Country, and Sample Kalam.');
      return;
    }
    if (!formData.revision_acknowledged || !formData.institutional_acknowledged) {
      setError('Please confirm the governance acknowledgment and revision policy.');
      return;
    }

    const langs = typeof formData.primary_languages === 'string'
      ? formData.primary_languages.trim().split(/[,\s]+/).filter(Boolean)
      : formData.primary_languages;

    const payload: WriterFormData = {
      ...formData,
      primary_languages: langs,
      profile_status: 'pending',
    };

    try {
      setLoading(true);

      // Try backend API first
      let savedViaApi = false;
      try {
        await api.createWriterProfile(payload);
        savedViaApi = true;
      } catch {
        // Backend unavailable — fall through to localStorage
      }

      if (!savedViaApi) {
        // Standalone mode: persist directly to localStorage so admin can review it
        await storage.create('writer', {
          ...payload,
          submitted_at: new Date().toISOString(),
        });
      }

      setSubmitted(true);
      notifyApplicationReceived({
        user_id: user?.id,
        email: formData.email,
        name: formData.pen_name || formData.full_name,
        role: 'writer',
        reference: submissionId,
      }).catch(console.error);
      notifyAdmin({
        title: 'New Writer Application',
        message: `${formData.pen_name || formData.full_name} (${formData.email}) has applied as Ahl-e-Qalam (Writer). Submission: ${submissionId}.`,
        event: 'application_received',
        from_role: 'writer',
        from_name: formData.pen_name || formData.full_name,
        action_url: '/admin/applications/writers',
      }).catch(console.error);
    } catch (err: any) {
      setError(err?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e: any) => {
    const value = e.target.value;
    setText(value);
    setFormData({ ...formData, primary_languages: value });
  };

  if (submitted) {
    return (
      <WriterSubmissionSuccessModal
        onClose={() => setSubmitted(false)}
        submissionId={submissionId}
      />
    );
  }



  return (
    <form className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
      <h3 className="text-lg font-semibold text-white mb-6">Submit Writer Profile</h3>

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
                  maxLength={200}
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: DOMPurify.sanitize(e.target.value) })}
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Pen Name (if applicable)</label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.pen_name}
                  onChange={e => setFormData({ ...formData, pen_name: DOMPurify.sanitize(e.target.value) })}
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
                  maxLength={200}
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
                <label className="block text-neutral-400 text-xs mb-1.5">Primary Writing Languages</label>
                <input
                  type="text"
                  required
                  maxLength={500}
                  value={formData.primary_languages}
                  onChange={(e) => setFormData({ ...formData, primary_languages: e.target.value })}
                  placeholder="e.g., Urdu, Arabic, Persian, English"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-2">Writing Style & Form</label>
                <div className="space-y-2">
                  {[
                    'Classical Ghazal',
                    'Nazm',
                    'Qasida',
                    'Hamd & Naat',
                    'Contemporary devotional',
                    'Free verse'
                  ].map(style => (
                    <label key={style} className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.writing_styles.includes(style)}
                        onChange={() => handleCheckboxChange(style)}
                        className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                      />
                      {style}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Literary Background</label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={formData.literary_background}
                  onChange={e => setFormData({ ...formData, literary_background: DOMPurify.sanitize(e.target.value) })}
                  placeholder="Brief overview of literary training, influences, or formal education"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Thematic Focus</label>
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  value={formData.thematic_focus}
                  onChange={e => setFormData({ ...formData, thematic_focus: DOMPurify.sanitize(e.target.value) })}
                  placeholder="Core themes you explore in your writing"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
                />
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
                <textarea
                  required
                  rows={8}
                  maxLength={10000}
                  value={formData.sample_kalam}
                  onChange={e => setFormData({ ...formData, sample_kalam: DOMPurify.sanitize(e.target.value) })}
                  placeholder="Paste original kalam (must be unpublished work)"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Previous Publications (optional)</label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={formData.previous_publications}
                  onChange={e => setFormData({ ...formData, previous_publications: DOMPurify.sanitize(e.target.value) })}
                  placeholder="List any published works or credentials"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-white mb-4">Workflow Alignment</h4>

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
                      checked={formData.willing_editorial_process === true}
                      onChange={() => setFormData({ ...formData, willing_editorial_process: true })}
                      className="w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                    <input
                      type="radio"
                      name="editorialExperience"
                      required
                      checked={formData.editorial_review_experience === false}
                      onChange={() => setFormData({ ...formData, editorial_review_experience: false })}
                      className="w-4 h-4"
                    />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-2">
                  Are you willing to participate in the structured editorial process?
                </label>
                <label className="flex items-center gap-2 text-neutral-300 text-sm">
                  <input
                    type="checkbox"
                    required
                    checked={formData.willing_editorial_process === true}
                    onChange={e => setFormData({ ...formData, willing_editorial_process: e.target.checked ? true : false })}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                  />
                  Yes
                </label>
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-2">
                  Do you acknowledge that submitted kalam may require revision before approval?
                </label>
                <label className="flex items-center gap-2 text-neutral-300 text-sm">
                  <input
                    type="checkbox"
                    required
                    checked={formData.revision_acknowledged}
                    onChange={e => setFormData({ ...formData, revision_acknowledged: e.target.checked })}
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
                <p>All kalam submissions undergo institutional editorial review.</p>
                <p>Writers do not independently authorize publication or production.</p>
                <p>Origination does not equal production clearance or registry authorization.</p>
              </div>
            </div>

            <label className="flex items-start gap-2 text-neutral-300 text-sm">
              <input
                type="checkbox"
                required
                checked={formData.institutional_acknowledged}
                onChange={e => setFormData({ ...formData, institutional_acknowledged: e.target.checked })}
                className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0"
              />
              <span>I acknowledge and accept the institutional editorial framework.</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        {user ? <button
          // type="submit"
          onClick={handleSubmit}
          disabled={!user.is_verified || !formData.institutional_acknowledged || !formData.revision_acknowledged}
          className="cursor-pointer px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
              Submitting...
            </span>
          ) : 'Submit Writer Profile'}
        </button> :
          <Link
            className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950! font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            href="/login">
            Login
          </Link>
        }
      </div>
    </form>
  );
}
