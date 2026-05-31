"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Loader as Loader2, 
  CircleAlert as AlertCircle, 
  Send, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Shield, 
  Mic, 
  Globe, 
  Music, 
  Sparkles, 
  History, 
  Search, 
  Clock,
  ArrowRight,
  Radio,
  Video,
  Layers,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Info,
  Settings,
  HardDrive
} from 'lucide-react';
import { Card } from '../primitives/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useFormSecurity } from '@/app/hooks/useFormSecurity';
import { StudioSubmissionSuccessModal } from './StudioSubmissionSuccessModal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudioProfileType } from '@/app/types/studio.types';
import DOMPurify from "dompurify";

// ─── Constants & Taxonomy ────────────────────────────────────────────────────

const RECORDING_CAPABILITIES = [
  'Vocal recording booth',
  'Treated acoustic environment',
  'Multi-track capability',
  'Professional microphone chain',
  'DAW-based recording system',
  'Analog outboard gear',
  'Instrument recording space',
  'Video capture capability'
];

const WORKFLOW_DEFINITIONS: Record<string, string> = {
  'Credentials Intake': 'Initial technical verification of facility and equipment.',
  'Facility Audit': 'Review of acoustic environment and recording chain.',
  'Master Validation': 'Centralized review of regional master quality.',
  'Network Integration': 'Operational alignment with centralized production standards.',
  'Production Authorization': 'Formal clearance to host SufiPulse sessions.'
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionStatus {
  id: number;
  label: string;
  subtitle: string;
  complete: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudioCredentialsForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess?: (submissionId: string, token: string) => void,
  initialData?: any
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const ref = searchParams?.get('ref');
  const token = searchParams?.get('token');

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [trackingToken, setTrackingToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [notABot, setNotABot] = useState(false);

  // Form State
  const [formData, setFormData] = useState<StudioProfileType>({
    studio_name: initialData?.studio_name || '',
    country: initialData?.country || '',
    city: initialData?.city || '',
    primary_contact_name: initialData?.primary_contact_name || user?.full_name || '',
    email: initialData?.email || user?.email || '',
    phone: initialData?.phone || '',
    recording_capabilities: initialData?.recording_capabilities || [] as string[],
    equipment_overview: initialData?.equipment_overview || '',
    years_in_operation: initialData?.years_in_operation || '',
    previous_work_link: initialData?.previous_work_link || '',
    agree_centralized_validation: initialData?.agree_centralized_validation || null,
    agree_centralized_authorization: initialData?.agree_centralized_authorization || null,
    accept_terms: initialData?.accept_terms || false,
  });

  // ─── Computational Logic ───────────────────────────────────────────────────

  const readinessScore = useMemo(() => {
    let score = 0;
    const totalWeights = 5;

    // 1. Identity (Weight 1)
    if (formData.studio_name && formData.email && formData.country) score += 1;
    // 2. Technical (Weight 1)
    if (formData.equipment_overview.length > 20) score += 1;
    // 3. Capabilities (Weight 1)
    if (formData.recording_capabilities.length > 0) score += 1;
    // 4. Alignment (Weight 1)
    if (formData.years_in_operation) score += 1;
    // 5. Governance (Weight 1)
    if (formData.agree_centralized_validation && formData.agree_centralized_authorization && formData.accept_terms) score += 1;

    return Math.min(100, Math.round((score / totalWeights) * 100));
  }, [formData]);

  const sections: SectionStatus[] = [
    { id: 1, label: 'Identity & Location', subtitle: 'Legal entity and facility location.', complete: !!(formData.studio_name && formData.email && formData.country) },
    { id: 2, label: 'Technical Infrastructure', subtitle: 'Equipment chain and DAW overview.', complete: formData.equipment_overview.length > 20 },
    { id: 3, label: 'Recording Capabilities', subtitle: 'Facility features and services.', complete: formData.recording_capabilities.length > 0 },
    { id: 4, label: 'Operational Profile', subtitle: 'Experience and regional coordination.', complete: !!formData.years_in_operation },
    { id: 5, label: 'Governance Acknowledgment', subtitle: 'Centralized review and master validation.', complete: !!(formData.agree_centralized_validation && formData.agree_centralized_authorization && formData.accept_terms) },
    { id: 6, label: 'Review & Submission', subtitle: 'Final technical audit request.', complete: false }
  ];

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleCapabilityToggle = (cap: string) => {
    setFormData(prev => ({
      ...prev,
      recording_capabilities: prev.recording_capabilities.includes(cap)
        ? prev.recording_capabilities.filter(c => c !== cap)
        : [...prev.recording_capabilities, cap]
    }));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifySecurity()) return;
    setError(null);
    setLoading(true);

    try {
      const endpoint = ref ? `/api/studio/${ref}/revision?token=${token}` : '/api/studio';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, profile_status: 'pending' }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Technical intake failed');
      }

      const refId = data.referenceId || data.submission_id || '';
      const tkn = data.trackingToken || '';
      setSubmissionId(refId);
      setTrackingToken(tkn);
      setSubmitted(true);
      if (onSuccess) onSuccess(refId, tkn);
    } catch (err: any) {
      setError(err.message || 'An institutional error occurred during intake.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return <StudioSubmissionSuccessModal onClose={() => setSubmitted(false)} submissionId={submissionId} />;
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start relative px-3 sm:px-4 md:px-0 pb-24 md:pb-32">
      
      {/* ── LEFT SIDE: FORM FLOW ────────────────────────────────────────────── */}
      <div className="lg:col-span-8 space-y-3 md:space-y-4">
        <div className="mb-6 md:mb-12 border-l-4 border-amber-400 pl-4 md:pl-8 py-2">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4 tracking-tighter">Network Studio Application</h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-2xl font-light">
            Technical credentials for recording facilities seeking inclusion within the Karkhana-e-Sada production network.
          </p>
        </div>

        {/* SECTION 1: IDENTITY */}
        <SectionWrapper 
          id={1} 
          title="Identity & Location" 
          subtitle="Legal entity and facility location."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(1)}
          icon={<Settings size={18} />}
          isComplete={sections[0].complete}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Studio Name</label>
              <input 
                type="text" 
                value={formData.studio_name}
                onChange={e => setFormData({...formData, studio_name: DOMPurify.sanitize(e.target.value)})}
                className="elite-input w-full"
                placeholder="Professional Studio Name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Primary Contact</label>
              <input 
                type="text" 
                value={formData.primary_contact_name}
                onChange={e => setFormData({...formData, primary_contact_name: DOMPurify.sanitize(e.target.value)})}
                className="elite-input w-full"
                placeholder="Manager / Lead Engineer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Contact Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="elite-input w-full"
                placeholder="Registry contact email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Phone (Optional)</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: DOMPurify.sanitize(e.target.value)})}
                className="elite-input w-full"
                placeholder="+1 ..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Country</label>
                <select 
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  className="elite-input w-full"
                >
                  <option value="">Select</option>
                  <option value="USA">USA</option>
                  <option value="Canada">Canada</option>
                  <option value="UAE">UAE</option>
                  <option value="India">India</option>
                  <option value="UK">UK</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: DOMPurify.sanitize(e.target.value)})}
                  className="elite-input w-full"
                />
              </div>
            </div>
          </div>
          <StepActions step={1} onNext={() => setCurrentStep(2)} />
        </SectionWrapper>

        {/* SECTION 2: TECHNICAL INFRASTRUCTURE */}
        <SectionWrapper 
          id={2} 
          title="Technical Infrastructure" 
          subtitle="Equipment chain and DAW overview."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(2)}
          icon={<HardDrive size={18} />}
          isComplete={sections[1].complete}
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Primary Equipment Overview</label>
              <textarea 
                value={formData.equipment_overview}
                onChange={e => setFormData({...formData, equipment_overview: DOMPurify.sanitize(e.target.value)})}
                className="elite-input w-full h-40 p-4 text-sm leading-relaxed"
                placeholder="Microphones, Pre-amps, Interface, Monitors, DAW system..."
              />
              <p className="text-[9px] text-neutral-600 uppercase tracking-widest ml-1 italic">Provide specific models where applicable for technical audit.</p>
            </div>
          </div>
          <StepActions step={2} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />
        </SectionWrapper>

        {/* SECTION 3: RECORDING CAPABILITIES */}
        <SectionWrapper 
          id={3} 
          title="Recording Capabilities" 
          subtitle="Facility features and services."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(3)}
          icon={<Mic size={18} />}
          isComplete={sections[2].complete}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RECORDING_CAPABILITIES.map(cap => {
                const isActive = formData.recording_capabilities.includes(cap);
                return (
                  <label
                    key={cap}
                    className={`flex w-full min-h-[72px] items-center justify-start gap-4 rounded-xl border px-6 py-5 cursor-pointer transition-all duration-300 ${
                      isActive 
                        ? 'bg-amber-400/5 border-amber-400/30 text-white' 
                        : 'bg-neutral-900/40 border-white/5 text-neutral-500 hover:border-white/10'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      className="h-5 w-5 shrink-0 accent-amber-400"
                      checked={isActive}
                      onChange={() => handleCapabilityToggle(cap)}
                    />
                    <span className="text-left text-sm font-semibold uppercase tracking-[0.18em] leading-relaxed">
                      {cap}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <StepActions step={3} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
        </SectionWrapper>

        {/* SECTION 4: OPERATIONAL PROFILE */}
        <SectionWrapper 
          id={4} 
          title="Operational Profile" 
          subtitle="Experience and regional coordination."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(4)}
          icon={<Clock size={18} />}
          isComplete={sections[3].complete}
        >
          <div className="space-y-8 p-1">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Years in Operation</label>
              <select 
                value={formData.years_in_operation}
                onChange={e => setFormData({...formData, years_in_operation: e.target.value})}
                className="elite-input w-full"
              >
                <option value="">Select experience</option>
                <option value="0-1">0–1 Years</option>
                <option value="1-3">1–3 Years</option>
                <option value="3-5">3–5 Years</option>
                <option value="5+">5+ Years</option>
              </select>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Previous Work Link (Optional)</label>
              <input 
                type="url" 
                value={formData.previous_work_link}
                onChange={e => setFormData({...formData, previous_work_link: e.target.value})}
                className="elite-input w-full"
                placeholder="Portfolio or SoundCloud/YouTube link"
              />
            </div>
          </div>
          <StepActions step={4} onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} />
        </SectionWrapper>

        {/* SECTION 5: GOVERNANCE ACKNOWLEDGMENT */}
        <SectionWrapper 
          id={5} 
          title="Governance Acknowledgment" 
          subtitle="Centralized review and master validation."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(5)}
          icon={<Shield size={18} />}
          isComplete={sections[4].complete}
        >
          <div className="space-y-6 text-left">
            <div className="grid gap-4">
              <GovernanceCard 
                label="Centralized Review"
                desc="I agree to operate under centralized review and final master validation by the SufiPulse Central Studio."
                checked={formData.agree_centralized_validation === true}
                onChange={v => setFormData({...formData, agree_centralized_validation: v ? true : null})}
              />

              <GovernanceCard 
                label="Authorization Authority"
                desc="I understand that mixing, mastering, and publication authorization remain under the centralized authority of SufiPulse."
                checked={formData.agree_centralized_authorization === true}
                onChange={v => setFormData({...formData, agree_centralized_authorization: v ? true : null})}
              />

              <GovernanceCard 
                label="Institutional Framework"
                desc="I acknowledge that network studios operate within a documented production framework and restrict sessions to approved contributors."
                checked={formData.accept_terms}
                onChange={v => setFormData({...formData, accept_terms: v})}
              />
            </div>
          </div>
          <StepActions step={5} onNext={() => setCurrentStep(6)} onBack={() => setCurrentStep(4)} />
        </SectionWrapper>

        {/* SECTION 6: REVIEW & SUBMISSION */}
        <SectionWrapper 
          id={6} 
          title="Review & Submission" 
          subtitle="Final technical audit request."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(6)}
          icon={<ShieldCheck size={18} />}
          isComplete={sections[5].complete}
        >
          <div className="space-y-8 text-left">
            <div className="p-8 bg-amber-400/5 border border-amber-400/10 rounded-2xl">
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-4">Technical Profile Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Studio Facility</p>
                    <p className="text-white font-bold">{formData.studio_name || '—'}</p>
                    <p className="text-neutral-500 text-xs">{formData.city}, {formData.country}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Primary Contact</p>
                    <p className="text-white text-xs font-bold uppercase tracking-wider">{formData.primary_contact_name || '—'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Experience</p>
                    <p className="text-white text-xs font-bold uppercase tracking-wider">{formData.years_in_operation || '—'} Years in Operation</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Intake Score</p>
                    <p className={`text-xs font-black uppercase tracking-widest ${readinessScore > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{readinessScore}% Registry Alignment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Security Verification */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-neutral-600" />
                <div className="text-left">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Registry Protocol</p>
                  <p className="text-[9px] text-neutral-600 uppercase tracking-widest mt-1">Verification of institutional integrity</p>
                </div>
              </div>

              <div className="hidden">
                <input type="text" value={botCheck} onChange={e => setBotCheck(e.target.value)} tabIndex={-1} />
              </div>

              <button
                type="button"
                onClick={() => setNotABot(!notABot)}
                className={`flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-300 border ${
                  notABot ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-950 border-white/5 text-neutral-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  notABot ? 'bg-emerald-500 border-emerald-500' : 'border-neutral-800'
                }`}>
                  {notABot && <Check size={14} className="text-black stroke-[4]" />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Verified Facility Representative</span>
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-3">
                <AlertCircle size={16} />
                <p className="font-bold uppercase tracking-wider">{error}</p>
              </div>
            )}

            <div className="flex flex-col items-center gap-6">
              <button
                onClick={handleFinalSubmit}
                disabled={loading || !notABot || readinessScore < 70}
                className="w-full py-5 bg-linear-to-r from-amber-400 to-amber-500 text-neutral-950 font-black rounded-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-sm tracking-[0.3em] flex items-center justify-center gap-4 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />}
                Submit Studio Credentials
              </button>
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] text-neutral-600 uppercase font-black tracking-[0.2em] text-center max-w-sm">
                  Registry submission initiates a technical facility audit. Final authorization is required for production inclusion.
                </p>
                {readinessScore < 70 && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">
                    Registry requirements not met. Minimum 70% alignment required.
                  </p>
                )}
              </div>
            </div>
          </div>
          <StepActions step={6} onBack={() => setCurrentStep(5)} />
        </SectionWrapper>
      </div>

      {/* ── RIGHT SIDE: INTELLIGENCE SIDEBAR ────────────────────────────────── */}
      <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
        
        {/* Intake Status */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Application Progress</h3>
            <div className="flex gap-1">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={`w-1 h-1 rounded-full ${currentStep === i ? 'bg-amber-400' : 'bg-neutral-800'}`} />
              ))}
            </div>
          </div>
          <div className="p-6 space-y-4">
            {sections.map((s) => (
              <div key={s.id} className="flex items-center justify-between group cursor-pointer" onClick={() => setCurrentStep(s.id)}>
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${s.complete ? 'bg-emerald-500' : currentStep === s.id ? 'bg-amber-400 scale-125' : 'bg-neutral-800'}`} />
                  <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentStep === s.id ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-400'}`}>{s.label}</span>
                </div>
                {s.complete && <Check size={12} className="text-emerald-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Workflow */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5 text-left">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={14} className="text-neutral-600" /> Institutional Workflow
            </h3>
          </div>
          <div className="p-6 space-y-6 text-left">
            {[
              { label: 'Credentials Intake', status: 'active' },
              { label: 'Facility Audit', status: 'pending' },
              { label: 'Master Validation', status: 'pending' },
              { label: 'Network Integration', status: 'pending' },
              { label: 'Production Authorization', status: 'pending' }
            ].map((node, i, arr) => (
              <div key={node.label} className="relative flex items-start gap-4 group">
                {i < arr.length - 1 && (
                  <div className="absolute left-[7px] top-6 bottom-[-18px] w-px bg-neutral-800" />
                )}
                <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 mt-1 ${node.status === 'active' ? 'bg-amber-400 border-amber-400' : 'bg-neutral-950 border-neutral-800'}`} />
                <div className="flex-1">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.15em] block mb-1 ${node.status === 'active' ? 'text-white' : 'text-neutral-600'}`}>{node.label}</span>
                  {WORKFLOW_DEFINITIONS[node.label] && (
                    <p className="text-[9px] text-neutral-700 leading-relaxed font-medium group-hover:text-neutral-500 transition-colors">
                      {WORKFLOW_DEFINITIONS[node.label]}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Structural Boundaries */}
        <div className="bg-linear-to-br from-amber-400/5 to-transparent border border-amber-400/10 rounded-2xl p-6 text-left">
          <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Shield size={14} className="text-amber-400" /> Operational Boundaries
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <p className="text-[9px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Network inclusion is reserved for facilities demonstrating professional technical standards.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <p className="text-[9px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Regional masters are subject to final quality validation by the SufiPulse Central Studio.
              </p>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        .elite-input {
          background: rgba(10, 10, 10, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 16px;
          color: white;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .elite-input:focus {
          border-color: rgba(212, 175, 55, 0.4);
          background: rgba(15, 15, 15, 1);
          box-shadow: 0 0 20px rgba(212, 175, 55, 0.05), inset 0 2px 4px rgba(0,0,0,0.2);
        }
        @media (max-width: 639px) {
          .elite-input {
            padding: 10px 12px;
            font-size: 13px;
            border-radius: 10px;
          }
        }
        .elite-card {
          background: rgba(18, 18, 18, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.4),
            inset 0 1px 1px rgba(255,255,255,0.02);
        }
        @media (max-width: 639px) {
          .elite-card {
            border-radius: 16px;
          }
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 175, 55, 0.2);
        }
      `}</style>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SectionWrapper({ id, title, subtitle, children, activeStep, onTitleClick, icon, isComplete }: { 
  id: number; 
  title: string; 
  subtitle: string;
  children: React.ReactNode; 
  activeStep: number;
  onTitleClick: () => void;
  icon: React.ReactNode;
  isComplete: boolean;
}) {
  const isActive = activeStep === id;
  const isPast = activeStep > id;

  return (
    <div className={`relative pl-0 md:pl-12 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
      {/* Progression Rail - desktop only */}
      <div className={`hidden md:block absolute left-[15px] top-0 bottom-0 w-px ${isActive || isPast ? 'bg-amber-400/30' : 'bg-neutral-800'}`} />
      
      {/* Step Node */}
      <div className={`absolute left-0 md:left-0 -top-4 md:top-6 w-6 h-6 md:w-8 md:h-8 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-500 ${
        isActive ? 'bg-amber-400 border-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 
        isPast ? 'bg-emerald-500 border-emerald-500 text-black' : 
        'bg-[#0a0a0a] border-neutral-800 text-neutral-600'
      }`}>
        {isPast ? <Check size={10} className="md:stroke-[4]" /> : <span className="text-[8px] md:text-[10px] font-black">{id}</span>}
      </div>

      <div className={`elite-card overflow-hidden transition-all duration-500 ${
        isActive ? 'ring-1 ring-amber-400/10 shadow-2xl md:translate-x-2' : 'hover:border-white/10'
      }`}>
        <button 
          onClick={onTitleClick}
          className={`w-full flex items-start justify-between px-4 md:px-8 py-4 md:py-6 text-left transition-colors ${isActive ? 'bg-white/[0.02]' : ''}`}
        >
          <div className="flex-1 pr-4 md:pr-8 min-w-0">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-neutral-600 mb-1 md:mb-1.5 leading-none">PHASE 0{id}</p>
            <h3 className={`text-base md:text-xl font-bold tracking-tight mb-0.5 md:mb-1 transition-colors truncate ${isActive ? 'text-white' : 'text-neutral-400'}`}>{title}</h3>
            <p className="text-[10px] md:text-xs text-neutral-500 font-medium leading-relaxed line-clamp-1 md:line-clamp-none">{subtitle}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2 md:gap-3 shrink-0 pt-0 md:pt-1">
            {isComplete ? (
              <span className="flex items-center gap-1 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500 whitespace-nowrap">
                Completed <Check size={8} className="md:stroke-[4]" />
              </span>
            ) : isActive ? (
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-400/80 animate-pulse whitespace-nowrap">In Progress</span>
            ) : null}
            {isActive ? <ChevronDown size={16} className="md:size-[18px] text-neutral-600" /> : <ChevronRight size={16} className="md:size-[18px] text-neutral-800" />}
          </div>
        </button>
        
        {isActive && (
          <div className="p-4 md:p-8 md:pt-2 animate-in fade-in slide-in-from-top-4 duration-500 border-t border-white/[0.03]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function StepActions({ step, onNext, onBack }: { step: number; onNext?: () => void; onBack?: () => void }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 mt-6 md:mt-10 pt-6 md:pt-8 border-t border-white/5">
      {onBack && (
        <button 
          onClick={onBack}
          className="px-5 md:px-6 py-3 md:py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          ← Back
        </button>
      )}
      {onNext && (
        <button 
          onClick={onNext}
          className="px-6 md:px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 hover:border-amber-400/30 transition-all sm:ml-auto flex items-center justify-center gap-2 group"
        >
          Continue
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
}

function GovernanceCard({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)}
      className={`flex items-start text-left p-4 md:p-6 rounded-xl md:rounded-2xl border transition-all duration-300 min-h-[44px] ${
        checked 
          ? 'bg-amber-400/5 border-amber-400/30' 
          : 'bg-neutral-950/50 border-white/5 hover:border-white/10'
      }`}
    >
      <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
        checked ? 'bg-amber-400 border-amber-400 shadow-lg shadow-amber-400/20' : 'border-neutral-800 bg-neutral-900'
      }`}>
        {checked && <Check size={12} className="md:size-[14px] text-black stroke-[4]" />}
      </div>
      <div className="ml-3 md:ml-6">
        <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-1 md:mb-2 ${checked ? 'text-amber-400' : 'text-neutral-500'}`}>{label}</p>
        <p className="text-[10px] md:text-[11px] text-neutral-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </button>
  );
}
