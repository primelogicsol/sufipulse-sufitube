import { Trash2, SkipForward, Target } from 'lucide-react';
import type { CMSRelease } from '@/lib/cms-storage';
import type { ASSStylePack } from './release-constants';
import { DEFAULT_STYLE_NAME, DEFAULT_STYLE_PACK } from './release-constants';

type Props = {
  form: Partial<CMSRelease>;
  selectedSubtitleLanguage: string;
  referenceLanguage: string;
  sideBySideMode: boolean;
  styleNames: string[];
  selectedCueIds: Set<string>;
  previewCueId: string | null;
  setPreviewCueId: (id: string) => void;
  setSelectedCueIds: (next: Set<string>) => void;
  updateCue: (cueId: string, field: string, value: any) => void;
  setCueTranslation: (language: string, cueId: string, text: string) => void;
  deleteCue: (cueId: string) => void;
  acceptCueTranslation: (language: string, cueId: string) => void;
  setCueMetadata: (cueId: string, patch: Record<string, any>) => void;
  onJumpToCue?: (cue: any) => void;
};

export function SubtitleCueListSection({
  form,
  selectedSubtitleLanguage,
  referenceLanguage,
  sideBySideMode,
  styleNames,
  selectedCueIds,
  previewCueId,
  setPreviewCueId,
  setSelectedCueIds,
  updateCue,
  setCueTranslation,
  deleteCue,
  acceptCueTranslation,
  setCueMetadata,
  onJumpToCue,
}: Props) {
  return (
    <div className="space-y-2">
      {(form.subtitleCues || []).map((cue) => {
        const cueMeta = (form.subtitleCueMetadata as Record<string, any> | undefined)?.[cue.id] || {};
        const cueStyleName = cueMeta.styleName || form.languageStyleOverrides?.[selectedSubtitleLanguage]?.stylePack || DEFAULT_STYLE_NAME;
        const cueStylePack = (form.subtitleStylePacks as Record<string, ASSStylePack> | undefined)?.[cueStyleName] || DEFAULT_STYLE_PACK;
        const isSelected = selectedCueIds.has(cue.id);
        const isActive = previewCueId === cue.id;
        const cueReviewStatus = form.translationReviewStatus?.[selectedSubtitleLanguage]?.[cue.id];
        const isMasterLang = selectedSubtitleLanguage === (form.defaultLanguage || 'en');
        const hasText = !!(form.subtitleTranslations?.[selectedSubtitleLanguage]?.[cue.id]?.trim());
        const hasPosition = Number.isFinite(cueMeta.positionX) && Number.isFinite(cueMeta.positionY);

        return (
          <div
            key={cue.id}
            onClick={() => setPreviewCueId(cue.id)}
            className="rounded-lg transition-all cursor-pointer"
            style={{
              border: `1px solid ${isActive ? 'var(--dash-accent)' : isSelected ? 'rgba(212,175,55,0.4)' : 'var(--dash-border)'}`,
              backgroundColor: isActive ? 'rgba(212,175,55,0.07)' : isSelected ? 'var(--dash-bg-hover)' : 'var(--dash-bg-secondary)',
              boxShadow: isActive ? '0 0 0 1px rgba(212,175,55,0.2)' : 'none',
            }}
          >
            {/* ── Top row: checkbox + cue # + timecodes + line ref + icons ── */}
            <div className="flex items-center gap-2 px-3 pt-2.5 pb-2 flex-wrap">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => {
                  const newSet = new Set(selectedCueIds);
                  if (e.target.checked) newSet.add(cue.id);
                  else newSet.delete(cue.id);
                  setSelectedCueIds(newSet);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{ accentColor: 'var(--dash-accent)', flexShrink: 0 }}
                title="Select for bulk operations"
              />

              {/* Cue number badge */}
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive ? 'var(--dash-accent)' : 'var(--dash-bg-primary)',
                  color: isActive ? '#000' : 'var(--dash-text-muted)',
                  border: `1px solid ${isActive ? 'var(--dash-accent)' : 'var(--dash-border)'}`,
                  minWidth: '32px',
                  textAlign: 'center',
                }}
              >
                #{cue.cueNumber}
              </span>

              {/* Start time (green) */}
              <input
                type="text"
                value={cue.startTime}
                onChange={(e) => updateCue(cue.id, 'startTime', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="form-input font-mono text-xs"
                style={{ width: '116px', flexShrink: 0, color: '#22c55e' }}
                placeholder="00:00:00.000"
                title="Start time"
              />

              <span className="text-xs shrink-0" style={{ color: 'var(--dash-text-muted)' }}>→</span>

              {/* End time (red) */}
              <input
                type="text"
                value={cue.endTime}
                onChange={(e) => updateCue(cue.id, 'endTime', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="form-input font-mono text-xs"
                style={{ width: '116px', flexShrink: 0, color: '#ef4444' }}
                placeholder="00:00:03.000"
                title="End time"
              />

              {/* Line ref */}
              <input
                type="text"
                value={cue.lineRef || ''}
                onChange={(e) => updateCue(cue.id, 'lineRef', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="form-input text-xs"
                style={{ width: '70px', flexShrink: 0 }}
                placeholder="Ref"
                title="Line reference label"
              />

              {/* Status indicators */}
              <div className="flex items-center gap-1 ml-auto shrink-0">
                {hasText && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: '#22c55e' }}
                    title="Has subtitle text"
                  />
                )}
                {hasPosition && (
                  <Target size={12} style={{ color: 'var(--dash-accent)' }} aria-label="Has position override" />
                )}
              </div>

              {/* Jump-to-cue button */}
              {onJumpToCue && (
                <button
                  type="button"
                  title="Seek video to this cue's start time"
                  onClick={(e) => { e.stopPropagation(); onJumpToCue(cue); }}
                  className="shrink-0 p-1 rounded transition"
                  style={{ color: 'var(--dash-text-muted)', backgroundColor: 'transparent' }}
                >
                  <SkipForward size={14} />
                </button>
              )}

              {/* Delete cue */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteCue(cue.id); }}
                className="shrink-0 p-1 rounded transition"
                style={{ color: 'var(--dash-status-rejected)', backgroundColor: 'transparent' }}
                title="Delete cue"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* ── Subtitle text row ── */}
            <div className="px-3 pb-2.5 flex items-center gap-2">
              {sideBySideMode && (
                <input
                  type="text"
                  value={form.subtitleTranslations?.[referenceLanguage]?.[cue.id] || ''}
                  readOnly
                  onClick={(e) => e.stopPropagation()}
                  className="form-input text-xs flex-1"
                  style={{ opacity: 0.55 }}
                  placeholder={`Reference (${referenceLanguage.toUpperCase()})`}
                />
              )}
              <input
                type="text"
                value={form.subtitleTranslations?.[selectedSubtitleLanguage]?.[cue.id] || ''}
                onChange={(e) => setCueTranslation(selectedSubtitleLanguage, cue.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="form-input text-xs flex-1"
                placeholder={`Subtitle text (${selectedSubtitleLanguage.toUpperCase()})`}
              />
            </div>

            {/* ── Translation review badge ── */}
            {!isMasterLang && cueReviewStatus && (
              <div className="flex items-center gap-2 px-3 pb-2" onClick={(e) => e.stopPropagation()}>
                {cueReviewStatus === 'ai' && (
                  <>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--dash-status-pending-bg)', color: 'var(--dash-status-pending)', border: '1px solid var(--dash-status-pending)' }}>
                      AI translated — review needed
                    </span>
                    <button
                      type="button"
                      onClick={() => acceptCueTranslation(selectedSubtitleLanguage, cue.id)}
                      className="text-xs px-2 py-0.5 rounded-full transition"
                      style={{ backgroundColor: 'var(--dash-status-approved-bg)', color: 'var(--dash-status-approved)', border: '1px solid var(--dash-status-approved)' }}
                    >
                      Accept
                    </button>
                  </>
                )}
                {cueReviewStatus === 'manual' && (
                  <>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--dash-bg-hover)', color: 'var(--dash-text-secondary)', border: '1px solid var(--dash-border)' }}>
                      Manually edited
                    </span>
                    <button
                      type="button"
                      onClick={() => acceptCueTranslation(selectedSubtitleLanguage, cue.id)}
                      className="text-xs px-2 py-0.5 rounded-full transition"
                      style={{ backgroundColor: 'var(--dash-status-approved-bg)', color: 'var(--dash-status-approved)', border: '1px solid var(--dash-status-approved)' }}
                    >
                      Accept
                    </button>
                  </>
                )}
                {cueReviewStatus === 'accepted' && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--dash-status-approved-bg)', color: 'var(--dash-status-approved)', border: '1px solid var(--dash-status-approved)' }}>
                    ✓ Accepted
                  </span>
                )}
              </div>
            )}

            {/* ── Style / Position / Karaoke — shown only when cue is active ── */}
            {isActive && (
              <div
                className="mx-3 mb-3 mt-1 rounded-md px-3 py-2 grid grid-cols-2 md:grid-cols-4 gap-2"
                style={{ backgroundColor: 'var(--dash-bg-primary)', border: '1px solid var(--dash-border)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Style pack */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Style</label>
                  <select
                    value={cueStyleName}
                    onChange={(e) => setCueMetadata(cue.id, { styleName: e.target.value })}
                    className="form-input text-xs w-full"
                  >
                    {styleNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Alignment */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Alignment</label>
                  <select
                    value={cueMeta.alignment ?? cueStylePack.alignment ?? 2}
                    onChange={(e) => setCueMetadata(cue.id, { alignment: Number(e.target.value) })}
                    className="form-input text-xs w-full"
                  >
                    <option value={7}>Top Left</option>
                    <option value={8}>Top Center</option>
                    <option value={9}>Top Right</option>
                    <option value={4}>Mid Left</option>
                    <option value={5}>Mid Center</option>
                    <option value={6}>Mid Right</option>
                    <option value={1}>Bot Left</option>
                    <option value={2}>Bot Center</option>
                    <option value={3}>Bot Right</option>
                  </select>
                </div>

                {/* Position X/Y */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Position X / Y</label>
                  <div className="flex gap-1 items-center">
                    <input
                      type="number" min={0} max={100} step="0.1"
                      value={Number.isFinite(cueMeta.positionX) ? cueMeta.positionX : ''}
                      onChange={(e) => setCueMetadata(cue.id, { positionX: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="form-input text-xs"
                      placeholder="X" style={{ width: '52px' }}
                    />
                    <input
                      type="number" min={0} max={100} step="0.1"
                      value={Number.isFinite(cueMeta.positionY) ? cueMeta.positionY : ''}
                      onChange={(e) => setCueMetadata(cue.id, { positionY: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="form-input text-xs"
                      placeholder="Y" style={{ width: '52px' }}
                    />
                    {hasPosition && (
                      <button
                        type="button"
                        onClick={() => setCueMetadata(cue.id, { positionX: undefined, positionY: undefined })}
                        className="text-xs px-1.5 py-1 rounded"
                        style={{ backgroundColor: 'var(--dash-status-rejected-bg)', color: 'var(--dash-status-rejected)' }}
                        title="Clear position override"
                      >✕</button>
                    )}
                  </div>
                </div>

                {/* Karaoke */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--dash-text-muted)' }}>Karaoke</label>
                  <select
                    value={cueMeta.karaokeEffect || 'none'}
                    onChange={(e) => setCueMetadata(cue.id, { karaokeEffect: e.target.value })}
                    className="form-input text-xs w-full"
                  >
                    <option value="none">Off</option>
                    <option value="kf">Sweep (\kf)</option>
                    <option value="k">Step (\k)</option>
                    <option value="ko">Outline (\ko)</option>
                  </select>
                  {cueMeta.karaokeEffect && cueMeta.karaokeEffect !== 'none' && (
                    <input
                      type="text"
                      value={cueMeta.karaokeDurationsMs || ''}
                      onChange={(e) => setCueMetadata(cue.id, { karaokeDurationsMs: e.target.value })}
                      className="form-input text-xs w-full mt-1"
                      placeholder="ms/word e.g. 320,260,420"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
