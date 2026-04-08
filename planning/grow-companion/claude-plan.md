# GrowDoc Grow Companion — Implementation Plan

## Overview

GrowDoc is a cannabis cultivation companion web app that transforms a diagnostic-only tool (Plant Doctor v3) into a proactive daily assistant. The app dynamically generates personalized cultivation advice based on each grower's setup (medium, lights, space), experience level, growth stage, and priorities (yield, quality, terpenes, effect).

**Tech stack:** Vanilla JS (ES modules), HTML5, CSS3 with custom properties. No framework, no build step, no npm. All data in localStorage. Deployed on Vercel via auto-deploy on push to main.

**Note on priority system:** The original spec mentioned "slider-based" priorities. This was superseded during the stakeholder interview (Q29) to **1-5 star ratings** per priority dimension. Stars are simpler UI, and the app calculates relative weights internally.

**Current state:** A working Plant Doctor v3 (6,400 lines) with 44 diagnoses, 42 symptoms, 166 advice rules, and a note-aware context engine. Plus standalone tools (VPD calculator, cure tracker, stealth audit) and 14 guide documents. All loaded via an iframe-based doc viewer (`app.js` + `index.html`).

**Target state:** A single-page companion app with sidebar navigation, integrated dashboard, per-plant task engine, environment tracking, training planner, harvest advisor, unified Plant Doctor, contextual knowledge base, and a 500+ strain database. The iframe doc viewer is replaced entirely.

---

## Architecture

### File Structure

```
/
  index.html                    # Companion app shell (replaces current doc viewer)
  landing.html                  # First-visit landing page
  style.css                     # Global styles + design system variables
  
  /js
    main.js                     # App entry: routing, init, sidebar
    store.js                    # Centralized state (Proxy + Pub/Sub)
    router.js                   # History API client-side routing
    storage.js                  # localStorage abstraction + migration
    utils.js                    # Shared helpers (escapeHtml, formatDate, etc.)
    
    /views
      dashboard.js              # Today view: status, tasks, VPD widget, timeline
      my-grow.js                # My Grow hub: plants, timeline, training, journal
      plant-detail.js           # Single plant view: logs, stage, diagnosis history
      tools.js                  # Tools section: Plant Doctor, Stealth Audit
      knowledge.js              # Knowledge Base browser
      onboarding.js             # Setup wizard flow
      settings.js               # Profile editing, data management, preferences
      
    /components
      sidebar.js                # Collapsible sidebar navigation
      task-card.js              # Individual task with actions (done/dismiss/snooze/notes)
      task-engine.js            # Task generation logic
      vpd-widget.js             # Inline VPD calculator/status
      timeline-bar.js           # Horizontal progress bar with stage markers
      star-rating.js            # 1-5 star priority input
      trichome-sliders.js       # Three linked sliders (clear/milky/amber = 100%)
      env-chart.js              # Simple trend line chart for temp/RH/VPD over time
      log-form.js               # Quick log form with adaptive detail
      strain-picker.js          # Strain database search/select component
      disclosure.js             # Three-layer expandable content component
      
    /data
      grow-knowledge.js         # Franco's protocols: VPD tables, DLI targets, nutrient ratios
      priority-engine.js        # Priority-weighted recommendation calculations
      strain-database.js        # 500+ strain data entries
      stage-rules.js            # Stage transition logic, typical durations, milestone triggers
      training-protocols.js     # Training method schedules and milestones
      harvest-advisor.js        # Trichome → recommendation logic by priority
      feeding-calculator.js     # EC/pH/NPK targets by medium, stage, priority
      myths-data.js             # Myth-busting content with evidence citations
      evidence-data.js          # Evidence level classifications for all recommendations
      
    /plant-doctor
      doctor-engine.js          # Unified diagnostic flow (replaces 3-mode system)
      doctor-data.js            # Existing SYMPTOMS, SCORING, REFINE_RULES (evolved)
      doctor-ui.js              # Diagnostic UI rendering
      note-context.js           # Note-aware engine (from v3)
      
  /css
    variables.css               # Design system: colors, typography, spacing
    layout.css                  # Sidebar, main content area, responsive grid
    components.css              # Reusable component styles
    dashboard.css               # Dashboard-specific styles
    onboarding.css              # Setup wizard styles
    plant-doctor.css            # Diagnostic tool styles
    
  /assets
    icons.svg                   # SVG icon sprite (sidebar nav, task types, etc.)
    
  /api                          # Keep existing Vercel functions for now (future removal)
    login.js
    state.js
    save.js
    _lib/
    
  /legacy                       # Archive current app.js, admin files
    app.js
    admin.html
    admin.js
    admin.css
```

### State Management

The app uses a centralized reactive store built on JavaScript Proxy. All state changes flow through the store, which notifies subscribers to re-render affected views.

**Mutation strategy (important):** All state changes MUST go through `commit()`, which replaces entire sub-trees of state. No deep Proxy nesting — the Proxy wraps only the top-level `state` object. Direct deep mutations like `store.state.grow.plants[0].logs.push(x)` are forbidden because the top-level Proxy cannot detect them. Instead: read the sub-tree, modify a copy, then `commit('updatePlantLogs', {plantId, logs: [...oldLogs, newLog]})`. This immutable-style approach is simpler to debug and avoids subtle reactivity bugs.

