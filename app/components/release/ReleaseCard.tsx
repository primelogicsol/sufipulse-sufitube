// import { Link } from 'react-router-dom';
// import { Music, Play, Share2, Facebook, Twitter } from 'lucide-react';
// import { formatDuration } from '../../services/youtubeSync';
// import { getThumbnailUrl } from '../../services/thumbnailService';
// import { useState, useEffect } from 'react';

// interface ReleaseCardProps {
//   id: string;
//   slug: string;
//   title: string;
//   thumbnailUrl: string | null;
//   source: 'native' | 'youtube_legacy';
//   durationSeconds: number | null;
//   publishedDate: string;
//   views: number | null;
//   copyrightYear?: number;
//   youtubeVideoId?: string | null;
// }

// export function ReleaseCard({
//   slug,
//   title,
//   thumbnailUrl,
//   source,
//   durationSeconds,
//   publishedDate,
//   views,
//   copyrightYear,
//   youtubeVideoId
// }: ReleaseCardProps) {
//   const isLegacy = source === 'youtube_legacy';
//   const [thumbnail, setThumbnail] = useState<string>('');
//   const [imageError, setImageError] = useState(false);

//   useEffect(() => {
//     const thumbUrl = getThumbnailUrl({
//       youtubeVideoId,
//       artworkUrl: thumbnailUrl,
//       source,
//       title
//     });
//     setThumbnail(thumbUrl);
//   }, [youtubeVideoId, thumbnailUrl, source, title]);

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const formatViews = (count: number) => {
//     if (count >= 1000000) {
//       return `${(count / 1000000).toFixed(1)}M`;
//     }
//     if (count >= 1000) {
//       return `${(count / 1000).toFixed(1)}K`;
//     }
//     return count.toString();
//   };

//   const handleShare = (e: React.MouseEvent, platform: string) => {
//     e.preventDefault();
//     e.stopPropagation();

//     const url = encodeURIComponent(`${window.location.origin}/release/${slug}`);
//     const text = encodeURIComponent(title);

//     const urls: Record<string, string> = {
//       twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
//       whatsapp: `https://wa.me/?text=${text}%20${url}`,
//       facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
//     };

//     if (urls[platform]) {
//       window.open(urls[platform], '_blank', 'width=600,height=400');
//     }
//   };

//   return (
//     <Link
//       to={`/release/${slug}`}
//       className="group block bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all hover:scale-[1.02]"
//     >
//       <div className="relative aspect-video overflow-hidden bg-linear-to-br from-neutral-900 to-neutral-950">
//         {thumbnail && !imageError ? (
//           <div className="w-full h-full relative">
//             <img
//               src={thumbnail}
//               alt={title}
//               className="w-full h-full object-cover"
//               onError={() => setImageError(true)}
//             />
//             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//               <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
//                 <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="w-full h-full flex items-center justify-center relative">
//             <Music className="w-16 h-16 text-neutral-700" strokeWidth={1} />
//             <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//               <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
//                 <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
//               </div>
//             </div>
//           </div>
//         )}

//         {durationSeconds && (
//           <div className="absolute top-2 right-2 text-xs bg-black/70 px-2 py-1 rounded text-white font-medium">
//             {formatDuration(durationSeconds)}
//           </div>
//         )}
//       </div>

//       <div className="p-4">
//         <div className="mb-2">
//           <span className="text-[10px] uppercase tracking-wider border border-neutral-700 px-2 py-0.5 text-neutral-400">
//             {isLegacy ? 'Registered Release' : 'Governed Release'}
//           </span>
//         </div>

//         <h3 className="text-base font-serif font-light text-neutral-100 mb-1 line-clamp-2 group-hover:text-white transition-colors">
//           {title}
//         </h3>

//         <p className="text-xs text-neutral-500 mb-3">
//           by SufiPulse Studio • Dr Kumar Foundation USA
//         </p>

//         <div className="flex items-center justify-between gap-2 text-xs text-neutral-600 mb-3">
//           <div className="flex items-center gap-2">
//             {durationSeconds && (
//               <>
//                 <span>{formatDuration(durationSeconds)}</span>
//                 <span>•</span>
//               </>
//             )}
//             <span>{formatDate(publishedDate)}</span>
//             {!isLegacy && copyrightYear && (
//               <>
//                 <span>•</span>
//                 <span>© {copyrightYear}</span>
//               </>
//             )}
//           </div>
//         </div>

//         {isLegacy && views !== null && views > 0 && (
//           <div className="text-sm text-neutral-500 mb-3">
//             {formatViews(views)} views
//           </div>
//         )}

//         <div className="flex items-center gap-1 pt-2 border-t border-neutral-800">
//           <button
//             onClick={(e) => handleShare(e, 'facebook')}
//             className="p-1.5 text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900 rounded transition-colors"
//             title="Share on Facebook"
//           >
//             <Facebook className="w-3.5 h-3.5" />
//           </button>
//           <button
//             onClick={(e) => handleShare(e, 'twitter')}
//             className="p-1.5 text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900 rounded transition-colors"
//             title="Share on X"
//           >
//             <Twitter className="w-3.5 h-3.5" />
//           </button>
//           <button
//             onClick={(e) => handleShare(e, 'whatsapp')}
//             className="p-1.5 text-neutral-600 hover:text-neutral-400 hover:bg-neutral-900 rounded transition-colors"
//             title="Share on WhatsApp"
//           >
//             <Share2 className="w-3.5 h-3.5" />
//           </button>
//         </div>
//       </div>
//     </Link>
//   );
// }
