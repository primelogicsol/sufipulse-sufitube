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
  User, 
  Globe, 
  Music, 
  Sparkles, 
  History, 
  Search, 
  Clock,
  ArrowRight,
  Hash,
  Languages,
  Radio,
  Scale,
  Info,
  ShieldCheck,
  MessageSquare,
  FileText,
  CheckCircle2,
  Video
} from 'lucide-react';
import { Card } from '../primitives/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useFormSecurity } from '@/app/hooks/useFormSecurity';
import { VocalistSubmissionSuccessModal } from './VocalistSubmissionSuccessModal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Constants & Taxonomy ────────────────────────────────────────────────────

const LANGUAGES_TAXONOMY = [
  { category: 'Primary', items: ['Urdu', 'Persian', 'Punjabi', 'Kashmiri', 'Arabic'] },
  { category: 'Regional & Classical', items: ['Sindhi', 'Pashto', 'Seraiki', 'Braj Bhasha', 'Old Awadhi'] },
  { category: 'Global', items: ['English', 'Turkish', 'French', 'Spanish'] }
];

const STYLES_TAXONOMY = [
  'Classical Devotional', 'Qawwali', 'Contemporary Devotional', 'Traditional Hymnal', 'Sufi Melodic', 'World Fusion', 'Ghazal Singing', 'Hamd / Naat'
];

const VOCAL_RANGES = [
  'Soprano', 'Mezzo-Soprano', 'Alto', 'Tenor', 'Baritone', 'Bass', 'Other/Unsure'
];

const REVIEW_TIMELINE = [
  { stage: 'Registry Validation', duration: '1–3 days', desc: 'Authentication and metadata verification' },
  { stage: 'Vocal Screening', duration: '3–7 days', desc: 'Initial range and style suitability review' },
  { stage: 'Technical Evaluation', duration: '5–10 days', desc: 'Assessment of sample quality and studio readiness' },
  { stage: 'Governance Evaluation', duration: '2–5 days', desc: 'Alignment review under Majlis-e-Nazr' },
  { stage: 'Registry Decision', duration: 'Final notice', desc: 'Formal institutional authorization' }
];

const WORKFLOW_DEFINITIONS: Record<string, string> = {
  'Submission': 'Initial record entry into the Ahl-e-Sada intake registry.',
  'Vocal Screening': 'Preliminary evaluation of vocal range and devotional tone.',
  'Technical Evaluation': 'Deep assessment of performance quality and recording standards.',
  'Governance Evaluation': 'Institutional alignment review under Majlis-e-Nazr oversight.',
  'Registry Decision': 'Formal determination of eligibility and dashboard activation.'
};

const EXPECTATIONS = [
  { icon: <MessageSquare size={14} />, label: 'Vocal Refinement Requests' },
  { icon: <FileText size={14} />, label: 'Requests for Additional Samples' },
  { icon: <Languages size={14} />, label: 'Linguistic/Diction Correction' },
  { icon: <Shield size={14} />, label: 'Governance Verification Notices' },
  { icon: <History size={14} />, label: 'Registry Status Notifications' }
];

