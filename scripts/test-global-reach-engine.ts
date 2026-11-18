import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: fs.existsSync('.env.local') ? '.env.local' : '.env' });

import {
  globalReachGrowthEngine,
  generateDeterministicSchedule,
  RATE_BOUNDS,
} from '../lib/global-reach-growth-engine';

async function testGrowthEngine() {
  console.log('====================================================');
  console.log('🧪 SUFIPULSE GLOBAL REACH COUNTER & GROWTH ENGINE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${name}${details ? ` (${details})` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}${details ? ` (${details})` : ''}`);
      failed++;
    }
  }

  // 1. Deterministic Schedule Test
  const sched1 = generateDeterministicSchedule(4242, {
    views: 0.028,
    impressions: 0.035,
    watchHours: 0.022,
    geographies: 0.018,
  });
  const sched2 = generateDeterministicSchedule(4242, {
    views: 0.028,
    impressions: 0.035,
    watchHours: 0.022,
    geographies: 0.018,
  });

  assert(
    'Schedule determinism: Identical seed produces identical 24-month schedules',
    JSON.stringify(sched1) === JSON.stringify(sched2)
  );

  // 2. Bounds enforcement
  const allViewsInBounds = sched1.views.every(
    (r) => r >= RATE_BOUNDS.views.min && r <= RATE_BOUNDS.views.max
  );
  assert('Bounds: All 24 months of Views rates within 1.5% - 4.2%', allViewsInBounds);

  const allImpInBounds = sched1.impressions.every(
    (r) => r >= RATE_BOUNDS.impressions.min && r <= RATE_BOUNDS.impressions.max
  );
  assert('Bounds: All 24 months of Impressions rates within 2.1% - 5.4%', allImpInBounds);

  const allWatchInBounds = sched1.watchHours.every(
    (r) => r >= RATE_BOUNDS.watchHours.min && r <= RATE_BOUNDS.watchHours.max
  );
  assert('Bounds: All 24 months of Watch Hours rates within 1.2% - 3.6%', allWatchInBounds);

  const allGeoInBounds = sched1.geographies.every(
    (r) => r >= RATE_BOUNDS.geographies.min && r <= RATE_BOUNDS.geographies.max
  );
  assert('Bounds: All 24 months of Geographic rates within 1.2% - 2.9%', allGeoInBounds);

  // 3. Stopping Logic: 24-month horizon cap
  const trajectoryMonth24 = globalReachGrowthEngine.calculateModeledTrajectory(24);
  const trajectoryMonth30 = globalReachGrowthEngine.calculateModeledTrajectory(30);
  assert(
    'Stopping logic: 24-month projection horizon freeze',
    trajectoryMonth24.impressions === trajectoryMonth30.impressions,
    `mo24: ${trajectoryMonth24.impressions}, mo30: ${trajectoryMonth30.impressions}`
  );

  // 4. Stopping Logic: Country ceiling at 125
  const ceilingTrajectory = globalReachGrowthEngine.calculateModeledTrajectory(24);
  assert(
    'Stopping logic: Modeled country trajectory stops at ceiling 125',
    ceilingTrajectory.geographies <= 125,
    `trajectory countries: ${ceilingTrajectory.geographies}`
  );

  // 5. Geographic Reach Invariant: Actual verified country count is NEVER capped
  const overCapVerified = {
    impressions: 1000000,
    views: 170000,
    watchHours: 11000,
    geographies: 142, // Verified is 142 (> 125 ceiling)
  };
  const overCapResult = globalReachGrowthEngine.computeReconciledIndex(overCapVerified);
  assert(
    'Geographic invariant: Actual verified country count (142) is never capped at 125',
    overCapResult.combinedIndex.geographies === 142 && overCapResult.modeledAdjustment.geographies === 0,
    `combinedIndex: ${overCapResult.combinedIndex.geographies}, adjustment: ${overCapResult.modeledAdjustment.geographies}`
  );

  // 6. Real-Data Reconciliation & Non-Negative Adjustment
  const baseVerified = {
    impressions: 994300,
    views: 160611,
    watchHours: 10410,
    geographies: 53,
  };
  const res1 = globalReachGrowthEngine.computeReconciledIndex(baseVerified);
  assert(
    'Reconciliation: Initial adjustment is positive and combinedIndex = verified + adjustment',
    res1.modeledAdjustment.impressions >= 0 &&
      res1.combinedIndex.impressions === baseVerified.impressions + res1.modeledAdjustment.impressions
  );

  // Real growth reduces adjustment
  const grownVerified = {
    impressions: baseVerified.impressions + 20000,
    views: baseVerified.views + 5000,
    watchHours: baseVerified.watchHours + 200,
    geographies: 55,
  };
  const res2 = globalReachGrowthEngine.computeReconciledIndex(grownVerified);
  assert(
    'Reconciliation: Real growth reduces modeled adjustment',
    res2.modeledAdjustment.impressions < res1.modeledAdjustment.impressions,
    `initial adj: ${res1.modeledAdjustment.impressions}, after growth adj: ${res2.modeledAdjustment.impressions}`
  );

  // Verified exceeds modeled trajectory -> adjustment is strictly 0, combinedIndex = verified
  const massiveVerified = {
    impressions: 2500000,
    views: 500000,
    watchHours: 50000,
    geographies: 150,
  };
  const resMassive = globalReachGrowthEngine.computeReconciledIndex(massiveVerified);
  assert(
    'Reconciliation: Verified exceeding model trajectory sets adjustment to strictly 0',
    resMassive.modeledAdjustment.impressions === 0 &&
      resMassive.modeledAdjustment.views === 0 &&
      resMassive.combinedIndex.impressions === 2500000 &&
      resMassive.combinedIndex.views === 500000
  );

  assert(
    'Reconciliation: Modeled adjustment is never negative',
    resMassive.modeledAdjustment.impressions >= 0 &&
      resMassive.modeledAdjustment.views >= 0 &&
      resMassive.modeledAdjustment.watchHours >= 0 &&
      resMassive.modeledAdjustment.geographies >= 0
  );

  // 7. Non-Overwrite Invariant: Verified records in snapshot are unchanged
  const store = globalReachGrowthEngine.getStore();
  assert(
    'Data architecture: Verified baseline records remain completely intact',
    store.baseline.metrics.impressions === 994300 &&
      store.baseline.metrics.views === 160611
  );

  // 8. Public Payload Sanitization
  const publicPayload = globalReachGrowthEngine.getPublicPayload(baseVerified);
  assert(
    'Public API: Contains Global Reach Index label and description',
    publicPayload.label === 'Global Reach Index' && publicPayload.enabled === true
  );
  assert(
    'Public API: No leak of seeds, formulas, or monthly rate schedule',
    !('seed' in publicPayload) && !('savedMonthlySchedule' in publicPayload) && !('baseRates' in publicPayload)
  );

  // 9. Admin Configuration Validation (Reject invalid rate out of bounds)
  const invalidRateUpdate = globalReachGrowthEngine.updateConfig({
    baseRates: { views: 0.15 } as any, // 15% is out of 1.5% - 4.2% bounds
  });
  assert(
    'Admin Governance: Rejects views growth rate exceeding allowed bounds (15%)',
    invalidRateUpdate.success === false && !!invalidRateUpdate.error
  );

  const validRateUpdate = globalReachGrowthEngine.updateConfig({
    baseRates: { views: 0.03 }, // 3.0% is within bounds
  });
  assert(
    'Admin Governance: Accepts valid views growth rate within bounds (3.0%)',
    validRateUpdate.success === true
  );

  // Restore 2.8%
  globalReachGrowthEngine.updateConfig({ baseRates: { views: 0.028 } });

  // 10. HTTP Endpoint Security & Route Integrity
  const port = process.env.PORT || '3005';
  const baseUrl = `http://localhost:${port}`;

  try {
    // 10.1 Public endpoint responds HTTP 200 with Global Reach Index
    const pubRes = await fetch(`${baseUrl}/api/public/youtube/global-reach`);
    if (pubRes.status === 200) {
      const pubData = await pubRes.json();
      assert('HTTP Public: GET /api/public/youtube/global-reach returns 200', true);
      assert(
        'HTTP Public: Returns globalReachIndex composite and verified performance',
        !!pubData.globalReachIndex &&
          pubData.globalReachIndex.label === 'Global Reach Index' &&
          typeof pubData.performance.impressions === 'number' &&
          typeof pubData.performance.views === 'number'
      );
      assert(
        'HTTP Public: Verified CTR and Demographics remain strictly un-modeled',
        pubData.performance.clickThroughRate === 8.4 &&
          pubData.ageGender.gender.female === 42.7 &&
          pubData.ageGender.gender.male === 57.3
      );
    } else {
      assert('HTTP Public: GET /api/public/youtube/global-reach returns 200', false, `status: ${pubRes.status}`);
    }

    // 10.2 Admin endpoint security: unauthenticated returns 401
    const unauthAdminGet = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach`);
    assert(
      'Security: Anonymous GET /api/admin/youtube-analytics/global-reach returns 401',
      unauthAdminGet.status === 401,
      `status: ${unauthAdminGet.status}`
    );

    const unauthAdminPost = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    assert(
      'Security: Anonymous POST /api/admin/youtube-analytics/global-reach returns 401',
      unauthAdminPost.status === 401,
      `status: ${unauthAdminPost.status}`
    );

    const unauthAdminSync = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach/sync`, {
      method: 'POST',
    });
    assert(
      'Security: Anonymous POST /api/admin/youtube-analytics/global-reach/sync returns 401',
      unauthAdminSync.status === 401,
      `status: ${unauthAdminSync.status}`
    );

    const unauthAdminReset = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach/reset`, {
      method: 'POST',
    });
    assert(
      'Security: Anonymous POST /api/admin/youtube-analytics/global-reach/reset returns 401',
      unauthAdminReset.status === 401,
      `status: ${unauthAdminReset.status}`
    );

    // 10.3 Authenticated Admin access
    const { generateAccessToken } = require('../server/services/auth');
    const { usersRepository } = require('../server/db/repositories/users');
    const adminUser = usersRepository.listAll().find((u: any) => u.role === 'admin' || u.role === 'super_admin');
    if (adminUser) {
      const adminToken = await generateAccessToken({
        id: adminUser.id,
        role: adminUser.role,
        email: adminUser.email,
      });

      const authAdminGet = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach`, {
        headers: { cookie: `access_token=${adminToken}` },
      });
      assert(
        'Security: Authenticated Admin GET /api/admin/youtube-analytics/global-reach returns 200',
        authAdminGet.status === 200,
        `status: ${authAdminGet.status}`
      );

      const authAdminSync = await fetch(`${baseUrl}/api/admin/youtube-analytics/global-reach/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: `access_token=${adminToken}`,
        },
        body: JSON.stringify({ notes: 'Automated test suite verification sync' }),
      });
      assert(
        'Admin API: Authenticated POST /api/admin/youtube-analytics/global-reach/sync returns 200',
        authAdminSync.status === 200,
        `status: ${authAdminSync.status}`
      );
    }
  } catch (err: any) {
    console.error('HTTP test error:', err);
  }

  console.log('\n====================================================');
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

testGrowthEngine();