```
User Action
  → store.dispatch('actionName', payload)
  → Action function runs business logic
  → store.commit('mutationName', newData)  // replaces sub-tree, NOT deep mutation
  → Proxy intercepts state assignment
  → store.publish('stateChange', {path, oldVal, newVal})
  → Subscribed view functions re-render
  → storage.save(stateSlice) persists to localStorage
```

**Store shape:**

```javascript
// store.js - State shape (type definition, not implementation)
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
        followUpTaskId: String, // if user opted in
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
      detail: {},         // experience-level-specific content
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
      yieldGrams: Number, // optional
      rating: Number,     // 1-5
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

### localStorage Abstraction

```javascript
// storage.js - Interface (not implementation)
/**
 * save(key, data) — JSON.stringify + setItem, with try-catch for quota
 * load(key) — getItem + JSON.parse, returns null if missing/corrupt
 * migrate(key, data) — Run sequential migrations based on data.version
 * checkCapacity() — Returns {used, total, percentage}. Warns UI at 80%.
 * exportAll() — Returns combined JSON of all growdoc-companion-* keys
 * clearArchive() — Remove oldest archived grows to free space
 */
```

**Migration strategy:** Each localStorage key has a `version` field. At startup, `storage.load()` detects version mismatches and runs migration functions sequentially. Old version data is never deleted until migration succeeds. If migration throws an error, the app falls back to fresh state and shows a recovery screen with: (a) "Restore old data" option that reverts to pre-migration backup, (b) "Start fresh" option, and (c) attempt to export current data as JSON download before any destructive action.

### localStorage Size Budget

Estimated sizes for a typical grow (3 plants, 120 days, daily logging):

| Key | Typical Size | Power User Max | Notes |
|-----|-------------|----------------|-------|
| Profile | ~500B | ~1KB | Static, small |
| Active Grow (plants + logs + tasks) | ~800KB | ~1.5MB | 3 plants × 120 days × 2 logs/day |
| Environment readings | ~200KB | ~400KB | 120 daily readings × ~1.5KB each |
| Archive (summaries only) | ~5KB/grow | ~50KB | 10 archived grows at 5KB each |
| Outcomes | ~10KB | ~30KB | Treatment success database |
| UI preferences | ~200B | ~500B | Sidebar state, view preferences |
| **Total estimate** | ~1MB | ~2MB | Well within 5MB limit |

**Compaction strategy:** Environment readings older than 30 days are aggregated from daily to weekly (keep weekly averages, discard individual days). This reduces env data by ~75% over time. Compaction runs automatically when `checkCapacity()` reports >70%.

**Quota-exceeded handling:** When `save()` catches a `QuotaExceededError`: (1) attempt compaction of environment readings, (2) if still over, attempt archiving the oldest completed tasks, (3) if still over, show a persistent warning banner: "Storage full. Please archive or export your data." The current data is NOT lost — only the latest save failed. The app continues to function with the last successfully saved state.

### Vercel SPA Routing Configuration

The `vercel.json` must be updated to support History API routing. Without SPA rewrites, refreshing the browser on any route other than `/` will return a 404 from Vercel.

```json
// vercel.json - Add rewrites for SPA routing
{
  "rewrites": [
    { "source": "/((?!api|legacy|assets|css|js|docs).*)", "destination": "/index.html" }
  ]
}
```

The rewrite excludes: `/api/*` (Vercel serverless functions, kept for now), `/legacy/*` (archived old app), `/assets/*`, `/css/*`, `/js/*` (static files), and `/docs/*` (existing tool HTML files used by iframe embeds like Stealth Audit).

### Client-Side Routing

```javascript
// router.js - Route definitions (not implementation)
/**
 * Routes:
 *   /                    → landing page (if no profile) or dashboard
 *   /setup               → onboarding wizard
 *   /dashboard           → Today view (task list, VPD widget, timeline)
 *   /grow                → My Grow hub (plants, timeline overview)
 *   /grow/plant/:id      → Single plant detail
 *   /grow/training       → Training planner
 *   /grow/environment    → Environment logging + trends
 *   /grow/harvest        → Harvest window advisor
 *   /grow/feeding        → Feeding schedule view
 *   /grow/journal        → Grow journal / log history
 *   /grow/dry-cure       → Drying/curing tracker (stage-specific)
 *   /tools/doctor        → Plant Doctor (unified flow)
 *   /tools/stealth       → Stealth Audit (existing, embedded)
 *   /knowledge           → Knowledge Base browser
 *   /knowledge/myths     → Myth-busting section
 *   /settings            → Profile editing, preferences, data management
 *   /finish              → Finish Grow flow
 * 
 * Uses History API (pushState). No hash routing.
 * Route changes trigger view function swap in main content area.
 * Sidebar highlights active section.
 */
