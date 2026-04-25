import { useState } from 'react';
import DOMPurify from "dompurify";
import { WriterSubmissionSuccessModal } from './WriterSubmissionSuccessModal';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { WriterFormData } from '@/app/types/writer.types';
import { notifyApplicationReceived, notifyAdmin } from '@/app/lib/notifications';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { writerProfileSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeObject } from '../../lib/sanitize';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fieldClass(base: string, hasError: boolean) {
  return `${base} ${hasError ? 'border border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}`;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-400 text-xs mt-1">{msg}</p>;
}

// Scroll + focus the first field that has an error
function focusFirstError(errorKeys: string[]) {
  if (!errorKeys.length) return;
  for (const key of errorKeys) {
    const el = document.getElementById(`field-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof (el as HTMLElement).focus === 'function') {
        setTimeout(() => (el as HTMLElement).focus(), 350);
      }
      return;
    }
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export function WriterCredentialsForm() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [loading, setLoading] = useState(false);
  const [submissionId] = useState(
    `SP-WRT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
  );

  const [formData, setFormData] = useState<WriterFormData>({
    full_name: user ? user.full_name : '',
    pen_name: '',
    country: '',
    city: '',
    email: user ? user.email : '',
    years_experience: '',
    primary_languages: '',
    writing_styles: [],
    literary_background: '',
    thematic_focus: '',
    sample_kalam: '',
    previous_publications: '',
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
        : [...prev.writing_styles, value],
    }));
  };

  const set = (key: keyof WriterFormData, value: any) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!verifySecurity()) {
      setSubmitted(true);
      return;
    }

    const langs =
      typeof formData.primary_languages === 'string'
        ? formData.primary_languages.trim().split(/[,\s]+/).filter(Boolean)
        : formData.primary_languages;

    const payloadToValidate = { ...formData, primary_languages: langs };

    const { success, data, errors } = validateSchema(writerProfileSchema, payloadToValidate);

    if (!success && errors) {
      const formattedErrors: Record<string, string> = {};
      errors.issues.forEach((issue: any) => {
        const key = issue.path[0] as string;
        if (!formattedErrors[key]) formattedErrors[key] = issue.message;
      });
      setFieldErrors(formattedErrors);
      setError('Please correct the highlighted fields below.');

      // Scroll to and focus the first invalid field
      const orderedKeys = [
        'full_name', 'email', 'country', 'city', 'years_experience',
        'primary_languages', 'writing_styles', 'literary_background',
        'thematic_focus', 'sample_kalam',
        'revision_acknowledged', 'institutional_acknowledged',
      ];
      const firstErrorKey = orderedKeys.find(k => formattedErrors[k]) ||
        Object.keys(formattedErrors)[0];
      focusFirstError(firstErrorKey ? [firstErrorKey] : []);
      return;
    }

    const cleanData = sanitizeObject(data as any, {
      full_name: 'text',
      pen_name: 'text',
      country: 'text',
      city: 'text',
      email: 'email',
      years_experience: 'text',
      literary_background: 'text',
      thematic_focus: 'text',
      sample_kalam: 'text',
      previous_publications: 'text',
    });

    const payload: WriterFormData = { ...formData, ...cleanData, profile_status: 'pending' };

    try {
      setLoading(true);
      const res = await fetch('/api/writers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Submission failed. Please try again.');
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

  if (submitted) {
    return (
      <WriterSubmissionSuccessModal
        onClose={() => setSubmitted(false)}
        submissionId={submissionId}
      />
    );
  }

  const inputBase = 'form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm';

  return (
    <form className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
      {/* honeypot */}
      <input
        type="text"
        name="_bot_check"
        value={botCheck}
        onChange={e => setBotCheck(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
      />

      <h3 className="text-lg font-semibold text-white mb-6">Submit Writer Profile</h3>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* ── LEFT COLUMN ───────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Identity & Background</h4>
            <div className="space-y-4">

              {/* Full Name */}
              <div>
                <label htmlFor="field-full_name" className="block text-neutral-400 text-xs mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-full_name"
                  type="text"
                  maxLength={200}
                  value={formData.full_name}
                  onChange={e => set('full_name', DOMPurify.sanitize(e.target.value))}
                  className={fieldClass(inputBase, !!fieldErrors.full_name)}
                />
                <FieldError msg={fieldErrors.full_name} />
              </div>

              {/* Pen Name */}
              <div>
                <label htmlFor="field-pen_name" className="block text-neutral-400 text-xs mb-1.5">
                  Pen Name (if applicable)
                </label>
                <input
                  id="field-pen_name"
                  type="text"
                  maxLength={200}
                  value={formData.pen_name}
                  onChange={e => set('pen_name', DOMPurify.sanitize(e.target.value))}
                  className={fieldClass(inputBase, !!fieldErrors.pen_name)}
                />
                <FieldError msg={fieldErrors.pen_name} />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="field-country" className="block text-neutral-400 text-xs mb-1.5">
                  Country
                </label>
                <select
                  id="field-country"
                  value={formData.country}
                  onChange={e => set('country', e.target.value)}
                  className={fieldClass(inputBase, !!fieldErrors.country)}
                >
                  <option value="">Select country</option>
                  {['USA', 'Canada', 'UAE', 'India', 'UK', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <FieldError msg={fieldErrors.country} />
              </div>

              {/* City */}
              <div>
                <label htmlFor="field-city" className="block text-neutral-400 text-xs mb-1.5">
                  City
                </label>
                <input
                  id="field-city"
                  type="text"
                  maxLength={200}
                  value={formData.city}
                  onChange={e => set('city', DOMPurify.sanitize(e.target.value))}
                  className={fieldClass(inputBase, !!fieldErrors.city)}
                />
                <FieldError msg={fieldErrors.city} />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="field-email" className="block text-neutral-400 text-xs mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-email"
                  type="email"
                  value={formData.email}
                  onChange={e => set('email', e.target.value)}
                  className={fieldClass(inputBase, !!fieldErrors.email)}
                />
                <FieldError msg={fieldErrors.email} />
              </div>

              {/* Years of experience */}
              <div>
                <label htmlFor="field-years_experience" className="block text-neutral-400 text-xs mb-1.5">
                  Years of Writing Experience
                </label>
                <select
                  id="field-years_experience"
                  value={formData.years_experience}
                  onChange={e => set('years_experience', e.target.value)}
                  className={fieldClass(inputBase, !!fieldErrors.years_experience)}
                >
                  <option value="">Select experience</option>
                  <option value="0-2">0–2</option>
                  <option value="2-5">2–5</option>
                  <option value="5-10">5–10</option>
                  <option value="10+">10+</option>
                </select>
                <FieldError msg={fieldErrors.years_experience} />
              </div>
            </div>
          </div>

          {/* Literary Competence */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Literary Competence</h4>
            <div className="space-y-4">

              {/* Primary Languages */}
              <div>
                <label htmlFor="field-primary_languages" className="block text-neutral-400 text-xs mb-1.5">
                  Primary Writing Languages <span className="text-red-400">*</span>
                </label>
                <input
                  id="field-primary_languages"
                  type="text"
                  maxLength={500}
                  value={formData.primary_languages as string}
                  onChange={e => set('primary_languages', e.target.value)}
                  placeholder="e.g., Urdu, Arabic, Persian, English"
                  className={fieldClass(inputBase, !!fieldErrors.primary_languages)}
                />
                <FieldError msg={fieldErrors.primary_languages} />
              </div>

              {/* Writing styles */}
              <div id="field-writing_styles">
                <label className="block text-neutral-400 text-xs mb-2">Writing Style & Form</label>
                <div className="space-y-2">
                  {['Classical Ghazal', 'Nazm', 'Qasida', 'Hamd & Naat', 'Contemporary devotional', 'Free verse'].map(style => (
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
                <FieldError msg={fieldErrors.writing_styles} />
              </div>

              {/* Literary Background */}
              <div>
                <label htmlFor="field-literary_background" className="block text-neutral-400 text-xs mb-1.5">
                  Literary Background
                </label>
                <textarea
                  id="field-literary_background"
                  rows={4}
                  maxLength={2000}
                  value={formData.literary_background}
                  onChange={e => set('literary_background', DOMPurify.sanitize(e.target.value))}
                  placeholder="Brief overview of literary training, influences, or formal education"
                  className={fieldClass(`${inputBase} resize-none`, !!fieldErrors.literary_background)}
                />
                <FieldError msg={fieldErrors.literary_background} />
              </div>

              {/* Thematic Focus */}
              <div>
                <label htmlFor="field-thematic_focus" className="block text-neutral-400 text-xs mb-1.5">
                  Thematic Focus
                </label>
                <textarea
                  id="field-thematic_focus"
                  rows={3}
                  maxLength={1000}
                  value={formData.thematic_focus}
                  onChange={e => set('thematic_focus', DOMPurify.sanitize(e.target.value))}
                  placeholder="Core themes you explore in your writing"
                  className={fieldClass(`${inputBase} resize-none`, !!fieldErrors.thematic_focus)}
                />
                <FieldError msg={fieldErrors.thematic_focus} />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Sample Work & Publications</h4>
            <div className="space-y-4">

              {/* Sample Kalam */}
              <div>
                <label htmlFor="field-sample_kalam" className="block text-neutral-400 text-xs mb-1.5">
                  Sample Kalam <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="field-sample_kalam"
                  rows={8}
                  maxLength={10000}
                  value={formData.sample_kalam}
                  onChange={e => set('sample_kalam', DOMPurify.sanitize(e.target.value))}
                  placeholder="Paste original kalam (must be unpublished work)"
                  className={fieldClass(`${inputBase} resize-none font-mono`, !!fieldErrors.sample_kalam)}
                />
                <FieldError msg={fieldErrors.sample_kalam} />
              </div>

              {/* Previous Publications */}
              <div>
                <label htmlFor="field-previous_publications" className="block text-neutral-400 text-xs mb-1.5">
                  Previous Publications (optional)
                </label>
                <textarea
                  id="field-previous_publications"
                  rows={3}
                  maxLength={2000}
                  value={formData.previous_publications}
                  onChange={e => set('previous_publications', DOMPurify.sanitize(e.target.value))}
                  placeholder="List any published works or credentials"
                  className={`${inputBase} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Workflow Alignment */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Workflow Alignment</h4>
            <div className="space-y-4">

              {/* Editorial review experience */}
              <div id="field-editorial_review_experience">
                <label className="block text-neutral-400 text-xs mb-2">
                  Have you worked with editorial review processes before?
                </label>
                <div className="space-y-2">
                  {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(opt => (
                    <label key={String(opt.value)} className="flex items-center gap-2 text-neutral-300 text-sm">
                      <input
                        type="radio"
                        name="editorialExperience"
                        checked={formData.editorial_review_experience === opt.value}
                        onChange={() => set('editorial_review_experience', opt.value)}
                        className="w-4 h-4"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Willing editorial process */}
              <div id="field-willing_editorial_process">
                <label className="block text-neutral-400 text-xs mb-2">
                  Are you willing to participate in the structured editorial process?
                </label>
                <label className="flex items-center gap-2 text-neutral-300 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.willing_editorial_process === true}
                    onChange={e => set('willing_editorial_process', e.target.checked)}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                  />
                  Yes
                </label>
              </div>

              {/* Revision acknowledged */}
              <div
                id="field-revision_acknowledged"
                className={fieldErrors.revision_acknowledged
                  ? 'p-3 rounded border border-red-500/50 bg-red-900/10'
                  : ''}
              >
                <label className="block text-neutral-400 text-xs mb-2">
                  Do you acknowledge that submitted kalam may require revision before approval?{' '}
                  <span className="text-red-400">*</span>
                </label>
                <label className="flex items-center gap-2 text-neutral-300 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.revision_acknowledged}
                    onChange={e => set('revision_acknowledged', e.target.checked)}
                    className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded"
                  />
                  Yes, I acknowledge
                </label>
                <FieldError msg={fieldErrors.revision_acknowledged} />
              </div>
            </div>
          </div>

          {/* Governance Acknowledgment */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Governance Acknowledgment</h4>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded p-4 mb-4">
              <div className="space-y-2 text-neutral-300 text-xs leading-relaxed">
                <p>All kalam submissions undergo institutional editorial review.</p>
                <p>Writers do not independently authorize publication or production.</p>
                <p>Origination does not equal production clearance or registry authorization.</p>
              </div>
            </div>

            <div
              id="field-institutional_acknowledged"
              className={fieldErrors.institutional_acknowledged
                ? 'p-3 rounded border border-red-500/50 bg-red-900/10'
                : ''}
            >
              <label className="flex items-start gap-2 text-neutral-300 text-sm">
                <input
                  type="checkbox"
                  checked={formData.institutional_acknowledged}
                  onChange={e => set('institutional_acknowledged', e.target.checked)}
                  className="w-4 h-4 bg-neutral-900/50 border border-neutral-800 rounded mt-0.5 shrink-0"
                />
                <span>
                  I acknowledge and accept the institutional editorial framework.{' '}
                  <span className="text-red-400">*</span>
                </span>
              </label>
              <FieldError msg={fieldErrors.institutional_acknowledged} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        {user ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="cursor-pointer px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Writer Profile'
            )}
          </button>
        ) : (
          <Link
            className="px-8 py-2.5 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-medium text-sm rounded transition-colors"
            href="/login"
          >
            Login
          </Link>
        )}
      </div>
    </form>
  );
}
