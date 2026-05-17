"use client";

import { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle, FileCheck, Clock, Mail, Hop as Home, X, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProducerSubmissionSuccessModalProps {
  onClose: () => void;
  submissionId?: string;
  trackingToken?: string;
}

export function ProducerSubmissionSuccessModal({ onClose, submissionId, trackingToken }: ProducerSubmissionSuccessModalProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCopy = () => {
    if (submissionId) {
      navigator.clipboard.writeText(submissionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReturnHome = () => {
    document.body.style.overflow = '';
    router.push('/');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors rounded-lg hover:bg-white/5"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-linear-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 mb-6 mx-auto shadow-lg shadow-[#D4AF37]/10">
            <CheckCircle className="w-10 h-10 text-[#D4AF37]" />
          </div>

          <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2 tracking-tight">
            Production Profile Submitted
          </h2>

          <p className="text-[#D4AF37] text-sm font-medium tracking-wider uppercase mb-6">
            Ahl-e-Naghma Portfolio Review Queue
          </p>

          {submissionId && (
            <div className="inline-block w-full px-4 py-4 bg-[#0B1B33] border border-[#D4AF37]/20 rounded-lg mb-6 text-left">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-widest">Submission Reference</p>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-[#D4AF37] hover:text-[#F4D03F] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy ID'}
                </button>
              </div>
              <p className="text-lg font-mono text-[#D4AF37] tracking-wider">{submissionId}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-widest">Current Status</p>
              <span className="px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider rounded">Under Portfolio Screening</span>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              Your producer profile has been formally received by the SufiPulse production board.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-linear-to-b from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest">Review Timeline</p>
              </div>
              <p className="text-[var(--color-text-primary)] font-semibold text-sm">7–14 Working Days</p>
            </div>
            
            <div className="p-5 bg-white/[0.01] border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Tech Evaluation</p>
              </div>
              <p className="text-[var(--color-text-secondary)] text-xs leading-tight">Assessment of arrangement quality and studio readiness.</p>
            </div>
          </div>

          <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
            <p className="text-[10px] text-red-400/80 leading-relaxed uppercase tracking-wide text-center">
              Institutional Notice: Submission acknowledgment does not constitute producer approval, recording authorization, or production commitment.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2 uppercase tracking-widest">
            <FileCheck className="w-4 h-4 text-[#D4AF37]" />
            What Happens Next
          </h3>
          <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold shrink-0 mt-0.5">1</span>
              <span>Portfolio review and screening begins</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold shrink-0 mt-0.5">2</span>
              <span>You may receive technical feedback or arrangement requests</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold shrink-0 mt-0.5">3</span>
              <span>Upon approval, Dashboard access activates for kalam assignments</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold shrink-0 mt-0.5">4</span>
              <span className="flex items-center gap-2">
                Secure notification will be dispatched
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReturnHome}
            className="flex-1 px-6 py-3.5 bg-linear-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-bold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all duration-200 flex items-center justify-center gap-2 group text-sm uppercase tracking-wider"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Return to Home
          </button>
          
          <button
            onClick={() => {
              const url = trackingToken 
                ? `/applications/${submissionId}?token=${trackingToken}` 
                : `/applications/${submissionId}`;
              router.push(url);
            }}
            className="flex-1 px-6 py-3.5 bg-white/5 text-[var(--color-text-primary)] font-bold rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2 group text-sm uppercase tracking-wider border border-white/10"
          >
            <Clock className="w-4 h-4 text-[#D4AF37]" />
            Track Progress
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 35, 0.9);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-card {
          position: relative;
          width: 100%;
          max-width: 580px;
          padding: 2.5rem;
          border-radius: 24px;
          background: linear-gradient(180deg, #0B1B33 0%, #081021 100%);
          border: 1px solid rgba(212, 175, 55, 0.4);
          box-shadow:
            0 0 100px rgba(0, 0, 0, 0.8),
            0 0 50px rgba(212, 175, 55, 0.1);
          animation: fadeScale 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 95vh;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @media (max-width: 640px) {
          .modal-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
