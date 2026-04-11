# 01 — Current State Audit

## Note storage surfaces

| # | Where | Key / Path | Shape | File / line |
|---|---|---|---|---|
| A | Plant Doctor v3 wizard notes | `localStorage['growdoc-plant-doctor']` → `state.wizardNotes`, `multiDxState.notes` | `{[nodeId]: string}` | `docs/tool-plant-doctor.html:2149, 2157, 2165` |
| B | Plant Doctor grow profile | `localStorage['growdoc-grow-profile']` | Plain object, raw strings | `docs/tool-plant-doctor.html:2589, 2602` |
| C | Companion `profile.notes` (wizard per-step) | `growdoc-companion-profile` → `profile.notes = {stage, medium, lighting, strain, space, priorities}` | Map of step → string | `js/views/onboarding.js:686`, `js/views/settings.js:255` |
| D | Companion `profile.context` | Same key; output of `parseProfileNotes` | Structured: plantType, amendments[], previousProblems[]… | `js/data/profile-context-rules.js:123` |
| E | Companion per-plant `plant.notes` | `growdoc-companion-grow` → `grow.plants[i].notes` | Single free-text string | `js/views/plant-detail.js:536-558`, `js/views/my-grow.js:227-265` |
| F | Companion per-plant `plant.context` | `grow.plants[i].context` | `parseProfileNotes({plant: raw})` output | `js/views/plant-detail.js:551-552` |
| G | Log entry `details.notes` | `grow.plants[i].logs[j].details.notes` | Free text inside log | `js/components/log-form.js:128, 146` |
| H | Log entry structured details | `details.nutrients`, `details.action`, `details.condition`, `details.severity` | Flat strings / enum | `js/components/log-form.js:115-149`, `task-engine.js:222, 233` |
| I | Task `task.notes` | `grow.tasks[i].notes` | Free text on task card | `js/views/dashboard.js:344-351`, `js/components/task-card.js:138-157` |
| J | Cure Tracker free-text | `growdoc-cure-tracker` | String blob | `docs/tool-cure-tracker.html:161` |
| K | Plant "context notes" at add-plant | Same as E | Flat string | `js/views/my-grow.js:230-265` |

## Key facts

1. The mature contextualizer (`KEYWORD_PATTERNS` + `ADVICE_RULES` + `SCORE_ADJUSTMENTS`) lives in `docs/note-context-rules.js` and is **only loaded by standalone `tool-plant-doctor.html`**. The Companion `js/plant-doctor/*` module never imports it.
2. `parseProfileNotes` in `js/data/profile-context-rules.js` (267 lines) is a **second, smaller keyword parser** used only at onboarding / plant-detail save time. Produces `profile.context` / `plant.context` once, then never re-runs. No downstream advisor reads its `rawUnmatched[]` tail.

## Advice / review / task generators — note awareness

| Generator | File / function | Reads notes? | Verdict |
|---|---|---|---|
| Plant Doctor v3 multi-Dx scoring | `tool-plant-doctor.html:2284 runMultiDxDiagnosis` | `extractNoteContext` → `adjustScoresFromNotes` | Works |
| Plant Doctor v3 contextual advice | `tool-plant-doctor.html:2923, 4482` | `generateContextualAdvice` | Works |
| Plant Doctor v3 Copy-to-Opus | `tool-plant-doctor.html:4470 doCopyDiagnosis` | Appended + parsed | Works |
| Companion `buildContext(store)` | `js/plant-doctor/doctor-engine.js:72-91` | Returns `recentLogs` unparsed; never calls `extractNoteContext`; uses wrong plant (`plants[0]`) | **BROKEN** |
| Companion `runDiagnosis` | `js/plant-doctor/doctor-engine.js:7-45` | Only `context.contextBoost.key`; ignores `plant.notes`, `plant.context`, `log.details.notes` | **BROKEN** |
| Task Engine — time triggers | `js/components/task-engine.js:44-111` | Only log timestamps; free text ignored | **BROKEN** |
| Task Engine — stage triggers | `js/components/task-engine.js:115-201` | Reads `profile.context.isAutoflower`, `amendmentDensity`; NOT `plant.context`, NOT log notes | Partial |
| Task Engine — diagnose triggers | `js/components/task-engine.js:216-256` | Only `log.details.severity` enum; free-text `log.details.notes` ignored | **BROKEN** |
| Task Engine — IPM / training / env | `task-engine.js:289-382` | Zero note reads | **BROKEN** |
| Priority Engine | `js/data/priority-engine.js` | Zero | **BROKEN** |
| Harvest Advisor | `js/data/harvest-advisor.js:11` | Trichome ratios + priorities only | **BROKEN** |
| Stage Rules / transitions | `js/data/stage-rules.js` | Nothing | **BROKEN** |
| Pattern Tracker | `js/data/pattern-tracker.js` | Timestamps only | Acceptable |
| Dashboard status + weekly summary | `js/views/dashboard.js:100-305` | Task priorities only | **BROKEN** |
| Plant Detail timeline | `js/views/plant-detail.js:195` | Display-only render | Display-only |
| Journal view | `js/views/journal.js:81` | Display-only | Display-only |

**Tally:** 3 of 14 generators consult notes. All 3 live in the standalone v3 tool. **11 of the Companion's advice/task surfaces drop notes entirely.**
