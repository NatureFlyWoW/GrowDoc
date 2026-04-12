# Consolidated User Questions

Questions from all 5 council reviewers, deduplicated and organized for a single sit-down when the user returns. Answer these to unlock the next phase of work.

## Priority 1 — Answers change the roadmap

1. **End-state vision:** Is GrowDoc a daily active-grow tool (pilot checklist), a retrospective learning log (analytics), or both equally?
2. **Monetization:** Passion project, portfolio piece, or business? If business: freemium model viable?
3. **Solo developer?** If you could add one person (designer, engineer, cultivation expert), who first?
4. **Feature freeze vs iteration:** Stabilize current features (polish + bugs) or keep shipping aggressively?
5. **Photo integration:** The camera modal exists but isn't wired. Is this known debt or deprioritized? Why? (Top user-facing gap per product + architecture review.)

## Priority 2 — Answers affect technical decisions

6. **Offline-first hard constraint?** localStorage + PWA is deliberate. Would cloud sync / multi-device become valuable later, or is privacy/simplicity the permanent direction?
7. **The async infection:** Three top-level awaits (task-engine, doctor-ui, timeline-bar) slow app boot and caused one production-down incident. Should we (a) remove all top-level awaits and lazy-load the edge-case engine, or (b) accept the boot delay and harden the init sequence?
8. **Silent error handling:** 15+ empty catch blocks swallow errors silently. Should we add a global error toast/banner, or keep the app "quiet" and just log to console?
9. **Test strategy:** Currently ~45-50% test coverage with browser-only test runner. Should we invest in (a) Playwright CI, (b) Node-based unit tests, (c) keep the current /test runner and expand coverage there?
10. **Cultivation contradictions:** 7 parameter conflicts found (VPD ranges, drying temps, amber %, epsom timing). Should Franco resolve these authoritatively in one pass, or do you want to review each and decide?

## Priority 3 — Answers inform content + knowledge

11. **Growing experience:** Do you have direct growing experience, or are you relying on Franco/Professor agents? (Affects edge-case rule confidence.)
12. **Strain data freshness:** 200+ strains in the database. How often do you refresh it? Should it be crowdsourced?
13. **Geographic scope:** US/Canada only, or should localization (EU strain names, metric defaults) be considered?
14. **IPM depth:** IPM coverage is limited to 3 pests. Is this deliberate (keep it simple) or a gap to fill (thrips, broad mites, aphids, whiteflies, PM treatment protocols)?

## Priority 4 — Answers inform growth strategy

15. **Current user base:** How many active users? What's their #1 request?
16. **Churn:** Have early users stopped? If so, why?
17. **Success metrics:** What does success look like in 6 months? (1K users? Feature parity with X? Monetization?)
18. **Competitors:** Have you tracked Grow with Jane, Leafwire, or others recently? Any feature that feels urgent to match?
19. **Use patterns:** Do users run GrowDoc during a grow (daily) or after (retrospective)?
20. **Target expansion:** Should GrowDoc expand to small commercial (5-20 plants), multi-grower households, or mentor-mentee pairs?
