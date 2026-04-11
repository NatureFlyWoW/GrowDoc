// GrowDoc Companion — priority-engine Tests (section-06)
//
// Note-aware priority bias tests.

import { calculateWeights, getRecommendation, NOTE_PRIORITY_BIAS } from '../data/priority-engine.js';

const NOW = Date.now();
const hoursAgo = (h) => new Date(NOW - h * 3_600_000).toISOString();

function makeNoteObs({ id, observedAt, keywords = [], rawText = '' }) {
  return {
    id: id || `n-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: observedAt,
    observedAt,
    plantId: 'p1',
    source: 'log',
    sourceRefId: `ref-${id || 'x'}`,
    domains: [],
    severityRaw: null,
    severity: 'info',
    severityAutoInferred: false,
    rawText,
    parsed: {
      ctx: {},
      observations: [],
      actionsTaken: [],
      questions: [],
      keywords,
      frankoOverrides: [],
      ruleErrors: [],
    },
    tags: [],
  };
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };
  const approx = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

  // 1. omitted notes produces identical output
  {
    const a = calculateWeights({ yield: 5, quality: 2, terpenes: 4, effect: 1 });
    const b = calculateWeights({ yield: 5, quality: 2, terpenes: 4, effect: 1 }, []);
    assert(approx(a.yield, b.yield), 'omitted notes: yield weight identical');
    assert(approx(a.quality, b.quality), 'omitted notes: quality weight identical');
    assert(approx(a.terpenes, b.terpenes), 'omitted notes: terpenes weight identical');
    assert(approx(a.effect, b.effect), 'omitted notes: effect weight identical');
  }

  // 2. all-equal stars + no notes → 0.25 each
  {
    const w = calculateWeights({ yield: 3, quality: 3, terpenes: 3, effect: 3 }, []);
    assert(approx(w.yield, 0.25), 'equal stars: yield 0.25');
    assert(approx(w.quality, 0.25), 'equal stars: quality 0.25');
    assert(approx(w.terpenes, 0.25), 'equal stars: terpenes 0.25');
    assert(approx(w.effect, 0.25), 'equal stars: effect 0.25');
  }

  // 3. priority-yield note shifts yield UP, sum stays 1.0
  {
    const note = makeNoteObs({ id: 'py', observedAt: hoursAgo(1), keywords: ['priority-yield'], rawText: 'max yield please' });
    const base = calculateWeights({ yield: 3, quality: 3, terpenes: 3, effect: 3 });
    const biased = calculateWeights({ yield: 3, quality: 3, terpenes: 3, effect: 3 }, [note]);
    assert(biased.yield > base.yield, 'priority-yield: yield weight increases');
    const sum = biased.yield + biased.quality + biased.terpenes + biased.effect;
    assert(Math.abs(sum - 1.0) < 1e-9, `sum stays 1.0 (got ${sum})`);
    // Expected: raw = 3.1/3/3/3 = 12.1, yield weight = 3.1/12.1 ≈ 0.2562
    assert(Math.abs(biased.yield - (3 + NOTE_PRIORITY_BIAS) / (12 + NOTE_PRIORITY_BIAS)) < 1e-9, 'yield bias arithmetic correct');
  }

  // 4. priority-terps note shifts terpenes UP
  {
    const note = makeNoteObs({ id: 'pt', observedAt: hoursAgo(1), keywords: ['priority-terps'], rawText: 'max terps' });
    const biased = calculateWeights({ yield: 3, quality: 3, terpenes: 3, effect: 3 }, [note]);
    assert(biased.terpenes > 0.25, 'priority-terps: terpenes > 0.25');
    assert(biased.terpenes > biased.yield, 'terpenes outranks yield after bias');
  }

  // 5. Conflicting signals — most-recent wins; baseline biased by +0.10
  {
    const olderYield = makeNoteObs({ id: 'y-old', observedAt: hoursAgo(48), keywords: ['priority-yield'], rawText: 'yield' });
    const newerTerps = makeNoteObs({ id: 't-new', observedAt: hoursAgo(1), keywords: ['priority-terps'], rawText: 'terps' });
    const biased = calculateWeights({ yield: 5, quality: 2, terpenes: 2, effect: 1 }, [olderYield, newerTerps]);
    // Most recent is priority-terps — expect terpenes raw 2+0.1=2.1, total 10.1
    const expectedTerps = 2.1 / 10.1;
    assert(Math.abs(biased.terpenes - expectedTerps) < 1e-9, `most-recent wins (terpenes ${biased.terpenes} ≈ ${expectedTerps})`);
  }

  // 6. getRecommendation forwards notes to calculateWeights
  {
    const note = makeNoteObs({ id: 'py-fwd', observedAt: hoursAgo(1), keywords: ['priority-yield'], rawText: 'yield' });
    const baseRec = getRecommendation('dli', 'mid-flower', 'soil', { yield: 3, quality: 3, terpenes: 3, effect: 3 });
    const biasedRec = getRecommendation('dli', 'mid-flower', 'soil', { yield: 3, quality: 3, terpenes: 3, effect: 3 }, [note]);
    assert(baseRec.value !== undefined && biasedRec.value !== undefined, 'both recommendations have a value');
    // With yield bias we expect the blended DLI value to move toward the yield-optimal (typically higher).
    // We only assert they differ — direction depends on DLI_TARGETS data.
    assert(baseRec.value !== biasedRec.value || baseRec.range.max !== biasedRec.range.max,
      'getRecommendation forwards notes → biased result differs from baseline');
  }

  // All-zeros baseline seed — still re-normalizable with bias
  {
    const note = makeNoteObs({ id: 'pq', observedAt: hoursAgo(1), keywords: ['priority-quality'], rawText: 'quality' });
    const w = calculateWeights({ yield: 0, quality: 0, terpenes: 0, effect: 0 }, [note]);
    const sum = w.yield + w.quality + w.terpenes + w.effect;
    assert(Math.abs(sum - 1.0) < 1e-9, 'all-zero + bias still sums to 1');
    assert(w.quality > 0.25, 'all-zero + priority-quality bias lifts quality above 0.25');
  }

  return results;
}
