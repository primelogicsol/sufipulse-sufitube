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
  Feather, 
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
  CheckCircle2
} from 'lucide-react';
import { Card } from '../primitives/Card';
import { useAuth } from '../../contexts/AuthContext';
import { useFormSecurity } from '@/app/hooks/useFormSecurity';
import { WriterSubmissionSuccessModal } from './WriterSubmissionSuccessModal';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Constants & Taxonomy ────────────────────────────────────────────────────

const LANGUAGES_TAXONOMY = [
  { category: 'Primary', items: ['Urdu', 'Persian', 'Punjabi', 'Kashmiri', 'Arabic'] },
  { category: 'Regional & Classical', items: ['Sindhi', 'Pashto', 'Seraiki', 'Braj Bhasha', 'Old Awadhi'] },
  { category: 'Global', items: ['English', 'Turkish', 'French', 'Spanish'] }
];

const FORMS_TAXONOMY = [
  'Ghazal', 'Nazm', 'Hamd', 'Naat', 'Manqabat', 'Kafi', 'Masnavi', 'Rubai', 'Marsiya', 'Qasida', 'Musaddas'
];

const THEMES_FRAMEWORK = [
  { id: 'sacred-longing', label: 'Sacred Longing', desc: 'Expressions of Ishq-e-Ilahi' },
  { id: 'devotional', label: 'Devotional Poetry', labelAr: 'Hamd/Naat/Manqabat' },
  { id: 'mystical-meta', label: 'Mystical Metaphysics', desc: 'Wahdat-ul-Wajood / Wajoodi concepts' },
  { id: 'inner-trans', label: 'Inner Transformation', desc: 'Nafs, Qalb, and spiritual alchemy' },
  { id: 'classical-sufi', label: 'Classical Sufi Tradition', desc: 'Alignment with Chishti/Qadri/Naqshbandi/Suhrawardi ethos' },
  { id: 'ecological', label: 'Ecological Spirituality', desc: 'Nature as divine manifestation' },
  { id: 'philosophical', label: 'Philosophical Inquiry', desc: 'Rationality within a sacred framework' }
];

const REVIEW_TIMELINE = [
  { stage: 'Registry Validation', duration: '1–3 days', desc: 'Authentication and metadata verification' },
  { stage: 'Editorial Screening', duration: '3–7 days', desc: 'Initial thematic and institutional review' },
  { stage: 'Linguistic Review', duration: '5–10 days', desc: 'Assessment of literary coherence and structure' },
  { stage: 'Governance Evaluation', duration: '2–5 days', desc: 'Alignment review under Majlis-e-Nazr' },
  { stage: 'Registry Decision', duration: 'Final notice', desc: 'Formal institutional authorization' }
];

const WORKFLOW_DEFINITIONS: Record<string, string> = {
  'Submission': 'Initial record entry into the Ahl-e-Qalam intake registry.',
  'Editorial Screening': 'Thematic evaluation of submitted literary material.',
  'Linguistic Review': 'Deep assessment of linguistic quality and structural suitability.',
  'Governance Evaluation': 'Institutional alignment review under Majlis-e-Nazr oversight.',
  'Registry Decision': 'Formal determination of eligibility and dashboard activation.'
};

const EXPECTATIONS = [
  { icon: <MessageSquare size={14} />, label: 'Editorial Revision Requests' },
  { icon: <FileText size={14} />, label: 'Requests for Additional Kalam' },
  { icon: <Languages size={14} />, label: 'Linguistic Clarification' },
  { icon: <Shield size={14} />, label: 'Governance Verification Notices' },
  { icon: <History size={14} />, label: 'Registry Status Notifications' }
];

