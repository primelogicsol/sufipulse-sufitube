import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, LayoutDashboard, CircleUser as UserCircle, NotebookPen, Mic, KeyboardMusic, PenTool, FolderDot } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as api from "@/app/lib/api-client"
import { hasRoleAccess } from '@/app/lib/role-access';

export function AvatarMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [userProfiles, setUserProfiles] = useState({
    writer: false,
    vocalist: false,
    producer: false,
    studio: false,
    literaryCollaborator: false
  })

  // Get user initials or default
  const getInitials = () => {
    if (!user?.full_name) return 'SP';
    const names = user?.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Close on ESC key
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);


  const handleLinkClick = () => {
    setIsOpen(false);
  };
  const handleLogout = () => {
    setIsOpen(false);
    logout();
  }
  const loadWriterProfile = async () => {
    try {
      const res = await api.readWriterProfile();
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'approved' || data.profile_status === 'approved') {
          setUserProfiles(prev => ({ ...prev, writer: true }));
        }
      }
    } catch (error) { console.error("Failed to load writer profile:", error); }
  };
  const loadVocalistProfile = async () => {
    try {
      const res = await api.readVocalistProfile();
      if (res.ok) {
        const data = await res.json();
        if (data.is_verfied || data.status === 'approved' || data.profile_status === 'approved') {
          setUserProfiles(prev => ({ ...prev, vocalist: true }));
        }
      }
    } catch (error) { console.error("Failed to load vocalist profile:", error); }
  };
  const loadProducerProfile = async () => {
    try {
      const res = await api.readProducerProfile();
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'approved' || data.profile_status === 'approved') {
          setUserProfiles(prev => ({ ...prev, producer: true }));
        }
      }
    } catch (error) { console.error("Failed to load producer profile:", error); }
  };
  const loadStudioProfile = async () => {
    try {
      const res = await api.readStudioProfile();
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'approved' || data.profile_status === 'approved') {
          setUserProfiles(prev => ({ ...prev, studio: true }));
        }
      }
    } catch (error) { console.error("Failed to load studio profile:", error); }
  };
  const loadLiteraryProfile = async () => {
    try {
      const res = await api.readLiteraryProfile();
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'approved' || data.profile_status === 'approved') {
          setUserProfiles(prev => ({ ...prev, literaryCollaborator: true }));
        }
      }
    } catch (error) { console.error("Failed to load literary profile:", error); }
  };

  useEffect(() => {
    if (user) {
      loadVocalistProfile();
      loadWriterProfile();
      loadProducerProfile();
      loadStudioProfile();
      loadLiteraryProfile();
    }
  }, [user]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full border-2 border-[#C8A75E] text-[#C8A75E] flex items-center justify-center font-semibold text-sm hover:shadow-[0_0_16px_rgba(200,167,94,0.5)] hover:bg-[#C8A75E]/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#C8A75E] focus:ring-offset-2 focus:ring-offset-[#0a0e13]"
        aria-label={user ? 'User menu' : 'Access menu'}
        aria-expanded={isOpen}
      >
        {user ? getInitials() : <User size={20} />}
      </button>

      {isOpen && (
        <div
          className="absolute w-max right-0 mt-3 w-64 bg-[#0f1b2d]/95 backdrop-blur-md border border-[#1e2a3d] rounded-lg shadow-2xl shadow-black/50 py-2 z-50 animate-fade-in"
          role="menu"
        >
          {user ? (
            // Logged In State
            <>
              <div className="px-4 py-3 border-b border-[#1e2a3d]">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-[#C8A75E] font-medium truncate">{user.email}</p>
              </div>

              <div className="py-2">
                {/* Admin Dashboard — admin role only */}
                {user.role?.includes('admin') && (
                  <Link
                    href="/admin"
                    onClick={handleLinkClick}
                    className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors"
                    role="menuitem"
                  >
                    <LayoutDashboard size={18} />
                    <span>Admin Dashboard</span>
                  </Link>
                )}

                {/* My Account — all authenticated users */}
                <Link
                  href="/user/profile"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors"
                  role="menuitem"
                >
                  <UserCircle size={18} />
                  <span>My Account</span>
                </Link>

                {hasRoleAccess(user as any, 'writer') && userProfiles.writer && <Link
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors"
                  onClick={handleLinkClick}
                  href="/user/writer/dashboard">
                  <NotebookPen size={18} />
                  <span>Ahl-e-Qalam Portal</span>
                </Link>}
                {hasRoleAccess(user as any, 'vocalist') && userProfiles.vocalist && <Link
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors"
                  onClick={handleLinkClick}
                  href="/user/vocalist/dashboard">
                  <Mic size={18} />
                  <span>Ahl-e-Sada Portal</span>
                </Link>}
                {hasRoleAccess(user as any, 'producer') && userProfiles.producer && <Link
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors"
                  onClick={handleLinkClick}
                  href="/user/producer/dashboard">
                  <KeyboardMusic size={18} />
                  <span>Ahl-e-Naghma Portal</span>
                </Link>}
                {hasRoleAccess(user as any, 'studio') && userProfiles.studio && <Link
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors"
                  onClick={handleLinkClick}
                  href="/user/studio/dashboard">
                  <FolderDot size={18} />
                  <span>Karkhana-e-Sada Portal</span>
                </Link>}
                {hasRoleAccess(user as any, 'literary') && userProfiles.literaryCollaborator && <Link
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors"
                  onClick={handleLinkClick}
                  href="/user/literary-contributor/dashboard">
                  <PenTool size={18} />
                  <span>Ahl-e-Tahreer Portal</span>
                </Link>}
              </div>

              <div className="border-t border-[#1e2a3d] pt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:bg-[#1e2a3d] hover:text-red-400 transition-colors w-full text-left"
                  role="menuitem"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            // Not Logged In State
            <>
              <div className="px-4 py-3 border-b border-[#1e2a3d]">
                <p className="text-[#C8A75E] font-semibold text-sm">Institutional Access</p>
              </div>

              <div className="py-2">
                <Link
                  href="/login"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors font-medium"
                  role="menuitem"
                >
                  Sign In
                </Link>
              </div>

              <div className="border-t border-[#1e2a3d] pt-2">
                <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">
                  Apply as
                </div>
                <Link
                  href="/writers"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors text-sm"
                  role="menuitem"
                >
                  Writer
                </Link>
                <Link
                  href="/vocalists"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors text-sm"
                  role="menuitem"
                >
                  Vocalist
                </Link>
                <Link
                  href="/producers"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors text-sm"
                  role="menuitem"
                >
                  Producer
                </Link>
                <Link
                  href="/studio"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-[#1e2a3d] hover:text-[#C8A75E] transition-colors text-sm"
                  role="menuitem"
                >
                  Studio
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
