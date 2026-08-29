const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Types
content = content.replace(/\| 'canonical_override'/g, `| 'admin_override'`);

// Logic
content = content.replace(/const overrideVideos = youtubeVideos\.filter\(v => v\.reconciliationStatus === 'canonical_override'\);/g, `const overrideVideos = youtubeVideos.filter(v => v.reconciliationStatus === 'admin_override');`);
content = content.replace(/v\.reconciliationStatus === 'canonical_override'/g, `v.reconciliationStatus === 'admin_override'`);

// Header
content = content.replace(/<span className="text-purple-400 text-lg">\{overrideVideos\.length\}<\/span>/, `<span className="text-purple-400 text-lg">{overrideVideos.length}</span>`);

// Remove resolution UI for overrides because they are permanent admin overrides now, they don't need conflict resolution from picker
const uiRegex = /\) : video\.reconciliationStatus === 'metadata_mismatch' \|\| video\.reconciliationStatus === 'admin_override' \? \([\s\S]*?\{video\.cmsData && selectedVideoIds\.has\(video\.id\) && \([\s\S]*?<\/div>\s*\)\s*\}\s*<\/div>\s*\)\s*:\s*\(/;

const newUi = `) : video.reconciliationStatus === 'metadata_mismatch' ? (
                        <div className="mt-1">
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-bold text-blue-400">
                              CHANGED → Update Available
                            </p>
                            {video.cmsReleaseId && (
                              <a href={\`/admin/cms-releases/\${video.cmsReleaseId}\`} target="_blank" rel="noreferrer" className="text-xs underline text-neutral-400 hover:text-white" onClick={e => e.stopPropagation()}>View CMS Record</a>
                            )}
                          </div>
                        </div>
                      ) : video.reconciliationStatus === 'admin_override' ? (
                        <div className="mt-1">
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-bold text-purple-400">
                              ✓ YOUTUBE SYNCED (⚠ ADMIN OVERRIDE)
                            </p>
                            {video.cmsReleaseId && (
                              <a href={\`/admin/cms-releases/\${video.cmsReleaseId}\`} target="_blank" rel="noreferrer" className="text-xs underline text-neutral-400 hover:text-white" onClick={e => e.stopPropagation()}>View CMS Record</a>
                            )}
                          </div>
                        </div>
                      ) : (`;

content = content.replace(uiRegex, newUi);

// Table column
content = content.replace(/<span className="text-\[10px\] font-mono bg-neutral-800 text-neutral-400 px-1 rounded mr-2">CMS Canonical<\/span>/g, `<span className="text-[10px] font-mono bg-neutral-800 text-purple-400 px-1 rounded mr-2 border border-purple-500/30">ADMIN OVERRIDE</span>`);

fs.writeFileSync(file, content);
