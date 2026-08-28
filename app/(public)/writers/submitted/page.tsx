"use client";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { PrimaryButton } from '../../../components/primitives/PrimaryButton';
import { CheckCircle2, Clock, ArrowRight, ShieldCheck, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

function SubmittedContent() {
  const searchParams = useSearchParams();
  const referenceId = searchParams?.get('ref') || 'PENDING';
  const token = searchParams?.get('token');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section background="midnight" spacing="spacious">
      <PageContainer>
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>

          <Badge variant="gold" className="mb-4">Intake Registry</Badge>
          <h1 className="text-4xl font-bold text-white mb-6">
            Submission Received
          </h1>
          
          <p className="text-lg text-neutral-400 mb-12">
            Your Writer Intake submission has been formally received and queued for editorial screening by the Majlis-e-Nazr.
          </p>

          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-8 mb-10 text-left">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Reference ID</p>
              <button 
                onClick={handleCopy}
                className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy ID'}
              </button>
            </div>
            <p className="text-2xl font-mono text-amber-400 tracking-wider mb-8">
              {referenceId}
            </p>

            <div className="flex items-center gap-4 p-4 bg-amber-400/5 border border-amber-400/10 rounded-xl">
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-0.5">Current Status</p>
                <p className="text-sm text-white font-medium">Pending Editorial Review</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Link href={token ? `/applications/${referenceId}?token=${token}` : `/applications/${referenceId}`} className="w-full">
              <PrimaryButton className="w-full py-4 flex items-center justify-center gap-2 group">
                Track Application Status
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </PrimaryButton>
            </Link>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Link href="/writers">
                <button className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border border-white/5">
                  Return to Writers
                </button>
              </Link>
              <Link href="/governance">
                <button className="w-full py-3 px-6 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-colors border border-white/5">
                  Governance
                </button>
              </Link>
            </div>
          </div>

          <div className="mt-16 flex items-center justify-center gap-3 text-neutral-600">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Institutional Authentication Active</span>
          </div>
        </div>
      </PageContainer>
    </Section>
  );
}

export default function WriterSubmitted() {
  return (
    <>
      <Suspense fallback={<Section background="midnight"><PageContainer><div className="text-center text-white py-20 italic">Loading registry...</div></PageContainer></Section>}>
        <SubmittedContent />
      </Suspense>
    </>
  );
}
