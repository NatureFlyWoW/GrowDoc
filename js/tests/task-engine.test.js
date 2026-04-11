// GrowDoc Companion — Task Engine Tests (Section 08 + Section 07 extensions)

import { generateTasks, evaluateTimeTriggers, evaluateStageTriggers, evaluateEnvironmentTriggers, isDuplicate, getExperienceDetail, overrideSuppression, TASK_WINDOW_HOURS } from '../components/task-engine.js';
import { checkRedundancy, checkContradiction, inferAlertTrigger } from '../components/task-engine-note-guards.js';
import { parseAllObservations, collectObservations, __resetForTests } from '../data/note-contextualizer/index.js';
import { renderTaskCard } from '../components/task-card.js';
import { createStore } from '../store.js';

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

  // ── Time-Based Trigger Tests ────────────────────────────────────

  // Soil watering interval
  {
    const plant = {
      id: 'p1', name: 'Test', stage: 'late-veg', potSize: 3,
      stageStartDate: daysAgo(10),
      logs: [{ date: daysAgo(4), type: 'water' }]
    };
    const tasks = evaluateTimeTriggers(plant, { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } }, []);
    const waterTask = tasks.find(t => t.type === 'water');
    assert(waterTask !== undefined, 'soil watering task generated after interval (4 days for 3L late-veg)');
  }

  // Coco flower watering (daily)
  {
    const plant = {
      id: 'p2', name: 'Coco', stage: 'mid-flower', potSize: 5,
      stageStartDate: daysAgo(10),
      logs: [{ date: daysAgo(2), type: 'water' }]
    };
    const tasks = evaluateTimeTriggers(plant, { medium: 'coco', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } }, []);
    const waterTask = tasks.find(t => t.type === 'water');
    assert(waterTask !== undefined, 'coco watering task generated (2 days since last water in flower)');
  }

  // Feeding frequency for soil
  {
    const plant = {
      id: 'p3', name: 'Soil', stage: 'late-veg', potSize: 5,
      stageStartDate: daysAgo(10),
      logs: [
        { date: daysAgo(8), type: 'feed' },
        { date: daysAgo(5), type: 'water' },
        { date: daysAgo(3), type: 'water' },
      ]
    };
    const tasks = evaluateTimeTriggers(plant, { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } }, []);
    const feedTask = tasks.find(t => t.type === 'feed');
    assert(feedTask !== undefined, 'soil feeding task generated after 2 waterings since last feed');
  }

  // Check-in reminder
  {
    const plant = {
      id: 'p4', name: 'Neglected', stage: 'early-veg', potSize: 5,
      stageStartDate: daysAgo(10),
      logs: [{ date: daysAgo(4), type: 'water' }]
    };
    const tasks = evaluateTimeTriggers(plant, { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } }, []);
    const checkTask = tasks.find(t => t.type === 'check');
    assert(checkTask !== undefined, 'check-in task generated after 3+ days without log');
  }

  // No duplicates
  {
    const plant = {
      id: 'p5', name: 'Dup', stage: 'late-veg', potSize: 3,
      stageStartDate: daysAgo(10),
      logs: [{ date: daysAgo(4), type: 'water' }]
    };
    const existing = [{ plantId: 'p5', type: 'water', status: 'pending', title: 'Water Dup' }];
    const tasks = evaluateTimeTriggers(plant, { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } }, existing);
    const waterTasks = tasks.filter(t => t.type === 'water');
    assert(waterTasks.length === 0, 'no duplicate water task when pending exists');
  }

  // ── Stage-Based Trigger Tests ───────────────────────────────────

  // Stage transition suggestion
  {
    const plant = {
      id: 'p6', name: 'Trans', stage: 'seedling',
      stageStartDate: daysAgo(11), potSize: 5, logs: [], training: {}, diagnoses: []
    };
    const tasks = evaluateStageTriggers(plant, {}, []);
    const stageTask = tasks.find(t => t.type === 'stage');
    assert(stageTask !== undefined, 'stage transition task generated at typical duration');
  }

  // Defoliation task in early flower
  {
    const plant = {
      id: 'p7', name: 'Defol', stage: 'early-flower',
      stageStartDate: daysAgo(1), potSize: 5, logs: []
    };
    const tasks = evaluateStageTriggers(plant, {}, []);
    const defolTask = tasks.find(t => t.type === 'defoliate');
    assert(defolTask !== undefined, 'defoliation task generated in early flower day 1');
  }

  // Harvest check in late flower
  {
    const plant = {
      id: 'p8', name: 'Harv', stage: 'late-flower',
      stageStartDate: daysAgo(10), potSize: 5, logs: []
    };
    const tasks = evaluateStageTriggers(plant, {}, []);
    const harvTask = tasks.find(t => t.type === 'harvest');
    assert(harvTask !== undefined, 'harvest check task generated in late flower');
  }

  // Cure burp reminders
  {
    const plant = {
      id: 'p9', name: 'Cure', stage: 'curing',
      stageStartDate: daysAgo(5), potSize: 5, logs: []
    };
    const tasks = evaluateStageTriggers(plant, {}, []);
    const burpTask = tasks.find(t => t.title.includes('Burp'));
    assert(burpTask !== undefined, 'cure burp task generated');
  }

  // ── Experience Adaptation Tests ─────────────────────────────────

  {
    const task = {
      detail: {
        beginner: 'Water Plant 1 — pH 6.3, EC 1.4, aim for 20% runoff.',
        intermediate: 'Water Plant 1 — pH 6.0-6.5, EC 1.2-1.6.',
        expert: 'Water due (soil, 5L, day 5)',
      }
    };

    assert(getExperienceDetail(task, 'beginner').includes('6.3'), 'beginner detail includes specific pH');
    assert(getExperienceDetail(task, 'intermediate').includes('6.0-6.5'), 'intermediate includes range');
    assert(getExperienceDetail(task, 'expert').includes('Water due'), 'expert is brief');
    assert(getExperienceDetail(task, 'first-grow').includes('6.3'), 'first-grow uses beginner detail');
    assert(getExperienceDetail(task, 'advanced').includes('Water due'), 'advanced uses expert detail');
  }

  // ── Task Card Rendering Tests ───────────────────────────────────

  {
    const container = document.createElement('div');
    const task = {
      id: 't1', plantId: 'p1', type: 'water', priority: 'recommended',
      title: 'Water Test Plant', evidence: 'established', notes: '',
      detail: { beginner: 'Full detail', intermediate: 'Medium', expert: 'Brief' },
      status: 'pending', snoozeUntil: null, generatedDate: new Date().toISOString(), completedDate: null,
    };

    let doneId = null;
    renderTaskCard(container, task, {
      experienceLevel: 'intermediate',
      onDone: (id) => { doneId = id; },
    });

    const card = container.querySelector('.task-card');
    assert(card !== null, 'task card rendered');
    assert(card.querySelector('.task-title').textContent === 'Water Test Plant', 'task title shown');
    assert(card.querySelector('.task-detail').textContent === 'Medium', 'intermediate detail shown');

    // Click done
    const doneBtn = card.querySelector('.btn-primary');
    if (doneBtn) doneBtn.click();
    assert(doneId === 't1', 'onDone callback fires with task ID');
  }

  // ── isDuplicate Tests ───────────────────────────────────────────

  {
    const task = { plantId: 'p1', type: 'water', title: 'Water Plant 1' };
    const existing = [
      { plantId: 'p1', type: 'water', title: 'Water Plant 1', status: 'pending' },
    ];
    assert(isDuplicate(task, existing), 'duplicate detected for pending task');

    const existing2 = [
      { plantId: 'p1', type: 'water', title: 'Water Plant 1', status: 'done' },
    ];
    assert(!isDuplicate(task, existing2), 'done tasks are not duplicates');
  }

  // ── Section-07: Note-Guard Tests ────────────────────────────────

  // Helper: build a parsed observation with explicit keywords.
  const mkObs = (opts) => ({
    id: opts.id || 'obs-' + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    observedAt: opts.observedAt || new Date().toISOString(),
    plantId: opts.plantId || 'p1',
    source: opts.source || 'log',
    sourceRefId: opts.sourceRefId || 'l1',
    domains: opts.domains || [],
    severityRaw: opts.severityRaw || null,
    severity: opts.severity || 'info',
    severityAutoInferred: false,
    rawText: opts.rawText || '',
    parsed: {
      ctx: {},
      observations: [],
      actionsTaken: opts.actionsTaken || [],
      questions: [],
      keywords: opts.keywords || [],
      frankoOverrides: [],
    },
    tags: [],
  });

  // S07-1 — checkRedundancy: recent water action suppresses water task
  {
    __resetForTests();
    const obs = mkObs({
      observedAt: new Date(Date.now() - 3600000).toISOString(), // 1h ago
      rawText: 'just watered 500ml',
      actionsTaken: [{ type: 'water', value: 'just watered 500ml' }],
      keywords: ['action-watered'],
    });
    const result = checkRedundancy('water', [obs]);
    assert(result.suppressed === true, 'S07: water action within 12h suppresses water task');
    assert(result.obsIds.length === 1 && result.obsIds[0] === obs.id, 'S07: checkRedundancy returns obsId');
    assert(result.noteRef && result.noteRef.rawText === 'just watered 500ml', 'S07: noteRef carries rawText');
  }

  // S07-2 — checkRedundancy: stale action does NOT suppress
  {
    const obs = mkObs({
      observedAt: new Date(Date.now() - 24 * 3600000).toISOString(), // 24h ago (beyond 12h water window)
      rawText: 'watered yesterday',
      actionsTaken: [{ type: 'water', value: 'watered yesterday' }],
      keywords: ['action-watered'],
    });
    const result = checkRedundancy('water', [obs]);
    assert(result.suppressed === false, 'S07: water action older than 12h does NOT suppress');
  }

  // S07-3 — checkRedundancy windows are canonical
  {
    assert(TASK_WINDOW_HOURS.water === 12, 'S07: water window = 12h');
    assert(TASK_WINDOW_HOURS.feed === 24, 'S07: feed window = 24h');
    assert(TASK_WINDOW_HOURS.flush === 48, 'S07: flush window = 48h');
    assert(TASK_WINDOW_HOURS.ipm === 72, 'S07: ipm window = 72h');
    assert(TASK_WINDOW_HOURS.defoliate === 168, 'S07: defoliate window = 168h');
    assert(TASK_WINDOW_HOURS.top === 336, 'S07: top window = 336h');
  }

  // S07-4 — Wizard/profile observation does NOT suppress
  {
    const obs = mkObs({
      source: 'profile',
      observedAt: new Date(Date.now() - 3600000).toISOString(),
      rawText: 'I flush weekly',
      actionsTaken: [{ type: 'flush', value: 'flush weekly' }],
      keywords: ['action-flushed'],
    });
    const result = checkRedundancy('flush', [obs]);
    assert(result.suppressed === false, 'S07: profile source excluded from suppression');
  }

  // S07-5 — inferAlertTrigger: alert severity within 48h triggers
  {
    const obs = mkObs({
      observedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      severity: 'alert',
      rawText: 'leaves look terrible',
    });
    const result = inferAlertTrigger([obs]);
    assert(result.trigger === true, 'S07: alert severity within 48h triggers diagnose');
    assert(result.obsIds.length === 1, 'S07: trigger returns obsIds');
  }

  // S07-6 — inferAlertTrigger: stale alert does NOT trigger
  {
    const obs = mkObs({
      observedAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      severity: 'alert',
    });
    const result = inferAlertTrigger([obs]);
    assert(result.trigger === false, 'S07: alert older than 48h does not trigger');
  }

  // S07-7 — inferAlertTrigger: worsening keyword triggers even at info severity
  {
    const obs = mkObs({
      observedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      severity: 'info',
      keywords: ['getting-worse'],
    });
    const result = inferAlertTrigger([obs]);
    assert(result.trigger === true, 'S07: worsening keyword triggers diagnose');
  }

  // S07-8 — checkContradiction: sensor in-range + alert env note → conflict
  {
    const obs = mkObs({
      observedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      severity: 'alert',
      domains: ['environment'],
      rawText: 'tent feels really hot',
    });
    const result = checkContradiction({ temp: true, rh: true, vpd: true }, [obs]);
    assert(result.conflict === true, 'S07: env contradiction fires on alert note vs in-range sensor');
    assert(result.obsId === obs.id, 'S07: contradiction returns the citing obsId');
  }

  // S07-9 — checkContradiction: info severity does NOT fire
  {
    const obs = mkObs({
      observedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      severity: 'info',
      domains: ['environment'],
    });
    const result = checkContradiction({ temp: true, rh: true, vpd: true }, [obs]);
    assert(result.conflict === false, 'S07: env contradiction ignores non-alert notes');
  }

  // S07-10 — overrideSuppression creates real log entry + commits grow
  {
    const store = createStore({
      grow: {
        plants: [{ id: 'pOvr', name: 'Test', logs: [] }],
        tasks: [],
      },
      profile: {},
      environment: { readings: [] },
      archive: [],
      outcomes: [],
      ui: {},
    });
    const newLogId = overrideSuppression(store, 'task-123', 'pOvr', 'water');
    assert(typeof newLogId === 'string' && newLogId.length > 0, 'S07: overrideSuppression returns log id');
    const updatedPlant = store.state.grow.plants.find(p => p.id === 'pOvr');
    assert(updatedPlant && Array.isArray(updatedPlant.logs), 'S07: override committed plant.logs');
    const overrideLog = updatedPlant.logs.find(l => l.type === 'override');
    assert(overrideLog && overrideLog.details.notes === 'Manual override: water', 'S07: override log has correct notes');
    assert(overrideLog && overrideLog.details.severity === null, 'S07: override log has null severity');
  }

  // S07-11 — Suppressed task carries metadata through evaluateTimeTriggers
  {
    __resetForTests();
    const plant = {
      id: 'p1', name: 'Test', stage: 'late-veg', potSize: 3,
      stageStartDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      logs: [
        { id: 'l-water', date: new Date(Date.now() - 5 * 86400000).toISOString(), type: 'water' },
      ],
    };
    const observations = [mkObs({
      plantId: 'p1',
      observedAt: new Date(Date.now() - 3600000).toISOString(),
      rawText: 'just watered with pH 6.3',
      actionsTaken: [{ type: 'water', value: 'just watered' }],
      keywords: ['action-watered'],
    })];
    const tasks = evaluateTimeTriggers(plant, { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } }, [], observations);
    const waterTask = tasks.find(t => t.type === 'water');
    assert(waterTask !== undefined, 'S07: water task still emitted even when suppressed');
    assert(Array.isArray(waterTask.suppressedBy) && waterTask.suppressedBy.length > 0, 'S07: suppressed water task carries suppressedBy[]');
    assert(waterTask.suppressedNoteRef && waterTask.suppressedNoteRef.rawText === 'just watered with pH 6.3', 'S07: suppressed task carries noteRef');
  }

  // S07-12 — Regression: zero observations produces identical task list
  {
    __resetForTests();
    const plant = {
      id: 'p-regression', name: 'R', stage: 'late-veg', potSize: 3,
      stageStartDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      logs: [{ id: 'lw', date: new Date(Date.now() - 5 * 86400000).toISOString(), type: 'water' }],
    };
    const profile = { medium: 'soil', priorities: { yield: 3, quality: 3, terpenes: 3, effect: 3 } };
    const baseline = evaluateTimeTriggers(plant, profile, []);
    const withEmptyObs = evaluateTimeTriggers(plant, profile, [], []);
    assert(baseline.length === withEmptyObs.length, 'S07 regression: same task count');
    const baseTypes = baseline.map(t => t.type).sort().join(',');
    const withTypes = withEmptyObs.map(t => t.type).sort().join(',');
    assert(baseTypes === withTypes, 'S07 regression: same task types');
    for (const t of withEmptyObs) {
      assert(!('suppressedBy' in t) || t.suppressedBy === undefined, 'S07 regression: no suppressedBy when obs empty');
    }
  }

  return results;
}
