# Section 18: Settings and Data Management

## Overview

This section builds the Settings view where users can edit their grow profile, adjust priorities with live preview, configure UI preferences, monitor storage usage, and execute the Finish Grow flow to archive a completed grow cycle. The Settings page is the central hub for all user configuration and data management operations.

**Route:** `/settings` (profile and preferences) and `/finish` (Finish Grow flow).

**Tech stack:** Vanilla JS (ES modules). All data managed through the companion's store and localStorage abstraction.

---

## Dependencies

- **Section 02 (Store/Storage):** All settings are persisted through the store's `commit()` pattern and saved to localStorage via `storage.save()`. The `checkCapacity()` function from storage.js powers the storage usage indicator. The `exportAll()` function powers the data export feature.

## Blocks

This section does not block any other section. It can be built in parallel with sections 09-17.

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `/js/views/settings.js` | Settings view with profile editor, priority editor, preferences, data management |

### Existing Files Used

| File | Purpose |
|------|---------|
| `/js/store.js` | Reactive store -- settings changes committed here |
| `/js/storage.js` | Storage abstraction -- checkCapacity(), exportAll(), clearArchive() |
| `/js/components/star-rating.js` | Star rating component (from Section 06 priority system) |
| `/js/data/priority-engine.js` | Weight calculations for live preview (from Section 06) |

---

## Tests (Implement First)

### Profile Edit Tests

- **Medium change propagates:** changing the growing medium in settings updates `store.state.profile.medium` and triggers task engine recalculation (tasks are regenerated with medium-appropriate advice)
- **Priority change propagates:** changing priority star ratings in settings updates `store.state.profile.priorities` and recalculates all recommendation targets (DLI, EC, VPD, harvest window recommendations all shift)
- **Storage usage indicator:** the storage usage indicator shows a reasonable percentage value (between 0% and 100%) that reflects actual localStorage usage via `checkCapacity()`

### Finish Grow Tests

- **Archive created:** finishing a grow creates an entry in `store.state.archive` with a summary object containing startDate, endDate, totalDays, medium, lighting, strains, priorities, diagnosisCount, and treatmentSuccessRate
- **Active grow cleared:** finishing a grow clears `store.state.grow` (plants, tasks, stage history are removed from active state)
- **Outcomes preserved:** finishing a grow does NOT clear the `store.state.outcomes` array -- the treatment success database persists across grows
- **Summary accuracy:** the archived grow summary has correct `totalDays` (calculated from grow startDate to finish date) and accurate stage durations (summed from stageHistory entries)
- **Between-grows state:** after finishing a grow, the dashboard enters between-grows state (shows "Start New Grow" prompt, disables My Grow sidebar items)

### Data Management Tests

- **Export produces valid JSON:** `exportAll()` returns a valid JSON string containing all `growdoc-companion-*` keys
- **Capacity warning:** when storage usage exceeds 80%, a warning banner becomes visible in the settings view

---

## Implementation Details

### Settings View Layout

The settings view is divided into clearly labeled sections, each accessible by scrolling or via anchor links.

```javascript
/**
 * settings.js
 *
 * renderSettingsView(container, store) -- Main settings view. Renders:
 *   1. Profile section -- edit all grow setup fields
 *   2. Priority section -- star rating editor with live preview
 *   3. Preferences section -- UI customization options
 *   4. Data section -- storage usage, export, archive management
 *   5. About section -- version, credits
 *
 * Each section is a collapsible card that expands when clicked/tapped.
 */
```

### Profile Section

Allows editing all fields originally set during onboarding. Changes take effect immediately and propagate through the store.

**Editable fields:**
- Growing medium (Soil / Coco / Hydro / Soilless) -- dropdown select
- Lighting type (LED / HPS / CFL / Fluorescent) -- dropdown select
- Light wattage (optional) -- number input
- Light PPFD (optional) -- number input
- Grow space dimensions (L x W x H in cm) -- three number inputs
- Experience level (First Grow / Beginner / Intermediate / Advanced / Expert) -- radio group
- Photoperiod hours -- number input (default 18 for veg, 12 for flower)

**On change behavior:**

Each field change:
1. Updates the corresponding property in `store.state.profile` via `commit()`
2. Triggers a `profile:updated` event on the store's event bus
3. The task engine (if active grow exists) recalculates tasks based on new profile values
4. The environment view updates target ranges
5. The feeding schedule updates EC/pH recommendations

