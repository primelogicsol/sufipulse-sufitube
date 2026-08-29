const fs = require('fs');
const file = 'app/admin/cms-releases/[id]/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add to handleSave or the onSubmit equivalent
// Let's find what function saves it
const regexSave = /const handleSave = async \(e\?: React.FormEvent\) => \{[\s\S]*?try \{/g;
if (content.match(regexSave)) {
  console.log("Found handleSave");
} else {
  // Try to find the save payload
  const payloadRegex = /const payload = \{[\s\S]*?\.\.\.form,/g;
  if (content.match(payloadRegex)) {
    console.log("Found payload");
  }
}
