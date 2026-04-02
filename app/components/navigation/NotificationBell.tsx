// import { useState, useEffect } from 'react';
// import { Bell } from 'lucide-react';
// import { supabase } from '../../lib/supabase';
// import { Link } from 'react-router-dom';

// interface Notification {
//   id: string;
//   title: string;
//   message: string;
//   read: boolean;
//   created_at: string;
//   action_url?: string;
// }

// export function NotificationBell() {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [isOpen, setIsOpen] = useState(false);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     loadNotifications();

//     // Set up real-time subscription for new notifications
//     const channel = supabase
//       .channel('notifications-changes')
//       .on(
//         'postgres_changes',
//         {
//           event: 'INSERT',
//           schema: 'public',
//           table: 'notifications'
//         },
//         () => {
//           loadNotifications();
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   const loadNotifications = async () => {
//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from('notifications')
//         .select('*')
//         .eq('read', false)
//         .order('created_at', { ascending: false })
//         .limit(5);

//       if (error) throw error;
//       setNotifications(data || []);
//     } catch (error) {
//       console.error('Error loading notifications:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const markAsRead = async (notificationId: string) => {
//     try {
//       const { error } = await supabase
//         .from('notifications')
//         .update({ read: true, read_at: new Date().toISOString() })
//         .eq('id', notificationId);

//       if (error) throw error;

//       setNotifications(notifications.filter(n => n.id !== notificationId));
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//     }
//   };

//   const unreadCount = notifications.length;

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="relative p-2 text-neutral-400 hover:text-white transition-colors"
//         aria-label="Notifications"
//       >
//         <Bell className="w-6 h-6" />
//         {unreadCount > 0 && (
//           <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
//             {unreadCount > 9 ? '9+' : unreadCount}
//           </span>
//         )}
//       </button>

//       {isOpen && (
//         <>
//           {/* Backdrop */}
//           <div
//             className="fixed inset-0 z-40"
//             onClick={() => setIsOpen(false)}
//           ></div>

//           {/* Notification Dropdown */}
//           <div className="absolute right-0 top-full mt-2 w-96 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
//             <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
//               <h3 className="font-semibold text-white">Notifications</h3>
//               {unreadCount > 0 && (
//                 <span className="text-xs text-neutral-400">
//                   {unreadCount} unread
//                 </span>
//               )}
//             </div>

//             <div className="overflow-y-auto flex-1">
//               {loading ? (
//                 <div className="p-8 text-center">
//                   <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
//                 </div>
//               ) : notifications.length === 0 ? (
//                 <div className="p-8 text-center">
//                   <Bell className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
//                   <p className="text-sm text-neutral-400">No new notifications</p>
//                 </div>
//               ) : (
//                 <div className="divide-y divide-neutral-800">
//                   {notifications.map((notification) => (
//                     <div
//                       key={notification.id}
//                       className="p-4 hover:bg-neutral-800/50 transition-colors"
//                     >
//                       <div className="flex items-start justify-between mb-2">
//                         <h4 className="font-semibold text-white text-sm pr-2">
//                           {notification.title}
//                         </h4>
//                         <button
//                           onClick={() => markAsRead(notification.id)}
//                           className="text-xs text-neutral-400 hover:text-white transition-colors whitespace-nowrap"
//                         >
//                           Mark read
//                         </button>
//                       </div>
//                       <p className="text-sm text-neutral-300 mb-3 line-clamp-2">
//                         {notification.message}
//                       </p>
//                       {notification.action_url && (
//                         <Link
//                           to={notification.action_url}
//                           onClick={() => {
//                             markAsRead(notification.id);
//                             setIsOpen(false);
//                           }}
//                           className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-semibold"
//                         >
//                           View Details →
//                         </Link>
//                       )}
//                       <div className="mt-2 text-xs text-neutral-500">
//                         {new Date(notification.created_at).toLocaleDateString('en-US', {
//                           month: 'short',
//                           day: 'numeric',
//                           hour: '2-digit',
//                           minute: '2-digit'
//                         })}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {unreadCount > 0 && (
//               <div className="p-3 border-t border-neutral-800">
//                 <Link
//                   to="/user/dashboard?tab=notifications"
//                   onClick={() => setIsOpen(false)}
//                   className="block text-center text-sm text-blue-400 hover:text-blue-300 transition-colors font-semibold"
//                 >
//                   View All Notifications
//                 </Link>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
