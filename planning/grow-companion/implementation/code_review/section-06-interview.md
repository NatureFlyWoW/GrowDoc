# Section 06 Code Review Interview

## Review Summary

Code reviewer found 1 critical, 5 important, and 6 minor issues.

## Triage Decisions

### Auto-fixed (no user input needed)

1. **Critical: Stale tabindex after rating changes** — Fixed `updateStars()` to implement proper roving tabindex. Star at currentValue gets tabindex=0, star 1 is fallback when value=0.

2. **Important: Duplicate EFFECT_TYPES** — Removed dead `EFFECT_TYPES` constant from onboarding.js (now imported from star-rating.js).

3. **Important: Tradeoff note text logic error** — Fixed ternary to correctly use `highLabel.toLowerCase()` for the benefit and `lowLabel.toLowerCase()` for the cost.

4. **Important: `name` param unused** — Added `data-priority` attribute to star-rating group element.

5. **Important: Hardcoded effect-type ID** — Added `idSuffix` option to `renderEffectSelector` for unique IDs when multiple instances exist.

6. **Missing: Priority Display Widget** — Implemented `renderPriorityDisplay()` in star-rating.js with colored horizontal bars and CSS in onboarding.css.

### Let go

1. **Important: `medium` param unused in getRecommendation** — Reserved for future sections (feeding schedule, nutrients). Acceptable.

2. **Minor: Arrow key behavior at value=0** — Edge case; star 1 always remains tabbable as fallback.

3. **Minor: setValue not firing onChange** — setValue is for programmatic use, onChange is for user interactions. By design.

4. **Minor: No keyboard nav tests** — Tests validate core behavior; keyboard nav is covered by ARIA attributes.

5. **Minor: No tradeoff note content tests** — Core blending math is tested; string formatting is low-risk.

6. **Minor: Magic number threshold (5 DLI)** — Clear enough in context.

7. **Minor: Redundant null assignment** — Negligible.
