// test-youtube-service.js
const { youtubeService } = require('./lib/youtube-service.ts');

async function testYouTubeService() {
    console.log('🧪 Testing YouTube Service...\n');

    try {
        // Test 1: Check if service is initialized
        console.log('1. Service Status:');
        console.log('   - Quota exceeded:', youtubeService.isQuotaExceeded());
        console.log('   - Cache stats:', youtubeService.getCacheStats());
        console.log('');

        // Test 2: Try to fetch latest videos
        console.log('2. Fetching latest videos...');
        const videos = await youtubeService.getLatestVideos(3);
        console.log(`   - Found ${videos.length} videos`);
        if (videos.length > 0) {
            console.log(`   - First video: "${videos[0].title.substring(0, 50)}..."`);
            console.log(`   - Source: ${videos[0].source}`);
        }
        console.log('');

        // Test 3: Test search functionality
        console.log('3. Testing search functionality...');
        const searchResults = await youtubeService.searchVideos('sufi', 2);
        console.log(`   - Search results: ${searchResults.length} videos`);
        console.log('');

        // Test 4: Check cache after operations
        console.log('4. Cache status after operations:');
        console.log('   - Cache stats:', youtubeService.getCacheStats());
        console.log('');

        console.log('✅ YouTube Service test completed successfully!');

    } catch (error) {
        console.error('❌ YouTube Service test failed:', error.message);

        // Check if it's a quota issue
        if (error.message.includes('quota')) {
            console.log('ℹ️  This is expected if YouTube API quota is exceeded.');
            console.log('ℹ️  The service should fall back to mock data.');
        }
    }
}

testYouTubeService();