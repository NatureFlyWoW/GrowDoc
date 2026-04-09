# Section 13: Training Planner

## Overview

The training planner lets users select a plant training method and receive a generated schedule of milestones tailored to their plants' current stage and growth timeline. Each training method has impact ratings (yield, quality, terpenes), difficulty level, and a detailed description. When a method is selected, the planner generates milestones (e.g., "Top at node 5", "Start LST", "Defoliation day 21") that integrate directly with the task engine to produce actionable tasks on the dashboard at the appropriate times.

**Tech stack:** Vanilla JS (ES modules). Training method data lives in a static data module. The planner view renders at `/grow/training`. Milestone data is stored per-plant in `grow.plants[i].training`.

---

## Dependencies

- **Section 02 (Store/Storage):** Training selections and milestones are stored in `grow.plants[i].training` in the reactive store.
- **Section 04 (Grow Knowledge):** Stage duration data from `grow-knowledge.js` and stage rules inform when milestones should trigger.
- **Section 07 (Stage Timeline):** Stage definitions and the current stage/day-in-stage values drive milestone trigger timing. Milestones are displayed on the timeline as overlay markers.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/data/training-protocols.js` | Training method definitions: descriptions, impact ratings, difficulty, milestone templates |
| `/js/views/training.js` | Training planner view: method selector, descriptions, milestone list (route: `/grow/training`) |

---

## Tests (Implement First)

### Method Selection Tests

- **Correct milestones generated:** selecting method generates correct milestones
- **Top + LST milestones:** "Top + LST" generates topping milestone, LST milestone, defoliation milestone
- **No training milestones:** "No training" generates no milestones
- **Method change replaces milestones:** changing method replaces all milestones

### Task Integration Tests

- **Milestones create tasks:** training milestones create tasks in task engine at trigger day
- **Task completion marks milestone:** completing a training task marks the milestone as completed

---

## Implementation Details

### training-protocols.js (Data Module)

Contains all training method definitions with their milestone schedules.

**Signature:**

```javascript
// training-protocols.js

/**
 * TRAINING_METHODS[methodId] = {
 *   name: String,              // Display name
 *   description: String,       // 2-3 sentence description of the technique
 *   impactRatings: {
 *     yield: Number,           // 1-5 star impact on yield
 *     quality: Number,         // 1-5 star impact on quality
 *     terpenes: Number         // 1-5 star impact on terpene profile
 *   },
 *   difficulty: String,        // 'beginner' | 'intermediate' | 'advanced'
 *   milestones: [{
 *     id: String,              // Unique milestone identifier
 *     name: String,            // Display name (e.g., "Top at node 5")
 *     triggerStage: String,    // Stage ID when this milestone activates
 *     triggerDayInStage: Number, // Day within the stage for activation
 *     taskTemplate: {          // Template for task generation
 *       type: String,          // 'train'
 *       title: String,
 *       detail: {
 *         beginner: String,    // Detailed instructions for beginners
 *         intermediate: String,
 *         expert: String
 *       },
 *       evidence: String       // Evidence level
 *     }
 *   }]
 * }
 */
