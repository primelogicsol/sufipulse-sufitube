const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// The `youtubeMessage` needs to handle HTML. It's a string, so we'll use `dangerouslySetInnerHTML` or change the type to `React.ReactNode`.
// Wait, `ReactNode` is better.
content = content.replace(/useState<string \| null>/g, 'useState<React.ReactNode | null>');

function buildMessage(name) {
  return `
    const formatMessage = (data: any, selectedCount: number) => {
      const savedCount = data.importedCount || 0;
      const verifiedCount = data.verifiedCount ?? savedCount;
      const isComplete = verifiedCount === savedCount && savedCount === selectedCount;
      
      if (isComplete) {
        return (
          <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-lg text-sm text-emerald-200 font-mono">
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
          <div className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-lg text-sm text-rose-200 font-mono">
            <div className="text-rose-400 font-bold mb-2">⚠ Import incomplete</div>
            <div>Selected:   {selectedCount}</div>
            <div>Saved:      {savedCount}</div>
            <div>Verified:   {verifiedCount}</div>
            <div className="mt-3 text-rose-400">{failed} releases failed persistence verification.</div>
          </div>
        );
      }
    };
  `;
}

// Just inject the helper at the top of the component
content = content.replace(/export default function CMSReleasesPage\(\) \{/, `export default function CMSReleasesPage() {
  const formatVerificationMessage = (data: any, selectedCount: number) => {
    const savedCount = data.importedCount || 0;
    const verifiedCount = data.verifiedCount ?? savedCount;
    const isComplete = verifiedCount === savedCount && savedCount === selectedCount;
    
    if (isComplete) {
      return (
        <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-lg text-sm text-emerald-200 font-mono">
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
        <div className="bg-rose-950/40 border border-rose-800/50 p-4 rounded-lg text-sm text-rose-200 font-mono">
          <div className="text-rose-400 font-bold mb-2">⚠ Import incomplete</div>
          <div>Selected:   {selectedCount}</div>
          <div>Saved:      {savedCount}</div>
          <div>Verified:   {verifiedCount}</div>
          <div className="mt-3 text-rose-400">{failed > 0 ? failed : selectedCount - savedCount} releases failed persistence verification.</div>
        </div>
      );
    }
  };`);

// Update importSelectedFromYouTube
content = content.replace(/setYoutubeMessage\(\`Imported \$\{data\.importedCount \|\| 0\} video\(s\) into CMS releases\.\`\);/g, `setYoutubeMessage(formatVerificationMessage(data, ids.length));`);

// Update importSelectedLive
content = content.replace(/setLiveMessage\(\`Imported \$\{data\.importedCount \|\| 0\} live stream\(s\) as CMS releases\.\`\);/g, `setLiveMessage(formatVerificationMessage(data, ids.length));`);

// Update importSelectedPlaylists
content = content.replace(/setPlaylistMessage\(\`Imported \$\{data\.importedCount \|\| 0\} playlist\(s\) as CMS releases\.\`\);/g, `setPlaylistMessage(formatVerificationMessage(data, ids.length));`);

// The user also wanted to change "Audio Releases notice" location or just leave it for now.
// "The Audio Releases notice can remain but should probably sit as guidance near Format editing, rather than appearing as though it is another database."
// I will just leave it as is or remove it from the top level since I already deleted it.

fs.writeFileSync(file, content);
