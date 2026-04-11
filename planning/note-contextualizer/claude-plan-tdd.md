# TDD Test Stubs — Note Contextualizer

Mirror of `claude-plan.md` section structure. For each section, list the tests to write BEFORE implementing. Tests follow the existing GrowDoc test convention: each file exports `async function runTests()` returning `Array<{pass, msg}>`, registered in `js/main.js:298`, run via the `/test-runner` route in the browser.

Fixtures use the `daysAgo(n)` helper pattern from `js/tests/task-engine.test.js:20-56`. All tests call `__resetForTests()` in a beforeEach-equivalent at the top of each test case.

---

## Section 1 — Observation schema, projection, store hook

New test file: `js/tests/note-contextualizer.test.js`

```
# Test: collectObservations on empty grow state returns empty array, no errors
# Test: collectObservations walks profile.notes and emits one Observation per non-empty wizardStep
# Test: collectObservations walks plant.notes and emits one Observation per plant with non-empty notes; plantId set correctly
# Test: collectObservations walks plant.logs[*].details.notes and emits one Observation per log with notes; observedAt = log.timestamp
# Test: collectObservations walks grow.tasks[*].notes and emits one Observation per task with notes; plantId taken from task.plantId
# Test: Observation.id is deterministic — same input produces same id across two collectObservations calls
# Test: Observation.id differs when rawText changes (even for same source/sourceRefId)
# Test: Observation.observedAt inference — log source uses log.timestamp, plant source uses plant.stageStartDate, task source uses task.updatedAt || task.createdAt
# Test: Observations with source='profile' have non-null wizardStep and no sourceRefId
# Test: Observations with all other sources have non-null sourceRefId
# Test: opts.plantId filter returns only observations for that plant
# Test: opts.since filter excludes observations older than the ISO timestamp
# Test: opts.domains filter includes only observations whose domains intersect
# Test: initContextualizer installs a store subscriber that fires on 'grow' commits
# Test: initContextualizer does not throw on re-init (idempotent)
# Test: __resetForTests clears singleton cache and sidecar citations
# Test: getObservationIndex returns null-equivalent empty index when called before initContextualizer
# Test: getObservationIndex returns a frozen Observation array (mutation throws)
```

---

## Section 7-stub — Severity chip + strip scaffolding

New test file: `js/tests/severity-chip.test.js` (small — chip behavior only)

```
# Test: severity-chip renders three options: info, watch, alert
# Test: clicking the 'alert' chip sets internal value to 'urgent' (legacy enum write)
# Test: clicking the 'watch' chip sets internal value to 'concern'
# Test: clicking the 'info' chip sets internal value to null
# Test: auto-infer returns 'urgent' for text containing 'dying' and sets severityAutoInferred:true
# Test: auto-infer returns null for neutral text ('looks fine') and sets severityAutoInferred:false
# Test: user override of auto-inferred chip clears severityAutoInferred flag
```

(Parsed-signal strip tests come in Section 7-final — during stub phase it renders placeholder text.)

---

## Section 2 — KEYWORD_PATTERNS port + golden fixtures + delete legacy

Tests added to `js/tests/note-contextualizer.test.js`:

