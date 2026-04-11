// GrowDoc Companion — Section-08 UI Tests
//
// Verifies the parsed-signal strip regression canary (placeholder gone for
// non-empty draft), recent-observations widget, and debug waterfall row cap.

import { mountParsedSignalStrip } from '../components/parsed-signal-strip.js';
import { mountRecentObservationsWidget } from '../components/recent-observations-widget.js';
import { renderDebugWaterfall, MAX_WATERFALL_ROWS } from '../components/debug-waterfall.js';
import { initContextualizer, collectObservations, parseAllObservations, getObservationIndex, __resetForTests } from '../data/note-contextualizer/index.js';
import { createStore } from '../store.js';

function scratch() {
  const d = document.createElement('div');
  document.body.appendChild(d);
  return d;
}

function cleanup(...els) {
  for (const el of els) if (el && el.parentNode) el.parentNode.removeChild(el);
}

function makeStore(grow) {
  return createStore({
    profile: {},
    grow: grow || { plants: [], tasks: [] },
    environment: { readings: [] },
    archive: [],
    outcomes: [],
    ui: { sidebarCollapsed: false, activePlantId: null },
  });
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // S08-1 — parsed-signal-strip regression canary: placeholder GONE for non-empty
  {
    __resetForTests();
    const box = scratch();
    const anchor = document.createElement('textarea');
    box.appendChild(anchor);
    anchor.value = 'pH was 5.0, tips burning';
    const strip = mountParsedSignalStrip(anchor, { textarea: anchor });
    strip.refresh();
    assert(strip.element.textContent !== '[parsing soon…]', 'S08: parsed-signal no longer shows placeholder for non-empty draft');
    cleanup(box);
  }

  // S08-2 — parsed-signal strip: empty draft clears to empty, not placeholder
  {
    __resetForTests();
    const box = scratch();
    const anchor = document.createElement('textarea');
    box.appendChild(anchor);
    anchor.value = '';
    const strip = mountParsedSignalStrip(anchor, { textarea: anchor });
    strip.refresh();
    assert(strip.element.textContent === '' || strip.element.children.length === 0, 'S08: empty draft clears strip');
    cleanup(box);
  }

  // S08-3 — Recent Observations widget renders empty state when no obs
  {
    __resetForTests();
    const store = makeStore({ plants: [{ id: 'p1', notes: '' }], tasks: [] });
    initContextualizer(store);
    const box = scratch();
    const w = mountRecentObservationsWidget(box, 'p1');
    assert(w.element.tagName === 'DETAILS', 'S08: Recent Observations widget is a <details>');
    const summary = w.element.querySelector('summary');
    assert(summary && /Recent observations \(0\)/.test(summary.textContent), 'S08: widget reports zero observations');
    cleanup(box);
  }

  // S08-4 — Recent Observations widget lists observations for active plant
  {
    __resetForTests();
    const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
    const grow = {
      plants: [{
        id: 'p1',
        notes: 'keep plant note',
        logs: [
          { id: 'l1', timestamp: daysAgo(1), details: { notes: 'pH was 5.8' } },
          { id: 'l2', timestamp: daysAgo(2), details: { notes: 'looking healthy' } },
        ],
      }],
      tasks: [],
    };
    const store = makeStore(grow);
    initContextualizer(store);
    // Prime the singleton index.
    getObservationIndex();
    const box = scratch();
    const w = mountRecentObservationsWidget(box, 'p1');
    const rows = w.element.querySelectorAll('.nc-recent-row');
    assert(rows.length >= 2, 'S08: widget shows rows for active plant, got ' + rows.length);
    cleanup(box);
  }

  // S08-5 — Debug waterfall respects row cap
  {
    __resetForTests();
    assert(MAX_WATERFALL_ROWS === 200, 'S08: MAX_WATERFALL_ROWS === 200');
    const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();
    const plants = [{
      id: 'p1',
      logs: Array.from({ length: 250 }, (_, i) => ({
        id: 'l' + i,
        timestamp: daysAgo(i + 0.1),
        details: { notes: 'seed note ' + i },
      })),
    }];
    const store = makeStore({ plants, tasks: [] });
    initContextualizer(store);
    getObservationIndex();
    const panel = document.createElement('div');
    panel.id = 'nc-debug-waterfall-panel';
    document.body.appendChild(panel);
    renderDebugWaterfall(panel);
    const rows = panel.querySelectorAll('tr.waterfall-row');
    assert(rows.length === 200, 'S08: waterfall row count capped at 200, got ' + rows.length);
    cleanup(panel);
  }

  // S08-6 — Debug waterfall close button removes panel
  {
    __resetForTests();
    const store = makeStore({ plants: [], tasks: [] });
    initContextualizer(store);
    const panel = document.createElement('div');
    panel.id = 'nc-debug-waterfall-panel';
    document.body.appendChild(panel);
    renderDebugWaterfall(panel);
    const closeBtn = panel.querySelector('.nc-waterfall-close');
    assert(closeBtn !== null, 'S08: waterfall has close button');
    closeBtn.click();
    assert(!document.body.contains(panel), 'S08: close button removes panel');
  }

  // S08-7 — Debug waterfall header row has all 5 columns
  {
    __resetForTests();
    const store = makeStore({ plants: [], tasks: [] });
    initContextualizer(store);
    const panel = document.createElement('div');
    document.body.appendChild(panel);
    renderDebugWaterfall(panel);
    const headers = panel.querySelectorAll('thead th');
    assert(headers.length === 5, 'S08: waterfall has 5 header columns, got ' + headers.length);
    cleanup(panel);
  }

  return results;
}
