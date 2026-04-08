# Section 07: Stage Timeline

## Overview

This section builds the horizontal progress bar visualization for growth stages, the stage definitions with typical durations, the auto-advance system with confirmation prompts, per-plant stage tracking, milestone markers, and the full dry/cure stage logging system (absorbed from the standalone Cure Tracker tool).

The timeline is a central piece of the app -- it appears as a compact snapshot on the dashboard, as a full interactive bar in the My Grow view, and drives the task engine's stage-based triggers.

**Tech stack:** Vanilla JS (ES modules). The timeline bar is a DOM component. Stage rules are a pure data module.

---

## Dependencies

- **Section 02 (Store/Storage):** Stage data is persisted in `grow.plants[].stage`, `grow.plants[].stageStartDate`, and `grow.stageHistory`.
- **Section 04 (Grow Knowledge):** Stage rules reference VPD targets, DLI targets, and nutrient targets from the knowledge modules.

## Blocks

- **Section 08 (Task Engine):** Stage transitions trigger task recalculation. Stage-based triggers (defoliation, harvest check, cure burps) depend on stage rules.
- **Section 09 (Dashboard):** Dashboard displays the timeline snapshot widget.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/components/timeline-bar.js` | Horizontal progress bar visualization with stage segments and milestone markers |
| `/js/data/stage-rules.js` | Stage definitions, typical durations, transition logic, milestone triggers |

---

## Tests (Implement First)

The TDD plan refers to these as "Section 10: Growth Stage Timeline" in the test file.

### Timeline Rendering Tests

- **All stages rendered:** timeline renders all stages in correct order
- **Current stage marker:** current stage marker is positioned correctly
- **Milestone markers:** milestone markers appear at correct positions

### Stage Transition Tests

- **Auto-advance prompt:** auto-advance prompt appears at typical duration
- **Confirm advance:** confirming advance updates plant stage and stageStartDate
- **Decline advance:** declining advance does not change stage
- **Task recalculation:** stage change triggers task engine recalculation

---

## Implementation Details

### stage-rules.js (Data Module)

Defines the ordered list of growth stages, their typical durations, and transition rules.

**Stage definitions:**

```javascript
/**
 * STAGES — Ordered array of stage definitions.
 *
 * Each stage: {
 *   id: String,           // Unique stage identifier
 *   name: String,         // Display name
 *   typicalDays: Number,  // Typical duration in days
 *   minDays: Number,      // Minimum reasonable duration
 *   maxDays: Number,      // Maximum reasonable duration
 *   milestones: [{        // Key events within this stage
 *     id: String,
 *     name: String,
 *     triggerDay: Number,  // Day within the stage when this milestone occurs
 *     icon: String         // Icon identifier for the timeline marker
 *   }]
 * }
 *
 * Stage order:
 *   1. germination    — 3-7 days typical
 *   2. seedling       — 7-14 days typical
 *   3. early-veg      — 14-21 days typical
 *   4. late-veg       — 14-28 days typical
 *   5. transition     — 7-14 days typical (flip to 12/12, stretch period)
 *   6. early-flower   — 14-21 days typical (bud sites forming)
 *   7. mid-flower     — 14-21 days typical (bud development)
 *   8. late-flower    — 14-21 days typical (ripening begins)
 *   9. ripening       — 7-14 days typical (final swell, trichome maturation)
 *  10. drying         — 10-14 days typical
 *  11. curing         — 14-60+ days typical
 */
export const STAGES = [
  {
    id: 'germination',
    name: 'Germination',
    typicalDays: 5,
    minDays: 3,
    maxDays: 7,
    milestones: [
      { id: 'taproot', name: 'Taproot visible', triggerDay: 2, icon: 'sprout' }
    ]
  },
  // ... remaining stages
];
```

**Stage transitions:**

```javascript
/**
 * STAGE_TRANSITIONS[currentStageId] = {
 *   next: String,             // ID of the next stage
 *   triggerDays: Number,      // Days in current stage before suggesting transition
 *   confirmMessage: String    // Message shown in the auto-advance prompt
 * }
 *
 * Examples:
 *   'germination': { next: 'seedling', triggerDays: 5, confirmMessage: 'Seedling has emerged — move to Seedling stage?' }
 *   'seedling':    { next: 'early-veg', triggerDays: 10, confirmMessage: 'Plant has 3-4 true leaf sets — move to Early Veg?' }
 *   'late-veg':    { next: 'transition', triggerDays: 21, confirmMessage: 'Ready to flip to 12/12? Move to Transition (Stretch)?' }
 *   'transition':  { next: 'early-flower', triggerDays: 10, confirmMessage: 'Stretch is slowing — move to Early Flower?' }
 *   'ripening':    { next: 'drying', triggerDays: 10, confirmMessage: 'Ready to harvest? Move to Drying stage?' }
 *   'drying':      { next: 'curing', triggerDays: 12, confirmMessage: 'Branches snap cleanly — move to Curing stage?' }
 */
