const fs = require('fs');
const file = 'lib/graph-resolver.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /public syncReleaseJoins\(release: CMSRelease\): void \{/g;
const replacement = `
  public exportJoins(): GraphJoin[] {
    return JSON.parse(JSON.stringify(this.joins));
  }
  
  public restoreJoins(snapshot: GraphJoin[]): void {
    this.joins = JSON.parse(JSON.stringify(snapshot));
    this.persist();
  }

  public syncReleaseJoins(release: CMSRelease, skipPersist: boolean = false): void {`;
content = content.replace(regex, replacement);

const regex2 = /if \(this\.joins\.length \!== initialLength \|\| desiredJoins\.length > 0\) \{\s*this\.persist\(\);\s*\}/g;
const replacement2 = `if ((this.joins.length !== initialLength || desiredJoins.length > 0) && !skipPersist) {
      this.persist();
    }`;
content = content.replace(regex2, replacement2);

fs.writeFileSync(file, content);
