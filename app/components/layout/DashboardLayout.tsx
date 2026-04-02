import { useAuth } from '@/app/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  Mic,
  Music,
  BookOpen,
  Handshake,
  Calendar,
  LogOut,
  Shield,
  Activity,
  Building2,
  Globe,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigationLinks = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/applications/writers', label: 'Writers (Ahl-e-Qalam)', icon: FileText },
  { path: '/admin/applications/vocalists', label: 'Vocalists (Ahl-e-Naghma)', icon: Mic },
  { path: '/admin/applications/producers', label: 'Producers (Ahl-e-Naghma)', icon: Music },
  { path: '/admin/applications/literary', label: 'Literary (Ahl-e-Tahreer)', icon: BookOpen },
  { path: '/admin/kalams', label: 'Kalams', icon: Music },
  { path: '/admin/performance-assignments', label: 'Performance Assignments', icon: Music },
  { path: '/admin/production-workflow', label: 'Production Workflow', icon: Activity },
  { path: '/admin/studio-sessions', label: 'Studio Sessions', icon: Building2 },
  { path: '/admin/release-workflow', label: 'Release Workflow', icon: Globe },
  { path: '/admin/royalties', label: 'Royalty Management', icon: DollarSign },
  { path: '/admin/articles', label: 'Articles', icon: BookOpen },
  { path: '/admin/partnerships', label: 'Partnerships', icon: Handshake },
  { path: '/admin/session-requests', label: 'Session Requests', icon: Calendar },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    logout();
    router.push('/');
  };

  const isActive = (path: string) => {
    // if (path === '/admin') {
    //   return location.pathname === '/admin';
    // }
    // return location.pathname.startsWith(path);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="p-6 border-b border-[var(--dash-border)]">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[var(--dash-accent)]" />
            <div>
              <h1 className="!text-lg font-bold text-[var(--dash-text-primary)]">Admin Portal</h1>
              <p className="text-xs text-[var(--dash-text-muted)]">Governance Control</p>
            </div>
          </div>
        </div>

        <nav className="py-4">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`dashboard-sidebar-link`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Header Bar */}
        <header className="dashboard-header">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-[var(--dash-text-primary)]">
              {navigationLinks.find(link => isActive(link.path))?.label || 'Admin Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--dash-text-primary)]">{user?.email}</p>
              <p className="text-xs text-[var(--dash-text-muted)]">Administrator</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--dash-text-secondary)] hover:text-[var(--dash-accent)] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
