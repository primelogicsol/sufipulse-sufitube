// Test YouTube Service Fallback
import { youtubeService } from './lib/youtube-service.ts';

console.log('Testing YouTube Service Fallback...\n');

// Test 1: Get video by ID (should fall back to static data due to quota exceeded)
console.log('Test 1: Getting video by ID...');
const video = await youtubeService.getVideoById('LXb3EKWsInQ');
console.log('Result:', video ? `✓ Found: ${video.title}` : '✗ Not found');
console.log('Source:', video?.source);

// Test 2: Get videos by IDs (should fall back to static data)
console.log('\nTest 2: Getting multiple videos by IDs...');
const videos = await youtubeService.getVideosByIds(['LXb3EKWsInQ', 'kZ7K8nT2mP9']);
console.log('Result:', `✓ Found ${videos.length} videos`);
videos.forEach(v => console.log(`  - ${v.snippet?.title || 'Unknown'}`));

// Test 3: Get latest videos
console.log('\nTest 3: Getting latest videos...');
const latest = await youtubeService.getLatestVideos(3);
console.log('Result:', `✓ Found ${latest.length} videos`);
latest.forEach(v => console.log(`  - ${v.title}`));

console.log('\nAll tests completed!');
