const fs = require('fs');
let code = fs.readFileSync('app/(public)/releases/page.tsx', 'utf-8');

// Replace fetchVideos signature and logic
const oldFetchVideos = `    const fetchVideos = async (silent = false, refresh = false) => {
        if (!silent) setLoading(true);
        try {
            const url = \`/api/releases?status=published\${refresh ? '&forceHydrate=1' : ''}\`;
            const cmsRes = await fetch(url, { cache: 'no-store' });`;

const newFetchVideos = `    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [serverCount, setServerCount] = useState(0);

    const fetchVideos = async (silent = false, refresh = false) => {
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

code = code.replace(oldFetchVideos, newFetchVideos);

// Capture totalPages from response
const oldResponse = `            const cmsData = Array.isArray(responseData) 
                ? responseData 
                : (responseData.items || []);`;

const newResponse = `            const cmsData = Array.isArray(responseData) 
                ? responseData 
                : (responseData.items || []);
            
            if (responseData.totalPages !== undefined) {
                setServerTotalPages(responseData.totalPages);
                setServerCount(responseData.count);
            } else {
                setServerTotalPages(1);
                setServerCount(cmsData.length);
            }`;

code = code.replace(oldResponse, newResponse);

// Replace filteredReleases useMemo
const filterRegex = /const filteredReleases = useMemo\(\(\) => \{[\s\S]*?return sortReleases\(filtered as any, internalSortMap\[sortOrder\]\) as unknown as YouTubeRelease\[\];\n    \}, \[releases, filterType, filterFormat, durationFilter, yearFilter, searchQuery, sortOrder\]\);/;

code = code.replace(filterRegex, `const filteredReleases = releases;`);

// Replace paginatedReleases useMemo
const paginateRegex = /const paginatedReleases = useMemo\(\(\) => \{[\s\S]*?return filteredReleases\.slice\(startIndex, startIndex \+ ITEMS_PER_PAGE\);\n    \}, \[filteredReleases, currentPage\]\);/;

code = code.replace(paginateRegex, `const paginatedReleases = releases;`);

// Replace totalPages declaration
code = code.replace(/const totalPages = Math\.ceil\(filteredReleases\.length \/ ITEMS_PER_PAGE\);/g, 'const totalPages = serverTotalPages;');

// Replace useEffect to fetch when filters change
const oldEffect = `    useEffect(() => {
        fetchVideos();
    }, []);`;

const newEffect = `    useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterFormat, durationFilter, yearFilter, sortOrder, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVideos(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, filterType, filterFormat, durationFilter, yearFilter, sortOrder, searchQuery]);`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('app/(public)/releases/page.tsx', code);
console.log('Successfully patched page.tsx');
