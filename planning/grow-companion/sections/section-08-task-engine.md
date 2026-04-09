# Section 08: Task Engine

## Overview

The task engine is the core intelligence layer of the Grow Companion. It generates dynamic, per-plant, context-aware task recommendations by analyzing: plant stage, days since last water/feed/check, growing medium, lighting, pot size, user priorities, experience level, training plan, recent diagnoses, environment readings, and strain data.

Tasks are generated on demand (when the dashboard or task list renders) and stored in `grow.tasks[]`. The engine produces three experience-level detail variants per task. Priority weights from the user's star ratings influence target values, task text, and trade-off notes.

**Tech stack:** Vanilla JS (ES modules). The task engine is a pure logic module with no DOM rendering -- it produces task objects that the dashboard and task-card components consume.

---

## Dependencies

- **Section 02 (Store/Storage):** Tasks are stored in `grow.tasks[]` in the reactive store. The engine reads plant data, profile data, and environment data from the store.
- **Section 04 (Grow Knowledge):** VPD targets, DLI targets, nutrient targets, watering frequency rules, and temperature differentials are sourced from `grow-knowledge.js`.
- **Section 06 (Priority System):** The priority engine provides blended targets based on star ratings, which the task engine uses to adjust all recommendations.
- **Section 07 (Stage Timeline):** Stage rules and transitions from `stage-rules.js` drive stage-based task triggers.

## Blocks

- **Section 09 (Dashboard):** The dashboard renders task cards produced by this engine.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/components/task-engine.js` | Core task generation logic: all trigger types, experience adaptation, deduplication |
| `/js/components/task-card.js` | Individual task card rendering with action buttons (done/dismiss/snooze/notes) |

---

## Tests (Implement First)

### Time-Based Trigger Tests

- **Soil watering interval:** watering task generated after correct interval for soil/3L pot
- **Coco flower watering:** watering task generated daily for coco in flower
- **Soil feeding frequency:** feeding task generated every other watering for soil
- **Check-in reminder:** check-in task generated after 3 days with no log
- **No duplicates:** no duplicate tasks generated for same trigger

### Stage-Based Trigger Tests

- **Stage transition suggestion:** stage transition suggestion at typical duration
- **Defoliation tasks:** defoliation task on day 1 and day 21 of flower
- **Harvest check:** harvest check task in late flower
- **Cure burp reminders:** cure burp reminders match cure week frequency

### Experience Adaptation Tests

- **Beginner detail:** beginner detail includes specific pH/EC numbers
- **Intermediate detail:** intermediate detail includes ranges
- **Expert detail:** expert detail is brief action item
- **Level switching:** switching experience level changes task detail rendering

### Priority Integration Tests

- **Yield priority DLI:** yield priority generates higher DLI target recommendations
- **Terpene priority temp:** terpene priority generates lower temperature recommendations
- **Trade-off notes:** trade-off notes appear on priority-adjusted tasks

---

## Implementation Details

### task-engine.js (Core Logic Module)

The task engine reads data from the store and produces task objects. It does not interact with the DOM.

**Input data (from store):**
- `profile.medium`, `profile.lighting`, `profile.experience`, `profile.priorities`, `profile.targetEffect`, `profile.photoperiodHours`
- `grow.plants[]` -- each plant's stage, stageStartDate, logs, diagnoses, training
- `grow.tasks[]` -- existing tasks (for deduplication)
- `environment.readings[]` -- recent environment data

**Signature:**

```javascript
// task-engine.js

