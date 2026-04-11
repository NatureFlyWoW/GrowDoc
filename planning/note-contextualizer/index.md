# Note Contextualizer — Planning Index

Source: note-contextualizer agent analysis, 2026-04-11.
Goal: make user-written notes flow end-to-end into Companion advice, task generation, and reviews. Pain signal: "notes feel ignored by the AI".

## Sections

- [01-audit.md](01-audit.md) — Current state: where notes are stored, captured, and (mostly) dropped on the floor
- [02-gap-analysis.md](02-gap-analysis.md) — Specific code paths that ignore notes, schema gaps, missing weighting policy
- [03-design.md](03-design.md) — Observation schema, projection strategy, contextualizer module layout, merge/weighting algorithm
- [04-integration-points.md](04-integration-points.md) — Exact files + functions that need wiring (I1–I14)
- [05-ui-changes.md](05-ui-changes.md) — Severity chips, parsed-signal preview, contradiction banner, Notes-On-Everything touches
- [06-section-breakdown.md](06-section-breakdown.md) — 8 proposed /deep-plan sections with scope, files, TDD notes
- [07-open-questions.md](07-open-questions.md) — 8 arbitration items (superseded by 08-decisions.md)
- [08-decisions.md](08-decisions.md) — **LOCKED** user arbitration decisions (2026-04-11) — read this first before any section

## Core finding

Two parallel note systems exist but do not talk. The mature rule base in `docs/note-context-rules.js` (2947 lines, 984 keyword patterns) is only used by the standalone `docs/tool-plant-doctor.html`. The Companion app's task engine, priority engine, harvest advisor, and its own embedded plant doctor either read raw note strings or ignore notes entirely. **11 of 14 Companion advisor surfaces drop notes on the floor.**

## One-line fix direction

Introduce a unified `js/data/note-contextualizer/` module that (a) wraps every existing note source as an `Observation` via projection (no migration), (b) **forks** the v3 rule base to ES modules (v3 tool is deprecated), (c) kills the redundant `parseProfileNotes`, (d) adds recency + severity + franco-override weighting, (e) wires every Companion advisor/task-generator to consume it, and (f) brings the Cure Tracker into the same pipeline.

## Plan size after decisions

**9 sections** (was 8 — Cure Tracker section added per Q7). Sections 4–6 are where the "notes feel ignored" pain vanishes. Section 9 is the Cure Tracker extension.
