# Section 09: Dashboard (Today View)

## Overview

The dashboard is the main daily-use screen that answers two questions: "Is everything OK?" and "What should I do today?" It consists of three zones: a status banner (top), a per-plant task list (main content), and sidebar widgets (right column on desktop, below tasks on mobile). The dashboard also handles the between-grows state when no active grow exists.

**Tech stack:** Vanilla JS (ES modules). The dashboard is a view function that renders into the `<main id="content">` area. It consumes task objects from the task engine and integrates the VPD widget, timeline snapshot, and quick stats components.

---

## Dependencies

- **Section 02 (Store/Storage):** The dashboard reads all state from the reactive store -- profile, grow data, tasks, environment readings, archive.
- **Section 06 (Priority System):** Priority weights determine how task recommendations are tuned. Priority colors are used in UI elements.
- **Section 07 (Stage Timeline):** The compact timeline bar widget is rendered in the sidebar. Stage data drives the status banner day count.
- **Section 08 (Task Engine):** The dashboard triggers task generation and renders the resulting task cards. This is the primary consumer of the task engine output.

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `/js/views/dashboard.js` | Today view: status banner, task list, sidebar widgets, between-grows state |

Components consumed from other sections (not created here):
- `/js/components/task-card.js` (section 08) -- renders individual tasks
- `/js/components/task-engine.js` (section 08) -- generates tasks
- `/js/components/vpd-widget.js` (section 10) -- VPD calculator widget
- `/js/components/timeline-bar.js` (section 07) -- compact timeline bar

---

## Tests (Implement First)

### Status Banner Tests

- **Green banner:** green banner when no pending urgent tasks and recent log exists
- **Gold banner:** gold banner when recommended tasks are pending
- **Red banner:** red banner when urgent tasks exist or no log in 3+ days
- **Banner text:** banner text includes current stage and day count

### Between-Grows State Tests

- **Start New Grow:** dashboard shows "Start New Grow" when no active grow
- **Last grow summary:** dashboard shows last grow summary when archived grows exist
- **Disabled sidebar items:** disabled sidebar items show tooltip in between-grows state
- **Route redirect:** /grow/* routes redirect to /dashboard when no active grow

### Task Display Tests

- **Priority sorting:** tasks sorted by priority (urgent first)
- **Experience adaptation:** task cards show experience-level-appropriate detail
- **Action buttons:** done/dismiss/snooze/notes buttons render on each card

---

## Implementation Details

### dashboard.js (View Function)

The dashboard view function is called by the router when navigating to `/dashboard` or `/`. It renders the complete Today view.

**Signature:**

```javascript
// dashboard.js

/**
 * renderDashboard(container, store) -- Main dashboard view.
 *   Reads state from store, triggers task generation, renders all 3 zones.
 *   Handles both active-grow and between-grows states.
 */
export function renderDashboard(container, store) { /* ... */ }

/**
 * renderStatusBanner(container, store) -- Renders Zone 1.
 *   Determines status color and text based on task state, log recency, env drift.
 */
export function renderStatusBanner(container, store) { /* ... */ }

/**
 * renderTaskList(container, tasks, store) -- Renders Zone 2.
 *   Sorts tasks by priority, renders task cards, includes custom task button.
 */
export function renderTaskList(container, tasks, store) { /* ... */ }

/**
 * renderSidebarWidgets(container, store) -- Renders Zone 3.
 *   VPD widget, timeline snapshot, quick stats.
 */
export function renderSidebarWidgets(container, store) { /* ... */ }

/**
 * renderBetweenGrows(container, store) -- Renders between-grows dashboard.
 *   Shows welcome/summary banner, Start New Grow button, quick access links.
 */
