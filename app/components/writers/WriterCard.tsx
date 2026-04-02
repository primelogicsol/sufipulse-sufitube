// import { Card } from '../primitives/Card';
// import { FileText, Globe } from 'lucide-react';
// import type { Writer } from '../../hooks/useWriters';

// interface WriterCardProps {
//   writer: Writer;
//   onClick?: () => void;
// }

// export function WriterCard({ writer, onClick }: WriterCardProps) {
//   const displayName = writer.display_name || writer.full_name || 'Anonymous Writer';

//   return (
//     <Card
//       className="p-6 hover:border-[var(--color-accent)] transition-all duration-200 cursor-pointer group"
//       onClick={onClick}
//     >
//       <div className="flex items-start justify-between mb-4">
//         <div className="flex-1">
//           <h3 className="text-xl font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
//             {displayName}
//           </h3>
//           {writer.country && (
//             <div className="flex items-center gap-2 mt-2 text-sm text-[var(--color-text-tertiary)]">
//               <Globe className="w-4 h-4" />
//               <span>{writer.country}</span>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]">
//         <div>
//           <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-1">
//             <FileText className="w-4 h-4" />
//             <span className="text-sm">Approved Works</span>
//           </div>
//           <p className="text-2xl font-bold text-[var(--color-text-primary)]">
//             {writer.kalam_count || 0}
//           </p>
//         </div>
//         <div>
//           <div className="flex items-center gap-2 text-[var(--color-text-secondary)] mb-1">
//             <FileText className="w-4 h-4" />
//             <span className="text-sm">Published Releases</span>
//           </div>
//           <p className="text-2xl font-bold text-[var(--color-text-primary)]">
//             {writer.published_releases || 0}
//           </p>
//         </div>
//       </div>

//       <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
//         <p className="text-xs text-[var(--color-text-tertiary)]">
//           Member since {new Date(writer.created_at).toLocaleDateString('en-US', {
//             month: 'short',
//             year: 'numeric'
//           })}
//         </p>
//       </div>
//     </Card>
//   );
// }
