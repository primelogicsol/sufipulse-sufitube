"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import StudioCredentialsForm from '../../../components/studio/StudioCredentialsForm';
import { Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

function StudioApplyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams?.get('ref');
  const token = searchParams?.get('token');
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ref && token) {
      setLoading(true);
      fetch(`/api/studio/${ref}?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) {
            setInitialData(data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [ref, token]);

  const handleSuccess = (submissionId: string, token: string) => {
    // Modal handles success display
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-white italic">
        <Sparkles className="w-8 h-8 text-amber-400 animate-pulse mx-auto mb-4" />
        <p className="text-neutral-500 font-medium tracking-widest uppercase text-xs">Accessing institutional record...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge variant="gold" className="mb-6 px-4 py-1.5 text-[10px] font-black tracking-[0.3em]">Karkhana-e-Sada Intake</Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tighter">
          Studio Network Pathway
        </h1>
        <p className="text-neutral-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Technical intake for recording facilities seeking inclusion within the SufiPulse production network. Registry authorization is mandatory for all network partners.
        </p>
      </div>

      <StudioCredentialsForm 
        onSuccess={handleSuccess} 
        initialData={initialData}
      />
    </div>
  );
}

export default function StudioApply() {
  return (
    <>
      <Section background="midnight" spacing="spacious" className="min-h-screen">
        <PageContainer>
          <Suspense fallback={
            <div className="text-center text-white italic py-20 flex flex-col items-center">
              <div className="w-12 h-12 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-6" />
              <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-xs">Initializing framework...</p>
            </div>
          }>
            <StudioApplyContent />
          </Suspense>

          <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/10">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none">Governance Protocol</p>
                <p className="text-[9px] text-neutral-600 uppercase tracking-widest mt-1">Technical alignment is mandatory for all network studios</p>
              </div>
            </div>
            <Link href="/governance" className="text-[10px] font-black text-amber-400 hover:text-white transition-colors uppercase tracking-[0.2em] border-b border-amber-400/20 pb-1">
              View Governance Framework →
            </Link>
          </div>
        </PageContainer>
      </Section>
    </>
  );
}
