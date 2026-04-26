import { useState, useEffect } from 'react';
import { X, Loader as Loader2, CircleAlert as AlertCircle } from 'lucide-react';
import { Card } from '../primitives/Card';
import { PrimaryButton } from '../primitives/PrimaryButton';
import DOMPurify from "dompurify";
import { WriterSubmissionSuccessModal } from './WriterSubmissionSuccessModal';

interface WriterApplicationFormProps {
  onClose: () => void;
}

export function WriterApplicationForm({ onClose }: WriterApplicationFormProps) {
  const [formData, setFormData] = useState({
    pen_name: '',
    bio: '',
    sample_work: '',
    previous_publications: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const validateInput = (data: typeof formData): string | null => {
    if (!data.pen_name.trim() || data.pen_name.trim().length < 2) {
      return 'Pen name must be at least 2 characters long';
    }
    if (data.pen_name.length > 100) {
      return 'Pen name must not exceed 100 characters';
    }
    if (!data.bio.trim() || data.bio.trim().length < 50) {
      return 'Bio must be at least 50 characters long';
    }
    if (data.bio.length > 2000) {
      return 'Bio must not exceed 2000 characters';
    }
    if (!data.sample_work.trim() || data.sample_work.trim().length < 100) {
      return 'Sample work must be at least 100 characters long';
    }
    if (data.sample_work.length > 10000) {
      return 'Sample work must not exceed 10000 characters';
    }
    if (data.previous_publications && data.previous_publications.length > 2000) {
      return 'Previous publications must not exceed 2000 characters';
    }
    if (!data.email.trim()) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const validationError = validateInput(formData);
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/writers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          pen_name: formData.pen_name.trim(),
          bio: formData.bio.trim(),
          sample_work: formData.sample_work.trim(),
          previous_publications: formData.previous_publications.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit application. Please try again.');
      } else {
        const refId = data.id
          ? `SP-WRT-${new Date().getFullYear()}-${data.id.slice(0, 8).toUpperCase()}`
          : undefined;
        setSubmissionId(refId || null);
        setSuccess(true);
      }
    } catch {
      setError('Failed to submit application. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    const sanitizedValue = DOMPurify.sanitize(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  if (success) {
    return (
      <WriterSubmissionSuccessModal
        onClose={onClose}
        submissionId={submissionId || undefined}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <Card
        className="max-w-2xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
                Writer Application
              </h2>
              <p className="text-[var(--color-text-secondary)]">
                Submit your application to join the Writers Program
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
              aria-label="Close form"
            >
              <X className="w-6 h-6 text-[var(--color-text-secondary)]" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="form-input w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Pen Name / Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.pen_name}
                onChange={(e) => handleChange('pen_name', e.target.value)}
                maxLength={100}
                className="form-input w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                placeholder="The name you wish to be credited as"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                maxLength={2000}
                className="form-input w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none"
                placeholder="Brief background about your writing experience and spiritual journey"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Sample Work <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.sample_work}
                onChange={(e) => handleChange('sample_work', e.target.value)}
                rows={8}
                maxLength={10000}
                className="form-input w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none font-mono text-sm"
                placeholder="Paste your original kalam here (must be unpublished work)"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Previous Publications (Optional)
              </label>
              <textarea
                value={formData.previous_publications}
                onChange={(e) => handleChange('previous_publications', e.target.value)}
                rows={3}
                maxLength={2000}
                className="form-input w-full px-4 py-3 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] resize-none"
                placeholder="List any previous publications or writing credentials"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <PrimaryButton
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </PrimaryButton>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-8 py-3 rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                By submitting this application, you confirm that all submitted work is original and unpublished,
                and you agree to the SufiPulse governance policies and editorial process.
              </p>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
