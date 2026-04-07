# Code Review: Section 01 - Knowledge Base Data File

## HIGH SEVERITY

### 1. Coverage requirement violated: two symptoms in only 1 SCORING entry
The plan states: "Every symptom in SYMPTOMS should appear in at least 2 SCORING entries."

- `webbing` appears only in `r-pest-mites`
- `white-residue` appears only in `r-mineral` (and wasn't in the plan's derivation table)

These aren't caught by tests but degrade Multi-Dx scoring accuracy.

## MEDIUM SEVERITY

### 2. 'whole' region count exceeds plan guidelines
Plan says 4-6 for 'whole', implementation has 8. Specifically:
- `rusty-edges` is a leaf-edge symptom (derived from q-color-which), arguably belongs in 'leaves'
- `dark-green` refers to leaf color, could also be 'leaves'

### 3. No test for the minimum-2 coverage requirement
Tests validate forward references (SCORING -> SYMPTOMS) but not reverse coverage.

### 4. Weight values at 0.95
Three entries use 0.95 (r-light-burn, r-stretching, r-pm). Plan examples show 0.8-0.9 for hallmarks. Minor consistency note.

## LOW SEVERITY

### 5. Unicode escape sequences in strings
Several REFINE_RULES use `\u2013` (en-dash). Valid ES5 but less readable than plain hyphens.

### 6. Browser runtime tests not verifiable in code review

## WHAT LOOKS GOOD
- All 44 TREE result node IDs covered in SCORING
- All 34 SYMPTOMS have correct fields with id matching key
- All 20 REFINE_RULES have required fields and use `diagnosesInclude()` helper
- All 15 mandatory rules present plus 5 additional
- Script tag placement correct
- Tests verbatim from plan, inserted at correct location
- No ES5 violations
- All weights and base_confidence in 0.0-1.0 range
- Every SCORING entry has at least 2 symptoms