export function renderBetweenGrows(container, store) { /* ... */ }
```

### Zone 1: Status Banner

A single full-width colored banner at the top of the dashboard showing grow status at a glance.

**Status determination logic:**

1. **Red (urgent):** Any of:
   - Pending tasks with `priority === 'urgent'`
   - No log of any type for any plant in 3+ days
   - Unresolved diagnosis follow-ups that are overdue
   - Environment reading with VPD critically outside range (>30% deviation)

2. **Gold (attention needed):** Any of:
   - Pending tasks with `priority === 'recommended'` but no urgent tasks
   - Environment reading borderline (10-30% deviation from target)
   - Stage transition suggestion pending

3. **Green (all good):** None of the above conditions met. Recent logs exist and all tasks are optional or completed.

**Banner text format:**
- Green: "All good -- Day 38, Week 6 Flower, [primary strain name]"
- Gold: "Action needed -- [most important recommended task summary]"
- Red: "Check plants -- [most urgent issue summary]"

The banner includes:
- Status icon (checkmark / warning / alert)
- Day count in current stage and overall grow day
- Current stage name
- Primary strain name (first plant's strain, or "Mixed strains" if multiple)

### Zone 2: Today's Tasks

The main content area showing per-plant task cards generated by the task engine.

**Task rendering flow:**
1. Call `generateTasks(store)` from task-engine.js to get new tasks
2. Merge with existing `grow.tasks[]` (commit new tasks to store)
3. Filter to pending and snoozed-but-past-due tasks
4. Sort by priority: urgent first, then recommended, then optional
5. Within each priority level, sort by plant name for grouping
6. Render each task using `renderTaskCard()` from task-card.js

**Experience-level display:** The dashboard reads `profile.experience` and passes it to task card rendering so each card shows the appropriate detail level (beginner gets full numbers, expert gets brief items).

**Custom task button:** An "Add custom task" button at the bottom of the task list opens an inline form:
- Title input (required, sanitized with escapeHtml)
- Plant selector dropdown (all plants + "All plants" option)
- Priority selector (urgent/recommended/optional)
- Notes textarea (optional, sanitized)
- Save button commits the custom task to the store

**Empty state:** If no tasks are pending, show a positive message: "Nothing to do right now. Your plants are on track!" with a suggestion to log observations or check the knowledge base.

### Zone 3: Sidebar Widgets

On desktop (>768px), these render as a right column alongside the task list. On mobile, they stack below the tasks.

**VPD Widget:**
- Compact card showing: current VPD value, status text (Optimal / High / Low), timestamp of last reading
- Color-coded border: green (optimal), gold (borderline), red (out of range)
- "Update" button reveals inline temp/RH inputs
- On submit: calculates VPD, stores reading, updates widget
- "Full view" link navigates to `/grow/environment`
- This widget is rendered by `vpd-widget.js` from section 10

**Timeline Snapshot:**
- Compact horizontal progress bar (`timeline-bar.js` in compact mode from section 07)
- Shows current stage name, day X of typical Y
- Click navigates to full timeline in My Grow view

**Quick Stats:**
- Days in current stage
- Days since last water (per plant, show the most overdue)
- Days since last feed (per plant, show the most overdue)
- Storage usage: "Using X% of available storage" (from `storage.checkCapacity()`)
- If storage > 80%, show warning text in gold

### Between-Grows State

When `grow` is null or has no active grow ID, the dashboard switches to a completely different layout.

**Zone 1: Welcome/Summary Banner**
- If `archive[]` has entries: "Your last grow finished X days ago. [strain], [total days], [rating] stars."
- If no archive: "Welcome to GrowDoc. Set up your first grow to get started."

**Zone 2: Actions**
- Prominent "Start New Grow" button styled as a large call-to-action. Routes to `/setup` (onboarding wizard).
- If archived grows exist: summary card of the last grow showing setup details (medium, lighting, strains), duration, number of diagnoses, treatment success rate, optional yield and rating.
- "Browse Knowledge Base" link for pre-grow research.

**Zone 3: Quick Access**
- Knowledge Base link (browsable without an active grow)
- Stealth Audit tool link (accessible without an active grow)
- Settings link

**Sidebar behavior in between-grows state:** The sidebar component (section 01) disables My Grow sub-items (plants, training, environment, harvest, feeding, journal, dry-cure). They appear grayed out. Clicking a disabled item shows a tooltip: "Start a grow to access this feature." Only Today, Tools, Knowledge Base, and Settings remain active.

**Route guarding:** All `/grow/*` routes check for an active grow. If none exists, redirect to `/dashboard`. This is enforced in the router (section 01) but the dashboard provides the appropriate landing content.

### Task Lifecycle Management

The dashboard manages the full task lifecycle through user interactions:

1. **Task generation:** On each render, call the task engine to check for new tasks
2. **Display:** Render pending tasks sorted by priority
3. **User action:** Done/Dismiss/Snooze/Notes via task card buttons
4. **State update:** Action commits status change to store, triggers re-render
5. **Archival:** Completed and dismissed tasks remain in `grow.tasks[]` but are filtered out of the active display. They serve as history and prevent duplicate generation.

Snoozed tasks disappear from the list until `snoozeUntil` date passes. On each render, the dashboard checks for snoozed tasks whose snooze period has expired and resets them to `pending`.

---

## Implementation Checklist

1. Write status banner tests (green/gold/red conditions, banner text with stage and day count)
2. Write between-grows state tests (Start New Grow button, last grow summary, disabled sidebar, route redirect)
3. Write task display tests (priority sorting, experience-level detail, action buttons)
4. Create `/js/views/dashboard.js` with `renderDashboard()` entry point
5. Implement `renderStatusBanner()` with status determination logic (red/gold/green)
6. Implement banner text generation with day count, stage name, strain name
7. Implement `renderTaskList()` with task generation, sorting, and rendering
8. Wire task card action callbacks (Done/Dismiss/Snooze/Notes) to store commits
9. Implement custom task creation form with sanitized inputs
10. Implement empty state message when no tasks are pending
11. Implement `renderSidebarWidgets()` container with responsive layout (right column desktop, stacked mobile)
12. Integrate VPD widget (from section 10's vpd-widget.js)
13. Integrate timeline snapshot (from section 07's timeline-bar.js in compact mode)
14. Implement quick stats display (days in stage, days since water/feed, storage usage)
15. Implement storage usage warning at 80% threshold
16. Implement `renderBetweenGrows()` for no-active-grow state
17. Implement welcome/summary banner for between-grows
18. Implement "Start New Grow" call-to-action button routing to /setup
19. Implement archived grow summary card
20. Implement snoozed task expiry checking on each render
21. Implement responsive layout (3-column desktop, stacked mobile)
22. Run all dashboard tests and verify passing
23. Test between-grows flow end to end (no grow -> Start New Grow -> onboarding)
24. Test task lifecycle (generate -> display -> done/dismiss/snooze -> re-render)
