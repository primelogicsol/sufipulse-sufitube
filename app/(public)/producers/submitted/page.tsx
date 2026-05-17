"use client";
import { useSearchParams } from 'next/navigation';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { Badge } from '../../../components/primitives/Badge';
import { CheckCircle2, Clock, ShieldCheck, ArrowRight, History } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function SubmittedContent() {
  const searchParams = useSearchParams();
  const ref = searchParams?.get('ref');
  const token = searchParams?.get('token');

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-16">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <Badge variant="gold" className="mb-6 px-4 py-1.5 text-[10px] font-black tracking-[0.3em]">Institutional Intake Received</Badge>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tighter">
          Production Profile Authorized
        </h1>
        <p className="text-neutral-500 text-lg max-w-xl mx-auto leading-relaxed">
          Your producer application has been formally logged into the Ahl-e-Naghma registry. Secure tracking is now active.
        </p>
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl mb-12">
        <div className="p-8 md:p-12 border-b border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Registry Reference ID</p>
              <p className="text-2xl font-mono text-amber-400 font-bold tracking-widest">{ref || 'SP-PRD-2026-XXXX'}</p>
            </div>
            <Link href={token ? `/applications/${ref}?token=${token}` : `/applications/${ref}`}>
              <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10 flex items-center gap-3 group uppercase text-[10px] font-black tracking-widest">
                Access Tracking Portal
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>
        </div>
        
        <div className="p-8 md:p-12 bg-white/[0.02]">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <History size={16} className="text-neutral-600" /> Operational Lifecycle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Review Timeline</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Portfolio screening and technical evaluation typically occurs within 7–14 business days.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Status Monitoring</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                You will receive secure notifications for every technical milestone and institutional decision.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Activation</p>
              <p className="text-[11px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Upon approval, your Producer Dashboard will be unlocked for curated kalam assignments.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest mb-8">
          Submission acknowledgment does not constitute assignment, recording authorization, or release clearance.
        </p>
        <Link href="/producers">
          <button className="text-[10px] font-black text-neutral-500 hover:text-white transition-colors uppercase tracking-[0.2em] border-b border-white/5 pb-1">
            Return to Creative Division →
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function ProducerSubmitted() {
  return (
    <Layout>
      <Section background="midnight" spacing="spacious" className="min-h-screen">
        <PageContainer>
          <Suspense fallback={
            <div className="text-center py-20">
              <div className="w-12 h-12 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-xs">Finalizing institutional entry...</p>
            </div>
          }>
            <SubmittedContent />
          </Suspense>
        </PageContainer>
      </Section>
    </Layout>
  );
}