**Validation rules:**
- Wattage must be positive number or empty
- PPFD must be between 0 and 2000 or empty
- Space dimensions must be positive numbers or empty
- Photoperiod must be between 0 and 24

```javascript
/**
 * renderProfileSection(container, store) -- Render the profile editing form.
 *   Pre-populates all fields from store.state.profile.
 *   On field change: validate, commit to store, show brief "Saved" indicator.
 *   Invalid inputs show inline error messages and do not commit.
 */
```

### Priority Section

Uses the star-rating component from Section 06 to allow editing the four priority dimensions, with a live preview of how changes affect recommendations.

**Layout:**
- Four star-rating rows: Yield (green), Quality (gold), Terpenes (purple), Effect (indigo)
- Each row shows the current star count (1-5) with clickable stars
- If Effect >= 3 stars, the target effect selector dropdown appears below (energetic / relaxing / creative / pain-relief / anti-anxiety / sleep)
- Below the stars: a live preview panel

**Live preview panel:**

When any star rating changes, the preview panel immediately recalculates and displays:
- Calculated weights (e.g., "Yield: 33%, Quality: 20%, Terpenes: 33%, Effect: 13%")
- Key parameter shifts:
  - DLI target range for current stage (higher yield priority = higher DLI)
  - EC target range for current stage/medium (higher yield = higher EC)
  - Harvest window recommendation (higher terpene priority = earlier harvest)
  - Temperature recommendation (higher terpene priority = lower temps)
- Trade-off note: a sentence explaining what the current balance emphasizes and what it de-emphasizes (e.g., "Prioritizing terpenes and quality: lower EC targets, cooler temps, earlier harvest. Yield may be 10-15% lower than maximum potential.")

```javascript
/**
 * renderPrioritySection(container, store) -- Render the priority editor.
 *   Uses star-rating.js component for each dimension.
 *   On change: commit to store, recalculate weights via priority-engine.js,
 *   update the live preview panel.
 *
 * renderPriorityPreview(container, priorities, stage, medium) -- Render
 *   the live preview showing how current priorities affect recommendations.
 *   Reads blended targets from priority-engine.js.
 */
```

### Preferences Section

UI customization options that are saved to `store.state.ui`.

**Options:**
- Sidebar default state: Expanded / Collapsed -- radio buttons. Sets the initial sidebar state on page load.
- Any additional UI preferences added in the future

```javascript
/**
 * renderPreferencesSection(container, store) -- Render UI preference controls.
 *   On change: commit to store.state.ui, apply immediately.
 */
```

### Data Section

Storage monitoring and data management tools.

**Storage usage indicator:**

A visual bar showing estimated localStorage usage as a percentage of the ~5MB browser limit.

- The bar fills proportionally (e.g., 40% full = bar 40% wide)
- Color: green (0-60%), gold (60-80%), red (80-100%)
- Text: "Storage: 1.2 MB of ~5 MB used (24%)"
- At 80%+: a persistent warning banner appears: "Storage is getting full. Consider archiving old grows or exporting your data."
- The percentage is calculated by `storage.checkCapacity()` which sums the `.length` of all localStorage values

**Data management buttons:**

- **Export All Data:** Calls `storage.exportAll()`, creates a JSON blob, triggers a browser download with filename `growdoc-backup-YYYY-MM-DD.json`. Includes all `growdoc-companion-*` keys.
- **Archive Old Grows:** If archived grows exist, shows a list with "Delete" option per archived grow. Deleting an archived grow removes it from `store.state.archive` and frees storage space.
- **Clear All Data:** Dangerous action. Shows a confirmation dialog: "This will permanently delete all GrowDoc data including your current grow, archived grows, and treatment history. This cannot be undone." If confirmed: clears all `growdoc-companion-*` keys, reloads the app (which triggers the first-visit flow).

```javascript
/**
 * renderDataSection(container, store) -- Render storage management.
 *   Shows storage usage bar, export button, archive management, clear button.
 *
 * exportData(store) -- Aggregate all companion data into JSON and trigger
 *   browser download.
 *
 * clearAllData() -- Clear all growdoc-companion-* localStorage keys and
 *   reload the page. Requires user confirmation.
 */
```

### About Section

Static content displaying app information.

- App name: "GrowDoc Grow Companion"
- Version number (hardcoded string, updated manually with releases)
- Credits / attribution text
- Link to GitHub repository (if applicable)

### Finish Grow Flow

The Finish Grow flow is a separate route (`/finish`) that guides the user through archiving their completed grow.

**Flow steps:**

