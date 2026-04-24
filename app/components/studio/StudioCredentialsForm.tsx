"use client";
import { useState } from 'react';
import DOMPurify from "dompurify";
import { useAuth } from '@/app/contexts/AuthContext';
import Loader from '../../components/ui/Loader';
import { StudioProfileType } from '@/app/types/studio.types';
import { StudioSubmissionSuccessModal } from './StudioSubmissionSuccessModal';
import { notifyApplicationReceived, notifyAdmin } from '@/app/lib/notifications';
import { storage } from '@/app/lib/storage';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { studioProfileSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeObject } from '../../lib/sanitize';

export default function StudioCredentialsForm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [showModal, setShowModal] = useState(false);
  const [submissionId] = useState(
    `SP-STD-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  );
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

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      recording_capabilities: prev.recording_capabilities.includes(value)
        ? prev.recording_capabilities.filter(c => c !== value)
        : [...prev.recording_capabilities, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    if (!verifySecurity()) {
      setShowModal(true);
      setLoading(false);
      return;
    }

    const { success, data, errors } = validateSchema(studioProfileSchema, formData);

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
      studio_name: 'text',
      country: 'text',
      city: 'text',
      primary_contact_name: 'text',
      email: 'email',
      phone: 'text',
      equipment_overview: 'text',
      years_in_operation: 'text'
    });

    const payload = {
      ...formData,
      ...cleanData,
    };

    try {
      await storage.create('studio', { ...payload, profile_status: 'pending', submission_id: submissionId });
      notifyApplicationReceived({
        user_id: user?.id,
        email: formData.email,
        name: formData.studio_name,
        role: 'studio',
        reference: submissionId,
      });
      notifyAdmin({
        title: 'New Studio Application',
        message: `${formData.studio_name} (${formData.email}) has applied as Karkhana-e-Sada (Studio Partner). Submission: ${submissionId}.`,
        event: 'application_received',
        from_role: 'studio',
        from_name: formData.studio_name,
        action_url: '/admin/applications/studio',
      }).catch(console.error);
      setShowModal(true);
    } catch (error: any) {
      console.error(error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
      <h3 className="text-lg font-semibold text-white mb-6">Submit Studio Credentials</h3>
      
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
                  className={`form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm ${fieldErrors.studio_name ? 'border border-red-500' : ''}`}
                />
                {fieldErrors.studio_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.studio_name}</p>}
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
                  className={`form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm ${fieldErrors.email ? 'border border-red-500' : ''}`}
                />
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
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

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          disabled={loading || !formData.accept_terms || !formData.agree_centralized_authorization || !formData.agree_centralized_validation}
          className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader /> : null}
          {loading ? 'Submitting...' : 'Submit Studio Credentials'}
        </button>
      </div>
    </form>
    {showModal && (
      <StudioSubmissionSuccessModal
        submissionId={submissionId}
        onClose={() => setShowModal(false)}
      />
    )}
    </>
  );
}
