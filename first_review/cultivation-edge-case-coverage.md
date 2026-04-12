# Edge-Case Knowledge Completeness

Summary: Edge-case coverage is strong (27 primary + 26 supplemental entries). Rating: 7/10. Several common real-world scenarios are missing.

## Well Covered

Post-transplant stress (4 entries), heat stress recovery (3), autoflower traps (3), hermie risk windows (2), pH/EC lockout cascades (4), clone specifics (3), drought recovery (2), late-flower emergencies (3), cold snap (2), deficiency mimics (4), equipment context (7), sensor artifacts (3). This is above-average for a grow companion app.

## Missing Scenarios

- **Root rot recovery protocol**: root-health article (knowledge-articles.js:219-224) describes symptoms and prevention but no recovery steps. Edge cases mention H2O2 for rehydration (edge-case-knowledge.js:562) and root rot in hydro (rules-advice.js:239-250) but no soil root rot recovery sequence (cut dead roots, dry back, beneficial inoculant, gradual return to feed).

- **Coco-specific CalMag with RO vs tap water**: grow-knowledge.js:157-163 gives coco CalMag doses (2-3ml/L) but does not differentiate between RO water (needs full dose) and hard tap water (may need zero additional CalMag). The supplemental edge case (edge-case-knowledge-supplemental.js:446-461) covers tap water overcorrection but only for soil, not coco specifically.

- **LED light burn vs heat stress differentiation**: doctor-data.js has separate conditions for Light Burn and Heat Stress but the diagnostic refinement questions (CORE_REFINE_RULES) do not ask "Are temperatures normal?" for light burn or "Is the light close?" for heat stress. These two conditions have overlapping symptoms (bleaching, tacoing) and need better differential questions.

- **Outdoor-to-indoor transition**: No edge case or article covers bringing an outdoor plant indoors. Key issues: pest quarantine, photoperiod shock, light acclimation, root zone temperature change. Completely absent.

- **Revegging after accidental harvest or light schedule mistake**: No coverage. Happens when a grower chops too early or has timer failures. Recovery protocol (18/6 light, patience, deformed growth is normal) is absent.

- **Clones from unknown source (friend, dispensary)**: clone edge cases (edge-case-knowledge.js:356-408) assume a known cutting event. No guidance on quarantine protocol for clones of unknown history (pest inspection, isolation period, gradual introduction).

- **First-grow calibration**: The system asks about experience level but no edge case addresses the specific pattern where a first-timer misreads normal plant behavior as problems (e.g., cotyledon yellowing, lower leaf senescence in flower, purple stems from genetics not cold).

- **Power outage during flower**: advisor-microcopy.js has no entry for multi-hour power outage (carbon filter stops, dark period interrupted, temperature swings). This is a common real-world emergency.