export const TRAINING_METHODS = { /* ... */ };
```

**Training method definitions:**

**None (no training):**
- `id: 'none'`
- Description: "No active training. Plants grow naturally. Suitable for autoflowers or growers who prefer a hands-off approach."
- Impact: yield 2, quality 3, terpenes 3
- Difficulty: beginner
- Milestones: empty array

**LST only (Low Stress Training):**
- `id: 'lst'`
- Description: "Bend and tie branches to create an even canopy without cutting the plant. Reduces height, increases light exposure to lower branches, and can significantly improve yield."
- Impact: yield 4, quality 3, terpenes 3
- Difficulty: beginner
- Milestones:
  - "Start LST" -- early-veg, day 7-10 (when plant has 4-5 nodes)
  - "Continue LST adjustments" -- late-veg, day 1 (ongoing)
  - "Final LST adjustments" -- transition, day 7 (before stretch ends)

**Top + LST:**
- `id: 'top-lst'`
- Description: "Remove the top growth tip (topping) to create two main colas, then use LST to spread the canopy. The most popular method for indoor growers -- combines the benefits of both techniques."
- Impact: yield 5, quality 4, terpenes 3
- Difficulty: intermediate
- Milestones:
  - "Start LST" -- early-veg, day 7 (when plant has 4-5 nodes)
  - "Top at node 5" -- early-veg, day 9-12 (1-2 days after initial LST, when growing vigorously)
  - "Resume LST after recovery" -- early-veg, day 14 (3-5 days after topping for recovery)
  - "Continue LST -- spread new tops" -- late-veg, day 1 (ongoing)
  - "Final canopy adjustments" -- transition, day 7
  - "Lollipop bottom 1/3" -- early-flower, day 3 (remove lower growth after stretch starts)
  - "Defoliation day 21" -- mid-flower, day 0 (strategic fan leaf removal)

**Mainline (manifold):**
- `id: 'mainline'`
- Description: "Systematic topping and training to create 8 or 16 perfectly even colas from a single stem. Creates extremely uniform canopy but requires extra veg time. Best for photoperiod plants with extended veg."
- Impact: yield 5, quality 5, terpenes 4
- Difficulty: advanced
- Milestones:
  - "First top at node 3" -- early-veg, day 10
  - "Remove lower growth" -- early-veg, day 12
  - "Second top (4 tops)" -- early-veg, day 20
  - "Third top (8 tops)" -- late-veg, day 7 (optional -- for 16-cola manifold)
  - "Train branches to even canopy" -- late-veg, day 14
  - "Lollipop and defoliate" -- early-flower, day 3
  - "Defoliation day 21" -- mid-flower, day 0

**ScrOG (Screen of Green):**
- `id: 'scrog'`
- Description: "Install a horizontal screen/net above the plants and weave branches through it to create a perfectly flat, even canopy. Maximizes light distribution across all bud sites. Requires a physical screen."
- Impact: yield 5, quality 4, terpenes 3
- Difficulty: intermediate
- Milestones:
  - "Install screen at canopy height" -- early-veg, day 14
  - "Start tucking branches under screen" -- late-veg, day 1
  - "Continue tucking -- fill screen to 70%" -- late-veg, day 14
  - "Flip to flower when screen 70-80% full" -- late-veg, day 21 (or when ready)
  - "Final tuck during stretch" -- transition, day 7
  - "Remove undergrowth below screen" -- early-flower, day 3
  - "Defoliation day 21" -- mid-flower, day 0

**Lollipop only:**
- `id: 'lollipop'`
- Description: "Remove all lower branches and foliage from the bottom third of the plant, directing energy to top colas. Simple technique that improves airflow and focuses growth. Often combined with other methods."
- Impact: yield 3, quality 4, terpenes 4
- Difficulty: beginner
- Milestones:
  - "Lollipop bottom 1/3" -- transition, day 7 (or early-flower, day 1-3)
  - "Clean up any new lower growth" -- early-flower, day 7
  - "Defoliation day 21" -- mid-flower, day 0

### Milestone Generation Logic

When a user selects a training method, milestones are generated based on the method's milestone templates and the plant's current stage.

```javascript
/**
 * generateMilestones(methodId, plant) -- Creates milestone instances for a plant.
 *   Reads the method's milestone templates from TRAINING_METHODS.
 *   For each template, calculates the target date based on the plant's current
 *   stage, stageStartDate, and the milestone's triggerStage + triggerDayInStage.
 *
 *   Returns: [{
 *     id: String,           // milestone template ID + plant ID
 *     name: String,         // display name
 *     targetDate: String,   // calculated ISO date for when this should happen
 *     completed: Boolean,   // initially false
 *     completedDate: String // null until completed
 *   }]
 *
 *   Milestones whose triggerStage is before the plant's current stage are
 *   marked as "skipped" (not generated as tasks, shown as gray in the list).
 */