/**
 * generateTasks(store) -- Main entry point. Reads current state from store,
 *   evaluates all trigger rules, deduplicates against existing tasks,
 *   returns array of new task objects to add.
 *
 * Returns: Task[] where each task has shape:
 *   {
 *     id: String,           // unique ID (generated)
 *     plantId: String,      // which plant this task is for
 *     type: String,         // 'water' | 'feed' | 'train' | 'defoliate' | 'check' | 'harvest' | 'custom'
 *     priority: String,     // 'urgent' | 'recommended' | 'optional'
 *     title: String,        // human-readable task title
 *     detail: {             // experience-level-specific content
 *       beginner: String,   // full numbers and explanations
 *       intermediate: String, // ranges with context
 *       expert: String      // brief action item
 *     },
 *     evidence: String,     // 'established' | 'promising' | 'speculative' | 'practitioner'
 *     status: 'pending',
 *     snoozeUntil: null,
 *     notes: '',
 *     generatedDate: String, // ISO date
 *     completedDate: null
 *   }
 */
export function generateTasks(store) { /* ... */ }

/**
 * evaluateTimeTriggers(plant, profile, existingTasks) -- Checks time-based rules.
 *   Returns task objects for watering, feeding, and check-in reminders.
 */
export function evaluateTimeTriggers(plant, profile, existingTasks) { /* ... */ }

/**
 * evaluateStageTriggers(plant, profile, existingTasks) -- Checks stage-based rules.
 *   Returns task objects for stage transitions, defoliation, harvest checks, cure burps.
 */
export function evaluateStageTriggers(plant, profile, existingTasks) { /* ... */ }

/**
 * evaluateTrainingTriggers(plant, existingTasks) -- Checks training plan milestones.
 *   Returns task objects when milestone trigger conditions are met.
 */
export function evaluateTrainingTriggers(plant, existingTasks) { /* ... */ }

/**
 * evaluateDiagnosisTriggers(plant, existingTasks) -- Checks for follow-up reminders.
 *   Returns task objects for diagnosis follow-ups at 3-5 day intervals.
 */
export function evaluateDiagnosisTriggers(plant, existingTasks) { /* ... */ }

/**
 * evaluateEnvironmentTriggers(envReadings, profile, existingTasks) -- Checks env data.
 *   Returns task objects when VPD or conditions are outside optimal range.
 */
export function evaluateEnvironmentTriggers(envReadings, profile, existingTasks) { /* ... */ }

/**
 * isDuplicate(newTask, existingTasks) -- Returns true if a task with the same
 *   plantId + type + trigger context already exists and is pending/snoozed.
 *   Prevents the engine from generating the same task repeatedly.
 */
