"use client";

import type { CMSRelease } from '@/lib/cms-storage';
import {
  type ASSStylePack,
  DEFAULT_STYLE_NAME,
} from './release-constants';

type Props = {
  form: Partial<CMSRelease>;
  activeStyleName: string;
  activeStyle: ASSStylePack;
  styleNames: string[];
  selectedSubtitleLanguage: string;
  setSelectedStyleName: (name: string) => void;
  updateStylePack: (styleName: string, patch: Partial<ASSStylePack>) => void;
  addStylePack: () => void;
  removeStylePack: (styleName: string) => void;
  onRenameStyle: (oldName: string, newName: string) => void;
  applyCueMetadataToAllCues: (patch: Record<string, any>, options?: object) => void;
  setLanguageStylePack: (language: string, stylePack: string) => void;
};

export function ASSStyleLibrarySection({
  form,
  activeStyleName,
  activeStyle,
  styleNames,
  selectedSubtitleLanguage,
  setSelectedStyleName,
  updateStylePack,
  addStylePack,
  removeStylePack,
  onRenameStyle,
  applyCueMetadataToAllCues,
  setLanguageStylePack,
}: Props) {
  return (
    <div className="mb-6 rounded-lg p-4 space-y-4" style={{border: '1px solid var(--dash-border)', backgroundColor: 'var(--dash-bg-secondary)'}}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{color: 'var(--dash-text-primary)'}}>ASS Style Library & Location Control</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => applyCueMetadataToAllCues(
              {
                styleName: activeStyleName,
                alignment: Number(activeStyle.alignment || 2),
              },
              {
                successMessage: `Applied ${activeStyleName} style to all cues.`,
                defaultStyleName: activeStyleName,
                defaultAlignment: Number(activeStyle.alignment || 2),
                language: selectedSubtitleLanguage,
              }
            )}
            className="dashboard-btn-secondary px-2 py-1 text-xs"
          >
            Apply To All Cues
          </button>
          <button
            type="button"
            onClick={() => applyCueMetadataToAllCues({}, {
              clearPosition: true,
              successMessage: 'Cleared position overrides for all cues.',
            })}
            className="dashboard-btn-secondary px-2 py-1 text-xs"
          >
            Clear All Positions
          </button>
          <button
            type="button"
            onClick={addStylePack}
            className="dashboard-btn-primary px-2 py-1 text-xs"
          >
            Add Style
          </button>
          <button
            type="button"
            onClick={() => removeStylePack(activeStyleName)}
            disabled={activeStyleName === DEFAULT_STYLE_NAME}
            className="dashboard-btn-danger px-2 py-1 text-xs disabled:opacity-50"
          >
            Delete Style
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Selected Style</label>
          <select
            value={activeStyleName}
            onChange={(e) => setSelectedStyleName(e.target.value)}
            className="form-input w-full"
          >
            {styleNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Style Name</label>
          <input
            type="text"
            value={activeStyleName}
            onChange={(e) => {
              const nextName = e.target.value.trim();
              if (!nextName || nextName === activeStyleName) return;
              onRenameStyle(activeStyleName, nextName);
            }}
            className="form-input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Language Default Style</label>
          <select
            value={form.languageStyleOverrides?.[selectedSubtitleLanguage]?.stylePack || ''}
            onChange={(e) => setLanguageStylePack(selectedSubtitleLanguage, e.target.value)}
            className="form-input w-full"
          >
            <option value="">None</option>
            {styleNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{color: 'var(--dash-text-primary)'}}>Alignment</label>
          <select
            value={activeStyle.alignment || 2}
            onChange={(e) => updateStylePack(activeStyleName, { alignment: Number(e.target.value) })}
            className="form-input w-full"
          >
            <option value={1}>Bottom Left (1)</option>
            <option value={2}>Bottom Center (2)</option>
            <option value={3}>Bottom Right (3)</option>
            <option value={4}>Middle Left (4)</option>
            <option value={5}>Middle Center (5)</option>
            <option value={6}>Middle Right (6)</option>
            <option value={7}>Top Left (7)</option>
            <option value={8}>Top Center (8)</option>
            <option value={9}>Top Right (9)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Font</label>
          <input
            type="text"
            value={activeStyle.fontFamily || ''}
            onChange={(e) => updateStylePack(activeStyleName, { fontFamily: e.target.value })}
            className="form-input"
            placeholder="Font family"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Size</label>
          <input
            type="number"
            value={activeStyle.fontSize || 42}
            onChange={(e) => updateStylePack(activeStyleName, { fontSize: Number(e.target.value || 42) })}
            className="form-input"
            placeholder="Font size"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Text Color</label>
          <input
            type="color"
            value={activeStyle.primaryColor || '#FFFFFF'}
            onChange={(e) => updateStylePack(activeStyleName, { primaryColor: e.target.value })}
            className="h-10 w-full px-1 py-1 rounded"
            style={{border: '1px solid var(--dash-border)'}}
            title="Primary color"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Outline Color</label>
          <input
            type="color"
            value={activeStyle.outlineColor || '#202020'}
            onChange={(e) => updateStylePack(activeStyleName, { outlineColor: e.target.value })}
            className="h-10 w-full px-1 py-1 rounded"
            style={{border: '1px solid var(--dash-border)'}}
            title="Outline color"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Background</label>
          <input
            type="color"
            value={activeStyle.backColor || '#000000'}
            onChange={(e) => updateStylePack(activeStyleName, { backColor: e.target.value })}
            className="h-10 w-full px-1 py-1 rounded"
            style={{border: '1px solid var(--dash-border)'}}
            title="Background color"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Outline</label>
          <input
            type="number"
            value={activeStyle.outline || 2}
            onChange={(e) => updateStylePack(activeStyleName, { outline: Number(e.target.value || 0) })}
            className="form-input"
            placeholder="Outline"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Shadow</label>
          <input
            type="number"
            value={activeStyle.shadow || 0}
            onChange={(e) => updateStylePack(activeStyleName, { shadow: Number(e.target.value || 0) })}
            className="form-input"
            placeholder="Shadow"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Margin L</label>
          <input
            type="number"
            value={activeStyle.marginL || 40}
            onChange={(e) => updateStylePack(activeStyleName, { marginL: Number(e.target.value || 0) })}
            className="form-input"
            placeholder="Margin L"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Margin R</label>
          <input
            type="number"
            value={activeStyle.marginR || 40}
            onChange={(e) => updateStylePack(activeStyleName, { marginR: Number(e.target.value || 0) })}
            className="form-input"
            placeholder="Margin R"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Margin V</label>
          <input
            type="number"
            value={activeStyle.marginV || 28}
            onChange={(e) => updateStylePack(activeStyleName, { marginV: Number(e.target.value || 0) })}
            className="form-input"
            placeholder="Margin V"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Panel Width % (30-200)</label>
          <input
            type="number"
            min={30}
            max={200}
            value={activeStyle.maxWidthPercent || 82}
            onChange={(e) => updateStylePack(activeStyleName, { maxWidthPercent: Number(e.target.value || 82) })}
            className="form-input"
            placeholder="Panel width %"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{color: 'var(--dash-text-muted)'}}>Panel Width Slider</label>
          <input
            type="range"
            min={30}
            max={200}
            step={1}
            value={Math.max(30, Math.min(200, Number(activeStyle.maxWidthPercent || 82)))}
            onChange={(e) => updateStylePack(activeStyleName, { maxWidthPercent: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button
            type="button"
            onClick={() => applyCueMetadataToAllCues({ alignment: 2 }, { successMessage: 'Set all cues to Bottom Center.' })}
            className="dashboard-btn-secondary px-2 py-1 text-xs"
          >
            Bottom Center Preset
          </button>
          <button
            type="button"
            onClick={() => applyCueMetadataToAllCues({ alignment: 8 }, { successMessage: 'Set all cues to Top Center.' })}
            className="dashboard-btn-secondary px-2 py-1 text-xs"
          >
            Top Center Preset
          </button>
          <button
            type="button"
            onClick={() => applyCueMetadataToAllCues({ alignment: 5 }, { successMessage: 'Set all cues to Middle Center.' })}
            className="dashboard-btn-secondary px-2 py-1 text-xs"
          >
            Middle Center Preset
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <label className="inline-flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
          <input
            type="checkbox"
            checked={!!activeStyle.bold}
            onChange={(e) => updateStylePack(activeStyleName, { bold: e.target.checked })}
            style={{accentColor: 'var(--dash-accent)'}}
          />
          Bold
        </label>
        <label className="inline-flex items-center gap-2" style={{color: 'var(--dash-text-primary)'}}>
          <input
            type="checkbox"
            checked={!!activeStyle.italic}
            onChange={(e) => updateStylePack(activeStyleName, { italic: e.target.checked })}
            style={{accentColor: 'var(--dash-accent)'}}
          />
          Italic
        </label>
      </div>
    </div>
  );
}
