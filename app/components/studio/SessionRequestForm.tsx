import { useState, useEffect } from 'react';
import { Calendar, FileText, User, Shield, Mail } from 'lucide-react';
import DOMPurify from 'dompurify';
import { SessionRequestSuccessModal } from './SessionRequestSuccessModal';
import { useAuth } from '@/app/contexts/AuthContext';
import { getAllReleases } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { sessionRequestSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeObject } from '../../lib/sanitize';

interface SessionRequestFormProps {
  sessionType: 'in_person' | 'remote';
  onClose?: () => void;
}

export function SessionRequestForm({ sessionType, onClose }: SessionRequestFormProps) {
  const { user } = useAuth();
  const [cmsReleases, setCmsReleases] = useState<Release[]>([]);
  const [formData, setFormData] = useState({
    requester_name: '',
    email: '',
    approval_reference_code: '',
    release_id: '',
    role_type: 'vocalist' as 'writer' | 'vocalist' | 'producer',
    preferred_date_start: '',
    preferred_date_end: '',
    production_reference: '',
    additional_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [success, setSuccess] = useState(false);
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [requestId, setRequestId] = useState<string | undefined>();

  useEffect(() => {
    getAllReleases({ status: 'published' }).then(setCmsReleases).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    if (!verifySecurity()) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    const { success: isValid, data, errors } = validateSchema(sessionRequestSchema, formData);

    if (!isValid && errors) {
      const formattedErrors: any = {};
      errors.issues.forEach((issue: any) => {
          formattedErrors[issue.path[0]] = issue.message;
      });
      setFieldErrors(formattedErrors);
      setError('Please correct the highlighted fields.');
      setLoading(false);
      
      const firstErrorField = errors.issues[0]?.path[0] as string;
      if (firstErrorField) {
        setTimeout(() => {
          const element = document.querySelector(`[name="${firstErrorField}"]`) as HTMLElement;
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      return;
    }

    const cleanData = sanitizeObject(data as any, {
      requester_name: 'text',
      email: 'email',
      approval_reference_code: 'text',
      production_reference: 'text',
      additional_notes: 'text'
    });

    try {
      // ── Validate reference code against server-side issued access codes ──
      const codesRes = await fetch('/api/studio-access-codes');
      const codeRecords: any[] = codesRes.ok ? await codesRes.json() : [];
      const matchedCode = codeRecords.find(
        (r) =>
          r.issued_code &&
          r.issued_code.toUpperCase() === formData.approval_reference_code.toUpperCase() &&
          r.status === 'issued'
      );
      if (!matchedCode) {
        setError(
          'Invalid or unrecognized reference code. Use the code shown in the "Request an Access Code" section above (format: REF-VOC-2026-XXXXX). The entity ID shown in the admin panel is not a valid code.'
        );
        setLoading(false);
        return;
      }

      // ── Submit session request to server ────────────────────────────────
      const res = await fetch('/api/session-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cleanData,
          user_id: user?.id,
          session_type: sessionType,
          role_type: formData.role_type,
          release_id: formData.release_id,
          preferred_date_start: formData.preferred_date_start,
          preferred_date_end: formData.preferred_date_end,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Submission failed. Please try again.');
      }
      const saved = await res.json();

      setRequestId(saved.id);
      setSuccess(true);
      setFormData({
        requester_name: '',
        email: '',
        approval_reference_code: '',
        release_id: '',
        role_type: 'vocalist',
        preferred_date_start: '',
        preferred_date_end: '',
        production_reference: '',
        additional_notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg">
      {success && requestId !== undefined && (
        <SessionRequestSuccessModal
          sessionType={sessionType}
          requestId={requestId}
          onClose={() => { setSuccess(false); onClose?.(); }}
        />
      )}
      <div className="border-b border-neutral-800 p-6">
        <h3 className="text-xl font-bold text-white mb-1">
          {sessionType === 'in_person' ? 'In-Person' : 'Remote'} Session Request
        </h3>
        <p className="text-sm text-neutral-400">
          Submit coordination request for governance review
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <input
          type="text"
          name="_bot_check"
          value={botCheck}
          onChange={(e) => setBotCheck(e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4">
          <p className="text-amber-400/90 text-xs leading-relaxed">
            Session access requires a valid approval reference code (format: <strong>REF-VOC-2026-XXXXX</strong>). If you don&apos;t have one yet, use the <strong>&quot;Request an Access Code&quot;</strong> section above. Do not enter a record/entity ID — enter only the code shown after your access code request is processed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <User className="w-4 h-4 text-amber-400" />
              Full Name
            </label>
            <input
              type="text"
              name="requester_name"
              required
              placeholder="Your registered name"
              value={formData.requester_name}
              onChange={(e) => setFormData({ ...formData, requester_name: DOMPurify.sanitize(e.target.value) })}
              className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 ${fieldErrors.requester_name ? 'border border-red-500' : ''}`}
            />
            {fieldErrors.requester_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.requester_name}</p>}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Mail className="w-4 h-4 text-amber-400" />
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="Your registered email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
              className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 ${fieldErrors.email ? 'border border-red-500' : ''}`}
            />
            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
          </div>
        </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Approval Reference Code
            </label>
            <input
              type="text"
              name="approval_reference_code"
              required
              placeholder="Enter your issued reference code"
              value={formData.approval_reference_code}
              onChange={(e) => setFormData({ ...formData, approval_reference_code: e.target.value.toUpperCase() })}
              className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 font-mono ${fieldErrors.approval_reference_code ? 'border border-red-500' : ''}`}
            />
            {fieldErrors.approval_reference_code && <p className="text-red-500 text-xs mt-1">{fieldErrors.approval_reference_code}</p>}
            <p className="text-xs text-neutral-500 mt-1">
              Reference code provided after contributor credential approval
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <User className="w-4 h-4 text-amber-400" />
              Your Role
            </label>
            <select
              name="role_type"
              required
              value={formData.role_type}
              onChange={(e) => setFormData({ ...formData, role_type: e.target.value as any })}
              className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white ${fieldErrors.role_type ? 'border border-red-500' : ''}`}
            >
              <option value="writer">Writer (Ahl-e-Qalam)</option>
              <option value="vocalist">Vocalist (Ahl-e-Sada)</option>
              <option value="producer">Producer (Ahl-e-Naghma)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Release ID
            </label>
            <select
              name="release_id"
              value={formData.release_id}
              onChange={(e) => setFormData({ ...formData, release_id: e.target.value })}
              className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white"
            >
              <option value="">— Not tied to a specific release —</option>
              {cmsReleases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Optional: Select the approved release this session is for
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Preferred Start Date
              </label>
              <input
                type="date"
                name="preferred_date_start"
                required
                value={formData.preferred_date_start}
                onChange={(e) => setFormData({ ...formData, preferred_date_start: e.target.value })}
                className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white ${fieldErrors.preferred_date_start ? 'border border-red-500' : ''}`}
              />
              {fieldErrors.preferred_date_start && <p className="text-red-500 text-xs mt-1">{fieldErrors.preferred_date_start}</p>}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Preferred End Date
              </label>
              <input
                type="date"
                name="preferred_date_end"
                required
                value={formData.preferred_date_end}
                onChange={(e) => setFormData({ ...formData, preferred_date_end: e.target.value })}
                className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white ${fieldErrors.preferred_date_end ? 'border border-red-500' : ''}`}
              />
              {fieldErrors.preferred_date_end && <p className="text-red-500 text-xs mt-1">{fieldErrors.preferred_date_end}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-300 mb-2 block">
              Production Reference
            </label>
            <input
              type="text"
              name="production_reference"
              placeholder="Reference number or production code"
              value={formData.production_reference}
              onChange={(e) => setFormData({ ...formData, production_reference: DOMPurify.sanitize(e.target.value) })}
              className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 ${fieldErrors.production_reference ? 'border border-red-500' : ''}`}
            />
            {fieldErrors.production_reference && <p className="text-red-500 text-xs mt-1">{fieldErrors.production_reference}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-300 mb-2 block">
              Additional Notes
            </label>
            <textarea
              name="additional_notes"
              rows={4}
              placeholder="Provide any additional context for this session request..."
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: DOMPurify.sanitize(e.target.value) })}
              className={`form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 resize-none ${fieldErrors.additional_notes ? 'border border-red-500' : ''}`}
            />
            {fieldErrors.additional_notes && <p className="text-red-500 text-xs mt-1">{fieldErrors.additional_notes}</p>}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400/50 text-amber-400 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
    </div>
  );
}
