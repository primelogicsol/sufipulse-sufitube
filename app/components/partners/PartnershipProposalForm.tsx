// import { useState } from 'react';
// // import { supabase } from '../../lib/supabase';
// import { sanitizeInput } from '../../lib/sanitization';
// import { Building2, CheckCircle2 } from 'lucide-react';

// interface PartnershipFormData {
//   organizationName: string;
//   organizationType: string;
//   country: string;
//   city: string;
//   contactPerson: string;
//   contactEmail: string;
//   contactPhone: string;
//   organizationWebsite: string;
//   missionStatement: string;
//   yearsEstablished: string;
//   proposedCollaborationType: string;
//   collaborationDescription: string;
//   alignmentStatement: string;
//   previousPartnerships: string;
//   governanceAcknowledgment: boolean;
//   structuralAlignment: boolean;
// }

// export function PartnershipProposalForm() {
//   const [submitted, setSubmitted] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [submissionId] = useState(`SP-PART-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`);

//   const [formData, setFormData] = useState<PartnershipFormData>({
//     organizationName: '',
//     organizationType: '',
//     country: '',
//     city: '',
//     contactPerson: '',
//     contactEmail: '',
//     contactPhone: '',
//     organizationWebsite: '',
//     missionStatement: '',
//     yearsEstablished: '',
//     proposedCollaborationType: '',
//     collaborationDescription: '',
//     alignmentStatement: '',
//     previousPartnerships: '',
//     governanceAcknowledgment: false,
//     structuralAlignment: false,
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       const { error: insertError } = await supabase
//         .from('institutional_partnership_proposals')
//         .insert([{
//           organization_name: formData.organizationName,
//           organization_type: formData.organizationType,
//           country: formData.country,
//           city: formData.city,
//           contact_person: formData.contactPerson,
//           contact_email: formData.contactEmail,
//           contact_phone: formData.contactPhone,
//           organization_website: formData.organizationWebsite,
//           mission_statement: formData.missionStatement,
//           years_established: parseInt(formData.yearsEstablished) || null,
//           proposed_collaboration_type: formData.proposedCollaborationType,
//           collaboration_description: formData.collaborationDescription,
//           alignment_statement: formData.alignmentStatement,
//           previous_partnerships: formData.previousPartnerships,
//           governance_acknowledgment: formData.governanceAcknowledgment,
//           structural_alignment: formData.structuralAlignment,
//           submission_reference: submissionId,
//           status: 'pending',
//         }]);

//       if (insertError) throw insertError;

//       setSubmitted(true);
//     } catch (err) {
//       console.error('Submission error:', err);
//       setError(err instanceof Error ? err.message : 'Failed to submit partnership proposal');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (submitted) {
//     return (
//       <div className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
//         <div className="flex flex-col items-center text-center">
//           <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
//             <CheckCircle2 className="w-8 h-8 text-green-400" />
//           </div>
//           <h3 className="text-xl font-semibold text-white mb-2">
//             Partnership Proposal Submitted
//           </h3>
//           <p className="text-neutral-300 text-sm mb-4">
//             Your partnership proposal has been received and will be reviewed by the institutional coordination team.
//           </p>
//           <div className="bg-neutral-900/50 border border-neutral-800 rounded px-4 py-3 mb-6">
//             <p className="text-xs text-neutral-400 mb-1">Submission Reference</p>
//             <p className="text-amber-400 font-mono text-sm">{submissionId}</p>
//           </div>
//           <p className="text-neutral-400 text-xs leading-relaxed max-w-md">
//             You will receive notification regarding the review outcome. Partnership decisions are made based on structural alignment and governance compatibility.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8">
//       <div className="flex items-center gap-3 mb-6">
//         <Building2 className="w-6 h-6 text-amber-400" />
//         <h3 className="text-lg font-semibold text-white">Partnership Proposal Submission</h3>
//       </div>

//       {error && (
//         <div className="mb-6 p-4 bg-red-900/20 border border-red-800/50 rounded-md">
//           <p className="text-red-400 text-sm">{error}</p>
//         </div>
//       )}

//       <div className="grid md:grid-cols-2 gap-8">
//         <div className="space-y-5">
//           <div>
//             <h4 className="text-sm font-medium text-white mb-4">Organization Information</h4>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Organization Name *</label>
//                 <input
//                   type="text"
//                   required
//                   maxLength={300}
//                   value={formData.organizationName}
//                   onChange={e => setFormData({ ...formData, organizationName: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                 />
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Organization Type *</label>
//                 <select
//                   required
//                   value={formData.organizationType}
//                   onChange={e => setFormData({ ...formData, organizationType: e.target.value })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                 >
//                   <option value="">Select type</option>
//                   <option value="academic">Academic & Research</option>
//                   <option value="cultural">Cultural & Heritage</option>
//                   <option value="technical">Technical & Infrastructure</option>
//                   <option value="regional">Regional Institutional</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="block text-neutral-400 text-xs mb-1.5">Country *</label>
//                   <input
//                     type="text"
//                     required
//                     maxLength={100}
//                     value={formData.country}
//                     onChange={e => setFormData({ ...formData, country: sanitizeInput(e.target.value) })}
//                     className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-neutral-400 text-xs mb-1.5">City *</label>
//                   <input
//                     type="text"
//                     required
//                     maxLength={100}
//                     value={formData.city}
//                     onChange={e => setFormData({ ...formData, city: sanitizeInput(e.target.value) })}
//                     className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Years Established *</label>
//                 <input
//                   type="number"
//                   required
//                   min="1800"
//                   max="2100"
//                   value={formData.yearsEstablished}
//                   onChange={e => setFormData({ ...formData, yearsEstablished: e.target.value })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                 />
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Organization Website</label>
//                 <input
//                   type="url"
//                   maxLength={300}
//                   value={formData.organizationWebsite}
//                   onChange={e => setFormData({ ...formData, organizationWebsite: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                   placeholder="https://example.org"
//                 />
//               </div>
//             </div>
//           </div>

