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
  Pen, 
  User, 
  Globe, 
  BookOpen, 
  Sparkles, 
  History, 
  Search, 
  Clock,
  ArrowRight,
  Hash,
  Languages,
  PenTool,
  Scale,
  Info,
  ShieldCheck,
  MessageSquare,
  FileText,
  CheckCircle2,
  Library,
  Feather
} from 'lucide-react';
import { Card } from '../primitives/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useFormSecurity } from '@/app/hooks/useFormSecurity';
import { LiteraryContributorSubmissionSuccessModal } from './LiteraryContributorSubmissionSuccessModal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LiteraryProfileType } from '@/app/types/literary.types';

// ─── Constants & Taxonomy ────────────────────────────────────────────────────

const LANGUAGES_TAXONOMY = [
  { category: 'Primary', items: ['English', 'Urdu', 'Arabic', 'Persian'] },
  { category: 'Regional', items: ['Punjabi', 'Kashmiri', 'Sindhi', 'Pashto', 'Seraiki'] },
  { category: 'Other', items: ['French', 'Spanish', 'Turkish', 'German'] }
];

const WRITING_FORMS = [
  'Essay', 'Reflection', 'Commentary', 'Translation', 'Editorial Note', 'Research-based Article', 'Sacred Literature', 'Cultural Analysis'
];

const AREAS_OF_INTEREST = [
  { id: 'sufi-thought', label: 'Sufi Thought', desc: 'Metaphysics and spiritual philosophy' },
  { id: 'sacred-music', label: 'Sacred Music', desc: 'Theology and history of spiritual sound' },
  { id: 'poetry', label: 'Poetry', desc: 'Classical and contemporary sacred verse' },
  { id: 'kashmir-culture', label: 'Kashmir Culture', desc: 'Literary and spiritual heritage of Kashmir' },
  { id: 'islamic-thought', label: 'Islamic Thought', desc: 'Thematic analysis of sacred texts' },
  { id: 'environmental', label: 'Environmental Reflection', desc: 'Spirituality and nature' },
  { id: 'interfaith', label: 'Interfaith Dialogue', desc: 'Comparative spiritual discourse' },
  { id: 'philosophy', label: 'Philosophy', desc: 'Rationality within sacred frameworks' }
];

const REVIEW_TIMELINE = [
  { stage: 'Registry Validation', duration: '1–3 days', desc: 'Authentication and metadata verification' },
  { stage: 'Editorial Screening', duration: '3–7 days', desc: 'Initial thematic and institutional review' },
  { stage: 'Linguistic Review', duration: '5–10 days', desc: 'Assessment of literary coherence and structure' },
  { stage: 'Governance Evaluation', duration: '2–5 days', desc: 'Alignment review under Majlis-e-Nazr' },
  { stage: 'Journal Decision', duration: 'Final notice', desc: 'Formal authorization for Journal publication' }
];

const WORKFLOW_DEFINITIONS: Record<string, string> = {
  'Submission': 'Initial record entry into the Ahl-e-Tahreer intake registry.',
  'Editorial Screening': 'Thematic evaluation of submitted literary material.',
  'Linguistic Review': 'Deep assessment of writing quality and intellectual integrity.',
  'Governance Evaluation': 'Institutional alignment review under Majlis-e-Nazr oversight.',
  'Journal Decision': 'Formal determination of eligibility for Literary Journal publication.'
};

const EXPECTATIONS = [
  { icon: <MessageSquare size={14} />, label: 'Editorial Revision Requests' },
  { icon: <FileText size={14} />, label: 'Requests for Additional Samples' },
  { icon: <Languages size={14} />, label: 'Linguistic Clarification' },
  { icon: <Shield size={14} />, label: 'Governance Verification Notices' },
  { icon: <History size={14} />, label: 'Registry Status Notifications' }
];

