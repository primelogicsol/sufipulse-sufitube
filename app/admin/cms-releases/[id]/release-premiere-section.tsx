import React from 'react';
import { Plus, Trash2 } from "lucide-react";

export function ReleasePremiereSection({ form, setForm }: { form: any, setForm: any }) {
  const assets = form.preReleaseAssets || [];

  const addAsset = () => {
    setForm({
      ...form,
      preReleaseAssets: [
        ...assets,
        {
          id: `asset_${Date.now()}`,
          type: 'premium_teaser',
          status: 'draft'
        }
      ]
    });
  };

  const updateAsset = (id: string, field: string, value: any) => {
    setForm({
      ...form,
      preReleaseAssets: assets.map((a: any) => 
        a.id === id ? { ...a, [field]: value } : a
      )
    });
  };

  const removeAsset = (id: string) => {
    setForm({
      ...form,
      preReleaseAssets: assets.filter((a: any) => a.id !== id)
    });
  };

  return (
    <div id="premiere-pre-release-section" className="mb-12 pb-12 border-b border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-amber-500 tracking-tight flex items-center gap-3">
            Premiere & Pre-Release
          </h2>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">Configure Premiere Room lifecycle and teaser assets.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Release Lifecycle</label>
            <select 
              value={form.releaseLifecycle || 'released'} 
              onChange={(e) => setForm({ ...form, releaseLifecycle: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="upcoming">Upcoming</option>
              <option value="teaser_live">Teaser Live</option>
              <option value="premiere_scheduled">Premiere Scheduled</option>
              <option value="released">Released</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Official Release Date/Time</label>
            <input 
              type="datetime-local"
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={form.officialReleaseAt ? new Date(form.officialReleaseAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, officialReleaseAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Announced At</label>
            <input 
              type="datetime-local"
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              value={form.premiereAnnouncedAt ? new Date(form.premiereAnnouncedAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => setForm({ ...form, premiereAnnouncedAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Visibility</label>
            <select 
              value={form.premiereVisibility || 'private'} 
              onChange={(e) => setForm({ ...form, premiereVisibility: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
          <input 
            type="checkbox"
            id="featured-premiere" 
            checked={form.isFeaturedPremiere || false}
            onChange={(e) => setForm({ ...form, isFeaturedPremiere: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-neutral-900 cursor-pointer"
          />
          <label htmlFor="featured-premiere" className="text-sm font-semibold text-neutral-300 cursor-pointer">Featured Premiere (forces this release to be featured if public)</label>
        </div>

        <div className="space-y-4 pt-6 mt-6 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-widest">Pre-Release Assets</h3>
            <button 
              type="button" 
              onClick={addAsset} 
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Asset
            </button>
          </div>

          {assets.length === 0 ? (
            <div className="p-8 border border-dashed border-neutral-800 rounded-lg text-center">
              <p className="text-sm text-neutral-500">No pre-release assets configured.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.map((asset: any) => (
                <div key={asset.id} className="p-5 bg-neutral-900/80 border border-neutral-800 rounded-lg relative">
                  <button 
                    type="button" 
                    onClick={() => removeAsset(asset.id)}
                    className="absolute top-4 right-4 text-red-500/70 hover:text-red-500 p-1.5 hover:bg-red-500/10 rounded transition-colors"
                    title="Remove Asset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Asset Type</label>
                      <select 
                        value={asset.type} 
                        onChange={(e) => updateAsset(asset.id, 'type', e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="premium_teaser">Premium Teaser</option>
                        <option value="first_listen">First Listen</option>
                        <option value="trailer">Trailer</option>
                        <option value="premiere_announcement">Announcement</option>
                      </select>
                    </div>

                    <div className="space-y-2 pr-8">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Status</label>
                      <select 
                        value={asset.status} 
                        onChange={(e) => updateAsset(asset.id, 'status', e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Title (Optional)</label>
                      <input 
                        value={asset.title || ''} 
                        onChange={(e) => updateAsset(asset.id, 'title', e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-neutral-600"
                        placeholder="e.g. Teaser 1"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">YouTube ID</label>
                      <input 
                        value={asset.youtubeId || ''} 
                        onChange={(e) => updateAsset(asset.id, 'youtubeId', e.target.value.trim())}
                        className={`w-full bg-black border ${asset.youtubeId && !/^[A-Za-z0-9_-]{11}$/.test(asset.youtubeId) ? 'border-red-500' : 'border-neutral-700'} text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-neutral-600`}
                        placeholder="e.g. dQw4w9WgXcQ"
                      />
                      {asset.youtubeId && !/^[A-Za-z0-9_-]{11}$/.test(asset.youtubeId) && (
                        <p className="text-xs text-red-500">Invalid YouTube ID (must be 11 chars)</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">Custom Thumbnail URL (Optional)</label>
                      <input 
                        value={asset.thumbnailUrl || ''} 
                        onChange={(e) => updateAsset(asset.id, 'thumbnailUrl', e.target.value)}
                        className="w-full bg-black border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
