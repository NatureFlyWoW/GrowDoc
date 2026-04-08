# Section 01: App Shell, Sidebar & Routing

## Overview

This section builds the foundational HTML shell, CSS design system, collapsible sidebar navigation, and client-side router for the GrowDoc Grow Companion app. Everything else depends on this section being complete first.

**Tech stack:** Vanilla JS (ES modules), HTML5, CSS3 with custom properties. No framework, no build step, no npm. Deployed on Vercel via auto-deploy on push to main.

**Current state:** A working Plant Doctor v3 loaded via an iframe-based doc viewer (`app.js` + `index.html`). This section replaces that architecture with a proper SPA shell.

---

## Dependencies

- None. This is the first section to implement.

## Blocks

- All other sections depend on this shell being in place.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `/index.html` | Replace | Companion app shell (replaces current doc viewer) |
| `/css/variables.css` | Create | Design system: colors, typography, spacing |
| `/css/layout.css` | Create | Sidebar, main content area, responsive grid |
| `/css/components.css` | Create | Reusable component styles |
| `/js/main.js` | Create | App entry: routing, init, sidebar |
| `/js/router.js` | Create | History API client-side routing |
| `/js/utils.js` | Create | Shared helpers (escapeHtml, formatDate, etc.) |
| `/js/components/sidebar.js` | Create | Collapsible sidebar navigation |
| `/assets/icons.svg` | Create | SVG icon sprite (sidebar nav, task types) |
| `/vercel.json` | Modify | Add SPA rewrite rules |

---

## Tests (Implement First)

All tests follow the existing inline assertion pattern. Each module exports a `runTests()` function with `assert(condition, msg)` style tests.

### Router Tests

- **Route matching:** route matching returns correct view function for each defined route
- **Parameterized routes:** parameterized routes extract params (e.g., `/grow/plant/:id` extracts `id`)
- **Unknown routes:** unknown routes fall back to 404/dashboard
- **First visit without profile:** first visit without profile redirects to landing page
- **First visit with profile:** visit with profile redirects to dashboard

### Sidebar Tests

- **Nav items:** sidebar renders all nav items with correct labels
- **Collapsed state:** collapsed state shows icons only (verify CSS class)
- **Toggle:** toggle button switches between collapsed and expanded
- **Active section:** active section is highlighted for current route
- **Between-grows mode:** between-grows mode disables My Grow sub-items

### Vercel Config Tests

- **SPA rewrite:** vercel.json contains SPA rewrite rule
- **Exclusions:** rewrite pattern excludes `/api/`, `/legacy/`, `/assets/`, `/css/`, `/js/`, `/docs/`

---

## Implementation Details

### index.html

The HTML shell is minimal. It provides two landmark elements and loads the app entry point as an ES module.

Structure:
- `<nav id="sidebar">` for the collapsible sidebar
- `<main id="content">` for the routed view content
- `<script type="module" src="/js/main.js">` as the single entry point
- Google Fonts link for DM Serif Display, Source Serif 4, IBM Plex Mono with `&display=swap` to prevent invisible text on slow connections
- Fallback font stacks: `'DM Serif Display', Georgia, 'Times New Roman', serif` for headings, `'Source Serif 4', Georgia, serif` for body, `'IBM Plex Mono', 'Courier New', monospace` for code
- Meta viewport for responsive: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- CSS files linked: `variables.css`, `layout.css`, `components.css`

### CSS Design System (variables.css)

Define all custom properties from the design spec:

**Colors:**
- Background: `--bg-primary: #0c0e0a`, `--bg-surface: #1a1d16`, `--bg-elevated: #252820`
- Text: `--text-primary: #d4cdb7`, `--text-secondary: #a09880`, `--text-muted: #6b6555`
- Accent: `--accent-green: #8fb856`
- Priority colors: `--priority-yield: #8fb856` (green), `--priority-quality: #d4a843` (gold), `--priority-terpenes: #9b6cc0` (purple), `--priority-effect: #5c6bc0` (indigo)
- Evidence level colors for badges
- Status colors: green (all good), gold (action needed), red (urgent)

**Typography:**
- Heading: `--font-heading: 'DM Serif Display', Georgia, 'Times New Roman', serif`
- Body: `--font-body: 'Source Serif 4', Georgia, serif`
- Mono: `--font-mono: 'IBM Plex Mono', 'Courier New', monospace`

