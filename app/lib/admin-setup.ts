/**
 * Admin Setup Script
 * This script helps create admin credentials for testing the CMS
 * Run this in the browser console or use it to pre-populate data
 */

export function setupAdminCredentials() {
  if (typeof window === 'undefined') {
    console.error('This function can only run in the browser');
    return;
  }

  const STORAGE_KEYS = {
    USERS: 'sufipulse_users',
    CURRENT_USER: 'sufipulse_current_user',
  };

  // Admin user to create
  const adminUser = {
    id: 'admin-1',
    email: 'admin@sufipulse.local',
    full_name: 'Admin User',
    role: 'admin',
    is_verified: true,
    created_at: new Date().toISOString(),
  };

  try {
    // Get existing users
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    // Check if admin already exists
    const adminExists = users.some((u: any) => u.email === adminUser.email);

    if (!adminExists) {
      users.push(adminUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      console.log('✅ Admin user created successfully');
      console.log('Email:', adminUser.email);
      console.log('Password: (any password works in standalone mode)');
    } else {
      console.log('⚠️ Admin user already exists');
    }

    return {
      success: true,
      user: adminUser,
      message: 'Admin credentials ready for login',
    };
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    return {
      success: false,
      message: 'Failed to set up admin credentials',
    };
  }
}

export function setupTestReleases() {
  if (typeof window === 'undefined') {
    console.error('This function can only run in the browser');
    return;
  }

  const releases = [
    {
      id: 'release_001',
      title: "Sufi Poetry Recitation - Heart's Whisper",
      slug: 'hearts-whisper',
      youtubeId: 'LXb3EKWsInQ',
      description: 'A beautiful recitation of traditional Sufi poetry exploring themes of divine love and spiritual awakening.',
      releaseDate: '2025-12-15',
      durationSeconds: 420,
      durationFormatted: '7:00',
      viewCount: 3500,
      likeCount: 250,
      status: 'published',
      thumbnailUrl: 'https://i.ytimg.com/vi/LXb3EKWsInQ/maxresdefault.jpg',
      enableLyrics: true,
      enableCommentary: true,
      enableSponsors: false,
      enableAdoption: true,
      enableCredits: true,
      availableLanguages: ['en', 'ur'],
      defaultLanguage: 'en',
      lyrics: {},
      vocalist: { name: 'Fatima Zahra', nameUrdu: 'فاطمہ زہرا' },
      producer: { name: 'Ali Raza' },
      writer: { name: 'Ahmed Hassan', nameUrdu: 'احمد حسن' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'release_002',
      title: 'Sacred Vocal Performance - The Eternal Path',
      slug: 'eternal-path',
      youtubeId: 'kZ7K8nT2mP9',
      description: 'An enchanting vocal performance blending traditional and contemporary elements in Sufi music.',
      releaseDate: '2025-12-10',
      durationSeconds: 480,
      durationFormatted: '8:00',
      viewCount: 2800,
      likeCount: 200,
      status: 'published',
      thumbnailUrl: 'https://i.ytimg.com/vi/kZ7K8nT2mP9/maxresdefault.jpg',
      enableLyrics: true,
      enableCommentary: true,
      enableSponsors: false,
      enableAdoption: true,
      enableCredits: true,
      availableLanguages: ['en', 'ur'],
      defaultLanguage: 'en',
      lyrics: {},
      vocalist: { name: 'Usman Ali', nameUrdu: 'عثمان علی' },
      producer: { name: 'Hamza Malik' },
      writer: { name: 'Sara Khan', nameUrdu: 'سارہ خان' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'release_003',
      title: 'Live Studio Session - Celestial Harmonies',
      slug: 'celestial-harmonies',
      youtubeId: 'nM4L9oQ3rS8',
      description: 'Exclusive behind-the-scenes footage of our latest studio recording session featuring celestial musical arrangements.',
      releaseDate: '2025-12-05',
      durationSeconds: 540,
      durationFormatted: '9:00',
      viewCount: 4200,
      likeCount: 320,
      status: 'draft',
      thumbnailUrl: 'https://i.ytimg.com/vi/nM4L9oQ3rS8/maxresdefault.jpg',
      enableLyrics: true,
      enableCommentary: true,
      enableSponsors: false,
      enableAdoption: true,
      enableCredits: true,
      availableLanguages: ['en', 'ur'],
      defaultLanguage: 'en',
      lyrics: {},
      vocalist: { name: 'Amina Mirza', nameUrdu: 'امینہ معراج' },
      producer: { name: 'Hassan Raza' },
      writer: { name: 'Zainab Ahmed', nameUrdu: 'زینب احمد' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  try {
    const storageKey = 'sufipulse_cms_releases';
    localStorage.setItem(storageKey, JSON.stringify(releases.map((r) => [r.id, r])));
    console.log('✅ Test releases created successfully');
    console.log(`Created ${releases.length} test releases`);
    releases.forEach((r) => {
      console.log(`  - ${r.title} (${r.status})`);
    });
    return {
      success: true,
      count: releases.length,
      message: 'Test releases ready',
    };
  } catch (error) {
    console.error('❌ Error setting up test releases:', error);
    return {
      success: false,
      message: 'Failed to set up test releases',
    };
  }
}

export function printCredentials() {
  console.log('\n📋 ==== SUFIPULSE CMS TEST CREDENTIALS ====');
  console.log('Email: admin@sufipulse.local');
  console.log('Password: (any password - standalone mode)');
  console.log('Role: admin');
  console.log('\n🔗 Access at: http://localhost:3000/admin/cms-releases');
  console.log('========================================\n');
}

export function setupAll() {
  console.log('🚀 Setting up SufiPulse CMS...\n');
  
  const adminResult = setupAdminCredentials();
  console.log('');
  const releasesResult = setupTestReleases();
  console.log('');
  printCredentials();
  
  return {
    admin: adminResult,
    releases: releasesResult,
  };
}
