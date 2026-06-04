import { discoveryAnalytics } from '../lib/discovery-analytics';
import fs from 'node:fs';
import path from 'node:path';

async function testTelemetry() {
  console.log('--- TESTING DISCOVERY TELEMETRY ENGINE (LAYER 5 — UPDATE) ---');

  // 1. Force initialization and verify files
  discoveryAnalytics.forceHydrate();
  
  const analyticsFile = path.join(process.cwd(), '.data', 'discovery-analytics.json');
  console.log('Analytics file path:', analyticsFile);
  
  if (!fs.existsSync(analyticsFile)) {
    throw new Error('Analytics file was not created on initialization!');
  }
  
  console.log('✔ Telemetry file successfully created/hydrated.');

  // 2. Read baseline counts
  const contentBefore = JSON.parse(fs.readFileSync(analyticsFile, 'utf-8'));
  
  const sabrPageViewBefore = contentBefore.find(
    (t: any) => t.sourceType === 'concept' && t.sourceSlug === 'sabr' && t.actionType === 'page_view'
  );
  
  const initialPageViews = sabrPageViewBefore ? sabrPageViewBefore.count : 0;
  console.log(`Baseline "page_view" count for concept "sabr": ${initialPageViews}`);

  // 3. Simulate click increments
  console.log('Simulating 5 page views for concept "sabr"...');
  discoveryAnalytics.recordClick('concept', 'sabr', 'page_view');
  discoveryAnalytics.recordClick('concept', 'sabr', 'page_view');
  discoveryAnalytics.recordClick('concept', 'sabr', 'page_view');
  discoveryAnalytics.recordClick('concept', 'sabr', 'page_view');
  discoveryAnalytics.recordClick('concept', 'sabr', 'page_view');

  // 4. Verify disk update
  const contentAfter = JSON.parse(fs.readFileSync(analyticsFile, 'utf-8'));
  const sabrPageViewAfter = contentAfter.find(
    (t: any) => t.sourceType === 'concept' && t.sourceSlug === 'sabr' && t.actionType === 'page_view'
  );
  
  const finalPageViews = sabrPageViewAfter ? sabrPageViewAfter.count : 0;
  console.log(`Updated "page_view" count for concept "sabr": ${finalPageViews}`);

  if (finalPageViews !== initialPageViews + 5) {
    throw new Error(`Telemetry mismatch! Expected ${initialPageViews + 5}, but got ${finalPageViews}`);
  }

  console.log('✔ Page view telemetry increment successfully verified on disk.');
  
  // 5. Verify Action Totals API helper
  const actionTotals = discoveryAnalytics.getActionTotals();
  console.log('\nGlobal Action Totals:');
  console.log(JSON.stringify(actionTotals, null, 2));
}

testTelemetry().catch(err => {
  console.error('❌ Telemetry test failed:', err);
  process.exit(1);
});
