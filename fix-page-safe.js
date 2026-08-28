const fs = require('fs');

let code = fs.readFileSync('app/(public)/releases/page.tsx', 'utf-8');

// 1. Add totalPages and totalCount state
code = code.replace(
  "const [currentPage, setCurrentPage] = useState(1);",
  "const [currentPage, setCurrentPage] = useState(1);\n    const [serverTotalPages, setServerTotalPages] = useState(1);\n    const [serverCount, setServerCount] = useState(0);"
);

// 2. Replace fetchVideos signature and URL construction
const oldFetchStart = `    const fetchVideos = async (silent = false, refresh = false) => {
        if (!silent) setLoading(true);
        try {
            const url = \`/api/releases?status=published\${refresh ? '&forceHydrate=1' : ''}\`;
            const cmsRes = await fetch(url, { cache: 'no-store' });`;

const newFetchStart = `    const fetchVideos = async (silent = false) => {
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

code = code.replace(oldFetchStart, newFetchStart);

// 3. Update response parsing to capture totalPages and count
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

// 4. Remove useMemo for filteredReleases and paginatedReleases
const filterRegex = /const filteredReleases = useMemo\(\(\) => \{[\s\S]*?return sortReleases\(filtered as any, internalSortMap\[sortOrder\]\) as unknown as YouTubeRelease\[\];\n    \}, \[releases, filterType, filterFormat, durationFilter, yearFilter, searchQuery, sortOrder\]\);/;
code = code.replace(filterRegex, `const filteredReleases = releases;`);

const paginateRegex = /const paginatedReleases = useMemo\(\(\) => \{[\s\S]*?return filteredReleases\.slice\(startIndex, startIndex \+ ITEMS_PER_PAGE\);\n    \}, \[filteredReleases, currentPage\]\);/;
code = code.replace(paginateRegex, `const paginatedReleases = releases;`);

const totalPagesRegex = /const totalPages = Math\.ceil\(filteredReleases\.length \/ ITEMS_PER_PAGE\);/;
code = code.replace(totalPagesRegex, `const totalPages = serverTotalPages;`);

// 5. Update useEffects
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

// 6. Fix any residual fetchVideos calls that pass `false, true` for refresh
code = code.replace(/fetchVideos\(false, true\)/g, 'fetchVideos(false)');

fs.writeFileSync('app/(public)/releases/page.tsx', code);
console.log('Successfully patched page.tsx safely');
