# Section 11: Quick Log & Plant Management

## Overview

This section builds the plant list management, individual plant detail view, and per-plant quick logging system. Quick logging is the daily interaction loop: one-tap logging for routine actions (watered, fed, trained, observed) with adaptive detail that starts minimal and expands on demand. The "Same as last time" pre-fill for feeding makes daily logging frictionless. Days-since counters give at-a-glance status per plant.

**Tech stack:** Vanilla JS (ES modules). Plant data is stored in `grow.plants[]` in the reactive store. Log entries are stored per-plant in `grow.plants[i].logs[]`.

---

## Dependencies

- **Section 02 (Store/Storage):** Plant data and logs are stored in the reactive store and persisted to localStorage. The store's `commit()` pattern is used for all mutations.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/components/log-form.js` | Quick log form component with adaptive detail and "same as last time" pre-fill |
| `/js/views/my-grow.js` | My Grow hub: plant list cards with add/remove |
| `/js/views/plant-detail.js` | Single plant view: overview, log history, diagnoses, training tabs |

---

## Tests (Implement First)

### Plant CRUD Tests

- **Add plant:** adding a plant creates entry in grow.plants array
- **Name sanitization:** plant names are sanitized (escapeHtml) before storage
- **Delete plant:** deleting a plant removes it and its logs
- **Rename plant:** renaming a plant preserves all associated data

### Quick Log Tests

- **One-tap logging:** one-tap log creates entry with auto-timestamp
- **Expanded feed log:** expanded feed log captures pH, EC, volume
- **Same as last time:** "Same as last time" pre-fills from most recent feed log
- **Days-since update:** days-since counters update after new log
- **Note sanitization:** log notes are sanitized via escapeHtml before rendering

---

## Implementation Details

### my-grow.js (Plant List View)

The My Grow hub at `/grow` shows all plants as cards with key stats and provides add/remove functionality.

**Signature:**

```javascript
// my-grow.js

/**
 * renderMyGrow(container, store) -- My Grow hub view.
 *   Renders plant list cards, add plant button, grow overview.
 */
export function renderMyGrow(container, store) { /* ... */ }
```

**Plant list cards:**

Each plant is rendered as a card showing:
- Plant name (editable inline with pencil icon)
- Strain name (from strain database or custom)
- Current stage badge (color-coded to match timeline)
- Days in current stage
- Days since last water (calculated from logs)
- Days since last feed (calculated from logs)
- Quick action buttons: Water / Feed / Train / Observe (each opens quick log form)
- Click card body navigates to `/grow/plant/:id`

**Days-since calculation:**

For each log type (watered, fed, trained, observed), find the most recent log entry of that type and calculate the difference in days from today. Display as:
- "2d ago" for recent actions
- "5d ago" in gold text if approaching the expected interval
- "8d ago" in red text if significantly overdue

**Add plant button:**

