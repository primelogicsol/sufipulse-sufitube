const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update onChange for Format
const oldFormatOnChange = `onChange={(e) => { setFilterFormat(e.target.value as FormatFilter); setCurrentPage(1); }}`;
const newFormatOnChange = `onChange={(e) => { 
                                                    const val = e.target.value as FormatFilter;
                                                    setFilterFormat(val); 
                                                    if (val === 'short') setDurationFilter('all');
                                                    setCurrentPage(1); 
                                                }}`;
content = content.replace(oldFormatOnChange, newFormatOnChange);

// 2. Update params logic
const oldParams = `if (ff && ff !== 'all') params.set('format', ff);\r\n              if (df && df !== 'all') params.set('duration', df);`;
const newParams = `if (ff && ff !== 'all') params.set('format', ff);\n              if (ff !== 'short' && df && df !== 'all') params.set('duration', df);`;
const oldParams2 = `if (ff && ff !== 'all') params.set('format', ff);\n              if (df && df !== 'all') params.set('duration', df);`;

if (content.includes(oldParams)) {
    content = content.replace(oldParams, newParams);
} else {
    content = content.replace(oldParams2, newParams);
}

fs.writeFileSync(file, content);
