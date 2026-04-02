// import { ReactNode } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import { Layout } from '../layout/Layout';
// import { PageContainer } from '../layout/PageContainer';
// import { ShieldAlert } from 'lucide-react';

// interface ProtectedRouteProps {
//   children: ReactNode;
//   requireAdmin?: boolean;
//   requireModerator?: boolean;
// }

// export function ProtectedRoute({
//   children,
//   requireAdmin = false,
//   requireModerator = false,
// }: ProtectedRouteProps) {
//   const { isAdmin, isModerator, loading } = useAuth();
//   const navigate = useNavigate();

//   if (loading) {
//     return (
//       <Layout>
//         <PageContainer>
//           <div className="max-w-4xl mx-auto py-12 text-center text-neutral-500">
//             Loading...
//           </div>
//         </PageContainer>
//       </Layout>
//     );
//   }

//   const hasAccess = requireAdmin
//     ? isAdmin
//     : requireModerator
//     ? isAdmin || isModerator
//     : true;

//   if (!hasAccess) {
//     return (
//       <Layout>
//         <PageContainer>
//           <div className="max-w-4xl mx-auto py-16">
//             <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
//               <ShieldAlert className="w-16 h-16 text-neutral-600 mx-auto mb-6" />
//               <h1 className="text-3xl font-serif font-light text-neutral-100 mb-4">
//                 Access Restricted
//               </h1>
//               <p className="text-neutral-400 mb-8">
//                 {requireAdmin
//                   ? 'This page is only accessible to administrators.'
//                   : 'This page is only accessible to administrators and moderators.'}
//               </p>
//               <button
//                 onClick={() => navigate('/')}
//                 className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-white text-neutral-900 font-medium rounded transition-colors"
//               >
//                 Return to Home
//               </button>
//             </div>
//           </div>
//         </PageContainer>
//       </Layout>
//     );
//   }

//   return <>{children}</>;
// }
