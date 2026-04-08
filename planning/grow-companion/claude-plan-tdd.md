# GrowDoc Grow Companion — TDD Plan

## Testing Approach

Continue the existing inline assertion pattern from Plant Doctor v3. Each module exports a `runTests()` function with `assert(condition, msg)` style tests. A master test runner aggregates all module tests. Tests run on DOMContentLoaded in development or via `/test` route.

No external testing framework. No npm. Custom assert with pass/fail counter and console output.

---

## Section 1: App Shell, Sidebar & Routing

### Router Tests
- Test: route matching returns correct view function for each defined route
- Test: parameterized routes extract params (e.g., `/grow/plant/:id` extracts `id`)
- Test: unknown routes fall back to 404/dashboard
- Test: first visit without profile redirects to landing page
- Test: visit with profile redirects to dashboard

### Sidebar Tests
- Test: sidebar renders all nav items with correct labels
- Test: collapsed state shows icons only (verify CSS class)
- Test: toggle button switches between collapsed and expanded
- Test: active section is highlighted for current route
- Test: between-grows mode disables My Grow sub-items

### Vercel Config Tests
- Test: vercel.json contains SPA rewrite rule
- Test: rewrite pattern excludes /api/, /legacy/, /assets/, /css/, /js/, /docs/

---

## Section 2: Store, Storage & Data Migration

### Store Tests
- Test: commit() updates state and notifies subscribers
- Test: subscribe() receives correct path and new value on state change
- Test: dispatch() runs action function then commits mutation
- Test: deep mutations via direct property access do NOT trigger subscribers (enforces immutable pattern)
- Test: event bus emits and receives namespaced events
- Test: multiple subscribers on same path all fire

### Storage Tests
- Test: save/load round-trip preserves data integrity
- Test: load() returns null for missing keys (not crash)
- Test: load() returns null for corrupted JSON (not crash)
- Test: migrate() runs sequential version functions (v1→v2→v3)
- Test: migrate() does not run if version is current
- Test: checkCapacity() returns reasonable percentage estimate
- Test: save() handles QuotaExceededError gracefully (does not throw)

### Migration Tests
- Test: existing growdoc-plant-doctor key is migrated to companion format
- Test: existing growdoc-grow-profile key imports medium/lighting
- Test: migration flag prevents double migration
- Test: migration failure leaves old data intact

---

## Section 3: Landing Page & Onboarding Wizard

### Onboarding Tests
- Test: wizard starts at step 1 (stage selection)
- Test: back button returns to previous step
- Test: progress dots reflect current step
- Test: skip-forward works for optional fields
- Test: completing all steps creates profile in store
- Test: completing all steps generates initial plants array
- Test: summary screen shows all selections

### Validation Tests
- Test: plant count must be 1-20
- Test: pot size selection is required
- Test: priority stars default to 3 if unset
- Test: effect type selector appears only when Effect >= 3 stars

---

## Section 4: Dashboard (Today View)

### Status Banner Tests
- Test: green banner when no pending urgent tasks and recent log exists
- Test: gold banner when recommended tasks are pending
- Test: red banner when urgent tasks exist or no log in 3+ days
- Test: banner text includes current stage and day count

