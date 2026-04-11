# 03 — Proposed Design

## Observation schema (`js/data/observation-schema.js`)

Every note anywhere in the app gets wrapped as this shape before any consumer touches it:

```js
/**
 * @typedef {Object} Observation
 * @property {string}   id              uuid
 * @property {string}   createdAt       ISO, when row written
 * @property {string}   observedAt      ISO, when user saw it (defaults createdAt)
 * @property {string=}  plantId         grow.plants[i].id, null = grow-wide
 * @property {string=}  zoneId          future-proof
 * @property {string}   source          'log'|'task'|'plant'|'profile'|'stage-transition'|'cure'|'wizard'|'plant-doctor'
 * @property {string=}  sourceRefId     logId / taskId / ...
 * @property {string=}  stageAtObs      inferred from plant.stageStartDate
 * @property {string=}  flowerWeek      derived if stage in flower
 * @property {string[]} domains         ['nutrients','environment','pest','training','phenotype','aroma','root','watering','health','action-taken','question']
 * @property {'info'|'watch'|'alert'} severity
 * @property {string}   rawText         exact user input
 * @property {ParsedNote} parsed        lazy; see below
 * @property {string[]} tags            keyword ids + user-added
 * @property {string[]} referencedIn    consumer ids that cited this obs
 */

/**
 * @typedef {Object} ParsedNote
 * @property {Object}   ctx             same shape as existing extractNoteContext result
 * @property {Array<{type:string,value:string}>} observations
 * @property {Array<{type:string,value:string}>} actionsTaken
 * @property {string[]} questions
 * @property {string[]} keywords        KEYWORD_PATTERNS ids that fired
 */
```

## Storage strategy — projection, not persistence

- **No new localStorage keys.** Observations are produced on demand by `collectObservations(grow, profile, opts)` that walks existing data (profile.notes, plant.notes, plant.logs[*].details, grow.tasks[*].notes).
- **Cache:** ephemeral `grow._observationIndex = { version, builtAt, fromHash, byPlant: {id: [obs]}, byDomain: {domain: [obs]} }` rebuilt on `grow`/`profile` commits via store subscription.
- **Quota safety:** cache lives in memory only; never persisted. Quota dashboard unaffected.
- **Migration cost: zero.** Legacy fields remain source of truth; projection is a view.

### Why projection and not a new store?

The user already has 7+ existing note fields (A–K in audit). Creating `growdoc-companion-observations` would require dangerous migration, dual-write, and storage pressure. Projection preserves backwards compat while giving every consumer a uniform view.

## Contextualizer module layout

```
js/data/note-contextualizer/
  index.js                 # public API
  rules-keywords.js        # port of note-context-rules.js §1 (KEYWORD_PATTERNS)
  rules-advice.js          # port of §2 (ADVICE_RULES)
  rules-score.js           # port of §3 (SCORE_ADJUSTMENTS)
  rules-domains.js         # DOMAIN_BY_RULE_ID sidecar
  merge.js                 # mergeNoteContext, getRelevantObservations
  weighting.js             # recency decay, conflict resolver, franco-override list
```

## Public API (`index.js`)

```js
// Projection
export function collectObservations(grow, profile, opts = {});
// opts: { plantId?, since?: ISO, domains?: string[], limit?: number, minSeverity?: 'info'|'watch'|'alert' }

// Parsing
export function parseObservation(obs);       // mutates obs.parsed, returns obs
export function parseAllObservations(obs[]); // batch, idempotent

// Queries
export function getRelevantObservations(store, { plantId, since, domains, limit, minSeverity });
export function mergeNoteContext(observations);  // fold many obs → one ctx, newest wins per field

// Advice
export function generateContextualAdvice(noteContext, diagnosisId);
export function adjustScoresFromNotes(scoresMap, noteContext);

// Task redundancy guard
export function findActionsTakenSince(observations, taskType, sinceDays);

// Attribution
export function recordReferencedIn(store, observationIds, consumerId);
```

## Keyword → domain classification

Existing 984 keyword patterns don't carry a domain tag. We add a sidecar lookup (`rules-domains.js`) — pure table, no regex changes:

```js
export const DOMAIN_BY_RULE_ID = {
  'plantType-clone':     'phenotype',
  'plantType-autoflower':'phenotype',
  'feed-reduced':        'action-taken',
  'flush-performed':     'action-taken',
  'ph-extracted':        'nutrients',
  'temp-extracted':      'environment',
  'rh-extracted':        'environment',
  'tip-burn':            'nutrients',
  'spider-mites':        'pest',
  // ... ~984 entries, default 'general'
};
```

## Action-taken detection (new small section in `rules-keywords.js`)

```js
export const ACTION_TAKEN_PATTERNS = [
  { id: 'action-flushed',    pattern: /\bflushed?\b|\bflushing\b/i,         blocks: ['water','flush'] },
  { id: 'action-watered',    pattern: /\bwatered\b|\bjust watered\b/i,      blocks: ['water'] },
  { id: 'action-fed',        pattern: /\bfed\b|\bjust fed\b|\bfeed done\b/i, blocks: ['feed'] },
  { id: 'action-defol',      pattern: /\bdefoliated\b|\btrimmed leaves\b/i, blocks: ['defoliate'] },
  { id: 'action-topped',     pattern: /\btopped\b|\bfimmed\b/i,             blocks: ['top'] },
  { id: 'action-ipm-spray',  pattern: /\bsprayed\b|\bIPM spray\b/i,         blocks: ['ipm'] },
  { id: 'action-moved-fan',  pattern: /\bmoved the fan\b|\bfan repositioned\b/i, blocks: [] },
  { id: 'action-calmag-adj', pattern: /\b(backed off|reduced|increased)\s+cal.?mag\b/i, blocks: [] },
];
```

## Weighting & conflict-resolution algorithm

```js
// resolve one scalar field across N candidate sources
function resolveScalar(field, sources) {
  const now = Date.now();
  let best = null;
  for (const s of sources) {
    const ageH = (now - s.ts) / 3600000;
    let w = 0;
    if (s.origin === 'note') {
      if (s.severity === 'alert' && ageH < 24)  w = 1.00;
      else if (s.severity === 'watch' && ageH < 48) w = 0.90;
      else if (ageH < 168) w = 0.70;   // 7d
      else w = 0.30;
    } else if (s.origin === 'log-structured') {  // log.details.pH etc
      w = ageH < 24 ? 0.85 : ageH < 72 ? 0.60 : 0.35;
    } else if (s.origin === 'sensor') {
      w = ageH < 2 ? 0.80 : ageH < 12 ? 0.55 : 0.30;
    } else if (s.origin === 'profile-default') {
      w = 0.20;
    }
    if (!best || w > best.w) best = { ...s, w };
  }
  return best;
}
```

**Merge ordering:**
1. Sort observations by `observedAt` desc.
2. For each scalar field (plantType, ph, temp, rh, …): take the newest observation whose `parsed.ctx[field]` is set.
3. Array fields (keywords, amendments, previousProblems): union, tagging each with its source observation.
4. Apply recency decay per the table above.
5. Any observation with `domains` containing `'action-taken'` within 48h blocks the corresponding task type via `findActionsTakenSince`.

**Franco override:** a `FRANCO_OVERRIDE_RULE_IDS` set (heat-stress, overwater, severe wilt, nutrient lockout, hermie-alert) bypasses recency decay entirely and always claims weight 1.0. This honors the Franco-priority memory — survival-critical signals can't be outranked by a fresh sensor reading.
