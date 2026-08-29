const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /title: existing\?\.canonicalTitle \|\| existing\?\.title \|\| title,\s*canonicalTitle: existing\?\.canonicalTitle \|\| existing\?\.title \|\| title,\s*canonicalStatus: existing\?\.canonicalStatus \|\| \(existing \? 'verified' : 'inferred'\),\s*governanceOrigin: existing\?\.governanceOrigin \|\| \(existing\?\.source === 'native' \? 'native_governed' : 'native_governed'\),/g;

const replacement = `title: existing?.canonicalTitle || existing?.title || initializeCanonicalTitle(title),
    canonicalTitle: existing?.canonicalTitle || existing?.title || initializeCanonicalTitle(title),
    canonicalStatus: existing?.canonicalStatus || 'inferred',
    governanceOrigin: existing?.governanceOrigin || 'native_governed',
    youtubeTitleVariantA: existing?.youtubeTitleVariantA,
    youtubeTitleVariantB: existing?.youtubeTitleVariantB,
    youtubeTitleVariantC: existing?.youtubeTitleVariantC,
    youtubeWinningVariant: existing?.youtubeWinningVariant,
    youtubeTitleLastSyncedAt: now,`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
