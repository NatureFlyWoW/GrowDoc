# GrowDoc Interactive Tools — Interview Transcript

## Q1: Scope — How many tools to build?
**A:** Start with 3-4 most useful tools first, add more later.

## Q2: Audience — Who are the newbies?
**A:** Eventually public. Start private but design for a wider audience later.

## Q3: Persistence — Browser or shared?
**A:** Browser-only (localStorage). Each person's tool state is private to their device.

## Q4: Which 3-4 tools to build first?
**A:** All four suggested:
1. **Plant Doctor** (symptom checker) — interactive diagnosis wizard
2. **VPD Calculator** — temp + humidity → VPD with visual guidance
3. **Drying & Cure Tracker** — day-by-day protocol with checkboxes and timers
4. **Stealth Audit Checklist** — monthly security audit with scoring

## Q5: Access model?
**A:** Fully open (no login needed). Tools are just HTML pages — anyone with the URL can use them.

## Q6: Plant Doctor UX — Wizard or form?
**A:** Wizard with 'expert mode' toggle. Default step-by-step wizard for newbies, toggle to show all fields at once for pros.

## Q7: VPD Calculator scope?
**A:** Calculator + visual VPD chart + DLI calculator combined into one environment dashboard. Enter temp/humidity, see VPD value AND position on color-coded chart with optimal zones per stage.

## Q8: Cure Tracker — Single or multi-harvest?
**A:** Single harvest tracker. One active drying/curing session, simple and focused. Reset when done.

## Q9: Sidebar placement for tools?
**A:** Top of sidebar, always visible. Pin tools above the priority groups so they're always one click away.

## Q10: Visual style for interactive elements?
**A:** Slightly elevated/distinct — same color palette but interactive elements get a subtle glow or different card treatment so they feel "alive" vs static docs. Consult with frontend developer agent for best design results.
