import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Building, User, Users, Eye, EyeOff } from 'lucide-react';
import { storage } from '../../../lib/storage';
import { SongAdoption, SongAdoptionSponsor } from '../../../types/adoption.types';

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
        // Get approved adoptions for this release
        const adoptions = await storage.getSongAdoptions({
          release_id: releaseId,
          public_listing_approved: true,
          adoption_status: 'approved'
        });

        // Get sponsors for these adoptions
        const adopterDisplays: AdopterDisplay[] = [];

        for (const adoption of adoptions) {
          const sponsors = await storage.getAll('song_adoption_sponsor', { adoption_id: adoption.id });
          if (sponsors.length > 0) {
            const sponsor = sponsors[0];
            let displayName = '';
            let location = '';

            // Determine display name based on privacy settings
            switch (adoption.public_display_mode) {
              case 'full_name':
                displayName = sponsor.full_name;
                break;
              case 'initials_only':
                displayName = sponsor.initials_resolved + '.';
                break;
              case 'organization':
                displayName = sponsor.organization_name || sponsor.full_name;
                break;
              case 'anonymous':
                displayName = 'Anonymous';
                break;
              default:
                displayName = sponsor.full_name;
            }

            // Determine location display
            switch (adoption.public_location_mode) {
              case 'city_country':
                location = [sponsor.city, sponsor.country].filter(Boolean).join(', ');
                break;
              case 'country_only':
                location = sponsor.country;
                break;
              case 'hide':
                location = '';
                break;
              default:
                location = sponsor.country;
            }

            adopterDisplays.push({
              id: adoption.id,
              displayName,
              location,
              adopterType: sponsor.adopter_type,
              createdAt: adoption.created_at,
            });
          }
        }

        // Sort by creation date (newest first) and limit
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
        return <User className="w-4 h-4 text-neutral-400" />;
      case 'family':
        return <Users className="w-4 h-4 text-neutral-400" />;
      case 'institution':
        return <Building className="w-4 h-4 text-neutral-400" />;
      case 'trust':
        return <Heart className="w-4 h-4 text-neutral-400" />;
      case 'sponsor_circle':
        return <Users className="w-4 h-4 text-neutral-400" />;
      default:
        return <User className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getAdopterTypeLabel = (type: string) => {
    switch (type) {
      case 'individual':
        return '';
      case 'family':
        return 'Family';
      case 'institution':
        return 'Institution';
      case 'trust':
        return 'Trust';
      case 'sponsor_circle':
        return 'Sponsor Circle';
      case 'anonymous':
        return '';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif font-light text-neutral-100">Recent Adopters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-neutral-800 rounded mb-2"></div>
              <div className="h-3 bg-neutral-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (adopters.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif font-light text-neutral-100">Recent Adopters</h3>
        </div>
        <div className="text-center py-12">
          <button 
            onClick={onAdoptClick}
            className="block mx-auto mb-4 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-full transition-transform hover:scale-110"
            aria-label="Adopt this kalam"
          >
            <Heart className="w-12 h-12 text-red-500 fill-red-500/20 animate-pulse" />
          </button>
          <p className="text-neutral-400">
            No adopters yet. Be the first to sponsor this kalam.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-serif font-light text-neutral-100">Recent Adopters</h3>
        {adopters.length >= limit && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-2"
          >
            {showAll ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAll ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adopters.slice(0, showAll ? adopters.length : 3).map((adopter) => (
          <div
            key={adopter.id}
            className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getAdopterIcon(adopter.adopterType)}
                <span className="text-neutral-200 font-medium text-sm">
                  {adopter.displayName}
                </span>
              </div>
              {getAdopterTypeLabel(adopter.adopterType) && (
                <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
                  {getAdopterTypeLabel(adopter.adopterType)}
                </span>
              )}
            </div>

            {adopter.location && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <MapPin className="w-3 h-3" />
                <span>{adopter.location}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {adopters.length > 3 && !showAll && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            +{adopters.length - 3} more adopters
          </button>
        </div>
      )}
    </div>
  );
}