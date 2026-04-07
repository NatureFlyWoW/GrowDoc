# Integration Notes — Opus Review Feedback

## Integrating (Must Fix)

### 1. Scoring threshold: standardize to 0.25
Plan said 0.25, spec said 0.30. Using 0.25 — lower threshold ensures borderline diagnoses aren't missed when multiple symptoms partially match.

### 2. XSS escaping for notes
All notes content must pass through `escapeHtml()` before rendering. Added explicitly to Section 5 in plan.

### 3. Mode selector keyboard navigation
Added arrow-key navigation (Left/Right) to the radiogroup pattern. Required for proper ARIA radiogroup behavior.

### 4. Re-assessment scoring interface
Extended `scoreDiagnoses()` to accept optional `treatedDiagnoses` parameter — array of diagnosis IDs whose treatments were tried but failed. These get a -0.2 penalty. This solves the check-in re-scoring problem without a separate code path.

### 5. Wizard/Expert "Save & Start Tracking" button
Added to `renderResultCard()` — appears on ALL result screens regardless of mode. Wizard/expert single-path results create journal entries with `symptoms: []` and `mode: 'wizard'/'expert'`.

### 6. Treatment action tracking UI
After "Save & Start Tracking," user sees the combined plan with checkboxes next to each fix step. Checked items are stored as `treatments[]` entries. This happens in the journal's initial "What are you going to try?" view.

### 7. Journal dashboard display condition
Precise rule: Show dashboard when `journal.length > 0 AND multiDxState.phase === 'select' AND state.currentNode === ROOT`. Hide during active diagnosis flow.

### 8. State precedence: journal overrides mode
Added explicit rule: `journalState.view !== 'dashboard'` takes precedence over mode rendering. Check-in flow renders instead of mode content.

### 9. Migration rollback
Before migrating v1 → v2, store original data under `growdoc-plant-doctor-v1-backup`. Delete after 5 successful v2 loads.

## Integrating (Should Fix)

### 10. Symptom max warning
Added: Show gold warning banner above 8 symptoms selected. Not a hard block.

### 11. Data file load validation
`init()` checks `typeof SYMPTOMS !== 'undefined'`. If false, disable Multi-Dx tab with tooltip.

### 12. Canonical symptom IDs
Plan now references SYMPTOMS registry as source of truth. All SCORING keys must reference SYMPTOMS IDs. Tests validate cross-references.

### 13. var-only style rule
Explicitly noted: no let/const/arrow functions. ES5 throughout for consistency.

### 14. alsoConsider → REFINE_RULES systematic conversion
Noted as implementation guidance: scan v1 alsoConsider entries and convert relevant pairs into REFINE_RULES.

## NOT Integrating

### Corroboration bonus removal
Reviewer said bonus is "too small to matter." Keeping it — 0.05-0.15 can be the tiebreaker between two diagnoses with similar base scores. Implementation cost is one line of code.

### Minimum 2 symptoms as soft gate
Reviewer suggested allowing 1 symptom. Keeping the hard minimum of 2 — single-symptom users should use wizard mode which gives better single-path guidance. Multi-Dx with 1 symptom would just be a worse wizard.

### Plant context fields (medium, strain, environment)
Intentional cut. These would add 3 more inputs to every session. Stage is sufficient for scoring. Can be added in a v3 if users want it.

### scores vs results redundancy
Keeping both. `scores` is the raw map for re-assessment calculations. `results` is the sorted/filtered display array. Different access patterns.

### localStorage size monitoring
Not implementing — 20 entries x ~3KB = ~60KB is well within the 5MB localStorage limit. Overkill for this use case.
