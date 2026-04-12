# GrowDoc First Review — Master Index

Council review completed 2026-04-12 by 5 parallel reviewers. 22 findings files organized by domain.

## How to use this index

Each file is self-contained with `# Title` + summary line. Read only the files relevant to your current task. Cross-references between files use filenames, not deep links.

## Architecture (Architect Reviewer)

- [arch-overview.md](arch-overview.md) — Module dependency graph, data flow, API surface
- [arch-risks.md](arch-risks.md) — Top 10 architectural risks ranked by severity
- [arch-debt.md](arch-debt.md) — Technical debt inventory grouped by severity
- [arch-recommendations.md](arch-recommendations.md) — Top 5 improvements by impact/effort ratio

## Product (Product Manager)

- [product-feature-audit.md](product-feature-audit.md) — 30+ features with maturity ratings (shipped/partial/stub/missing)
- [product-gaps.md](product-gaps.md) — Top 10 UX gaps ranked by user-impact (1-5 scale)
- [product-strategy.md](product-strategy.md) — Moat, competitors, growth vectors, top investment
- [product-user-questions.md](product-user-questions.md) — 20 strategic questions for the user

## Cultivation Accuracy (Franco)

- [cultivation-accuracy.md](cultivation-accuracy.md) — Audit of every cultivation claim: wrong, oversimplified, missing caveats, properly debunked
- [cultivation-gaps.md](cultivation-gaps.md) — Missing knowledge: IPM, medium-specific, harvest precision, autoflower durations
- [cultivation-contradictions.md](cultivation-contradictions.md) — 7 places where codebase files contradict each other on the same parameter
- [cultivation-edge-case-coverage.md](cultivation-edge-case-coverage.md) — Edge-case completeness rating (7/10) + 8 missing scenarios

## Quality Assurance (QA Expert)

- [qa-test-coverage.md](qa-test-coverage.md) — Coverage map: 25 modules, ~628 assertions, 10+ modules untested, ~45-50% coverage
- [qa-critical-untested.md](qa-critical-untested.md) — Top 10 critical untested paths ranked by risk
- [qa-test-quality.md](qa-test-quality.md) — 6 test quality problems in existing tests
- [qa-testing-strategy.md](qa-testing-strategy.md) — Recommended strategy: framework, CI, priority targets

## Error Patterns (Error Detective)

- [errors-silent-failures.md](errors-silent-failures.md) — 15 silent failure points (empty catch blocks, swallowed promises)
- [errors-async-boundaries.md](errors-async-boundaries.md) — Async/sync boundary mismatches, top-level await chains
- [errors-data-corruption.md](errors-data-corruption.md) — Data loss/corruption paths in localStorage, migration, concurrent commits
- [errors-recommendations.md](errors-recommendations.md) — Top 10 error-handling improvements ranked by impact

## Cross-Cutting Themes

These themes appear across multiple reviewers:

1. **The async/await infection** — Top-level awaits in main.js, timeline-bar.js, task-engine.js, doctor-ui.js create a fragile initialization chain. Already caused one production-down incident (DOMContentLoaded race). See: arch-risks.md, errors-async-boundaries.md, qa-critical-untested.md.

2. **Cultivation data contradictions** — 7 parameter conflicts across knowledge files (VPD ranges, drying temps, amber percentages, epsom timing). See: cultivation-contradictions.md, cultivation-accuracy.md.

3. **Silent failure culture** — 15+ empty catch blocks swallow errors including import failures, localStorage quota, and migration crashes. See: errors-silent-failures.md, arch-debt.md.

4. **Test coverage gaps** — ~45-50% coverage with 10+ modules completely untested. The async-related production bug would have been caught by a single integration test. See: qa-test-coverage.md, qa-critical-untested.md.

5. **Photo integration missing** — Camera modal exists but is not wired. Top user-facing gap per product review. See: product-gaps.md, product-strategy.md.

## Summary file

- [REVIEW-SUMMARY.md](REVIEW-SUMMARY.md) — Product manager's executive summary (written by PM agent)
