# Code Review: Section 06 - Treatment Journal

## Critical Issues

### 1. Logic Bug: Auto-resolve condition in processCheckIn() is always false
The condition `resolvedSymptoms.length === entry.symptoms.length + resolvedSymptoms.length` is mathematically impossible unless `entry.symptoms.length === 0`. By the time this line executes, `entry.symptoms` has already been mutated to contain `updatedSymptoms`, which has the resolved symptoms REMOVED. The check should capture the original symptom count BEFORE mutation.

### 2. migrateCount increments on every loadStateV2() call
Every time `loadStateV2()` is called for v2 data, `migrateCount` is incremented but not persisted. The v1 backup will be deleted after 5 normal page loads, not after 5 migrations.

### 3. No 'escalated' status transition
CSS for `.journal-status.status-escalated` exists but `processCheckIn()` never sets it. The 'getting-worse' response doesn't change entry status.

## Medium Issues

### 4. evictJournalEntry() mutates the input array
Uses `splice()` on the passed-in array AND returns it. Redundant but not a bug since caller reassigns.

### 5. loadStateV2() does not persist corrected v2 data
When v2 data has corrupted journal (not array), it's fixed in memory but not written back to localStorage.

### 6. Wizard check-ins produce empty score changelog
Wizard entries have empty symptoms array, so re-scoring is always skipped. Users see an empty 'Updated Assessment' card.

### 7. SYMPTOMS guard inconsistency
The 'better' branch uses `typeof SYMPTOMS !== 'undefined'` but the 'new-symptoms' branch uses `dataFileLoaded()`.

### 8. No guard against duplicate journal saves
Double-clicking 'Save & Start Tracking' creates two journal entries.

## Minor Issues

### 9. Treatment checkbox toggle styling not wired up
CSS `.treatment-select.checked` exists but no JS toggles the class on the parent label.

### 10. Days-since-fix input value captured nowhere
`renderCheckInStep2()` renders `<input id="days-since-fix">` but `processCheckIn()` never reads it.

### 11. dashHtml computed but unused for multi-dx refining/results
Minor inefficiency, not a bug.

### 12. Manual test items (16-20) not automated
Integration tests for full flows are manual-only. (Section 07 should cover these.)

## Checklist: All 15 implementable items addressed.
## XSS Safety: escapeHtml() used consistently throughout. Looks safe.
