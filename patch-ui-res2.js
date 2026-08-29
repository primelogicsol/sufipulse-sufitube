const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add resolutions state
content = content.replace(/const \[youtubeMessage, setYoutubeMessage\]/g, `const [resolutions, setResolutions] = useState<Record<string, 'youtube' | 'cms'>>({});
  const [youtubeMessage, setYoutubeMessage]`);

// 2. Add resolutions to POST body
content = content.replace(/body: JSON\.stringify\(\{ videoIds: ids \}\),/g, `body: JSON.stringify({ videoIds: ids, resolutions }),`);
content = content.replace(/body: JSON\.stringify\(\{ playlistIds: ids \}\),/g, `body: JSON.stringify({ playlistIds: ids, resolutions }),`);

// 3. Update the type for CMS data
content = content.replace(/cmsReleaseId\?: string;/g, `cmsReleaseId?: string;
  cmsData?: { title: string; description: string; youtubeTitle?: string };`);

// 4. Update the UI
const oldUi = `) : video.reconciliationStatus === 'metadata_mismatch' ? (
                        <div className="mt-1 flex items-center gap-3">
                          <p className="text-xs font-bold text-blue-400">CHANGED → Update Available</p>
                          {video.cmsReleaseId && (
                            <a href={\`/admin/cms-releases/\${video.cmsReleaseId}\`} target="_blank" rel="noreferrer" className="text-xs underline text-neutral-400 hover:text-white" onClick={e => e.stopPropagation()}>View CMS Record</a>
                          )}
                        </div>
                      ) : (`;

const newUi = `) : video.reconciliationStatus === 'metadata_mismatch' ? (
                        <div className="mt-1">
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-bold text-blue-400">CHANGED → Update Available</p>
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
                                  {resolutions[video.id] === 'youtube' ? '✓ Use YouTube' : 'Use YouTube'}
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setResolutions(prev => ({ ...prev, [video.id]: 'cms' }))}
                                  className={\`px-3 py-1 rounded border \${resolutions[video.id] === 'cms' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'border-neutral-700 text-neutral-400 hover:bg-neutral-800'}\`}
                                >
                                  {resolutions[video.id] === 'cms' ? '✓ Keep CMS' : 'Keep CMS'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (`;

content = content.replace(oldUi, newUi);

fs.writeFileSync(file, content);