1. **Summary screen:** Display a read-only summary of the grow:
   - Total days (from `grow.startDate` to today)
   - Stage durations (from `grow.stageHistory`)
   - Number of plants
   - Strains used
   - Medium and lighting
   - Priority settings during grow
   - Number of diagnoses run
   - Treatment success rate (from `outcomes` where the grow's diagnoses are involved)

2. **Optional fields:**
   - Yield per plant (grams) -- number inputs, one per plant
   - Overall grow rating (1-5 stars) -- uses star-rating component
   - Final notes -- textarea for freeform reflection

3. **Confirmation:** "Archive this grow and start fresh?" with two buttons:
   - "Finish & Archive" -- executes the archive
   - "Cancel" -- returns to dashboard

**Archive execution:**

When "Finish & Archive" is clicked:

1. Build the archive summary object:
   ```javascript
   // Shape of archive entry (in store.state.archive[])
   {
     id: 'grow-uuid',
     summary: {
       startDate: '2025-12-01',
       endDate: '2026-04-08',
       totalDays: 129,
       medium: 'soil',
       lighting: 'led',
       strains: ['Blue Dream', 'Northern Lights'],
       priorities: { yield: 3, quality: 5, terpenes: 4, effect: 2 },
       yieldGrams: 280,           // optional, from user input
       rating: 4,                 // optional, from user input
       notes: 'Great grow...',    // optional, from user input
       diagnosisCount: 3,
       treatmentSuccessRate: 0.67 // 2 of 3 resolved
     }
   }
   ```

2. Commit the archive entry to `store.state.archive` (append to array)

3. Clear the active grow: set `store.state.grow` to its empty/default state (no plants, no tasks, no stage history, no grow ID)

4. Preserve `store.state.outcomes` -- the treatment success database is NOT cleared. It accumulates across all grows.

5. Preserve `store.state.profile` -- the user's setup does not change when finishing a grow

6. Navigate to `/dashboard` which will now be in between-grows state

```javascript
/**
 * renderFinishGrowView(container, store) -- Render the Finish Grow flow.
 *   Step 1: grow summary (read-only)
 *   Step 2: optional yield/rating/notes inputs
 *   Step 3: confirmation with archive/cancel buttons
 *
 * buildArchiveSummary(store) -- Compute the archive summary object from
 *   current grow data. Calculates totalDays, diagnosisCount,
 *   treatmentSuccessRate.
 *
 * executeArchive(store, summary) -- Commit archive entry, clear active
 *   grow, navigate to dashboard.
 */
```

### XSS Considerations

All user-editable text fields in settings (notes, plant names via profile) must be sanitized:
- Text rendered via `textContent` property (not `innerHTML`) wherever possible
- Any user text that must appear in an HTML template string passes through `escapeHtml()` first
- The final notes textarea in Finish Grow is sanitized before being stored in the archive summary

---

## Implementation Checklist

1. Write profile edit tests (medium change triggers recalculation, priority change propagates, storage indicator shows valid percentage)
2. Write Finish Grow tests (archive created with correct summary, active grow cleared, outcomes preserved, totalDays correct, dashboard enters between-grows state)
3. Write data management tests (export produces valid JSON, capacity warning at 80%)
4. Implement `renderSettingsView()` with collapsible section cards
5. Implement profile section with all editable fields and validation
6. Wire profile field changes to store commits and `profile:updated` event
7. Implement priority section using star-rating component from Section 06
8. Implement live preview panel with weight calculations and parameter shift display
9. Wire Effect >= 3 threshold to show/hide target effect selector
10. Implement preferences section with sidebar default state option
11. Implement storage usage indicator with color-coded bar (green/gold/red)
12. Implement `exportData()` function (JSON aggregation + browser download trigger)
13. Implement archive management list with per-grow delete option
14. Implement `clearAllData()` with confirmation dialog
15. Implement About section with version and credits
16. Implement `renderFinishGrowView()` with summary, optional fields, and confirmation
17. Implement `buildArchiveSummary()` to compute totalDays, diagnosisCount, treatmentSuccessRate
18. Implement `executeArchive()` to commit archive, clear grow, navigate to dashboard
19. Ensure all user text is sanitized (escapeHtml / textContent)
20. Run all profile edit tests and verify passing
21. Run all Finish Grow tests and verify passing
22. Run data management tests and verify passing
23. Test end-to-end: change medium -> verify tasks update, change priorities -> verify preview updates, finish grow -> verify archive + between-grows state