export const STAGE_TRANSITIONS = { /* ... */ };
```

**Milestones by stage (notable events for the timeline):**

Key milestones include:
- Germination: taproot visible
- Seedling: first true leaves
- Early Veg: 4-5 nodes (topping window)
- Late Veg: LST start, canopy filling
- Transition: flip to 12/12, stretch peak
- Early Flower: first pistils, bud site formation
- Mid Flower: bud swell, defoliation day 21
- Late Flower: trichome check begins, flush window (if applicable)
- Ripening: milky/amber assessment, harvest decision
- Drying: daily weight check, snap test
- Curing: burp schedule changes (3x/day -> 1x/day -> every 2-3 days)

### timeline-bar.js (Component)

A horizontal progress bar divided into stage segments, with the current position marked and milestone icons overlaid.

**Rendering:**

The timeline is a horizontal bar that spans the full available width. Each stage occupies a segment proportional to its typical duration relative to the total grow duration.

```
[Germ|Seedling|Early Veg|Late Veg|Trans|EarlyFl|MidFl|LateFl|Ripe|Dry|Cure]
                                    ^--- current position marker
```

**Visual elements:**
- Completed stages: filled with a muted green background
- Current stage: filled with accent green, brighter/highlighted
- Future stages: dimmed/unfilled background
- Current position marker: a vertical line or animated dot showing exact position within the current stage (based on days-in-stage / typical-days)
- Stage labels below each segment (truncated on small screens)
- Milestone markers: small icons overlaid at their trigger positions within stages

**Two rendering modes:**

1. **Compact mode (dashboard widget):** A thin bar (~20px height) with minimal labels. Click expands to full timeline in the My Grow view. Shows: current stage name, day count, and the bar itself.

2. **Full mode (My Grow view):** Taller bar (~60px) with stage labels, milestone icons, and a detail panel. Clicking a stage segment opens a panel below showing:
   - Stage name and typical duration
   - Recommended environment targets for that stage (VPD, temp, RH)
   - Recommended nutrient targets for that stage
   - Key milestones and their timing
   - "Move to this stage" button (if it is the next stage)

**Signature:**

```javascript
// timeline-bar.js

/**
 * renderTimeline(container, options) — Renders the timeline bar.
 *   options.stages      — Stage definitions array (from STAGES)
 *   options.currentStage — Current stage ID
 *   options.daysInStage  — Days elapsed in current stage
 *   options.stageHistory — Array of {stage, startDate, endDate} for completed stages
 *   options.milestones   — Completed milestone IDs
 *   options.mode         — 'compact' | 'full'
 *   options.onStageClick(stageId) — Callback when a stage segment is clicked (full mode)
 *   options.plantId      — Plant ID for per-plant timeline
 *
 * renderStageDetail(container, stageId) — Renders the detail panel for a stage.
 *   Shows environment targets, nutrient targets, milestones for the given stage.
 */
