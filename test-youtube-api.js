const apiKey = 'AIzaSyCw34bUCxl_8S5R8I-380YyFOLDqpWL-R4';
const channelId = 'UCraDr3i5A3k0j7typ6tOOsQ';

async function testYouTubeAPI() {
  console.log('Testing YouTube API...\n');
  
  // Test 1: Search videos
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=date&type=video&key=${apiKey}`;
  
  try {
    console.log('🔍 Searching for videos...');
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ API Error:', data.error.code, '-', data.error.message);
      if (data.error.code === 403) {
        console.log('   This is likely a QUOTA EXCEEDED error');
      }
      return;
    }
    
    if (!data.items || data.items.length === 0) {
      console.log('⚠️  No videos found in channel');
      return;
    }
    
    console.log('✅ API is WORKING!');
    console.log(`   Found ${data.items.length} videos:\n`);
    
    data.items.forEach((item, i) => {
      console.log(`   ${i+1}. ${item.snippet.title}`);
      console.log(`      Video ID: ${item.id.videoId}`);
    });
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testYouTubeAPI();