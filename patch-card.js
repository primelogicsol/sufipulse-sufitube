const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove min-h-[440px]
content = content.replace(/shadow-xl min-h-\[440px\]"/g, 'shadow-xl"');

// 2. Adjust flex-1 and gap
content = content.replace(/className="p-5 flex flex-col flex-1 gap-3"/g, 'className="p-5 flex flex-col gap-5"');

// 3. Fix the Governance/Format row
const oldGovRow = `<div className="flex items-center gap-2 shrink-0">
                                                        <span className={\`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded \${
                                                            release.govType === 'native_governed' 
                                                                ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' 
                                                                : 'bg-white/5 text-zinc-400 border border-white/10'
                                                        }\`}>
                                                            {release.govType === 'native_governed' ? 'Governed Release' : 'Legacy Registry'}
                                                        </span>
                                                        <span className="text-[10px] text-white/20">?</span>
                                                        <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">
                                                            {release.format}
                                                        </span>
                                                    </div>`;

const newGovRow = `<div className="flex justify-between items-center shrink-0">
                                                        <span className={\`text-[10px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full \${
                                                            release.govType === 'native_governed' 
                                                                ? 'text-[var(--color-gold)] border border-[var(--color-gold)]/40' 
                                                                : 'text-zinc-400 border border-white/20'
                                                        }\`}>
                                                            {release.govType === 'native_governed' ? 'Governed Release' : 'Legacy Registry'}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">
                                                            {release.format}
                                                        </span>
                                                    </div>`;
// using regex because of encoding issues
const govRowRegex = /<div className="flex items-center gap-2 shrink-0">[\s\S]*?<span className="text-\[10px\] text-white\/40 uppercase tracking-\[0\.2em\]">\s*\{release\.format\}\s*<\/span>\s*<\/div>/;
content = content.replace(govRowRegex, newGovRow);

// 4. Update the Footer and remove authorship line
const footerRegex = /\{\/\* Authorship Chain line \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/Link>/;
const newFooter = `<div className="flex items-center justify-between text-[11px] text-white/40 font-bold uppercase tracking-wider mt-1">
                                                        <div className="flex items-center gap-4">
                                                            <span>{new Date(release.publishedDate || release.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-1 h-1 rounded-full bg-[var(--color-gold)]" />
                                                                <span>{(Number(release.views) || 0).toLocaleString()} views</span>
                                                            </div>
                                                        </div>
                                                        {release.source === 'youtube' && (
                                                            <Youtube className="w-4 h-4 text-red-500/60" />
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>`;

content = content.replace(footerRegex, newFooter);

fs.writeFileSync(file, content);