```

---

## Section 1: App Shell, Sidebar & Routing

**What to build:** The foundational HTML shell, CSS design system, collapsible sidebar, and client-side router.

### index.html
- Minimal HTML: `<nav id="sidebar">` + `<main id="content">` + `<script type="module" src="/js/main.js">`
- Google Fonts link for DM Serif Display, Source Serif 4, IBM Plex Mono — append `&display=swap` to prevent invisible text on slow connections
- Fallback font stacks must be robust: `'DM Serif Display', Georgia, 'Times New Roman', serif` etc.
- Meta viewport for responsive

### CSS Design System (variables.css)
Define all custom properties from the spec: colors (bg, text, accent, priority, evidence, status), typography (serif, body, mono), spacing scale (4px base), border-radius, transitions.

### Sidebar (sidebar.js)
- Renders nav items: Today, My Grow (with sub-items), Tools, Knowledge Base, Settings
- Collapse/expand toggle button at bottom
- Collapsed state: icons only (~60px). Expanded: icons + labels (~220px)
- Active section highlighted with accent color
- State persisted in `ui.sidebarCollapsed`
- ARIA attributes for accessibility

### Router (router.js)
- Define route-to-view-function mapping
- Intercept `<a>` clicks for internal navigation (pushState)
- Listen to `popstate` for back/forward
- On route change: call the matched view function, which renders into `<main id="content">`
- First visit detection: if no profile in localStorage, redirect to `/` (landing) or `/setup`

### main.js (entry point)
- Import store, router, storage, sidebar
- On DOMContentLoaded: load state from localStorage, initialize store, render sidebar, route to current URL
- Register global error handler for uncaught errors (see Error Recovery below)

### Security: XSS Mitigation

All user-provided strings (plant names, strain names, task notes, log notes, journal entries, Plant Doctor free-text notes) MUST be sanitized before DOM insertion. Rules:
- Use `textContent` for rendering user data into the DOM (not `innerHTML`)
- Use `innerHTML` only for trusted template strings that contain no user data
- When user data must appear inside an HTML template string, always pass it through `escapeHtml()` first
- The `escapeHtml()` utility escapes `<`, `>`, `&`, `"`, `'` characters
- This is enforced by convention and verified in tests (test that user strings with `<script>` tags are rendered safely)

### Accessibility

