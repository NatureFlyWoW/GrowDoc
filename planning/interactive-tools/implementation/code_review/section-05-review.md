# Code Review: Section 05 — Plant Doctor

## Critical Issues

### 1. goBack() test overrides the real function
The test redefines `goBack` as a new anonymous function instead of calling the actual `goBack()`. This permanently replaces the real function for the rest of the page session. After `runTests()`, the Back button would use the test's stripped-down version that lacks `transitionToNode()`.

### 2. reset() test does not call reset()
The test manually sets `state.currentNode = ROOT` and `state.history = []` directly. This will always pass regardless of whether `reset()` works correctly.

### 3. Expert mode toggle test is tautological
The test sets `state.expertMode = true/false` as raw boolean assignments, never calling `toggleExpertMode()`. The assertion uses `||` so it always passes.

### 4. Expert mode Back button resets everything
In expert mode, Back and Start Over both clear all expert selections and reset to ROOT. Back should step back to previous selection state.

## Medium Issues

### 5. Expert mode does not save diagnosis to localStorage
In wizard mode, `render()` calls `saveLastDiagnosis()` on result. In expert mode, `renderExpert()` calls `renderResultCard()` but never `saveLastDiagnosis()`.

### 6. makeResult default checkFirst is dead code
Every result node provides its own `checkFirst`, completely replacing the default. Some nodes (r-stretching, r-damping-off, r-cotyledon-normal, r-trichomes) don't include a pH check. Spec says "always starts with pH."

### 7. Progress dots hardcoded to max 5
Fragile if tree is extended. Progress doesn't indicate remaining steps.

## Low Issues

### 8. Unused variables: `beforeBack`, `node2`
Dead code — assigned but never read.

### 9. No corrupted data export before reset
Spec says "warning + export + reset" but implementation only shows warning and deletes.

### 10. Toggle thumb created programmatically
Inconsistent with rest of UI rendered in static HTML or innerHTML.

## Diagnostic Coverage: PASS
All 17 required diagnoses covered. 44 result nodes (meets 40+ target). All tree paths terminate at results.

## File Size: PASS
~70KB, well under 100KB limit.
