# Section 03: Landing Page & Onboarding Wizard

## Overview

This section builds the first-visit landing page and the 10-step setup wizard that collects the grower's profile data. On completion, the wizard creates the profile in the store, generates initial plants, and redirects to the dashboard. This is the first user-facing flow after the shell is in place.

**Tech stack:** Vanilla JS (ES modules), HTML5, CSS3. The wizard is a multi-step form rendered into the main content area via the router.

---

## Dependencies

- **Section 01 (App Shell):** Router, main content area, CSS design system
- **Section 02 (Store/Storage):** Store for persisting the profile, storage for localStorage writes
- **Section 05 (Strain Database):** The strain picker component is used in step 6. If section 05 is not yet implemented, step 6 can use a simple text input as a fallback.

## Blocks

- **Section 09 (Dashboard):** The dashboard is the destination after onboarding completes.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/views/onboarding.js` | Setup wizard flow (10 steps) |
| `/css/onboarding.css` | Wizard-specific styles |

The landing page can be implemented as a view function within `onboarding.js` or as a separate landing view. It renders into the main content area (not a separate HTML file).

---

## Tests (Implement First)

### Onboarding Tests

- **Starts at step 1:** wizard starts at step 1 (stage selection)
- **Back button:** back button returns to previous step
- **Progress dots:** progress dots reflect current step
- **Skip forward:** skip-forward works for optional fields
- **Profile creation:** completing all steps creates profile in store
- **Initial plants:** completing all steps generates initial plants array
- **Summary screen:** summary screen shows all selections

### Validation Tests

- **Plant count range:** plant count must be 1-20
- **Pot size required:** pot size selection is required
- **Priority defaults:** priority stars default to 3 if unset
- **Effect type conditional:** effect type selector appears only when Effect >= 3 stars

---

## Implementation Details

### Landing Page View

The landing page is shown on first visit (when no profile exists in localStorage). The router detects this condition and shows the landing view at `/`.

**Content:**
- Clean, minimal, purely functional design
- Hero text: app name ("GrowDoc") + one-line value proposition (e.g., "Your daily cannabis grow companion")
- Three feature highlights (cards or bullet points):
  1. Daily task engine -- "Know exactly what to do each day"
  2. Environment optimization -- "VPD, DLI, and nutrient targets tuned to your setup"
  3. Diagnostic tools -- "Identify and fix plant problems fast"
- Single "Get Started" button that routes to `/setup`
- Dark theme consistent with the rest of the app (uses design system variables from `variables.css`)

### Onboarding Wizard (onboarding.js)

A multi-step form where each step is one screen with one question (or a small group). The wizard maintains internal state tracking the current step and accumulated answers, then commits everything to the store on completion.

**Steps:**

**Step 1 -- "What stage is your grow?"**
Stage selector with options: Germination, Seedling, Early Veg, Late Veg, Transition, Early Flower, Mid Flower, Late Flower, Ripening, Harvest, Drying, Curing, or "Planning / Not started yet". Rendered as large clickable cards or radio buttons.

**Step 2 -- "What's your growing medium?"**
Four options: Soil / Coco / Hydro / Soilless. Each with a brief one-line description. Rendered as selectable cards.

**Step 3 -- "What lighting are you using?"**
Four options: LED / HPS / CFL / Fluorescent. Plus an optional wattage number input field. The wattage field is not required (skip-forward allowed).

**Step 4 -- "How many plants?"**
Number input with min=1, max=20. Validated: must be a positive integer in range.

**Step 5 -- "What pot size?"**
Dropdown or button group: 1L, 3L, 5L, 7L, 10L, 15L, 20L+. Applied to all plants initially; users can customize per-plant later in the plant management section. This field is required.

**Step 6 -- "What strain(s)?"**
Strain picker component (from section 05). Search the 500+ strain database, select a strain, or "Add custom strain" with name + flowering weeks. If plant count > 1, allow assigning one strain per plant or one strain for all. If the strain picker is not yet available, fall back to a simple text input for strain name.

**Step 7 -- "How big is your grow space?"**
Three number inputs: Length x Width x Height in cm. These fields are optional (skip-forward allowed).

**Step 8 -- "What's your experience level?"**
Five options with brief descriptions:
- First Grow -- "Brand new to growing"
- Beginner -- "A grow or two under your belt"
- Intermediate -- "Comfortable with the basics"
- Advanced -- "Dialing in for optimal results"
- Expert -- "You could write the guides"

**Step 9 -- "What are your priorities?"**
Four star-rating inputs (1-5 stars each):
- Yield (green, `--priority-yield`)
- Quality (gold, `--priority-quality`)
- Terpenes (purple, `--priority-terpenes`)
- Effect (indigo, `--priority-effect`)

Stars default to 3 if the user does not interact. If Effect >= 3 stars, reveal an effect type selector dropdown with options: Energetic, Relaxing, Creative, Pain Relief, Anti-Anxiety, Sleep.

The star-rating component is the same one defined in section 06 (Priority System). If section 06 is not yet available, implement a basic version here.

**Step 10 -- Summary**
Show all selections in a readable summary format. Each section has an "Edit" link that returns to that step. Primary action: "Looks good? Start Growing" button.

**UX Details:**
- Progress dots at top showing current step (10 dots, current one highlighted)
- Back button on each step (except step 1)
- Skip forward allowed for non-critical fields (wattage in step 3, space dimensions in step 7)
- Keyboard navigation: Enter advances, Escape goes back
- All user text inputs sanitized via `escapeHtml()` before storage

**On completion (clicking "Start Growing"):**
1. Create profile object in store with all collected data
2. Generate initial plants array based on plant count, strain selection, pot size
3. Set grow start date to today
4. Set initial stage from step 1 selection
5. Calculate first round of tasks (if task engine is available)
6. Persist to localStorage via storage.save()
7. Redirect to `/dashboard`

**Signature:**

```javascript
// onboarding.js
export function renderLanding(container) { /* ... */ }
export function renderOnboarding(container, store) { /* ... */ }

