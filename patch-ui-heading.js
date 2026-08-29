const fs = require('fs');
const file = 'app/admin/cms-releases/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const newHeading = `{/* Saved Release Registry Heading */}
        <div className="mb-4 mt-8">
          <h2 className="text-xl font-bold" style={{ color: 'var(--dash-text-primary)' }}>Saved Release Registry</h2>
          <p className="text-sm mt-1 mb-4" style={{ color: 'var(--dash-text-muted)' }}>
            These are the persisted canonical releases powering the SufiPulse Discovery engine and website.
          </p>
        </div>

        {/* Filter Tabs */}`;

content = content.replace(/\{\/\* Filter Tabs \*\/\}/g, newHeading);

fs.writeFileSync(file, content);
