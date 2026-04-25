import { useState } from 'react';
import DOMPurify from "dompurify";
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { ProducerProfileType } from '../../types/producer.types';
import { ProducerSubmissionSuccessModal } from './ProducerSubmissionSuccessModal';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { producerProfileSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeObject } from '../../lib/sanitize';

export function ProducerCredentialsForm() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [submissionId] = useState(`SP-PRD-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);

  const [formData, setFormData] = useState<ProducerProfileType>({
    full_name: user ? user.full_name : '',
    professional_name: '',
    country: '',
    city: '',
    email: user ? user.email : '',
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

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      primary_production_focus: prev.primary_production_focus.includes(value)
        ? prev.primary_production_focus.filter(f => f !== value)
        : [...prev.primary_production_focus, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');
      setFieldErrors({});

      if (!verifySecurity()) {
        setSubmitted(true);
        setLoading(false);
        return;
      }

      const { success, data, errors } = validateSchema(producerProfileSchema, formData);

      if (!success && errors) {
        const formattedErrors: any = {};
        errors.issues.forEach((issue: any) => {
            formattedErrors[issue.path[0]] = issue.message;
        });
        setFieldErrors(formattedErrors);
        setError('Please correct the highlighted fields.');
        setLoading(false);
        return;
      }

      const cleanData = sanitizeObject(data as any, {
        full_name: 'text',
        professional_name: 'text',
        country: 'text',
        city: 'text',
        email: 'email',
        years_experience: 'text',
        primary_tools: 'text',
        musical_background: 'text'
      });

      const res = await fetch('/api/producers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, ...cleanData, profile_status: 'pending' }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Submission failed. Please try again.');
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit producer profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <ProducerSubmissionSuccessModal
        onClose={() => setSubmitted(false)}
        submissionId={submissionId}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
      <input
          type="text"
          name="_bot_check"
          value={botCheck}
          onChange={(e) => setBotCheck(e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
      />
      <h3 className="text-lg font-semibold text-white mb-6">Submit Producer Profile</h3>

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
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: DOMPurify.sanitize(e.target.value) })}
                  className={`form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm ${fieldErrors.full_name ? 'border border-red-500' : ''}`}
                />
                {fieldErrors.full_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>}
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
                  className={`form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm ${fieldErrors.email ? 'border border-red-500' : ''}`}
                />
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Years of Experience</label>
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
                        checked={formData.primary_production_focus.includes(focus)}
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
                  value={formData.primary_tools}
                  onChange={e => setFormData({ ...formData, primary_tools: DOMPurify.sanitize(e.target.value) })}
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Musical Background</label>
                <textarea
                  required
                  rows={4}
                  value={formData.musical_background}
                  onChange={e => setFormData({ ...formData, musical_background: DOMPurify.sanitize(e.target.value) })}
                  placeholder="Brief overview of training, influences, or structured experience"
                  className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 text-xs mb-1.5">Portfolio Link (optional)</label>
                <input
                  type="url"
                  value={formData.portfolio_link}
                  onChange={e => setFormData({ ...formData, portfolio_link: e.target.value })}
                  className={`form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm ${fieldErrors.portfolio_link ? 'border border-red-500' : ''}`}
                />
                {fieldErrors.portfolio_link && <p className="text-red-500 text-xs mt-1">{fieldErrors.portfolio_link}</p>}
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
                      checked={formData.worked_structured_production === true}
                      onChange={() => setFormData({ ...formData, worked_structured_production: true })}
                      className="w-4 h-4"
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-neutral-300 text-sm">
                    <input
                      type="radio"
                      name="structuredExperience"
                      required
                      checked={formData.worked_structured_production === false}
                      onChange={() => setFormData({ ...formData, worked_structured_production: false })}
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
                    checked={formData.willing_defined_sequence === true}
                    onChange={e => setFormData({ ...formData, willing_defined_sequence: e.target.checked ? true : null })}
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
                    checked={formData.acknowledge_centralized_control}
                    onChange={e => setFormData({ ...formData, acknowledge_centralized_control: e.target.checked })}
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
                checked={formData.accept_framework}
                onChange={e => setFormData({ ...formData, accept_framework: e.target.checked })}
                className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0"
              />
              <span>I acknowledge and accept the institutional production framework.</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        {user ? (
          <button
            type="submit"
            disabled={!user?.is_verified || !formData.accept_framework || !formData.acknowledge_centralized_control}
            className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                Submitting...
              </>
            ) : 'Submit Producer Profile'}
          </button>
        ) : (
          <Link
            className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors"
            href="/login"
          >
            Login to Submit
          </Link>
        )}
      </div>
    </form>
  );
}
