# Interview Synthesis — User Answers (2026-04-12)

All 20 council questions answered. This is the authoritative reference for all future planning.

## North Star

Maximize plant outcomes through personalized guidance. Not a social app, not vanity metrics. The app replaces grow-anxiety with confidence — "All good" green banner is permission to walk away from the tent.

## Core Decisions

| # | Question | Answer | Implication |
|---|----------|--------|-------------|
| 1 | Vision | Both daily tool AND retrospective analytics | Every feature must serve real-time AND generate valuable historical data |
| 2 | Monetization | Passion project, open-source aspirational | No payment flows, no accounts. Keep codebase open-source-clean |
| 3 | Team | User is project engineer, Claude agents are dev team | Optimize for clear planning artifacts, small files, review checkpoints |
| 4 | Feature freeze | Stabilize first | Fix contradictions, harden errors, improve tests BEFORE new features |
| 5 | Photos | Not now, maybe someday | Skip photo integration entirely. Hard to get right without cloud storage |
| 6 | Offline-first | Pragmatic, not philosophical | Would take better storage (IndexedDB, cloud) if it appeared. Don't over-invest in localStorage |
| 7 | Async infection | Remove all top-level awaits | Lazy-load edge-case engine on first use. Sync boot. Stabilization sprint priority |
| 8 | Error handling | Log all, surface only critical | Console.error in every catch. UI banner only for data loss / boot crash |
| 9 | Tests | Expand /test runner + 1 Playwright smoke test | Lean, zero deps. The smoke test asserts `__growdocStore` exists (catches boot failures) |
| 10 | Contradictions | Franco resolves all 7 authoritatively | No user review needed per contradiction |
| 11 | Growing experience | General plant instincts, developing cannabis knowledge | Franco stays the cannabis authority. User's gut reliable on general plant health |
| 12 | Strain database | Manual curation, no schedule | Personal reference, not comprehensive catalog |
| 13 | Geography | EU-first, from EU growers for EU growers | Metric default, EU breeders/strains prioritized |
| 14 | IPM | Full coverage | Expand beyond spider mites / gnats / botrytis in a future content sprint |
| 15 | Users | Solo user, friends are first growth vector | Own grow is the validation test |
| 16 | Churn | N/A — under construction | Stabilization sprint = first real daily-use period |
| 17 | Success | Feature + quality milestones, not user counts | "Guided me seed-to-cure with zero anxiety" is the bar |
| 18 | Competitors | Not interested, hasn't looked | Origin: "stop me from checking plants every 10 minutes" |
| 19 | Use patterns | Casual, on-demand, curiosity-driven | Must work in 10-second glances AND 20-minute deep dives |
| 20 | Expansion | One tent, one grow, nail basics first | Multi-tent, multi-grower, experiments all deferred |

## Stabilization Sprint Scope (derived from answers)

1. Remove all top-level awaits, lazy-load edge-case engine
2. Add console.error to every empty catch block, add critical-failure UI banner
3. Franco resolves 7 cultivation contradictions
4. Expand /test runner to untested modules
5. Add 1 Playwright smoke test (boot assertion)
6. Harden localStorage (quota management, backup/restore)
7. Fix the mites-raise-rh advice rule (add stage filter — most dangerous contradiction)

## What NOT to build

- Photo integration
- Cloud sync / accounts
- Payment / freemium
- Multi-tent / multi-grower
- Competitor feature matching
- Strain database crowdsourcing
- Node-based test framework