### Between-Grows State Tests
- Test: dashboard shows "Start New Grow" when no active grow
- Test: dashboard shows last grow summary when archived grows exist
- Test: disabled sidebar items show tooltip in between-grows state
- Test: /grow/* routes redirect to /dashboard when no active grow

### Task Display Tests
- Test: tasks sorted by priority (urgent first)
- Test: task cards show experience-level-appropriate detail
- Test: done/dismiss/snooze/notes buttons render on each card

---

## Section 5: Task Engine

### Time-Based Trigger Tests
- Test: watering task generated after correct interval for soil/3L pot
- Test: watering task generated daily for coco in flower
- Test: feeding task generated every other watering for soil
- Test: check-in task generated after 3 days with no log
- Test: no duplicate tasks generated for same trigger

### Stage-Based Trigger Tests
- Test: stage transition suggestion at typical duration
- Test: defoliation task on day 1 and day 21 of flower
- Test: harvest check task in late flower
- Test: cure burp reminders match cure week frequency

### Experience Adaptation Tests
- Test: beginner detail includes specific pH/EC numbers
- Test: intermediate detail includes ranges
- Test: expert detail is brief action item
- Test: switching experience level changes task detail rendering

### Priority Integration Tests
- Test: yield priority generates higher DLI target recommendations
- Test: terpene priority generates lower temperature recommendations
- Test: trade-off notes appear on priority-adjusted tasks

---

## Section 6: Grow Knowledge Data Modules

### VPD Data Tests
- Test: VPD targets exist for all stages (seedling through ripening)
- Test: all VPD target values are within plausible range (0.3-2.0 kPa)
- Test: day temp ranges are always higher than night temp ranges

### DLI Data Tests
- Test: DLI targets exist for all stage/priority combinations
- Test: yield priority DLI >= quality priority DLI >= terpene priority DLI
- Test: all DLI values are in range 10-65

### Nutrient Data Tests
- Test: nutrient targets exist for all medium/stage combinations
- Test: EC targets decrease from mid-flower to late-flower
- Test: pH ranges differ between soil (6.0-6.8) and coco (5.5-6.5)
- Test: coco always has CalMag note

### Evidence Data Tests
- Test: every recommendation ID has an evidence classification
- Test: evidence levels are one of: established, promising, speculative, practitioner
- Test: established items include a source citation

---

## Section 7: Priority System UI

### Star Rating Tests
- Test: clicking star N sets rating to N
- Test: clicking same star toggles to N-1 (allows deselect)
- Test: rating change updates store
- Test: effect type selector shows when Effect >= 3
- Test: effect type selector hides when Effect < 3

### Weight Calculation Tests
- Test: equal stars produce equal weights
- Test: all-zero stars handled gracefully (default to equal)
- Test: weights sum to 1.0 (within floating point tolerance)
- Test: single priority at 5, others at 1, produces dominant weight

---

## Section 8: Environment Dashboard & Tracking

### VPD Calculator Tests
- Test: VPD formula produces correct result for known inputs (25C, 60% RH)
- Test: LED leaf-temp offset is -2C, HPS offset is -1C
- Test: status is "optimal" when VPD in target range for current stage
- Test: status is "high"/"low" when outside range

### DLI Calculator Tests
- Test: DLI = PPFD * hours * 0.0036 (verify with known values)
- Test: 400 PPFD at 18h = 25.9 DLI
- Test: 800 PPFD at 12h = 34.6 DLI

### Environment Logging Tests
- Test: logging a reading adds to environment.readings array
- Test: readings older than 30 days are compacted to weekly averages
- Test: trend data returns correct number of data points for selected range

### Chart Tests
- Test: chart SVG renders with correct number of data points
- Test: chart handles empty data set (no crash)
- Test: chart handles single data point

---

## Section 9: Plant Management & Quick Log

### Plant CRUD Tests
- Test: adding a plant creates entry in grow.plants array
- Test: plant names are sanitized (escapeHtml) before storage
- Test: deleting a plant removes it and its logs
- Test: renaming a plant preserves all associated data

### Quick Log Tests
- Test: one-tap log creates entry with auto-timestamp
- Test: expanded feed log captures pH, EC, volume
- Test: "Same as last time" pre-fills from most recent feed log
- Test: days-since counters update after new log
- Test: log notes are sanitized via escapeHtml before rendering

---

## Section 10: Growth Stage Timeline

### Timeline Rendering Tests
- Test: timeline renders all stages in correct order
- Test: current stage marker is positioned correctly
- Test: milestone markers appear at correct positions

### Stage Transition Tests
- Test: auto-advance prompt appears at typical duration
- Test: confirming advance updates plant stage and stageStartDate
- Test: declining advance does not change stage
- Test: stage change triggers task engine recalculation

---

## Section 11: Training Planner

### Method Selection Tests
- Test: selecting method generates correct milestones
- Test: "Top + LST" generates topping milestone, LST milestone, defoliation milestone
- Test: "No training" generates no milestones
- Test: changing method replaces all milestones

### Task Integration Tests
- Test: training milestones create tasks in task engine at trigger day
- Test: completing a training task marks the milestone as completed

---

## Section 12: Harvest Window Advisor

### Trichome Slider Tests
- Test: sliders sum to 100%
- Test: adjusting one slider proportionally adjusts others
- Test: edge case: two at 0%, third at 100% — moving third splits freed % equally
- Test: values snap to integers
- Test: minimum granularity is 1%

### Recommendation Tests
- Test: 80% milky + 15% amber + terpene priority → "harvest soon"
- Test: 90% clear + 10% milky → "keep waiting"
- Test: 50% amber + yield priority → "harvest now"
- Test: trade-off note is generated for non-dominant priorities
- Test: stagger harvest suggestion appears when applicable

---

## Section 13: Feeding Schedule & Nutrient Calculator

### Schedule Tests
- Test: soil/veg returns correct N-P-K ratio and EC range
- Test: coco/flower returns CalMag requirement note
- Test: hydro returns reservoir temp warning
- Test: terpene priority reduces EC target vs yield priority

### Calculator Tests
- Test: EC above target range generates "reduce" advice
- Test: EC below target range generates "increase" advice
- Test: pH out of range generates specific correction advice

---

## Section 14: Plant Doctor — Unified Diagnostic Flow

### Context Pre-Fill Tests
- Test: medium/lighting/stage loaded from companion profile
- Test: recent log entries converted to note context

### Unified Flow Tests
- Test: flow starts with area selection (guided start)
- Test: symptom checkboxes appear for selected area
- Test: multiple symptoms can be selected across areas
- Test: scoring updates in real-time as symptoms selected
- Test: refine questions appear when top diagnoses are close

### Existing Test Preservation
- Test: all 165+ existing Plant Doctor assertions still pass after extraction
- Test: SYMPTOMS entries all have id, label, region, group
- Test: SCORING keys match valid diagnosis IDs
- Test: REFINE_RULES conditions reference valid diagnoses

### Integration Tests
- Test: "Create follow-up reminder" generates task in task engine
- Test: diagnosis saved to plant's diagnosis history
- Test: outcome tracking records resolved/ongoing/worsened

### XSS Tests
- Test: user notes containing `<script>` tags are safely escaped in result display
- Test: custom strain names containing HTML are safely rendered

---

## Section 15: Knowledge Base

### Content Tests
- Test: all knowledge articles have Layer 1 (action text)
- Test: all articles with evidence claims have Layer 2 (evidence level)
- Test: myth-busting articles include source citations
- Test: internal links reference valid article IDs

### Search/Filter Tests
- Test: searching by keyword returns relevant articles
- Test: filtering by topic returns correct subset
- Test: empty search returns all articles

---

## Section 16: Strain Database

### Database Integrity Tests
- Test: all strains have required fields (name, flowerWeeks)
- Test: flowerWeeks.min <= flowerWeeks.max for all entries
- Test: stretchRatio values are in plausible range (1.0-5.0)
- Test: no duplicate strain IDs

### Strain Picker Tests
- Test: lazy-loading imports database on first open (not at startup)
- Test: search filters results correctly (case-insensitive)
- Test: debounce prevents excessive filtering (not tested directly, but no jank)
- Test: selecting a strain populates plant's strainId
- Test: adding custom strain creates entry in localStorage

---

## Section 17: Stealth Audit (Preservation)

### Integration Tests
- Test: Stealth Audit tool is accessible from Tools section
- Test: Stealth Audit's own localStorage key continues to work independently

---

## Section 18: Settings & Data Management

### Profile Edit Tests
- Test: changing medium updates profile and recalculates tasks
- Test: changing priority stars updates all recommendations
- Test: storage usage indicator shows reasonable percentage

### Finish Grow Tests
- Test: finishing a grow creates archive entry with summary
- Test: finishing a grow clears active grow data
- Test: finishing a grow preserves outcome database
- Test: archived grow summary has correct total days and stage durations
- Test: after finishing, dashboard enters between-grows state

---

## Section 19: Existing Code Migration

### Migration Tests
- Test: existing Plant Doctor localStorage data is imported correctly
- Test: existing cure tracker data maps to companion dry/cure stages
- Test: existing env dashboard last inputs are imported
- Test: migration preserves original keys as backup
- Test: migration flag prevents re-running
- Test: corrupted migration falls back gracefully (error recovery screen)
