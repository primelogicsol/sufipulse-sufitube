const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /youtubeContentType: video\.youtubeContentType \|\| existing\?\.youtubeContentType,/g;

const replacement = `youtubeContentType: (() => {
        const raw = video.youtubeContentType || existing?.youtubeContentType;
        if (raw === 'SHORTS' || raw === 'LIVE_STREAM' || raw === 'VIDEO_ON_DEMAND' || raw === 'UNSPECIFIED') {
            return raw;
        }
        return 'UNSPECIFIED';
    })(),`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
