# GrowDoc Grow Companion — Combined Research

## 1. Codebase Analysis

### Architecture
- Entry: `index.html` + `app.js` loads tools via iframe (`docs/tool-*.html`)
- Each tool is self-contained: own HTML, inline CSS, inline JS, own localStorage
- No inter-tool communication — fully siloed
- Dark theme with CSS custom properties (--bg, --accent, --text, etc.)
- Typography: DM Serif Display (titles), Source Serif 4 (body), IBM Plex Mono (data)

### Rendering Pattern
- Template literals built in-memory, single `.innerHTML` assignment per view
- No virtual DOM, no Shadow DOM — direct HTML string manipulation
- Card-based UI: result cards, question cards, input groups, status badges
- All interactive elements have ARIA labels, min 44px touch targets, focus-visible

### State Management
- Multiple state objects per tool (Plant Doctor has 3: state, multiDxState, journalState)
- localStorage persistence with version tracking and corruption handling
- Data migration from v1→v2 with backup preservation
- Undo stack (5 deep) using JSON snapshots

### localStorage Keys (Current)
| Key | Tool | Size |
|-----|------|------|
| `growdoc-plant-doctor` | Plant Doctor | ~200KB max |
| `growdoc-grow-profile` | Plant Doctor | ~100B |
| `growdoc-plants` | Plant Doctor | ~1KB |
| `growdoc-active-plant` | Plant Doctor | ~50B |
| `growdoc-cure-tracker` | Cure Tracker | ~50KB max |
| `growdoc-env-dashboard` | Env Dashboard | ~500B |
| `growdoc-stealth-audit` | Stealth Audit | ~2KB |
| `growdoc-token` | Admin | ~200B |

### CSS Architecture
- BEM variant naming: `.component-name`, `.component-name.modifier`
- Responsive breakpoints: 768px (tablet), 640px (mobile)
- Color system: --bg (#0c0e0a), --accent (#8fb856), --gold (#c9a84c), --red (#c45c4a), --blue (#5a9eb8)
- Animation keyframes: fade-in, pulse-dot, pulse-value, pulse-marker

### Testing
- 165+ inline assertions using custom assert() function
- Categories: tree integrity, state machine, data integrity, localStorage, rendering, multi-dx
- Runs synchronously on DOMContentLoaded — no framework

### Reusable Patterns
- Decision tree navigation (graph-based node traversal)
- Multi-factor scoring algorithm (base + stage + medium + lighting modifiers)
- Refine question logic (condition-based disambiguation)
- localStorage persistence with versioning and migration
- Template literal rendering with escapeHtml()
- Form input groups (label + input + hint pattern)
- Responsive grid layouts with CSS custom properties

---

## 2. Expert Research (Franco + Professor)

### Franco — Cultivation Protocols
Complete parameter tables for all 4 priorities (yield/quality/terpenes/effect) across:
- VPD targets by stage (seedling through ripening)
- DLI targets by stage and priority
- Nutrient EC/pH targets by medium (soil/coco/hydro) and stage
- N-P-K ratios by stage and priority
- Training protocols with impact ratings
- Harvest timing by priority (trichome percentages)
- Drying/curing protocols with specific temp/RH/duration
- Daily task engine logic (what to check, when, why)

### Professor — Evidence Levels
- ESTABLISHED: PPFD→yield linear (Rodriguez-Morrison 2021), optimal flower N=160mg/L (Bernstein lab), flushing debunked (Stemeroff 2017), indica/sativa meaningless (Russo 2016)
- PROMISING: 13h photoperiod +38% yield (Ahrens 2024), drought stress +43% THCA (Caplan 2019), LED Ca/Mg demand
- SPECULATIVE: VPD cannabis-specific targets, temperature differentials for terpenes, terpene manipulation via environment
- DEBUNKED: UV-B for THC, pre-harvest flushing, darkness before harvest, sugar supplements

### Consensus
- Genetics + light are the two biggest levers
- Environmental optimization is "margins" — but that's exactly where the app adds value
- Every recommendation should carry an evidence confidence badge

---

## 3. UX Research

### Information Architecture
- Two-speed structure: Quick Ops (30-second glance) + Grow Hub (deep dive)
- Desktop sidebar: Today / My Grow / Tools / Knowledge Base
- Dashboard zones: Status banner → Today's actions → Grow timeline
- Progressive profiling: ask at point of use, not upfront

### Design Principles
1. Context-first, not question-first
2. Speed and depth are different modes, not different users
3. Earn every notification
4. The log is the product
5. Grows have seasons (app should shift between active grow and planning modes)
6. The plant is the hero (anchor everything to named plants)

### Content Pattern
Three-layer disclosure: Action (visible) → Why (expandable) → Deep Reference (link)

---

## 4. Product Strategy

### Competitive Positioning
- vs Grow with Jane: passive journaling → we're proactive guidance
- vs BudLabs: hardware-dependent → we're free web-based
- vs GrowDiaries: community-only → we're science-backed tool
- vs forums/YouTube: static → we're adaptive to your setup

### Success Metrics
- >80% setup profile completion
- >60% timeline adoption
- >40% daily task engagement
- >70% 7-day retention

---

## 5. Web Research: Technical Patterns

### Vanilla JS SPA Architecture
- Feature-based file organization (not file-type-based)
- ES modules for explicit dependencies
- Proxy + Pub/Sub for centralized reactive state management
- Custom Elements (Web Components) for encapsulated UI components
- History API pushState for clean URL routing
- Event bus with namespaced events (plant:updated, note:created)

### localStorage Data Management
- 5-10MB limit per origin; synchronous and blocks main thread
- Namespaced keys with version-tracked schema for relational-ish data
- Sequential migration functions at startup (v1→v2→v3)
- Export: Blob + download link; Import: FileReader + validation + migration
- Graduate to IndexedDB if data exceeds ~3MB or needs complex queries

### Progressive Disclosure UI
- 2 levels maximum (NNGroup research)
- Four types: Conditional, Contextual, Progressive Enabling, Staged
- Simple/Advanced toggle stored in localStorage
- Expandable accordion sections for detailed data
- Tooltips for terminology
- Experience-level tracking: count interactions, fade helpers after N uses
- Layer 1 (always visible) → Layer 2 (expandable) → Layer 3 (separate view)

---

## 6. Testing Preferences

### Current Pattern
- Inline assertion-based testing (custom assert function)
- 165+ tests covering tree integrity, state machine, data integrity, localStorage, rendering
- Runs on DOMContentLoaded — no external framework
- Pattern: `assert(condition, 'description')` with pass/fail counter

### Recommendation for Companion
- Continue inline testing pattern for consistency
- Add data module tests (priority calculations, VPD formulas, nutrient recommendations)
- Add state management tests (store mutations, event propagation)
- Add localStorage round-trip tests with schema migration
- Consider extracting test runner into shared utility module
