// GrowDoc Companion — Harvest Advisor Tests (section-06)
//
// Pure-function tests over the note-aware harvest advisor. All observations
// are constructed in-test — no store plumbing, no mocking. `notes = []` is
// the first regression fixture per the section-06 spec.

import { getHarvestRecommendation, bumpConfidence } from '../data/harvest-advisor.js';
import { __resetForTests } from '../data/note-contextualizer/index.js';

const NOW = Date.now();
const hoursAgo = (h) => new Date(NOW - h * 3_600_000).toISOString();

function makeObs({
  id,
  source = 'log',
  plantId = 'p1',
  observedAt,
  severity = 'info',
  ctx = null,
  keywords = [],
  frankoOverrides = [],
  rawText = '',
  domains = [],
}) {
  return {
    id: id || `o-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: observedAt,
    observedAt: observedAt || hoursAgo(1),
    plantId,
    source,
    sourceRefId: `ref-${id || 'x'}`,
    domains,
    severityRaw: severity === 'alert' ? 'urgent' : severity === 'watch' ? 'concern' : null,
    severity,
    severityAutoInferred: false,
    rawText,
    parsed: {
      ctx: ctx || {},
      observations: [],
      actionsTaken: [],
      questions: [],
      keywords,
      frankoOverrides,
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

  __resetForTests();

  const basePriorities = { yield: 3, quality: 3, terpenes: 3, effect: 3 };
  const peakMilky = { clear: 30, milky: 65, amber: 5 };
  const classicWindow = { clear: 20, milky: 60, amber: 20 };
  const clearHeavy = { clear: 70, milky: 25, amber: 5 };

  // 1. omitted notes produces a stable baseline shape
  {
    const r = getHarvestRecommendation(peakMilky, basePriorities);
    assert(r.recommendation === 'harvest-soon', 'omitted notes: peak-milky base recommendation');
    assert(r.confidence === 'medium', 'omitted notes: peak-milky base confidence');
    assert(Array.isArray(r.citedObsIds) && r.citedObsIds.length === 0, 'omitted notes: citedObsIds is empty array');
    assert(r.dryingProtocol != null && r.curingProtocol != null, 'omitted notes: protocols present');
  }

  // 2. notes=[] explicit empty array produces byte-identical output (modulo citedObsIds)
  {
    const a = getHarvestRecommendation(peakMilky, basePriorities);
    const b = getHarvestRecommendation(peakMilky, basePriorities, []);
    assert(a.recommendation === b.recommendation, 'notes=[] equivalent: recommendation');
    assert(a.confidence === b.confidence, 'notes=[] equivalent: confidence');
    assert(a.tradeoffNote === b.tradeoffNote, 'notes=[] equivalent: tradeoffNote');
    assert(a.staggerSuggestion === b.staggerSuggestion, 'notes=[] equivalent: staggerSuggestion');
    assert(b.citedObsIds.length === 0, 'notes=[] citedObsIds is empty');
  }

  // 3. 'smells amazing, want max terps' → max-terps growerIntent shifts peak-milky → harvest-now
  {
    const obs = makeObs({
      id: 'intent-terps',
      observedAt: hoursAgo(2),
      rawText: 'smells amazing, want max terps',
      ctx: { growerIntent: 'max-terps' },
      keywords: ['intent-max-terps'],
    });
    const r = getHarvestRecommendation(peakMilky, basePriorities, [obs]);
    assert(r.recommendation === 'harvest-now', 'max-terps + peak-milky → harvest-now');
    assert(r.citedObsIds.includes('intent-terps'), 'cited the intent observation');
  }

  // 4. 'wait for more amber' → max-yield downgrade classic-window harvest-now → harvest-soon
  {
    const obs = makeObs({
      id: 'intent-yield',
      observedAt: hoursAgo(3),
      rawText: 'wait for more amber, want max yield',
      ctx: { growerIntent: 'max-yield' },
      keywords: ['intent-max-yield'],
    });
    const r = getHarvestRecommendation(classicWindow, basePriorities, [obs]);
    assert(r.recommendation === 'harvest-soon', 'max-yield + classic-window → harvest-soon');
  }

  // 5. user-thinks-early bumps confidence UP one step
  {
    const obs = makeObs({
      id: 'early',
      observedAt: hoursAgo(1),
      rawText: 'buds look early, wait longer',
      keywords: ['user-thinks-early'],
    });
    // peak-milky with balanced priorities starts at 'medium'
    const r = getHarvestRecommendation(peakMilky, basePriorities, [obs]);
    assert(r.confidence === 'high', `user-thinks-early: medium→high (got ${r.confidence})`);
  }

  // 6. user-thinks-late bumps confidence DOWN one step
  {
    const obs = makeObs({
      id: 'late',
      observedAt: hoursAgo(1),
      rawText: 'probably too late already',
      keywords: ['user-thinks-late'],
    });
    const r = getHarvestRecommendation(peakMilky, basePriorities, [obs]);
    assert(r.confidence === 'low', `user-thinks-late: medium→low (got ${r.confidence})`);
  }

  // 7. tradeoffNote / citedObsIds populated from merged observations
  {
    const obs = makeObs({
      id: 'cite1',
      observedAt: hoursAgo(5),
      ctx: { growerIntent: 'max-terps' },
      keywords: ['intent-max-terps'],
      rawText: 'max terps please',
    });
    const r = getHarvestRecommendation(peakMilky, basePriorities, [obs]);
    assert(Array.isArray(r.citedObsIds) && r.citedObsIds.length > 0, 'citedObsIds populated when notes supplied');
    assert(r.citedObsIds.includes('cite1'), 'citedObsIds includes the intent obs id');

    const empty = getHarvestRecommendation(peakMilky, basePriorities, []);
    assert(empty.citedObsIds.length === 0, 'citedObsIds empty when notes=[]');
  }

  // 8. aroma keyword 'citrusy terpene explosion' + harvest-now does NOT flip recommendation
  {
    const obs = makeObs({
      id: 'aroma1',
      observedAt: hoursAgo(1),
      rawText: 'citrusy terpene explosion, lemon candy vibes',
      keywords: ['aroma-citrus'],
    });
    const r = getHarvestRecommendation(classicWindow, basePriorities, [obs]);
    // classic-window is already harvest-now; aroma only enriches the note
    assert(r.recommendation === 'harvest-now', 'aroma keyword does not flip recommendation');
    assert(r.tradeoffNote && r.tradeoffNote.includes('Aroma'), 'aroma keyword enriches tradeoffNote');
    assert(r.citedObsIds.includes('aroma1'), 'aroma obs cited');
  }

  // 9. note-derived growerIntent wins over conflicting star priority
  {
    // High yield star but note says max-terps — note wins
    const yieldHeavy = { yield: 5, quality: 1, terpenes: 1, effect: 1 };
    const obs = makeObs({
      id: 'terps-over-yield',
      observedAt: hoursAgo(1),
      ctx: { growerIntent: 'max-terps' },
      keywords: ['intent-max-terps'],
      rawText: 'max terps',
    });
    const r = getHarvestRecommendation(peakMilky, yieldHeavy, [obs]);
    assert(r.recommendation === 'harvest-now', 'note-derived max-terps overrides yield-heavy star priority');
  }

  // bumpConfidence helper — quick sanity
  {
    assert(bumpConfidence('low', 1) === 'medium', 'bumpConfidence low→medium');
    assert(bumpConfidence('medium', 1) === 'high', 'bumpConfidence medium→high');
    assert(bumpConfidence('high', 1) === 'high', 'bumpConfidence high clamps');
    assert(bumpConfidence('low', -1) === 'low', 'bumpConfidence low clamps');
    assert(bumpConfidence('high', -1) === 'medium', 'bumpConfidence high→medium');
  }

  __resetForTests();
  return results;
}
