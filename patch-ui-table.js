const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const titleColRegex = /<td className="px-4 py-3">\s*<Link href=\{\`\/admin\/cms-releases\/\$\{release\.id\}\`\}>\s*<span className="font-medium hover:underline" style=\{\{ color: 'var\(--dash-text-primary\)' \}\}>\s*\{release\.title\}\s*<\/span>\s*<\/Link>\s*\{release\.vocalist\?\.name && \(\s*<p className="text-xs mt-0\.5" style=\{\{ color: 'var\(--dash-text-muted\)' \}\}>\s*\{release\.vocalist\.name\}\s*<\/p>\s*\)\}\s*<\/td>/;

const newTitleCol = `<td className="px-4 py-3">
                      <Link href={\`/admin/cms-releases/\${release.id}\`}>
                        <span className="font-medium hover:underline block" style={{ color: 'var(--dash-text-primary)' }}>
                          {release.title}
                        </span>
                      </Link>
                      
                      {release.youtubeTitle && release.youtubeTitle !== release.title && (
                        <div className="mt-1">
                          <span className="text-[10px] font-mono bg-neutral-800 text-neutral-400 px-1 rounded mr-2">CMS Canonical</span>
                          <p className="text-xs mt-1 text-neutral-500 line-clamp-1">
                            <strong className="font-mono text-neutral-400">YouTube:</strong> {release.youtubeTitle}
                          </p>
                        </div>
                      )}

                      {release.vocalist?.name && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
                          {release.vocalist.name}
                        </p>
                      )}
                    </td>`;

content = content.replace(titleColRegex, newTitleCol);
fs.writeFileSync(file, content);
