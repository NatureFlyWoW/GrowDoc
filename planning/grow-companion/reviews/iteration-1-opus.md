# Opus Review

**Model:** claude-opus-4-6
**Generated:** 2026-04-08

---

## Plan Review: GrowDoc Grow Companion Implementation Plan

### 1. localStorage as Sole Persistence -- The Elephant in the Room

The plan puts the entire app's data story on localStorage with a hard 5MB limit. The plan acknowledges a warning at 80% but does not do the math. A moderately active grower logging daily for a 4-month grow (120 days), with 3 plants, each getting ~2 log entries/day with details, plus daily environment readings, plus tasks... that is easily 2000+ JSON objects at 1-2MB for a single grow before archiving.

**Recommendation:** Explicit size budgets per localStorage key with estimated byte counts. Specify what happens when a user hits quota mid-grow. Consider periodic compaction of old environment readings (aggregate daily to weekly after 30 days).

### 2. Vercel SPA Routing -- Missing rewrites Configuration

History API routing with pushState but no rewrite rules in vercel.json. User refresh on /grow/plant/abc123 returns 404. **Guaranteed production bug.**

**Recommendation:** Add vercel.json rewrites excluding /api/*, /docs/*, /legacy/*, and static asset directories.

### 3. Plant Doctor Extraction -- Monolith Decomposition Risk

Existing Plant Doctor is a 6,466-line monolithic HTML file with var-style declarations. Converting to ES modules means scope changes and is actually a rewrite, not a refactor. 63 localStorage references need re-routing. Tests depend on global state.

**Recommendation:** Call out as rewrite at 2-3x effort. Consider keeping iframe initially and extracting incrementally.

### 4. State Management Complexity vs. Vanilla JS Constraint

Proxy-based reactive store is essentially hand-rolled Vuex/Redux. No TypeScript for the complex nested state. Deep mutations (e.g., store.state.grow.plants[0].logs.push()) won't be detected by top-level Proxy.

**Recommendation:** Specify reactivity depth strategy. Consider simpler event-emitter pattern where views re-render on relevant events.

### 5. 500+ Strain Database -- Loading Performance

Static JS file loaded at startup could be 200-500KB. No code-splitting, loads on every page visit.

**Recommendation:** Lazy-load strain-database.js with dynamic import(). Debounce filter (200-300ms).

### 6. Missing Offline/Error Resilience

Google Fonts from CDN could cause FOUT/FOIT on spotty connections.

**Recommendation:** Add font-display: swap. Consider self-hosting fonts. Specify careful fallback stacks.

### 7. Trichome Sliders -- Mathematical Edge Case

When two sliders are at 0% and third at 100%, proportional redistribution causes division by zero.

**Recommendation:** Specify fallback (split equally), minimum granularity (1%? 5%?), integer snapping.

### 8. No Explicit XSS/Injection Mitigation Strategy

App renders user-provided data in multiple places with likely innerHTML. Existing codebase already had XSS test string issue.

**Recommendation:** Mandate escapeHtml() for all user strings before DOM insertion. Prefer textContent for user data, innerHTML only for trusted templates.

### 9. Migration Strategy Has a Timing Problem

New code deploys = every existing user gets new app on next visit. If migration has a bug, data could be corrupted. No rollback mechanism described.

**Recommendation:** Add rollback strategy: restore from backup button, version check re-run, or deploy companion to separate URL first.

### 10. Implementation Order Creates Late Feedback Loop

Dashboard (position 9) and Task Engine (position 8) mean weeks of work before anything is testable end-to-end.

**Recommendation:** Build a vertical slice first (shell + store + onboarding + hardcoded tasks + minimal dashboard) to validate core UX loop early.

### 11. Spec Conflict: Priority System -- Sliders vs. Stars

grow-companion-spec.md says "Slider-based" but plan says "5 clickable/tappable stars." Superseded during interview but original spec not updated.

**Recommendation:** Update grow-companion-spec.md or add explicit note about the change.

### 12. No Accessibility Plan Beyond ARIA Mentions

No mention of keyboard navigation, screen reader support, color contrast ratios, focus management on route changes, or prefers-reduced-motion.

**Recommendation:** Add accessibility section specifying focus management, keyboard operability, contrast ratios (WCAG AA), and reduced-motion support.

### 13. Between-Grows State is Underspecified

Plan does not specify what renders at /dashboard when there is no active grow. What happens to sidebar navigation?

**Recommendation:** Add between-grows state specification to Section 4.

### 14. Custom SVG Charts -- Underestimated Effort

Responsive, interactive SVG charts from scratch is 500-1000 lines. Non-trivial.

**Recommendation:** Scope charts down to minimum or acknowledge as significant component. Consider lightweight micro-library (uPlot ~35KB).

### 15. No Error Boundary / Crash Recovery Strategy

What happens when the global error handler fires? Corrupted localStorage could create boot loop.

**Recommendation:** Error screen with "Reset app data" escape hatch. Attempt export before reset. Skip broken migrations gracefully.

### 16. Missing: How Existing API Functions Coexist

/api functions for admin auth and GitHub state. No transition plan specified. Route conflict risk with SPA rewrites.

**Recommendation:** Exclude /api/* from rewrites. Specify admin functionality transition.

### 17. Grow Data Model -- Single Active Grow Limitation

grow is a single object, not an array. Tasks and env readings have no growId. Retrofitting multi-grow later requires migration.

**Recommendation:** Wrap grow in array now (UI only shows index 0). Include growId on env readings and tasks.

---

### Summary of Critical Items (by severity):

1. **Vercel SPA rewrites missing** -- Production 404s on refresh
2. **localStorage quota strategy** -- Needs concrete size budgets
3. **Plant Doctor extraction is a rewrite** -- Effort estimate needs adjustment
4. **Deep reactivity undefined** -- Proxy store will have subtle bugs
5. **XSS mitigation** -- Needs explicit DOM sanitization strategy
6. **Migration rollback** -- No recovery path if migration fails
7. **Between-grows state unspecified** -- No defined behavior after finishing grow
8. **Strain database loading** -- 500+ entries loaded eagerly could slow page load