const OUTCOMES = [
  { 
    status: 'Approved', 
    color: 'emerald', 
    benefits: ['Registry Activation', 'Dashboard Access', 'Contributor ID', 'Kalam Assignment Eligibility'] 
  },
  { 
    status: 'Revision', 
    color: 'orange', 
    note: 'Opportunity to provide improved samples based on technical feedback.' 
  }
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionStatus {
  id: number;
  label: string;
  subtitle: string;
  complete: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VocalistCredentialsForm({ onSuccess, initialData }: { onSuccess?: (submissionId: string, token: string) => void, initialData?: any }) {
  const { user } = useAuth();
  const router = useRouter();
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
  const [formData, setFormData] = useState({
    full_name: initialData?.fullName || user?.full_name || '',
    performance_name: initialData?.performanceName || '',
    email: initialData?.email || user?.email || '',
    country: initialData?.country || '',
    city: initialData?.city || '',
    years_experience: initialData?.yearsExperience || '',
    vocal_range: initialData?.vocalRange || '',
    primary_languages: initialData?.primaryLanguages || [] as string[],
    performance_styles: initialData?.performanceStyles || [] as string[],
    musical_training: initialData?.musicalTraining || '',
    sample_link: initialData?.sampleLink || '',
    worked_in_studio: initialData?.workedInStudio ?? null as boolean | null,
    willing_editorial_approval: initialData?.willingEditorialApproval ?? null as boolean | null,
    accept_producer_coordination: initialData?.acceptProducerCoordination || false,
    accept_framework: initialData?.acceptFramework || false,
  });

  const [languageSearch, setLanguageSearch] = useState('');

  // ─── Computational Logic ───────────────────────────────────────────────────

  const readinessScore = useMemo(() => {
    let score = 0;
    const totalWeights = 5;

    if (formData.full_name && formData.email && formData.country) score += 1;
    if (formData.primary_languages.length > 0 && formData.performance_styles.length > 0 && formData.vocal_range) score += 1;
    if (formData.sample_link && formData.sample_link.startsWith('http')) score += 1.5;
    if (formData.musical_training.length > 20) score += 0.5;
    if (formData.accept_producer_coordination && formData.accept_framework) score += 1;

    return Math.min(100, Math.round((score / totalWeights) * 100));
  }, [formData]);

  const sections: SectionStatus[] = [
    { id: 1, label: 'Registry Identity', subtitle: 'Legal identity and contributor verification.', complete: !!(formData.full_name && formData.email && formData.country) },
    { id: 2, label: 'Vocal & Linguistic Profile', subtitle: 'Range, performance styles, and languages.', complete: !!(formData.primary_languages.length > 0 && formData.performance_styles.length > 0 && formData.vocal_range) },
    { id: 3, label: 'Performance Portfolio', subtitle: 'Technical samples and studio experience.', complete: !!(formData.sample_link && formData.sample_link.startsWith('http')) },
    { id: 4, label: 'Institutional performance Covenant', subtitle: 'Governance alignment and production acknowledgments.', complete: formData.accept_producer_coordination && formData.accept_framework },
    { id: 5, label: 'Registry Finalization', subtitle: 'Final review and institutional authorization request.', complete: false }
  ];

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      primary_languages: prev.primary_languages.includes(lang)
        ? prev.primary_languages.filter((l: string) => l !== lang)
        : [...prev.primary_languages, lang]
    }));
  };

  const handleStyleToggle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      performance_styles: prev.performance_styles.includes(style)
        ? prev.performance_styles.filter((s: string) => s !== style)
        : [...prev.performance_styles, style]
    }));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifySecurity()) return;
    setError(null);
    setLoading(true);

    try {
      const endpoint = ref ? `/api/vocalists/${ref}/revision?token=${token}` : '/api/vocalists/apply';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          languages_performed: formData.primary_languages // Schema compatibility
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = 'Submission failed';
        if (typeof data.error === 'object') {
          errorMsg = data.error.message;
          if (data.error.code === 'VALIDATION_ERROR' && data.error.details) {
            errorMsg += ': ' + data.error.details.map((d: any) => `${d.field} ${d.message}`).join(', ');
          }
        } else if (typeof data.error === 'string') {
          errorMsg = data.error;
        }
        throw new Error(errorMsg);
      }

      const refId = data.referenceId || '';
      const tkn = data.trackingToken || '';
      
      if (!tkn && !ref) {
        console.warn('[Vocalist Intake] No tracking token returned from API');
      }

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
    return <VocalistSubmissionSuccessModal onClose={() => setSubmitted(false)} submissionId={submissionId} trackingToken={trackingToken} />;
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start relative px-3 sm:px-4 md:px-0 pb-24 md:pb-32">
      
      {/* ── LEFT SIDE: FORM FLOW ────────────────────────────────────────────── */}
      <div className="lg:col-span-8 space-y-3 md:space-y-4">
        <div className="mb-6 md:mb-12 border-l-4 border-amber-400 pl-4 md:pl-8 py-2">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4 tracking-tighter">Institutional Vocalist Intake</h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-2xl font-light">
            Formal registry intake for vocalists seeking structured consideration within the SufiPulse production framework. All submissions are processed through the Majlis-e-Nazr.
          </p>
        </div>

        {/* SECTION 1: IDENTITY */}
        <SectionWrapper 
          id={1} 
          title="Registry Identity" 
          subtitle="Legal identity and contributor verification."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(1)}
          icon={<User size={18} />}
          isComplete={sections[0].complete}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Legal Full Name</label>
              <input 
                type="text" 
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                className="elite-input w-full"
                placeholder="Required for registry"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Performance Name (Optional)</label>
              <input 
                type="text" 
                value={formData.performance_name}
                onChange={e => setFormData({...formData, performance_name: e.target.value})}
                className="elite-input w-full"
                placeholder="Your stage or mystical title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Secure Contact Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="elite-input w-full"
                placeholder="Intake notifications will be sent here"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Country</label>
                <input 
                  type="text" 
                  value={formData.country}
                  onChange={e => setFormData({...formData, country: e.target.value})}
                  className="elite-input w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="elite-input w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Performance Experience</label>
              <select 
                value={formData.years_experience}
                onChange={e => setFormData({...formData, years_experience: e.target.value})}
                className="elite-input w-full appearance-none"
              >
                <option value="">Select duration...</option>
                <option value="0-2">0–2 Years</option>
                <option value="2-5">2–5 Years</option>
                <option value="5-10">5–10 Years</option>
                <option value="10+">10+ Years</option>
              </select>
            </div>
          </div>
          <StepActions step={1} onNext={() => setCurrentStep(2)} />
        </SectionWrapper>

        {/* SECTION 2: VOCAL PROFILE */}
        <SectionWrapper 
          id={2} 
          title="Vocal & Linguistic Profile" 
          subtitle="Range, performance styles, and languages."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(2)}
          icon={<Mic size={18} />}
          isComplete={sections[1].complete}
        >
          <div className="space-y-10">
            {/* Vocal Range Selector */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Vocal Range</label>
              <div className="flex flex-wrap gap-2">
                {VOCAL_RANGES.map(range => {
                  const isActive = formData.vocal_range === range;
                  return (
                    <button
                      key={range}
                      onClick={() => setFormData({...formData, vocal_range: range})}
                      className={`px-4 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-widest transition-all ${
                        isActive ? 'bg-amber-400 text-black border-amber-400' : 'bg-neutral-900 border-white/5 text-neutral-500 hover:border-white/20'
                      }`}
                    >
                      {range}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Performance Styles Taxonomy */}
            <div className="space-y-6 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Music size={16} className="text-amber-400" />
                <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Performance Styles</label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full" data-v="vocal-styles-v3">
                {STYLES_TAXONOMY.map(style => {
                  const isActive = formData.performance_styles.includes(style);
                  return (
                    <label
                      key={style}
                      className={`flex w-full min-h-[72px] items-center justify-start gap-4 rounded-xl border px-6 py-5 cursor-pointer transition-all duration-500 bg-black/30 border-white/10 hover:border-white/20 ${
                        isActive 
                          ? '!bg-amber-400/10 !border-amber-400/30 text-white' 
                          : 'text-neutral-500'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        className="h-5 w-5 shrink-0 accent-amber-400"
                        checked={isActive}
                        onChange={() => handleStyleToggle(style)}
                      />
                      <span className="text-left text-sm font-semibold uppercase tracking-[0.18em] leading-relaxed">
                        {style}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Languages Searchable Selector */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Languages Performed</label>
              </div>
              
              <div className="relative w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                <input 
                  type="text"
                  value={languageSearch}
                  onChange={e => setLanguageSearch(e.target.value)}
                  placeholder="Search languages (Urdu, Arabic, Kashmiri...)"
                  className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.primary_languages.map((lang: string) => (
                  <button 
                    key={lang} 
                    onClick={() => handleLanguageToggle(lang)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-lg"
                  >
                    {lang} <X size={12} className="stroke-[3]" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {LANGUAGES_TAXONOMY.map(cat => (
                  <div key={cat.category} className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600">{cat.category}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items
                        .filter(item => !formData.primary_languages.includes(item))
                        .filter(item => item.toLowerCase().includes(languageSearch.toLowerCase()))
                        .map(item => (
                        <button 
                          key={item} 
                          onClick={() => handleLanguageToggle(item)}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 text-[11px] text-neutral-400 rounded-md hover:border-amber-400/50 hover:text-white"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Training Notes */}
            <div className="space-y-2 pt-6 border-t border-white/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-600 ml-1">Musical Training & Heritage</label>
              <textarea 
                value={formData.musical_training}
                onChange={e => setFormData({...formData, musical_training: e.target.value})}
                className="elite-input w-full h-32 p-4 text-sm leading-relaxed"
                placeholder="Briefly describe your vocal lineage, formal training, teachers, or gharana affiliation..."
              />
            </div>
          </div>
          <StepActions step={2} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />
        </SectionWrapper>

        {/* SECTION 3: PERFORMANCE PORTFOLIO */}
        <SectionWrapper 
          id={3} 
          title="Performance Portfolio" 
          subtitle="Technical samples and studio experience."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(3)}
          icon={<Video size={18} />}
          isComplete={sections[2].complete}
        >
          <div className="space-y-8">
            <div className="p-6 bg-amber-400/5 border border-amber-400/10 rounded-2xl">
              <div className="flex items-start gap-4">
                <Info size={18} className="text-amber-400 mt-1 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white mb-1">Performance Sample Requirements</p>
                  <p className="text-[11px] text-neutral-400 leading-relaxed uppercase tracking-wider">
                    Please provide a link to a high-quality vocal sample (YouTube, SoundCloud, or Dropbox). Live performances or studio captures are preferred.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Primary Sample Link</label>
              <div className="relative w-full">
                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 pointer-events-none" />
                <input 
                  type="url" 
                  required
                  value={formData.sample_link}
                  onChange={e => setFormData({...formData, sample_link: e.target.value})}
                  className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Professional Context</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({...formData, worked_in_studio: true})}
                  className={`p-4 rounded-xl border text-left transition-all ${formData.worked_in_studio === true ? 'bg-amber-400/10 border-amber-400/50' : 'bg-neutral-950 border-white/5 text-neutral-500'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Studio Experience</p>
                  <p className="text-xs font-bold text-white">Yes, I have worked in professional recording environments.</p>
                </button>
                <button
                  onClick={() => setFormData({...formData, worked_in_studio: false})}
                  className={`p-4 rounded-xl border text-left transition-all ${formData.worked_in_studio === false ? 'bg-amber-400/10 border-amber-400/50' : 'bg-neutral-950 border-white/5 text-neutral-500'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Studio Experience</p>
                  <p className="text-xs font-bold text-white">No, I am primarily a live or traditional performer.</p>
                </button>
              </div>
            </div>
          </div>
          <StepActions step={3} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
        </SectionWrapper>

        {/* SECTION 4: PERFORMANCE COVENANT */}
        <SectionWrapper 
          id={4} 
          title="Institutional Performance Covenant" 
          subtitle="Governance alignment and production acknowledgments."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(4)}
          icon={<Scale size={18} />}
          isComplete={sections[3].complete}
        >
          <div className="space-y-6">
            <div className="grid gap-4">
              <GovernanceCard 
                label="Assigned Performance Framework"
                desc="I acknowledge that vocalists receive assigned kalam only after institutional editorial approval and I am willing to perform within the provided production guidelines."
                checked={formData.willing_editorial_approval === true}
                onChange={v => setFormData({...formData, willing_editorial_approval: v})}
              />

              <GovernanceCard 
                label="Producer & Studio Coordination"
                desc="I understand that vocal interpretation operates within the strict coordination of assigned producers and studio engineers to ensure master-grade technical standards."
                checked={formData.accept_producer_coordination}
                onChange={v => setFormData({...formData, accept_producer_coordination: v})}
              />

              <GovernanceCard 
                label="Institutional Governance"
                desc="I acknowledge that admission to the Ahl-e-Sada registry does not constitute a commitment for recording or publication, and SufiPulse maintains absolute institutional discretion."
                checked={formData.accept_framework}
                onChange={v => setFormData({...formData, accept_framework: v})}
              />
            </div>

            {/* Advanced Security Verification */}
            <div className="pt-8 mt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-neutral-600" />
                <div>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Security Protocol</p>
                  <p className="text-[9px] text-neutral-600 uppercase tracking-widest mt-1">Verification of performance integrity</p>
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
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Verified Human Contributor</span>
              </button>
            </div>
          </div>
          <StepActions step={4} onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} />
        </SectionWrapper>

        {/* SECTION 5: REGISTRY FINALIZATION */}
        <SectionWrapper 
          id={5} 
          title="Registry Finalization" 
          subtitle="Final review and institutional authorization request."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(5)}
          icon={<ShieldCheck size={18} />}
          isComplete={sections[4].complete}
        >
          <div className="space-y-8">
            <div className="p-8 bg-amber-400/5 border border-amber-400/10 rounded-2xl">
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-4">Registry Authorization Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Ahl-e-Sada Identity</p>
                    <p className="text-white font-bold">{formData.performance_name || formData.full_name || '—'}</p>
                    <p className="text-neutral-500 text-xs">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Linguistic Capability</p>
                    <p className="text-white text-xs font-bold uppercase tracking-wider">{formData.primary_languages.join(', ') || 'None selected'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Vocal Data</p>
                    <p className="text-white text-xs font-bold uppercase">{formData.vocal_range || '—'} · {formData.performance_styles.length} Styles</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Readiness Level</p>
                    <p className={`text-xs font-black uppercase tracking-widest ${readinessScore > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>{readinessScore}% Registry Alignment</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1.5">Intake Authorization</p>
                    <p className="text-[9px] text-neutral-400 leading-relaxed uppercase tracking-wider">
                      Reference ID generation and secure link dispatch occurs immediately upon formal entry.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="flex items-start gap-4">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1.5">Lifecycle Monitoring</p>
                    <p className="text-[9px] text-neutral-400 leading-relaxed uppercase tracking-wider">
                      Monitor screening progression, technical requests, and registry decisions in real-time.
                    </p>
                  </div>
                </div>
              </div>
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
                className="w-full py-5 bg-linear-to-r from-amber-400 to-amber-500 text-[#0A1628] font-black rounded-xl hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-sm tracking-[0.3em] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                Enter Performance Consideration
              </button>
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] text-neutral-600 uppercase font-black tracking-[0.2em] text-center max-w-sm">
                  Registry records are archived for institutional continuity regardless of immediate selection.
                </p>
                {readinessScore < 70 && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">
                    Registry requirements not met. Minimum 70% alignment required.
                  </p>
                )}
              </div>
            </div>
          </div>
          <StepActions step={5} onBack={() => setCurrentStep(4)} />
        </SectionWrapper>

        {/* VOCALIST BENEFITS & INSTITUTIONAL VALUE */}
        <div className="relative pl-12 pt-16">
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-neutral-800" />
          <div className="absolute left-0 top-16 w-8 h-8 rounded-full border-2 border-amber-400/30 bg-[#0a0a0a] z-10 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.1)]">
            <Sparkles size={14} className="text-amber-400" />
          </div>
          
          <div className="elite-card overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="border-l-2 border-amber-400/40 pl-6">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Vocalist Benefits & Institutional Value</h3>
                <p className="text-sm text-neutral-500 font-medium">If approved, Ahl-e-Sada contributors may receive:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { b: 'Performance Registry Activation', m: 'Formal recognition inside the SufiPulse vocalist network' },
                  { b: 'Vocalist Dashboard Access', m: 'Ability to track assignments, recording sessions, and master logs' },
                  { b: 'Kalam Assignment', m: 'Professional matching with approved sacred texts for performance' },
                  { b: 'Studio Production Support', m: 'Access to master-grade recording environments and engineering' },
                  { b: 'Release Attribution', m: 'Vocalist credit on all approved public releases' },
                  { b: 'Royalty Entitlement', m: 'Participation in revenue tracking for performed works' },
                  { b: 'Global Media Exposure', m: 'Featured placement in SufiPulse media and streaming channels' },
                  { b: 'Institutional Residency', m: 'Ongoing eligibility for future production cycles' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-2 shrink-0 group-hover:scale-150 transition-transform duration-300" />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white mb-1.5 transition-colors group-hover:text-amber-400">{item.b}</p>
                      <p className="text-xs text-neutral-500 leading-relaxed font-medium">{item.m}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="p-6 bg-neutral-950 border border-white/5 rounded-2xl">
                  <p className="text-[10px] text-neutral-600 leading-relaxed uppercase tracking-widest italic font-bold">
                    Institutional Disclaimer: Benefits depend on approval status, vocal screening, kalam assignment, and release authorization. Approval as a vocalist does not guarantee recording, publication, or specific royalty income.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: INTELLIGENCE SIDEBAR ────────────────────────────────── */}
      <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
        
        {/* Editorial Intake Status */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Intake Status</h3>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
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

        {/* Submission Readiness */}
        <div className="elite-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Registry Readiness</h3>
            <span className={`text-xs font-black font-mono ${readinessScore > 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{readinessScore}%</span>
          </div>
          <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-linear-to-r from-amber-500 to-amber-400 transition-all duration-700 ease-out"
              style={{ width: `${readinessScore}%` }}
            />
          </div>
          <p className="mt-4 text-[9px] text-neutral-600 uppercase font-black tracking-widest leading-relaxed">
            Minimum 70% alignment required for formal intake authorization.
          </p>
        </div>

        {/* After Submission Flow */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">After Submission</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              {[
                { label: 'Intake Submission', status: 'past' },
                { label: 'Registry Authorization', status: 'current' },
                { label: 'Reference ID Generated', status: 'pending' },
                { label: 'Tracking Portal Activated', status: 'pending' },
                { label: 'Screening Monitoring', status: 'pending' }
              ].map((node, i, arr) => (
                <div key={node.label} className="relative flex items-center gap-4">
                  {i < arr.length - 1 && (
                    <div className="absolute left-[7px] top-6 bottom-[-18px] w-px bg-neutral-800" />
                  )}
                  <div className={`w-3.5 h-3.5 rounded-full border-2 z-10 ${
                    node.status === 'past' ? 'bg-amber-400 border-amber-400' : 
                    node.status === 'current' ? 'bg-amber-400/20 border-amber-400' : 
                    'bg-neutral-950 border-neutral-800'
                  }`} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                    node.status === 'past' ? 'text-neutral-300' : 
                    node.status === 'current' ? 'text-amber-400' : 
                    'text-neutral-600'
                  }`}>{node.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registry Workflow with Definitions */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={14} className="text-neutral-600" /> Registry Workflow
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {[
              { label: 'Submission', status: 'active' },
              { label: 'Vocal Screening', status: 'pending' },
              { label: 'Technical Evaluation', status: 'pending' },
              { label: 'Governance Evaluation', status: 'pending' },
              { label: 'Registry Decision', status: 'pending' }
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

        {/* Institutional Review Timeline */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Review Timeline</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3 text-[9px] font-black text-neutral-600 uppercase tracking-widest">Phase</th>
                  <th className="px-6 py-3 text-[9px] font-black text-neutral-600 uppercase tracking-widest text-right">Est. Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {REVIEW_TIMELINE.map(t => (
                  <tr key={t.stage} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{t.stage}</p>
                      <p className="text-[8px] text-neutral-600 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{t.desc}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-[10px] font-mono text-neutral-500">{t.duration}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Expectations */}
        <div className="elite-card p-6">
          <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-6">Operational Expectations</h3>
          <p className="text-[9px] text-neutral-600 uppercase font-black tracking-widest mb-4">During Review You May Receive:</p>
          <div className="space-y-4">
            {EXPECTATIONS.map((exp, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="text-amber-400/50">{exp.icon}</div>
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{exp.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Outcomes */}
        <div className="bg-linear-to-br from-emerald-400/5 to-transparent border border-emerald-400/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-500" /> Institutional Outcomes
          </h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest mb-3">If Approved:</p>
              <div className="grid grid-cols-2 gap-2">
                {OUTCOMES[0].benefits?.map(b => (
                  <div key={b} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-black text-neutral-500 uppercase tracking-tighter">{b}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">If Revision Requested:</p>
              <p className="text-[9px] text-neutral-500 leading-relaxed italic">{OUTCOMES[1].note}</p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">If Not Selected:</p>
              <p className="text-[8px] text-neutral-600 uppercase tracking-widest leading-relaxed">Selection status does not prohibit future institutional submissions.</p>
            </div>
          </div>
        </div>

        {/* Contributor Tracking Activation */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
            <ShieldCheck size={80} />
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">Tracking Activation</p>
          <p className="text-[9px] text-neutral-500 leading-relaxed uppercase tracking-widest mb-6 px-2 font-bold">
            Secure monitoring becomes available after intake authorization.
          </p>
          <div className="p-3 bg-neutral-950 border border-white/5 rounded-xl mb-4">
            <p className="text-[8px] text-neutral-600 uppercase font-black tracking-widest">Registry Reference ID Required</p>
          </div>
          <button 
            disabled 
            className="w-full py-4 bg-white/[0.02] border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-neutral-700 rounded-xl cursor-not-allowed transition-all"
          >
            Monitor Registry Status
          </button>
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
