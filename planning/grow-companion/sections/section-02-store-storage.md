# Section 02: Store, Storage & Data Migration

## Overview

This section builds the reactive state management system (Proxy-based store with pub/sub), the localStorage abstraction layer with versioning and migration support, and the event bus for loosely coupled component communication. This is the data backbone that every other feature section depends on.

**Tech stack:** Vanilla JS (ES modules). No external state management library. Uses JavaScript Proxy for reactivity and EventTarget for the event bus.

---

## Dependencies

- **Section 01 (App Shell):** The store and storage are initialized in `main.js`, which is part of the app shell.

## Blocks

- Sections 03-19 all depend on the store and storage being functional.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/store.js` | Centralized reactive state with Proxy, dispatch/commit pattern, pub/sub |
| `/js/storage.js` | localStorage abstraction with versioning, migration, quota handling |

---

## Tests (Implement First)

### Store Tests

- **commit() updates state:** `commit()` updates state and notifies subscribers
- **subscribe() receives changes:** `subscribe()` receives correct path and new value on state change
- **dispatch() runs action:** `dispatch()` runs action function then commits mutation
- **Immutable pattern enforcement:** deep mutations via direct property access do NOT trigger subscribers (enforces immutable pattern)
- **Event bus emits/receives:** event bus emits and receives namespaced events
- **Multiple subscribers:** multiple subscribers on same path all fire

### Storage Tests

- **Round-trip integrity:** `save()`/`load()` round-trip preserves data integrity
- **Missing key handling:** `load()` returns null for missing keys (not crash)
- **Corrupted JSON handling:** `load()` returns null for corrupted JSON (not crash)
- **Sequential migration:** `migrate()` runs sequential version functions (v1->v2->v3)
- **No unnecessary migration:** `migrate()` does not run if version is current
- **Capacity check:** `checkCapacity()` returns reasonable percentage estimate
- **Quota handling:** `save()` handles QuotaExceededError gracefully (does not throw)

### Migration Tests

- **Plant Doctor key migration:** existing `growdoc-plant-doctor` key is migrated to companion format
- **Grow profile key import:** existing `growdoc-grow-profile` key imports medium/lighting
- **Migration flag:** migration flag prevents double migration
- **Failure safety:** migration failure leaves old data intact

---

## Implementation Details

### store.js — Reactive State Management

The store uses a Proxy-based reactive pattern with an immutable commit approach. This is the single source of truth for all app state.

**Mutation strategy (critical):** All state changes MUST go through `commit()`, which replaces entire sub-trees of state. The Proxy wraps only the top-level `state` object. Direct deep mutations like `store.state.grow.plants[0].logs.push(x)` are forbidden because the top-level Proxy cannot detect them. Instead: read the sub-tree, modify a copy, then `commit('updatePlantLogs', {plantId, logs: [...oldLogs, newLog]})`. This immutable-style approach is simpler to debug and avoids subtle reactivity bugs.

**Flow:**

```
User Action
  -> store.dispatch('actionName', payload)
  -> Action function runs business logic
  -> store.commit('mutationName', newData)  // replaces sub-tree, NOT deep mutation
  -> Proxy intercepts state assignment
  -> store.publish('stateChange', {path, oldVal, newVal})
  -> Subscribed view functions re-render
  -> storage.save(stateSlice) persists to localStorage
```

**Signature:**

```javascript
// store.js

/**
 * createStore(initialState) -> store instance
 * 
 * store.state          — Proxy-wrapped state object (read-only access recommended)
 * store.commit(path, value)  — Replace a sub-tree of state, triggers subscribers
 * store.dispatch(action, payload) — Run an action function that may commit mutations
 * store.subscribe(path, callback) — Register a callback for changes at a given path
 * store.unsubscribe(path, callback) — Remove a subscription
 * store.publish(eventName, data)   — Emit a namespaced event via event bus
 * store.on(eventName, callback)    — Listen for a namespaced event
 * store.off(eventName, callback)   — Remove an event listener
 */
