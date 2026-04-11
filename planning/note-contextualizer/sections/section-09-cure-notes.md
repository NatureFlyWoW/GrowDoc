# section-09-cure-notes — Cure Note Projection + Severity Chip

**Original plan section:** S9a (Cure note projection + severity chip)
**Batch:** 4 (parallel with section-08)
**Complexity:** S

## Goal

Project existing cure-tracker entries into the Note Contextualizer as first-class `Observation`s, and add a severity chip + parsed-signal strip to the cure tracker's burp-note input so new cure notes carry severity metadata.

**Minimal edit** to existing `docs/tool-cure-tracker.html` — NOT a full SPA rewrite. Full cure advisor (strain profiles, decision rules, cure-view rewrite) is deferred to `9b-future.md`.

## Dependencies

- **section-01** — provides `Observation` type, `collectObservations` pure function to extend, singleton index, `__resetForTests`, registered test file.
- **section-03** — `KEYWORD_PATTERNS`, `parseObservation`, `DOMAIN_BY_RULE_ID` including aroma rules.
- **section-04** — `mergeNoteContext`, `getRelevantObservations`. Cure obs flow through unchanged.

Zero file overlap with section-08. Safe to parallelize.

## Background

### Cure tracker data shape

`docs/tool-cure-tracker.html` standalone tool, persists under `localStorage['growdoc-cure-tracker']`.

- **`state.curingLogs`**: array of burp-session entries:
  ```
  { weekNumber, date, burped:true, duration, rhJar, smell, notes }
  ```
  Notes max 200 chars. `smell` one of: Hay/Grass, Ammonia, Transitioning, Strain-specific, Complex/Rich.
- **`state.dryingLogs`**: array of drying-day entries with `{day, date, done, tempC, rhPercent, notes}`. Notes max 500 chars.

Walker tolerates missing arrays (new users, empty storage, parse failure).

### Observation shape reminder

```
Observation = {
  id, createdAt, observedAt,
  plantId (absent for cure — grow-wide),
  source: 'cure',
  sourceRefId (REQUIRED — synthesize from content),
  domains: ['cure-burp' | 'cure-dry'],
  severityRaw, severity, severityAutoInferred,
  rawText, parsed: null, tags: []
}
```

### `sourceRefId` for cure entries

Synthesize deterministically:
```
sourceRefId = `cure:${kind}:${weekOrDay}:${date}`
```
Stable as long as user doesn't edit prior entry's date (acceptable per orphan-on-edit policy).

### Domain assignment

- Burp notes → `'cure-burp'`. If `parsed.keywords` includes aroma rule, `DOMAIN_BY_RULE_ID` will add `'aroma'`.
- Drying notes → `'cure-dry'`.

Domains come primarily from `DOMAIN_BY_RULE_ID` resolution after `parseObservation`, with `cure-burp`/`cure-dry` force-injected.

### Severity projection

Rules:
1. Entry has `severityRaw` or `severity` field → read directly.
2. Otherwise derive heuristically:
   - `smell === 'Ammonia'` → `severityRaw: 'urgent'`, `severityAutoInferred: true`
   - `rhJar > 70` → `severityRaw: 'urgent'`, `severityAutoInferred: true`
   - `rhJar < 55` → `severityRaw: 'concern'`, `severityAutoInferred: true`
   - Else `severityRaw: null` (display `'info'`)
3. New entries written after chip ships will have `severityRaw` directly — honor over heuristics.

## Tests FIRST

Add to existing `js/tests/note-contextualizer.test.js`. Helper:
```js
function seedCure(state) { localStorage.setItem('growdoc-cure-tracker', JSON.stringify(state)); }
function clearCure() { localStorage.removeItem('growdoc-cure-tracker'); }
```

```
# Test: collectObservations reads localStorage['growdoc-cure-tracker'] and emits one Observation per cure note
# Test: Cure observations have source:'cure' and domains including 'cure-burp' or 'cure-dry'
# Test: Cure observation observedAt uses the entry date
# Test: Two seeded cure burp notes appear in getObservationIndex().byDomain['cure-burp']
# Test: Cure observation id is deterministic across two collectObservations calls on same localStorage
# Test: smell:'Ammonia' auto-infers severity 'alert' (severityRaw:'urgent', severityAutoInferred:true)
# Test: rhJar > 70 auto-infers severity 'alert'
# Test: rhJar < 55 auto-infers severity 'watch' (severityRaw:'concern')
# Test: Neutral values auto-infer severity 'info' (severityRaw:null)
# Test: Empty/missing localStorage produces zero cure observations, no errors
# Test: Malformed JSON produces zero cure observations, no errors (try/catch guard)
# Test: Drying note emits Observation with domain 'cure-dry'
# Test: parseObservation on 'smells citrusy day 10' populates parsed.keywords (depends on section-03 aroma rules)
# Test: opts.plantId filter EXCLUDES cure observations (cure has no plantId, is grow-wide)
# Test: Cure tracker severity chip writes legacy enum to entry's severity field (DOM harness or direct factory call)
# Test: Cure tracker parsed-signal strip renders keywords for 'smells citrusy day 10' (DOM harness or module helper)
```

DOM-side tests for the cure tracker HTML chip/strip MAY be deferred to manual `/test-runner` verification if mounting the standalone tool DOM is awkward. Document the decision in the test file.

## Implementation

### 1. Extend `collectObservations`

**File:** `js/data/note-contextualizer/index.js` (or wherever section-01 placed `collectObservations`).

Add walker at end of `collectObservations`:

