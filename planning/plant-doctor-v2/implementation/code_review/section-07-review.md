# Code Review: Section 07 - Integration Tests

## High Severity

### 1. Incomplete state save/restore in section 07 local scope
Only 4 of 10 state variables saved locally. Missing: state.currentNode, state.history, state.expertSelections, state.wizardNotes, journalState.activeEntryId, journalState.checkInData, lastDiagnosis.

### 2. No crash protection on integration test block
The 7.3-7.9 block mutates state extensively but has no try/catch wrapper. An exception skips the restore, leaving multiDxState corrupted.

## Medium Severity

### 3. Global multiDxState never saved/restored at runTests() scope
savedState and the final restore block don't include multiDxState.

### 4. Test isolation violation between 7.3-7.6
Tests are chained by design (7.4 uses 7.3 results). Follows the plan, but contradicts plan's own isolation guidance.

## Low Severity

### 5. loadStateV2 side effect in test 7.6
migrateCount incremented on load; IIFE restores localStorage correctly.

### 6. else branch state mutation without local save
No local save/restore in the no-data-file branch.

## Checklist: All core items (1-12) implemented. Items 13-16 require runtime verification.
