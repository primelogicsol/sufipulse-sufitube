import { useState } from 'react';
import { CircleCheck as CheckCircle, KeyRound } from 'lucide-react';
import DOMPurify from 'dompurify';
import { notifyAdmin } from '@/app/lib/notifications';
import { useAuth } from '@/app/contexts/AuthContext';

type RequestRole = 'writer' | 'vocalist' | 'producer';

const ROLE_OPTIONS: { value: RequestRole; label: string }[] = [
  { value: 'writer',    label: 'Writer — Ahl-e-Qalam' },
  { value: 'vocalist',  label: 'Vocalist — Ahl-e-Sada' },
  { value: 'producer',  label: 'Producer — Ahl-e-Naghma' },
];

const STORAGE_KEY = 'sufipulse_studio_access_requests';

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const existing: any[] = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        : [];

      // Prevent duplicate pending requests from same email
      const hasPending = existing.some(
        (r) => r.email.toLowerCase() === formData.email.toLowerCase() && r.status === 'pending'
      );
      if (hasPending) {
        setError('A pending request from this email address already exists. Please wait for a response before submitting again.');
        return;
      }

      const entry = {
        id: `ACR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        profile_reference: formData.profile_reference,
        reason: formData.reason,
        status: 'pending',
        issued_code: null,
        created_at: new Date().toISOString(),
        issued_at: null,
        user_id: user?.id ?? null,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, entry]));

      const roleLabel = ROLE_OPTIONS.find(r => r.value === formData.role)?.label ?? formData.role;
      await notifyAdmin({
        title: 'New Studio Access Code Request',
        message: `${DOMPurify.sanitize(formData.name)} (${DOMPurify.sanitize(formData.email)}) has requested a Studio Session reference code as ${roleLabel}. Profile reference: ${DOMPurify.sanitize(formData.profile_reference) || '—'}.`,
        event: 'application_received',
        from_role: formData.role,
        from_name: DOMPurify.sanitize(formData.name),
        action_url: '/admin/studio-access-codes',
      });

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-neutral-900/40 border border-amber-400/20 rounded-lg p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 mx-auto">
          <CheckCircle className="w-7 h-7 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Access Code Request Submitted</h3>
        <p className="text-sm text-neutral-400 max-w-sm mx-auto">
          Your request has been sent to the SufiPulse admin team for review. You will receive your reference code once approved. Note the request ID from the admin page for tracking.
        </p>
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
              required
              placeholder="Your registered name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: DOMPurify.sanitize(e.target.value) })}
              className="form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="Your registered email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
              className="form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">Your Role</label>
          <select
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as RequestRole })}
            className="form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white text-sm"
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
            required
            placeholder="Reference ID from your approved application"
            value={formData.profile_reference}
            onChange={(e) => setFormData({ ...formData, profile_reference: DOMPurify.sanitize(e.target.value) })}
            className="form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 font-mono text-sm"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Found in your approval notification or contributor dashboard
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Reason for Session Access
          </label>
          <textarea
            rows={3}
            required
            placeholder="Briefly describe the production context requiring studio access…"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: DOMPurify.sanitize(e.target.value) })}
            className="form-input w-full px-4 py-2.5 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 resize-none text-sm"
          />
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