// Internal (not exported, but documenting for clarity):
// function renderStep(stepNumber, wizardState) { /* ... */ }
// function validateStep(stepNumber, wizardState) -> {valid: Boolean, error: String}
// function completeOnboarding(wizardState, store) { /* ... */ }
```

### CSS (onboarding.css)

- Step container with centered content, max-width for readability
- Progress dots: row of small circles, filled for completed steps, outlined for current, empty for future
- Selection cards: clickable cards with hover/focus states, selected state with accent border
- Star rating inline styles (may share with section 06)
- Mobile-responsive: steps stack vertically, inputs full-width
- Transitions between steps (slide or fade, respecting `prefers-reduced-motion`)

---

## Implementation Checklist

1. Write onboarding tests (step navigation, progress dots, skip forward, profile creation, plants generation, summary display)
2. Write validation tests (plant count range, pot size required, priority defaults, effect type conditional)
3. Create `css/onboarding.css` with wizard-specific styles
4. Implement landing page view (hero, features, Get Started button)
5. Implement wizard step rendering framework (step container, progress dots, back/next navigation)
6. Implement step 1: Stage selector
7. Implement step 2: Medium selector
8. Implement step 3: Lighting selector with optional wattage
9. Implement step 4: Plant count input with validation
10. Implement step 5: Pot size selector (required)
11. Implement step 6: Strain picker integration (or text input fallback)
12. Implement step 7: Space dimensions inputs (optional)
13. Implement step 8: Experience level selector
14. Implement step 9: Priority star ratings with conditional effect type
15. Implement step 10: Summary screen with edit links
16. Implement completion flow: profile creation, plant generation, initial task calculation, redirect
17. Register landing and onboarding views with the router
18. Verify all onboarding tests pass
19. Verify all validation tests pass
20. Test full flow: landing -> setup -> all 10 steps -> dashboard redirect
