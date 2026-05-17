const fs = require('fs');
const content = fs.readFileSync('app/components/layout/DashboardLayout.tsx', 'utf8');

let openBraces = 0;
let openBrackets = 0;
let openParens = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  if (content[i] === '}') openBraces--;
  if (content[i] === '[') openBrackets++;
  if (content[i] === ']') openBrackets--;
  if (content[i] === '(') openParens++;
  if (content[i] === ')') openParens--;
}

console.log(`Braces: ${openBraces}, Brackets: ${openBrackets}, Parens: ${openParens}`);
