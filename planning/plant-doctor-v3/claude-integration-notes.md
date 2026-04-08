# Integration Notes: Opus Review Feedback

## Integrating (Critical Issues)

### 1. Wizard mode scoring gap — INTEGRATING
The most important finding. Wizard mode bypasses `scoreDiagnoses()` entirely — it uses tree traversal to reach results. Medium/lighting modifiers would only work in Multi-Dx. Fix: wizard mode should apply medium/lighting modifiers to the result's confidence value at render time. Add a `applyModifiers(node, medium, lighting)` function that adjusts displayed confidence when rendering wizard results.

### 2. Duplicate rule-ca-vs-mg — INTEGRATING
The rule already exists at line 355. Will UPDATE the existing rule instead of creating a duplicate.

### 3. Two paths to r-ca-def — INTEGRATING
Both `q-yellow-old` (line 675) and `q-random-spots` (line 703) reach `r-ca-def` from old-leaf contexts. Will reroute BOTH paths. `q-yellow-old` → pH lockout. `q-random-spots` → add a sub-question distinguishing new vs old growth spots before routing.

### 4. ROOT constant change — INTEGRATING
Adding explicit callout in Section 03 that ROOT changes to `q-medium`, with enumeration of all impacted references: reset(), renderProgress(), tree traversal test, expert mode.

### 5. UX friction for returning users — INTEGRATING
Excellent point. Will change: if saved profile exists, skip medium/lighting questions and go directly to q-stage. Show badges at top. Badges are the mechanism to change. Only ask medium/lighting if no saved profile.

### 6. scoreDiagnoses() signature — INTEGRATING
Will specify adding medium and lighting as explicit parameters, matching the existing pattern of passing stage explicitly.

## Integrating (Important Issues)

### 8. Array.isArray() for type detection — INTEGRATING
Correct, `.default` check is fragile. Will specify `Array.isArray()` as the discriminator with explicit fallback chain.

### 10. State init and reset — INTEGRATING
Will specify initial values as null, loaded from profile on init. Add medium/lighting to resetMultiDxState().

### 12. Negative modifier clamping — INTEGRATING
Will add a combined modifier floor of -0.40 to prevent over-suppression.

### 13. Hermie routing matrix — INTEGRATING
Will add explicit routing: Early+widespread=genetic, Late+isolated=stress, Early+isolated=genetic (conservative), Late+widespread=needs refine question.

### 16. Accessibility — INTEGRATING
Will add ARIA specs for urgency banner (role=alert), badges (aria-label), pills (role=radiogroup).

### 19. makeResult() default — INTEGRATING
Will update makeResult() default checkFirst to object format.

### 20. Pest medium modifiers — INTEGRATING
Will add: fungus gnats hydro -0.40, bud rot hydro -0.15 (less relevant in hydro).

## NOT Integrating

### 7. File size / monolith splitting — NOT INTEGRATING
Out of scope for v3. The tool works as a monolith. Splitting would be a separate refactoring effort.

### 9. generateCombinedPlan() semantic dedup — NOT INTEGRATING
The current string-equality dedup is acceptable. Authors should use identical strings where dedup is desired. Adding semantic dedup adds complexity without clear benefit.

### 11. Expert mode clarification — PARTIAL
Expert mode uses tree traversal from ROOT, so it will naturally get medium/lighting as the first cascading selects. No separate dropdowns needed — removing that ambiguity from the plan.

### 14. Hermie mutual exclusion scoring — NOT INTEGRATING
The refine rule handles this adequately. Cross-suppression in scoring entries would over-complicate the data model.

### 15. Historical journal entries — NOT INTEGRATING as a concern
Journal entries store a `combinedPlan` snapshot at diagnosis time. Historical entries render from their stored snapshot, not from TREE. No migration needed.

### 17. Soilless medium — KEEPING
It's a valid growing medium distinct from pure soil. Even with minimal modifiers initially, removing it would be a worse decision than having it.

### 18. Caterpillars in bud rot alsoConsider — INTEGRATING (minor)
Will add to r-bud-rot's alsoConsider.

### 21-22. Test count / performance — NOTING
Will adjust test target to 190-200. Performance is fine, no action needed.
