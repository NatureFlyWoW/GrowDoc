# 07 — Open Questions (arbitration needed before /deep-plan)

Per `feedback_ask_when_unsure`. Each question has a recommendation in **bold**; these become defaults unless the user overrides.

## Q1 — Bridge or fork the rule base?

`docs/note-context-rules.js` is ES5 (no `const`, no arrow fns, no `import`) because the standalone v3 tool loads it via `<script>` tag.

- **(a) Bridge** — keep the ES5 file, add a thin ES module wrapper that imports it via `<script src>` side effects and re-exports `window.KEYWORD_PATTERNS`. Zero duplication, one source of truth.
- **(b) Fork** — copy data into ES module files under `js/data/note-contextualizer/` and delete the old file when v3 tool is retired.
- **(c) Migrate v3 tool to ES modules** — big side-quest.

**Recommendation: (a)** — lowest risk, preserves v3 tool stability. Diff is small.

---

## Q2 — Observation store: projection vs persistent?

- **Projection** (proposed): rebuild `grow._observationIndex` on each commit. No migration, no quota impact.
- **Persistent:** new `growdoc-companion-observations` key with versioned schema + migration.

**Recommendation: start with projection**, add a `needsReindex` dirty flag + incremental update if perf ever becomes an issue with thousands of notes. Simpler and reversible.

---

## Q3 — Should the contextualizer subsume `parseProfileNotes`?

`js/data/profile-context-rules.js` (267 lines) is the second smaller parser. Options:

- **(a) Subsume** — delete `profile-context-rules.js`, merge its rules into `rules-keywords.js` with a `source-step` tag. Cleaner architecture, larger diff.
- **(b) Wrap** — leave `parseProfileNotes` in place, contextualizer calls it internally. Smaller diff, slight redundancy.

**Recommendation: (b) wrap** for this iteration. Schedule (a) as a cleanup section after sections 1–8 ship.

---

## Q4 — Severity enum mismatch

`log.details.severity` is currently `urgent|concern|null`. New schema uses `alert|watch|info`.

- **(a) Rename + migration** — breaks existing logs.
- **(b) Alias in contextualizer** — `urgent→alert, concern→watch, null→info`. Zero migration.

**Recommendation: (b)**. Keep on-disk compat.

---

## Q5 — Auto-infer severity from text?

Per Notes On Everything, zero-friction is preferred. "plants dying" → pre-select `alert`.

- Pros: zero friction.
- Cons: false positives.

**Recommendation: auto-infer as a *default*, user can override. Show inferred severity as a pre-selected chip.** Manual override is always one tap away.

---

## Q6 — Task suppression UX

When a user note blocks a water task ("already flushed"), show:

- (a) silently hide the task
- (b) muted "Suppressed by your note" card
- (c) task shown with checkmark + quoted note inline

**Recommendation: (c)** — traceability. User sees the system "heard" them and the quoted note doubles as confirmation. Section 7 covers the UI.

---

## Q7 — Cure tracker integration

`docs/tool-cure-tracker.html` also captures free-text notes that never flow anywhere.

- **(a) Fold in** — add ~1 S section, wrap cure notes as Observations too.
- **(b) Out of scope** — defer to a later iteration.

**Recommendation: (b) defer** — cure notes don't drive task generation; focus this iteration on the living plant advice loop.

---

## Q8 — Plant Doctor v3 standalone tool — still primary?

The v3 tool (`docs/tool-plant-doctor.html`) has the working contextualizer. The Companion embedded plant doctor (`js/plant-doctor/*`) is what sees live plant data.

- If v3 tool is deprecated → Section 2 can delete `docs/note-context-rules.js` after porting.
- If v3 tool is still primary for deep diagnosis → must keep the bridge working (Q1 option a).

**Recommendation: ask the user directly.** This affects Q1.
