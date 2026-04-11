# Section 9b — Cure Advisor (Follow-Up, Not Shipped)

**Status.** Deferred from the note-contextualizer plan. This file captures the intent so the follow-up is easy to pick up.

## Why deferred

Opus review flagged that Section 9 as originally scoped required:
1. A full decision-rule matrix for five recommended actions (`burp-now | wait | open-longer | seal | stop`) that a subagent cannot invent without Franco consultation.
2. A rewrite of `docs/tool-cure-tracker.html` from standalone HTML tool to Companion SPA view (3–5 days of work).
3. Historical cure data mining from `archive` + `outcomes` keys that is otherwise unused by the app.

The user's Q5 interview answer (all four parameters: burp freq, RH range, dry time, strain profiles) is honored by locking this follow-up design here, but the full feedback loop doesn't ship in this iteration.

## What DID ship in Section 9a

- Cure notes are collected as Observations (`source:'cure'`) by `collectObservations`.
- Cure note input has severity chip + parsed-signal strip.
- Cure notes appear in the observation index and debug waterfall.
- Cure notes feed into the general note-contextualizer pipeline — if a user writes "smells amazing day 7, want to finish early", that observation shows up in harvest advice and the weekly summary.

## What the follow-up needs

### Decision-rule matrix (requires Franco consultation)

Five actions, each with a trigger condition. Franco should author these as a single `CURE_DECISION_RULES` array:

```js
{
  action: 'burp-now' | 'wait' | 'open-longer' | 'seal' | 'stop',
  condition: (state) => boolean,
  confidence: (state) => 0..1,
  reasoning: (state) => string[],
}
```

Where `state = { currentDay, currentRH, currentTemp, recentNotes, strainProfile }`.

Example rules Franco might write:
- `burp-now` when `currentRH > 65 && currentDay < 14`.
- `wait` when `currentRH between 58-62 && currentDay >= 7`.
- `open-longer` when `currentRH > 68 && currentDay > 5` (mold risk).
- `seal` when `currentRH < 55 && noRecentOpeningNotes`.
- `stop` when `currentDay > 90 && currentRH stable 58-62`.

### Strain profile schema

New localStorage key `growdoc-companion-cure-profiles`:

```js
{
  version: 1,
  profiles: {
    [strainSlug]: {
      sampleCount: number,
      preferredRH: { min, max, p50 },
      typicalDryDays: number,
      typicalCureDays: number,
      avgBurpIntervalHours: number,
      commonIssues: string[],
      lastUpdated: ISO,
    }
  }
}
```

### Backfill strategy

- **Forward-only from follow-up deploy.** Users see `strainProfileApplied: false` until they complete their next cure. UI shows "Using default curve; profile builds after this cure" hint.
- **Optional historical walk.** Scan `archive` + `outcomes` keys for past grows with cure notes, seed initial profiles. Can be deferred to a second sub-section.

### UI rewrite

- `docs/tool-cure-tracker.html` → `js/views/cure-view.js` as a Companion SPA view.
- `js/components/cure-note-form.js` — new component with severity chip, parsed-signal strip, strain picker.
- `js/data/cure-advisor.js` — exports `getCureAdvice`, `updateCureProfile`, `getCureProfile`.
- Data migration from `localStorage['growdoc-cure-tracker']` to the new key. Preserve existing user notes.

### Integration with the note-contextualizer (already shipped)

- `getCureAdvice` calls `getRelevantObservations(store, {plantId: null, domains: ['cure-burp','cure-dry','aroma']})` to read user notes.
- Cure actions log real cure-burp observations via the existing observation pipeline.
- Strain profiles are derived from observations, not from raw cure-tracker state.

## Estimated scope

- Decision rules: Franco session + 0.5d encoding ≈ 1 day.
- Strain profile module + storage: 1 day.
- cure-view rewrite: 2 days.
- Data migration + tests: 1 day.
- Deploy: 0.5 day.

**Total: ~5–6 days.** Fits in one deep-implement session if Franco's rules are captured first.

## Blocking question for the follow-up

Before starting 9b, ask Franco to author `CURE_DECISION_RULES`. Without that, the follow-up cannot begin.
