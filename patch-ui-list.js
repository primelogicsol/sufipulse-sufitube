const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the type
content = content.replace(/alreadyImported\?: boolean;/g, `alreadyImported?: boolean;
  reconciliationStatus?: 'matched' | 'youtube_only' | 'metadata_mismatch' | 'duplicate';
  cmsReleaseId?: string;`);

// 2. Redesign "Select All"
content = content.replace(/const selectAllFetchedVideos = \(\) => \{\s*setSelectedVideoIds\(new Set\(youtubeVideos\.map\(\(video\) => video\.id\)\)\);\s*\};/g, `const selectAllUnsaved = () => {
    setSelectedVideoIds(new Set(youtubeVideos.filter(v => v.reconciliationStatus === 'youtube_only' || !v.alreadyImported).map(v => v.id)));
  };

  const selectMetadataUpdates = () => {
    setSelectedVideoIds(new Set(youtubeVideos.filter(v => v.reconciliationStatus === 'metadata_mismatch').map(v => v.id)));
  };`);

// Update the buttons in youtubePanelOpen
const replaceSelectAllRegex = /<button\s+type="button"\s+onClick=\{selectAllFetchedVideos\}[\s\S]*?<\/button>/;
const newSelectAll = `<button
                  type="button"
                  onClick={selectAllUnsaved}
                  className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2"
                >
                  <CheckSquare size={14} /> Select All Unsaved
                </button>
                <button
                  type="button"
                  onClick={selectMetadataUpdates}
                  className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2"
                >
                  <RefreshCw size={14} /> Select Updates
                </button>`;
content = content.replace(replaceSelectAllRegex, newSelectAll);

// 3. Redesign the row mapping for youtubeVideos
const rowRegex = /\{video\.alreadyImported && \(\s*<p className="text-xs mt-1" style=\{\{ color: 'var\(--dash-status-approved\)' \}\}>\s*Already in CMS \(import will update metadata only\)\s*<\/p>\s*\)\}/g;
const newRow = `{!video.alreadyImported || video.reconciliationStatus === 'youtube_only' ? (
                        <p className="text-xs mt-1 font-bold text-amber-500">NEW → Select to Import</p>
                      ) : video.reconciliationStatus === 'metadata_mismatch' ? (
                        <div className="mt-1 flex items-center gap-3">
                          <p className="text-xs font-bold text-blue-400">CHANGED → Update Available</p>
                          {video.cmsReleaseId && (
                            <a href={\`/admin/cms-releases/\${video.cmsReleaseId}\`} target="_blank" rel="noreferrer" className="text-xs underline text-neutral-400 hover:text-white" onClick={e => e.stopPropagation()}>View CMS Record</a>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-3">
                          <p className="text-xs font-bold text-emerald-400">✓ SAVED IN CMS (Up to Date)</p>
                          {video.cmsReleaseId && (
                            <a href={\`/admin/cms-releases/\${video.cmsReleaseId}\`} target="_blank" rel="noreferrer" className="text-xs underline text-neutral-400 hover:text-white" onClick={e => e.stopPropagation()}>View CMS Record</a>
                          )}
                        </div>
                      )}`;
content = content.replace(rowRegex, newRow);

fs.writeFileSync(file, content);
