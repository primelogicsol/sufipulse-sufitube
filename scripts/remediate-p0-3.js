const fs = require('fs');
const path = require('path');

const projectRoot = 'C:\\Users\\Fayaz\\Sufipulseupdate2026\\Sufipulseupdate';
const routePath = path.join(projectRoot, 'app/api/releases/route.ts');
let content = fs.readFileSync(routePath, 'utf-8');

const targetStr = `    // Use dynamic headers if t is present, otherwise standard cache
    const finalHeaders = t ? Object.fromEntries(headers.entries()) : cacheHeaders;
    
    return NextResponse.json(releases, { headers: finalHeaders });`;

const replacementStr = `    // Handle sort (default: newest)
    const sort = searchParams.get('sort') || 'newest';
    if (sort === 'newest') {
      releases.sort((a, b) => new Date(b.releaseDate || b.createdAt).getTime() - new Date(a.releaseDate || a.createdAt).getTime());
    } else if (sort === 'oldest') {
      releases.sort((a, b) => new Date(a.releaseDate || a.createdAt).getTime() - new Date(b.releaseDate || b.createdAt).getTime());
    } else if (sort === 'popular') {
      releases.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize') || searchParams.get('limit');
    
    // Use dynamic headers if t is present, otherwise standard cache
    const finalHeaders = t ? Object.fromEntries(headers.entries()) : cacheHeaders;

    if (pageParam || pageSizeParam) {
      const page = parseInt(pageParam || '1', 10) || 1;
      const pageSize = parseInt(pageSizeParam || '12', 10) || 12;
      const offset = parseInt(searchParams.get('offset') || '0', 10) || (page - 1) * pageSize;
      
      const count = releases.length;
      const totalPages = Math.ceil(count / pageSize);
      const items = releases.slice(offset, offset + pageSize);
      
      return NextResponse.json({
        items,
        count,
        page,
        pageSize,
        totalPages
      }, { headers: finalHeaders });
    }
    
    return NextResponse.json(releases, { headers: finalHeaders });`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(routePath, content, 'utf-8');
console.log('Updated route.ts with pagination');
