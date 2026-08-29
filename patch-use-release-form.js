const fs = require('fs');
const file = 'app/admin/cms-releases/[id]/use-release-form.ts';
let content = fs.readFileSync(file, 'utf8');

const saveRegex = /const res = await fetch\(url, \{\s*method,\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ \.\.\.form, chorusVocalists: normalizedChorus \}\),\s*\}\);/g;
const newSave = `
        // Title Governance Enforcement
        let payload = { ...form, chorusVocalists: normalizedChorus };
        if (payload.youtubeTitle) {
          if (payload.title === payload.youtubeTitle) {
            payload.titleSource = 'youtube';
            payload.canonicalTitle = payload.youtubeTitle;
          } else if (payload.title !== originalForm?.title || originalForm?.titleSource === 'admin') {
            payload.titleSource = 'admin';
          }
        }
        
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });`;

content = content.replace(saveRegex, newSave);
fs.writeFileSync(file, content);