**Spacing scale:** 4px base (`--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, etc.)

**Other:** border-radius tokens, transition durations, box shadows

### CSS Layout (layout.css)

- Sidebar + main content grid layout
- Sidebar expanded width: ~220px, collapsed width: ~60px
- Responsive: on mobile, sidebar collapses to bottom nav or hamburger menu
- Main content area fills remaining width with padding

### CSS Components (components.css)

- Base button styles, card styles, badge styles, form input styles
- Reusable across all sections

### Sidebar (sidebar.js)

The sidebar renders navigation items and manages collapse/expand state.

**Nav items:**
- Today (dashboard icon) -> `/dashboard`
- My Grow (plant icon) -> `/grow` with sub-items:
  - Plants -> `/grow`
  - Timeline -> `/grow` (section)
  - Training -> `/grow/training`
  - Environment -> `/grow/environment`
  - Harvest -> `/grow/harvest`
  - Feeding -> `/grow/feeding`
  - Journal -> `/grow/journal`
  - Dry/Cure -> `/grow/dry-cure`
- Tools (wrench icon) -> `/tools/doctor` with sub-items:
  - Plant Doctor -> `/tools/doctor`
  - Stealth Audit -> `/tools/stealth`
- Knowledge Base (book icon) -> `/knowledge`
- Settings (gear icon) -> `/settings`

**Behavior:**
- Collapse/expand toggle button at bottom of sidebar
- Collapsed state: icons only (~60px). Expanded: icons + labels (~220px)
- Active section highlighted with accent color (`--accent-green`)
- State persisted via store at path `ui.sidebarCollapsed`
- Between-grows mode: My Grow sub-items are grayed out/disabled. Clicking a disabled item shows a tooltip: "Start a grow to access this feature."

**Accessibility:**
- `role="navigation"` and `aria-label="Main navigation"` on the nav element
- `aria-expanded` on the collapse toggle button
- `aria-current="page"` on the active nav link
- All nav items are keyboard-navigable (Tab, Enter)

**Signature:**

```javascript
// sidebar.js
export function renderSidebar(container, store) { /* ... */ }
export function updateActiveItem(currentRoute) { /* ... */ }
export function setSidebarCollapsed(collapsed) { /* ... */ }
```

### Router (router.js)

Client-side routing using the History API (pushState/popstate). No hash routing.

**Route definitions:**

```javascript
const ROUTES = [
  { path: '/',                  view: 'landing',      auth: false },
  { path: '/setup',             view: 'onboarding',   auth: false },
  { path: '/dashboard',         view: 'dashboard',    auth: true  },
  { path: '/grow',              view: 'my-grow',      auth: true  },
  { path: '/grow/plant/:id',    view: 'plant-detail', auth: true  },
  { path: '/grow/training',     view: 'training',     auth: true  },
  { path: '/grow/environment',  view: 'environment',  auth: true  },
  { path: '/grow/harvest',      view: 'harvest',      auth: true  },
  { path: '/grow/feeding',      view: 'feeding',      auth: true  },
  { path: '/grow/journal',      view: 'journal',      auth: true  },
  { path: '/grow/dry-cure',     view: 'dry-cure',     auth: true  },
  { path: '/tools/doctor',      view: 'doctor',       auth: false },
  { path: '/tools/stealth',     view: 'stealth',      auth: false },
  { path: '/knowledge',         view: 'knowledge',    auth: false },
  { path: '/knowledge/myths',   view: 'myths',        auth: false },
  { path: '/settings',          view: 'settings',     auth: true  },
  { path: '/finish',            view: 'finish',       auth: true  },
  { path: '/test',              view: 'test-runner',  auth: false },
];
```

**Behavior:**
- Intercept `<a>` clicks on internal links and use `pushState` instead of full navigation
- Listen to `popstate` for browser back/forward
- On route change: look up matched view function, call it with `<main id="content">` as the render target
- Parameterized route matching: `/grow/plant/:id` extracts `{ id: 'abc123' }`
- First visit detection: if no profile in localStorage, redirect to `/` (landing). If profile exists, `/` redirects to `/dashboard`
- Auth guard: routes marked `auth: true` redirect to `/dashboard` (which then redirects to landing if no profile). All `/grow/*` routes redirect to `/dashboard` when no active grow exists.
- Unknown routes: fall back to dashboard (or 404 view)

**Focus management:** On every route change, focus the main content area heading (`<h1>` or first focusable element). This prevents focus from being lost in the sidebar after navigation.

**Signature:**

```javascript
// router.js
export function initRouter(contentEl, viewMap) { /* ... */ }
export function navigate(path) { /* ... */ }
export function matchRoute(pathname) { /* returns {view, params} */ }
export function getCurrentRoute() { /* ... */ }
```

### main.js (Entry Point)

The app entry point that wires everything together.

**On DOMContentLoaded:**
1. Import store, router, storage, sidebar
2. Load state from localStorage via `storage.load()`
3. Initialize store with loaded state
4. Render sidebar into `<nav id="sidebar">`
5. Route to current URL via `router.initRouter()`
6. Register global error handler

**Signature:**

```javascript
// main.js
import { initStore } from './store.js';
import { initRouter } from './router.js';
import { load } from './storage.js';
import { renderSidebar } from './components/sidebar.js';

