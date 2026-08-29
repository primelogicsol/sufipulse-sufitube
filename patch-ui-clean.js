const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/useState<string \| null>/g, 'useState<React.ReactNode | null>');

const formatFunc = `  const formatVerificationMessage = (data: any, selectedCount: number) => {
    const savedCount = data.importedCount || 0;
    const verifiedCount = data.verifiedCount ?? savedCount;
    const isComplete = verifiedCount === savedCount && savedCount === selectedCount;
    
    if (isComplete) {
      return (
        <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-lg text-sm text-emerald-200 font-mono mb-4">
          <div>✓ Selected:            {selectedCount}</div>
          <div>✓ CMS imported:        {savedCount}</div>
          <div>✓ Persisted:           {savedCount}</div>
          <div>✓ Read-back verified:  {verifiedCount}</div>
          <div className="mt-3 text-emerald-400 font-bold">Registry saved successfully.</div>
        </div>
      );
    } else {
      const failed = savedCount - verifiedCount;
      return (
        <div className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-lg text-sm text-rose-200 font-mono mb-4">
          <div className="text-rose-400 font-bold mb-2">⚠ Import incomplete</div>
          <div>Selected:   {selectedCount}</div>
          <div>Saved:      {savedCount}</div>
          <div>Verified:   {verifiedCount}</div>
          <div className="mt-3 text-rose-400">{failed > 0 ? failed : selectedCount - savedCount} releases failed persistence verification.</div>
        </div>
      );
    }
  };\n`;

content = content.replace(/export default function CMSReleasesPage\(\) \{/, `export default function CMSReleasesPage() {\n${formatFunc}`);

content = content.replace(/setYoutubeMessage\(\`Imported \$\{data\.importedCount \|\| 0\} video\(s\) into CMS releases\.\`\);/g, `setYoutubeMessage(formatVerificationMessage(data, ids.length));`);
content = content.replace(/setLiveMessage\(\`Imported \$\{data\.importedCount \|\| 0\} live stream\(s\) as CMS releases\.\`\);/g, `setLiveMessage(formatVerificationMessage(data, ids.length));`);
content = content.replace(/setPlaylistMessage\(\`Imported \$\{data\.importedCount \|\| 0\} playlist\(s\) as CMS releases\.\`\);/g, `setPlaylistMessage(formatVerificationMessage(data, ids.length));`);

content = content.replace(/Importing\.\.\.' : \`Import Selected/g, "Importing...' : `Import & Save Selected");
content = content.replace(/Import Selected \(/g, "Import & Save Selected (");

content = content.replace(/\{youtubeMessage && \(\s*<p className="text-sm mb-3" style={{ color: 'var\(--dash-text-secondary\)' }}>\{youtubeMessage\}<\/p>\s*\)/g, 
`{youtubeMessage && (
  typeof youtubeMessage === 'string' ? 
    <p className="text-sm mb-3" style={{ color: 'var(--dash-text-secondary)' }}>{youtubeMessage}</p> : 
    youtubeMessage
)`);

content = content.replace(/\{liveMessage && <p className="text-sm mb-3" style={{ color: 'var\(--dash-text-secondary\)' }}>\{liveMessage\}<\/p>\}/g, 
`{liveMessage && (
  typeof liveMessage === 'string' ? 
    <p className="text-sm mb-3" style={{ color: 'var(--dash-text-secondary)' }}>{liveMessage}</p> : 
    liveMessage
)}`);

content = content.replace(/\{playlistMessage && \(\s*<p className="text-sm mb-3" style={{ color: 'var\(--dash-text-secondary\)' }}>\{playlistMessage\}<\/p>\s*\)/g, 
`{playlistMessage && (
  typeof playlistMessage === 'string' ? 
    <p className="text-sm mb-3" style={{ color: 'var(--dash-text-secondary)' }}>{playlistMessage}</p> : 
    playlistMessage
)`);

fs.writeFileSync(file, content);
