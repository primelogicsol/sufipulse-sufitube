// lib/seed-cms-data.ts
import { CMSRelease, cmsStorage } from './cms-storage';

export const SUFI_PULSE_TEST_RELEASES: CMSRelease[] = [
    {
        id: 'sufipulse-001',
        title: 'Qawwali: The Soul\'s Journey',
        slug: 'qawwali-souls-journey',
        youtubeId: 'lJIrF4E69e8',
        description: 'A powerful Sufi qawwali performance showcasing traditional devotional music. This piece explores the depths of spiritual connection through the timeless art of qawwali singing.',
        releaseDate: '2025-02-15',
        durationSeconds: 525,
        durationFormatted: '8:45',
        viewCount: 15420,
        likeCount: 892,
        status: 'published' as const,
        category: 'Qawwali',
        releaseType: 'Live Performance',
        vocalist: { name: 'Nusrat Fateh Ali Khan', nameUrdu: 'نصرت فتح علی خان' },
        writer: { name: 'Amir Khusrow', nameUrdu: 'امیر خسرو' },
        producer: { name: 'SufiPulse USA' },
        enableLyrics: true,
        enableCommentary: true,
        enableSponsors: false,
        enableAdoption: true,
        enableCredits: true,
        availableLanguages: ['en', 'ur'],
        defaultLanguage: 'en',
        lyrics: {},
        createdAt: new Date('2025-02-15').toISOString(),
        updatedAt: new Date('2025-02-15').toISOString(),
        publishedAt: new Date('2025-02-15').toISOString()
    },
    {
        id: 'sufipulse-002',
        title: 'The Garden of Divine Love',
        slug: 'garden-divine-love',
        youtubeId: 'LS8qPHGjQZU',
        description: 'Exploring the mystical dimensions of divine love through Rumi\'s poetry and traditional Sufi music. This sacred composition invites listeners into the eternal garden of spiritual devotion.',
        releaseDate: '2025-02-10',
        durationSeconds: 750,
        durationFormatted: '12:30',
        viewCount: 22150,
        likeCount: 1450,
        status: 'published' as const,
        category: 'Sufi Poetry',
        releaseType: 'Studio Recording',
        vocalist: { name: 'Abida Parveen', nameUrdu: 'عابدہ پروین' },
        writer: { name: 'Rumi', nameUrdu: 'روم' },
        producer: { name: 'SufiPulse USA' },
        enableLyrics: true,
        enableCommentary: true,
        enableSponsors: false,
        enableAdoption: true,
        enableCredits: true,
        availableLanguages: ['en', 'ur'],
        defaultLanguage: 'en',
        lyrics: {},
        createdAt: new Date('2025-02-10').toISOString(),
        updatedAt: new Date('2025-02-10').toISOString(),
        publishedAt: new Date('2025-02-10').toISOString()
    },
    {
        id: 'sufipulse-003',
        title: 'Spiritual Journey: Voices of the Heart',
        slug: 'spiritual-journey-voices-heart',
        youtubeId: 'kJQP7kiOvtQ',
        description: 'A collection of Sufi spiritual performances featuring master musicians. This compilation showcases the diversity and depth of Sufi mystical traditions from across the centuries.',
        releaseDate: '2025-02-05',
        durationSeconds: 900,
        durationFormatted: '15:00',
        viewCount: 18800,
        likeCount: 1200,
        status: 'published' as const,
        category: 'Compilation',
        releaseType: 'Live Session',
        vocalist: { name: 'Rahat Fateh Ali Khan', nameUrdu: 'راہت فتح علی خان' },
        writer: { name: 'Hafiz', nameUrdu: 'حافظ' },
        producer: { name: 'SufiPulse USA' },
        enableLyrics: true,
        enableCommentary: true,
        enableSponsors: false,
        enableAdoption: true,
        enableCredits: true,
        availableLanguages: ['en', 'ur'],
        defaultLanguage: 'en',
        lyrics: {},
        createdAt: new Date('2025-02-05').toISOString(),
        updatedAt: new Date('2025-02-05').toISOString(),
        publishedAt: new Date('2025-02-05').toISOString()
    }
];

export function seedCMSWithTestData(): CMSRelease[] {
    console.log('[CMS] Seeding database with test releases...');
    
    // Clear existing data
    cmsStorage.clearAll();
    
    // Import test releases
    const imported = cmsStorage.importReleases(SUFI_PULSE_TEST_RELEASES);
    
    console.log(`[CMS] Successfully seeded ${imported.length} releases`);
    return imported;
}

export function getCMSStats(): ReturnType<typeof cmsStorage.getStats> {
    return cmsStorage.getStats();
}
