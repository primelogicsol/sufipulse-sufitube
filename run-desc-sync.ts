process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/sufipulse";
process.env.YOUTUBE_API_KEY = "AIzaSyCC3c9b0E8HHEbnLVI5ZuA3qzraugTdNEw";
process.env.RELEASE_STORAGE_BACKEND = 'postgres';

import { PostgresReleaseRepository } from './server/db/release-repository.js';
import { youtubeService } from './lib/youtube-service.js';

async function main() {
    const repo = new PostgresReleaseRepository();

    const res = await repo.query({
        status: 'published',
        limit: 1000,
    });
    const releases = res.items;

    console.log(`Found ${releases.length} published releases.`);

    let ytLinked = 0;
    let aligned = 0;
    let overrides = 0;
    let missing = 0;
    let failures = 0;

    for (const release of releases) {
        if (!release.youtubeId) continue;
        ytLinked++;

        try {
            console.log(`Fetching ${release.youtubeId} for ${release.slug}...`);
            const video = await youtubeService.getVideoById(release.youtubeId);
            if (!video) {
                missing++;
                console.log(`Missing description for ${release.youtubeId}`);
                continue;
            }

            const liveDescription = video.description || '';
            const isOverride = !!release.descriptionOverride;

            release.youtubeDescription = liveDescription;
            if (!isOverride) {
                release.description = liveDescription;
            } else {
                overrides++;
            }

            await repo.update(release.id, release);
            aligned++;
        } catch (err: any) {
            console.error(`Failed ${release.youtubeId}:`, err.message);
            failures++;
        }
    }

    console.log("\n=== ACCEPTANCE REPORT ===");
    console.log(`YouTube descriptions fetched: ${ytLinked}`);
    console.log(`Overview descriptions aligned: ${aligned}`);
    console.log(`Admin description overrides preserved: ${overrides}`);
    console.log(`Missing descriptions: ${missing}`);
    console.log(`Failures: ${failures}`);
}

main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
