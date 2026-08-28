const fs = require('fs');
let code = fs.readFileSync('app/(public)/releases/page.tsx', 'utf-8');

const target = `    const fetchVideos = async (silent = false, refresh = false) => {
        if (!silent) setLoading(true);
        try {
            const url = \`/api/releases?status=published\${refresh ? '&forceHydrate=1' : ''}\`;
            const cmsRes = await fetch(url, { cache: 'no-store' });`;

const newStr = `    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [serverCount, setServerCount] = useState(0);

    const fetchVideos = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('status', 'published');
            params.set('page', currentPage.toString());
            params.set('pageSize', '12');
            if (searchQuery) params.set('search', searchQuery);
            if (filterType !== 'all') params.set('governance', filterType);
            if (filterFormat !== 'all') params.set('format', filterFormat);
            if (durationFilter !== 'all') params.set('duration', durationFilter);
            if (yearFilter !== 'all') params.set('year', yearFilter);
            if (sortOrder) params.set('sort', sortOrder);

            const url = \`/api/releases?\${params.toString()}\`;
            const cmsRes = await fetch(url);`;

code = code.replace(target, newStr);

fs.writeFileSync('app/(public)/releases/page.tsx', code);
