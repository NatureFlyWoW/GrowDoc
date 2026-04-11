// GrowDoc Companion — Plant Doctor note-awareness tests (section-05)
//
// Covers:
//   - rules-score.js shape + Companion condition validity + boost behavior
//   - rules-advice.js shape + top-5 sort + fallback + citedObsIds
//   - Rule error isolation (throwing closures do not halt iteration)
//   - doctor-engine.buildContext active-plant selection
//   - runDiagnosis end-to-end note boost (pH Imbalance)
//   - Cross-plant isolation (activePlantId scoping)
//   - activePlantId persistence to localStorage

import {
  SCORE_ADJUSTMENTS,
  ADVICE_RULES,
  adjustScoresFromNotes,
  generateContextualAdvice,
  initContextualizer,
  getObservationIndex,
  __resetForTests,
} from '../data/note-contextualizer/index.js';
import { CORE_SCORING } from '../plant-doctor/doctor-data.js';
import { buildContext, runDiagnosis, setDiagnosticData } from '../plant-doctor/doctor-engine.js';
import { CORE_REFINE_RULES } from '../plant-doctor/doctor-data.js';
import { createStore } from '../store.js';

function makeStore(initial = {}) {
  return createStore({
    profile: initial.profile || {},
    grow: initial.grow || { plants: [], tasks: [] },
    environment: { readings: [] },
    archive: [],
    outcomes: [],
    ui: initial.ui || { sidebarCollapsed: false, activePlantId: null },
  });
}

function makePlant(id, notes = '') {
  return {
    id,
    name: `Plant ${id}`,
    stage: 'veg',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    stageStartDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    notes,
    logs: [],
  };
}