export function generateMilestones(methodId, plant) { /* ... */ }
```

**Target date calculation:**

For each milestone, the target date is calculated by:
1. Find the milestone's `triggerStage` in the stage order
2. If the plant is already past that stage, mark the milestone as skipped
3. If the plant is in that stage, target date = `stageStartDate + triggerDayInStage`
4. If the plant has not reached that stage yet, estimate based on typical stage durations from `stage-rules.js`

### training.js (View)

The training planner view at `/grow/training`.

**Signature:**

```javascript
// training.js

/**
 * renderTrainingView(container, store) -- Training planner view.
 *   Shows method selector, descriptions, impact ratings, and milestone list.
 */
export function renderTrainingView(container, store) { /* ... */ }
```

**Method selector:**

A set of selectable cards, one per training method. Each card shows:
- Method name
- 2-3 sentence description
- Impact ratings as mini star displays: Yield (green stars), Quality (gold stars), Terpenes (purple stars)
- Difficulty badge: Beginner (green), Intermediate (gold), Advanced (red)
- Currently selected method has a highlighted border

If multiple plants exist, a plant selector dropdown above the method cards determines which plant's training is being configured. Each plant has independent training settings.

**Milestone list:**

After selecting a method, a timeline-style list of milestones appears below:
- Each milestone as a card with: name, target date (or "estimated" if future stage), status icon
- Completed milestones: green checkmark, strike-through text, completion date
- Pending milestones: open circle, target date
- Skipped milestones (stage already passed): gray, "Skipped -- stage already complete"
- Active milestone (trigger conditions met): highlighted with accent color, "Ready now" badge

**Integration with task engine:**

When the training view or dashboard renders, the task engine (section 08) calls `evaluateTrainingTriggers()`. For each plant with a training method set, this function:
1. Reads `plant.training.milestones[]`
2. For each milestone where `completed === false` and the plant's current stage + day-in-stage matches the trigger conditions, generates a training task
3. The task uses the milestone's `taskTemplate` for title and experience-level detail
4. When the user marks a training task as "Done" in the dashboard, the corresponding milestone's `completed` flag is set to `true` and `completedDate` is recorded

**Changing methods:**

If the user changes the training method after milestones were already generated:
- Show a confirmation: "Changing training method will replace all milestones. Already-completed milestones will be preserved in log history. Continue?"
- On confirm: clear current milestones from `plant.training.milestones[]`, generate new milestones for the selected method
- Completed milestone records remain in the plant's log history (as training log entries)

---

## Implementation Checklist

1. Write method selection tests (correct milestones for each method, Top + LST specifics, no-training empty)
2. Write method change test (changing method replaces all milestones)
3. Write task integration tests (milestones create tasks at trigger day, completing task marks milestone)
4. Create `/js/data/training-protocols.js` with `TRAINING_METHODS` data
5. Define all 6 training methods with names, descriptions, impact ratings, difficulty levels
6. Define milestone templates for each method with triggerStage, triggerDayInStage, taskTemplate
7. Write experience-level detail variants for each milestone's taskTemplate
8. Implement `generateMilestones()` function with target date calculation
9. Handle milestone skipping for stages already passed
10. Handle estimated dates for milestones in future stages
11. Create `/js/views/training.js` with `renderTrainingView()`
12. Implement method selector cards with descriptions, impact ratings, difficulty badges
13. Implement plant selector dropdown for multi-plant grows
14. Implement milestone list with status icons (completed/pending/skipped/active)
15. Implement milestone target date display
16. Implement method change flow with confirmation dialog
17. Wire milestone completion to task engine (evaluateTrainingTriggers reads milestones)
18. Wire task Done action to milestone completed flag
19. Run all training planner tests and verify passing
20. Test milestone generation for each training method
21. Test task integration flow (select method -> milestone triggers -> task appears -> mark done -> milestone completed)
22. Test method change flow (select Top + LST, complete a milestone, change to ScrOG, verify new milestones)
