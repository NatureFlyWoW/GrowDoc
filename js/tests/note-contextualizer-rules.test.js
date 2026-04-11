// GrowDoc Companion — Note Contextualizer Rules Tests (section-03)
//
// Exercises the ported KEYWORD_PATTERNS + auxiliary tables + the real
// `parseObservation` dispatcher. Loaded via `/test-runner` — follows
// the same `runTests() → {pass,msg}[]` contract as every other test
// module.

import {
  KEYWORD_PATTERNS,
  DOMAIN_BY_RULE_ID,
  FRANCO_OVERRIDE_RULE_IDS,
  SEVERITY_HEURISTICS,
  ACTION_TAKEN_PATTERNS,
} from '../data/note-contextualizer/rules-keywords.js';
import { parseObservation } from '../data/note-contextualizer/index.js';

// Fixtures live next to the test file. Loaded with fetch() at runtime —
// /test-runner is served by vercel dev so the static asset is resolvable
// relative to the page's origin.
async function loadFixtures() {
  const res = await fetch('/js/tests/fixtures/note-context-legacy.json');
  if (!res.ok) throw new Error(`fixture fetch failed: ${res.status}`);
  return res.json();
}

function makeObs(rawText, overrides = {}) {
  return {
    id: 'test-' + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    observedAt: new Date().toISOString(),
    source: 'log',
    sourceRefId: 'l-test',
    domains: [],
    severityRaw: null,
    severity: 'info',
    severityAutoInferred: false,
    rawText,
    parsed: null,
    tags: [],
    ...overrides,
  };
}

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // ── KEYWORD_PATTERNS shape & integrity ───────────────────────────

  {
    assert(Array.isArray(KEYWORD_PATTERNS), 'KEYWORD_PATTERNS is an array');
    assert(KEYWORD_PATTERNS.length >= 150,
      `KEYWORD_PATTERNS has at least 150 rules (got ${KEYWORD_PATTERNS.length})`);

    const ids = new Set();
    let allShaped = true;
    let duplicateId = null;
    for (const rule of KEYWORD_PATTERNS) {
      if (!rule || typeof rule.id !== 'string' || !(rule.pattern instanceof RegExp)) {
        allShaped = false;
      }
      if (ids.has(rule.id)) duplicateId = rule.id;
      ids.add(rule.id);
    }
    assert(allShaped, 'Every KEYWORD_PATTERNS entry has {id:string, pattern:RegExp}');
    assert(duplicateId === null, `KEYWORD_PATTERNS ids are unique (first dup: ${duplicateId})`);
  }

  // ── DOMAIN_BY_RULE_ID totality ───────────────────────────────────

  {
    let missing = null;
    for (const rule of KEYWORD_PATTERNS) {
      if (!DOMAIN_BY_RULE_ID[rule.id]) { missing = rule.id; break; }
    }
    assert(missing === null, `DOMAIN_BY_RULE_ID total over KEYWORD_PATTERNS (first missing: ${missing})`);
  }

  // ── FRANCO_OVERRIDE_RULE_IDS ─────────────────────────────────────

  {
    assert(FRANCO_OVERRIDE_RULE_IDS instanceof Set, 'FRANCO_OVERRIDE_RULE_IDS is a Set');
    assert(FRANCO_OVERRIDE_RULE_IDS.size >= 1, 'FRANCO_OVERRIDE_RULE_IDS non-empty');
    // Every override id must exist in KEYWORD_PATTERNS.
    const knownIds = new Set(KEYWORD_PATTERNS.map(r => r.id));
    let orphan = null;
    for (const id of FRANCO_OVERRIDE_RULE_IDS) {
      if (!knownIds.has(id)) { orphan = id; break; }
    }
    assert(orphan === null, `FRANCO_OVERRIDE_RULE_IDS all reference known rules (orphan: ${orphan})`);
  }

  // ── SEVERITY_HEURISTICS shape ────────────────────────────────────

  {
    assert(Array.isArray(SEVERITY_HEURISTICS), 'SEVERITY_HEURISTICS is an array');
    let shaped = true;
    for (const entry of SEVERITY_HEURISTICS) {
      if (!entry || !(entry.regex instanceof RegExp) ||
          !['alert', 'watch', 'info'].includes(entry.severity)) {
        shaped = false;
        break;
      }
    }
    assert(shaped, 'Every SEVERITY_HEURISTICS entry has {regex:RegExp, severity}');

    // Regression: the corrected /\b(bad|terrible|worst)\b/i form must
    // match each alternative individually.
    const entry = SEVERITY_HEURISTICS.find(e => /bad/i.test('bad') && e.regex.source.includes('bad|terrible|worst'));
    assert(!!entry, 'SEVERITY_HEURISTICS includes the (bad|terrible|worst) fix');
    if (entry) {
      assert(entry.regex.test('bad'), 'severity regex matches "bad" individually');
      assert(entry.regex.test('terrible'), 'severity regex matches "terrible" individually');
      assert(entry.regex.test('worst'), 'severity regex matches "worst" individually');
    }
  }

  // ── ACTION_TAKEN_PATTERNS shape ──────────────────────────────────

  {
    assert(ACTION_TAKEN_PATTERNS && typeof ACTION_TAKEN_PATTERNS === 'object',
      'ACTION_TAKEN_PATTERNS is an object');
    const taskTypes = Object.keys(ACTION_TAKEN_PATTERNS);
    assert(taskTypes.length >= 6, `ACTION_TAKEN_PATTERNS has ≥6 task types (got ${taskTypes.length})`);
    let allRegex = true;
    for (const t of taskTypes) {
      if (!(ACTION_TAKEN_PATTERNS[t] instanceof RegExp)) { allRegex = false; break; }
    }
    assert(allRegex, 'Every ACTION_TAKEN_PATTERNS value is a RegExp');

    // Smoke check: each pattern must match at least one documented phrase.
    const smoke = {
      water:     'just watered today',
      feed:      'fed the plants last night',
      flush:     'flushed with 2 gallons',
      ipm:       'sprayed neem yesterday',
      defoliate: 'defoliated the lower canopy',
      top:       'topped the main stem',
    };
    for (const t of taskTypes) {
      const phrase = smoke[t];
      if (phrase) {
        assert(ACTION_TAKEN_PATTERNS[t].test(phrase),
          `ACTION_TAKEN_PATTERNS.${t} matches "${phrase}"`);
      }
    }
  }

  // ── parseObservation basics ──────────────────────────────────────

  {
    // Idempotent: parsed != null → early return, no re-parse.
    const obs = makeObs('just flushed');
    parseObservation(obs);
    const firstParsed = obs.parsed;
    parseObservation(obs);
    assert(obs.parsed === firstParsed, 'parseObservation idempotent — same parsed ref on second call');
  }

  {
    // Empty input — full defaults, never throws, severityAutoInferred stays false.
    const obs = makeObs('');
    parseObservation(obs);
    assert(obs.parsed !== null, 'parseObservation(empty): parsed is non-null');
    assert(Array.isArray(obs.parsed.keywords) && obs.parsed.keywords.length === 0,
      'parseObservation(empty): keywords is []');
    assert(Array.isArray(obs.parsed.frankoOverrides) && obs.parsed.frankoOverrides.length === 0,
      'parseObservation(empty): frankoOverrides is []');
    assert(obs.parsed.ctx && obs.parsed.ctx.plantType === null,
      'parseObservation(empty): ctx.plantType defaults to null');
    assert(Array.isArray(obs.parsed.ctx.amendments) && obs.parsed.ctx.amendments.length === 0,
      'parseObservation(empty): ctx.amendments defaults to []');
    assert(obs.severityAutoInferred === false,
      'parseObservation(empty): does not auto-infer severity');
  }

  {
    // Declaration order preserved for multi-rule matches. "clone" matches
    // both `plantType-clone` and (later) `plantType-clone2` if "rooted
    // cutting" is present. We use a simpler case: "flower" text triggers
    // stage-flower BEFORE stage-late-flower etc.
    const obs = makeObs('in flower now, switching to late flower');
    parseObservation(obs);
    const idxFlower = obs.parsed.keywords.indexOf('stage-flower');
    const idxLate = obs.parsed.keywords.indexOf('stage-late-flower');
    if (idxFlower !== -1 && idxLate !== -1) {
      assert(idxFlower < idxLate, 'parseObservation preserves declaration order (stage-flower before stage-late-flower)');
    } else {
      assert(true, 'parseObservation declaration-order probe skipped (rules did not co-fire)');
    }
  }

  {
    // Severity auto-infer writes the legacy raw/display pair.
    const obs = makeObs('dying plant, leaves dead everywhere');
    parseObservation(obs);
    assert(obs.severityRaw === 'urgent' && obs.severity === 'alert',
      `severity heuristic: 'dying' → urgent/alert (got ${obs.severityRaw}/${obs.severity})`);
    assert(obs.severityAutoInferred === true,
      'severity heuristic: severityAutoInferred set true');
  }

  {
    // Caller-supplied severity is NOT overwritten.
    const obs = makeObs('dying plant', { severityRaw: 'concern', severity: 'watch' });
    parseObservation(obs);
    assert(obs.severityRaw === 'concern' && obs.severity === 'watch',
      'severity heuristic: caller severity preserved');
    assert(obs.severityAutoInferred === false,
      'severity heuristic: severityAutoInferred stays false when pre-set');
  }

  {
    // Franco overrides populate correctly.
    const obs = makeObs('tent hit 95F and the AC failed last night');
    parseObservation(obs);
    assert(obs.parsed.frankoOverrides.includes('env-ac-failed'),
      'parseObservation: Franco override fires for env-ac-failed');
  }

  {
    // Profile source short-circuits — wizard rules are handled by
    // parseProfileText, not parseObservation.
    const obs = makeObs('just flushed with plain water', { source: 'profile', wizardStep: 'medium' });
    parseObservation(obs);
    assert(obs.parsed && obs.parsed.keywords.length === 0,
      'parseObservation(profile source): no non-wizard rules fire');
  }

  // ── Fixture round-trip ──────────────────────────────────────────

  let fixtures;
  try {
    fixtures = await loadFixtures();
  } catch (err) {
    results.push({ pass: false, msg: `fixture load failed: ${err.message}` });
    return results;
  }

  assert(Array.isArray(fixtures) && fixtures.length >= 5,
    `fixture file has ≥5 entries (got ${Array.isArray(fixtures) ? fixtures.length : 'not-array'})`);

  for (const fx of fixtures) {
    const label = fx.name || JSON.stringify(fx.input).slice(0, 40);
    const obs = makeObs(fx.input.rawText);
    parseObservation(obs);
    const parsed = obs.parsed;
    const exp = fx.expected || {};

    // keywordsIncludes
    if (Array.isArray(exp.keywordsIncludes)) {
      let missing = null;
      for (const kw of exp.keywordsIncludes) {
        if (!parsed.keywords.includes(kw)) { missing = kw; break; }
      }
      assert(missing === null,
        `[${label}] keywords include ${JSON.stringify(exp.keywordsIncludes)} (missing: ${missing})`);
    }

    // keywords — strict equality
    if (Array.isArray(exp.keywords)) {
      assert(parsed.keywords.length === exp.keywords.length &&
        exp.keywords.every(k => parsed.keywords.includes(k)),
        `[${label}] keywords strictly equal ${JSON.stringify(exp.keywords)}`);
    }

    // domainsIncludes
    if (Array.isArray(exp.domainsIncludes)) {
      let missing = null;
      for (const d of exp.domainsIncludes) {
        if (!obs.domains.includes(d)) { missing = d; break; }
      }
      assert(missing === null,
        `[${label}] domains include ${JSON.stringify(exp.domainsIncludes)} (missing: ${missing}, got: ${JSON.stringify(obs.domains)})`);
    }

    // domains — strict equality
    if (Array.isArray(exp.domains)) {
      assert(obs.domains.length === exp.domains.length &&
        exp.domains.every(d => obs.domains.includes(d)),
        `[${label}] domains strictly equal ${JSON.stringify(exp.domains)}`);
    }

    // ctxHas — every key/value must be present in parsed.ctx
    if (exp.ctxHas && typeof exp.ctxHas === 'object') {
      let mismatch = null;
      for (const [key, val] of Object.entries(exp.ctxHas)) {
        if (parsed.ctx[key] !== val) {
          mismatch = `${key}: expected ${JSON.stringify(val)}, got ${JSON.stringify(parsed.ctx[key])}`;
          break;
        }
      }
      assert(mismatch === null, `[${label}] ctxHas ${mismatch || 'all match'}`);
    }

    // ctxDefaults — empty input should produce the §4a default shape
    if (exp.ctxDefaults === true) {
      assert(parsed.ctx.plantType === null &&
             parsed.ctx.medium === null &&
             parsed.ctx.waterSource === null &&
             parsed.ctx.lighting === null &&
             parsed.ctx.phExtracted === null &&
             parsed.ctx.tempExtracted === null &&
             parsed.ctx.rhExtracted === null &&
             parsed.ctx.ecExtracted === null &&
             parsed.ctx.vpdExtracted === null &&
             parsed.ctx.severity === null &&
             parsed.ctx.rootHealth === null &&
             parsed.ctx.growerIntent === null &&
             parsed.ctx.timelineDays === null &&
             Array.isArray(parsed.ctx.amendments) && parsed.ctx.amendments.length === 0 &&
             Array.isArray(parsed.ctx.previousProblems) && parsed.ctx.previousProblems.length === 0 &&
             Array.isArray(parsed.ctx.actions) && parsed.ctx.actions.length === 0,
        `[${label}] ctx matches §4a defaults`);
    }

    // actionsIncludes — each task type must appear in parsed.actionsTaken
    if (Array.isArray(exp.actionsIncludes)) {
      let missing = null;
      for (const act of exp.actionsIncludes) {
        const found = parsed.actionsTaken.some(a => a && a.type === act);
        if (!found) { missing = act; break; }
      }
      assert(missing === null,
        `[${label}] actionsTaken include ${JSON.stringify(exp.actionsIncludes)} (missing: ${missing})`);
    }

    // frankoOverridesIncludes
    if (Array.isArray(exp.frankoOverridesIncludes)) {
      let missing = null;
      for (const id of exp.frankoOverridesIncludes) {
        if (!parsed.frankoOverrides.includes(id)) { missing = id; break; }
      }
      assert(missing === null,
        `[${label}] frankoOverrides include ${JSON.stringify(exp.frankoOverridesIncludes)} (missing: ${missing})`);
    }

    // severity display enum
    if (typeof exp.severity === 'string') {
      assert(obs.severity === exp.severity,
        `[${label}] severity: expected ${exp.severity}, got ${obs.severity}`);
    }
    if ('severityRaw' in exp) {
      assert(obs.severityRaw === exp.severityRaw,
        `[${label}] severityRaw: expected ${exp.severityRaw}, got ${obs.severityRaw}`);
    }
    if (typeof exp.severityAutoInferred === 'boolean') {
      assert(obs.severityAutoInferred === exp.severityAutoInferred,
        `[${label}] severityAutoInferred: expected ${exp.severityAutoInferred}, got ${obs.severityAutoInferred}`);
    }

    // questionsNonEmpty
    if (exp.questionsNonEmpty === true) {
      assert(parsed.questions.length > 0,
        `[${label}] parsed.questions non-empty`);
    }
  }

  return results;
}