"Add Plant" button at the bottom of the list. Opens an inline form:
- Plant name input (required, sanitized)
- Strain picker component (from section 05, or "Unknown" default)
- Pot size dropdown (1L through 20L+)
- Stage selector (defaults to the grow's current stage)
- Save button: creates a new plant entry in `grow.plants[]` with a generated unique ID

Plant limit: enforced at 20 plants maximum (from profile). If limit reached, the Add Plant button is disabled with a message.

**Remove plant:**

Each plant card has a small "remove" icon (trash/X). Clicking shows a confirmation: "Remove [plant name]? This will delete all logs and diagnosis history for this plant." Confirm removes the plant from `grow.plants[]` and all associated logs, diagnoses, and training data.

### plant-detail.js (Single Plant View)

The plant detail view at `/grow/plant/:id` provides comprehensive information and interaction for a single plant.

**Signature:**

```javascript
// plant-detail.js

/**
 * renderPlantDetail(container, store, plantId) -- Single plant detail view.
 *   Renders header, tabbed sections (Overview, Log History, Diagnoses, Training).
 */
export function renderPlantDetail(container, store, plantId) { /* ... */ }
```

**Header:**
- Plant name (editable -- click to edit, Enter to save, Escape to cancel)
- Strain info (name, breeder, flower weeks, type badge)
- Pot size
- Current stage badge with days-in-stage
- Quick log buttons row (Water / Feed / Train / Observe)

**Tab sections:**

1. **Overview tab:**
   - Current stats: days in stage, days since water/feed/train, last observation note
   - Active tasks for this plant (filtered from `grow.tasks[]`)
   - Mini timeline bar showing this plant's stage position
   - "Run Diagnosis" button navigating to Plant Doctor with this plant pre-selected

2. **Log History tab:**
   - Reverse-chronological list of all logs for this plant
   - Filter buttons: All / Watered / Fed / Trained / Observed
   - Each log entry shows: type icon, timestamp, details (pH, EC, volume, notes)
   - Log entries are read-only (no editing after creation)

3. **Diagnoses tab:**
   - List of all diagnoses for this plant from Plant Doctor
   - Each shows: diagnosis name, confidence, date, outcome status (pending/resolved/ongoing/worsened)
   - "Update outcome" button on pending diagnoses
   - Link to full diagnosis details

4. **Training tab:**
   - Current training method
   - Milestone list with completed/pending status
   - Link to Training Planner view (section 13)

### log-form.js (Quick Log Component)

The quick log form is the primary daily interaction component. It is accessible from dashboard task cards (completing a task), plant detail view, and My Grow plant cards.

**Signature:**

```javascript
// log-form.js

/**
 * renderLogForm(container, options) -- Renders the quick log form.
 *   options.plantId    -- Which plant this log is for
 *   options.logType    -- Pre-selected log type ('watered'|'fed'|'trained'|'observed') or null
 *   options.taskRef    -- Optional task ID (if logging from a task completion)
 *   options.onSubmit(logEntry) -- Callback when log is saved
 *   options.onCancel() -- Callback when form is dismissed
 *   options.store      -- Store reference for reading last log data
 */
export function renderLogForm(container, options) { /* ... */ }

/**
 * getLastLog(plant, logType) -- Returns the most recent log of the given type.
 *   Used for "Same as last time" pre-fill.
 */
export function getLastLog(plant, logType) { /* ... */ }
```

**Log type selector:**

Four buttons at the top: Watered / Fed / Trained / Observed. Each has an icon and label. Clicking one selects that type and shows the appropriate detail fields.

**Adaptive detail pattern:**

The form starts minimal -- selecting a log type and tapping "Log it" creates a minimal entry with just the type and auto-generated timestamp. For users who want more detail, expandable fields are available:

**Watered details (collapsed by default):**
- Volume (L) -- number input
- Runoff pH -- number input (step 0.1)
- Runoff EC -- number input (step 0.1)
- Notes -- textarea (sanitized)

**Fed details (collapsed by default):**
- pH in -- number input (step 0.1)
- EC in -- number input (step 0.1)
- Volume (L) -- number input
- "Same as last time?" toggle -- when enabled, pre-fills pH, EC, and volume from the most recent `fed` log for this plant. User can confirm with one tap or adjust values.
- Nutrient notes -- textarea (sanitized)

**Trained details (collapsed by default):**
- Action type dropdown: Topped / LST adjusted / Defoliated / Lollipoped / ScrOG tucked / Other
- Notes -- textarea (sanitized)

**Observed details (collapsed by default):**
- Condition dropdown: Healthy / Concern / Pest spotted / Deficiency noticed / Milestone reached / Other
- Notes -- textarea (sanitized)

**"Same as last time" pre-fill logic:**

For `fed` type logs, the form searches `plant.logs[]` in reverse chronological order for the most recent entry with `type === 'fed'`. If found, it pre-fills:
- `details.pH` into the pH input
- `details.ec` into the EC input
- `details.volume` into the volume input

A banner shows: "Pre-filled from your last feed on [date]. Tap 'Log it' to confirm or adjust values."

**Log entry shape:**

```javascript
{
  id: String,          // generated unique ID
  timestamp: String,   // ISO datetime
  type: String,        // 'watered' | 'fed' | 'trained' | 'observed'
  details: {           // varies by type
    pH: Number,        // watered/fed
    ec: Number,        // watered/fed
    volume: Number,    // watered/fed
    nutrients: String, // fed
    action: String,    // trained
    condition: String, // observed
    notes: String      // all types
  },
  taskRef: String      // reference to completed task, if any
}
```

**On submit:**
1. Create the log entry object
2. Sanitize all user-provided strings via `escapeHtml`
3. Commit to store: read current plant logs, append new entry, commit via `store.commit('updatePlantLogs', {plantId, logs: [...oldLogs, newLog]})`
4. If `taskRef` is set, update the referenced task status to `done` and set `completedDate`
5. Call `onSubmit` callback (allows the dashboard to re-render)

**Security:** All user-provided text (notes, nutrient names) is sanitized with `escapeHtml()` before storage and before any DOM rendering. The form uses `textContent` for rendering user data, not `innerHTML`.

### Days-Since Counters

A utility function calculates days since the last log of a given type for a plant.

```javascript
/**
 * daysSince(plant, logType) -- Returns number of days since the last log
 *   of the given type. Returns null if no logs of that type exist.
 */
export function daysSince(plant, logType) { /* ... */ }
```

This is used by:
- My Grow plant cards (display days since water/feed)
- Dashboard quick stats widget (section 09)
- Task engine (section 08) for determining watering/feeding intervals

---

## Implementation Checklist

1. Write plant CRUD tests (add, sanitize name, delete with logs, rename preserves data)
2. Write quick log tests (one-tap, expanded feed, same as last time, days-since, note sanitization)
3. Create `/js/views/my-grow.js` with `renderMyGrow()`
4. Implement plant list card rendering (name, strain, stage, days-since, quick actions)
5. Implement days-since calculation and display with color-coded urgency
6. Implement add plant form with name input, strain picker, pot size, stage
7. Implement plant limit enforcement (max 20)
8. Implement remove plant with confirmation dialog
9. Create `/js/views/plant-detail.js` with `renderPlantDetail()`
10. Implement plant detail header with editable name
11. Implement tab navigation (Overview, Log History, Diagnoses, Training)
12. Implement Overview tab with active tasks, mini timeline, stats
13. Implement Log History tab with reverse-chronological list and type filters
14. Implement Diagnoses tab with outcome tracking
15. Implement Training tab with milestone list
16. Create `/js/components/log-form.js` with `renderLogForm()`
17. Implement log type selector (4 buttons with icons)
18. Implement adaptive detail pattern (minimal default, expandable fields)
19. Implement watered detail fields (volume, pH, EC, notes)
20. Implement fed detail fields (pH, EC, volume, nutrients, notes)
21. Implement "Same as last time" pre-fill for fed logs
22. Implement trained detail fields (action dropdown, notes)
23. Implement observed detail fields (condition dropdown, notes)
24. Implement log entry creation with sanitization and store commit
25. Implement task completion linkage (taskRef updates task status)
26. Implement `daysSince()` utility function
27. Run all plant CRUD tests and verify passing
28. Run all quick log tests and verify passing
29. Test quick log flow end to end (tap Water -> expand details -> fill pH -> save -> verify in log history)
30. Test "Same as last time" pre-fill accuracy
