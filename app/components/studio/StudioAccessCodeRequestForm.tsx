import { useState } from 'react';
import { CircleCheck as CheckCircle, KeyRound, Copy, Check } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '@/app/contexts/AuthContext';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { studioAccessCodeRequestSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeObject } from '../../lib/sanitize';

const ROLE_PREFIX: Record<string, string> = {
  writer: 'WRT',
  vocalist: 'VCL',
  producer: 'PRD',
};

function generateAccessCode(role: string): string {
  const prefix = ROLE_PREFIX[role] ?? 'CNT';
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `REF-${prefix}-${year}-${rand}`;
}

type RequestRole = 'writer' | 'vocalist' | 'producer';

const ROLE_OPTIONS: { value: RequestRole; label: string }[] = [
  { value: 'writer',    label: 'Writer — Ahl-e-Qalam' },
  { value: 'vocalist',  label: 'Vocalist — Ahl-e-Sada' },
  { value: 'producer',  label: 'Producer — Ahl-e-Naghma' },
];

export function StudioAccessCodeRequestForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'vocalist' as RequestRole,
    profile_reference: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issuedCode, setIssuedCode] = useState('');
  const [existingCode, setExistingCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    if (!verifySecurity()) {
      setSubmitted(true);
      setLoading(false);
      return;
    }

    const { success, data, errors } = validateSchema(studioAccessCodeRequestSchema, formData);

    if (!success && errors) {
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
      name: 'text',
      email: 'email',
      profile_reference: 'text',
      reason: 'text'
    });

    try {
      // Prevent duplicate pending requests from same email
      const existing = await fetch('/api/studio-access-codes').then(r => r.ok ? r.json() : []).catch(() => []);
      const activeRecord = existing.find(
        (r: any) =>
          (r.email?.toLowerCase() === formData.email.toLowerCase() ||
            (user?.id && r.user_id === user.id)) &&
          (r.status === 'pending' || r.status === 'issued')
      );
      if (activeRecord) {
        if (activeRecord.issued_code &&
            (activeRecord.user_id === user?.id || activeRecord.email?.toLowerCase() === formData.email.toLowerCase())) {
          setExistingCode(activeRecord.issued_code);
          setSubmitted(true);
        } else {
          setError('A request from this email is already under review. You will be notified when your code is issued. Contact admin if you need assistance.');
        }
        setLoading(false);
        return;
      }

      const code = generateAccessCode(formData.role);
      const res = await fetch('/api/studio-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cleanData,
          role: formData.role,
          profile_reference: formData.profile_reference,
          user_id: user?.id ?? null,
          issued_code: code,
          status: 'issued',
          issued_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Submission failed. Please try again.');
      }

      setIssuedCode(code);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(issuedCode || existingCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const displayCode = issuedCode || existingCode;
  const isRetrieved = !issuedCode && !!existingCode;

  if (submitted) {
    return (
      <div className="bg-neutral-900/40 border border-amber-400/20 rounded-lg p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-400/10 border border-amber-400/30 shrink-0">
            <CheckCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {isRetrieved ? 'Your Access Code' : 'Access Code Issued'}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isRetrieved
                ? 'A code was already issued for this account'
                : 'Your studio session reference code is ready'}
            </p>
          </div>
        </div>

        <div className="bg-neutral-950/60 border border-amber-400/30 rounded-lg p-5">
          <p className="text-xs text-neutral-400 mb-2 uppercase tracking-widest font-medium">Your Access Code</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-xl font-bold text-amber-400 tracking-widest flex-1 select-all">{displayCode}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded text-xs font-medium transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4 space-y-1.5">
          {!isRetrieved && <p className="text-amber-400/90 text-xs font-semibold">Save this code — it will not be shown again.</p>}
          <p className="text-neutral-400 text-xs">
            Enter this code in the <strong className="text-neutral-300">Approval Reference Code</strong> field when submitting your session request below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/40 border border-neutral-800 rounded-lg">
      <div className="border-b border-neutral-800 px-6 py-5 flex items-center gap-3">
        <div className="p-2 bg-amber-400/10 rounded-lg border border-amber-400/20">
          <KeyRound className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Request an Access Code</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            For approved contributors who need a Studio Session reference code
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
            This form is for <strong>already-approved contributors</strong> only. Your application to the network must be approved before a studio access code can be issued. If you have not yet applied, please apply through the appropriate contributor page first.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Full Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Your registered name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: DOMPurify.sanitize(e.target.value) })}
              className={`form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 text-sm ${fieldErrors.name ? 'border border-red-500' : ''}`}
            />
            {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="Your registered email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
              className={`form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 text-sm ${fieldErrors.email ? 'border border-red-500' : ''}`}
            />
            {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Your Role</label>
          <select
            name="role"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as RequestRole })}
            className={`form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white text-sm ${fieldErrors.role ? 'border border-red-500' : ''}`}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Profile / Application Reference
          </label>
          <input
            type="text"
            name="profile_reference"
            required
            placeholder="Reference ID from your approved application"
            value={formData.profile_reference}
            onChange={(e) => setFormData({ ...formData, profile_reference: DOMPurify.sanitize(e.target.value) })}
            className={`form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 font-mono text-sm ${fieldErrors.profile_reference ? 'border border-red-500' : ''}`}
          />
          {fieldErrors.profile_reference && <p className="text-red-500 text-xs mt-1">{fieldErrors.profile_reference}</p>}
          <p className="text-xs text-neutral-500 mt-1">
            Found in your approval notification or contributor dashboard
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Reason for Session Access
          </label>
          <textarea
            name="reason"
            rows={3}
            required
            placeholder="Briefly describe the production context requiring studio access…"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: DOMPurify.sanitize(e.target.value) })}
            className={`form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 resize-none text-sm ${fieldErrors.reason ? 'border border-red-500' : ''}`}
          />
          {fieldErrors.reason && <p className="text-red-500 text-xs mt-1">{fieldErrors.reason}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400/50 text-amber-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting…' : 'Submit Access Code Request'}
        </button>
      </form>
    </div>
  );
}