export function isDuplicate(newTask, existingTasks) { /* ... */ }
```

### Task Generation Rules

**Time-based triggers:**

The engine calculates days since last action by examining the most recent log entry of each type for each plant.

- **Watering frequency** -- derived from medium, pot size, and stage using `WATERING_FREQUENCY` from `grow-knowledge.js`:
  - Soil: every 3-7 days (smaller pot or bigger plant = more frequent). A 3L pot in veg might be every 3-4 days; a 15L pot in early veg every 6-7 days.
  - Coco: daily in flower, every 1-2 days in veg.
  - Hydro: continuous (check reservoir every 2-3 days).
  - Task priority escalates from `optional` (1 day before due) to `recommended` (on due day) to `urgent` (1+ day overdue).

- **Feeding frequency** -- tied to watering:
  - Coco/Hydro: every watering (nutrient solution is the water).
  - Soil: every 2-3 waterings (alternate water-only and feed). The engine counts recent water logs to determine if the next watering should be a feed.

- **Check-in reminder:** If no log of any type exists for a plant in 3+ days, generate a "Check your plants" task with `urgent` priority.

**Stage-based triggers:**

- **Stage transition:** When `daysInStage >= STAGE_TRANSITIONS[currentStage].triggerDays`, generate a `recommended` task suggesting stage advancement with the confirm message from stage rules.
- **Defoliation window:** If plant stage is `early-flower` and day-in-stage is 0-2, generate "Light defoliation -- remove fan leaves blocking bud sites" task. At day 19-23 of flower (mid-flower), generate "Day 21 defoliation -- strategic fan leaf removal" task.
- **Lollipop window:** End of stretch (transition stage, days 7-14 or early-flower days 1-7): generate "Lollipop bottom 1/3 -- remove lower growth that won't reach the canopy" task.
- **Harvest check:** When stage is `late-flower` or `ripening`: generate "Start checking trichomes daily" task.
- **Cure burp reminders:** When stage is `curing`, generate burp tasks based on cure week:
  - Week 1: 3 reminders per day (morning, afternoon, evening)
  - Week 2: 1 reminder per day
  - Week 3-4: every 2-3 days
  - Week 5+: weekly check

**Training plan triggers:**

When a plant has a training method set (via Training Planner, section 13), the engine checks `training.milestones[]`. For each milestone that is not yet completed, if the plant's current stage and day-in-stage match the milestone's trigger conditions, generate a training task. The task title and detail come from the milestone's `taskTemplate` in `training-protocols.js`.

**Diagnosis follow-up triggers:**

If a plant has a diagnosis with `outcome === 'pending'` and a `followUpTaskId` was created, the engine generates follow-up check tasks at 3-5 day intervals (configurable). The task says "Check improvement: [diagnosis name] -- has the condition improved since treatment began [X days ago]?"

**Environment triggers:**

If the most recent environment reading shows VPD outside the optimal range for the current stage (from `VPD_TARGETS` in `grow-knowledge.js`), generate an environment adjustment task. The task includes specific recommendations:
- VPD too high: "Lower temperature or raise humidity"
- VPD too low: "Raise temperature or lower humidity"
- If 7-day moving average shows a consistent drift, escalate to `urgent` priority.

### Priority Adjustment

All target values (VPD, DLI, EC, pH, temperature) used in task generation are first processed through `priority-engine.js`:

1. The engine calls `calculateWeights(profile.priorities)` to get relative weights (e.g., `{yield: 0.33, quality: 0.20, terpenes: 0.33, effect: 0.13}`).
2. For each target parameter, the engine calls `blendTarget(parameterByPriority, weights)` which interpolates between priority-specific values.
3. When the blended target differs significantly from the default (equal-weight) target, a trade-off note is generated. Example: "Your terpene priority (5 stars) lowers the recommended DLI by 8% compared to a yield-focused approach. This preserves volatile terpenes at the cost of ~5% less weight."

Trade-off notes are stored in the task's `detail` object and displayed in Layer 2 (expandable) of the task card.

### Experience-Level Adaptation

Every task generates three detail variants:

- **Beginner (`detail.beginner`):** Full specific numbers, explanations of why. Example: "Water Plant 2 -- target pH 6.3, EC 1.4. In soil during mid-flower, aim for 20% runoff. If runoff EC is above 2.0, flush with plain pH'd water first."

- **Intermediate (`detail.intermediate`):** Ranges with context. Example: "Water Plant 2 -- pH 6.0-6.5, EC 1.2-1.6. Check runoff if plants show signs of salt buildup."

- **Expert (`detail.expert`):** Brief action item. Example: "Water due (soil, 5L, day 5)"

The dashboard selects which detail to display based on `profile.experience`:
- `first-grow` and `beginner` use `detail.beginner`
- `intermediate` uses `detail.intermediate`
- `advanced` and `expert` use `detail.expert`

### Deduplication

The `isDuplicate()` function prevents task spam. Before adding a new task, the engine checks existing tasks in `grow.tasks[]`:
- Match on `plantId` + `type` + a context key (e.g., "water-soil-day5")
- Only pending or snoozed tasks count as duplicates (done/dismissed tasks do not block new generation)
- Snoozed tasks are not regenerated until their `snoozeUntil` date has passed

### task-card.js (UI Component)

Renders a single task as an interactive card.

**Visual elements:**
- Plant name + task type icon (water droplet, nutrient bottle, scissors, magnifying glass, etc.)
- Task title text (experience-level selected)
- Priority badge: urgent (red), recommended (gold), optional (muted green)
- Evidence level badge (shown in expanded view): established (green), promising (blue), speculative (orange), practitioner (gray)
- Action buttons row: Done / Dismiss / Snooze / Notes

**Action handling:**
- **Done:** Sets `status = 'done'`, `completedDate = now`. If linked to a watering/feeding task, opens the quick log form (section 11) pre-filled for that action type.
- **Dismiss:** Sets `status = 'dismissed'`. No log created. The engine will not regenerate this specific task instance.
- **Snooze:** Sets `status = 'snoozed'`, `snoozeUntil = now + 1 day` (or user-selectable: 1 day, 3 days, 1 week). Task reappears after snooze period.
- **Notes:** Expands an inline text field. User can add notes that are saved to `task.notes`. Notes are sanitized via `escapeHtml` before rendering.

**Expandable detail (Layer 2):**
Click the task card to expand and show:
- The "why" explanation for this task
- Evidence level with badge
- Priority trade-off note (if applicable)
- Link to relevant knowledge base article (Layer 3)

**Signature:**

```javascript
// task-card.js

