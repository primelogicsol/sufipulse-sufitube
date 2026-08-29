const fs = require('fs');
const file = 'app/admin/cms-releases/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const titleHtmlRegex = /<input\s*ref=\{fieldRefs\.title\}\s*type="text"\s*name="title"\s*value=\{form\.title \|\| ''\}\s*onChange=\{handleInputChange\}\s*className=\{\`form-input w-full\$\{fieldErrors\.title \? ' form-error' : ''\}\`\}\s*placeholder="Release title"\s*\/>\s*\{fieldErrors\.title && <p className="form-error-message">\{fieldErrors\.title\}<\/p>\}/g;

const newTitleHtml = `<input
                    ref={fieldRefs.title}
                    type="text"
                    name="title"
                    value={form.title || ''}
                    onChange={handleInputChange}
                    className={\`form-input w-full\${fieldErrors.title ? ' form-error' : ''}\`}
                    placeholder="Release title"
                  />
                  {fieldErrors.title && <p className="form-error-message">{fieldErrors.title}</p>}
                  
                  {form.titleSource === 'admin' && form.youtubeTitle && (
                    <div className="mt-3 p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-sm">
                      <p className="text-amber-500 font-semibold mb-1 text-xs uppercase tracking-wide">Custom CMS title. YouTube currently uses:</p>
                      <p className="text-neutral-300 font-mono text-xs mb-3">{form.youtubeTitle}</p>
                      <button 
                        type="button" 
                        onClick={() => {
                          setForm(prev => ({ ...prev, title: prev.youtubeTitle, canonicalTitle: prev.youtubeTitle, titleSource: 'youtube' }));
                        }} 
                        className="dashboard-btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-2"
                      >
                        Reset to YouTube Title
                      </button>
                    </div>
                  )}`;

content = content.replace(titleHtmlRegex, newTitleHtml);
fs.writeFileSync(file, content);
