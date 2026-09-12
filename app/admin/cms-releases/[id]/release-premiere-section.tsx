import React, { useRef, useState } from 'react';
import { Plus, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";

export function ReleasePremiereSection({ form, setForm }: { form: any, setForm: any }) {
  const assets = form.preReleaseAssets || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setForm({ ...form, premiereThumbnail: data.url });
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Thumbnail upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div id="premiere-pre-release-section" className="mb-12 pb-12 border-b border-white/5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-amber-500 tracking-tight flex items-center gap-3">
            Premiere Room & Pre-Release
          </h2>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">Configure Premiere Room homepage preview and lifecycle.</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Premiere Status & Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/50 p-6 rounded-lg border border-neutral-800">
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input 
                type="checkbox"
                checked={form.premiereEnabled || false}
                onChange={(e) => setForm({ ...form, premiereEnabled: e.target.checked })}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm font-bold text-white">Include in Premiere Room</span>
            </label>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Status</label>
              <select 
                value={form.premiereStatus || 'coming_soon'} 
                onChange={(e) => setForm({ ...form, premiereStatus: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="coming_soon">Coming Soon</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Order</label>
              <input 
                type="number"
                className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                value={form.premiereOrder || 0}
                onChange={(e) => setForm({ ...form, premiereOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Date</label>
              <input 
                type="datetime-local"
                className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 disabled:opacity-50"
                disabled={form.premiereDateTba}
                value={form.premiereDate ? new Date(form.premiereDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => setForm({ ...form, premiereDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
              />
            </div>

            <label className="flex items-center gap-3">
              <input 
                type="checkbox"
                checked={form.premiereDateTba || false}
                onChange={(e) => setForm({ ...form, premiereDateTba: e.target.checked })}
                className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-neutral-300">Premiere Date TBA</span>
            </label>
          </div>
        </div>

        {/* Editorial Text */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Editorial Description</label>
            <textarea 
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500 min-h-[100px]"
              placeholder="Leave blank to use canonical description..."
              value={form.premiereDescription || ''}
              onChange={(e) => setForm({ ...form, premiereDescription: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Custom CTA Label</label>
            <input 
              type="text"
              className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              placeholder="e.g. Explore the Release"
              value={form.premiereCtaLabel || ''}
              onChange={(e) => setForm({ ...form, premiereCtaLabel: e.target.value })}
            />
          </div>
        </div>

        {/* Thumbnail Management */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Thumbnail (16:9 Recommended)</label>
          <div className="flex items-start gap-6">
            {form.premiereThumbnail ? (
              <div className="relative group rounded-lg overflow-hidden border border-neutral-700 bg-black w-64 aspect-video">
                <img src={form.premiereThumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover block rounded-lg" />
                <button 
                  type="button"
                  onClick={() => setForm({ ...form, premiereThumbnail: '' })}
                  className="absolute top-2 right-2 bg-black/60 p-1.5 rounded text-white hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="w-64 aspect-video bg-neutral-900 border border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center text-neutral-500">
                <ImageIcon size={32} className="mb-2 opacity-50" />
                <span className="text-xs font-medium">No Thumbnail</span>
              </div>
            )}
            
            <div className="space-y-3">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-sm transition-colors border border-neutral-700"
              >
                {uploading ? <span className="animate-pulse">Uploading...</span> : <Upload size={16} />}
                {form.premiereThumbnail ? 'Replace Thumbnail' : 'Upload Thumbnail'}
              </button>
              {form.premiereThumbnail && (
                <button 
                  type="button"
                  onClick={() => setForm({ ...form, premiereThumbnail: '' })}
                  className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded text-sm transition-colors"
                >
                  <Trash2 size={16} /> Remove Thumbnail
                </button>
              )}
            </div>
          </div>
        </div>

                {/* Feature Availability */}
        <div className="space-y-4 pt-6 border-t border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-300">Available at Premiere</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={form.premiumTeaserAvailable || false}
                  onChange={(e) => setForm({ ...form, premiumTeaserAvailable: e.target.checked })}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-300">Premium Teaser</span>
              </label>
              <span className={`text-[10px] ml-6 font-bold uppercase ${assets.some((a: any) => a.type === 'premium_teaser' && a.youtubeId) ? 'text-green-500' : 'text-red-500'}`}>
                Asset: {assets.some((a: any) => a.type === 'premium_teaser' && a.youtubeId) ? 'READY' : 'NOT CONFIGURED'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={form.commentaryAvailable || false}
                  onChange={(e) => setForm({ ...form, commentaryAvailable: e.target.checked })}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-300">Mystical Commentary</span>
              </label>
              <span className={`text-[10px] ml-6 font-bold uppercase ${(form.commentary || form.editorial_note || form.editorialNote) ? 'text-green-500' : 'text-red-500'}`}>
                Content: {(form.commentary || form.editorial_note || form.editorialNote) ? 'READY' : 'NOT READY'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={form.lyricsTranslationsAvailable || false}
                  onChange={(e) => setForm({ ...form, lyricsTranslationsAvailable: e.target.checked })}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-300">Lyrics & Translations</span>
              </label>
              <span className={`text-[10px] ml-6 font-bold uppercase ${(form.lyrics || (form.lyricsStructures && form.lyricsStructures.length > 0)) ? 'text-green-500' : 'text-red-500'}`}>
                Content: {(form.lyrics || (form.lyricsStructures && form.lyricsStructures.length > 0)) ? 'READY' : 'NOT READY'}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={form.creditsNotesAvailable || false}
                  onChange={(e) => setForm({ ...form, creditsNotesAvailable: e.target.checked })}
                  className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-neutral-300">Credits & Notes</span>
              </label>
              <span className={`text-[10px] ml-6 font-bold uppercase ${(form.credits || form.publicCredits) ? 'text-green-500' : 'text-red-500'}`}>
                Content: {(form.credits || form.publicCredits) ? 'READY' : 'NOT READY'}
              </span>
            </div>
          </div>
        </div>

        {/* Notify Me */}
        <div className="space-y-4 pt-6 border-t border-neutral-800">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={form.notifyEnabled || false}
              onChange={(e) => setForm({ ...form, notifyEnabled: e.target.checked })}
              className="w-4 h-4 rounded bg-neutral-800 border-neutral-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-neutral-300">Enable "Notify Me" functionality</span>
          </label>
        </div>

        {/* Legacy Pre-Release Assets */}
        <div className="space-y-4 pt-6 border-t border-neutral-800">
          <h3 className="text-sm font-bold text-neutral-300 mb-4">Legacy Lifecycle Context (For Assets)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Internal Release Lifecycle</label>
              <select 
                value={form.releaseLifecycle || 'released'} 
                onChange={(e) => setForm({ ...form, releaseLifecycle: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="teaser_live">Teaser Live</option>
                <option value="premiere_scheduled">Premiere Scheduled</option>
                <option value="released">Released</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Premiere Visibility</label>
              <select 
                value={form.premiereVisibility || 'private'} 
                onChange={(e) => setForm({ ...form, premiereVisibility: e.target.value })}
                className="w-full bg-neutral-900 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">Pre-Release Asset Links</label>
            <button 
              type="button"
              onClick={addAsset}
              className="text-xs flex items-center gap-1 text-amber-500 hover:text-amber-400"
            >
              <Plus size={14} /> Add Asset
            </button>
          </div>

          <div className="space-y-3">
            {assets.length === 0 ? (
              <div className="text-sm text-neutral-500 italic p-4 border border-dashed border-neutral-800 rounded bg-neutral-900/30">
                No pre-release assets configured.
              </div>
            ) : (
              assets.map((asset: any) => (
                <div key={asset.id} className="p-4 bg-neutral-900 rounded border border-neutral-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-neutral-500 block mb-1">Asset Type</label>
                        <select 
                          value={asset.type}
                          onChange={(e) => updateAsset(asset.id, 'type', e.target.value)}
                          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="premium_teaser">Premium Teaser</option>
                          <option value="first_listen">First Listen</option>
                          <option value="trailer">Trailer</option>
                          <option value="premiere_announcement">Premiere Announcement</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-500 block mb-1">Status</label>
                        <select 
                          value={asset.status}
                          onChange={(e) => updateAsset(asset.id, 'status', e.target.value)}
                          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="draft">Draft</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="live">Live</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-neutral-500 block mb-1">YouTube Video ID (Optional)</label>
                        <input 
                          type="text"
                          value={asset.youtubeId || ''}
                          onChange={(e) => updateAsset(asset.id, 'youtubeId', e.target.value)}
                          placeholder="e.g. dQw4w9WgXcQ"
                          className="w-full bg-neutral-800 border border-neutral-700 text-white rounded px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeAsset(asset.id)}
                      className="ml-4 p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title="Remove asset"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
