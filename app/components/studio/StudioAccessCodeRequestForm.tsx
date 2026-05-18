"use client";

import { useState } from 'react';
import { CircleCheck as CheckCircle, KeyRound, Copy, Check, User, Mail, Loader as Loader2, ShieldCheck } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '@/app/contexts/AuthContext';
import { useFormSecurity } from '../../hooks/useFormSecurity';
import { studioAccessCodeRequestSchema, validateSchema } from '../../lib/validation-schemas';
import { IconInput } from '../ui/IconInput';

export function StudioAccessCodeRequestForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    role: 'vocalist' as 'writer' | 'vocalist' | 'producer',
    profile_reference: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [isRetrieved, setIsRetrieved] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!verifySecurity()) {
      setLoading(false);
      return;
    }

    const { success: isValid, data, errors } = validateSchema(studioAccessCodeRequestSchema, formData);
    if (!isValid && errors) {
      setError(errors.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/studio-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to request authorization reference');
      }

      setIssuedCode(result.issued_code);
      setIsRetrieved(!!result.retrieved);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (issuedCode) {
      navigator.clipboard.writeText(issuedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (issuedCode) {
    const displayCode = issuedCode.toUpperCase();
    return (
      <div className="elite-card p-10 md:p-16 space-y-10 animate-in fade-in zoom-in duration-500 border-amber-400/20 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle size={36} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {isRetrieved ? 'Authorization Reference Verified' : 'Authorization Reference Issued'}
            </h3>
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em] mt-1">
              Registry Authorization Confirmed
            </p>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 rounded-[40px] p-12 space-y-4 shadow-inner">
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.4em] font-black text-center mb-8">Your Studio Authorization Reference</p>
          <div className="flex flex-col items-center gap-10">
            <p className="font-mono text-4xl md:text-5xl font-bold text-amber-400 tracking-[0.4em] select-all drop-shadow-[0_0_30px_rgba(212,175,55,0.3)] uppercase">{displayCode}</p>
            <button
              onClick={handleCopy}
              className="flex items-center gap-4 px-10 py-4 bg-white/[0.03] hover:bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.3em] text-neutral-400 hover:text-white transition-all shadow-xl"
            >
              {copied ? <Check size={16} className="text-emerald-500 stroke-[3]" /> : <Copy size={16} />}
              {copied ? 'Copied to Registry' : 'Copy Reference'}
            </button>
          </div>
        </div>

        <div className="bg-amber-400/5 border border-amber-400/10 rounded-[32px] p-10 space-y-4">
          {!isRetrieved && <p className="text-amber-400 text-xs font-black uppercase tracking-[0.4em]">⚠️ Critical Security Note</p>}
          <p className="text-neutral-400 text-sm leading-relaxed font-medium">
            Save this reference — it is mandatory for session coordination. Enter this code in the <strong className="text-white">Studio Authorization Reference</strong> field when submitting your request below.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="elite-card overflow-hidden shadow-2xl" id="reference-request-form">
      <div className="border-b border-white/5 px-8 py-8 bg-white/[0.02]">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-400/5 rounded-2xl border border-amber-400/10 text-amber-400">
                <KeyRound size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Authorization Reference</h3>
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em]">Credential Validation Pathway</p>
            </div>
        </div>
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
            <p className="text-amber-400/80 text-xs leading-relaxed font-bold uppercase tracking-[0.2em] text-center">
                Studio session access requests are available only to approved contributors operating within authorized production workflows. Contributor approval must be completed before session coordination can be initiated.
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <IconInput icon={User} label="Full Name">
              <input
                  type="text"
                  name="name"
                  required
                  placeholder="Your registered name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: DOMPurify.sanitize(e.target.value) })}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
              />
            </IconInput>

            <IconInput icon={Mail} label="Secure Email">
              <input
                  type="email"
                  name="email"
                  required
                  placeholder="Your registered email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.trim() })}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
              />
            </IconInput>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <IconInput icon={User} label="Contributor Role" rightIcon>
              <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full appearance-none rounded-2xl bg-black/40 border border-white/10 pl-16 pr-14 py-5 text-white focus:border-amber-400 focus:outline-none transition-all"
              >
                  <option value="writer">Writer (Ahl-e-Qalam)</option>
                  <option value="vocalist">Vocalist (Ahl-e-Sada)</option>
                  <option value="producer">Producer (Ahl-e-Naghma)</option>
              </select>
            </IconInput>

            <IconInput icon={ShieldCheck} label="Profile Reference">
              <input
                  type="text"
                  name="profile_reference"
                  required
                  placeholder="Reference ID (e.g. SP-VOC-...)"
                  value={formData.profile_reference}
                  onChange={(e) => setFormData({ ...formData, profile_reference: DOMPurify.sanitize(e.target.value) })}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all font-mono tracking-widest uppercase"
              />
            </IconInput>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-400">Reason for Session Access</label>
            <textarea
                name="reason"
                rows={4}
                required
                placeholder="Briefly describe the production context requiring studio access…"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: DOMPurify.sanitize(e.target.value) })}
                className="w-full rounded-2xl bg-black/40 border border-white/10 px-8 py-6 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all h-40 resize-none"
            />
        </div>

        <div className="pt-8">
            <button
                type="submit"
                disabled={loading}
                className="w-full py-8 bg-linear-to-r from-amber-400 to-amber-500 text-neutral-950 font-black rounded-[32px] hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-[12px] tracking-[0.5em] flex items-center justify-center gap-5 group shadow-2xl"
            >
                {loading ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <ShieldCheck size={24} className="group-hover:scale-110 transition-transform" />}
                {loading ? 'Processing Registry Audit...' : 'Request Authorization Reference'}
            </button>
        </div>
      </form>

      <style jsx global>{`
        .elite-input {
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px 20px;
          color: white;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .elite-input:focus {
          border-color: rgba(212, 175, 55, 0.4);
          background: rgba(15, 15, 15, 1);
          box-shadow: 0 0 30px rgba(212, 175, 55, 0.05), inset 0 2px 4px rgba(0,0,0,0.2);
        }
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
