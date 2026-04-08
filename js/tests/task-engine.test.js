// GrowDoc Companion — Task Engine Tests (Section 08)

import { generateTasks, evaluateTimeTriggers, evaluateStageTriggers, isDuplicate, getExperienceDetail } from '../components/task-engine.js';
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

  return results;
}
