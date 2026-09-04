const fs = require('fs');
const path = 'app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert import
const importStr = "import { FlagshipSpotlight, YouTubeRelease } from '@/app/components/releases/FlagshipSpotlight';\r\n";
if (!content.includes('FlagshipSpotlight')) {
    content = content.replace(/(import .*;\r?\n)/, '$1' + importStr);
}

// Add state for flagship release
const stateRegex = /const \[kpiStats, setKpiStats\] = useState[^;]+;/;
const stateReplacement = `const [kpiStats, setKpiStats] = useState({ releases: 91, writers: literaryArticles.length, institutions: 4 });\r\n  const [flagshipRelease, setFlagshipRelease] = useState<YouTubeRelease | null>(null);`;
content = content.replace(stateRegex, stateReplacement);

const mappingLogic = `
            if (Array.isArray(data) && data.length > 0) {
              // Find the flagship release
              const firstGoverned = data.find((r: any) => (r.governanceOrigin || (r.source === 'native' ? 'native_governed' : (r.govType || 'native_governed'))) === 'native_governed') || data[0];
              if (firstGoverned) {
                const r = firstGoverned;
                const source = r.source || 'native';
                const durationSecs = Number(r.durationSeconds || r.youtubeStats?.durationSeconds || 0);
                const formatSeconds = (totalSeconds: number): string => {
                    if (!totalSeconds) return '0:00';
                    const h = Math.floor(totalSeconds / 3600);
                    const m = Math.floor((totalSeconds % 3600) / 60);
                    const s = totalSeconds % 60;
                    if (h > 0) return \`\${h}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
                    return \`\${m}:\${s.toString().padStart(2, '0')}\`;
                };
                const durationFormatted = r.durationFormatted || r.duration || formatSeconds(durationSecs);
                const canonicalTitle = r.canonicalTitle || r.title || 'Untitled Release';
                const govType = r.governanceOrigin || (r.source === 'native' ? 'native_governed' : (r.govType || 'native_governed'));
                
                setFlagshipRelease({
                    id: r.youtubeId || r.id,
                    slug: r.slug,
                    title: canonicalTitle,
                    description: r.description || '',
                    thumbnailUrl: r.canonicalThumbnail || r.thumbnail || r.thumbnailUrl || '',
                    publishedDate: r.publishedAt || r.releaseDate || r.createdAt,
                    durationSeconds: durationSecs,
                    durationFormatted: durationFormatted,
                    views: Number(r.viewCount ?? r.views ?? 0),
                    source: source,
                    format: r.format || 'video',
                    govType: govType,
                    vocalist: typeof r.vocalist === 'string'
                        ? r.vocalist
                        : [r.vocalist?.name, r.vocalist?.nameUrdu].filter(Boolean).join(' '),
                    writer: typeof r.writer === 'string'
                        ? r.writer
                        : [r.writer?.name, r.writer?.nameUrdu].filter(Boolean).join(' '),
                    tags: Array.isArray(r.tags) ? r.tags.join(' ') : (r.description?.match(/#\\w+/g)?.join(' ') || ''),
                    youtubeId: r.youtubeId || '',
                    rawTitle: canonicalTitle,
                    youtubeTitle: r.youtubeTitle || r.youtubeStats?.title || ''
                });
              }
`;
content = content.replace(/if\s*\(Array\.isArray\(data\)\s*&&\s*data\.length\s*>\s*0\)\s*\{/, mappingLogic);

// Replace JSX
const jsxRegex = /<HeroSection kpiStats=\{kpiStats\} \/>\s*<GovernanceSection \/>/;
const jsxReplacement = `<HeroSection kpiStats={kpiStats} />\r\n      \r\n      {flagshipRelease && <FlagshipSpotlight release={flagshipRelease} sourcePage="home" />}\r\n      \r\n      <GovernanceSection />`;
content = content.replace(jsxRegex, jsxReplacement);

fs.writeFileSync(path, content);
