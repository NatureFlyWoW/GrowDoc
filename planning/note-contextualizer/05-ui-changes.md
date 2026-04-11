# 05 — UI Changes

Per `feedback_notes_everywhere` — notes and context affordances on every decision point.

## 1. Severity chip (on every note input)

Three chips — `info` / `watch` / `alert`. Keyboard shortcuts 1/2/3. Default `info`.

Appears on:
- Log form Notes field
- Task card Notes expander
- Stage-transition confirmation prompt (currently has no note input at all)
- Cure burp notes
- Plant-detail Context Notes textarea

Auto-infer severity as a *default*: e.g. "plants dying" pre-selects `alert`, "looking happy" pre-selects `info`. User can always override. See open question #5.

## 2. Parsed-signal preview strip

Right under every textarea, a collapsible "What I read from this" strip showing the top 3 `parsed.keywords` ids that fired, color-coded by `DOMAIN_BY_RULE_ID`:

```
What I read: [nutrients: ph-low] [watering: overwater-risk] [action-taken: flushed]
```

Updates on blur. Confirms to the user that their observation was heard by the system.

## 3. Contradiction banner

When a new note contradicts a recent structured field (e.g. user types "pH was 5.0 from the runoff" but `log.details.pH` on an earlier log today is 6.2), show a yellow banner:

> ⚠ Note conflicts with earlier log (pH 6.2 logged 2h ago). Please confirm which value is correct.

Uses `var(--warning)` from `docs/_design-system.md`.

## 4. Stage-transition note capture (new)

The Advance Stage card in Dashboard currently has no note input. Per Notes On Everything, add a collapsible "Add context" textarea to the confirm prompt. The note is captured as an Observation with `source:'stage-transition'` and `domains:['timeline']`.

## 5. Plant Detail "Recent observations" widget (new)

A new sidebar/section on Plant Detail listing the last 5 observations across all sources (log + task + plant + stage-transition) with domain chips. Clicking an observation scrolls to its source log/task.

## 6. Task suppression traceability

When an observation blocks a task (I5: "just flushed" kills the next water task), show the task in a muted state with a quoted note beneath:

```
✓ Water NL#3 — suppressed
  You said 2h ago: "already flushed with 6.0 pH today"
```

See open question #6 for the alternative treatments.

## Design system compliance

- All new chips, banners, and pills use CSS custom properties from `docs/_design-system.md` — `var(--accent)`, `var(--warning)`, `var(--muted)`, `var(--surface-raised)`.
- No new fonts or colors.
- All new inputs are ≥16px font-size per section-10 mobile rule (avoids iOS auto-zoom).
- New UI respects mobile bottom nav (margin-bottom: 64px on floating panels).
