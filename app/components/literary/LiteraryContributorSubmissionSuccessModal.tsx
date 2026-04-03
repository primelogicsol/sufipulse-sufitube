import { useEffect, useState } from 'react';
import { CircleCheck as CheckCircle, FileCheck, Clock, Mail, Hop as Home, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LiteraryContributorSubmissionSuccessModalProps {
  onClose: () => void;
  submissionId?: string;
}

export function LiteraryContributorSubmissionSuccessModal({ onClose, submissionId }: LiteraryContributorSubmissionSuccessModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/');
    }
  }, [countdown, router]);

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
            Profile Submitted Successfully
          </h2>

          <p className="text-[#D4AF37] text-sm font-medium tracking-wider uppercase mb-6">
            Ahl-e-Tahreer Editorial Review Queue
          </p>

          {submissionId && (
            <div className="inline-block px-4 py-2 bg-[#0B1B33] border border-[#D4AF37]/20 rounded-lg mb-6">
              <p className="text-xs text-[var(--color-text-tertiary)] mb-1">Submission Reference</p>
              <p className="text-sm font-mono text-[#D4AF37] tracking-wide">{submissionId}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              Your literary contributor profile has been formally received by the SufiPulse editorial board.
            </p>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              All submissions undergo institutional review for intellectual integrity, thematic alignment, and editorial governance compliance.
            </p>
          </div>

          <div className="p-5 bg-linear-to-r from-[#D4AF37]/10 to-transparent border border-[#D4AF37]/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <p className="text-sm font-semibold text-[#D4AF37]">Estimated Review Window</p>
            </div>
            <p className="text-[var(--color-text-primary)] font-medium">5–7 Working Days</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-[#D4AF37]" />
            What Happens Next
          </h3>
          <ul className="space-y-3 text-sm text-[var(--color-text-secondary)]">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold shrink-0 mt-0.5">1</span>
              <span>Editorial screening and portfolio review begins</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold shrink-0 mt-0.5">2</span>
              <span>You may be asked to provide a sample writing submission</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold shrink-0 mt-0.5">3</span>
              <span>Upon approval, literary journal contribution access will activate</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold shrink-0 mt-0.5">4</span>
              <span className="flex items-center gap-2">
                Email notification will be sent
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReturnHome}
            className="flex-1 px-6 py-3.5 bg-linear-to-r from-[#D4AF37] to-[#F4D03F] text-[#0A1628] font-semibold rounded-lg hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Return to Home
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-center text-[var(--color-text-tertiary)]">
            Redirecting to home in <span className="text-[#D4AF37] font-semibold">{countdown}</span> seconds
          </p>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 18, 35, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-card {
          position: relative;
          width: 100%;
          max-width: 560px;
          padding: 2rem;
          border-radius: 18px;
          background: linear-gradient(180deg, #0B1B33 0%, #091426 100%);
          border: 1px solid rgba(212, 175, 55, 0.35);
          box-shadow:
            0 0 80px rgba(0, 0, 0, 0.7),
            0 0 40px rgba(212, 175, 55, 0.15);
          animation: fadeScale 0.3s ease-out;
          max-height: 90vh;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
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
