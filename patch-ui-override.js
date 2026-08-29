const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update type
content = content.replace(/reconciliationStatus\?: 'matched' \| 'youtube_only' \| 'metadata_mismatch' \| 'duplicate';/g, `reconciliationStatus?: 'matched' | 'youtube_only' | 'metadata_mismatch' | 'duplicate' | 'canonical_override';`);

// Update logic
content = content.replace(/const updateVideos = youtubeVideos\.filter\(v => v\.reconciliationStatus === 'metadata_mismatch'\);/g, `const updateVideos = youtubeVideos.filter(v => v.reconciliationStatus === 'metadata_mismatch');
  const overrideVideos = youtubeVideos.filter(v => v.reconciliationStatus === 'canonical_override');`);

// Update unresolved conflicts
content = content.replace(/const unresolvedConflicts = youtubeVideos\.filter\(v => \s*selectedVideoIds\.has\(v\.id\) && \s*v\.reconciliationStatus === 'metadata_mismatch' && \s*!resolutions\[v\.id\]\s*\)\.length;/g, `const unresolvedConflicts = youtubeVideos.filter(v => 
    selectedVideoIds.has(v.id) && 
    (v.reconciliationStatus === 'metadata_mismatch' || v.reconciliationStatus === 'canonical_override') && 
    !resolutions[v.id]
  ).length;`);

// Update toolbar display
content = content.replace(/<div className="grid grid-cols-5 gap-4 mb-4 font-mono text-sm">[\s\S]*?<\/div>\s*<\/div>\s*\{newVideos\.length === 0/g, `<div className="grid grid-cols-6 gap-4 mb-4 font-mono text-sm">
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">Fetched</span>
                        <span className="text-white text-lg">{youtubeCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">New</span>
                        <span className="text-amber-400 text-lg">{newVideos.length}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">YT Updates</span>
                        <span className="text-blue-400 text-lg">{updateVideos.length}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">Overrides</span>
                        <span className="text-purple-400 text-lg">{overrideVideos.length}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">Fully Aligned</span>
                        <span className="text-emerald-400 text-lg">{upToDateVideos.length}</span>
                      </div>
                      <div className="flex flex-col border-l border-neutral-800 pl-4">
                        <span className="text-neutral-500 text-xs">Selected</span>
                        <span className="text-white text-lg">{selectedCount}</span>
                      </div>
                    </div>
                    
                    {newVideos.length === 0 && updateVideos.length === 0 && overrideVideos.length === 0 &&`);

// Also change "All 95 fetched YouTube videos are already synchronized with CMS." to reflect fully aligned.
content = content.replace(/✓ All \{youtubeCount\} fetched YouTube videos are already synchronized with CMS. Nothing currently requires import or update./g, `✓ All {youtubeCount} YouTube videos are fully aligned with CMS. Nothing currently requires import or update.`);

// Change UI rendering of the list item
const uiRegex = /\) : video\.reconciliationStatus === 'metadata_mismatch' \? \([\s\S]*?\{video\.cmsData && selectedVideoIds\.has\(video\.id\) && \([\s\S]*?<\/div>\s*\)\s*\}\s*<\/div>\s*\)\s*:\s*\(/;

const newUi = `) : video.reconciliationStatus === 'metadata_mismatch' || video.reconciliationStatus === 'canonical_override' ? (
                        <div className="mt-1">
                          <div className="flex items-center gap-3">
                            <p className={\`text-xs font-bold \${video.reconciliationStatus === 'canonical_override' ? 'text-purple-400' : 'text-blue-400'}\`}>
                              {video.reconciliationStatus === 'canonical_override' ? '✓ YOUTUBE SYNCED (⚠ CMS CANONICAL OVERRIDE)' : 'CHANGED → Update Available'}
                            </p>
                            {video.cmsReleaseId && (
                              <a href={\`/admin/cms-releases/\${video.cmsReleaseId}\`} target="_blank" rel="noreferrer" className="text-xs underline text-neutral-400 hover:text-white" onClick={e => e.stopPropagation()}>View CMS Record</a>
                            )}
                          </div>
                          
                          {/* Resolution UI */}
                          {video.cmsData && selectedVideoIds.has(video.id) && (
                            <div className="mt-3 p-3 bg-[#13151a] border border-neutral-700 rounded text-xs space-y-2 cursor-default" onClick={e => e.stopPropagation()}>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="font-semibold text-neutral-400 block mb-1">YouTube Metadata:</span>
                                  <div className="text-white break-words">{video.title}</div>
                                </div>
                                <div>
                                  <span className="font-semibold text-neutral-400 block mb-1">CMS Canonical:</span>
                                  <div className="text-white break-words">{video.cmsData.title}</div>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-neutral-800">
                                <button 
                                  type="button"
                                  onClick={() => setResolutions(prev => ({ ...prev, [video.id]: 'youtube' }))}
                                  className={\`px-3 py-1 rounded border \${resolutions[video.id] === 'youtube' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'}\`}
                                >
                                  {resolutions[video.id] === 'youtube' ? '✓ Adopt YouTube as Canonical' : 'Adopt YouTube as Canonical'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setResolutions(prev => ({ ...prev, [video.id]: 'cms' }))}
                                  className={\`px-3 py-1 rounded border \${resolutions[video.id] === 'cms' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'}\`}
                                >
                                  {resolutions[video.id] === 'cms' ? '✓ Keep CMS Canonical' : 'Keep CMS Canonical'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (`;

content = content.replace(uiRegex, newUi);

// Change `✓ SAVED IN CMS (Up to Date)` to `✓ FULLY ALIGNED (YouTube & CMS match)`
content = content.replace(/✓ SAVED IN CMS \(Up to Date\)/g, `✓ FULLY ALIGNED (YouTube & CMS match)`);

fs.writeFileSync(file, content);
