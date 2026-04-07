# Opus Review Integration Notes

## Integrating (Critical + Important)

### 1. Design System Ambiguity (Critical #1)
**Integrating.** Opus correctly identified that each doc has slightly different color values. Plan will specify: use `glossary.html` as the canonical reference and copy its exact `:root` block. All tools use identical variables.

### 2. Iframe NOT Sandboxed (Critical #2)
**Integrating.** The research doc was wrong — no `sandbox` attribute on the iframe. This is good (localStorage works) but tools must namespace keys carefully since they share the parent's origin storage.

### 3. Light-Theme Sidebar (Critical #3)
**Integrating.** The sidebar (`style.css`) uses a light cream/tan theme, NOT the dark theme used inside docs. The `.cat-tool` styles must be designed for light backgrounds (`--sidebar-bg: #e8dcc8`). Critical fix — the plan's proposed dark glow effects would be invisible on light backgrounds.

### 4. DLI Formula Consistency (#4)
**Integrating.** Use `PPFD × hours × 0.0036` everywhere. Drop the `3600/1000000` variant.

### 5. Expert Mode Simplification (#5)
**Integrating.** Opus is right — expert mode as described is effectively a second tool. Simplify: expert mode shows all questions as a scrollable form (still sequential/dependent), not a flat feature matcher. No fuzzy scoring needed — just a long-form version of the same tree traversal.

### 6. Cure Tracker State Gaps (#6)
**Integrating.** Add: day 7+ means 7 calendar days since harvest date. Add "Back to Drying" transition from curing. Completed summaries saved in localStorage history before reset.

### 7. Filter Count Excluding Tools (#9)
**Integrating.** Filter count must exclude tools: `docs.filter(d => d.category !== 'tool' && ...)`.

### 8. VPD Chart Resolution (#8)
**Integrating.** Use 5°C temp steps × 5% RH steps = 65-cell grid. Render once, only update position marker on input change. Simplified table view on mobile.

### 9. Three-State Toggle → Radio Buttons (#13)
**Integrating.** Use three radio buttons (Pass/Fail/N/A) per item instead of cycling toggle. More accessible and avoids cycling UX problem.

### 10. Mobile Nav Tools Ordering (#10)
**Integrating.** Give tool pills `.cat-tool` class with distinct accent border color. Sort tools first in mobile nav array.

### 11. Cure Tracker Error Recovery (#15)
**Integrating.** Before resetting corrupted state, show warning + option to export raw JSON to clipboard.

## NOT Integrating

### Plant Doctor File Size (#7)
**Not integrating as a plan change.** The tree can be compressed with shared result templates and abbreviated text. 500KB API limit only applies to saving via API — tools are committed via git push, no size limit. Will note as an implementation consideration.

### Print Styles (#12)
**Marking as out of scope for initial build.** Can be added in a polish pass.

### Language Choice (#19)
**Not integrating.** Tools will be in English (matching most existing docs). German glossary is the exception.

### Emoji Compatibility (#14)
**Not integrating as plan change.** The stethoscope and jar emojis have wide support (2019/2021). Can swap during implementation if testing reveals issues.

### Implementation Order (#16)
**Keeping current order.** Stealth Audit before Cure Tracker is intentional — the simpler checklist validates localStorage patterns before the complex state machine.

### Frontend Developer Agent References (#17)
**Removing.** Replace with concrete design decisions in the plan.
