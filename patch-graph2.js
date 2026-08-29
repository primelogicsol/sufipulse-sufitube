const fs = require('fs');
const file = 'lib/graph-resolver.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /private persist\(\): void \{/g;
const replacement = `public forcePersist(): void { this.persist(); }
  private persist(): void {`;
content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