```js
function walkCureTracker(out) {
  let raw;
  try {
    raw = localStorage.getItem('growdoc-cure-tracker');
    if (!raw) return;
  } catch (_) { return; }

  let state;
  try { state = JSON.parse(raw); }
  catch (_) { return; }
  if (!state || typeof state !== 'object') return;

  const curingLogs = Array.isArray(state.curingLogs) ? state.curingLogs : [];
  const dryingLogs = Array.isArray(state.dryingLogs) ? state.dryingLogs : [];

  for (const entry of curingLogs) {
    if (!entry?.notes || typeof entry.notes !== 'string') continue;
    out.push(buildCureObservation(entry, 'burp'));
  }
  for (const entry of dryingLogs) {
    if (!entry?.notes || typeof entry.notes !== 'string') continue;
    out.push(buildCureObservation(entry, 'dry'));
  }
}

function buildCureObservation(entry, kind) {
  const weekOrDay = kind === 'burp' ? (entry.weekNumber ?? '?') : (entry.day ?? '?');
  const date = entry.date || new Date().toISOString();
  const sourceRefId = `cure:${kind}:${weekOrDay}:${date}`;
  const rawText = String(entry.notes).slice(0, 500);
  const { severityRaw, severityAutoInferred } = inferCureSeverity(entry);
  const severity = severityRawToDisplay(severityRaw);

  return {
    id: hashObs('cure', sourceRefId, rawText),
    createdAt: new Date().toISOString(),
    observedAt: date,
    source: 'cure',
    sourceRefId,
    domains: [kind === 'burp' ? 'cure-burp' : 'cure-dry'],
    severityRaw, severity, severityAutoInferred,
    rawText, parsed: null, tags: [],
  };
}

function inferCureSeverity(entry) {
  if (entry.severityRaw !== undefined) return { severityRaw: entry.severityRaw, severityAutoInferred: false };
  if (entry.severity === 'urgent' || entry.severity === 'concern' || entry.severity === null) {
    return { severityRaw: entry.severity, severityAutoInferred: false };
  }
  if (entry.smell === 'Ammonia') return { severityRaw: 'urgent', severityAutoInferred: true };
  if (typeof entry.rhJar === 'number' && entry.rhJar > 70) return { severityRaw: 'urgent', severityAutoInferred: true };
  if (typeof entry.rhJar === 'number' && entry.rhJar < 55) return { severityRaw: 'concern', severityAutoInferred: true };
  return { severityRaw: null, severityAutoInferred: true };
}
```

`hashObs` is the deterministic hash from section-01. Reuse.

`opts.plantId` filter MUST exclude cure observations (they have no `plantId`). Add explicit test for this.

### 2. Hash digest includes cure-tracker state

`collectObservations` computes `fromHash` from `grow + profile`. Extend to include cure state:
```js
const cureHash = localStorage.getItem('growdoc-cure-tracker') || '';
fromHash = hash(growDigest + ':' + profileDigest + ':' + cureHash.length);
```

Document: "cure tracker state participates in the index hash even though it has no store subscriber."

Add test: seed cure, rebuild, mutate cure, rebuild, assert `fromHash` differs.

### 3. Cure tracker DOM edits

**File:** `docs/tool-cure-tracker.html` — only file modified here.

Standalone HTML tool. Does NOT use ES modules. Must remain self-contained.

**Three changes:**

1. **Severity chip markup** next to `<textarea id="burp-notes">` (~line 540). Three radio-style pills: `Info`, `Watch`, `Alert`. Inline CSS in the tool's `<style>` block using `var(--...)` tokens. Underlying values: `'urgent'|'concern'|null`.

2. **Parsed-signal strip** below textarea. Lightweight inline parser (~30 lines):
   ```js
   const KEYWORD_HINTS = /\b(ammonia|hay|grass|citrus|pine|dank|fruity|skunk|earthy)\b/ig;
   ```
   Render chip row on textarea blur. Do NOT import `rules-keywords.js` — standalone tool.

3. **Wire chip + strip into `addBurpEntry`** (~line 334–355):
   ```js
   entry.severityRaw = currentChipValue;
   entry.severity = currentChipValue;  // legacy field name too
   ```

**Do NOT touch** drying notes — out of scope for chip wiring (projection still walks them).

### 4. No initContextualizer changes

Cure tracker state is in a separate localStorage key with no store subscriber. Cure observations update when `collectObservations` re-runs — triggered by store commits on `grow`/`profile` OR direct `getObservationIndex()` with hash-check.

Including cure-tracker state in the hash digest (step 2 above) is what makes cure-only changes invalidate the cache.

## Files

**Modified:**
- `js/data/note-contextualizer/index.js` (extend `collectObservations`, hash digest)
- `js/tests/note-contextualizer.test.js` (append cure tests)
- `docs/tool-cure-tracker.html` (chip + strip + wire)

**Not created:** no new JS modules, no new CSS files, no fixture files.

## Out of scope

- Full cure advisor, strain profiles, decision rules, cure-view rewrite — `9b-future.md`.
- Chip/strip on drying-notes textarea.
- Cure data migration.
- Cross-grow cure analytics.
- Cure → Plant Doctor scoring (Plant Doctor is flower-stage).

## Manual verification

1. `vercel dev`, `/test-runner` hard reload. All tests pass.
2. Open `/docs/tool-cure-tracker.html`, add burp note with `Ammonia` smell + text `"jar smells awful"`. Click `Alert` chip. Save.
3. Inspect `localStorage['growdoc-cure-tracker']` — last entry has `severityRaw:'urgent'`.
4. DevTools on SPA side: `__resetForTests()` then `collectObservations(store.state.grow, store.state.profile)`. Filter `source==='cure'` — new entry has `severity:'alert'`, `domains` contains `'cure-burp'`, `parsed.keywords` non-empty.
5. No console errors.

Commit: `section-09: cure note projection + severity chip`
