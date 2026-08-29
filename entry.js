import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.RELEASE_STORAGE_BACKEND = 'filesystem';

import('./run-desc-sync2.js').catch(console.error);
