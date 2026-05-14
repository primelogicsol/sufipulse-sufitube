import { youtubeService } from './lib/youtube-service.js';

const videoId = 'q58mRXIsi-Y';

async function test() {
    console.log(`Testing fetch for video: ${videoId}`);
    try {
        const video = await youtubeService.getVideoById(videoId);
        if (video) {
            console.log('✅ Success!');
            console.log('Title:', video.title);
            console.log('Channel:', video.source);
        } else {
            console.log('❌ Video not found (returned null)');
        }
    } catch (err) {
        console.error('❌ Error fetching video:', err.message);
    }
}

test();