document.addEventListener('DOMContentLoaded', () => { /* ... */ });
```

### utils.js (Shared Helpers)

Utility functions used across all modules.

```javascript
// utils.js
export function escapeHtml(str) { /* escapes <, >, &, ", ' */ }
export function formatDate(isoString) { /* returns human-readable date */ }
export function daysSince(isoString) { /* returns integer days since date */ }
export function generateId() { /* returns short unique ID */ }
export function debounce(fn, ms) { /* standard debounce */ }
```

### Security: XSS Mitigation

All user-provided strings (plant names, strain names, task notes, log notes, journal entries, Plant Doctor free-text notes) MUST be sanitized before DOM insertion.

Rules:
- Use `textContent` for rendering user data into the DOM (not `innerHTML`)
- Use `innerHTML` only for trusted template strings that contain no user data
- When user data must appear inside an HTML template string, always pass it through `escapeHtml()` first
- The `escapeHtml()` utility escapes `<`, `>`, `&`, `"`, `'` characters
- This is enforced by convention and verified in tests (test that user strings with `<script>` tags are rendered safely)

### Accessibility Foundations

These rules apply to every view and component built in subsequent sections:

- **Focus management:** On every route change, focus the main content area heading
- **Keyboard operability:** All interactive elements (buttons, star ratings, sliders, task cards) must be operable via keyboard (Tab, Enter, Space, Arrow keys). Star ratings use `role="radiogroup"` with arrow key navigation.
- **Color contrast:** All text/background combinations must meet WCAG AA (4.5:1 for normal text, 3:1 for large text). The dark theme palette provides good contrast: `#d4cdb7` on `#0c0e0a` is ~12:1; `#8fb856` on `#0c0e0a` is ~5.5:1. Verify gold and blue accents.
- **Reduced motion:** Wrap all CSS animations in `@media (prefers-reduced-motion: no-preference)`. Users who prefer reduced motion see no animations.
- **Semantic HTML:** Use proper heading hierarchy, `<nav>`, `<main>`, `<section>`, `<article>` landmarks. Form inputs have associated `<label>` elements.

### Error Recovery

When the global error handler fires or a critical failure occurs (corrupted localStorage, store initialization crash):

1. Display a user-friendly error screen (not a blank page)
2. Offer "Export your data" button that attempts to read and download raw localStorage as JSON
3. Offer "Reset app data" button that clears all `growdoc-companion-*` keys and reloads
4. Offer "Restore backup" button if pre-migration backup keys exist
5. Log the error details to console for debugging
6. The error screen itself must not depend on the store or router (static HTML fallback)

### Vercel SPA Routing Configuration

The `vercel.json` must be updated to support History API routing. Without SPA rewrites, refreshing the browser on any route other than `/` returns a 404 from Vercel.

```json
{
  "rewrites": [
    { "source": "/((?!api|legacy|assets|css|js|docs).*)", "destination": "/index.html" }
  ]
}
```

The rewrite excludes: `/api/*` (Vercel serverless functions, kept for now), `/legacy/*` (archived old app), `/assets/*`, `/css/*`, `/js/*` (static files), and `/docs/*` (existing tool HTML files used by iframe embeds like Stealth Audit).

---

## Implementation Checklist

1. Write router tests (route matching, param extraction, fallback, first-visit redirect)
2. Write sidebar tests (nav items, collapsed state, toggle, active highlight, between-grows)
3. Write vercel.json tests (SPA rewrite rule, exclusion patterns)
4. Create `css/variables.css` with all design system tokens
5. Create `css/layout.css` with sidebar + main grid
6. Create `css/components.css` with base component styles
7. Create `js/utils.js` with `escapeHtml`, `formatDate`, `daysSince`, `generateId`, `debounce`
8. Create `js/router.js` with route definitions, matching, History API integration, auth guards
9. Create `js/components/sidebar.js` with nav rendering, collapse toggle, active highlighting
10. Create `js/main.js` with initialization flow and global error handler
11. Replace `index.html` with the new SPA shell (move old to `/legacy/index.html`)
12. Update `vercel.json` with SPA rewrite rule
13. Create `assets/icons.svg` icon sprite
14. Verify all router tests pass
15. Verify all sidebar tests pass
16. Verify SPA routing works on Vercel (deploy and test refresh on sub-routes)
