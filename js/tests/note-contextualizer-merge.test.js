// GrowDoc Companion — Note Contextualizer: merge, weighting, findActionsTakenSince (section-04)
//
// Pure-function tests over the merge / weighting layer. Observations are
// constructed inline; no store plumbing required. The store-backed tests
// live in `note-contextualizer.test.js`.

import { mergeNoteContext, getRelevantObservations, findActionsTakenSince } from '../data/note-contextualizer/merge.js';
import { resolveScalar, computeWeight, HALF_LIFE } from '../data/note-contextualizer/weighting.js';
import { parseProfileText } from '../data/note-contextualizer/index.js';

// ── Helpers ───────────────────────────────────────────────────────
const NOW = Date.UTC(2026, 3, 11, 12, 0, 0); // fixed clock so weights are deterministic
const hoursAgo = (h) => new Date(NOW - h * 3_600_000).toISOString();

function makeObs({ id, source = 'log', plantId = 'p1', observedAt, severity = 'info', ctx = null, keywords = [], frankoOverrides = [], actionsTaken = [], rawText = '', domains = [] }) {
  return {
    id: id || `o-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: observedAt,
    observedAt,
    plantId,
    source,
    sourceRefId: source === 'profile' ? undefined : `ref-${id || 'x'}`,
    domains,
    severityRaw: severity === 'alert' ? 'urgent' : severity === 'watch' ? 'concern' : null,
    severity,
    severityAutoInferred: false,
    rawText,
    parsed: {
      ctx: ctx || {},
      observations: [],
      actionsTaken,
      questions: [],
      keywords,
      frankoOverrides,
    },
    tags: [],
  };
}

// ── Test runner ───────────────────────────────────────────────────
export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };
  const approx = (a, b, eps = 0.01) => Math.abs(a - b) < eps;

  // ── mergeNoteContext ──────────────────────────────────────────
  {
    const out = mergeNoteContext([]);
    assert(out && typeof out === 'object', 'mergeNoteContext: empty array yields object');
    assert(Object.keys(out.ctx).length === 0, 'mergeNoteContext: empty ctx');
    assert(Array.isArray(out.keywords) && out.keywords.length === 0, 'mergeNoteContext: empty keywords');
  }

  {
    const obs = makeObs({ id: 'o1', observedAt: hoursAgo(1), ctx: { nutrientLine: 'organic' } });
    const out = mergeNoteContext([obs], NOW);
    assert(out.ctx.nutrientLine === 'organic', 'mergeNoteContext: single obs populates ctx');
    assert(out._citations.nutrientLine && out._citations.nutrientLine[0] === 'o1', 'mergeNoteContext: citation recorded');
  }

  {
    // Newer observation outweighs older for same field (half-life decay)
    const older = makeObs({ id: 'old', observedAt: hoursAgo(200), ctx: { waterPH: 7.0 } });
    const newer = makeObs({ id: 'new', observedAt: hoursAgo(1), ctx: { waterPH: 6.3 } });
    const out = mergeNoteContext([older, newer], NOW);
    assert(out.ctx.waterPH === 6.3, 'mergeNoteContext: newer observation wins on same-severity scalar');
    assert(out._citations.waterPH[0] === 'new', 'mergeNoteContext: citation points at newer obs');
  }

  {
    // Severity-first: alert@6h outranks info@1h even though info is fresher
    const info = makeObs({ id: 'info', severity: 'info', observedAt: hoursAgo(1), ctx: { plantType: 'photoperiod' } });
    const alert = makeObs({ id: 'alert', severity: 'alert', observedAt: hoursAgo(6), ctx: { plantType: 'autoflower' } });
    const out = mergeNoteContext([info, alert], NOW);
    assert(out.ctx.plantType === 'autoflower', 'mergeNoteContext: alert outranks info regardless of age');
  }

  {
    // Array field union
    const a = makeObs({ id: 'a', observedAt: hoursAgo(2), ctx: { amendments: ['perlite'] } });
    const b = makeObs({ id: 'b', observedAt: hoursAgo(3), ctx: { amendments: ['worm-castings'] } });
    const out = mergeNoteContext([a, b], NOW);
    const amend = out.ctx.amendments.sort();
    assert(amend.length === 2 && amend[0] === 'perlite' && amend[1] === 'worm-castings', 'mergeNoteContext: array fields unioned');
  }

  {
    // Keywords deduped union
    const a = makeObs({ id: 'a', observedAt: hoursAgo(1), keywords: ['wizard-stage-clone', 'wizard-stage-seed'] });
    const b = makeObs({ id: 'b', observedAt: hoursAgo(2), keywords: ['wizard-stage-clone'] });
    const out = mergeNoteContext([a, b]);
    assert(out.keywords.length === 2, 'mergeNoteContext: keywords deduped union');
    assert(out.sources['a'] && out.sources['b'], 'mergeNoteContext: both sources attributed');
  }

  // ── resolveScalar ────────────────────────────────────────────
  {
    assert(resolveScalar([], NOW) === null, 'resolveScalar: empty returns null');
    const single = { source: 'log', severity: 'info', observedAt: hoursAgo(1), value: 42 };
    assert(resolveScalar([single], NOW) === single, 'resolveScalar: single candidate returned as-is');
  }

  {
    // Half-life math: 24h alert → weight 0.5
    const w = computeWeight({ severity: 'alert', observedAt: hoursAgo(24) }, NOW);
    assert(approx(w, 0.5), `resolveScalar: 24h alert weight === 0.5 (got ${w.toFixed(4)})`);
  }

  {
    // 0h should weight 1.0
    const w0 = computeWeight({ severity: 'alert', observedAt: hoursAgo(0) }, NOW);
    assert(approx(w0, 1.0), `computeWeight: 0h → 1.0 (got ${w0.toFixed(4)})`);
  }

  {
    // 144h info (half-life 168h) → 0.5^(144/168) ≈ 0.5520
    const w = computeWeight({ severity: 'info', observedAt: hoursAgo(144) }, NOW);
    const expected = Math.pow(0.5, 144 / HALF_LIFE.info);
    assert(approx(w, expected), `computeWeight: 144h info decays correctly (got ${w.toFixed(4)} vs ${expected.toFixed(4)})`);
  }

  {
    // Within-tier recency: alert@2h > alert@8h
    const fresh = makeObs({ id: 'fresh', severity: 'alert', observedAt: hoursAgo(2), ctx: { waterPH: 6.0 } });
    const stale = makeObs({ id: 'stale', severity: 'alert', observedAt: hoursAgo(8), ctx: { waterPH: 6.5 } });
    const out = mergeNoteContext([stale, fresh], NOW);
    assert(out.ctx.waterPH === 6.0, 'resolveScalar: within-tier recency via half-life');
  }

  // ── getRelevantObservations ──────────────────────────────────
  {
    const obs = [
      makeObs({ id: 'p1-info', plantId: 'p1', severity: 'info',  observedAt: hoursAgo(1), domains: ['watering'] }),
      makeObs({ id: 'p1-watch', plantId: 'p1', severity: 'watch', observedAt: hoursAgo(2), domains: ['nutrients'] }),
      makeObs({ id: 'p2-alert', plantId: 'p2', severity: 'alert', observedAt: hoursAgo(3), domains: ['pest'] }),
      makeObs({ id: 'p1-old',   plantId: 'p1', severity: 'info',  observedAt: hoursAgo(500), domains: ['watering'] }),
    ];

    const byPlant = getRelevantObservations(obs, { plantId: 'p1' });
    assert(byPlant.length === 3 && byPlant.every(o => o.plantId === 'p1'), 'getRelevantObservations: plantId filter');

    const bySince = getRelevantObservations(obs, { since: hoursAgo(10) });
    assert(bySince.length === 3, 'getRelevantObservations: since filter excludes 500h-old');

    const byDomain = getRelevantObservations(obs, { domains: ['watering'] });
    assert(byDomain.length === 2, 'getRelevantObservations: domains intersection');

    const combined = getRelevantObservations(obs, { plantId: 'p1', since: hoursAgo(10), domains: ['nutrients'] });
    assert(combined.length === 1 && combined[0].id === 'p1-watch', 'getRelevantObservations: combined plantId+since+domains');

    const minWatch = getRelevantObservations(obs, { minSeverity: 'watch' });
    assert(minWatch.length === 2, 'getRelevantObservations: minSeverity=watch excludes info');
    assert(minWatch.every(o => o.severity !== 'info'), 'getRelevantObservations: info filtered out at minSeverity=watch');

    const minAlert = getRelevantObservations(obs, { minSeverity: 'alert' });
    assert(minAlert.length === 1 && minAlert[0].severity === 'alert', 'getRelevantObservations: minSeverity=alert keeps only alerts');

    // Sorted DESC by observedAt
    const sorted = getRelevantObservations(obs, {});
    assert(sorted[0].id === 'p1-info', 'getRelevantObservations: sorted DESC by observedAt');
  }

  // ── findActionsTakenSince ────────────────────────────────────
  {
    const obs = [
      makeObs({ id: 'water-recent', source: 'log', observedAt: hoursAgo(2),
        rawText: 'gave 500ml plain water', actionsTaken: [{ type: 'water' }] }),
      makeObs({ id: 'water-old', source: 'log', observedAt: hoursAgo(48),
        rawText: 'watered yesterday', actionsTaken: [{ type: 'water' }] }),
      makeObs({ id: 'feed-recent', source: 'log', observedAt: hoursAgo(1),
        rawText: 'fed 2ml/L', actionsTaken: [{ type: 'feed' }] }),
      makeObs({ id: 'profile-water', source: 'profile', observedAt: hoursAgo(1),
        rawText: 'I hand water every couple days',
        actionsTaken: [{ type: 'water' }] }),  // should be filtered out
    ];

    const water12h = findActionsTakenSince(obs, 'water', 12, NOW);
    assert(water12h.length === 1 && water12h[0].id === 'water-recent', 'findActionsTakenSince: water@12h matches only recent non-profile');

    const feed24h = findActionsTakenSince(obs, 'feed', 24, NOW);
    assert(feed24h.length === 1 && feed24h[0].id === 'feed-recent', 'findActionsTakenSince: feed@24h matches');

    const top72h = findActionsTakenSince(obs, 'top', 72, NOW);
    assert(top72h.length === 0, 'findActionsTakenSince: no matches returns []');

    // Profile guard even when profile obs is within the window and matches
    const profileOnly = [makeObs({ id: 'wizard-water', source: 'profile', observedAt: hoursAgo(1),
      rawText: 'hand water every 3 days', actionsTaken: [{ type: 'water' }] })];
    const result = findActionsTakenSince(profileOnly, 'water', 24, NOW);
    assert(result.length === 0, 'findActionsTakenSince: source===profile filtered even when within window');
  }

  {
    // Keyword-based match via rawText pattern when actionsTaken missing
    const noActionsMeta = makeObs({ id: 'defol', source: 'log', observedAt: hoursAgo(10), rawText: 'defoliated fan leaves today', actionsTaken: [] });
    const out = findActionsTakenSince([noActionsMeta], 'defoliate', 168, NOW);
    assert(out.length === 1, 'findActionsTakenSince: falls back to ACTION_TAKEN_PATTERNS regex on rawText');
  }

  // ── parseProfileText compatibility shim ─────────────────────
  {
    const ctx = parseProfileText({
      stage: 'autoflower, 3 weeks from sprout',
      medium: 'living soil with worm castings and perlite',
      lighting: 'Spider Farmer SF2000 18 inches from canopy',
      priorities: 'stealth is critical — smell matters',
    });
    assert(ctx.plantType === 'autoflower', 'parseProfileText: detects autoflower');
    assert(ctx.isAutoflower === true, 'parseProfileText: derives isAutoflower');
    assert(ctx.mediumDetail === 'living-soil', 'parseProfileText: detects living soil');
    assert(Array.isArray(ctx.amendments) && ctx.amendments.length >= 2, 'parseProfileText: amendments populated');
    assert(ctx.lightBrand === 'spider-farmer', 'parseProfileText: detects light brand');
    assert(ctx.stealthRequired === true, 'parseProfileText: detects stealth priority');
  }

  {
    // Empty / non-string inputs safe
    const empty = parseProfileText(null);
    assert(empty && typeof empty === 'object' && empty.plantType === null, 'parseProfileText: null input returns default ctx');
    const nonStep = parseProfileText({ plant: 'some text' });
    assert(nonStep && nonStep.plantType === null, 'parseProfileText: unknown step name returns default ctx (plant-detail.js no-op path)');
  }

  return results;
}
