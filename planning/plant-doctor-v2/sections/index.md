<!-- PROJECT_CONFIG
runtime: vanilla-js
test_command: echo "Open in browser and run runTests() in console"
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-knowledge-base
section-02-state-and-mode-selector
section-03-scoring-engine
section-04-notes-input
section-05-multi-dx-mode
section-06-treatment-journal
section-07-integration-tests
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-knowledge-base | - | 03, 05 | Yes |
| section-02-state-and-mode-selector | - | 03, 04, 05, 06 | Yes |
| section-03-scoring-engine | 01 | 05, 06 | No |
| section-04-notes-input | 02 | 05, 06 | Yes |
| section-05-multi-dx-mode | 01, 02, 03, 04 | 06 | No |
| section-06-treatment-journal | 02, 03, 05 | 07 | No |
| section-07-integration-tests | all | - | No |

## Execution Order

1. **Batch 1**: section-01-knowledge-base, section-02-state-and-mode-selector (parallel, no dependencies)
2. **Batch 2**: section-03-scoring-engine, section-04-notes-input (parallel after batch 1)
3. **Batch 3**: section-05-multi-dx-mode (requires sections 01-04)
4. **Batch 4**: section-06-treatment-journal (requires sections 02, 03, 05)
5. **Batch 5**: section-07-integration-tests (requires all above)

## Section Summaries

### section-01-knowledge-base
Create `docs/plant-doctor-data.js` with SYMPTOMS registry (30-40 symptom definitions grouped by plant region), SCORING map (symptom-weight profiles for all 44 v1 result nodes), and REFINE_RULES array (15-25 forward-chaining rules for adaptive questions). Add `<script src>` to HTML file.

### section-02-state-and-mode-selector
Replace the binary Expert Mode toggle with a 3-option segmented control (Wizard/Expert/Multi-Dx). Update state machine: `state.mode` replaces `state.expertMode`. Add `multiDxState` and `journalState` objects. Update `render()` dispatch. Add ARIA radiogroup keyboard navigation. Graceful disable of Multi-Dx if data file missing.

### section-03-scoring-engine
Implement `scoreDiagnoses(selectedSymptoms, stage, treatedDiagnoses)` with weighted scoring, stage modifiers, corroboration bonus, and treatment penalties. Implement `getRefineQuestions(rankedDiagnoses)` and `applyRefineAnswer(scores, ruleId, optionIndex)`. Implement `generateCombinedPlan(topDiagnoses)` for deduplicated fix plans.

### section-04-notes-input
Add collapsible "Add notes" textarea component to all modes (wizard, expert, multi-dx). 200 char max with counter. Store in `wizardNotes` (wizard/expert) or `multiDxState.notes` (multi-dx). Ensure `escapeHtml()` on render. Display in result cards.

### section-05-multi-dx-mode
Build the full Multi-Dx flow: symptom selection phase (grouped checkboxes by region, growth stage selector, diagnose button with 2-symptom minimum and 8-symptom warning), refining phase (inline adaptive questions with fade transitions), and results phase (ranked diagnosis cards + combined action plan with "Save & Start Tracking" button).

### section-06-treatment-journal
Build the treatment journal: v1→v2 localStorage migration with backup, journal dashboard (active/resolved entries), treatment selection view (checkbox which fixes to try), check-in flow (status update → detail → re-assessment with updated scores and changelog), FIFO eviction at 20 entries. Add "Save & Start Tracking" to wizard/expert result cards too.

### section-07-integration-tests
Full integration tests: end-to-end multi-dx flow, journal lifecycle (create → check-in → resolve), wizard-to-journal save, localStorage v2 round-trip, all v1 tests still passing. Data file cross-reference validation.