/**
 * renderTaskCard(container, task, options) -- Renders a task card.
 *   options.experienceLevel -- which detail variant to display
 *   options.onDone(taskId) -- callback when Done is clicked
 *   options.onDismiss(taskId) -- callback when Dismiss is clicked
 *   options.onSnooze(taskId, until) -- callback when Snooze is clicked
 *   options.onNotes(taskId, notes) -- callback when Notes are saved
 */
export function renderTaskCard(container, task, options) { /* ... */ }
```

### Custom Tasks

Users can create custom tasks via an "Add custom task" button on the dashboard. Custom tasks have:
- User-provided title (sanitized)
- Plant selector (or "All plants")
- Priority selector (urgent/recommended/optional)
- Optional note
- Type set to `'custom'`
- No evidence level or trade-off notes

Custom tasks behave identically to generated tasks for Done/Dismiss/Snooze/Notes actions.

---

## Implementation Checklist

1. Write time-based trigger tests (watering intervals for soil/coco/hydro, feeding frequency, check-in reminder, no duplicates)
2. Write stage-based trigger tests (transition suggestion, defoliation days 1 and 21, harvest check, cure burps)
3. Write experience adaptation tests (beginner/intermediate/expert detail content, level switching)
4. Write priority integration tests (yield DLI, terpene temp, trade-off notes)
5. Create `/js/components/task-engine.js` with `generateTasks()` entry point
6. Implement `evaluateTimeTriggers()` -- watering, feeding, check-in logic
7. Implement watering frequency calculation using `WATERING_FREQUENCY` from grow-knowledge.js
8. Implement feeding frequency logic (every watering for coco/hydro, every 2-3 for soil)
9. Implement `evaluateStageTriggers()` -- stage transition, defoliation, lollipop, harvest, cure burps
10. Implement `evaluateTrainingTriggers()` -- milestone checking against plant stage/day
11. Implement `evaluateDiagnosisTriggers()` -- follow-up task generation at intervals
12. Implement `evaluateEnvironmentTriggers()` -- VPD range checking, drift detection
13. Implement `isDuplicate()` deduplication logic
14. Implement experience-level detail generation (three variants per task)
15. Implement priority-adjusted target calculation using `priority-engine.js`
16. Implement trade-off note generation for priority-shifted targets
17. Create `/js/components/task-card.js` with `renderTaskCard()`
18. Implement task card rendering with priority badge, evidence badge, action buttons
19. Implement Done/Dismiss/Snooze/Notes action handlers
20. Implement expandable Layer 2 (why + evidence + trade-off)
21. Implement custom task creation form
22. Wire task generation to store events (`stage:changed`, `env:logged`, etc.)
23. Run all task engine tests and verify passing
24. Run all task card rendering tests and verify passing
