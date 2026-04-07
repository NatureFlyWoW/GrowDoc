# Interview Transcript — Plant Doctor v2

## Q1: Mode Design
**Q:** For the multi-symptom selector, should this be a new third mode (alongside Wizard and Expert), or should it enhance the existing Expert mode?
**A:** New "Multi-Dx" mode — a separate mode with chip/checkbox symptom selection UI, keeps Expert mode unchanged.

## Q2: Knowledge Base Strategy
**Q:** How should we handle the knowledge base? Reuse v1 TREE result nodes or build a unified new structure?
**A:** Reuse v1 result nodes + add scoring layer. Build a symptom-weight map that points to existing result nodes. V1 tree stays intact for wizard mode.

## Q3: Follow-Up Depth
**Q:** How deep should the treatment tracking go?
**A:** Full treatment journal — multiple check-ins over time, visual timeline, stored history of what was tried and outcomes.

## Q4: Adaptive Question Placement
**Q:** Should deep questions appear inline before results, or post-results as refinement?
**A:** Inline before results — after selecting symptoms, system asks 1-3 targeted questions to refine before showing results.

## Q5: Free-Text Input Placement
**Q:** Where should users be able to type additional context?
**A:** At each diagnostic question — small "Add notes" expander on each wizard/question step.

## Q6: File Size Strategy
**Q:** If we push past 100KB, what's the priority?
**A:** Split into two files if needed — tool-plant-doctor.html + a separate plant-doctor-data.js for the knowledge base.

## Q7: Confirmation
**Q:** Multi-Dx mode presents symptoms as grouped checkboxes by plant region, asks 1-3 targeted refining questions inline, shows ranked compound results with combined fix plan. Full treatment journal for follow-ups. Correct?
**A:** Yes, that's right.