const OUTCOMES = [
  { 
    status: 'Approved', 
    color: 'emerald', 
    benefits: ['Journal Publication', 'Dashboard Access', 'Contributor ID', 'Archive Inclusion'] 
  },
  { 
    status: 'Revision', 
    color: 'orange', 
    note: 'Opportunity to refine and resubmit based on editorial feedback.' 
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

export function LiteraryContributorCredentialsForm({ 
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
  const [formData, setFormData] = useState<LiteraryProfileType>({
    full_name: initialData?.full_name || user?.full_name || '',
    pen_name: initialData?.pen_name || '',
    email: initialData?.email || user?.email || '',
    country: initialData?.country || '',
    city: initialData?.city || '',
    years_experience: initialData?.years_experience || '',
    primary_languages: initialData?.primary_languages || [] as string[],
    writing_forms: initialData?.writing_forms || [] as string[],
    areas_of_interest: initialData?.areas_of_interest || [] as string[],
    writing_sample_link: initialData?.writing_sample_link || '',
    short_bio: initialData?.short_bio || '',
    publication_intent: initialData?.publication_intent || '',
    acknowledge_editorial_control: initialData?.acknowledge_editorial_control || false,
    accept_framework: initialData?.accept_framework || false,
  });

  const [languageSearch, setLanguageSearch] = useState('');

  // ─── Computational Logic ───────────────────────────────────────────────────

  const readinessScore = useMemo(() => {
    let score = 0;
    const totalWeights = 5;

    // 1. Identity (Weight 1)
    if (formData.full_name && formData.email && formData.country) score += 1;
    // 2. Profile (Weight 1)
    if (formData.primary_languages.length > 0 && formData.writing_forms.length > 0) score += 1;
    // 3. Competence (Weight 1)
    if (formData.short_bio.length > 50 && formData.years_experience) score += 1;
    // 4. Sample & Intent (Weight 1)
    if (formData.writing_sample_link || formData.publication_intent.length > 50) score += 1;
    // 5. Governance (Weight 1)
    if (formData.acknowledge_editorial_control && formData.accept_framework) score += 1;

    return Math.min(100, Math.round((score / totalWeights) * 100));
  }, [formData]);

  const sections: SectionStatus[] = [
    { id: 1, label: 'Identity & Background', subtitle: 'Legal identity and contributor verification.', complete: !!(formData.full_name && formData.email && formData.country) },
    { id: 2, label: 'Literary & Linguistic Profile', subtitle: 'Languages and writing forms.', complete: !!(formData.primary_languages.length > 0 && formData.writing_forms.length > 0) },
    { id: 3, label: 'Writing & Editorial Competence', subtitle: 'Experience, bio, and areas of interest.', complete: formData.short_bio.length > 50 && !!formData.years_experience },
    { id: 4, label: 'Sample & Publication Intent', subtitle: 'Work samples and publication goals.', complete: !!(formData.writing_sample_link || formData.publication_intent.length > 50) },
    { id: 5, label: 'Governance Acknowledgment', subtitle: 'Institutional alignment and editorial control.', complete: formData.acknowledge_editorial_control && formData.accept_framework },
    { id: 6, label: 'Review & Submission', subtitle: 'Final review and authorization request.', complete: false }
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

  const handleFormToggle = (form: string) => {
    setFormData(prev => ({
      ...prev,
      writing_forms: prev.writing_forms.includes(form)
        ? prev.writing_forms.filter((f: string) => f !== form)
        : [...prev.writing_forms, form]
    }));
  };

  const handleInterestToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      areas_of_interest: prev.areas_of_interest.includes(id)
        ? prev.areas_of_interest.filter((t: string) => t !== id)
        : [...prev.areas_of_interest, id]
    }));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifySecurity()) return;
    setError(null);
    setLoading(true);

    try {
      const endpoint = ref ? `/api/literary/${ref}/revision?token=${token}` : '/api/literary/apply';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    return <LiteraryContributorSubmissionSuccessModal onClose={() => setSubmitted(false)} submissionId={submissionId} trackingToken={trackingToken} />;
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start relative px-3 sm:px-4 md:px-0 pb-24 md:pb-32">
      
      {/* ── LEFT SIDE: FORM FLOW ────────────────────────────────────────────── */}
      <div className="lg:col-span-8 space-y-3 md:space-y-4">
        <div className="mb-6 md:mb-12 border-l-4 border-amber-400 pl-4 md:pl-8 py-2">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4 tracking-tighter">Literary Contributor Application</h2>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-2xl font-light">
            Formal registry intake for literary contributors seeking structured consideration within the SufiPulse Literary Journal framework. All submissions are processed through the Majlis-e-Nazr.
          </p>
        </div>

        {/* SECTION 1: IDENTITY */}
        <SectionWrapper 
          id={1} 
          title="Identity & Background" 
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
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Pen Name (Optional)</label>
              <input 
                type="text" 
                value={formData.pen_name}
                onChange={e => setFormData({...formData, pen_name: e.target.value})}
                className="elite-input w-full"
                placeholder="Optional"
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
          </div>
          <StepActions step={1} onNext={() => setCurrentStep(2)} />
        </SectionWrapper>

        {/* SECTION 2: LITERARY & LINGUISTIC PROFILE */}
        <SectionWrapper 
          id={2} 
          title="Literary & Linguistic Profile" 
          subtitle="Languages and writing forms."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(2)}
          icon={<Languages size={18} />}
          isComplete={sections[1].complete}
        >
          <div className="space-y-10">
            {/* Language Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Literary Languages</label>
                <span className="text-[10px] text-neutral-500 italic">Select all that apply</span>
              </div>
              
              <div className="relative w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
                <input 
                  type="text"
                  value={languageSearch}
                  onChange={e => setLanguageSearch(e.target.value)}
                  placeholder="Search taxonomy (English, Urdu, Persian...)"
                  className="w-full rounded-2xl bg-black/40 border border-white/10 pl-16 pr-6 py-5 text-white placeholder:text-white/45 focus:border-amber-400 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.primary_languages.map((lang: string) => (
                  <button 
                    key={lang} 
                    onClick={() => handleLanguageToggle(lang)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-lg shadow-lg shadow-amber-400/10"
                  >
                    {lang} <X size={12} className="stroke-[3]" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5 text-left">
                {LANGUAGES_TAXONOMY.map(cat => (
                  <div key={cat.category} className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-2">{cat.category}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items
                        .filter(item => !formData.primary_languages.includes(item))
                        .filter(item => item.toLowerCase().includes(languageSearch.toLowerCase()))
                        .map(item => (
                        <button 
                          key={item} 
                          onClick={() => handleLanguageToggle(item)}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 text-[11px] text-neutral-400 rounded-md hover:border-amber-400/50 hover:text-white transition-all"
                        >
                          + {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Writing Forms */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Writing Forms</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WRITING_FORMS.map(form => {
                  const isActive = formData.writing_forms.includes(form);
                  return (
                    <label
                      key={form}
                      className={`flex w-full min-h-[72px] items-center justify-start gap-4 rounded-xl border px-6 py-5 cursor-pointer transition-all duration-300 group ${
                        isActive 
                          ? 'bg-amber-400/10 border-amber-400/50 text-amber-400' 
                          : 'bg-neutral-900 border-white/5 text-neutral-500 hover:border-white/20'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        className="h-5 w-5 shrink-0 accent-amber-400"
                        checked={isActive}
                        onChange={() => handleFormToggle(form)}
                      />
                      <span className="text-left text-sm font-semibold uppercase tracking-[0.18em] leading-relaxed">
                        {form}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <StepActions step={2} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />
        </SectionWrapper>

        {/* SECTION 3: WRITING & EDITORIAL COMPETENCE */}
        <SectionWrapper 
          id={3} 
          title="Writing & Editorial Competence" 
          subtitle="Experience, bio, and areas of interest."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(3)}
          icon={<Library size={18} />}
          isComplete={sections[2].complete}
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Years of Writing / Editorial Experience</label>
              <select 
                value={formData.years_experience}
                onChange={e => setFormData({...formData, years_experience: e.target.value})}
                className="elite-input w-full"
              >
                <option value="">Select experience level</option>
                <option value="0-2">0–2 Years</option>
                <option value="2-5">2–5 Years</option>
                <option value="5-10">5–10 Years</option>
                <option value="10+">10+ Years</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Areas of Interest</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AREAS_OF_INTEREST.map(theme => {
                  const isActive = formData.areas_of_interest.includes(theme.id);
                  return (
                    <label
                      key={theme.id}
                      className={`flex w-full min-h-[84px] items-center justify-start gap-4 rounded-xl border px-6 py-5 cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'bg-amber-400/5 border-amber-400/30 text-white' 
                          : 'bg-neutral-900/40 border-white/5 text-neutral-500 hover:border-white/10'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        className="h-5 w-5 shrink-0 accent-amber-400"
                        checked={isActive}
                        onChange={() => handleInterestToggle(theme.id)}
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-semibold tracking-tight leading-none mb-1.5 transition-colors ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                          {theme.label}
                        </p>
                        <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                          {theme.desc}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Short Bio</label>
              <textarea 
                value={formData.short_bio}
                onChange={e => setFormData({...formData, short_bio: e.target.value})}
                className="elite-input w-full h-32 p-4 text-sm leading-relaxed"
                placeholder="Brief overview of your literary background and philosophical orientation..."
              />
            </div>
          </div>
          <StepActions step={3} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
        </SectionWrapper>

        {/* SECTION 4: SAMPLE & INTENT */}
        <SectionWrapper 
          id={4} 
          title="Sample & Publication Intent" 
          subtitle="Work samples and publication goals."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(4)}
          icon={<PenTool size={18} />}
          isComplete={sections[3].complete}
        >
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Writing Sample Link</label>
              <input 
                type="url" 
                value={formData.writing_sample_link}
                onChange={e => setFormData({...formData, writing_sample_link: e.target.value})}
                className="elite-input w-full"
                placeholder="Link to published work, blog, or shared document"
              />
              <p className="text-[9px] text-neutral-600 uppercase tracking-widest ml-1 italic">Note: Link must be publicly accessible for editorial review.</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Publication Intent</label>
              <textarea 
                value={formData.publication_intent}
                onChange={e => setFormData({...formData, publication_intent: e.target.value})}
                className="elite-input w-full h-32 p-4 text-sm leading-relaxed"
                placeholder="What themes or topics do you intend to contribute to the Literary Journal?"
              />
            </div>
          </div>
          <StepActions step={4} onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} />
        </SectionWrapper>

        {/* SECTION 5: GOVERNANCE ACKNOWLEDGMENT */}
        <SectionWrapper 
          id={5} 
          title="Governance Acknowledgment" 
          subtitle="Institutional alignment and editorial control."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(5)}
          icon={<Scale size={18} />}
          isComplete={sections[4].complete}
        >
          <div className="space-y-6">
            <div className="grid gap-4 text-left">
              <GovernanceCard 
                label="Editorial Authority"
                desc="I acknowledge that all publication decisions remain under the absolute authority of the SufiPulse editorial board and the Majlis-e-Nazr."
                checked={formData.acknowledge_editorial_control}
                onChange={v => setFormData({...formData, acknowledge_editorial_control: v})}
              />

              <GovernanceCard 
                label="Institutional Framework"
                desc="I understand that Literary Contributors operate within a specific institutional framework independent of musical production and music release workflows."
                checked={formData.accept_framework}
                onChange={v => setFormData({...formData, accept_framework: v})}
              />
            </div>
          </div>
          <StepActions step={5} onNext={() => setCurrentStep(6)} onBack={() => setCurrentStep(4)} />
        </SectionWrapper>

        {/* SECTION 6: REVIEW & SUBMISSION */}
        <SectionWrapper 
          id={6} 
          title="Review & Submission" 
          subtitle="Final review and authorization request."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(6)}
          icon={<ShieldCheck size={18} />}
          isComplete={sections[5].complete}
        >
          <div className="space-y-8">
            <div className="p-8 bg-amber-400/5 border border-amber-400/10 rounded-2xl">
              <h4 className="text-sm font-black text-amber-400 uppercase tracking-widest mb-4">Application Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Ahl-e-Tahreer Identity</p>
                    <p className="text-white font-bold">{formData.full_name || '—'}</p>
                    <p className="text-neutral-500 text-xs">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Linguistic Base</p>
                    <p className="text-white text-xs font-bold uppercase tracking-wider">{formData.primary_languages.join(', ') || 'None selected'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Experience Level</p>
                    <p className="text-white text-xs font-bold uppercase tracking-wider">{formData.years_experience || '—'} Years</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Alignment Score</p>
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
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Security Protocol</p>
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
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Verified Human Contributor</span>
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
                Submit Ahl-e-Tahreer Application
              </button>
              
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] text-neutral-600 uppercase font-black tracking-[0.2em] text-center max-w-sm">
                  Literary Journal applications are independent of the Releases and music production pipeline.
                </p>
                {readinessScore < 70 && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">
                    Application requirements not met. Minimum 70% alignment required.
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

        {/* After Submission Flow */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5 text-left">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Publication Pathway</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-4 text-left">
              {[
                { label: 'Literary Submission', status: 'past' },
                { label: 'Editorial Review', status: 'current' },
                { label: 'Revision Cycle', status: 'pending' },
                { label: 'Journal Publication', status: 'pending' },
                { label: 'Archival Documentation', status: 'pending' }
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

        {/* Registry Workflow */}
        <div className="elite-card overflow-hidden">
          <div className="px-6 py-4 bg-white/[0.03] border-b border-white/5 text-left">
            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <History size={14} className="text-neutral-600" /> Institutional Workflow
            </h3>
          </div>
          <div className="p-6 space-y-6 text-left">
            {[
              { label: 'Submission', status: 'active' },
              { label: 'Editorial Screening', status: 'pending' },
              { label: 'Linguistic Review', status: 'pending' },
              { label: 'Governance Evaluation', status: 'pending' },
              { label: 'Journal Decision', status: 'pending' }
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
            <Shield size={14} className="text-amber-400" /> Structural Boundaries
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <p className="text-[9px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Literary contribution does not initiate musical production unless separately submitted under Ahl-e-Qalam.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <p className="text-[9px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Approved literary work may be considered for the Literary Journal, not the Releases system.
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
