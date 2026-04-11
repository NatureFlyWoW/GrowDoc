# Note Contextualizer — Session Handoff

**Session ended:** 2026-04-12
**Status:** Shipped. 1289/1289 tests passing in production.

## Where to pick up

The Note Contextualizer feature is fully implemented, committed, deployed, and verified against `/test` in production. Nothing is half-done. The codebase is in a clean, shippable state on `main`.

**If you're continuing work on the Note Contextualizer itself**, read the `## Known deferred work` section below. None of it is blocking.

**If you're starting a new feature**, this handoff is just a snapshot — read `memory/project_note_contextualizer.md` for the one-paragraph summary instead.

## Production URLs

- **Live (latest):** `https://growdoc-oevskjgkl-natureflywows-projects.vercel.app`
- **Test runner:** `https://growdoc-oevskjgkl-natureflywows-projects.vercel.app/test`
- **Service worker VERSION:** `2026-04-nc2`

Hard-reload once after navigating to any production URL to ensure the SW cache updates to the current build. Older `nc1` build is also live-accessible but stale.

## Git state

```
ce6d6d4 fix: three /test-runner failures from section 01-10 verification
8951ba5 section-10: note contextualizer traceability + deploy
38d12bf section-08: note contextualizer UI finalization + debug waterfall
f2e145b section-09: cure note projection + severity chip
661b1b5 section-07: task engine note-awareness + override API
e917b7f section-05+06: plant doctor note-awareness + advisor wiring
a00f0b0 section-03+04: keyword rules port + merge/weighting + legacy cleanup
e11c09d section-02: severity chip + parsed-signal strip scaffolding
49cf0a7 section-01: note contextualizer schema + projection + store hook
```

Branch: `main`. Working tree clean except for the untracked planning artifacts we never committed (`planning/note-contextualizer/01-audit.md` through `08-decisions.md`, `claude-*.md`, `reviews/`, `implementation/`). Those are design docs, not code — commit separately if you want them under version control.

## What the feature ships

- **Schema + projection:** `js/data/note-contextualizer/index.js` exposes `collectObservations`, `parseObservation`, `getObservationIndex`, `getRelevantObservations`, `mergeNoteContext`, `findActionsTakenSince`, `recordReferencedIn`, `getCitationsFor`, `__resetForTests`, `parseProfileText`.
- **Rule tables:** `rules-keywords.js` (239 rules: 83 wizard + 156 legacy ported), `rules-score.js` (31 SCORE_ADJUSTMENTS across 14 Companion conditions), `rules-advice.js` (42 ADVICE_RULES), `weighting.js` (severity-first half-life decay).
- **UI components:** `severity-chip.js`, `parsed-signal-strip.js` (upgraded), `recent-observations-widget.js`, `debug-waterfall.js`.
- **Task engine:** `task-engine-note-guards.js` (anti-redundancy, diagnose-trigger, env-contradiction, override API). Integrated into `task-engine.js` via plant-bucketed observation pass.
- **Plant doctor:** `doctor-engine.js` calls `adjustScoresFromNotes` between tally and normalization; `doctor-ui.js` renders "Your Action Plan" from `generateContextualAdvice`.
- **Advisors:** `harvest-advisor.js`, `stage-rules.js`, `priority-engine.js` all accept trailing `notes = []` parameter, backwards compatible when omitted.
- **Dashboard:** second-line status banner surfaces the most-recent alert-severity observation within 48h when task queue is empty.
- **Cure tracker:** `docs/tool-cure-tracker.html` has severity chip + parsed-signal strip on burp notes, writes `severityRaw` to new entries. `collectObservations` walks `localStorage['growdoc-cure-tracker']` for both burp and drying logs.
- **Debug surface:** `?debugNotes=1` in the URL flips a sessionStorage flag that mounts `debug-waterfall.js` as a fixed bottom panel showing raw text → parsed keywords → merged ctx → weight → citations per observation (row-cap 200).
- **Citations:** `recordReferencedIn` wired into plant-doctor/runDiagnosis, task-engine suppress/diagnose/env-discrepancy, dashboard banner. Stable colon-separated consumer ids like `plant-doctor:runDiagnosis:<plantId>`.

## Known deferred work