```
# Test: KEYWORD_PATTERNS imports as a frozen array of exactly N entries (N from legacy grep, ~984)
# Test: Every KEYWORD_PATTERNS entry has id, pattern, and extract fields
# Test: parseObservation({rawText: 'just flushed with 6.0 pH'}) sets parsed.keywords includes 'action-flushed' and 'ph-extracted'
# Test: parseObservation preserves rule array order — a pattern that matches multiple rules fires them in KEYWORD_PATTERNS declaration order
# Test: parseObservation produces parsed.ctx matching §4a field list shape — plantType, medium, waterSource, phExtracted, ecExtracted, tempExtracted, rhExtracted, vpdExtracted, severity, rootHealth, growerIntent, timelineDays, amendments, previousProblems, actions
# Test: parseObservation on empty rawText produces empty ctx, empty keywords, parsed!==null (parser never fails for string input)
# Test: Parity harness — for every fixture in js/tests/fixtures/note-context-legacy.json: parseObservation({rawText: fixture.input}).parsed.ctx deepEquals fixture.expected_ctx
# Test: SEVERITY_HEURISTICS regexes all compile (no SyntaxError)
# Test: SEVERITY_HEURISTICS /\b(bad|terrible|worst)\b/i matches each of 'bad', 'terrible', 'worst' individually (regression for the grouping bug)
# Test: ACTION_TAKEN_PATTERNS all compile and each matches its documented phrase
# Test: DOMAIN_BY_RULE_ID maps every rule id that appears in KEYWORD_PATTERNS — no orphan rule ids
# Test: FRANCO_OVERRIDE_RULE_IDS contains at least the documented set: stress-heat-*, stress-overwater-*, root-rot-*, stress-drought-severe, hermie-*, bananas-spotted
# Test: parsed.frankoOverrides is populated when a matching rule fires
# Test: Deleted legacy files — after Section 2b, grep finds no remaining import/reference to docs/note-context-rules.js or docs/tool-plant-doctor.html in js/* or docs.json
```

---

## Section 3 — Merge, weighting, kill profile-context-rules

Tests added to `js/tests/note-contextualizer.test.js`:

```
# Test: mergeNoteContext with empty array returns empty ctx
# Test: mergeNoteContext with one observation returns its ctx
# Test: mergeNoteContext severity-first — alert@6h outranks info@1h
# Test: mergeNoteContext within-tier recency — alert@2h outranks alert@8h via half-life
# Test: mergeNoteContext Franco override — stress-heat-severe@30h wins over any non-Franco observation, ignoring decay
# Test: mergeNoteContext Franco override ordering — freshest Franco override wins if multiple
# Test: mergeNoteContext array fields — keywords union across all observations with source attribution
# Test: findActionsTakenSince returns observations matching 'water' taskType within 12h
# Test: findActionsTakenSince EXCLUDES observations with source==='profile' (wizard priors are not events)
# Test: findActionsTakenSince returns empty array when no match
# Test: getRelevantObservations scopes by plantId and since correctly
# Test: getRelevantObservations minSeverity filter — minSeverity='watch' excludes info-level observations
# Test: half-life resolveScalar — weight = 0.5^(24/24) = 0.5 for a 24h-old alert
# Test: half-life resolveScalar — weight ~= 0.97 for a 1h-old watch
# Test: Merged wizard rules — a rule from the old profile-context-rules.js (e.g. stage-clone) fires with source:'profile' and wizardStep:'stage'
# Test: Wizard dedupe — clone mention in both wizard and general patterns fires once, tagged with both sources
# Test: profile-context-rules.js is gone — a grep in the js/ tree finds zero remaining imports
```

---

## Section 4 — Plant Doctor wiring + authored rules + activePlantId

Tests added to `js/tests/note-contextualizer.test.js` and `js/tests/doctor-engine.test.js`:

```
# Test: rules-score.js authored rules — each has id, appliesTo (Companion condition name), condition closure, adjustment number
# Test: rules-score.js appliesTo values are all real Companion conditions from doctor-data.js
# Test: rules-advice.js authored rules — each has id, appliesTo, condition, headline, detail, severity fields
# Test: adjustScoresFromNotes boosts 'pH Imbalance' score when ctx.phExtracted is out of 5.5-7.0 range
# Test: adjustScoresFromNotes boosts 'Overwatering' score when ctx.rootHealth==='suspect' or 'rotting'
# Test: adjustScoresFromNotes boosts 'Heat Stress' score when ctx.tempExtracted > 28
# Test: adjustScoresFromNotes ignores non-matching conditions (preserves score)
# Test: generateContextualAdvice returns top-5 advice objects for a given condition
# Test: generateContextualAdvice falls back to generic advice when no condition-specific rule fires
# Test: generateContextualAdvice cites observation ids for traceability
# Test: Rule error isolation — a deliberately throwing rule closure adds an entry to index.ruleErrors[]; other rules still execute
# Test: buildContext uses store.state.ui.activePlantId when set
# Test: buildContext falls back to plants[0] when activePlantId is null (backwards compat)
# Test: buildContext fetches observations for the ACTIVE plant, not plants[0], when both exist
# Test: runDiagnosis end-to-end — seed a plant with {logs: [{details:{notes:'ph was 5.0 runoff, tips burning'}}]}; assert top condition is 'pH Imbalance' and confidence is boosted vs a grow with no notes
# Test: runDiagnosis cross-plant isolation — alert note on plantA does not affect plantB diagnosis
# Test: Active plant store slot — committing ui.activePlantId persists to localStorage via existing store flow
```

