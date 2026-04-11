# 04 — Integration Points

All changes are additive imports + single call-site diffs. No existing function signatures change.

| # | File | Location | Change |
|---|---|---|---|
| I1 | `js/plant-doctor/doctor-engine.js` | `buildContext()` l.72-91 | Replace `_getRecentLogs` stub with `getRelevantObservations(store, { plantId: activePlantId, since: 14d })` → `mergeNoteContext()` → return ctx. Use the **active** plant id, not `plants[0]`. |
| I2 | `js/plant-doctor/doctor-engine.js` | `runDiagnosis()` l.7-45 | After scoring, call `adjustScoresFromNotes(scoresMap, ctx)` and re-rank. Mirror `tool-plant-doctor.html:2284`. |
| I3 | `js/plant-doctor/doctor-ui.js` | Results render | Inject "Your Action Plan" block from `generateContextualAdvice(ctx, topDiagnosisId)`. Mirror `tool-plant-doctor.html:4470`. |
| I4 | `js/components/task-engine.js` | `generateTasks()` entry l.12 | Build `const obsByPlant = collectObservations(grow, profile, { since: 14d })` ONCE, pass into each `evaluate*` helper. |
| I5 | `js/components/task-engine.js` | `evaluateTimeTriggers()` water/feed blocks | Before pushing a water/feed task, call `findActionsTakenSince(obsForPlant, 'water'|'feed', 2)` and skip if found. Surface `suppressedBy: [obsId]` on the would-be task for traceability. |
| I6 | `js/components/task-engine.js` | `evaluateDiagnoseTriggers()` l.216-256 | Extend "urgent" detection: fire when `obs.severity==='alert'` OR when `obs.parsed.ctx.severity==='worsening'` keyword fires in any log note within 48h. Today only `details.severity` enum is checked. |
| I7 | `js/components/task-engine.js` | `evaluateEnvironmentTriggers()` l.364-383 | If latest env reading contradicts a note in the last 24h (VPD in-range but alert obs says "tent feels hot"), emit an `env-discrepancy` task with both sides shown. |
| I8 | `js/data/harvest-advisor.js` | `getHarvestRecommendation()` | Accept `notes` param, run `mergeNoteContext(notes)`, fold `aroma-lemon-pine`, `trichomes-milky`, `trichomes-amber-20` signals into `tradeoffNote`. User "thinks early/late" shifts confidence ±10%. |
| I9 | `js/views/dashboard.js` | Status banner l.100 | Build observations once, show top `alert`-severity observation (≤48h) as second-line banner instead of generic "All good" when tasks are empty. |
| I10 | `js/views/plant-detail.js` | Timeline render ~l.195 | When rendering a log with notes, show inline tag chips from `parsed.keywords` (muted pills using `var(--accent)`) so user sees what signal was extracted. Traceability. |
| I11 | `js/components/task-card.js` | `_toggleNotesInput` / `_saveNotes` | When `task.notes` is saved, wrap as Observation `source:'task'`, infer severity from keyword scan, re-run `generateTasks` so follow-up "check improvement" fires. |
| I12 | `js/views/settings.js` | `profileSnap.context = parseProfileNotes(...)` l.255 | Replace with unified contextualizer call so `rawUnmatched[]` is merged into the observation index. |
| I13 | `js/components/log-form.js` | `_buildEntry` l.133 | Add optional `severity` dropdown (info/watch/alert) next to Notes field for observe-type logs. Complements existing `condition` field. |
| I14 | `js/views/journal.js` | Filter UI | Add a "domain" filter (nutrients/environment/pest/…) driven by the observation index. |
