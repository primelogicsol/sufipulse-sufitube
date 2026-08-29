const fs = require('fs');
const file = 'app/(public)/releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const newDurationSelect = `<select 
                                                value={filterFormat === 'short' ? 'not_applicable' : durationFilter} 
                                                onChange={(e) => { setDurationFilter(e.target.value as DurationFilter); setCurrentPage(1); }}
                                                className={\`bg-[var(--color-midnight)] border border-white/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-[var(--color-gold)]/50 transition-colors cursor-pointer w-full text-[var(--color-text-primary)] \${filterFormat === 'short' ? 'opacity-50 cursor-not-allowed' : ''}\`}
                                                disabled={filterFormat === 'short'}
                                            >
                                                <option value="default">Default (Standard/Long)</option>
                                                <option value="all">Any Duration</option>
                                                <option value="brief">Brief (&lt; 3m)</option>
                                                <option value="standard">Standard (3-8m)</option>
                                                <option value="long">Long (&gt; 8m)</option>
                                                {filterFormat === 'short' && (
                                                    <option value="not_applicable" hidden>Not applicable to Shorts</option>
                                                )}
                                            </select>`;

const durationRegex = /<select[\s\S]*?value=\{durationFilter\}[\s\S]*?onChange=\{\(e\) => \{ setDurationFilter\(e\.target\.value as DurationFilter\); setCurrentPage\(1\); \}\}[\s\S]*?className="bg-\[var\(--color-midnight\)\] border border-white\/10 text-xs rounded-xl px-3 py-3 outline-none focus:border-\[var\(--color-gold\)\]\/50 transition-colors cursor-pointer w-full text-\[var\(--color-text-primary\)\]"[\s\S]*?>[\s\S]*?<option value="default">Default \(Standard\/Long\)<\/option>[\s\S]*?<option value="all">Any Duration<\/option>[\s\S]*?<option value="short">Short \(&lt; 3m\)<\/option>[\s\S]*?<option value="standard">Standard \(3-8m\)<\/option>[\s\S]*?<option value="long">Long \(&gt; 8m\)<\/option>[\s\S]*?<\/select>/;

if (content.match(durationRegex)) {
    content = content.replace(durationRegex, newDurationSelect);
    console.log("Replaced duration select!");
} else {
    console.log("Could not find duration select regex");
}

fs.writeFileSync(file, content);