---

## Section 5 — Task engine note-awareness + override API

Tests added to `js/tests/task-engine.test.js`:

```
# Test: generateTasks collects observations once at entry and passes into evaluators (sanity — not a spy test, check via debug waterfall output)
# Test: Anti-redundancy water — plant with log note 'just flushed' at daysAgo(0.2) produces no water task on generateTasks
# Test: Anti-redundancy feed — plant with log note 'fed at full strength' at daysAgo(0.5) produces no feed task (24h window)
# Test: Anti-redundancy IPM — plant with log note 'sprayed neem' at daysAgo(1) produces no IPM task (72h window)
# Test: Suppressed task metadata — tasks suppressed by note observation have suppressedBy: [obsId]
# Test: Wizard observation does NOT suppress — a profile.notes 'I flush weekly' does not block any water task
# Test: Env discrepancy — alert observation 'tent feels hot' within 24h + in-range VPD sensor reading produces an 'env-discrepancy' task
# Test: Diagnose trigger severity — alert-severity log observation fires a diagnose task even when log.details.severity is null
# Test: Diagnose trigger severity — 'worsening' keyword in log note fires a diagnose task
# Test: overrideSuppression creates a real log entry on grow.plants[i].logs with type:'override' and details.notes:'Manual override: water'
# Test: overrideSuppression commits grow state (observable via store.state.grow snapshot diff)
# Test: overrideSuppression — after commit, getObservationIndex picks up the new override observation
# Test: overrideSuppression — after commit, the next generateTasks pass re-suppresses the task for the standard debounce window
# Test: Regression — no observations means task engine behavior is identical to pre-section-5 output for a fixture grow
```

---

## Section 6 — Harvest / stage / priority / dashboard note-awareness

Tests added to `js/tests/harvest-advisor.test.js`, `js/tests/stage-rules.test.js`, `js/tests/priority-engine.test.js`:

```
# Test: getHarvestRecommendation(trichomes, priorities) with notes=[] produces original output (backwards compat)
# Test: getHarvestRecommendation with notes containing 'smells amazing, want max terps' shifts recommendation toward harvest-now
# Test: getHarvestRecommendation with notes containing 'wait for more amber' shifts recommendation toward wait
# Test: getHarvestRecommendation confidence shifts ±10% on 'user-thinks-early' or 'user-thinks-late' rule fires
# Test: getHarvestRecommendation tradeoffNote cites observation ids for every note-sourced signal
# Test: stage-rules checkAdvance with notes containing 'just transplanted' blocks stage advance
# Test: stage-rules with notes=[] is backwards compatible
# Test: priority-engine getWeights with notes containing 'focused on yield' biases weights toward yield
# Test: dashboard status banner renders top alert-severity observation when tasks array is empty and an alert obs exists in last 48h
# Test: dashboard status banner renders generic 'All good' when no alert observations
```

---

## Section 7-final — UI finalization + debug waterfall

Tests added to `js/tests/ui-note-contextualizer.test.js`:

