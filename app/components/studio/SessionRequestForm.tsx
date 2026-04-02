import { useState } from 'react';
// import { supabase } from '../../lib/supabase';
import { Calendar, FileText, User, Shield } from 'lucide-react';
// import { DOMPurify.sanitize } from '../../lib/sanitization';
import DOMPurify from 'dompurify';

interface SessionRequestFormProps {
  sessionType: 'in_person' | 'remote';
}

export function SessionRequestForm({ sessionType }: SessionRequestFormProps) {
  const [formData, setFormData] = useState({
    approval_reference_code: '',
    release_id: '',
    role_type: 'vocalist' as 'writer' | 'vocalist' | 'producer',
    preferred_date_start: '',
    preferred_date_end: '',
    production_reference: '',
    additional_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // try {
    //   const { error: submitError } = await supabase
    //     .from('session_requests')
    //     .insert([{
    //       approval_reference_code: formData.approval_reference_code,
    //       release_id: formData.release_id || null,
    //       role_type: formData.role_type,
    //       session_type: sessionType,
    //       preferred_date_start: formData.preferred_date_start,
    //       preferred_date_end: formData.preferred_date_end,
    //       production_reference: formData.production_reference || null,
    //       additional_notes: formData.additional_notes || null
    //     }]);

    //   if (submitError) throw submitError;

    //   setSuccess(true);
    //   setTimeout(() => {
    //     setFormData({
    //       approval_reference_code: '',
    //       release_id: '',
    //       role_type: 'vocalist',
    //       preferred_date_start: '',
    //       preferred_date_end: '',
    //       production_reference: '',
    //       additional_notes: ''
    //     });
    //     setSuccess(false);
    //   }, 3000);
    // } catch (err) {
    //   setError(err instanceof Error ? err.message : 'An error occurred while submitting your request.');
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg">
      <div className="border-b border-neutral-800 p-6">
        <h3 className="text-xl font-bold text-white mb-1">
          {sessionType === 'in_person' ? 'In-Person' : 'Remote'} Session Request
        </h3>
        <p className="text-sm text-neutral-400">
          Submit coordination request for governance review
        </p>
      </div>

      {success ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Request Submitted</h3>
          <p className="text-neutral-400 text-sm">
            Your session coordination request has been submitted for governance review.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-amber-400/5 border border-amber-400/20 rounded-lg p-4">
            <p className="text-amber-400/90 text-xs leading-relaxed">
              Session access requires a valid approval reference code. This code is issued to approved contributors after credential review. Submit your credentials through the appropriate contributor page (Writers, Vocalists, or Producers) to receive your reference code.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Approval Reference Code
            </label>
            <input
              type="text"
              required
              placeholder="Enter your issued reference code"
              value={formData.approval_reference_code}
              onChange={(e) => setFormData({ ...formData, approval_reference_code: e.target.value.toUpperCase() })}
              className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 font-mono"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Reference code provided after contributor credential approval
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <User className="w-4 h-4 text-amber-400" />
              Your Role
            </label>
            <select
              required
              value={formData.role_type}
              onChange={(e) => setFormData({ ...formData, role_type: e.target.value as any })}
              className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white"
            >
              <option value="writer">Writer (Ahl-e-Qalam)</option>
              <option value="vocalist">Vocalist (Ahl-e-Sada)</option>
              <option value="producer">Producer (Ahl-e-Naghma)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Release ID
            </label>
            <input
              type="text"
              placeholder="Release UUID (if applicable)"
              value={formData.release_id}
              onChange={(e) => setFormData({ ...formData, release_id: DOMPurify.sanitize(e.target.value) })}
              className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Optional: Reference approved release if session is for existing production
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Preferred Start Date
              </label>
              <input
                type="date"
                required
                value={formData.preferred_date_start}
                onChange={(e) => setFormData({ ...formData, preferred_date_start: e.target.value })}
                className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                Preferred End Date
              </label>
              <input
                type="date"
                required
                value={formData.preferred_date_end}
                onChange={(e) => setFormData({ ...formData, preferred_date_end: e.target.value })}
                className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-300 mb-2 block">
              Production Reference
            </label>
            <input
              type="text"
              placeholder="Reference number or production code"
              value={formData.production_reference}
              onChange={(e) => setFormData({ ...formData, production_reference: DOMPurify.sanitize(e.target.value) })}
              className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-300 mb-2 block">
              Additional Notes
            </label>
            <textarea
              rows={4}
              placeholder="Provide any additional context for this session request..."
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: DOMPurify.sanitize(e.target.value) })}
              className="form-input w-full px-4 py-3 bg-neutral-950/50 rounded-lg text-white placeholder-neutral-500 resize-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400/50 text-amber-400 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
