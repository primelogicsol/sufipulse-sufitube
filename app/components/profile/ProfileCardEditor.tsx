"use client";
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { Camera, Instagram, Youtube, Globe, Music, User } from 'lucide-react';

interface ProfileExtras {
  bio: string;
  tagline: string;
  social_instagram: string;
  social_youtube: string;
  social_soundcloud: string;
  social_website: string;
}

const EMPTY_EXTRAS: ProfileExtras = {
  bio: '',
  tagline: '',
  social_instagram: '',
  social_youtube: '',
  social_soundcloud: '',
  social_website: '',
};

const ROLE_META: Record<string, { subtitle: string; title: string; color: string }> = {
  writer:   { subtitle: 'Writer',                 title: 'Ahl-e-Qalam',   color: 'text-amber-400'   },
  vocalist: { subtitle: 'Vocalist',               title: 'Ahl-e-Sada',    color: 'text-rose-400'    },
  producer: { subtitle: 'Producer',               title: 'Ahl-e-Naghma',  color: 'text-blue-400'    },
  literary: { subtitle: 'Literary Contributor',   title: 'Ahl-e-Tahreer', color: 'text-emerald-400' },
};

interface ProfileCardEditorProps {
  role: 'writer' | 'vocalist' | 'producer' | 'literary';
  displayName?: string;
  status?: string;
}

export function ProfileCardEditor({ role, displayName, status }: ProfileCardEditorProps) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState('');
  const [extras, setExtras] = useState<ProfileExtras>(EMPTY_EXTRAS);
  const [saved, setSaved] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const avatarKey = user ? `sufipulse_avatar_${user.id}` : null;
  const extrasKey = user ? `sufipulse_profile_extras_${user.id}_${role}` : null;

  useEffect(() => {
    if (!avatarKey || !extrasKey) return;
    try {
      setAvatar(localStorage.getItem(avatarKey) || '');
      const stored = localStorage.getItem(extrasKey);
      if (stored) setExtras(JSON.parse(stored));
    } catch {}
  }, [avatarKey, extrasKey]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !avatarKey) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Only JPG, PNG or WebP images are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image must be under 2 MB.');
      return;
    }
    setAvatarError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatar(result);
      localStorage.setItem(avatarKey, result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!extrasKey) return;
    localStorage.setItem(extrasKey, JSON.stringify(extras));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const meta = ROLE_META[role];
  const name = displayName || user?.full_name || '—';

  return (
    <div className="bg-neutral-950/50 border border-neutral-800/50 rounded p-8 mb-6">
      <h3 className="text-lg font-semibold text-white mb-6">My Profile Card</h3>

      {/* Avatar + Identity */}
      <div className="flex items-start gap-6 mb-6">
        <div className="relative flex-shrink-0">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-amber-400/50 transition-colors group"
          >
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        <div className="flex-1">
          <div className="text-white font-semibold text-lg">{name}</div>
          <div className={`text-sm ${meta.color}`}>{meta.subtitle} · {meta.title}</div>
          {status && (
            <div className="mt-2 inline-block bg-neutral-800 text-neutral-300 text-xs px-3 py-1 rounded-full capitalize">
              Status: {status.replace(/_/g, ' ')}
            </div>
          )}
          <p className="text-neutral-500 text-xs mt-2">Click the avatar to upload a profile picture (JPG / PNG / WebP, max 2 MB)</p>
          {avatarError && (
            <p className="text-red-400 text-xs mt-1">{avatarError}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-neutral-400 text-xs mb-1.5">Tagline</label>
          <input
            type="text"
            maxLength={100}
            placeholder={`e.g. ${role === 'writer' ? 'Classical Ghazal poet and Sufi literature scholar' : role === 'vocalist' ? 'Devotional vocalist trained in classical ragas' : role === 'producer' ? 'Studio producer with 8 years in devotional production' : 'Literary editor and Persian poetry scholar'}`}
            value={extras.tagline}
            onChange={e => setExtras({ ...extras, tagline: e.target.value })}
            className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
          />
        </div>
        <div>
          <label className="block text-neutral-400 text-xs mb-1.5">Short Bio <span className="text-neutral-600">(max 300 chars)</span></label>
          <textarea
            rows={2}
            maxLength={300}
            placeholder="A brief introduction shown on your contributor profile"
            value={extras.bio}
            onChange={e => setExtras({ ...extras, bio: e.target.value })}
            className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm resize-none"
          />
        </div>
      </div>

      {/* Social Links */}
      <div>
        <h4 className="text-sm font-medium text-white mb-3">Social &amp; Portfolio Links</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            <input
              type="url"
              placeholder="Instagram URL"
              value={extras.social_instagram}
              onChange={e => setExtras({ ...extras, social_instagram: e.target.value })}
              className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Youtube className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            <input
              type="url"
              placeholder="YouTube channel URL"
              value={extras.social_youtube}
              onChange={e => setExtras({ ...extras, social_youtube: e.target.value })}
              className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            <input
              type="url"
              placeholder="SoundCloud / Bandcamp URL"
              value={extras.social_soundcloud}
              onChange={e => setExtras({ ...extras, social_soundcloud: e.target.value })}
              className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-neutral-500 flex-shrink-0" />
            <input
              type="url"
              placeholder="Personal website URL"
              value={extras.social_website}
              onChange={e => setExtras({ ...extras, social_website: e.target.value })}
              className="form-input w-full bg-neutral-900/50 rounded px-3 py-2 text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-black font-medium text-sm rounded transition-colors"
        >
          {saved ? 'Saved ✓' : 'Save Profile Card'}
        </button>
      </div>
    </div>
  );
}
