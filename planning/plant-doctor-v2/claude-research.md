# Plant Doctor v2 — Research Findings

## Part 1: Codebase Analysis

### Current Architecture Summary

**File:** `docs/tool-plant-doctor.html` (~70KB, 1220 lines, single-file vanilla JS)

**Decision Tree:**
- Flat dictionary `TREE` with 72 nodes (27 question, 44 result)
- Question nodes: `{ id, question, help?, options: [{ label, next }] }`
- Result nodes via `makeResult()`: `{ id, diagnosis, confidence, severity, checkFirst[], fixes[], alsoConsider[] }`
- `isResult(node)` checks for `diagnosis` field presence
- ROOT = `'q-stage'`, all paths verified to reach results

**State Machine:**
```js
state = { currentNode, history[], expertMode, expertSelections{} }
```
- Wizard: sequential via history stack, transitionToNode() with 150ms fade + lock
- Expert: cascading dropdowns via expertSelections map, rebuilt on each change

**Expert Mode (enhancement target):**
- `renderExpert()` walks from ROOT following selections, renders dropdowns inline
- `expertSelect()` rebuilds valid path, cascade-clears orphaned selections
- `expertGoBack()` pops last selection
- `getExpertResult()` traverses path to check for result

**localStorage:** Key `growdoc-plant-doctor`, schema `{ version:1, lastDiagnosis: { date, path[], result{} } }`. Corrupted data shows warning + reset.

**Rendering:** String concat -> innerHTML -> event binding. `escapeHtml()` for XSS. Fade transitions with transitioning lock.

**Tests:** `runTests()` with 9 tests. Sync override of transitionToNode for async-free testing. State save/restore around test suite.

**Design System:** Dark theme, CSS vars (--bg, --accent, --gold, --red), DM Serif Display/Source Serif 4/IBM Plex Mono fonts. Responsive at 640px. Accessibility: aria-live, sr-only, focus-visible, role="switch".

**Patterns from Other Tools:**
- Cure Tracker: multi-phase state machine, temporal logs, debounced saving, contextual guidance functions, alert logic
- Stealth Audit: scoring panel, persistent category bars, form-based UI

### Key Constraints for v2
- v1's TREE data must be reused (not replaced)
- Expert mode is the natural enhancement target for multi-select
- Wizard mode should remain simple for beginners
- State machine extends naturally to multi-select state
- localStorage schema supports version bumps for backward compat

---

## Part 2: Web Research — Multi-Symptom Diagnostic UX

### The Gap
Current cannabis tools (Grow Weed Easy, GrowDoc app) handle only single-symptom diagnosis. Real plants show compound symptoms. This is a significant opportunity.

### Proven UI Patterns
1. **Multi-select chips/tags** (Material Design 3) — toggleable chips grouped by category, persistent "evidence bar"
2. **Body-map navigation** — plant diagram with clickable zones (roots, stem, lower/upper leaves, buds) 
3. **Scoping pattern** (Koru UX) — combine multiple criteria for precise results
4. **Compound awareness** — when symptom combos match, surface compound diagnosis banners

### Confidence Corroboration
When multiple independent symptoms point to the same diagnosis, confidence increases. Formula:
```
base_score = sum(matched_weights) / sum(all_weights_for_diagnosis)
corroboration_bonus = (unique_regions_with_matches - 1) * 0.05
final_confidence = min(base_score + corroboration_bonus, 1.0)
```

Sources: AltexSoft Symptom Checker APIs, Respiratory Diseases Expert System (ID3 algorithm)

---

## Part 3: Web Research — Client-Side Decision Engines

### Recommended Hybrid: Weighted Scoring + Forward Chaining

**Weighted Scoring** (primary diagnosis ranking):
- Define symptom-diagnosis mappings with weights
- Sum matched weights, normalize to confidence %
- Boost for multi-region corroboration
- Pure vanilla JS, no dependencies

**Forward Chaining** (adaptive follow-up questions):
- Rules engine identifies which additional data points most differentiate between remaining candidates
- JSON knowledge base decoupled from code logic
- Cascading conclusions: new deductions become inputs for further rules

**Rejected alternatives:**
- Bayesian networks (jsbayes) — overkill, requires conditional probability tables
- Naive Bayes classifier — needs pre-training data we'd hardcode anyway

Sources: primaryobjects/knowledgebase, daily.dev weighted scoring guide

---

## Part 4: Web Research — Conversational Follow-Up Loops

### Treatment Review Loop Pattern
1. Initial diagnosis -> recommended actions
2. "Check back in X days" prompt (localStorage reminder)
3. Follow-up screen: "Did the treatment help?" 
   - Resolved -> archive
   - Partially improved -> reduce symptom set, re-score
   - No change/worse -> eliminate failed diagnosis, surface next candidates
4. Adaptive re-questioning based on which treatments were attempted

### Context Retention (Koru UX Pattern 11)
Store previous diagnoses and actions. On return, offer "Follow-up on previous diagnosis" entry point with pre-populated context.

### Session Storage Structure
```js
{ 
  sessionId, createdAt, 
  plantContext: { stage, medium, strain, environment },
  symptoms: [...],
  diagnoses: [{ id, name, confidence, rank }],
  treatments: [{ diagnosisId, action, startedAt, status }],
  followUps: [{ date, symptomsDelta, newSymptoms, resolvedSymptoms }]
}
```

### Engagement Patterns
- Visual progress indicators showing diagnosis journey
- Actionable next steps at every stage
- Changelog: "pH lockout dropped from 85% to 40% after flush; now suggesting calcium deficiency at 72%"

Sources: Eleken wizard UI guide, Koru AI patterns, Healthcare UX research

---

## Part 5: Testing Context

**Existing test pattern:** `runTests()` with simple assert, state save/restore, sync transition override.

**v2 testing needs:**
- Multi-select scoring: verify compound diagnoses rank correctly
- Follow-up re-scoring: verify confidence updates after treatment status changes
- Adaptive questions: verify correct follow-up questions surface for given symptom combos
- Session persistence: localStorage round-trip for full session objects
- Backward compatibility: v1 localStorage data loads without crash

---

## Recommended Architecture Summary

| Component | Pattern | Implementation |
|-----------|---------|----------------|
| Symptom input | Multi-select chips by plant region | Grouped toggle chips, optional plant SVG |
| Diagnosis engine | Weighted scoring + forward chaining | JSON knowledge base, pure JS scoring |
| Confidence | Ranked list with corroboration bonus | Normalize + region bonus |
| Adaptive questions | Forward-chaining rules | Most-discriminating question from remaining candidates |
| Follow-up loop | Wizard + context retention | localStorage session with treatment tracking |
| Re-assessment | Delta scoring on updated symptoms | Re-score, eliminate failed treatments |
| Free text | Optional context textarea | Keyword extraction for supplementary signals |
