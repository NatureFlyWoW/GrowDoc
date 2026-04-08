# Opus Review

**Model:** claude-opus-4
**Generated:** 2026-04-07

---

## Critical Issues (6)

1. **Wizard mode doesn't use scoring engine** — medium/lighting modifiers from Section 04 silently ignored in most common user flow
2. **Duplicate refine rule** — `rule-ca-vs-mg` already exists in plant-doctor-data.js line 355
3. **Two paths reach `r-ca-def` from old-leaf context** — plan says one, there are two (q-yellow-old line 675, q-random-spots line 703)
4. **ROOT constant change not called out** — changing ROOT from q-stage to q-medium affects tests, expert mode, reset, progress dots
5. **Mandatory medium/lighting for returning users** — UX friction; should skip if saved profile exists, use badges instead
6. **`scoreDiagnoses()` signature change** — function takes stage as parameter, not from global state; medium/lighting must be added explicitly

## Important Issues (17)

7. File size growing to ~4800 lines — consider moving TREE to data file
8. Object detection for treatment text should use `Array.isArray()`, not `.default` check
9. `generateCombinedPlan()` semantic deduplication will break with medium-specific text variants
10. State initialization and reset — initial values, null handling, resetMultiDxState() updates
11. Expert mode integration unclear — tree traversal vs separate dropdowns
12. Negative modifier stacking — could suppress diagnoses to near-zero (coco + late flower for overwatering = -0.55)
13. Hermie routing matrix underspecified — which answer combinations lead where
14. Hermie scoring entries share symptoms poorly — mutual exclusion not handled
15. localStorage migration — historical journal entries rendered from stored snapshot or TREE?
16. Accessibility — ARIA attributes for new UI elements (badges, alert banner, pills)
17. `soilless` medium type underused — may not justify separate category
18. Bud rot `single-leaf-death-bud` also indicates caterpillars — note in alsoConsider
19. `makeResult()` default checkFirst is flat array — should update to object format
20. Pest nodes missing medium_modifier — e.g., fungus gnats irrelevant in hydro
21. Test count target may be unrealistic — 190-200 more likely than 185-195
22. Performance fine — O(n*m) with 3 extra map lookups per entry is negligible
23. Duplicate rerouting — plan says "the question node" (singular) when two paths exist
