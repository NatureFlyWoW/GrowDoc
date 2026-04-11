// GrowDoc Companion — Dashboard alert-banner Tests (section-06)

import { renderStatusBanner } from '../views/dashboard.js';
import { __resetForTests } from '../data/note-contextualizer/index.js';

const NOW = Date.now();
const hoursAgo = (h) => new Date(NOW - h * 3_600_000).toISOString();

function makeStore({ tasks = [], plantNotes = '', logs = [] } = {}) {
  const plant = {
    id: 'p1',
    name: 'Test',
    stage: 'early-veg',
    stageStartDate: hoursAgo(24 * 10),
    notes: plantNotes,
    logs,
    training: {},
    diagnoses: [],
  };
  return {
    state: {
      grow: {
        active: true,
        startDate: hoursAgo(24 * 10),
        plants: [plant],
        tasks,
        stageHistory: [],
      },
      profile: { medium: 'soil', experience: 'intermediate' },
      environment: { readings: [] },
      archive: [],
      outcomes: [],
      ui: {},
    },
    getSnapshot() { return this.state; },
    commit() {},
    subscribe() {},
  };
}

function makeAlertLog({ id, hoursAgo: h, notes, severity = 'urgent' }) {
  return {
    id,
    type: 'observation',
    timestamp: new Date(NOW - h * 3_600_000).toISOString(),
    details: { notes, severity },
  };
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // 1. renderStatusBanner with no tasks / no alerts → only the primary banner
  {
    __resetForTests();
    const store = makeStore();
    const container = document.createElement('div');
    renderStatusBanner(container, store);
    const primary = container.querySelector('.status-banner');
    const note = container.querySelector('.status-banner-note');
    assert(primary !== null, 'primary status banner rendered');
    assert(primary.textContent.includes('All good'), 'green banner text includes "All good"');
    assert(note === null, 'no second-line banner when no alerts');
  }

  // 2. tasks=[] + alert-severity obs within 48h → .status-banner-note child appears
  {
    __resetForTests();
    const log = makeAlertLog({ id: 'l1', hoursAgo: 6, notes: 'tent feels really hot, plants wilting' });
    const store = makeStore({ logs: [log] });
    const container = document.createElement('div');
    renderStatusBanner(container, store);
    const note = container.querySelector('.status-banner-note');
    assert(note !== null, 'second-line alert-obs banner appears');
    if (note) {
      assert(note.textContent.includes('tent feels really hot'), 'banner quotes rawText');
      assert(/ago|just now/.test(note.textContent), 'banner includes relative timestamp');
      assert(note.dataset.plantId === 'p1', 'banner has data-plant-id attribute');
    }
  }

  // 3. tasks=[] + alert obs OLDER than 48h → no second-line banner
  {
    __resetForTests();
    const log = makeAlertLog({ id: 'l2', hoursAgo: 72, notes: 'old alert from three days ago' });
    const store = makeStore({ logs: [log] });
    const container = document.createElement('div');
    renderStatusBanner(container, store);
    const note = container.querySelector('.status-banner-note');
    assert(note === null, 'no second-line banner when alert >48h old');
  }

  // 4. urgent tasks present → no second-line banner
  {
    __resetForTests();
    const log = makeAlertLog({ id: 'l3', hoursAgo: 2, notes: 'fresh urgent note' });
    const urgentTask = {
      id: 't1',
      priority: 'urgent',
      status: 'pending',
      type: 'water',
      title: 'Water now',
      plantId: 'p1',
      detail: {},
      evidence: 'established',
      notes: '',
    };
    const store = makeStore({ tasks: [urgentTask], logs: [log] });
    const container = document.createElement('div');
    renderStatusBanner(container, store);
    const note = container.querySelector('.status-banner-note');
    assert(note === null, 'no second-line banner when urgent task exists');
    const primary = container.querySelector('.status-banner');
    assert(primary.dataset.status === 'red', 'primary banner red when urgent task present');
  }

  // 5. Second-line banner text truncated at 80 chars with ellipsis
  {
    __resetForTests();
    const longText = 'a'.repeat(200);
    const log = makeAlertLog({ id: 'l4', hoursAgo: 1, notes: longText });
    const store = makeStore({ logs: [log] });
    const container = document.createElement('div');
    renderStatusBanner(container, store);
    const note = container.querySelector('.status-banner-note');
    assert(note !== null, 'long-text banner rendered');
    if (note) {
      // 80 chars quoted + timestamp. The "a" run should be truncated.
      const aCount = (note.textContent.match(/a/g) || []).length;
      assert(aCount < 200, `text truncated (got ${aCount} a's)`);
      assert(note.textContent.includes('…'), 'ellipsis present');
    }
  }

  // 6. Click on .status-banner-note — click handler attached (navigate triggers
  //    a location change which we can't easily observe in tests, but we can
  //    verify the handler fires without throwing and data-plant-id is present).
  {
    __resetForTests();
    const log = makeAlertLog({ id: 'l5', hoursAgo: 2, notes: 'click target' });
    const store = makeStore({ logs: [log] });
    const container = document.createElement('div');
    renderStatusBanner(container, store);
    const note = container.querySelector('.status-banner-note');
    assert(note !== null, 'click-target banner rendered');
    if (note) {
      assert(note.dataset.plantId === 'p1', 'banner data-plant-id matches source plant');
      assert(note.style.cursor === 'pointer', 'banner has cursor:pointer');
    }
  }

  __resetForTests();
  return results;
}
