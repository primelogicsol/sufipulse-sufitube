const fs = require('fs');
const file = 'lib/release-mapping.ts';
let content = fs.readFileSync(file, 'utf8');

// The logic needs to be:
// 1. Resolve youtubeContentType and formatClassificationSource
// 2. Resolve format based on youtubeContentType

const regex = /format:\s*existing\?\.format \|\| video\.format \|\| 'video',/g;

const replacement = `youtubeContentType: video.youtubeContentType || existing?.youtubeContentType,
    formatClassificationSource: video.formatClassificationSource || existing?.formatClassificationSource,
    format: (() => {
        const yct = video.youtubeContentType || existing?.youtubeContentType;
        if (yct === 'SHORTS') return 'short';
        if (yct === 'LIVE_STREAM') return 'live';
        if (yct === 'VIDEO_ON_DEMAND') return 'video';
        return existing?.format || video.format || 'video';
    })(),`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