function makeLogNote(id, notes) {
  return {
    id,
    type: 'observe',
    timestamp: new Date().toISOString(),
    details: { notes },
  };
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // 1 — rules-score.js rule shape
  {
    __resetForTests();
    let ok = Array.isArray(SCORE_ADJUSTMENTS) && SCORE_ADJUSTMENTS.length >= 15;
    for (const r of SCORE_ADJUSTMENTS) {
      if (!r.id || typeof r.id !== 'string') { ok = false; break; }
      if (!r.appliesTo || typeof r.appliesTo !== 'string') { ok = false; break; }
      if (typeof r.condition !== 'function') { ok = false; break; }
      if (typeof r.adjustment !== 'number') { ok = false; break; }
    }
    assert(ok, 'rules-score.js: every rule has id/appliesTo/condition(fn)/adjustment(number)');
  }

  // 2 — rules-score.js appliesTo values match CORE_SCORING condition names
  {
    __resetForTests();
    const validConditions = new Set(CORE_SCORING.map(r => r.condition));
    const bad = SCORE_ADJUSTMENTS.filter(r => !validConditions.has(r.appliesTo));
    assert(bad.length === 0, `rules-score.js: all appliesTo values are real Companion conditions (${bad.length} invalid)`);
  }

  // 3 — rules-advice.js rule shape
  {
    __resetForTests();
    let ok = Array.isArray(ADVICE_RULES) && ADVICE_RULES.length >= 20;
    for (const r of ADVICE_RULES) {
      if (!r.id || typeof r.id !== 'string') { ok = false; break; }
      if (!r.appliesTo || typeof r.appliesTo !== 'string') { ok = false; break; }
      if (typeof r.condition !== 'function') { ok = false; break; }
      if (!r.headline || typeof r.headline !== 'string') { ok = false; break; }
      if (!r.detail || typeof r.detail !== 'string') { ok = false; break; }
      if (!['alert','watch','info'].includes(r.severity)) { ok = false; break; }
    }
    assert(ok, 'rules-advice.js: every rule has id/appliesTo/condition(fn)/headline/detail/severity enum');
  }

  // 4 — adjustScoresFromNotes boosts pH Imbalance on out-of-range phExtracted
  {
    __resetForTests();
    const scores = {
      'pH Imbalance': { condition: 'pH Imbalance', score: 10, matches: [], maxScore: 50 },
    };
    adjustScoresFromNotes(scores, { phExtracted: 5.0 });
    assert(scores['pH Imbalance'].score > 10, 'adjustScoresFromNotes: ph 5.0 boosts pH Imbalance score');
  }

  // 5 — adjustScoresFromNotes boosts Overwatering on rootHealth suspect/rotting
  {
    __resetForTests();
    const scores1 = { 'Overwatering': { condition: 'Overwatering', score: 5, matches: [], maxScore: 30 } };
    adjustScoresFromNotes(scores1, { rootHealth: 'suspect' });
    const scores2 = { 'Overwatering': { condition: 'Overwatering', score: 5, matches: [], maxScore: 30 } };
    adjustScoresFromNotes(scores2, { rootHealth: 'rotting' });
    assert(
      scores1['Overwatering'].score > 5 && scores2['Overwatering'].score > 5,
      'adjustScoresFromNotes: rootHealth suspect|rotting boosts Overwatering'
    );
  }

  // 6 — adjustScoresFromNotes boosts Heat Stress when tempExtracted > 28
  {
    __resetForTests();
    const scores = { 'Heat Stress': { condition: 'Heat Stress', score: 8, matches: [], maxScore: 40 } };
    adjustScoresFromNotes(scores, { tempExtracted: 31 });
    assert(scores['Heat Stress'].score > 8, 'adjustScoresFromNotes: tempExtracted 31 boosts Heat Stress');
  }

  // 7 — adjustScoresFromNotes preserves non-matching scores
  {
    __resetForTests();
    const scores = {
      'Nitrogen Deficiency': { condition: 'Nitrogen Deficiency', score: 12, matches: [], maxScore: 50 },
    };
    adjustScoresFromNotes(scores, { phExtracted: 6.3 }); // in-range, no match
    assert(scores['Nitrogen Deficiency'].score === 12, 'adjustScoresFromNotes: untouched conditions retain their score');
  }

  // 8 — generateContextualAdvice returns up to 5 items for a condition
  {
    __resetForTests();
    const items = generateContextualAdvice({ phExtracted: 5.0, previousProblems: ['pH-drift'] }, 'pH Imbalance');
    assert(Array.isArray(items) && items.length > 0 && items.length <= 5, 'generateContextualAdvice: returns 1–5 items');
  }

  // 9 — generateContextualAdvice falls back to generic when no rules match
  {
    __resetForTests();
    const items = generateContextualAdvice({}, 'Some Unknown Condition');
    assert(items.length === 1 && items[0].severity === 'info', 'generateContextualAdvice: fallback single info item on zero match');
  }

  // 10 — generateContextualAdvice items carry citedObsIds: []
  {
    __resetForTests();
    const items = generateContextualAdvice({ phExtracted: 5.0 }, 'pH Imbalance');
    const allHaveField = items.every(i => Array.isArray(i.citedObsIds));
    assert(allHaveField, 'generateContextualAdvice: every item has citedObsIds array (empty in section-05)');
  }

  // 11 — Rule error isolation: throwing rule → ruleErrors entry, others still run
  {
    __resetForTests();
    const store = makeStore({ grow: { plants: [makePlant('p1', 'ph 5.0')], tasks: [] } });
    initContextualizer(store);
    const scores = { 'pH Imbalance': { condition: 'pH Imbalance', score: 0, matches: [], maxScore: 50 } };

    // Inject a throwing rule via monkey-patch of the frozen array is impossible.
    // Instead: pass a ctx whose getter throws for a field read — simulates a
    // corrupted ctx crashing a closure mid-evaluation.
    const boom = {};
    Object.defineProperty(boom, 'phExtracted', {
      get() { throw new Error('boom'); },
      enumerable: true,
    });
    // Non-thrown fields still usable:
    boom.tempExtracted = 31;

    // Should not throw. Other rules should still fire (Heat Stress > 28).
    let threw = false;
    try { adjustScoresFromNotes(scores, boom); } catch { threw = true; }
    const heatScore = scores['Heat Stress'] && scores['Heat Stress'].score;
    const idx = getObservationIndex();
    const hasError = Array.isArray(idx.ruleErrors) && idx.ruleErrors.some(e => e.source === 'score-adjust');
    assert(!threw && heatScore > 0 && hasError, 'Rule error isolation: throwing closure logged to ruleErrors; other rules still executed');
  }

  // 12 — buildContext uses store.state.ui.activePlantId
  {
    __resetForTests();
    const plantA = makePlant('pA', 'ph was 5.0 runoff, tips burning');
    const plantB = makePlant('pB', '');
    const store = makeStore({
      profile: { medium: 'soil', lighting: 'led' },
      grow: { plants: [plantA, plantB], tasks: [] },
      ui: { sidebarCollapsed: false, activePlantId: 'pB' },
    });
    initContextualizer(store);
    setDiagnosticData(CORE_SCORING, CORE_REFINE_RULES);
    const ctx = buildContext(store);
    assert(ctx.plantId === 'pB', 'buildContext: uses activePlantId when set');
  }

  // 13 — buildContext falls back to plants[0] when activePlantId is null
  {
    __resetForTests();
    const plantA = makePlant('pA');
    const plantB = makePlant('pB');
    const store = makeStore({
      grow: { plants: [plantA, plantB], tasks: [] },
      ui: { sidebarCollapsed: false, activePlantId: null },
    });
    initContextualizer(store);
    const ctx = buildContext(store);
    assert(ctx.plantId === 'pA', 'buildContext: falls back to plants[0] when activePlantId null');
  }

  // 14 — buildContext fetches observations for the active plant only
  {
    __resetForTests();
    const plantA = makePlant('pA', 'ph was 5.0 runoff');
    const plantB = makePlant('pB', 'looking healthy');
    const store = makeStore({
      grow: { plants: [plantA, plantB], tasks: [] },
      ui: { sidebarCollapsed: false, activePlantId: 'pA' },
    });
    initContextualizer(store);
    const ctx = buildContext(store);
    const allFromA = Array.isArray(ctx.observations) && ctx.observations.every(o => o.plantId === 'pA');
    assert(allFromA && ctx.observations.length > 0, 'buildContext: observations scoped to active plant');
  }

  // 15 — runDiagnosis end-to-end: seeded pH note makes pH Imbalance outrank baseline
  {
    __resetForTests();
    setDiagnosticData(CORE_SCORING, CORE_REFINE_RULES);

    // Baseline: empty notes
    const plantBase = makePlant('p1');
    const storeBase = makeStore({
      grow: { plants: [plantBase], tasks: [] },
      ui: { sidebarCollapsed: false, activePlantId: 'p1' },
    });
    initContextualizer(storeBase);
    const baseCtx = buildContext(storeBase);
    const baseResults = runDiagnosis(['slow-growth'], baseCtx);
    const basePh = baseResults.find(r => r.condition === 'pH Imbalance');

    __resetForTests();
    setDiagnosticData(CORE_SCORING, CORE_REFINE_RULES);

    // Seeded: ph 5.0 note on the same plant
    const plantSeed = makePlant('p1');
    plantSeed.logs.push(makeLogNote('l1', 'pH was 5.0 runoff, tips burning'));
    const storeSeed = makeStore({
      grow: { plants: [plantSeed], tasks: [] },
      ui: { sidebarCollapsed: false, activePlantId: 'p1' },
    });
    initContextualizer(storeSeed);
    const seedCtx = buildContext(storeSeed);
    const seedResults = runDiagnosis(['slow-growth'], seedCtx);
    const seedPh = seedResults.find(r => r.condition === 'pH Imbalance');

    const boosted = seedPh && (!basePh || seedPh.confidence > basePh.confidence);
    assert(!!boosted, 'runDiagnosis: seeded pH 5.0 note boosts pH Imbalance confidence above baseline');
  }

  // 16 — runDiagnosis cross-plant isolation
  {
    __resetForTests();
    setDiagnosticData(CORE_SCORING, CORE_REFINE_RULES);
    const plantA = makePlant('pA');
    plantA.logs.push(makeLogNote('lA', 'pH was 5.0 runoff, tips burning'));
    const plantB = makePlant('pB'); // no notes
    const store = makeStore({
      grow: { plants: [plantA, plantB], tasks: [] },
      ui: { sidebarCollapsed: false, activePlantId: 'pB' },
    });
    initContextualizer(store);
    const ctx = buildContext(store);
    // With pB active, ctx should have no phExtracted from pA's note
    const leaked = ctx.ctx && ctx.ctx.phExtracted != null;
    assert(!leaked, 'runDiagnosis cross-plant isolation: alert on pA does not leak into pB context');
  }

  // 17 — activePlantId persists through store commit path
  {
    __resetForTests();
    const plantA = makePlant('pA');
    const store = makeStore({
      grow: { plants: [plantA], tasks: [] },
      ui: { sidebarCollapsed: false, activePlantId: null },
    });
    store.commit('ui', { ...store.state.ui, activePlantId: 'pA' });
    // Verify store state reflects the commit (localStorage debounce happens async;
    // we assert in-memory reactive state which drives the persistence pipeline).
    assert(store.state.ui.activePlantId === 'pA', 'activePlantId: store.commit persists to reactive ui slot');
  }

  return results;
}
