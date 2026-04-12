# Stabilization Sprint — Interview Transcript

## Context

Research was skipped — the council review (`first_review/`) and 20-question user interview (`first_review/interview-synthesis.md`) already provide comprehensive context. This interview focused on implementation-specific decisions.

## Q1: Critical-failure UI banner placement

**Q:** Where should the critical-failure banner appear?
**A:** Top of page, below sidebar header. Fixed position, pushes content down, always visible until dismissed.

## Q2: Lazy-load pattern for edge-case engine

**Q:** How should the edge-case engine load?
**A:** First function call. `getActiveEdgeCases()` loads the engine on first invocation via a memoized async getter, caches the result for subsequent calls. ~50ms delay on first use only.

## Q3: Test expansion scope

**Q:** Which untested modules matter most?
**A:** Cover everything equally. Add `runTests()` to every module that has meaningful logic, including low-risk ones. Target: raise assertion count and file coverage from ~45% to ~70%+.

## Q4: Playwright smoke test automation

**Q:** Should the Playwright smoke test run automatically?
**A:** Manual only. Run locally with `npx playwright test` when needed. No CI pipeline / GitHub Actions.

## Q5: Backup/restore fix

**Q:** Fix the broken Restore Backup button (namespace mismatch found by error detective)?
**A:** Yes, fix backup/restore as part of this sprint. Critical safety net.

## Q6: Cultivation fixes scope

**Q:** Should Franco also fix the neem-in-flower advice rule (advice-mites-spray) alongside the 7 contradictions?
**A:** Yes, fix all cultivation issues together. Bundle neem spray stage filter + mites-raise-rh fix + all 7 contradictions in one pass.
