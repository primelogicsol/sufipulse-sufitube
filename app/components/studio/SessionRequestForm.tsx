"use client";

import { useState, useEffect } from 'react';
import { Calendar, FileText, User, Shield, Mail, Loader as Loader2, ShieldCheck } from 'lucide-react';
import DOMPurify from 'dompurify';
import { SessionRequestSuccessModal } from './SessionRequestSuccessModal';
import { useAuth } from '@/app/contexts/AuthContext';
import { getAllReleases } from '@/lib/cms-api';
import type { Release } from '@/lib/cms-types';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { sessionRequestSchema, validateSchema } from '../../lib/validation-schemas';
import { sanitizeObject } from '../../lib/sanitize';
import { IconInput } from '../ui/IconInput';

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
    reason_for_access: '',
    additional_notes: '',
    governance_acknowledgment: false
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
      reason_for_access: 'text',
      additional_notes: 'text'
    });

    try {
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
          'Invalid or unrecognized reference code. Use the reference shown in the "Studio Session Access Request" section above (format: REF-VOC-2026-XXXXX).'
        );
        setLoading(false);
        return;
      }

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
          governance_acknowledgment: formData.governance_acknowledgment
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
        reason_for_access: '',
        additional_notes: '',
        governance_acknowledgment: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="elite-card overflow-hidden shadow-2xl">
      {success && requestId !== undefined && (
        <SessionRequestSuccessModal
          sessionType={sessionType}
          requestId={requestId}
          onClose={() => { setSuccess(false); onClose?.(); }}
        />
      )}
      <div className="border-b border-white/5 px-8 py-8 bg-white/[0.02]">
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {sessionType === 'in_person' ? 'In-Person' : 'Remote'} Session Request
        </h3>
        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em]">
          Institutional Coordination / Governance Review
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10">
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
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2">
            <p className="text-red-400 text-xs font-black uppercase tracking-[0.2em]">{error}</p>
          </div>
        )}

        <div className="bg-amber-400/5 border border-amber-400/10 rounded-3xl p-8">
          <div className="flex gap-5">
            <Shield className="w-6 h-6 text-amber-400 shrink-0" />
            <p className="text-amber-400/80 text-xs leading-relaxed font-bold uppercase tracking-[0.2em]">
              Session access requires a valid Studio Authorization Reference (format: <strong className="text-amber-400">REF-VOC-2026-XXXXX</strong>). If you don&apos;t have one yet, use the <strong className="text-amber-400">&quot;Request Authorization Reference&quot;</strong> section above.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          <IconInput icon={User} label="Full Identity" error={fieldErrors.requester_name}>
            <input
              type="text"
              name="requester_name"
              required
              placeholder="Your registered name"
              value={formData.requester_name}
              onChange={(e) => setFormData({ ...formData, requester_name: DOMPurify.sanitize(e.target.value) })}
              className={`w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all ${fieldErrors.requester_name ? '!border-red-500/50' : ''}`}
            />
          </IconInput>

          <IconInput icon={Mail} label="Secure Email" error={fieldErrors.email}>
            <input
              type="email"
              name="email"
              required
              placeholder="Your registered email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
              className={`w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all ${fieldErrors.email ? '!border-red-500/50' : ''}`}
            />
          </IconInput>
        </div>

        <div className="grid sm:grid-cols-2 gap-8">
          <IconInput icon={ShieldCheck} label="Studio Authorization Reference" error={fieldErrors.approval_reference_code}>
            <input
              type="text"
              name="approval_reference_code"
              required
              placeholder="REF-VOC-2026-..."
              value={formData.approval_reference_code}
              onChange={(e) => setFormData({ ...formData, approval_reference_code: e.target.value.toUpperCase() })}
              className={`w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all font-mono tracking-widest ${fieldErrors.approval_reference_code ? '!border-red-500/50' : ''}`}
            />
          </IconInput>

          <IconInput icon={User} label="Contributor Role" error={fieldErrors.role_type} rightIcon>
            <select
              name="role_type"
              required
              value={formData.role_type}
              onChange={(e) => setFormData({ ...formData, role_type: e.target.value as any })}
              className={`w-full appearance-none rounded-2xl bg-black/40 border border-white/10 pl-16 pr-14 py-5 text-white focus:border-amber-400 focus:outline-none transition-all ${fieldErrors.role_type ? '!border-red-500/50' : ''}`}
            >
              <option value="writer">Writer (Ahl-e-Qalam)</option>
              <option value="vocalist">Vocalist (Ahl-e-Sada)</option>
              <option value="producer">Producer (Ahl-e-Naghma)</option>
            </select>
          </IconInput>
        </div>

        <IconInput icon={FileText} label="Associated Kalam or Project Title" rightIcon>
          <select
            name="release_id"
            value={formData.release_id}
            onChange={(e) => setFormData({ ...formData, release_id: e.target.value })}
            className="w-full appearance-none rounded-2xl bg-black/40 border border-white/10 pl-16 pr-14 py-5 text-white focus:border-amber-400 focus:outline-none transition-all"
          >
            <option value="">— Not tied to a specific release —</option>
            {cmsReleases.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </IconInput>

        <div className="grid md:grid-cols-2 gap-8">
          <IconInput icon={Calendar} label="Coordination window start" error={fieldErrors.preferred_date_start}>
            <input
              type="date"
              name="preferred_date_start"
              required
              value={formData.preferred_date_start}
              onChange={(e) => setFormData({ ...formData, preferred_date_start: e.target.value })}
              className={`w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-14 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all ${fieldErrors.preferred_date_start ? '!border-red-500/50' : ''}`}
            />
          </IconInput>

          <IconInput icon={Calendar} label="Coordination window end" error={fieldErrors.preferred_date_end}>
            <input
              type="date"
              name="preferred_date_end"
              required
              min={formData.preferred_date_start}
              value={formData.preferred_date_end}
              onChange={(e) => setFormData({ ...formData, preferred_date_end: e.target.value })}
              className={`w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-14 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all ${fieldErrors.preferred_date_end ? '!border-red-500/50' : ''}`}
            />
          </IconInput>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Reason for Session Access</label>
          <textarea
            name="reason_for_access"
            rows={4}
            required
            placeholder="Describe the production context requiring studio access..."
            value={formData.reason_for_access}
            onChange={(e) => setFormData({ ...formData, reason_for_access: DOMPurify.sanitize(e.target.value) })}
            className={`w-full rounded-2xl bg-black/40 border border-white/10 px-8 py-6 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all h-40 resize-none ${fieldErrors.reason_for_access ? '!border-red-500/50' : ''}`}
          />
          {fieldErrors.reason_for_access && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{fieldErrors.reason_for_access}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Technical Notes</label>
          <textarea
            name="additional_notes"
            rows={4}
            placeholder="Microphone preferences, file format requirements, or regional coordination details..."
            value={formData.additional_notes}
            onChange={(e) => setFormData({ ...formData, additional_notes: DOMPurify.sanitize(e.target.value) })}
            className={`w-full rounded-2xl bg-black/40 border border-white/10 px-8 py-6 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all h-40 resize-none ${fieldErrors.additional_notes ? '!border-red-500/50' : ''}`}
          />
          {fieldErrors.additional_notes && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-1 ml-1">{fieldErrors.additional_notes}</p>}
        </div>

        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px]">
          <label className="flex items-start gap-5 cursor-pointer group">
            <input 
              type="checkbox"
              checked={formData.governance_acknowledgment}
              onChange={e => setFormData({ ...formData, governance_acknowledgment: e.target.checked })}
              className="mt-1 h-6 w-6 shrink-0 accent-amber-400"
            />
            <span className="text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors leading-relaxed font-bold uppercase tracking-widest">
              I acknowledge that all recording sessions follow centralized production protocols and require final technical validation by the SufiPulse Central Studio.
            </span>
          </label>
          {fieldErrors.governance_acknowledgment && <p className="text-red-500 text-[10px] mt-6 font-black uppercase tracking-[0.2em]">{fieldErrors.governance_acknowledgment}</p>}
        </div>

        <div className="pt-8">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-8 bg-linear-to-r from-amber-400 to-amber-500 text-neutral-950 font-black rounded-[32px] hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-[12px] tracking-[0.5em] flex items-center justify-center gap-5 group shadow-2xl"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />}
            {loading ? 'Processing Registry Request...' : 'Submit Session Access Request'}
          </button>
        </div>
      </form>

      <style jsx global>{`
        .elite-card {
          background: rgba(18, 18, 18, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 40px;
          box-shadow: 
            0 40px 80px rgba(0,0,0,0.6),
            inset 0 1px 1px rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
}