export function createStore(initialState) { /* ... */ }
```

**Event bus:** Built on `EventTarget` for loosely coupled component communication. Namespaced events include:

- `plant:updated` — a plant's data changed
- `task:generated` — new tasks were created
- `stage:changed` — a plant's growth stage changed
- `env:logged` — new environment reading was logged
- `profile:updated` — grow profile was modified
- `grow:finished` — active grow was archived
- `grow:started` — new grow was initialized

**State shape:**

```javascript
{
  profile: {
    version: Number,
    medium: String,       // 'soil' | 'coco' | 'hydro' | 'soilless'
    lighting: String,     // 'led' | 'hps' | 'cfl' | 'fluorescent'
    lightWattage: Number, // optional
    lightPPFD: Number,    // optional
    spaceL: Number,       // cm
    spaceW: Number,
    spaceH: Number,
    experience: String,   // 'first-grow' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
    priorities: {
      yield: Number,      // 1-5
      quality: Number,    // 1-5
      terpenes: Number,   // 1-5
      effect: Number      // 1-5
    },
    targetEffect: String, // 'energetic' | 'relaxing' | 'creative' | 'pain-relief' | 'anti-anxiety' | 'sleep' | null
    photoperiodHours: Number // default 18 for veg, 12 for flower
  },

  grow: {
    id: String,
    startDate: String,    // ISO date
    currentStage: String, // stage ID
    stageHistory: [{stage, startDate, endDate}],
    plants: [{
      id: String,
      name: String,
      strainId: String,   // reference to strain database
      strainCustom: {},   // if custom strain
      potSize: Number,    // liters
      stage: String,      // per-plant stage (can differ)
      stageStartDate: String,
      logs: [{
        id: String,
        timestamp: String,
        type: String,     // 'watered' | 'fed' | 'trained' | 'observed'
        details: {},      // adaptive: {pH, ec, volume, nutrients, notes}
        taskRef: String   // reference to completed task, if any
      }],
      diagnoses: [{
        id: String,
        timestamp: String,
        diagnosisId: String,
        confidence: Number,
        treatment: String,
        followUpTaskId: String,
        outcome: String   // 'pending' | 'resolved' | 'ongoing' | 'worsened'
      }],
      training: {
        method: String,   // 'none' | 'lst' | 'top-lst' | 'mainline' | 'scrog' | 'lollipop'
        milestones: [{id, name, targetDate, completed, completedDate}]
      }
    }],
    tasks: [{
      id: String,
      plantId: String,
      type: String,       // 'water' | 'feed' | 'train' | 'defoliate' | 'check' | 'harvest' | 'custom'
      priority: String,   // 'urgent' | 'recommended' | 'optional'
      title: String,
      detail: {},         // experience-level-specific: {beginner, intermediate, expert}
      evidence: String,   // 'established' | 'promising' | 'speculative' | 'practitioner'
      status: String,     // 'pending' | 'done' | 'dismissed' | 'snoozed'
      snoozeUntil: String,
      notes: String,
      generatedDate: String,
      completedDate: String
    }]
  },

  environment: {
    readings: [{
      date: String,
      tempHigh: Number,
      tempLow: Number,
      rhHigh: Number,
      rhLow: Number,
      vpdDay: Number,     // calculated
      vpdNight: Number    // calculated
    }]
  },

  archive: [{
    id: String,
    summary: {
      startDate: String,
      endDate: String,
      totalDays: Number,
      medium: String,
      lighting: String,
      strains: [String],
      priorities: {},
      yieldGrams: Number,
      rating: Number,
      notes: String,
      diagnosisCount: Number,
      treatmentSuccessRate: Number
    }
  }],

  outcomes: [{
    diagnosisId: String,
    treatment: String,
    medium: String,
    resolved: Boolean,
    daysToResolve: Number
  }],

  ui: {
    sidebarCollapsed: Boolean,
    currentView: String,
    currentPlantId: String
  }
}
```

### storage.js — localStorage Abstraction

Manages all persistence to localStorage with versioning, migration, capacity monitoring, and error recovery.

**Storage key mapping:**

```javascript
const STORAGE_KEYS = {
  profile:     'growdoc-companion-profile',
  grow:        'growdoc-companion-grow',
  environment: 'growdoc-companion-environment',
  archive:     'growdoc-companion-archive',
  outcomes:    'growdoc-companion-outcomes',
  ui:          'growdoc-companion-ui',
  migrated:    'growdoc-companion-migrated',
};
```

**Signature:**

```javascript
// storage.js