//           <div>
//             <h4 className="text-sm font-medium text-white mb-4">Contact Information</h4>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Contact Person *</label>
//                 <input
//                   type="text"
//                   required
//                   maxLength={200}
//                   value={formData.contactPerson}
//                   onChange={e => setFormData({ ...formData, contactPerson: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                 />
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Contact Email *</label>
//                 <input
//                   type="email"
//                   required
//                   maxLength={200}
//                   value={formData.contactEmail}
//                   onChange={e => setFormData({ ...formData, contactEmail: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                 />
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Contact Phone</label>
//                 <input
//                   type="tel"
//                   maxLength={50}
//                   value={formData.contactPhone}
//                   onChange={e => setFormData({ ...formData, contactPhone: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-5">
//           <div>
//             <h4 className="text-sm font-medium text-white mb-4">Collaboration Details</h4>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Mission Statement *</label>
//                 <textarea
//                   required
//                   rows={4}
//                   maxLength={2000}
//                   value={formData.missionStatement}
//                   onChange={e => setFormData({ ...formData, missionStatement: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm resize-none"
//                   placeholder="Describe your organization's mission and values"
//                 />
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Proposed Collaboration Type *</label>
//                 <select
//                   required
//                   value={formData.proposedCollaborationType}
//                   onChange={e => setFormData({ ...formData, proposedCollaborationType: e.target.value })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm"
//                 >
//                   <option value="">Select collaboration type</option>
//                   <option value="joint_initiative">Joint Initiative</option>
//                   <option value="research_exchange">Research Exchange</option>
//                   <option value="event_coordination">Event Coordination</option>
//                   <option value="content_preservation">Content Preservation</option>
//                   <option value="educational_programming">Educational Programming</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Collaboration Description *</label>
//                 <textarea
//                   required
//                   rows={5}
//                   maxLength={3000}
//                   value={formData.collaborationDescription}
//                   onChange={e => setFormData({ ...formData, collaborationDescription: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm resize-none"
//                   placeholder="Describe the proposed collaboration in detail"
//                 />
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Alignment with SufiPulse Charter *</label>
//                 <textarea
//                   required
//                   rows={4}
//                   maxLength={2000}
//                   value={formData.alignmentStatement}
//                   onChange={e => setFormData({ ...formData, alignmentStatement: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm resize-none"
//                   placeholder="Explain how your organization aligns with SufiPulse's charter and governance framework"
//                 />
//               </div>

//               <div>
//                 <label className="block text-neutral-400 text-xs mb-1.5">Previous Partnerships (if any)</label>
//                 <textarea
//                   rows={3}
//                   maxLength={2000}
//                   value={formData.previousPartnerships}
//                   onChange={e => setFormData({ ...formData, previousPartnerships: sanitizeInput(e.target.value) })}
//                   className="form-input w-full rounded px-3 py-2 text-white text-sm resize-none"
//                   placeholder="List relevant previous institutional partnerships"
//                 />
//               </div>
//             </div>
//           </div>

//           <div>
//             <h4 className="text-sm font-medium text-white mb-4">Institutional Acknowledgments</h4>

//             <div className="space-y-3">
//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input
//                   type="checkbox"
//                   required
//                   checked={formData.governanceAcknowledgment}
//                   onChange={e => setFormData({ ...formData, governanceAcknowledgment: e.target.checked })}
//                   className="mt-1"
//                 />
//                 <span className="text-neutral-300 text-xs leading-relaxed group-hover:text-white transition-colors">
//                   I acknowledge that partnership operates under SufiPulse's charter-defined governance and structural authority
//                 </span>
//               </label>

//               <label className="flex items-start gap-3 cursor-pointer group">
//                 <input
//                   type="checkbox"
//                   required
//                   checked={formData.structuralAlignment}
//                   onChange={e => setFormData({ ...formData, structuralAlignment: e.target.checked })}
//                   className="mt-1"
//                 />
//                 <span className="text-neutral-300 text-xs leading-relaxed group-hover:text-white transition-colors">
//                   I understand that institutional collaboration enhances capacity without altering SufiPulse's structural framework
//                 </span>
//               </label>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="mt-8 pt-6 border-t border-neutral-800">
//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-400 rounded-lg px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {loading ? 'Submitting Proposal...' : 'Submit Partnership Proposal'}
//         </button>
//       </div>
//     </form>
//   );
// }
