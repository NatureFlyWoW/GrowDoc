<!-- SECTION_MANIFEST
section-01-data-model.md|Section 01: Data Model & State Changes|1
section-02-treatment-text.md|Section 02: Treatment Text Data Model Migration|2
section-03-ui-questions.md|Section 03: UI — Medium/Lighting Questions & Badges|3
section-04-scoring-engine.md|Section 04: Scoring Engine — Medium & Lighting Modifiers|4
section-05-ca-fix.md|Section 05: Ca Mobility Fix & Wizard Tree Rerouting|5
section-06-pests-hermie.md|Section 06: New Pest & Hermie Diagnostic Paths|6
section-07-vpd-context.md|Section 07: VPD Context & Enhanced Notes|7
section-08-integration-tests.md|Section 08: Integration Tests & Plant Science Validation|8
END_SECTION_MANIFEST -->

# Plant Doctor v3 — Section Index

## Dependency Graph

```
Section 01 (Data Model) ──┐
                          ├──→ Section 03 (UI Questions)
Section 02 (Treatment) ───┘         │
                                    ├──→ Section 04 (Scoring)
                                    │         │
                                    │    Section 05 (Ca Fix) ──┐
                                    │                          ├──→ Section 08 (Tests)
                                    │    Section 06 (Pests) ───┘
                                    │         │
                                    └──→ Section 07 (VPD) ─────┘
```

## Batching Strategy

- **Batch 1:** Sections 01, 02 (parallel — data model changes, no UI overlap)
- **Batch 2:** Sections 03, 04 (parallel — UI and scoring, depend on batch 1)
- **Batch 3:** Sections 05, 06, 07 (parallel — content additions, depend on batch 2)
- **Batch 4:** Section 08 (tests — depends on all above)

## Sections

1. **section-01-data-model.md** — State properties, localStorage profile, journal schema, reset functions
2. **section-02-treatment-text.md** — Convert checkFirst/fixes to object maps, resolveMediumText helper, makeResult update
3. **section-03-ui-questions.md** — Medium/lighting question nodes, badges, ROOT change, expert/multi-dx integration
4. **section-04-scoring-engine.md** — medium_modifier, lighting_modifier, scoreDiagnoses signature, getAdjustedConfidence, modifier clamping
5. **section-05-ca-fix.md** — Reroute both Ca paths, update existing rule-ca-vs-mg, add q-spot-growth-location
6. **section-06-pests-hermie.md** — 6 new result nodes, 8 new symptoms, scoring entries, wizard branches, refine rules, urgency UX
7. **section-07-vpd-context.md** — vpdContext property, enhanced notes placeholders, CSS for VPD info box
8. **section-08-integration-tests.md** — Plant science validation tests, medium/lighting tests, backward compat tests