/**
 * save(key, data) — JSON.stringify + setItem, with try-catch for QuotaExceededError.
 *   On quota error: (1) attempt compaction, (2) archive old tasks, (3) show warning banner.
 *   Returns true on success, false on failure.
 *
 * load(key) — getItem + JSON.parse, returns null if missing or corrupted JSON.
 *   Logs warning to console on parse failure (never crashes).
 *
 * migrate(key, data) — Run sequential version functions based on data.version.
 *   Each migration function takes old data and returns new data with incremented version.
 *   Does not run if version is already current.
 *
 * checkCapacity() — Returns {used: Number, total: Number, percentage: Number}.
 *   Estimated by iterating all keys and summing string lengths.
 *   Warns UI at 80% capacity.
 *
 * exportAll() — Returns combined JSON object of all growdoc-companion-* keys.
 *   Used by error recovery screen and settings data export.
 *
 * clearArchive() — Remove oldest archived grows to free space.
 */
export function save(key, data) { /* ... */ }
export function load(key) { /* ... */ }
export function migrate(key, data) { /* ... */ }
export function checkCapacity() { /* ... */ }
export function exportAll() { /* ... */ }
export function clearArchive() { /* ... */ }
```

### localStorage Size Budget

Estimated sizes for a typical grow (3 plants, 120 days, daily logging):

| Key | Typical Size | Power User Max | Notes |
|-----|-------------|----------------|-------|
| Profile | ~500B | ~1KB | Static, small |
| Active Grow (plants + logs + tasks) | ~800KB | ~1.5MB | 3 plants x 120 days x 2 logs/day |
| Environment readings | ~200KB | ~400KB | 120 daily readings x ~1.5KB each |
| Archive (summaries only) | ~5KB/grow | ~50KB | 10 archived grows at 5KB each |
| Outcomes | ~10KB | ~30KB | Treatment success database |
| UI preferences | ~200B | ~500B | Sidebar state, view preferences |
| **Total estimate** | **~1MB** | **~2MB** | Well within 5MB limit |

### Compaction Strategy

Environment readings older than 30 days are aggregated from daily to weekly (keep weekly averages, discard individual days). This reduces env data by ~75% over time. Compaction runs automatically when `checkCapacity()` reports >70%.

### Quota-Exceeded Handling

When `save()` catches a `QuotaExceededError`:
1. Attempt compaction of environment readings
2. If still over, attempt archiving the oldest completed tasks
3. If still over, show a persistent warning banner: "Storage full. Please archive or export your data."

The current data is NOT lost -- only the latest save failed. The app continues to function with the last successfully saved state.

### Migration Strategy

Each localStorage key has a `version` field. At startup, `storage.load()` detects version mismatches and runs migration functions sequentially. Old version data is never deleted until migration succeeds.

If migration throws an error, the app falls back to fresh state and shows a recovery screen with:
- "Restore old data" option that reverts to pre-migration backup
- "Start fresh" option
- Attempt to export current data as JSON download before any destructive action

**Initial migration from existing tools:** On first companion load, check for existing localStorage keys from the standalone tools:
- `growdoc-plant-doctor` -> extract plant data, journal entries, grow profile
- `growdoc-grow-profile` -> import medium, lighting settings
- `growdoc-plants` -> import plant names and dates
- `growdoc-cure-tracker` -> import into companion dry/cure stage data
- `growdoc-env-dashboard` -> import last inputs

Migration runs once, sets a `growdoc-companion-migrated` flag. Old keys are preserved (not deleted) as backup.

---

## Implementation Checklist

1. Write store tests (commit, subscribe, dispatch, immutable enforcement, event bus, multiple subscribers)
2. Write storage tests (round-trip, missing key, corrupted JSON, sequential migration, capacity check, quota handling)
3. Write migration tests (Plant Doctor key migration, grow profile import, migration flag, failure safety)
4. Implement `store.js`: Proxy-based state, commit pattern, subscribe/unsubscribe, dispatch, event bus via EventTarget
5. Implement `storage.js`: save/load with error handling, migrate with version detection, checkCapacity, exportAll, clearArchive
6. Define STORAGE_KEYS constant mapping
7. Implement compaction logic for environment readings
8. Implement initial migration from existing tool localStorage keys
9. Wire storage into the store (auto-save on commit, load on init) via `main.js`
10. Run all store tests and verify passing
11. Run all storage tests and verify passing
12. Run migration tests against mock data simulating existing Plant Doctor/cure tracker keys
