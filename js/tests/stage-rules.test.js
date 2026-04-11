// GrowDoc Companion — stage-rules Tests (section-06)
//
// Note-aware auto-advance guards.

import { shouldAutoAdvance, POST_TRANSPLANT_BLOCK_HOURS, RECOVERY_BLOCK_HOURS } from '../data/stage-rules.js';

const NOW = Date.now();
const hoursAgo = (h) => new Date(NOW - h * 3_600_000).toISOString();
const daysAgo = (d) => new Date(NOW - d * 86_400_000).toISOString();

function makePlant({ id = 'p1', stage = 'early-veg', stageStartDaysAgo = 30 } = {}) {
  return {
    id,
    stage,
    stageStartDate: new Date(NOW - stageStartDaysAgo * 86_400_000).toISOString(),
    stageDurationOverrides: {},
  };
}

function makeNoteObs({ id, plantId = 'p1', observedAt, keywords = [], rawText = '' }) {
  return {
    id: id || `n-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: observedAt,
    observedAt,
    plantId,
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

  // 1. omitted notes — behavior unchanged
  {
    const plant = makePlant({ stage: 'early-veg', stageStartDaysAgo: 30 });
    const r = shouldAutoAdvance(plant);
    assert(r !== null && r.nextStage === 'late-veg', 'omitted notes: ready-to-advance plant returns nextStage');

    const young = makePlant({ stage: 'early-veg', stageStartDaysAgo: 5 });
    assert(shouldAutoAdvance(young) === null, 'omitted notes: young plant returns null');
  }

  // 2. notes=[] equivalent to omitted
  {
    const plant = makePlant({ stage: 'early-veg', stageStartDaysAgo: 30 });
    const a = shouldAutoAdvance(plant);
    const b = shouldAutoAdvance(plant, []);
    assert(JSON.stringify(a) === JSON.stringify(b), 'notes=[] equivalent to omitted');
  }

  // 3. action-taken:transplanted within 72h → null
  {
    const plant = makePlant({ stage: 'early-veg', stageStartDaysAgo: 30 });
    const notes = [makeNoteObs({
      id: 'trans1',
      plantId: 'p1',
      observedAt: hoursAgo(24), // 1 day ago
      keywords: ['action-taken:transplanted'],
      rawText: 'transplanted into 3gal',
    })];
    const r = shouldAutoAdvance(plant, notes);
    assert(r === null, 'fresh transplant blocks advance');
  }

  // 4. recovery keyword within 48h → null
  {
    const plant = makePlant({ stage: 'early-veg', stageStartDaysAgo: 30 });
    for (const kw of ['recovering', 'bouncing-back', 'still-stressed', 'recovery']) {
      const notes = [makeNoteObs({
        id: `rec-${kw}`,
        plantId: 'p1',
        observedAt: hoursAgo(12),
        keywords: [kw],
        rawText: `plant is ${kw}`,
      })];
      const r = shouldAutoAdvance(plant, notes);
      assert(r === null, `recovery keyword '${kw}' within 48h blocks advance`);
    }
  }

  // 5. action-taken:transplanted at daysAgo(4) does NOT block (>72h elapsed)
  {
    const plant = makePlant({ stage: 'early-veg', stageStartDaysAgo: 30 });
    const notes = [makeNoteObs({
      id: 'trans-old',
      plantId: 'p1',
      observedAt: daysAgo(4),
      keywords: ['action-taken:transplanted'],
      rawText: 'transplanted 4 days ago',
    })];
    const r = shouldAutoAdvance(plant, notes);
    assert(r !== null && r.nextStage === 'late-veg', 'old transplant (>72h) does not block');
  }

  // 6. only notes matching plant.id count — transplant on plantA does not block plantB
  {
    const plantB = makePlant({ id: 'pB', stage: 'early-veg', stageStartDaysAgo: 30 });
    const notes = [makeNoteObs({
      id: 'trans-A',
      plantId: 'pA',
      observedAt: hoursAgo(12),
      keywords: ['action-taken:transplanted'],
    })];
    const r = shouldAutoAdvance(plantB, notes);
    assert(r !== null && r.nextStage === 'late-veg', 'transplant on other plant does not block');
  }

  // Constants exported
  {
    assert(POST_TRANSPLANT_BLOCK_HOURS === 72, 'POST_TRANSPLANT_BLOCK_HOURS constant');
    assert(RECOVERY_BLOCK_HOURS === 48, 'RECOVERY_BLOCK_HOURS constant');
  }

  return results;
}
