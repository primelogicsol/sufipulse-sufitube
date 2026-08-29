const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Governance \*\/\}\s*<div className="flex flex-col gap-1\.5">\s*<label className="text-\[10px\] text-\[var\(--color-text-tertiary\)\] uppercase tracking-widest font-bold ml-1">Governance<\/label>[\s\S]*?<option value="not_applicable" hidden>Not applicable to Shorts<\/option>\s*\}\)\s*<\/select>\s*<\/div>/;

const replacement = `{/* Governance */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Governance</label>
                                            <select 
                                                value={filterType} 
                                                onChange={(e) => { setFilterType(e.target.value as FilterType); setCurrentPage(1); }}
                                                className="bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)]"
                                            >
                                                <option value="all">All Releases</option>
                                                <option value="native_governed">Governed Release</option>
                                                <option value="legacy_registry">Legacy Registry</option>
                                            </select>
                                        </div>

                                        {/* Format */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Format</label>
                                            <select 
                                                value={filterFormat} 
                                                onChange={(e) => { 
                                                    const val = e.target.value as FormatFilter;
                                                    setFilterFormat(val); 
                                                    if (val === 'short') setDurationFilter('all');
                                                    setCurrentPage(1); 
                                                }}
                                                className="bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)]"
                                            >
                                                <option value="all">All Formats</option>
                                                <option value="video">Videos</option>
                                                <option value="audio">Audios</option>
                                                <option value="short">Shorts</option>
                                                <option value="live">Live</option>
                                            </select>
                                        </div>

                                        {/* Duration */}
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest font-bold ml-1">Duration</label>
                                            <select 
                                                value={filterFormat === 'short' ? 'not_applicable' : durationFilter} 
                                                onChange={(e) => { setDurationFilter(e.target.value as DurationFilter); setCurrentPage(1); }}
                                                className={\`bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)] \${filterFormat === 'short' ? 'opacity-50 cursor-not-allowed' : ''}\`}
                                                disabled={filterFormat === 'short'}
                                            >
                                                <option value="default">Default (Standard/Long)</option>
                                                <option value="all">Any Duration</option>
                                                <option value="short">Brief (&lt; 3m)</option>
                                                <option value="standard">Standard (3-8m)</option>
                                                <option value="long">Long (&gt; 8m)</option>
                                                {filterFormat === 'short' && (
                                                    <option value="not_applicable" hidden>Not applicable to Shorts</option>
                                                )}
                                            </select>
                                        </div>`;

if(content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content);
    console.log("Toolbar fixed!");
} else {
    console.log("Regex didn't match.");
}
