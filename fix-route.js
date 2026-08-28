const fs = require('fs');

let routeCode = fs.readFileSync('app/api/releases/route.ts', 'utf-8');
// Remove dynamic and revalidate
routeCode = routeCode.replace(/^export const dynamic = 'force-dynamic';\r?\n/m, '');
routeCode = routeCode.replace(/^export const revalidate = 0;\r?\n/m, '');

// Update cacheHeaders
routeCode = routeCode.replace(/'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=3600'/g, "'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=3600'");

const oldFilters = `    // Filter by type (releaseType) if provided
    if (type && type !== 'all') {
      releases = releases.filter(r => r.releaseType === type);
    }

    // Filter by search query if provided
    if (search) {
      const query = search.toLowerCase();
      releases = releases.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description?.toLowerCase().includes(query) ||
        r.slug.toLowerCase().includes(query) ||
        r.youtubeId?.toLowerCase().includes(query)
      );
    }`;

const newFilters = `    const governance = searchParams.get('governance');
    const format = searchParams.get('format') || type;
    const duration = searchParams.get('duration');
    const year = searchParams.get('year');

    // Filter by governance
    if (governance && governance !== 'all') {
      releases = releases.filter(r => {
        const govOrigin = r.governanceOrigin || (r.source === 'native' ? 'native_governed' : 'native_governed');
        return govOrigin === governance;
      });
    }

    // Filter by format
    if (format && format !== 'all') {
      releases = releases.filter(r => (r.releaseType || r.format || 'video') === format);
    }

    // Filter by duration
    if (duration && duration !== 'all') {
      releases = releases.filter(r => {
        const secs = Number(r.durationSeconds || r.youtubeStats?.durationSeconds || 0);
        if (duration === 'short') return secs < 600;
        if (duration === 'medium') return secs >= 600 && secs <= 1200;
        if (duration === 'long') return secs > 1200;
        return true;
      });
    }

    // Filter by year
    if (year && year !== 'all') {
      releases = releases.filter(r => {
        const d = r.releaseDate || r.publishedAt || r.createdAt;
        return d && d.startsWith(year);
      });
    }

    // Filter by search query if provided
    if (search) {
      const query = search.toLowerCase();
      releases = releases.filter(r => 
        (r.canonicalTitle || '').toLowerCase().includes(query) ||
        (r.youtubeTitle || '').toLowerCase().includes(query) ||
        (r.title || '').toLowerCase().includes(query) ||
        (r.description || '').toLowerCase().includes(query) ||
        (r.slug || '').toLowerCase().includes(query) ||
        (r.youtubeId || '').toLowerCase().includes(query)
      );
    }`;

routeCode = routeCode.replace(oldFilters, newFilters);
fs.writeFileSync('app/api/releases/route.ts', routeCode);
console.log('Fixed route.ts');

let grsCode = fs.readFileSync('app/components/releases/GlobalReachStrip.tsx', 'utf-8');
grsCode = grsCode.replace(/\/api\/public\/youtube\/global-reach\?refresh=1&t=\$\\{Date.now\(\)\\}/g, '/api/public/youtube/global-reach?refresh=1');
fs.writeFileSync('app/components/releases/GlobalReachStrip.tsx', grsCode);
console.log('Fixed GlobalReachStrip.tsx');

let pageCode = fs.readFileSync('app/(public)/releases/page.tsx', 'utf-8');
pageCode = pageCode.replace(/\/api\/releases\?\$\{params\.toString\(\)\\}\$\{refresh \? '&forceHydrate=1' : ''\}/g, '/api/releases?${params.toString()}');
fs.writeFileSync('app/(public)/releases/page.tsx', pageCode);
console.log('Fixed releases/page.tsx');