- **Focus management:** On every route change, focus the main content area heading (`<h1>` or first focusable element). Prevents focus from being lost in the sidebar after navigation.
- **Keyboard operability:** All interactive elements (buttons, star ratings, sliders, task cards) must be operable via keyboard (Tab, Enter, Space, Arrow keys). Star ratings use `role="radiogroup"` with arrow key navigation.
- **Color contrast:** All text/background combinations must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). Verify the dark theme palette (#d4cdb7 on #0c0e0a = ~12:1, good; #8fb856 on #0c0e0a = ~5.5:1, good; verify gold and blue accents).
- **Reduced motion:** Wrap all CSS animations in `@media (prefers-reduced-motion: no-preference)`. Users who prefer reduced motion see no animations.
- **Semantic HTML:** Use proper heading hierarchy, `<nav>`, `<main>`, `<section>`, `<article>` landmarks. Form inputs have associated `<label>` elements.

### Error Recovery

When the global error handler fires or a critical failure occurs (corrupted localStorage, store initialization crash):
1. Display a user-friendly error screen (not a blank page)
2. Offer "Export your data" button that attempts to read and download raw localStorage as JSON
3. Offer "Reset app data" button that clears all growdoc-companion-* keys and reloads
4. Offer "Restore backup" button if pre-migration backup keys exist
5. Log the error details to console for debugging
6. The error screen itself must not depend on the store or router (static HTML fallback)

---

## Section 2: Store, Storage & Data Migration

**What to build:** The reactive state management system, localStorage abstraction with versioning, and migration infrastructure.

### store.js
- Proxy-based reactive store with `dispatch(action, payload)`, `commit(mutation, data)`, `subscribe(path, callback)`
- Event bus using `EventTarget` for loosely coupled component communication
- Namespaced events: `plant:updated`, `task:generated`, `stage:changed`, `env:logged`
- State shape as defined above

### storage.js
- `STORAGE_KEYS` constant mapping logical names to localStorage key strings
- `save(key, data)` with quota error handling (shows warning banner at 80% capacity)
- `load(key)` with JSON parse error handling (falls back to null, logs warning)
- `migrate(key, data)` runs version-specific migration functions
- `checkCapacity()` estimates usage via iterating all keys and summing `.length`
- `exportAll()` aggregates all growdoc-companion-* keys into one downloadable JSON
- Initial migration from existing Plant Doctor localStorage keys (`growdoc-plant-doctor`, `growdoc-grow-profile`, `growdoc-plants`) to companion format

---

## Section 3: Landing Page & Onboarding Wizard

**What to build:** The first-visit landing page and the full setup wizard.

### landing.html (or landing view)
- Clean, minimal, purely functional
- Hero text: app name + one-line value proposition
- Three feature highlights (cards or bullet points): daily task engine, environment optimization, diagnostic tools
- Single "Get Started" button → routes to `/setup`
- Dark theme consistent with rest of app

### Onboarding Wizard (onboarding.js)
A multi-step form that collects grow profile data. Each step is one screen with one question (or a small group).

**Steps:**
1. "What stage is your grow?" — Stage selector (Germination through Cure, or "Planning / Not started yet")
2. "What's your growing medium?" — Soil / Coco / Hydro / Soilless
3. "What lighting are you using?" — LED / HPS / CFL / Fluorescent + optional wattage field
4. "How many plants?" — Number input (1-20)
5. "What pot size?" — Dropdown (1L through 20L+). Applied to all plants initially; can customize per-plant later.
6. "What strain(s)?" — Strain picker component. Search database, select, or "Add custom." One per plant if count > 1, or one for all.
7. "How big is your grow space?" — L × W × H inputs in cm
8. "What's your experience level?" — Five options: First Grow / Beginner / Intermediate / Advanced / Expert. Brief description under each.
9. "What are your priorities?" — Four star-rating inputs (Yield, Quality, Terpenes, Effect). If Effect >= 3, show effect type selector.
10. Summary screen — Show all selections. "Looks good? [Start Growing]" or "Edit" links per section.

**UX details:**
- Progress dots at top showing current step
- Back button on each step
- Skip forward allowed for non-critical fields (wattage, space dimensions)
- On completion: create profile in store, generate initial plants, calculate first tasks, redirect to `/dashboard`

---

## Section 4: Dashboard (Today View)

**What to build:** The main daily-use screen that answers "Is everything OK?" and "What should I do today?"

### Layout (3 zones)

**Zone 1 — Status Banner (top, full width)**
A single colored banner showing grow status:
- Green: "All good — Day 38, Week 6 Flower, [strain name]"
- Gold: "Action needed — Watering due for Plant 2, pH logged high yesterday"
- Red: "Check plants — 3 days since last check-in" or "Urgent: diagnosis follow-up overdue"

Status determined by: days since last log, pending urgent tasks, unresolved diagnoses, environment drift.

**Zone 2 — Today's Tasks (main content)**
Per-plant task cards generated by the task engine, sorted by priority (urgent first).

Each task card shows:
- Plant name + task icon
- Task title (experience-level adapted)
- Priority badge (urgent/recommended/optional)
- Action buttons: Done / Dismiss / Snooze / Notes
- Expandable Layer 2: Why + evidence level
- Link to Layer 3: Knowledge Base reference

Custom task button: "Add custom task" → simple form (title, plant, priority, optional note)

**Zone 3 — Sidebar Widgets (right column on desktop, below tasks on mobile)**
- **VPD Widget**: Last temp/RH, calculated VPD, status indicator (optimal/high/low), "Update" button opens inline form
- **Timeline Snapshot**: Compact horizontal progress bar showing current position. Click expands to full timeline.
- **Quick Stats**: Days in current stage, days since last water/feed per plant, storage usage indicator

### Between-Grows State

When no active grow exists (after finishing a grow or before starting the first one), the dashboard shifts to a different layout:

**Zone 1 — Welcome/Summary Banner**
- If archived grows exist: "Your last grow finished X days ago. [strain], [total days], [rating] stars."
- If no grows yet: "Welcome to GrowDoc. Set up your first grow to get started."

**Zone 2 — Actions**
- Prominent "Start New Grow" button → routes to `/setup`
- If archived grows exist: summary card of last grow (setup, duration, outcomes)
- Link to Knowledge Base for pre-grow research

**Zone 3 — Quick Access**
- Knowledge Base links (browsable without an active grow)
- Stealth Audit tool (accessible without an active grow)
- Settings link

**Sidebar behavior in between-grows:** My Grow sub-items (plants, training, environment, harvest, feeding, journal, dry-cure) are grayed out / disabled. Only Today, Tools, Knowledge Base, and Settings are active. Clicking a disabled item shows a tooltip: "Start a grow to access this feature."

**Routing:** All `/grow/*` routes redirect to `/dashboard` when no active grow exists.

---

## Section 5: Task Engine

**What to build:** The core logic that generates dynamic, per-plant, context-aware task recommendations.

### task-engine.js

**Input data (from store):** Plant stage, days since last water/feed/check, medium, lighting, pot size, priorities, experience level, training plan, recent diagnoses, environment readings, strain data.

**Task generation rules** — organized by trigger type:

**Time-based triggers:**
- Watering: Based on medium + pot size + stage. Soil: every 3-7 days (smaller pot/bigger plant = more frequent). Coco: daily in flower. Hydro: continuous (check reservoir).
- Feeding: Every watering for coco/hydro. Every 2-3 waterings for soil (alternate water/feed).
- Check-in: If no log of any type in 3+ days, generate "Check your plants" task.

**Stage-based triggers:**
- Stage transition: When days-in-stage approaches typical duration, suggest advancement.
- Defoliation window: Day 1 and day 21 of flower.
- Lollipop window: End of stretch (week 2-3 of flower).
- Harvest check: Late flower — "Start checking trichomes daily."
- Cure milestones: Burp frequency reminders based on cure week.

**Training plan triggers:**
- Based on training method selected in Training Planner. Generate tasks at appropriate milestones (topping window, LST start, etc.).

**Diagnosis follow-up triggers:**
- If user opted to create follow-up: generate "Check improvement" task at 3-5 day interval post-diagnosis.

**Environment triggers:**
- If last VPD reading was outside optimal range for current stage: "Adjust environment" task with specific recommendations.
- If environment trend shows drift: alert task.

**Priority adjustment:**
All task text and recommendations are weighted by the priority system. The `priority-engine.js` module takes raw parameters (VPD targets, DLI targets, nutrient levels, harvest windows) from `grow-knowledge.js` and blends them according to the user's star ratings.

**Experience-level adaptation:**
The task engine generates three detail levels per task:
- `detail.beginner`: Full numbers, explanations ("Water Plant 2 — target pH 6.3, EC 1.4...")
- `detail.intermediate`: Ranges with context ("pH 6.0-6.5, EC 1.2-1.6...")
- `detail.expert`: Brief action ("Watering due (5d, 5L soil)")
Display is selected based on `profile.experience`.

---

## Section 6: Grow Knowledge Data Modules

**What to build:** The data layer that encodes all of Franco's cultivation protocols and the Professor's evidence classifications. These are static JS data modules (like the existing `plant-doctor-data.js`).

### grow-knowledge.js
Contains all environment/nutrient/timing data, organized by stage and priority.

**Key data structures:**

```javascript
// VPD_TARGETS[stage] = {dayTemp, nightTemp, dayRH, nightRH, vpdRange}
// DLI_TARGETS[stage][priority] = {min, optimal, max}
// NUTRIENT_TARGETS[medium][stage] = {ec, ph, npkRatio, calmagNote}
// TEMP_DIF[priority] = {dayNightDifferential, lateFlowerShift}
// WATERING_FREQUENCY[medium][potSize][stage] = {minDays, maxDays, notes}
```

### priority-engine.js
Takes user's 1-5 star ratings and calculates blended parameter targets.

```javascript
/**
 * calculateWeights(priorities) → {yield: 0.33, quality: 0.20, terpenes: 0.33, effect: 0.13}
 * blendTarget(parameterByPriority, weights) → weighted average or interpolated value
 * getRecommendation(param, stage, medium, priorities) → {value, range, tradeoffNote}
 */
```

### evidence-data.js
Maps every recommendation ID to an evidence level with source.

```javascript
// EVIDENCE[recommendationId] = {level: 'established'|'promising'|'speculative'|'practitioner', source: String, detail: String}
```

### stage-rules.js
Defines stage transitions, typical durations, and milestone triggers.

```javascript
// STAGES = ordered array of {id, name, typicalDays, minDays, maxDays, milestones[]}
// STAGE_TRANSITIONS[currentStage] = {next, triggerDays, confirmMessage}
```

### training-protocols.js
Defines training method schedules.

```javascript
// TRAINING_METHODS[method] = {name, description, impactRatings: {yield, quality, terpenes}, difficulty, milestones[]}
// Each milestone: {id, name, triggerStage, triggerDayInStage, taskTemplate}
```

### harvest-advisor.js
Trichome → recommendation logic.

```javascript
/**
 * assessHarvest(clear%, milky%, amber%, priorities, stage) → {
 *   recommendation: String,
 *   urgency: 'now'|'soon'|'wait',
 *   tradeoffNote: String,
 *   dryingProtocol: {},
 *   curingProtocol: {}
 * }
 */
```

### feeding-calculator.js
EC/pH/NPK targets by medium, stage, and priority.

```javascript
/**
 * getFeedingSchedule(medium, stage, priorities) → {
 *   ecTarget: {min, max},
 *   phTarget: {min, max},
 *   npkRatio: String,
 *   calmagRequired: Boolean,
 *   calmagDose: String,
 *   notes: String[],
 *   evidence: String
 * }
 */
```

---

## Section 7: Priority System UI

**What to build:** The star-rating input component, effect selector, and priority display in the profile and settings.

### star-rating.js
- Renders 5 clickable/tappable stars per priority dimension
- Labels with priority names and colors (Yield=green, Quality=gold, Terpenes=purple, Effect=indigo)
- Updates store on change
- If Effect >= 3 stars, reveals effect type selector dropdown
- Used in onboarding wizard and settings page

### Priority display widget
- Compact visualization showing current priority balance (4 colored bars or star counts)
- Shown in settings and optionally on dashboard
- "These priorities affect all recommendations" explainer text

---

## Section 8: Environment Dashboard & Tracking

**What to build:** The VPD widget for the dashboard, the full environment logging view with trend graphs, and the DLI/temperature calculators.

### vpd-widget.js (dashboard component)
- Compact card showing: current VPD value, status (optimal/high/low), last reading time
- "Update" button reveals inline temp/RH input fields
- On submit: calculates VPD using Franco's formula (accounting for leaf-temp offset under LED vs HPS), stores reading, updates status
- Color-coded: green if in target range for current stage, gold if borderline, red if out of range
- Links to full environment view

### Environment view (/grow/environment)
- Input form: temp high/low, RH high/low for today
- VPD calculator: live calculation as user types
- DLI calculator: PPFD input + photoperiod → DLI. Shows target range for current stage and priority.
- Temperature differential display: current day/night difference vs recommended
- Nutrient targets display: EC/pH ranges for current medium/stage/priority

### Trend charts (env-chart.js)
- Simple line chart rendered with SVG or Canvas (no chart library — keep it vanilla)
- X-axis: dates (last 14/30/60 days selectable)
- Y-axis: value (temp, RH, VPD)
- Three overlaid lines: temp high, temp low, VPD (or separate charts per metric)
- Optimal range shown as shaded band behind the lines
- Drift alert: if 7-day moving average deviates >10% from target, show warning

---

## Section 9: Plant Management & Quick Log

**What to build:** Plant list, individual plant views, and the quick logging system.

### Plant list (in My Grow view)
- Card per plant showing: name, strain, current stage, days in stage, days since last water/feed
- "Add Plant" button (up to the count in profile)
- Click plant → navigate to plant detail view

### Plant detail view (/grow/plant/:id)
- Header: plant name (editable), strain info, pot size, current stage badge
- Tab-like sections: Overview / Log History / Diagnoses / Training
- Overview: current stats, active tasks for this plant, stage timeline position
- Log History: reverse-chronological list of all logs, filterable by type

### Quick log form (log-form.js)
- Accessible from dashboard task cards (completing a task) or plant detail view
- Log type selector: Watered / Fed / Trained / Observed
- **Adaptive detail:**
  - Default: one-tap confirmation + auto timestamp
  - Expandable fields (collapsed by default):
    - Watered: volume (L), runoff pH, runoff EC, notes
    - Fed: pH in, EC in, volume, "Same as last time?" toggle, nutrient notes
    - Trained: action type dropdown (topped, LST adjusted, defoliated, lollipoped), notes
    - Observed: condition dropdown (Healthy / Concern / Pest / Deficiency / Milestone), notes
- "Same as last time?" for Feed: pre-fills pH, EC, volume from last feed log. One-tap confirm.
- On submit: creates log entry in plant data, updates "days since" counters, can dismiss related task

---

## Section 10: Growth Stage Timeline

**What to build:** The horizontal timeline visualization and stage management system.

### timeline-bar.js
- Horizontal progress bar divided into stage segments
- Each segment proportional to typical duration (configurable)
- Current position marker (animated dot or line)
- Stage labels below segments
- Milestone markers overlaid (icons for topping, flip, defoliation, harvest)
- Click a stage → shows stage detail panel (recommended environment, nutrients, tasks)

### Stage management
- Auto-advance with confirmation: when days-in-stage reaches typical duration, show inline prompt: "Ready to move to [next stage]? [Yes] [Not yet]"
- Manual advance: button in plant detail or My Grow view
- Per-plant stages: each plant tracks its own stage independently
- Stage change triggers: recalculate tasks, update environment targets, shift nutrient recommendations

### Dry/Cure stages
When a plant enters Harvest → Dry → Cure stages:
- Drying view: daily log form (temp, RH, smell assessment dropdown, snap test checkbox)
- Curing view: weekly log form (jar RH, smell assessment, burp count)
- Burp reminders generated as tasks (3x/day week 1, 1x/day week 2, every 2-3 days week 3-4)
- Completion: when cure target reached, prompt "Finish curing for [plant]"

---

## Section 11: Training Planner

**What to build:** A dedicated section where users select a training method and get a generated schedule with milestones.

### Training planner view (/grow/training)
- Method selector: No training / LST only / Top + LST / Mainline / ScrOG / Lollipop only
- Brief description of each method with impact ratings (yield/quality/terpene effect)
- Difficulty indicator per method
- On selection: generate milestones based on current plant stage and method schedule

### Milestone generation
- Based on `training-protocols.js` data
- Example for "Top + LST":
  - "Start LST" — when plant has 4-5 nodes (typically day 20-25 of veg)
  - "Top at node 5" — when vigorously growing, 1-2 days after LST start
  - "Continue LST" — ongoing during veg
  - "Final LST adjustments" — end of week 2 of flower
  - "Lollipop bottom 1/3" — end of stretch
  - "Defoliation day 21" — day 21 of flower

### Integration with task engine
Training milestones feed into the task engine as scheduled tasks. When a milestone's trigger conditions are met (correct stage + day range), a training task appears on the dashboard.

---

## Section 12: Harvest Window Advisor

**What to build:** Trichome assessment interface with priority-based harvest recommendations.

### Harvest advisor view (/grow/harvest)
- Three linked sliders: Clear / Milky / Amber. Must sum to 100%. Adjusting one recalculates the others proportionally.
- **Edge case:** When two sliders are at 0% and the third is at 100%, moving the 100% slider down splits the freed percentage equally between the two zero sliders (avoids division-by-zero in proportional redistribution).
- **Granularity:** 1% steps, values snap to integers. Range 0-100 per slider.
- Plant selector (if multiple plants in late flower)
- "Assess" button triggers recommendation calculation

### Recommendation display
- Primary recommendation with urgency badge (Harvest Now / Harvest Soon / Keep Waiting)
- Recommendation text tailored to priority: "Based on 80% milky, 15% amber and your TERPENE priority (5 stars): harvest within 1-3 days for optimal terpene preservation."
- Trade-off note: "Waiting 5 more days would add ~10% weight but reduce terpene complexity by 5-8%."
- Stagger harvest suggestion if applicable: "Consider cutting tops first, lower the light, give lowers 5-7 more days."

### Post-harvest protocols
- Drying recommendations based on priority (terpene priority: 15-17°C, 55-60% RH, 12-14 days)
- Curing recommendations with timeline
- These are generated by `harvest-advisor.js` and displayed as expandable cards

---

## Section 13: Feeding Schedule & Nutrient Calculator

**What to build:** A view showing recommended feeding parameters for the current stage, medium, and priority, with a nutrient calculator.

### Feeding view (/grow/feeding)
- Current feeding recommendation card:
  - Target EC range
  - Target pH range
  - N-P-K ratio description
  - CalMag notes (especially for coco + LED)
  - Medium-specific advice
- Stage-by-stage feeding overview table (scrollable, current stage highlighted)
- Priority adjustment explanation: how the user's priorities shift the feeding targets

### Nutrient calculator
- Input: current nutrient solution EC and pH
- Output: comparison to target range with specific advice ("EC 2.4 is 0.4 above target — reduce base nutrient concentration by 20%")

---

## Section 14: Plant Doctor — Unified Diagnostic Flow

**What to build:** A redesigned Plant Doctor that merges the Wizard and Multi-Dx modes into a single adaptive flow, integrated with the companion's grow context.

### Unified flow design
1. **Context pre-fill**: Medium, lighting, stage auto-loaded from companion profile. No need to re-ask.
2. **Guided start**: First question asks about the problem area (leaves, stems, roots, whole plant) — like Wizard mode
3. **Symptom selection**: After area, show relevant symptom checkboxes for that area — like Multi-Dx mode
4. **Adaptive expansion**: User can select multiple symptoms across areas. As symptoms are selected, scoring runs in real-time showing top candidate diagnoses updating live.
5. **Refine questions**: When top diagnoses are close in score, refine questions appear inline (not as separate step).
6. **Results**: Ranked diagnosis cards with confidence bars, severity badges, three-layer content (action → why → reference). All text adapted for current medium/lighting/stage.
7. **Note context**: Free-text note field always visible. Note-aware engine parses for additional context and adjusts advice.

### Integration points
- "I see a problem" button on dashboard → navigates to `/tools/doctor` with plant context pre-loaded
- After diagnosis: "Create follow-up reminder?" → if yes, generates a task in the task engine
- Diagnosis saved to plant's diagnosis history
- Outcome tracking: follow-up check-in asks "Did it improve?" → logs outcome

### Data migration
- Existing `plant-doctor-data.js` (SYMPTOMS, SCORING, REFINE_RULES) is the foundation
- Move to `/js/plant-doctor/doctor-data.js`
- Existing `note-context-rules.js` moves to `/js/plant-doctor/note-context.js`
- The 165+ existing tests should be preserved and adapted for the new unified flow

---

## Section 15: Knowledge Base

**What to build:** A contextual knowledge browser that replaces the 14 static guide documents with organized, searchable, three-layer content.

### Content organization
**By topic:**
- Growing Basics (medium setup, lighting, ventilation)
- Stage Guides (seedling, veg, flower, harvest, dry, cure)
- Nutrient Science (deficiencies, toxicities, feeding principles, organic vs synthetic)
- Environment (VPD, DLI, temperature, humidity)
- Training (topping, LST, ScrOG, defoliation, lollipop)
- Pest & Disease (identification, treatment, prevention)
- Harvest & Post-Harvest (trichome assessment, drying, curing, storage)
- Myths vs Science (dedicated myth-busting section)

### Content structure
Each knowledge article follows the three-layer pattern:
- **Layer 1** (card title + summary): The practical advice. Always visible.
- **Layer 2** (expandable): Why it matters, evidence level badge, source citation, practitioner insight vs scientific validation.
- **Layer 3** (internal link): Deep reference to related articles within the Knowledge Base. No external links.

### Myth-busting section (/knowledge/myths)
Dedicated page with common myths:
- Pre-harvest flushing (debunked — Stemeroff 2017)
- 48-hour darkness before harvest (no evidence)
- Sugar/carb supplements for terpenes (no evidence)
- Indica vs sativa effect classification (debunked — Russo 2016)
Each myth card shows: the claim, the evidence, the reality, and the source.

### Content delivery
All knowledge content is stored in JS data modules (not separate HTML files). Content is rendered by the knowledge view function. This allows contextual references from other parts of the app (task cards can link to specific knowledge articles by ID).

---

## Section 16: Strain Database

**What to build:** A large pre-built strain database (500+ entries) with search/select functionality.

### strain-database.js
Static JS data file containing strain records. **Lazy-loaded:** This file is NOT imported at app startup. It is loaded via dynamic `import()` when the strain picker component is first opened. This prevents 200-500KB of strain data from blocking initial page load. Once loaded, the module is cached by the browser for subsequent uses.

```javascript
// STRAINS[strainId] = {
//   name: String,
//   breeder: String,
//   flowerWeeks: {min: Number, max: Number},
//   stretchRatio: {min: Number, max: Number},
//   sensitivities: String[],      // ['pm-prone', 'calmag-hungry', 'heat-sensitive', etc.]
//   type: String,                  // 'indica-dom' | 'hybrid' | 'sativa-dom'
//   dominantTerpenes: String[],   // optional
//   thcRange: String,             // optional, e.g., '18-24%'
//   cbdRange: String,             // optional
//   description: String           // optional
// }
```

**Data sourcing:** Compile from publicly available strain databases. Focus on accuracy of flowering time and stretch ratio (most impactful for the task engine).

### strain-picker.js (component)
- Search input with live filtering (debounced at 200ms to avoid filtering 500+ entries on every keystroke)
- Scrollable result list showing: name, breeder, flower time, type badge
- Select → populates plant's strain reference
- "Add Custom Strain" flow: form with required fields (name, flower weeks) and optional fields (stretch, sensitivities, type)
- Custom strains stored in localStorage alongside profile data

---

## Section 17: Stealth Audit (Preservation)

**What to build:** Embed the existing Stealth Audit tool within the companion's Tools section.

### Implementation
- The existing `tool-stealth-audit.html` is loaded via iframe in the Tools section (same pattern as current app)
- OR: extract the Stealth Audit's HTML/CSS/JS and render it natively within the companion's content area
- The Stealth Audit's own localStorage key (`growdoc-stealth-audit`) continues to work independently
- No integration with the companion's state management needed

---

## Section 18: Settings & Data Management

**What to build:** A settings view for editing the grow profile, preferences, and managing data.

### Settings view (/settings)
- **Profile section**: Edit all onboarding fields (medium, lighting, experience, priorities, etc.)
- **Priority section**: Star rating editor with live preview of how changes affect recommendations
- **Preferences**: Sidebar state default, UI preferences
- **Data section**: Storage usage indicator (X of ~5MB used). "Archive old grows" button. Warning banner at 80% capacity.
- **About**: Version, credits, link to GitHub repo

### Finish Grow flow (/finish)
- Summary of the grow: total days, stage durations, plant count, diagnosis count, treatment success rate
- Optional fields: yield per plant (grams), overall rating (1-5 stars), final notes
- "Finish & Archive" button: archives grow to summary, clears active grow data, redirects to between-grows dashboard

---

## Section 19: Existing Code Migration

**What to build:** A migration strategy for transitioning from the current doc-viewer architecture to the companion.

### Phase 1: Parallel deployment
- New companion files live alongside existing files
- `index.html` becomes the companion app
- Current `index.html` moved to `/legacy/index.html`
- Existing tool HTML files (`tool-plant-doctor.html`, etc.) remain for now (Stealth Audit still uses iframe)

### Phase 2: Data migration
- On first companion load, check for existing localStorage keys:
  - `growdoc-plant-doctor` → extract plant data, journal entries, grow profile
  - `growdoc-grow-profile` → import medium, lighting settings
  - `growdoc-plants` → import plant names and dates
  - `growdoc-cure-tracker` → import into companion's dry/cure stage data
  - `growdoc-env-dashboard` → import last inputs
- Migration runs once, sets a `growdoc-companion-migrated` flag
- Old keys preserved (not deleted) as backup

### Phase 3: Plant Doctor extraction
- Extract Plant Doctor logic from monolithic `tool-plant-doctor.html` into modular JS files
- `doctor-engine.js`: scoring algorithm, refine logic, state machine
- `doctor-data.js`: existing SYMPTOMS, SCORING, REFINE_RULES
- `doctor-ui.js`: rendering functions adapted for companion's content area
- `note-context.js`: note-aware engine
- Preserve and adapt the 165+ test assertions

---

## Testing Strategy

### Test approach
Continue the existing inline assertion pattern for consistency. Each module exports a `runTests()` function. A master test runner calls all module tests on load (in development) or via a `/test` route.

### Test categories
1. **Data integrity**: Strain database completeness, knowledge data structure, evidence mappings
2. **Store**: Mutations produce correct state, subscriptions fire, event bus delivers
3. **Storage**: Round-trip save/load, migration from v1→v2, quota handling, capacity check
4. **Task engine**: Correct tasks generated for various stage/medium/priority combinations
5. **Priority engine**: Weight calculation from stars, blended targets, trade-off note generation
6. **VPD calculator**: Formula correctness for LED vs HPS leaf temp offset
7. **DLI calculator**: PPFD × hours × 0.0036 correctness
8. **Feeding calculator**: EC/pH targets match Franco's tables for each medium/stage/priority
9. **Harvest advisor**: Trichome percentages produce correct recommendations by priority
10. **Plant Doctor**: Existing 165+ tests adapted for unified flow
11. **Router**: Route matching, parameter extraction, history navigation
12. **Timeline**: Stage duration calculations, auto-advance trigger timing
13. **UI rendering**: Each view function produces valid HTML, correct data bindings

### Test runner
```javascript
/**
 * testRunner.js
 * runAllTests() — iterates all registered test modules, calls runTests() on each
 * Reports: total assertions, passed, failed, with console output
 * Accessible via /test route in development
 */
```

---

## Implementation Order

The sections should be implemented in this order to build on each other:

1. **App Shell, Sidebar & Routing** (Section 1) — foundation everything else depends on
2. **Store, Storage & Data Migration** (Section 2) — state management needed by all features
3. **Landing Page & Onboarding** (Section 3) — first user flow
4. **Grow Knowledge Data Modules** (Section 6) — data needed by task engine and all calculators
5. **Strain Database** (Section 16) — needed by onboarding strain picker
6. **Priority System** (Section 7) — needed by all recommendation systems
7. **Growth Stage Timeline** (Section 10) — needed by task engine and dashboard
8. **Task Engine** (Section 5) — the killer feature, depends on 1-4 + 6-7
9. **Dashboard** (Section 4) — the main view, depends on task engine
10. **Environment Dashboard** (Section 8) — integrated into dashboard
11. **Quick Log & Plant Management** (Section 9) — daily use features
12. **Feeding Schedule** (Section 13) — depends on knowledge data + priority
13. **Training Planner** (Section 11) — generates tasks
14. **Harvest Window Advisor** (Section 12) — late-grow feature
15. **Plant Doctor** (Section 14) — major feature, can be built in parallel
16. **Knowledge Base** (Section 15) — content-heavy, can be built in parallel
17. **Stealth Audit** (Section 17) — simple embed
18. **Settings & Data Management** (Section 18) — polish
19. **Existing Code Migration** (Section 19) — transition plan
