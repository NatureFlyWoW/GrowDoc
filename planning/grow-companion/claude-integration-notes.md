# Integration Notes — Opus Review Feedback

## Integrating (11 items)

### 1. Vercel SPA rewrites (Critical)
**Integrating.** This is a guaranteed production bug. Adding vercel.json rewrite configuration to Section 1.

### 2. localStorage size budgets
**Integrating.** Adding explicit byte estimates and a compaction strategy (aggregate old env readings daily→weekly after 30 days). Adding graceful quota-exceeded handling.

### 3. Deep reactivity strategy
**Integrating.** Specifying that all mutations must go through `commit()` which replaces sub-trees. No deep Proxy nesting. Simple event-emitter pattern for cross-component communication.

### 5. Strain database lazy-loading
**Integrating.** Dynamic `import()` when strain picker first opens. Debounced filtering.

### 6. Font loading resilience
**Integrating.** Adding `&display=swap` to Google Fonts. Self-hosting as a future option. Specifying fallback stacks.

### 7. Trichome slider edge case
**Integrating.** Specifying: when other sliders are both 0%, split freed percentage equally. 1% granularity, integer snapping.

### 8. XSS mitigation
**Integrating.** Adding a security section mandating `escapeHtml()` on all user strings, `textContent` for user data, `innerHTML` only for trusted templates.

### 11. Spec conflict (sliders vs stars)
**Integrating.** Adding explicit note to plan that star-rating approach superseded slider approach per interview Q29.

### 12. Accessibility plan
**Integrating.** Adding accessibility section: focus management on route changes, keyboard operability, WCAG AA contrast, prefers-reduced-motion.

### 13. Between-grows state
**Integrating.** Adding between-grows dashboard specification to Section 4.

### 15. Error boundary / crash recovery
**Integrating.** Adding error recovery strategy: friendly error screen, export-before-reset, "Reset app" escape hatch, migration failure handling.

## NOT Integrating (6 items)

### 3. Plant Doctor extraction effort estimate
**Not integrating as change.** The reviewer is correct that it's more work than a file move, but Section 14 already says "redesigned" and Section 19 describes a phased approach. The plan already positions Plant Doctor as the biggest effort item. Adding a note about incremental extraction vs. big-bang.

### 4. Replace Proxy store with simpler event-emitter
**Partially integrating.** Keeping the Proxy store concept but specifying immutable-style mutations (commit replaces sub-trees, no deep nesting). The event-emitter is already part of the plan (EventTarget event bus). Not replacing the entire architecture.

### 9. Migration rollback / separate URL deploy
**Not integrating.** The plan already preserves old keys as backup. Adding a "Restore old data" button is reasonable (integrated above in error recovery). But deploying to a separate URL adds complexity for a community project with a small user base. The backup preservation is sufficient.

### 10. Vertical slice implementation order
**Not integrating as restructure.** The current order is designed for dependency chains (store before task engine before dashboard). However, each section can produce a minimal working version first. The implementation order is a guideline, not a strict waterfall. Adding a note about prototyping the core loop early within the existing order.

### 14. Chart library recommendation
**Not integrating.** The reviewer suggests uPlot (~35KB) from CDN. Staying vanilla as per user requirement. Charts will be minimal SVG polylines for now — just a visual trend, not interactive chart widgets. Scoping down rather than adding a library.

### 16-17. API coexistence / multi-grow data model
**Not integrating as structural changes.** For #16: the admin panel is being removed (interview Q3). API functions will be cleaned up in Phase 3 of migration. For #17: wrapping grow in an array now is premature abstraction. If multi-grow is needed, a migration adds it cleanly. The user confirmed "one active grow at a time" and wasn't interested in multi-grow.