```
# Test: parsed-signal strip upgrades from '[parsing soon…]' to real parsed output after section ships (regression for stub → final)
# Test: parsed-signal strip renders domain-colored chips for top 3 keywords
# Test: parsed-signal strip updates on textarea blur
# Test: contradiction banner renders when new note says 'ph was 5.0' and recent log.details.pH === 6.2
# Test: contradiction banner does not render when values agree
# Test: Recent Observations widget renders last 5 observations for active plant
# Test: Recent Observations widget is collapsible, default collapsed
# Test: Recent Observations widget items show domain + severity chips
# Test: Journal domain filter renders a dropdown with all observed domains
# Test: Journal domain filter hides observations not matching the selection
# Test: Debug waterfall renders when ?debugNotes=1 is in URL
# Test: Debug waterfall renders one row per observation for a seeded grow with 3 obs
# Test: Debug waterfall row shows raw text, parsed keywords, merged ctx, applied weight, consumer citations
# Test: Debug waterfall row count capped at 200 (oldest pruned)
# Test: ?debugNotes=1 persists across SPA route changes via sessionStorage['growdoc-debug-notes']
# Test: Task card suppressed state renders quoted-note banner with relative timestamp ('2h ago')
# Test: Task card suppressed state renders 'Override' button
# Test: Task card 'Override' button calls taskEngine.overrideSuppression on click
```

---

## Section 9a — Cure note projection + severity chip

Tests added to `js/tests/note-contextualizer.test.js`:

```
# Test: collectObservations reads localStorage['growdoc-cure-tracker'] and emits one Observation per cure note
# Test: Cure observations have source:'cure' and domains including at least one of ['cure-burp','cure-dry','aroma']
# Test: Cure observation observedAt uses the cure-tracker entry timestamp
# Test: Two seeded cure notes appear in getObservationIndex().byDomain['cure-burp']
# Test: Cure tracker severity chip writes legacy enum to the cure-tracker entry's severity field
# Test: Cure tracker parsed-signal strip renders parsed keywords for a note containing 'smells citrusy day 10'
```

---

## Section 8 — Traceability, verification, deploy

Tests added to `js/tests/note-contextualizer.test.js`:

```
# Test: recordReferencedIn adds consumerId to citations sidecar for given obsIds
# Test: getCitationsFor returns the set of consumers that cited an obsId
# Test: Citations sidecar GCs orphaned entries — after a rebuild that drops an obs, its entry is not returned by getCitationsFor
# Test: After running runDiagnosis end-to-end, citations sidecar has entries for every observation that influenced the top condition
# Test: After running generateTasks, citations sidecar has entries for every observation that suppressed a task
# Test: sw.js VERSION string is NOT 'dev' (deploy-readiness check)
# Test: (smoke) All other test files pass when run in /test-runner — no cross-test contamination
```

Deploy checklist (manual, not a test):
- [ ] All tests pass in hard-reload `/test-runner` browser context
- [ ] `sw.js` VERSION bumped from 'dev'
- [ ] Manual verification: the six success criteria in `claude-spec.md §Success criteria` all pass
- [ ] `git log` shows section commits 1..8 (9a merged into batch 4) in order
- [ ] `vercel --prod` succeeds
- [ ] Post-deploy: `/test-runner` in production also passes
- [ ] No new environment variables added to Vercel
- [ ] Memory files updated if new patterns emerged

---

## Notes for the test author

- **No mocks.** Tests seed fixture grow/profile objects and call functions directly. There are no DI boundaries to mock.
- **`__resetForTests()` at the top of every test case** — the contextualizer singleton cache and sidecar Map are module-scoped and must be reset between tests.
- **`daysAgo(n)` helper** — copy from `js/tests/task-engine.test.js:20-56` or define inline. Returns an ISO timestamp.
- **Fixtures are inline** — no shared fixture library. Keep each test self-contained.
- **Assertions use `results.push({pass, msg})`** — the test runner aggregates them into a DOM table. No assertion library.
- **Cross-test isolation is YOUR responsibility** — if a test commits to store.state, the next test inherits it. Always `__resetForTests()` first.
- **Parity fixture capture** — before Section 2 starts, a one-time manual step opens a harness HTML file in the browser that loads the legacy `docs/note-context-rules.js` via `<script>`, runs `extractNoteContext` on 25 representative notes, dumps the results as JSON via `copy(JSON.stringify(results, null, 2))`. Commit the JSON to `js/tests/fixtures/note-context-legacy.json`.