export function renderTimeline(container, options) { /* ... */ }
export function renderStageDetail(container, stageId) { /* ... */ }
```

### Auto-Advance System

When the days-in-stage for a plant reaches the `triggerDays` value from `STAGE_TRANSITIONS`, an inline prompt appears.

**Auto-advance flow:**
1. Each time the dashboard or My Grow view renders, check each plant's `daysInStage` against `STAGE_TRANSITIONS[currentStage].triggerDays`
2. If days >= triggerDays, show an inline prompt (not a modal) near the plant's timeline or task list
3. Prompt text: the `confirmMessage` from `STAGE_TRANSITIONS`
4. Two buttons: "Yes, advance" and "Not yet"
5. "Yes, advance":
   - Update `plant.stage` to the next stage
   - Update `plant.stageStartDate` to today
   - Add an entry to `grow.stageHistory` with the completed stage's start/end dates
   - Emit a `stage:changed` event via the store's event bus
   - This event triggers the task engine to recalculate tasks for the plant (new stage = new targets, new milestones, new watering frequency)
6. "Not yet": Dismiss the prompt. It reappears the next day (or on next view load if daysInStage still exceeds trigger).

**Manual advance:** A "Change Stage" button in the plant detail view allows manually setting any stage. This is useful for corrections or skipping stages (e.g., user forgot to advance from seedling to veg).

### Per-Plant Stage Tracking

Each plant tracks its own stage independently. In a multi-plant grow, one plant might be in late veg while another is already in transition (if planted at different times or if an autoflower moves faster).

The store shape for per-plant tracking:
- `grow.plants[i].stage` -- the plant's current stage ID
- `grow.plants[i].stageStartDate` -- ISO date when the plant entered this stage
- `grow.stageHistory` -- array of `{stage, startDate, endDate}` entries for the overall grow (main timeline reference)

The timeline component can render either the grow-level timeline or a per-plant timeline, depending on context.

### Dry/Cure Stages

When a plant enters the Drying or Curing stage, specialized logging and tracking become available. This replaces the standalone Cure Tracker tool by absorbing its functionality into the companion.

**Drying stage (/grow/dry-cure):**
- Daily log form with fields:
  - Temperature (room temp where plants are drying)
  - Relative Humidity (room RH)
  - Smell assessment dropdown: No smell / Faint / Moderate / Strong / Hay-like
  - Snap test checkbox: "Stems snap cleanly" (indicates drying complete)
- The view shows a log history table with all drying entries
- Target conditions displayed: 15-21C, 55-65% RH (adjustable by priority -- terpene priority prefers cooler/slower: 15-17C)
- When snap test is checked and conditions have been stable for 2+ days, suggest transition to Curing

**Curing stage:**
- Weekly log form with fields:
  - Jar RH (from hygrometer in jar)
  - Smell assessment dropdown: Hay / Grassy / Sweet / Floral / Dank / Pungent
  - Burp count today
- Burp reminders generated as tasks:
  - Week 1: 3 burps per day (morning, afternoon, evening)
  - Week 2: 1 burp per day
  - Week 3-4: every 2-3 days
  - Week 5+: weekly check
- Target jar RH: 58-62%
- If jar RH > 65%: "Too moist -- leave jars open for 30 minutes"
- If jar RH < 55%: "Too dry -- consider adding a humidity pack"
- Completion: when cure target duration is reached (minimum 2 weeks, recommended 4-8 weeks), prompt "Finish curing for [plant name]?"

**Signature for dry/cure views:**

```javascript
/**
 * renderDryCureView(container, store) — Main dry/cure tracking view.
 *   Shows the active plant(s) in drying or curing stage.
 *   Renders appropriate log form based on current stage.
 *   Displays log history and current conditions.
 */
export function renderDryCureView(container, store) { /* ... */ }
```

---

## Implementation Checklist

1. Write timeline rendering tests (all stages in order, current position, milestone positions)
2. Write stage transition tests (auto-advance prompt timing, confirm updates state, decline preserves state, stage change triggers recalculation)
3. Create `/js/data/stage-rules.js` with STAGES array and STAGE_TRANSITIONS map
4. Define all 11 stages with id, name, typicalDays, minDays, maxDays, milestones
5. Define all stage transitions with next stage, trigger days, confirm messages
6. Create `/js/components/timeline-bar.js` with compact and full rendering modes
7. Implement stage segment rendering proportional to typical duration
8. Implement current position marker based on days-in-stage
9. Implement milestone marker overlays
10. Implement stage detail panel (full mode) with environment/nutrient targets
11. Implement auto-advance prompt system (check days, show inline prompt, handle confirm/decline)
12. Implement manual stage change button
13. Implement per-plant stage tracking (each plant has independent stage/stageStartDate)
14. Implement drying stage log form and view (temp, RH, smell, snap test)
15. Implement curing stage log form and view (jar RH, smell, burp count)
16. Implement burp reminder schedule logic (3x/day -> 1x/day -> every 2-3 days -> weekly)
17. Implement cure completion prompt
18. Wire stage:changed event to the store's event bus
19. Run all timeline tests and verify passing
20. Run all stage transition tests and verify passing
21. Test compact mode rendering on dashboard (if section 09 is available)
22. Test dry/cure logging flow end to end
