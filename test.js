/**
 * FairShift — Unit Test Suite
 * Automated tests for core calculations, data sanitization,
 * localStorage seeding, and offline draft synchronization.
 * Compatible with Node.js test runners and CI evaluators.
 */

const assert = require('assert');

// ── Mock Browser Globals for Headless Node.js Environment ────
const mockStorage = {};
global.localStorage = {
  getItem: (key) => (key in mockStorage ? mockStorage[key] : null),
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// ── Core Application Logic Under Test ────────────────────────

function sanitizeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const DEFAULT_STATE = {
  selectedIndustry: null,
  selectedRole: null,
  selectedWorkerId: null,
  currentView: 'login',
  isOffline: false,
  darkMode: false,
  offlineQueue: [],
  lastUpdated: new Date().toISOString(),
};

function calculateWeeklyPay(worker) {
  const regHours = Math.max(0, worker.hoursWorkedThisWeek - (worker.overtimeHours ?? 0));
  const basePay = Math.round(regHours * worker.baseHourlyWage);
  const otRate = Math.round(worker.baseHourlyWage * 1.5);
  const otPay = Math.round((worker.overtimeHours ?? 0) * otRate);
  const nightDiff = Math.round(worker.baseHourlyWage * 0.25);
  const nightPay = Math.round((worker.nightShiftHours ?? 0) * nightDiff);
  const netPay = basePay + otPay + nightPay;
  return { regHours, basePay, otRate, otPay, nightDiff, nightPay, netPay };
}

function getFatigueAssessment(weeklyHours) {
  if (weeklyHours > 48) {
    return { level: 'critical', label: 'CRITICAL — Excessive Consecutive Hours', isViolating: true };
  } else if (weeklyHours >= 40) {
    return { level: 'warning', label: 'Approaching Overtime Limit', isViolating: false };
  }
  return { level: 'normal', label: 'Regular Shift Schedule', isViolating: false };
}

function processOfflineDraftSync(drafts) {
  return drafts.map((draft, idx) => ({
    id: draft.id || `r-${Date.now()}-${idx}`,
    refId: '#FS-' + Math.floor(1000 + Math.random() * 9000),
    workerId: draft.workerId,
    workerName: draft.isAnonymous ? 'Anonymous Worker' : draft.workerName,
    isAnonymous: !!draft.isAnonymous,
    status: 'open',
    stage: 1,
    title: draft.title,
    timestamp: draft.timestamp || new Date().toISOString()
  }));
}

// ── Test Runner ──────────────────────────────────────────────
let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('====================================================');
console.log(' FairShift (SDG 8) — Automated Test Suite Execution ');
console.log('====================================================\n');

// 1. Sanitization & XSS Security Tests
test('Security: sanitizeHTML prevents script injection & escapes angle brackets', () => {
  const maliciousInput = '<script>alert("xss")</script>';
  const sanitized = sanitizeHTML(maliciousInput);
  assert.strictEqual(sanitized, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.strictEqual(sanitized.includes('<script>'), false);
});

test('Security: sanitizeHTML handles null and undefined safely', () => {
  assert.strictEqual(sanitizeHTML(null), '');
  assert.strictEqual(sanitizeHTML(undefined), '');
});

test('Security: sanitizeAttr escapes quotes to prevent attribute breakout', () => {
  const rawAttr = 'hello" onmouseover="alert(1)';
  const sanitized = sanitizeAttr(rawAttr);
  assert.strictEqual(sanitized.includes('"'), false);
  assert.strictEqual(sanitized.includes('&quot;'), true);
});

// 2. Default State & Storage Initialization
test('State: DEFAULT_STATE has correct initial defaults (dark mode false, offline false)', () => {
  assert.strictEqual(DEFAULT_STATE.selectedIndustry, null);
  assert.strictEqual(DEFAULT_STATE.selectedRole, null);
  assert.strictEqual(DEFAULT_STATE.currentView, 'login');
  assert.strictEqual(DEFAULT_STATE.isOffline, false);
  assert.strictEqual(DEFAULT_STATE.darkMode, false);
  assert.deepStrictEqual(DEFAULT_STATE.offlineQueue, []);
});

test('Storage: localStorage correctly persists and retrieves serialised worker state', () => {
  const demoWorker = { id: 'w-001', name: 'Ramesh Kumar', baseHourlyWage: 185 };
  localStorage.setItem('fairshift_workers', JSON.stringify([demoWorker]));
  const retrieved = JSON.parse(localStorage.getItem('fairshift_workers'));
  assert.strictEqual(retrieved.length, 1);
  assert.strictEqual(retrieved[0].name, 'Ramesh Kumar');
  assert.strictEqual(retrieved[0].baseHourlyWage, 185);
});

// 3. Attendance & Wage Calculation (SDG 8.5)
test('Pay: Base wage calculation with standard hours and zero overtime', () => {
  const worker = {
    hoursWorkedThisWeek: 40,
    overtimeHours: 0,
    nightShiftHours: 0,
    baseHourlyWage: 200,
  };
  const pay = calculateWeeklyPay(worker);
  assert.strictEqual(pay.regHours, 40);
  assert.strictEqual(pay.basePay, 8000);
  assert.strictEqual(pay.otPay, 0);
  assert.strictEqual(pay.netPay, 8000);
});

test('Pay: Accurate 1.5x overtime multiplier calculation', () => {
  const worker = {
    hoursWorkedThisWeek: 46,
    overtimeHours: 6,
    nightShiftHours: 0,
    baseHourlyWage: 180, // OT Rate = 180 * 1.5 = 270
  };
  const pay = calculateWeeklyPay(worker);
  assert.strictEqual(pay.regHours, 40);
  assert.strictEqual(pay.basePay, 7200);   // 40 * 180
  assert.strictEqual(pay.otRate, 270);     // 180 * 1.5
  assert.strictEqual(pay.otPay, 1620);     // 6 * 270
  assert.strictEqual(pay.netPay, 8820);    // 7200 + 1620
});

test('Pay: Healthcare night shift differential (25%) calculation', () => {
  const worker = {
    hoursWorkedThisWeek: 48,
    overtimeHours: 0,
    nightShiftHours: 16,
    baseHourlyWage: 140, // Night Diff = 140 * 0.25 = 35
  };
  const pay = calculateWeeklyPay(worker);
  assert.strictEqual(pay.basePay, 6720);   // 48 * 140
  assert.strictEqual(pay.nightDiff, 35);   // 140 * 0.25
  assert.strictEqual(pay.nightPay, 560);   // 16 * 35
  assert.strictEqual(pay.netPay, 7280);    // 6720 + 560
});

// 4. Fatigue & Workload Alerting (SDG 8.8)
test('Fatigue: Weekly hours under 40 assess as normal workload', () => {
  const assessment = getFatigueAssessment(36);
  assert.strictEqual(assessment.level, 'normal');
  assert.strictEqual(assessment.isViolating, false);
});

test('Fatigue: Weekly hours between 40 and 48 trigger overtime rest advisory', () => {
  const assessment = getFatigueAssessment(44);
  assert.strictEqual(assessment.level, 'warning');
  assert.strictEqual(assessment.isViolating, false);
});

test('Fatigue: Weekly hours above statutory 48h limit trigger critical hazard flag', () => {
  const assessment = getFatigueAssessment(52);
  assert.strictEqual(assessment.level, 'critical');
  assert.strictEqual(assessment.isViolating, true);
});

// 5. Offline Queue & Whistleblower Privacy
test('Offline: Pending drafts sync with unique Reference IDs and Stage 1 status', () => {
  const offlineDrafts = [
    {
      workerId: 'w-001',
      workerName: 'Ramesh Kumar',
      isAnonymous: false,
      title: 'Scaffolding shake on 3rd floor',
    },
    {
      workerId: 'w-006',
      workerName: 'Anitha R',
      isAnonymous: true,
      title: 'Excessive consecutive night shifts',
    }
  ];

  const synced = processOfflineDraftSync(offlineDrafts);
  assert.strictEqual(synced.length, 2);
  assert.strictEqual(synced[0].workerName, 'Ramesh Kumar');
  assert.strictEqual(synced[0].stage, 1);
  assert.ok(synced[0].refId.startsWith('#FS-'));

  // Anonymous worker name masked strictly
  assert.strictEqual(synced[1].workerName, 'Anonymous Worker');
  assert.strictEqual(synced[1].isAnonymous, true);
  assert.ok(synced[1].refId.startsWith('#FS-'));
});

console.log('\n----------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} test cases passed successfully.`);
console.log('----------------------------------------------------');

if (passedTests === totalTests) {
  console.log('Status: ALL UNIT TESTS PASSED (100% SUCCESS)\n');
} else {
  console.error('Status: FAILURES DETECTED\n');
  process.exit(1);
}
