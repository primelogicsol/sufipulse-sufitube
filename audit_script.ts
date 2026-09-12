import { cmsServerStorage } from './lib/cms-storage-server';
import fs from 'node:fs';

const releases = cmsServerStorage.getAllReleases();

const auditLines = [];
auditLines.push("RELEASE\tCURRENT WRITER\tCURRENT LYRICIST\tPROPOSED WRITER\tACTION");

for (const release of releases) {
  const currentWriter = release.writer || '';
  const currentLyricist = release.lyricist || '';
  
  let action = '';
  let proposed = 'Dr. Zarf-e-Noori';
  
  const w = String(currentWriter).trim();
  const l = String(currentLyricist).trim();
  
  const isZarf = (name: string) => name.includes('Zarf-e-Noori') || name.includes('Zarf e Noori') || name === 'Dr. Zarf-e-Noori';
  
  if (!w && !l) {
    action = 'MISSING -> ASSIGN DR. ZARF-E-NOORI';
  } else if ((w && isZarf(w)) || (l && isZarf(l))) {
    action = 'ALREADY CORRECT';
    proposed = 'Dr. Zarf-e-Noori';
  } else if ((w && !isZarf(w) && w.toLowerCase() !== 'unknown' && w !== 'generic writer') || (l && !isZarf(l) && l.toLowerCase() !== 'unknown' && l !== 'generic writer')) {
    // There is a writer and it's NOT Dr. Zarf-e-Noori.
    action = 'VERIFIED OTHER WRITER -> PRESERVE';
    proposed = w || l;
  } else {
    // Generic
    action = 'MISSING -> ASSIGN DR. ZARF-E-NOORI';
  }
  
  // What if there is a conflict? (e.g. writer is Zarf but lyricist is someone else)
  if (w && l && w !== l && !isZarf(w) && !isZarf(l)) {
     action = 'CONFLICT -> REVIEW';
  }
  
  auditLines.push(`${release.id}\t${w}\t${l}\t${proposed}\t${action}`);
}

fs.writeFileSync('audit_report.txt', auditLines.join('\n'));
console.log('Audit generated: audit_report.txt');
