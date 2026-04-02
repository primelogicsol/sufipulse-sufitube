// import { X, FileText, Globe, Calendar } from 'lucide-react';
// import { Card } from '../primitives/Card';
// import type { Writer } from '../../hooks/useWriters';

// interface WriterProfileModalProps {
//   writer: Writer;
//   onClose: () => void;
// }

// export function WriterProfileModal({ writer, onClose }: WriterProfileModalProps) {
//   const displayName = writer.display_name || writer.full_name || 'Anonymous Writer';

//   return (
//     <div
//       className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
//       onClick={onClose}
//     >
//       <Card
//         className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="p-6">
//           <div className="flex items-start justify-between mb-6">
//             <div>
//               <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
//                 {displayName}
//               </h2>
//               {writer.country && (
//                 <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
//                   <Globe className="w-4 h-4" />
//                   <span>{writer.country}</span>
//                 </div>
//               )}
//             </div>
//             <button
//               onClick={onClose}
//               className="p-2 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors"
//               aria-label="Close modal"
//             >
//               <X className="w-6 h-6 text-[var(--color-text-secondary)]" />
//             </button>
//           </div>

//           <div className="grid md:grid-cols-3 gap-6 mb-6">
//             <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)]">
//               <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-2">
//                 <FileText className="w-5 h-5" />
//                 <span className="text-sm">Approved Works</span>
//               </div>
//               <p className="text-3xl font-bold text-[var(--color-text-primary)]">
//                 {writer.kalam_count || 0}
//               </p>
//             </div>

//             <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)]">
//               <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-2">
//                 <FileText className="w-5 h-5" />
//                 <span className="text-sm">Published Releases</span>
//               </div>
//               <p className="text-3xl font-bold text-[var(--color-text-primary)]">
//                 {writer.published_releases || 0}
//               </p>
//             </div>

//             <div className="p-4 rounded-lg bg-[var(--color-surface-elevated)]">
//               <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-2">
//                 <Calendar className="w-5 h-5" />
//                 <span className="text-sm">Member Since</span>
//               </div>
//               <p className="text-lg font-semibold text-[var(--color-text-primary)]">
//                 {new Date(writer.created_at).toLocaleDateString('en-US', {
//                   month: 'short',
//                   year: 'numeric'
//                 })}
//               </p>
//             </div>
//           </div>

//           {writer.bio && (
//             <div className="mb-6">
//               <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
//                 About
//               </h3>
//               <p className="text-[var(--color-text-secondary)] leading-relaxed">
//                 {writer.bio}
//               </p>
//             </div>
//           )}

//           <div className="pt-6 border-t border-[var(--color-border)]">
//             <p className="text-sm text-[var(--color-text-tertiary)]">
//               This writer has contributed to the SufiPulse archive through the governed submission process.
//               All works have been reviewed and approved by the Editorial Council (Majlis-e-Nazr).
//             </p>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// }
