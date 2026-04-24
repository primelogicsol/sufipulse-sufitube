import type { Dispatch, SetStateAction } from 'react';

type KaraokeEffect = 'none' | 'k' | 'kf' | 'ko';

type Props = {
  subtitleCueIds: string[];
  selectedCueIds: Set<string>;
  setSelectedCueIds: Dispatch<SetStateAction<Set<string>>>;
  duplicateSelectedCues: () => void;
  deletSelectedCues: () => void;
  deleteAllCues: () => void;
  shiftTimingOffset: number;
  setShiftTimingOffset: Dispatch<SetStateAction<number>>;
  shiftAllCueTiming: () => void;
  bulkKaraokeEffect: KaraokeEffect;
  setBulkKaraokeEffect: Dispatch<SetStateAction<KaraokeEffect>>;
  bulkKaraokeDurationsMs: string;
  setBulkKaraokeDurationsMs: Dispatch<SetStateAction<string>>;
  applyKaraokeToAllCues: () => void;
};

export function SubtitleBulkControlsSection({
  subtitleCueIds,
  selectedCueIds,
  setSelectedCueIds,
  duplicateSelectedCues,
  deletSelectedCues,
  deleteAllCues,
  shiftTimingOffset,
  setShiftTimingOffset,
  shiftAllCueTiming,
  bulkKaraokeEffect,
  setBulkKaraokeEffect,
  bulkKaraokeDurationsMs,
  setBulkKaraokeDurationsMs,
  applyKaraokeToAllCues,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap gap-2 p-4 rounded-lg" style={{ border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)' }}>
        <div className="flex items-center text-sm" style={{ color: 'var(--dash-text-primary)' }}>
          {selectedCueIds.size > 0 && <span className="font-medium">{selectedCueIds.size} selected</span>}
        </div>
        <button
          type="button"
          onClick={() => setSelectedCueIds(new Set(subtitleCueIds))}
          className="dashboard-btn-secondary px-3 py-1 text-sm"
          disabled={subtitleCueIds.length === 0}
        >
          Select All
        </button>
        <button
          type="button"
          onClick={() => setSelectedCueIds(new Set())}
          className="dashboard-btn-secondary px-3 py-1 text-sm"
          disabled={selectedCueIds.size === 0}
        >
          Deselect All
        </button>
        <button
          type="button"
          onClick={duplicateSelectedCues}
          disabled={selectedCueIds.size === 0}
          className="dashboard-btn-secondary px-3 py-1 text-sm disabled:opacity-50"
        >
          Duplicate {selectedCueIds.size > 0 ? `(${selectedCueIds.size})` : ''}
        </button>
        <button
          type="button"
          onClick={deletSelectedCues}
          disabled={selectedCueIds.size === 0}
          className="dashboard-btn-danger px-3 py-1 text-sm disabled:opacity-50"
        >
          Delete {selectedCueIds.size > 0 ? `(${selectedCueIds.size})` : ''}
        </button>
        <button
          type="button"
          onClick={deleteAllCues}
          className="dashboard-btn-danger px-3 py-1 text-sm ml-auto"
        >
          Delete All Cues
        </button>
      </div>

      <div className="flex gap-2 p-3 rounded-lg" style={{ border: '1px solid var(--dash-status-pending)', backgroundColor: 'var(--dash-status-pending-bg)' }}>
        <input
          type="number"
          value={shiftTimingOffset}
          onChange={(e) => setShiftTimingOffset(Number(e.target.value || 0))}
          step="0.1"
          className="form-input flex-1 text-sm"
          placeholder="Seconds to shift all cues (e.g., 1.5 or -2)"
        />
        <button
          type="button"
          onClick={shiftAllCueTiming}
          disabled={shiftTimingOffset === 0 || subtitleCueIds.length === 0}
          className="dashboard-btn-primary px-4 py-1 text-sm disabled:opacity-50"
        >
          Shift Timing
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 rounded-lg" style={{ border: '1px solid var(--dash-accent-muted)', backgroundColor: 'var(--dash-bg-secondary)' }}>
        <select
          value={bulkKaraokeEffect}
          onChange={(e) => setBulkKaraokeEffect(e.target.value as KaraokeEffect)}
          className="form-input text-sm"
          title="Bulk karaoke effect"
        >
          <option value="kf">Apply Karaoke Sweep (\kf) to all cues</option>
          <option value="k">Apply Karaoke Step (\k) to all cues</option>
          <option value="ko">Apply Karaoke Outline (\ko) to all cues</option>
          <option value="none">Clear karaoke effect from all cues</option>
        </select>
        <input
          type="text"
          value={bulkKaraokeDurationsMs}
          onChange={(e) => setBulkKaraokeDurationsMs(e.target.value)}
          className="form-input text-sm md:col-span-2"
          placeholder="Optional ms/word for all cues (e.g., 320,260,420)"
          disabled={bulkKaraokeEffect === 'none'}
        />
        <button
          type="button"
          onClick={applyKaraokeToAllCues}
          className="dashboard-btn-secondary px-4 py-1 text-sm"
        >
          Apply Karaoke To All Cues
        </button>
      </div>
    </>
  );
}
