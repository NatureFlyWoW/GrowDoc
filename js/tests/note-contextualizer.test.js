// GrowDoc Companion — Note Contextualizer Tests (section-01)
//
// Covers the Observation schema, pure projection walker, singleton index,
// store hook, sidecar citations, and test reset helper. Stubs for
// parseObservation / mergeNoteContext are asserted to return empty shapes.

import {
  collectObservations,
  parseObservation,
  initContextualizer,
  getObservationIndex,
  getRelevantObservations,
  mergeNoteContext,
  findActionsTakenSince,
  recordReferencedIn,
  getCitationsFor,
  __resetForTests,
} from '../data/note-contextualizer/index.js';
import { createStore } from '../store.js';

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

function makeStore(initial = {}) {
  return createStore({
    profile: initial.profile || {},
    grow: initial.grow || { plants: [], tasks: [] },
    environment: { readings: [] },
    archive: [],
    outcomes: [],
    ui: { sidebarCollapsed: false },
  });
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // 1 — Empty grow yields empty array
  {
    __resetForTests();
    const out = collectObservations({}, {});
    assert(Array.isArray(out) && out.length === 0, 'collectObservations: empty grow yields empty array');
  }

  // 2 — profile.notes walker
  {
    __resetForTests();
    const profile = {
      updatedAt: daysAgo(1),
      notes: {
        stage: 'wk3 veg',
        medium: '',        // empty should be skipped
        lighting: 'LED 400w',
      },
    };
    const out = collectObservations({}, profile);
    const steps = out.filter(o => o.source === 'profile').map(o => o.wizardStep).sort();
    assert(out.length === 2, 'profile.notes: emits one obs per non-empty wizardStep');
    assert(steps.join(',') === 'lighting,stage', 'profile.notes: wizardStep names correct');
    assert(out.every(o => o.source === 'profile' && !o.sourceRefId), 'profile source has no sourceRefId');
  }

  // 3 — plant.notes walker
  {
    __resetForTests();
    const grow = {
      plants: [
        { id: 'p1', notes: 'tall pheno', stageStartDate: daysAgo(5) },
        { id: 'p2', notes: '' },
        { id: 'p3', notes: 'yellowing' },
      ],
    };
    const out = collectObservations(grow, {});
    const plantObs = out.filter(o => o.source === 'plant');
    assert(plantObs.length === 2, 'plant.notes: emits one obs per plant with non-empty notes');
    assert(plantObs.every(o => o.sourceRefId === o.plantId), 'plant source: sourceRefId === plantId');
  }

  // 4 — plant.logs[*].details.notes walker + observedAt + severity mapping
  {
    __resetForTests();
    const ts = daysAgo(2);
    const grow = {
      plants: [{
        id: 'p1',
        logs: [
          { id: 'l1', type: 'water', timestamp: ts, details: { notes: 'gave 500ml', severity: null } },
          { id: 'l2', type: 'observation', timestamp: daysAgo(1), details: { notes: 'looks happy', severity: 'urgent' } },
          { id: 'l3', type: 'water', timestamp: daysAgo(1), details: { notes: '' } },
          { id: 'l4', type: 'observation', timestamp: daysAgo(1), details: { notes: 'slight droop', severity: 'concern' } },
        ],
      }],
    };
    const out = collectObservations(grow, {});
    const logObs = out.filter(o => o.source === 'log');
    assert(logObs.length === 3, 'logs: emits one obs per non-empty details.notes');
    const l1 = logObs.find(o => o.sourceRefId === 'l1');
    assert(l1 && l1.observedAt === ts, 'logs: observedAt == log.timestamp');
    assert(l1 && l1.severityRaw === null && l1.severity === 'info', 'logs: null severity → info');
    assert(l1 && l1.severityAutoInferred === false, 'logs: severityAutoInferred defaults to false');
    const l2 = logObs.find(o => o.sourceRefId === 'l2');
    assert(l2 && l2.severityRaw === 'urgent' && l2.severity === 'alert', 'logs: urgent → alert');
    const l4 = logObs.find(o => o.sourceRefId === 'l4');
    assert(l4 && l4.severityRaw === 'concern' && l4.severity === 'watch', 'logs: concern → watch');
  }

  // 4b — observedAt fallback for plant source (stageStartDate → createdAt)
  {
    __resetForTests();
    const start = daysAgo(4);
    const created = daysAgo(20);
    const grow = {
      plants: [
        { id: 'pA', notes: 'uses stageStartDate', stageStartDate: start, createdAt: created },
        { id: 'pB', notes: 'uses createdAt', createdAt: created },
      ],
    };
    const out = collectObservations(grow, {});
    const pA = out.find(o => o.plantId === 'pA' && o.source === 'plant');
    const pB = out.find(o => o.plantId === 'pB' && o.source === 'plant');
    assert(pA && pA.observedAt === start, 'plant source: observedAt === stageStartDate when present');
    assert(pB && pB.observedAt === created, 'plant source: observedAt === createdAt when stageStartDate missing');
  }

  // 4c — observedAt fallback for task source (updatedAt → createdAt)
  {
    __resetForTests();
    const updated = daysAgo(1);
    const created = daysAgo(3);
    const grow = {
      plants: [],
      tasks: [
        { id: 'tA', plantId: 'p1', notes: 'uses updatedAt', updatedAt: updated, createdAt: created },
        { id: 'tB', plantId: 'p2', notes: 'uses createdAt', createdAt: created },
      ],
    };
    const out = collectObservations(grow, {});
    const tA = out.find(o => o.sourceRefId === 'tA');
    const tB = out.find(o => o.sourceRefId === 'tB');
    assert(tA && tA.observedAt === updated, 'task source: observedAt === updatedAt when present');
    assert(tB && tB.observedAt === created, 'task source: observedAt === createdAt when updatedAt missing');
  }

  // 5 — grow.tasks[*].notes walker
  {
    __resetForTests();
    const grow = {
      plants: [],
      tasks: [
        { id: 't1', plantId: 'p1', notes: 'topped today', updatedAt: daysAgo(1) },
        { id: 't2', plantId: 'p2', notes: '' },
      ],
    };
    const out = collectObservations(grow, {});
    const taskObs = out.filter(o => o.source === 'task');
    assert(taskObs.length === 1, 'tasks: emits one obs per non-empty task.notes');
    assert(taskObs[0].plantId === 'p1', 'tasks: plantId from task.plantId');
  }

  // 6 — Stage-transition source
  {
    __resetForTests();
    const grow = {
      plants: [{
        id: 'p1',
        logs: [
          { id: 'lx', type: 'stage-transition', timestamp: daysAgo(3), details: { notes: 'moved to flower' } },
        ],
      }],
    };
    const out = collectObservations(grow, {});
    const st = out.find(o => o.source === 'stage-transition');
    assert(st && st.sourceRefId === 'lx', 'stage-transition: source + sourceRefId correct');
  }

  // 7 — Deterministic ID across two calls on identical input
  {
    __resetForTests();
    const grow = { plants: [{ id: 'p1', notes: 'same text' }] };
    const a = collectObservations(grow, {});
    const b = collectObservations(grow, {});
    assert(a[0].id === b[0].id, 'Observation.id is deterministic across two calls');
  }

  // 8 — ID differs when rawText changes
  {
    __resetForTests();
    const a = collectObservations({ plants: [{ id: 'p1', notes: 'v1' }] }, {});
    const b = collectObservations({ plants: [{ id: 'p1', notes: 'v2' }] }, {});
    assert(a[0].id !== b[0].id, 'Observation.id differs when rawText changes');
  }

  // 9 — Non-profile sources require sourceRefId
  {
    __resetForTests();
    const grow = {
      plants: [{ id: 'p1', notes: 'A', logs: [{ id: 'l1', timestamp: daysAgo(1), details: { notes: 'B' } }] }],
      tasks: [{ id: 't1', plantId: 'p1', notes: 'C' }],
    };
    const out = collectObservations(grow, {});
    const nonProfile = out.filter(o => o.source !== 'profile');
    assert(nonProfile.every(o => !!o.sourceRefId), 'non-profile sources all carry sourceRefId');
  }

  // 10 — opts.plantId filter
  {
    __resetForTests();
    const grow = {
      plants: [
        { id: 'p1', notes: 'A' },
        { id: 'p2', notes: 'B' },
      ],
    };
    const out = collectObservations(grow, {}, { plantId: 'p2' });
    assert(out.length === 1 && out[0].plantId === 'p2', 'opts.plantId filter works');
  }

  // 11 — opts.since filter
  {
    __resetForTests();
    const grow = {
      plants: [{
        id: 'p1',
        logs: [
          { id: 'l-old', timestamp: daysAgo(30), details: { notes: 'old' } },
          { id: 'l-new', timestamp: daysAgo(1), details: { notes: 'new' } },
        ],
      }],
    };
    const out = collectObservations(grow, {}, { since: daysAgo(7) });
    assert(out.length === 1 && out[0].sourceRefId === 'l-new', 'opts.since excludes older observations');
  }

  // 12 — opts.domains filter empties result in section-01
  {
    __resetForTests();
    const grow = { plants: [{ id: 'p1', notes: 'anything' }] };
    const out = collectObservations(grow, {}, { domains: ['pest'] });
    assert(out.length === 0, 'opts.domains filter empties result in section-01 (stub domains are empty)');
  }

  // 13 — parseObservation stub returns empty ParsedNote
  {
    __resetForTests();
    const obs = {
      id: 'x', createdAt: '', observedAt: '', source: 'log', sourceRefId: 'l1',
      domains: [], severityRaw: null, severity: 'info', severityAutoInferred: false,
      rawText: 'hi', parsed: null, tags: [],
    };
    parseObservation(obs);
    assert(obs.parsed && typeof obs.parsed.ctx === 'object', 'parseObservation: assigns ctx object');
    assert(Array.isArray(obs.parsed.keywords) && obs.parsed.keywords.length === 0, 'parseObservation: keywords empty');
    assert(Array.isArray(obs.parsed.frankoOverrides) && obs.parsed.frankoOverrides.length === 0, 'parseObservation: overrides empty');
  }

  // 14 — mergeNoteContext stub returns empty object
  {
    assert(JSON.stringify(mergeNoteContext([])) === '{}', 'mergeNoteContext stub returns empty object');
  }

  // 15 — findActionsTakenSince stub returns empty array
  {
    assert(Array.isArray(findActionsTakenSince([], 'water', 24)) && findActionsTakenSince([], 'water', 24).length === 0, 'findActionsTakenSince stub returns empty array');
  }

  // 16 — getObservationIndex before initContextualizer returns empty frozen array
  {
    __resetForTests();
    const idx = getObservationIndex();
    assert(idx && Array.isArray(idx.all) && idx.all.length === 0, 'getObservationIndex pre-init: empty array');
    assert(Object.isFrozen(idx.all), 'getObservationIndex pre-init: all is frozen');
  }

  // 17 — initContextualizer is idempotent; rebuild on grow commit
  {
    __resetForTests();
    const store = makeStore();
    initContextualizer(store);
    initContextualizer(store); // second call must be a no-op
    const emptyIdx = getObservationIndex();
    assert(emptyIdx.all.length === 0, 'idempotent init: no obs initially');

    // Commit a plant with a note
    const snap = store.getSnapshot().grow || { plants: [], tasks: [] };
    snap.plants = [{ id: 'p1', notes: 'hello' }];
    store.commit('grow', snap);

    const idx = getObservationIndex();
    assert(idx.all.length === 1 && idx.all[0].rawText === 'hello', 'rebuild after grow commit picks up new note');
  }

  // 17b — Hardened idempotency: subscribe() called exactly once per path across re-inits.
  // Uses a spy that forwards to a real store and counts subscribe() hits.
  {
    __resetForTests();
    const real = makeStore();
    const subCount = { grow: 0, profile: 0 };
    const spy = {
      get state() { return real.state; },
      subscribe(path, cb) {
        subCount[path] = (subCount[path] || 0) + 1;
        return real.subscribe(path, cb);
      },
      commit: (k, v) => real.commit(k, v),
      getSnapshot: () => real.getSnapshot(),
    };
    initContextualizer(spy);
    initContextualizer(spy);
    initContextualizer(spy);
    assert(subCount.grow === 1, 'idempotent: grow subscribed exactly once across 3 inits');
    assert(subCount.profile === 1, 'idempotent: profile subscribed exactly once across 3 inits');
  }

  // 17c — Cache invalidates after profile commit (proves profile subscription path works)
  {
    __resetForTests();
    const store = makeStore();
    initContextualizer(store);
    const before = getObservationIndex();
    assert(before.all.length === 0, 'profile-commit test: empty before');

    store.commit('profile', { updatedAt: new Date().toISOString(), notes: { stage: 'week 2 veg' } });

    const after = getObservationIndex();
    const profileObs = after.all.filter(o => o.source === 'profile');
    assert(profileObs.length === 1 && profileObs[0].wizardStep === 'stage', 'cache rebuilds after profile commit');
  }

  // 18 — Returned array is frozen
  {
    __resetForTests();
    const store = makeStore({ grow: { plants: [{ id: 'p1', notes: 'frozen-test' }], tasks: [] } });
    initContextualizer(store);
    const idx = getObservationIndex();
    assert(Object.isFrozen(idx.all), 'getObservationIndex.all is frozen');
    let threw = false;
    try { idx.all.push({}); } catch { threw = true; }
    assert(threw, 'mutating frozen .all throws TypeError in strict mode');
  }

  // 19 — Hash-check skips rebuild on identical state
  {
    __resetForTests();
    const store = makeStore({ grow: { plants: [{ id: 'p1', notes: 'x' }], tasks: [] } });
    initContextualizer(store);
    const idx1 = getObservationIndex();
    const idx2 = getObservationIndex();
    assert(idx1 === idx2, 'hash-check: second call returns cached reference');
  }

  // 20 — getRelevantObservations delegates filter through the cache
  {
    __resetForTests();
    const store = makeStore({
      grow: {
        plants: [
          { id: 'p1', notes: 'A' },
          { id: 'p2', notes: 'B' },
        ],
        tasks: [],
      },
    });
    initContextualizer(store);
    const rel = getRelevantObservations(store, { plantId: 'p2' });
    assert(rel.length === 1 && rel[0].plantId === 'p2', 'getRelevantObservations: plantId filter');
  }

  // 21 — Sidecar citations: recordReferencedIn + getCitationsFor
  {
    __resetForTests();
    recordReferencedIn(['obs-a', 'obs-b'], 'consumer-1');
    recordReferencedIn(['obs-a'], 'consumer-2');
    const aCites = getCitationsFor('obs-a').sort();
    const bCites = getCitationsFor('obs-b');
    const missing = getCitationsFor('obs-missing');
    assert(aCites.length === 2 && aCites[0] === 'consumer-1', 'citations: multiple consumers recorded');
    assert(bCites.length === 1 && bCites[0] === 'consumer-1', 'citations: single consumer recorded');
    assert(missing.length === 0, 'citations: unknown obsId returns empty');
  }

  // 22 — __resetForTests clears cache + citations
  {
    __resetForTests();
    recordReferencedIn(['foo'], 'consumer');
    assert(getCitationsFor('foo').length === 1, 'pre-reset: citation present');
    __resetForTests();
    assert(getCitationsFor('foo').length === 0, '__resetForTests clears citations');
    const idxAfter = getObservationIndex();
    assert(idxAfter.all.length === 0, '__resetForTests clears cache');
  }

  return results;
}
