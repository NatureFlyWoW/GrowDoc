# Plant Doctor v3 — TDD Plan

TDD approach is embedded per-section. Each section's test requirements are specified in claude-plan.md. The inline test framework (`runTests()` with assert pattern) is used throughout. Target: 190-200 total tests.

## Test Categories by Section

### Section 01: State & Data Model
- state.medium/lighting initialize to null
- grow-profile localStorage round-trip
- journal entry includes medium/lighting
- reset() preserves medium/lighting

### Section 02: Treatment Text Migration
- resolveMediumText() handles arrays (backward compat)
- resolveMediumText() handles object maps
- resolveMediumText() falls back to default when medium is null
- makeResult() default uses object format

### Section 03: UI
- Badges render with correct ARIA labels
- Saved profile skips to q-stage
- No profile starts at q-medium

### Section 04: Scoring
- scoreDiagnoses() accepts medium/lighting params
- Coco suppresses overwatering score
- LED boosts Ca/Mg scores
- Combined negative modifiers clamped at -0.40
- getAdjustedConfidence() applies modifiers in wizard mode

### Section 05: Ca Fix
- Old-leaf paths do NOT reach r-ca-def
- New-growth paths DO reach r-ca-def
- q-random-spots routes through new sub-question

### Section 06: Pests & Hermie
- All new result nodes exist and are valid
- Scoring entries produce non-zero scores
- Urgency banner renders for hermie nodes
- Wizard paths reach each pest node
- Fungus gnats suppressed in hydro

### Section 07: VPD Context
- vpdContext renders when present
- Enhanced placeholder on relevant nodes

### Section 08: Integration Tests
- Plant science validation (nutrient mobility correctness)
- Medium-specific treatment text rendering
- Backward compatibility with old format
