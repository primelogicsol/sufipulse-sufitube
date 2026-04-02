import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, X, Shield, Globe, CreditCard, CirclePlay as PlayCircle, Settings, Music, RefreshCw, ChartBar as BarChart } from 'lucide-react';

interface AdoptTabProps {
  release: any;
}

export function AdoptTab({ release }: AdoptTabProps) {
  const { user, googleLogin } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [path, setPath] = useState<'A' | 'B' | null>(null);

  // Form State
  const [supportFocus, setSupportFocus] = useState('');
  const [budget, setBudget] = useState<number | 'custom' | null>(null);
  const [customBudget, setCustomBudget] = useState('');
  const [audienceCountry, setAudienceCountry] = useState('Global');
  const [audienceLanguage, setAudienceLanguage] = useState('All');
  
  // Fake account setup state
  const [setupProgress, setSetupProgress] = useState(0);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  // Auto skip sign-in step if already signed in
  useEffect(() => {
    if (step === 1 && user) {
        handleNext();
    }
  }, [step, user]);

  const startAccountSetup = () => {
    handleNext();
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setSetupProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => handleNext(), 800);
      }
    }, 500);
  };

  const getBudgetDisplay = () => {
      if (budget === 'custom') return `$${customBudget}`;
      return `$${budget}`;
  };

  const renderIntro = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h3 className="text-3xl font-serif font-light text-neutral-100 mb-4">Adopt This Song</h3>
        <p className="text-neutral-400 text-lg leading-relaxed mb-6">
          Help this kalam reach hearts that need it. Choose how you want to sponsor the spread of this piece.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => { 
            setPath('A'); 
            user ? setStep(2) : setStep(1); 
          }}
          className="flex flex-col text-left p-8 bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-xl transition-all group hover:bg-neutral-800/80"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <h4 className="text-2xl font-medium text-neutral-100 mb-3 group-hover:text-amber-400 transition-colors">Managed by SufiTube</h4>
          <p className="text-neutral-400 flex-1 mb-6">
            We handle everything. Choose your budget, and we'll run the ads from our managed accounts using best practices. The smoothest experience.
          </p>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Check className="w-4 h-4 text-green-500" /> Easiest setup
            <span className="mx-2">•</span>
            <Check className="w-4 h-4 text-green-500" /> Pay here
          </div>
        </button>

        <button
          onClick={() => { 
            setPath('B'); 
            user ? setStep(2) : setStep(1); 
          }}
          className="flex flex-col text-left p-8 bg-neutral-900 border border-neutral-800 hover:border-blue-500/50 rounded-xl transition-all group hover:bg-neutral-800/80"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
            <Settings className="w-6 h-6 text-blue-500" />
          </div>
          <h4 className="text-2xl font-medium text-neutral-100 mb-3 group-hover:text-blue-400 transition-colors">Use My Google Ads</h4>
          <p className="text-neutral-400 flex-1 mb-6">
            Connect your own Google Ads account. We will prefill the campaign and targeting for you, giving you full ownership of the campaign.
          </p>
          <div className="flex items-center gap-2 text-sm text-neutral-500 font-medium">
            <Check className="w-4 h-4 text-green-500" /> Full ownership
            <span className="mx-2">•</span>
            <Check className="w-4 h-4 text-green-500" /> Pay Google directly
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep1SignIn = () => (
    <div className="max-w-xl mx-auto text-center space-y-8 animate-in slide-in-from-right-8 duration-300">
      <h3 className="text-2xl font-medium text-neutral-100">Sign in to continue</h3>
      <p className="text-neutral-400">
        {path === 'A' 
          ? "We need your account to track your sponsorship." 
          : "Connect your Google account so we can set up your Google Ads client account."}
      </p>
      <button 
        onClick={async () => {
             // Mock Google login trigger or use the actual AuthContext method.
             // If user doesn't exist, we call it. Usually googleLogin redirects.
             try {
                await googleLogin();
                // If it resolves without redirecting (e.g. pop up) and sets user:
                // The useEffect will catch the user state change and auto-advance.
             } catch (e) {
                console.error(e);
             }
             handleNext();
        }}
        className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-5 h-5" />
        Continue with Google
      </button>
      <button onClick={handleBack} className="block w-full text-neutral-500 hover:text-neutral-300 text-sm mt-8 transition-colors">Back</button>
    </div>
  );

  const renderStep2Focus = () => (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
      <h3 className="text-2xl font-medium text-neutral-100 mb-6 text-center">Choose Support Focus</h3>
      <div className="space-y-4">
        {[
          { id: 'song', label: 'Promote this song', desc: `Direct focus to "${release?.release_title || 'this release'}"` },
          { id: 'channel', label: 'Promote the channel', desc: 'Raise awareness for SufiTube broadly' },
          { id: 'playlist', label: 'Promote a playlist', desc: 'Feature a curated collection of similar kalams' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setSupportFocus(item.id); handleNext(); }}
            className={`w-full flex items-center justify-between p-5 rounded-xl border transition-all ${supportFocus === item.id ? 'bg-neutral-800 border-amber-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800'}`}
          >
            <div className="text-left">
              <div className="font-medium text-lg mb-1">{item.label}</div>
              <div className="text-sm text-neutral-500">{item.desc}</div>
            </div>
            <ArrowRight className={`w-5 h-5 ${supportFocus === item.id ? 'text-amber-500' : 'text-neutral-600'}`} />
          </button>
        ))}
      </div>
      <button onClick={handleBack} className="block w-full text-center text-neutral-500 hover:text-neutral-300 text-sm mt-8">Back</button>
    </div>
  );

  const renderStep3Budget = () => (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
      <h3 className="text-2xl font-medium text-neutral-100 mb-2 text-center">Choose Budget</h3>
      <p className="text-neutral-400 text-center mb-8">Even small contributions make a significant quiet impact.</p>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[25, 50, 100].map(amt => (
          <button
            key={amt}
            onClick={() => setBudget(amt)}
            className={`py-4 rounded-xl border text-xl font-medium transition-all ${budget === amt ? 'bg-neutral-800 border-amber-500 text-amber-500' : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'}`}
          >
            ${amt}
          </button>
        ))}
        <button
            onClick={() => setBudget('custom')}
            className={`py-4 rounded-xl border text-xl font-medium transition-all ${budget === 'custom' ? 'bg-neutral-800 border-amber-500 text-amber-500' : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'}`}
        >
          Custom
        </button>
      </div>

      {budget === 'custom' && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4">
          <label className="block text-sm text-neutral-400 mb-2">Custom Amount ($)</label>
          <input 
            type="number" 
            value={customBudget} 
            onChange={e => setCustomBudget(e.target.value)} 
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
            placeholder="e.g. 500"
          />
        </div>
      )}

      <button 
        onClick={handleNext}
        disabled={!budget || (budget === 'custom' && !customBudget)}
        className="w-full py-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
      >
        Continue
      </button>
      <button onClick={handleBack} className="block w-full text-center text-neutral-500 hover:text-neutral-300 text-sm mt-6">Back</button>
    </div>
  );

  const renderStep4Audience = () => (
    <div className="max-w-xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-300">
      <h3 className="text-2xl font-medium text-neutral-100 mb-6 text-center">Choose Audience</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Target Countries</label>
          <select value={audienceCountry} onChange={e => setAudienceCountry(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none">
            <option>Global (Worldwide)</option>
            <option>South Asia (India, Pakistan, Bangladesh)</option>
            <option>Middle East (UAE, KSA, Turkey)</option>
            <option>Western (USA, UK, Canada)</option>
            <option>Diaspora Focus</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Language Preference</label>
          <select value={audienceLanguage} onChange={e => setAudienceLanguage(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500 appearance-none">
            <option>All Relevant Languages</option>
            <option>Urdu / Hindi focus</option>
            <option>Arabic focus</option>
            <option>English speakers</option>
          </select>
        </div>
      </div>

      <button 
        onClick={path === 'B' ? startAccountSetup : handleNext}
        className="w-full py-4 mt-8 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors"
      >
        Continue
      </button>
      <button onClick={handleBack} className="block w-full text-center text-neutral-500 hover:text-neutral-300 text-sm mt-6">Back</button>
    </div>
  );

  const renderStep5AccountSetup = () => (
    <div className="max-w-xl mx-auto text-center space-y-8 animate-in fade-in duration-300">
      <div className="w-20 h-20 mx-auto rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center relative overflow-hidden">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <div className="absolute bottom-0 left-0 right-0 bg-amber-500/20" style={{ height: `${setupProgress}%`, transition: 'height 0.3s ease' }}></div>
      </div>
      
      <div>
        <h3 className="text-xl font-medium text-neutral-100 mb-2">Setting up your Google Ads account</h3>
        <p className="text-neutral-400 text-sm mb-6">Orchestrating manager client hierarchy and pushing campaign drafts...</p>
      </div>

      <div className="space-y-3 max-w-sm mx-auto text-left text-sm text-neutral-500">
        <div className="flex items-center gap-3">
            <Check className={`w-4 h-4 ${setupProgress >= 20 ? 'text-green-500' : 'text-neutral-700'}`} />
            <span className={setupProgress >= 20 ? 'text-neutral-300' : ''}>Locating or creating client account</span>
        </div>
        <div className="flex items-center gap-3">
            <Check className={`w-4 h-4 ${setupProgress >= 40 ? 'text-green-500' : 'text-neutral-700'}`} />
            <span className={setupProgress >= 40 ? 'text-neutral-300' : ''}>Prefilling currency and permanent timezone</span>
        </div>
        <div className="flex items-center gap-3">
            <Check className={`w-4 h-4 ${setupProgress >= 60 ? 'text-green-500' : 'text-neutral-700'}`} />
            <span className={setupProgress >= 60 ? 'text-neutral-300' : ''}>Building campaign draft and ad groups</span>
        </div>
        <div className="flex items-center gap-3">
            <Check className={`w-4 h-4 ${setupProgress >= 80 ? 'text-green-500' : 'text-neutral-700'}`} />
            <span className={setupProgress >= 80 ? 'text-neutral-300' : ''}>Uploading creative asset set</span>
        </div>
      </div>
    </div>
  );

  const renderStep6Review = () => (
    <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-300">
      <h3 className="text-2xl font-medium text-neutral-100 mb-6 text-center">Review Campaign</h3>
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
        <div>
            <div className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Target Video</div>
            <div className="text-neutral-200 font-medium flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-500" />
                {release?.release_title || 'Current Release'}
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
            <div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Focus</div>
                <div className="text-neutral-200 capitalize">{supportFocus}</div>
            </div>
            <div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Budget</div>
                <div className="text-neutral-200 font-medium text-lg text-amber-500">{getBudgetDisplay()}</div>
            </div>
            <div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Geography</div>
                <div className="text-neutral-200">{audienceCountry}</div>
            </div>
            <div>
                <div className="text-sm text-neutral-500 uppercase tracking-wider mb-1">Language</div>
                <div className="text-neutral-200">{audienceLanguage}</div>
            </div>
        </div>

        {path === 'B' && (
             <div className="pt-4 border-t border-neutral-800">
                 <div className="text-sm text-neutral-500 uppercase tracking-wider mb-2">Google Ads Account</div>
                 <div className="flex items-center justify-between bg-black/50 px-4 py-3 rounded-lg border border-neutral-800">
                     <span className="text-neutral-300">SufiPulse Client #784-912</span>
                     <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Created</span>
                 </div>
             </div>
        )}
      </div>

      <div className="bg-blue-900/10 border border-blue-900/50 rounded-lg p-4 flex items-start gap-4">
        <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-200/80 leading-relaxed">
            {path === 'A' 
               ? "Next, you will complete the payment securely on our platform. We will manage the campaign for you."
               : "Next, you will be handed off to Google to add your payment method to the generated account, finalizing the process."}
        </p>
      </div>

      <button 
        onClick={() => {
            // Mocking the completion of payment
            let btn = document.getElementById('billing-btn');
            if (btn) btn.innerText = "Processing...";
            setTimeout(() => {
                handleNext();
            }, 1500);
        }}
        id="billing-btn"
        className="w-full py-4 mt-8 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" /> Proceed to Billing
      </button>

      <button onClick={() => setStep(path === 'B' ? 4 : 4)} className="block w-full text-center text-neutral-500 hover:text-neutral-300 text-sm mt-6">Edit settings</button>
    </div>
  );

  const renderStep7Billing = () => (
    <div className="max-w-xl mx-auto text-center space-y-8 animate-in fade-in duration-300">
      <div className="w-24 h-24 mx-auto bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center">
          <Globe className="w-10 h-10 text-neutral-400" />
      </div>
      <div>
          <h3 className="text-2xl font-medium text-neutral-100 mb-4">
              {path === 'A' ? "Secure Payment" : "Handoff to Google"}
          </h3>
          <p className="text-neutral-400 leading-relaxed mx-auto max-w-sm mb-8">
              {path === 'A' 
                ? "Please complete your payment to fund the campaign. We will activate the ads immediately upon success."
                : "Your campaign is perfectly primed. Add your payment card in the Google billing console to enable delivery."}
          </p>
          <button 
                onClick={() => {
                    const btn = document.getElementById('final-pay-btn');
                    if (btn) btn.innerText = "Authorizing...";
                    setTimeout(() => {
                        handleNext();
                    }, 2000);
                }}
                id="final-pay-btn"
                className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-medium rounded-xl transition-colors shadow-xl"
            >
            {path === 'A' ? "Pay " + getBudgetDisplay() : "Open Google Billing"}
            </button>
      </div>
      <button onClick={handleBack} className="block w-full text-center text-neutral-500 hover:text-neutral-300 text-sm mt-6">Cancel</button>

    </div>
  );

  const renderStep8Launch = () => (
    <div className="max-w-xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 mx-auto bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-8">
          <Check className="w-10 h-10 text-green-500" />
      </div>
      <h3 className="text-3xl font-serif font-light text-neutral-100 mb-2">Campaign Ready</h3>
      <p className="text-neutral-400 leading-relaxed mb-8">
          May your contribution bring ease and contemplation to whoever discovers this kalam. The campaign status is now registered.
      </p>
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left mb-8">
          <div className="flex items-center gap-3 mb-4">
              <BarChart className="w-5 h-5 text-neutral-400" />
              <div className="font-medium text-neutral-200">Live Status Overview</div>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
              <span className="text-neutral-500 text-sm">Status</span>
              <span className="text-green-400 text-sm font-medium bg-green-900/40 px-2 py-0.5 rounded">Active / Reviewing</span>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
              <span className="text-neutral-500 text-sm">Reach Estimate</span>
              <span className="text-neutral-300 text-sm font-medium">~{budget === 'custom' ? parseInt(customBudget) * 45 : (budget as number) * 45} views</span>
          </div>
          <div className="flex items-center justify-between">
              <span className="text-neutral-500 text-sm">Provider</span>
              <span className="text-neutral-300 text-sm font-medium">SufiPulse Orchestration Engine</span>
          </div>
      </div>

      <button 
        onClick={() => { setStep(0); setPath(null); }}
        className="text-neutral-400 hover:text-white transition-colors text-sm"
      >
        Return to Overview
      </button>
    </div>
  );

  return (
    <div className="pt-8 min-h-[500px]">
      <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 sm:p-12 relative overflow-hidden">
        {step > 0 && step < 8 && (
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
                <div className="text-sm font-medium text-neutral-500">
                    Step {step} <span className="text-neutral-700">of 7</span>
                </div>
                <button onClick={() => { setStep(0); setPath(null); }} className="text-neutral-500 hover:text-white transition-colors p-2">
                    <X className="w-5 h-5"/>
                </button>
            </div>
        )}

        {step > 0 && step < 8 && <div className="h-12"></div>}

        {step === 0 && renderIntro()}
        {step === 1 && renderStep1SignIn()}
        {step === 2 && renderStep2Focus()}
        {step === 3 && renderStep3Budget()}
        {step === 4 && renderStep4Audience()}
        {step === 5 && renderStep5AccountSetup()}
        {step === 6 && renderStep6Review()}
        {step === 7 && renderStep7Billing()}
        {step === 8 && renderStep8Launch()}
        
      </div>
    </div>
  );
}