const OUTCOMES = [
  { 
    status: 'Approved', 
    color: 'emerald', 
    benefits: ['Registry Activation', 'Dashboard Access', 'Contributor ID', 'Production Eligibility'] 
  },
  { 
    status: 'Revision', 
    color: 'orange', 
    note: 'Opportunity to refine and resubmit work based on editorial feedback.' 
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

export default function WriterCredentialsForm({ 
  onSuccess, 
  initialData 
}: { 
  onSuccess?: (submissionId: string) => void,
  initialData?: any
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const ref = searchParams?.get('ref');
  const token = searchParams?.get('token');
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { botCheck, setBotCheck, verifySecurity } = useFormSecurity();
  const [notABot, setNotABot] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: initialData?.fullName || user?.full_name || '',
    pen_name: initialData?.penName || '',
    email: initialData?.email || user?.email || '',
    country: initialData?.country || '',
    city: initialData?.city || '',
    primary_languages: initialData?.primaryLanguages || [] as string[],
    writing_styles: initialData?.writingStyles || [] as string[],
    selected_themes: [] as string[], // We will parse this if needed or leave for manual re-selection
    additional_themes: initialData?.thematicFocus || '',
    literary_background: initialData?.literaryBackground || '',
    sample_kalam: initialData?.sampleKalam || '',
    previous_publications: '',
    revision_acknowledged: false,
    institutional_acknowledged: false,
  });

  const [languageSearch, setLanguageSearch] = useState('');

  // ─── Computational Logic ───────────────────────────────────────────────────

  const kalamMetrics = useMemo(() => {
    const text = formData.sample_kalam.trim();
    if (!text) return { words: 0, stanzas: 0, readingTime: 0 };
    
    const words = text.split(/\s+/).length;
    // Basic stanza detection (double newlines)
    const stanzas = text.split(/\n\s*\n/).filter(s => s.trim().length > 0).length;
    const readingTime = Math.ceil(words / 150); // ~150 words per minute for poetry

    return { words, stanzas, readingTime };
  }, [formData.sample_kalam]);

  const readinessScore = useMemo(() => {
    let score = 0;
    const totalWeights = 5;

    // 1. Identity (Weight 1)
    if (formData.full_name && formData.email && formData.country) score += 1;
    // 2. Profile (Weight 1)
    if (formData.primary_languages.length > 0 && formData.writing_styles.length > 0) score += 1;
    // 3. Sample (Weight 1.5)
    if (formData.sample_kalam.length > 200) score += 1.5;
    // 4. Themes (Weight 0.5)
    if (formData.selected_themes.length > 0) score += 0.5;
    // 5. Governance (Weight 1)
    if (formData.revision_acknowledged && formData.institutional_acknowledged) score += 1;

    return Math.min(100, Math.round((score / totalWeights) * 100));
  }, [formData]);

  const sections: SectionStatus[] = [
    { id: 1, label: 'Registry Identity', subtitle: 'Legal identity and contributor verification.', complete: !!(formData.full_name && formData.email && formData.country) },
    { id: 2, label: 'Literary & Linguistic Profile', subtitle: 'Languages, literary forms, and thematic orientation.', complete: !!(formData.primary_languages.length > 0 && formData.writing_styles.length > 0) },
    { id: 3, label: 'Intelligent Writing Environment', subtitle: 'Sacred kalam submission and linguistic analysis.', complete: formData.sample_kalam.length > 100 },
    { id: 4, label: 'Institutional Covenant', subtitle: 'Governance alignment and editorial acknowledgments.', complete: formData.revision_acknowledged && formData.institutional_acknowledged },
    { id: 5, label: 'Registry Finalization', subtitle: 'Final review and institutional authorization request.', complete: false }
  ];

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      primary_languages: prev.primary_languages.includes(lang)
        ? prev.primary_languages.filter(l => l !== lang)
        : [...prev.primary_languages, lang]
    }));
  };

  const handleFormToggle = (form: string) => {
    setFormData(prev => ({
      ...prev,
      writing_styles: prev.writing_styles.includes(form)
        ? prev.writing_styles.filter(f => f !== form)
        : [...prev.writing_styles, form]
    }));
  };

  const handleThemeToggle = (themeId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_themes: prev.selected_themes.includes(themeId)
        ? prev.selected_themes.filter(t => t !== themeId)
        : [...prev.selected_themes, themeId]
    }));
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifySecurity()) return;
    setError(null);
    setLoading(true);

    try {
      const endpoint = ref ? `/api/writers/${ref}/revision?token=${token}` : '/api/writers/apply';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          thematic_focus: `Selected: ${formData.selected_themes.join(', ')}. Additional: ${formData.additional_themes}`
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
      setSubmissionId(refId);
      setSubmitted(true);
      if (onSuccess) onSuccess(refId);
    } catch (err: any) {
      setError(err.message || 'An institutional error occurred during intake.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return <WriterSubmissionSuccessModal onClose={() => setSubmitted(false)} submissionId={submissionId} />;
  }

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative px-4 md:px-0 pb-32">
      
      {/* ── LEFT SIDE: FORM FLOW ────────────────────────────────────────────── */}
      <div className="lg:col-span-8 space-y-4">
        <div className="mb-12 border-l-4 border-amber-400 pl-8 py-2">
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tighter">Institutional Editorial Intake</h2>
          <p className="text-neutral-400 text-base leading-relaxed max-w-2xl font-light">
            Formal registry intake for writers seeking structured consideration within the SufiPulse literary and production framework. All submissions are processed through the Majlis-e-Nazr.
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
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Pen Name / Takhallus</label>
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

        {/* SECTION 2: LITERARY PROFILE */}
        <SectionWrapper 
          id={2} 
          title="Literary & Linguistic Profile" 
          subtitle="Languages, literary forms, and thematic orientation."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(2)}
          icon={<Languages size={18} />}
          isComplete={sections[1].complete}
        >
          <div className="space-y-10">
            {/* Intelligent Language Selector */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Literary Languages</label>
                <span className="text-[10px] text-neutral-500 italic">Select all that apply</span>
              </div>
              
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-amber-400 transition-colors" />
                <input 
                  type="text"
                  value={languageSearch}
                  onChange={e => setLanguageSearch(e.target.value)}
                  placeholder="Search taxonomy (Urdu, Persian, Kashmiri...)"
                  className="elite-input w-full pl-12 h-14"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.primary_languages.map(lang => (
                  <button 
                    key={lang} 
                    onClick={() => handleLanguageToggle(lang)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-black text-xs font-bold rounded-lg shadow-lg shadow-amber-400/10"
                  >
                    {lang} <X size={12} className="stroke-[3]" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
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

            {/* Expandable Taxonomy Selector for Forms */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Literary Forms & Styles</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {FORMS_TAXONOMY.map(form => {
                  const isActive = formData.writing_styles.includes(form);
                  return (
                    <button
                      key={form}
                      onClick={() => handleFormToggle(form)}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 group ${
                        isActive 
                          ? 'bg-amber-400/10 border-amber-400/50 text-amber-400' 
                          : 'bg-neutral-900 border-white/5 text-neutral-500 hover:border-white/20'
                      }`}
                    >
                      {isActive && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                      <Feather size={16} className={`mb-2 ${isActive ? 'text-amber-400' : 'text-neutral-700 group-hover:text-neutral-500'}`} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{form}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Guided Thematic Framework */}
            <div className="space-y-8 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-amber-400" />
                <label className="text-[11px] font-black uppercase tracking-widest text-neutral-400">Guided Thematic Framework</label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {THEMES_FRAMEWORK.map(theme => {
                  const isActive = formData.selected_themes.includes(theme.id);
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeToggle(theme.id)}
                      className={`flex items-start text-left p-5 rounded-2xl border transition-all duration-500 min-h-[100px] ${
                        isActive 
                          ? 'bg-amber-400/5 border-amber-400/30' 
                          : 'bg-neutral-900/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
                        isActive ? 'bg-amber-400 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]' : 'border-neutral-800 bg-[#0a0a0a]'
                      }`}>
                        {isActive && <Check size={12} className="text-black stroke-[4]" />}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className={`text-sm font-semibold tracking-tight leading-none mb-1.5 transition-colors ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                          {theme.label}
                        </p>
                        <div className="space-y-1">
                          {theme.labelAr && <p className="text-[10px] text-amber-400/60 font-arabic tracking-wide">{theme.labelAr}</p>}
                          <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                            {theme.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Structured Editorial Reflection Area */}
              <div className="space-y-4 mt-10 pt-8 border-t border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight mb-1">Additional Conceptual Orientation</h4>
                  <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                    Optional contextual notes regarding literary philosophy, devotional orientation, thematic continuity, or conceptual influences.
                  </p>
                </div>
                <textarea 
                  value={formData.additional_themes}
                  onChange={e => setFormData({...formData, additional_themes: e.target.value})}
                  className="elite-input w-full h-32 p-4 text-sm leading-relaxed"
                  placeholder="Define your literary orientation within our institutional framework..."
                />
              </div>
            </div>
          </div>
          <StepActions step={2} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />
        </SectionWrapper>

        {/* SECTION 3: SAMPLE KALAM */}
        <SectionWrapper 
          id={3} 
          title="Intelligent Writing Environment" 
          subtitle="Sacred kalam submission and linguistic analysis."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(3)}
          icon={<PenTool size={18} />}
          isComplete={sections[2].complete}
        >
          <div className="space-y-6">
            <div className="bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden shadow-inner">
              {/* Toolbar Metrics */}
              <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Hash size={12} className="text-neutral-600" />
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Words: <span className="text-white">{kalamMetrics.words}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={12} className="text-neutral-600" />
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Stanzas: <span className="text-white">{kalamMetrics.stanzas}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-neutral-600" />
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Est. Reading: <span className="text-white">{kalamMetrics.readingTime} min</span></span>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
                    <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-widest">Draft Autosaved</span>
                  </div>
                </div>
              </div>

              <textarea 
                required
                value={formData.sample_kalam}
                onChange={e => setFormData({...formData, sample_kalam: e.target.value})}
                className="w-full bg-transparent p-8 md:p-12 text-lg md:text-xl text-white font-mono min-h-[500px] outline-none leading-[2] placeholder:text-neutral-800 placeholder:italic"
                placeholder="Write or paste your sacred kalam here... \n\nFocus on structural flow and linguistic precision."
              />
              
              <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5">
                <div className="flex items-start gap-4">
                  <Info size={16} className="text-neutral-700 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-neutral-600 leading-relaxed uppercase tracking-wider italic">
                    Note: Formatting guidance suggests maintaining consistent stanza lengths for potential vocal assignment in later production stages.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Previous Publications / Context</label>
              <textarea 
                value={formData.previous_publications}
                onChange={e => setFormData({...formData, previous_publications: e.target.value})}
                className="elite-input w-full h-24 p-4"
                placeholder="Mention where your work has been previously featured or provides context for the board."
              />
            </div>
          </div>
          <StepActions step={3} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
        </SectionWrapper>

        {/* SECTION 4: GOVERNANCE */}
        <SectionWrapper 
          id={4} 
          title="Institutional Covenant" 
          subtitle="Governance alignment and editorial acknowledgments."
          activeStep={currentStep} 
          onTitleClick={() => setCurrentStep(4)}
          icon={<Scale size={18} />}
          isComplete={sections[3].complete}
        >
          <div className="space-y-6">
            <div className="grid gap-4">
              <GovernanceCard 
                label="Editorial Review process"
                desc="I acknowledge that my submission will undergo a rigorous evaluation by the Majlis-e-Nazr and I am willing to provide revisions if requested for linguistic or thematic alignment."
                checked={formData.revision_acknowledged}
                onChange={v => setFormData({...formData, revision_acknowledged: v})}
              />

              <GovernanceCard 
                label="Institutional Discretion"
                desc="I understand that submission does not constitute a commitment for production, vocalist assignment, or publication, and SufiPulse maintains absolute institutional discretion over the registry."
                checked={formData.institutional_acknowledged}
                onChange={v => setFormData({...formData, institutional_acknowledged: v})}
              />
            </div>

            {/* Advanced Security Verification */}
            <div className="pt-8 mt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-neutral-600" />
                <div>
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
          </div>
          <StepActions step={4} onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} />
        </SectionWrapper>

        {/* SECTION 5: REVIEW & SUBMIT */}
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
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Ahl-e-Qalam Identity</p>
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
                    <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest">Sample Metrics</p>
                    <p className="text-white text-xs font-bold">{kalamMetrics.words} Words · {kalamMetrics.stanzas} Stanzas</p>
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
                      Monitor review progression, editorial requests, and registry decisions in real-time.
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
                className="w-full py-5 bg-linear-to-r from-amber-400 to-amber-500 text-neutral-950 font-black rounded-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed uppercase text-sm tracking-[0.3em] flex items-center justify-center gap-4 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />}
                Enter Editorial Consideration
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

        {/* WRITER BENEFITS & INSTITUTIONAL VALUE */}
        <div className="relative pl-12 pt-16">
          {/* Workflow Continuity Line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-neutral-800" />
          
          {/* Activation Node */}
          <div className="absolute left-0 top-16 w-8 h-8 rounded-full border-2 border-amber-400/30 bg-[#0a0a0a] z-10 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.1)]">
            <Sparkles size={14} className="text-amber-400" />
          </div>
          
          <div className="elite-card overflow-hidden">
            <div className="p-10 space-y-10">
              <div className="border-l-2 border-amber-400/40 pl-6">
                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">Writer Benefits & Institutional Value</h3>
                <p className="text-sm text-neutral-500 font-medium">If approved, Ahl-e-Qalam contributors may receive:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {[
                  { b: 'Contributor Registry Activation', m: 'Formal recognition inside the SufiPulse writer registry' },
                  { b: 'Writer Dashboard Access', m: 'Ability to monitor submissions, revisions, assignments, and status' },
                  { b: 'Editorial Collaboration', m: 'Structured feedback from Majlis-e-Nazr / editorial review' },
                  { b: 'Production Consideration', m: 'Approved kalam may become eligible for vocalist and production workflow' },
                  { b: 'Release Attribution', m: 'Writer credit may appear on approved public releases' },
                  { b: 'Royalty Eligibility', m: 'Eligible works may enter royalty tracking where revenue applies' },
                  { b: 'Marketing Visibility', m: 'Approved works may be featured through SufiPulse releases, pages, and media' },
                  { b: 'Institutional Archive', m: 'Approved works remain part of the protected SufiPulse literary archive' },
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
                    Institutional Disclaimer: Benefits depend on approval status, editorial decision, production selection, release authorization, and applicable revenue activity. Approval as a writer does not guarantee production, publication, marketing campaign placement, or royalty income.
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
                { label: 'Review Monitoring', status: 'pending' }
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
              { label: 'Editorial Screening', status: 'pending' },
              { label: 'Linguistic Review', status: 'pending' },
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
        .elite-card {
          background: rgba(18, 18, 18, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.4),
            inset 0 1px 1px rgba(255,255,255,0.02);
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
    <div className={`relative pl-12 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
      {/* Progression Rail */}
      <div className={`absolute left-[15px] top-0 bottom-0 w-px ${isActive || isPast ? 'bg-amber-400/30' : 'bg-neutral-800'}`} />
      
      {/* Step Node */}
      <div className={`absolute left-0 top-6 w-8 h-8 rounded-full border-2 z-10 flex items-center justify-center transition-all duration-500 ${
        isActive ? 'bg-amber-400 border-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : 
        isPast ? 'bg-emerald-500 border-emerald-500 text-black' : 
        'bg-[#0a0a0a] border-neutral-800 text-neutral-600'
      }`}>
        {isPast ? <Check size={14} className="stroke-[4]" /> : <span className="text-[10px] font-black">{id}</span>}
      </div>

      <div className={`elite-card overflow-hidden transition-all duration-500 ${
        isActive ? 'ring-1 ring-amber-400/10 shadow-2xl translate-x-2' : 'hover:border-white/10'
      }`}>
        <button 
          onClick={onTitleClick}
          className={`w-full flex items-start justify-between px-8 py-6 text-left transition-colors ${isActive ? 'bg-white/[0.02]' : ''}`}
        >
          <div className="flex-1 pr-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 mb-1.5 leading-none">PHASE 0{id}</p>
            <h3 className={`text-xl font-bold tracking-tight mb-1 transition-colors ${isActive ? 'text-white' : 'text-neutral-400'}`}>{title}</h3>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">{subtitle}</p>
          </div>
          
          <div className="flex flex-col items-end gap-3 shrink-0 pt-1">
            {isComplete ? (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                Completed <Check size={10} className="stroke-[4]" />
              </span>
            ) : isActive ? (
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/80 animate-pulse">In Progress</span>
            ) : null}
            {isActive ? <ChevronDown size={18} className="text-neutral-600" /> : <ChevronRight size={18} className="text-neutral-800" />}
          </div>
        </button>
        
        {isActive && (
          <div className="p-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-500 border-t border-white/[0.03]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function StepActions({ step, onNext, onBack }: { step: number; onNext?: () => void; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-4 mt-10 pt-8 border-t border-white/5">
      {onBack && (
        <button 
          onClick={onBack}
          className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
        >
          ← Back
        </button>
      )}
      {onNext && (
        <button 
          onClick={onNext}
          className="px-8 py-3.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 hover:border-amber-400/30 transition-all ml-auto flex items-center gap-2 group"
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
      className={`flex items-start text-left p-6 rounded-2xl border transition-all duration-300 ${
        checked 
          ? 'bg-amber-400/5 border-amber-400/30' 
          : 'bg-neutral-950/50 border-white/5 hover:border-white/10'
      }`}
    >
      <div className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center transition-all shrink-0 ${
        checked ? 'bg-amber-400 border-amber-400 shadow-lg shadow-amber-400/20' : 'border-neutral-800 bg-neutral-900'
      }`}>
        {checked && <Check size={14} className="text-black stroke-[4]" />}
      </div>
      <div className="ml-6">
        <p className={`text-xs font-black uppercase tracking-widest mb-2 ${checked ? 'text-amber-400' : 'text-neutral-500'}`}>{label}</p>
        <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </button>
  );
}
