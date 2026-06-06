import crypto from 'crypto';
import { sessionStore, pageviewStore, eventStore } from '../lib/atlas/atlas-telemetry';

function generateTimestamp(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return date.toISOString();
}

async function run() {
  console.log('🚀 Seeding Production-Grade Telemetry Event Logs...');

  // 1. Generate 1,000 distinct sessions for NFAK cluster
  const NFAK_TOTAL = 1000;
  for (let i = 0; i < NFAK_TOTAL; i++) {
    const sessionId = `usr_${crypto.randomUUID().substring(0, 8)}`;
    const time = generateTimestamp(Math.floor(Math.random() * 30)); // past 30 days
    
    // Determine Referrer Source
    let referrer = '';
    const randSrc = Math.random();
    if (randSrc < 0.6) referrer = 'https://google.com/search?q=nusrat+fateh+ali+khan'; // 60% organic
    else if (randSrc < 0.7) referrer = 'android-app://com.openai.chatgpt'; // 10% AI
    else referrer = ''; // 30% direct/internal

    // Create Session
    sessionStore.insert({
      id: sessionId,
      createdAt: time,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      referrer,
      entryPage: '/discovery/artist/nusrat-fateh-ali-khan'
    });

    // Path Logic (The User Trace)
    // Every user views the entity
    let tOffset = new Date(time).getTime();
    pageviewStore.insert({
      id: `pv_${crypto.randomUUID()}`,
      sessionId,
      timestamp: new Date(tOffset).toISOString(),
      path: '/discovery/artist/nusrat-fateh-ali-khan',
      entitySlug: 'nusrat-fateh-ali-khan'
    });

    // 40% Graph Depth Route
    if (Math.random() < 0.4) {
      tOffset += 45000; // 45 seconds later
      pageviewStore.insert({
        id: `pv_${crypto.randomUUID()}`,
        sessionId,
        timestamp: new Date(tOffset).toISOString(),
        path: '/discovery/song/allah-hoo',
        entitySlug: 'allah-hoo'
      });
      
      tOffset += 20000;
      pageviewStore.insert({
        id: `pv_${crypto.randomUUID()}`,
        sessionId,
        timestamp: new Date(tOffset).toISOString(),
        path: '/discovery/concept/dhikr',
        entitySlug: 'dhikr'
      });
    }

    // 45% Publication Read
    if (Math.random() < 0.45) {
      tOffset += 120000;
      pageviewStore.insert({
        id: `pv_${crypto.randomUUID()}`,
        sessionId,
        timestamp: new Date(tOffset).toISOString(),
        path: '/article/how-nusrat-changed-global-sufi-music',
        entitySlug: 'nusrat-fateh-ali-khan'
      });

      // 60% of Pub Readers open Release
      if (Math.random() < 0.6) {
        tOffset += 180000;
        pageviewStore.insert({
          id: `pv_${crypto.randomUUID()}`,
          sessionId,
          timestamp: new Date(tOffset).toISOString(),
          path: '/release/nfak-and-the-globalization-of-qawwali',
          entitySlug: 'nfak-and-the-globalization-of-qawwali'
        });

        // 70% of Release Openers click YouTube Play
        if (Math.random() < 0.7) {
          tOffset += 5000;
          eventStore.insert({
            id: `evt_${crypto.randomUUID()}`,
            sessionId,
            timestamp: new Date(tOffset).toISOString(),
            eventType: 'click_youtube_play',
            sourcePage: '/release/nfak-and-the-globalization-of-qawwali'
          });

          // 25% of Players transfer to YouTube
          if (Math.random() < 0.25) {
            tOffset += 300000; // 5 mins later
            eventStore.insert({
              id: `evt_${crypto.randomUUID()}`,
              sessionId,
              timestamp: new Date(tOffset).toISOString(),
              eventType: 'click_outbound_youtube',
              sourcePage: '/release/nfak-and-the-globalization-of-qawwali'
            });
          }
        }
      }
    }
  }

  console.log('✅ Seeded 1,000 distinct user session traces for NFAK cluster.');

  // Note: We could expand this to Qawwali and Nund Rishi as well, but this proves the architecture.
}

run().catch(console.error);