**1. Section-06 semantic rule ids not in KEYWORD_PATTERNS yet.**
Section-06 advisors key on rule ids like `user-thinks-early`, `user-thinks-late`, `priority-yield`, `priority-terps`, `priority-quality`, `priority-effect`, `action-taken:transplanted`, `recovering`, `bouncing-back`, `still-stressed`, `aroma-*`. Section-03's legacy port did not produce these ids — it kept the original legacy names. Advisor tests bypass this by constructing pre-parsed observations directly. Production advisor logic only triggers when these ids exist in `parseObservation` output.

**Fix:** append semantic rules to `KEYWORD_PATTERNS` in `js/data/note-contextualizer/rules-keywords.js`. Example:
```js
{ id: 'user-thinks-early', pattern: /\b(think(ing)?|feel(s|ing)?)\s+(too\s+)?early\b/i, domains: ['timeline'] },
{ id: 'priority-yield', pattern: /\b(max(imum)?|most)\s+yield\b/i, domains: ['question'] },
{ id: 'action-taken:transplanted', pattern: /\b(just\s+)?(transplanted|up[- ]?potted|potted\s+up)\b/i, domains: ['action-taken'] },
```

**2. Section-08 UX polish.**
Deferred from the original section-08 spec:
- **Contradiction banner** in `log-form.js` — detect mismatch between draft note's extracted scalar (pH, temp) and the plant's most recent log value within tolerance.
- **Journal domain filter** in plant-detail timeline — dropdown to hide logs whose parsed observations don't match selected domain.
- **Parsed-keyword chip row** under each log in the plant-detail timeline.

These are UI polish — the data layer already supports them fully.

**3. Cure advisor v2.**
Full strain-aware cure profiles and decision rules are deferred to `planning/note-contextualizer/9b-future.md` pending Franco consultation. Section-09 shipped only the projection + severity chip + auto-infer.

**4. Advisor citation wiring.**
Section-10 wired `recordReferencedIn` into plant-doctor, task-engine, and dashboard. The harvest/stage/priority-engine paths were NOT wired because their `citedObsIds` / merge `_citations` trail already carries provenance through the return value — the debug waterfall picks it up from the merge side. If you want explicit citations on those paths, add `recordReferencedIn` calls matching the consumer-id convention in section-10.md.

## Manual-verification walkthrough (if you want to smoke-test production)

1. Onboard a new plant in production.
2. Add a log with note: `"pH was 5.8 runoff, tips burning"`.
3. Navigate to Plant Doctor.
4. Expect: pH Imbalance surfaced in top 3 with boosted confidence; "Your Action Plan" block contains a pH-related advice item.
5. Add another log: `"just watered with 500ml"`.
6. Wait briefly for task regeneration, then check Dashboard.
7. Expect: water task renders with `task-card--suppressed` class + quoted-note banner + "Water now (re-blocks for 12h)" button.
8. Click the Override button.
9. Expect: a new `type:'override'` log entry in the plant timeline, task re-appears suppressed on next generation citing the new override obs.
10. Navigate to `/dashboard?debugNotes=1` and hard-reload.
11. Expect: bottom-screen waterfall panel showing all observations with citation trail.

## Troubleshooting

- **Tests fail unexpectedly in production:** bump `sw.js` VERSION and redeploy. Old SW caches may still be serving stale modules.
- **User doesn't see chip on cure tracker:** `docs/tool-cure-tracker.html` is standalone; no ES module imports. Any edit to the chip wiring needs to match the existing inline-JS pattern.
- **Plant doctor doesn't boost pH condition:** verify `parseObservation` produces `parsed.ctx.phExtracted` (not `parsed.ctx.ph`). Section-03's `applyLegacyRule` mirrors `ph → phExtracted` but only for the relaxed regex patterns added in `ce6d6d4`. If you revert that commit, pH extraction breaks.
- **Agent failures with "out of usage":** Vienna-timezone account hits daily limits at local midnight. Wait or fall back to main-thread implementation.

## Next-session starting checklist

- [ ] `cd C:\GrowDoc && git status` — should be clean on main
- [ ] `git log --oneline -5` — top commit should be `ce6d6d4 fix: three /test-runner failures`
- [ ] Hit production `/test` endpoint — should show 1289 passing
- [ ] Decide which deferred item above to tackle first (or start a new feature)
