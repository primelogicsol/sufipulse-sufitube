import { cmsStorage } from '../lib/cms-storage';

console.log('=== Phase 2 YouTube Delivery Policy Test ===\n');

// Monkeypatch saveToStorage to prevent polluting real disk data during tests
cmsStorage.saveToStorage = () => {};

const scenarios = [
  {
    name: 'published normal video, no YouTube ID',
    expected: 'REJECT',
    payload: {
      id: 'test_1',
      status: 'published',
      format: 'video',
      youtubeId: ''
    }
  },
  {
    name: 'published normal video with YouTube ID',
    expected: 'PASS',
    payload: {
      id: 'test_2',
      status: 'published',
      format: 'video',
      youtubeId: 'abc123xyz'
    }
  },
  {
    name: 'published webOnly, no YouTube ID',
    expected: 'PASS',
    payload: {
      id: 'test_3',
      status: 'published',
      format: 'video',
      webOnly: true,
      youtubeId: ''
    }
  },
  {
    name: 'published no-format editorial record',
    expected: 'PASS',
    payload: {
      id: 'test_4',
      status: 'published',
      format: undefined,
      youtubeId: ''
    }
  },
  {
    name: 'grandfathered ID 1',
    expected: 'PASS',
    payload: {
      id: 'rel_8202cfce-1a16-415b-acf6-92d0dec7b1f3',
      status: 'published',
      format: 'video',
      youtubeId: ''
    }
  },
  {
    name: 'grandfathered ID 2',
    expected: 'PASS',
    payload: {
      id: 'rel_03cb7141-2051-431c-8997-57552d9dba1b',
      status: 'published',
      format: 'video',
      youtubeId: ''
    }
  },
  {
    name: 'grandfathered ID 3',
    expected: 'PASS',
    payload: {
      id: 'rel_05dfe093-88ad-4cfc-9cfa-7c4308a353af',
      status: 'published',
      format: 'video',
      youtubeId: ''
    }
  },
  {
    name: 'unrelated future flagship/no-source video',
    expected: 'REJECT',
    payload: {
      id: 'test_future_flagship',
      status: 'published',
      format: 'video',
      releaseType: 'flagship',
      source: undefined,
      youtubeId: ''
    }
  },
  {
    name: 'draft without YouTube ID',
    expected: 'PASS',
    payload: {
      id: 'test_draft',
      status: 'draft',
      format: 'video',
      youtubeId: ''
    }
  },
  {
    name: 'unpublished without YouTube ID',
    expected: 'PASS',
    payload: {
      id: 'test_unpub',
      status: 'unpublished',
      format: 'video',
      youtubeId: ''
    }
  }
];

let failed = 0;

for (const sc of scenarios) {
  let result = 'PASS';
  try {
    cmsStorage.saveRelease(sc.payload);
  } catch (e) {
    if (e.message.includes('A YouTube ID is required')) {
      result = 'REJECT';
    } else {
      result = `ERROR: ${e.message}`;
    }
  }

  const pass = result === sc.expected;
  if (!pass) failed++;
  
  console.log(`Scenario: ${sc.name.padEnd(50)}`);
  console.log(`Expected: ${sc.expected.padEnd(10)} Actual: ${result.padEnd(10)} [${pass ? 'OK' : 'FAIL'}]\n`);
}

console.log(`Total scenarios: ${scenarios.length}`);
console.log(`Passed: ${scenarios.length - failed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nPOLICY TEST: PASS');
}
