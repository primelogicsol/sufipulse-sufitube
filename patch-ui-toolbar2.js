const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add youtubeLastRefreshed state
content = content.replace(/const \[resolutions, setResolutions\] = useState<Record<string, 'youtube' \| 'cms'>>\(\{\}\);/, `const [resolutions, setResolutions] = useState<Record<string, 'youtube' | 'cms'>>({});
  const [youtubeLastRefreshed, setYoutubeLastRefreshed] = useState<string | null>(null);`);

// 2. Add options parameter to fetchYouTubeVideos
content = content.replace(/const fetchYouTubeVideos = async \(\) => \{/g, `const fetchYouTubeVideos = async (options?: { preserveMessage?: boolean }) => {`);

// Inside fetchYouTubeVideos, handle preserveMessage properly.
content = content.replace(/setLoadingYouTube\(true\);\s*setYoutubeMessage\(null\);/g, `setLoadingYouTube(true);
      if (!options?.preserveMessage) {
        setYoutubeMessage(null);
      }`);

content = content.replace(/setYoutubePanelOpen\(true\);\s*setSelectedVideoIds\(new Set\(\)\);\s*setYoutubeMessage\(\`Fetched \$\{data\.count \|\| 0\} videos from YouTube \(large channel scan\)\.\`\);/g, `setYoutubePanelOpen(true);
      if (!options?.preserveMessage) {
        setSelectedVideoIds(new Set());
        setResolutions({});
        setYoutubeMessage(\`Fetched \${data.count || 0} videos from YouTube (large channel scan).\`);
        setYoutubeLastRefreshed(new Date().toLocaleTimeString());
      }`);

// We also need to fix catch block if we wanted, but not strictly necessary for preserveMessage as error can overwrite.
// But we'll leave catch alone.

// 3. Update importSelectedFromYouTube
content = content.replace(/setYoutubeMessage\(formatVerificationMessage\(data, ids\.length\)\);\s*await loadReleases\(\);\s*await fetchYouTubeVideos\(\);/g, `await loadReleases();
        await fetchYouTubeVideos({ preserveMessage: true });
        setYoutubeMessage(formatVerificationMessage(data, ids.length));
        setSelectedVideoIds(new Set());
        setResolutions({});`);

// 4. Update the computed properties and buttons logic
const newMethods = `  const youtubeCount = youtubeVideos.length;
  const newVideos = youtubeVideos.filter(v => v.reconciliationStatus === 'youtube_only' || !v.alreadyImported);
  const updateVideos = youtubeVideos.filter(v => v.reconciliationStatus === 'metadata_mismatch');
  const upToDateVideos = youtubeVideos.filter(v => v.reconciliationStatus === 'matched');
  const selectedCount = selectedVideoIds.size;
  
  const unresolvedConflicts = youtubeVideos.filter(v => 
    selectedVideoIds.has(v.id) && 
    v.reconciliationStatus === 'metadata_mismatch' && 
    !resolutions[v.id]
  ).length;

  const selectAllUnsaved = () => {
    setSelectedVideoIds(new Set(newVideos.map(v => v.id)));
  };

  const selectMetadataUpdates = () => {
    setSelectedVideoIds(new Set(updateVideos.map(v => v.id)));
  };

  const clearSelectedVideos = () => {
    setSelectedVideoIds(new Set());
    setResolutions({});
  };
  
  const forceResyncAll = () => {
    if (confirm("Re-fetch current YouTube packaging for all " + youtubeCount + " records while preserving governed CMS fields?")) {
      const allIds = youtubeVideos.map(v => v.id);
      setSelectedVideoIds(new Set(allIds));
    }
  };`;

content = content.replace(/const selectAllUnsaved = \(\) => \{[\s\S]*?const clearSelectedVideos = \(\) => \{\s*setSelectedVideoIds\(new Set\(\)\);\s*\};/, newMethods);


// 5. Replace the panel header and toolbar
const headerRegex = /\{youtubePanelOpen && \(\s*<div className="mb-6 dashboard-card p-4">\s*<div className="flex flex-wrap items-center justify-between gap-3 mb-3">\s*<div>\s*<h2 className="text-lg font-semibold"[^>]*>YouTube Video Picker<\/h2>\s*<p className="text-xs"[^>]*>\s*Select real YouTube videos and import them as editable CMS releases\.\s*<\/p>\s*<\/div>\s*<div className="flex items-center gap-2">[\s\S]*?<\/div>\s*<\/div>/;

const newHeader = `{youtubePanelOpen && (
            <div className="mb-6 dashboard-card p-4">
              <div className="w-full mb-3">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--dash-text-primary)' }}>YouTube Video Picker</h2>
                    <p className="text-xs text-neutral-400 mt-1">Select real YouTube videos and import them as editable CMS releases.</p>
                  </div>
                  {youtubeLastRefreshed && !loadingYouTube && (
                    <div className="text-xs text-emerald-400 font-mono text-right">
                      ✓ Refreshed from YouTube<br/>
                      {youtubeCount} videos<br/>
                      Last refreshed: {youtubeLastRefreshed}
                    </div>
                  )}
                  {loadingYouTube && (
                    <div className="text-xs text-amber-400 font-mono animate-pulse text-right">
                      Refreshing...
                    </div>
                  )}
                </div>

                {youtubeCount > 0 && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 mb-4">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">YouTube Reconciliation</h3>
                    
                    <div className="grid grid-cols-5 gap-4 mb-4 font-mono text-sm">
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">Fetched</span>
                        <span className="text-white text-lg">{youtubeCount}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">New</span>
                        <span className="text-amber-400 text-lg">{newVideos.length}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">Updates</span>
                        <span className="text-blue-400 text-lg">{updateVideos.length}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-neutral-500 text-xs">Up to Date</span>
                        <span className="text-emerald-400 text-lg">{upToDateVideos.length}</span>
                      </div>
                      <div className="flex flex-col border-l border-neutral-800 pl-4">
                        <span className="text-neutral-500 text-xs">Selected</span>
                        <span className="text-white text-lg">{selectedCount}</span>
                      </div>
                    </div>
                    
                    {newVideos.length === 0 && updateVideos.length === 0 && (
                      <div className="text-emerald-400 text-sm font-mono mb-4">
                        ✓ All {youtubeCount} fetched YouTube videos are already synchronized with CMS. Nothing currently requires import or update.
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={selectAllUnsaved}
                        disabled={newVideos.length === 0}
                        className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <CheckSquare size={14} /> Select New ({newVideos.length})
                      </button>
                      
                      <button
                        type="button"
                        onClick={selectMetadataUpdates}
                        disabled={updateVideos.length === 0}
                        className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw size={14} /> Select Updates ({updateVideos.length})
                      </button>
                      
                      <button
                        type="button"
                        onClick={clearSelectedVideos}
                        disabled={selectedCount === 0}
                        className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <Square size={14} /> Clear ({selectedCount})
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => fetchYouTubeVideos()}
                        disabled={loadingYouTube}
                        className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={loadingYouTube ? 'animate-spin' : ''} /> {loadingYouTube ? 'Refreshing...' : 'Refresh'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={forceResyncAll}
                        className="dashboard-btn-secondary px-3 py-1.5 text-sm inline-flex items-center gap-2 text-neutral-400"
                      >
                        Advanced: Force Re-sync All
                      </button>

                      <div className="flex-grow"></div>

                      <div className="flex items-center gap-3">
                        {unresolvedConflicts > 0 && (
                          <span className="text-rose-400 text-sm font-mono font-bold">
                            {unresolvedConflicts} conflicts unresolved
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={importSelectedFromYouTube}
                          disabled={importingYouTube || selectedCount === 0 || unresolvedConflicts > 0}
                          className="dashboard-btn-primary px-4 py-1.5 text-sm inline-flex items-center gap-2 disabled:opacity-50"
                        >
                          <Download size={14} /> {importingYouTube ? 'Importing...' : \`Import & Save Selected (\${selectedCount})\`}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>`;

content = content.replace(headerRegex, newHeader);

fs.writeFileSync(file, content);
