import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Building, User, Users, Eye, EyeOff } from 'lucide-react';

interface RecentAdoptersProps {
  releaseId: string;
  limit?: number;
  onAdoptClick?: () => void;
}

interface AdopterDisplay {
  id: string;
  displayName: string;
  location?: string;
  adopterType: string;
  createdAt: string;
}

export function RecentAdopters({ releaseId, limit = 6, onAdoptClick }: RecentAdoptersProps) {
  const [adopters, setAdopters] = useState<AdopterDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadAdopters = async () => {
      try {
        const res = await fetch(`/api/adoptions?releaseId=${encodeURIComponent(releaseId)}`);
        if (!res.ok) throw new Error('Failed to load adopters');
        const adoptions: any[] = await res.json();

        const adopterDisplays: AdopterDisplay[] = adoptions.map((a) => {
          let displayName = '';
          let location = '';

          switch (a.publicDisplayMode) {
            case 'full_name': displayName = a.sponsorName || 'Sponsor'; break;
            case 'initials_only':
              displayName = (a.sponsorName || '').split(' ').map((n: string) => n[0]).filter(Boolean).join('') + '.';
              break;
            case 'organization': displayName = a.sponsorName || 'Organization'; break;
            case 'anonymous': displayName = 'Anonymous'; break;
            default: displayName = a.sponsorName || 'Sponsor';
          }

          switch (a.publicLocationMode) {
            case 'city_country': location = [a.sponsorCity, a.sponsorCountry].filter(Boolean).join(', '); break;
            case 'country_only': location = a.sponsorCountry || ''; break;
            case 'hide': location = ''; break;
            default: location = a.sponsorCountry || '';
          }

          return {
            id: a.id,
            displayName,
            location,
            adopterType: a.adopterType || 'individual',
            createdAt: a.createdAt,
          };
        });

        adopterDisplays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAdopters(adopterDisplays.slice(0, limit));
      } catch (error) {
        console.error('Error loading adopters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdopters();
  }, [releaseId, limit]);

  const getAdopterIcon = (type: string) => {
    switch (type) {
      case 'individual':
        return <User className="w-3.5 h-3.5" />;
      case 'family':
        return <Users className="w-3.5 h-3.5" />;
      case 'institution':
        return <Building className="w-3.5 h-3.5" />;
      case 'trust':
        return <Heart className="w-3.5 h-3.5" />;
      case 'sponsor_circle':
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  const getAdopterTypeLabel = (type: string) => {
    switch (type) {
      case 'family': return 'Family';
      case 'institution': return 'Institution';
      case 'trust': return 'Trust';
      case 'sponsor_circle': return 'Circle';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <h3 className="text-3xl font-serif text-[var(--color-text-primary)]">Recent Adopters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-[var(--color-border-strong)] rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-[var(--color-border-strong)] rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (adopters.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <h3 className="text-3xl font-serif text-[var(--color-text-primary)]">Recent Adopters</h3>
        <div className="relative group overflow-hidden bg-[var(--color-slate)]/10 border border-[var(--color-border-strong)] rounded-3xl p-16 text-center backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-gold)]/[0.02] to-transparent" />
          <button 
            onClick={onAdoptClick}
            className="relative mb-6 focus:outline-none group-hover:scale-110 transition-transform duration-500"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-[var(--color-gold)] fill-[var(--color-gold)]/20 animate-pulse" />
            </div>
          </button>
          <p className="relative text-[var(--color-text-secondary)] font-light text-lg">
            No adopters yet. Be the first to sponsor this kalam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h3 className="text-3xl font-serif text-[var(--color-text-primary)]">Recent Adopters</h3>
        {adopters.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[var(--color-gold)] hover:text-[var(--color-gold-hover)] transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAll ? 'Show Less' : `View All (${adopters.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adopters.slice(0, showAll ? adopters.length : 3).map((adopter) => (
          <div
            key={adopter.id}
            className="group relative bg-[var(--color-slate)]/20 border border-[var(--color-border-strong)] hover:border-[var(--color-gold)]/40 rounded-2xl p-6 transition-all duration-500 backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-gold)]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-gold-muted)] flex items-center justify-center border border-[var(--color-gold)]/10 text-[var(--color-gold)]">
                    {getAdopterIcon(adopter.adopterType)}
                  </div>
                  <span className="text-[var(--color-text-primary)] font-serif group-hover:text-[var(--color-gold)] transition-colors duration-300">
                    {adopter.displayName}
                  </span>
                </div>
                {getAdopterTypeLabel(adopter.adopterType) && (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-gold)]/60 bg-[var(--color-gold)]/5 px-2 py-0.5 rounded-full border border-[var(--color-gold)]/10">
                    {getAdopterTypeLabel(adopter.adopterType)}
                  </span>
                )}
              </div>

              {adopter.location && (
                <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] text-xs">
                  <MapPin className="w-3 h-3 text-[var(--color-gold)]/40" />
                  <span className="font-light tracking-wide">{adopter.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {adopters.length > 3 && !showAll && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowAll(true)}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all text-xs uppercase tracking-widest font-bold border-b border-transparent hover:border-[var(--color-text-primary)] pb-1"
          >
            +{adopters.length - 3} more adopters
          </button>
        </div>
      )}
    </div>
  );
}