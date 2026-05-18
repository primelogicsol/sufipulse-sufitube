"use client";

import { 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Settings, 
  ShieldCheck, 
  Clock, 
  HardDrive,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface SuccessModalProps {
  onClose: () => void;
  submissionId: string;
}

export function StudioSubmissionSuccessModal({ 
  onClose, 
  submissionId 
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 overflow-y-auto py-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-amber-400/20 rounded-[32px] shadow-[0_0_100px_rgba(251,191,36,0.1)] overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Success Header */}
        <div className="relative h-48 flex items-center justify-center bg-linear-to-b from-amber-400/10 to-transparent">
          <div className="absolute top-6 right-8">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-amber-400 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(251,191,36,0.4)]">
              <CheckCircle2 size={40} className="text-black stroke-[2.5]" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400">Technical Intake Authorized</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-10 pb-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Studio Credentials Submitted</h2>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto">
              Your technical facility record has been received for technical audit under Karkhana-e-Sada. Registry authorization is mandatory for session hosting.
            </p>
          </div>

          {/* Reference ID Card */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Registry Reference ID</p>
              <p className="text-xl font-mono font-bold text-white tracking-wider uppercase">{submissionId}</p>
            </div>
            <div className="h-px w-full md:h-12 md:w-px bg-white/5" />
            <div className="text-right md:text-right w-full md:w-auto">
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Audit Status</p>
              <div className="flex items-center justify-center md:justify-end gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Pending Review</p>
              </div>
            </div>
          </div>

          {/* Next Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-3">
                <HardDrive size={16} className="text-amber-400" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest leading-none mt-0.5">Facility Audit</h4>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Technical review of your acoustic environment and recording chain specifications.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3 mb-3">
                <Activity size={16} className="text-amber-400" />
                <h4 className="text-[11px] font-black text-white uppercase tracking-widest leading-none mt-0.5">Validation Path</h4>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed uppercase tracking-wider">
                Approved studios enter the SufiPulse regional coordination registry for sessions.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <Link 
              href="/studio"
              className="w-full py-4 bg-amber-400 text-black font-black rounded-xl hover:bg-amber-500 transition-all uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 group shadow-[0_20px_40px_rgba(251,191,36,0.1)]"
            >
              Explore Network Infrastructure
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white/5 text-neutral-400 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all uppercase text-[10px] tracking-[0.2em]"
            >
              Return to Registry Overview
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck size={14} className="text-neutral-700" />
              <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">SufiPulse Institutional Governance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
