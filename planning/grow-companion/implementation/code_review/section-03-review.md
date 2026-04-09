# Section 03: Landing Page & Onboarding Wizard -- Code Review

**Reviewer:** Code Review Agent  
**Date:** 2026-04-08  
**Files reviewed:**  
- `js/views/onboarding.js` (900 lines -- new file)  
- `css/onboarding.css` (262 lines -- new file)  
- `js/main.js` (diff: view map registration, test runner entry)  
- `index.html` (diff: onboarding.css link)  

---

## Summary

The implementation is a faithful translation of the section 03 plan. All 10 wizard steps are present, the landing page matches the spec, validation rules are correct, the completion flow generates the expected profile and plants data structures, and tests cover the required scenarios. The code uses the design system variables correctly and avoids innerHTML for user content. There are a few issues that need attention, the most critical being the `runTests()` function using `await` inside a non-async function body.

---

## CRITICAL

### C1. `runTests()` uses `await` but is not declared `async`

**File:** `js/views/onboarding.js`, line 703 / line 829  
**Description:** The function signature is `export function runTests()` (synchronous), but line 829 uses `await import('../store.js')`. In strict mode (ES modules are always strict), this is a syntax error -- `await` is only valid inside an `async` function. This means either: (a) the test file will fail to parse entirely, preventing ALL onboarding tests from running, or (b) if the browser parses it as a top-level await edge case, the returned `results` array will be incomplete because the `await` expression resolves after the function has already returned.

**Fix:**
```js
// Change line 703 from:
export function runTests() {
// To:
export async function runTests() {
```
Also verify that the test runner in `main.js` awaits the result of `runTests()` when it is async.

---

### C2. `_completeOnboarding` ignores its parameter -- container passed but not received

**File:** `js/views/onboarding.js`, lines 595 and 633  
**Description:** The summary step calls `_completeOnboarding(container)` passing the container element, but the function signature is `function _completeOnboarding()` with zero parameters. The `container` argument is silently dropped. This works today because the function does not need the container, but it creates a misleading API contract and could mask bugs if the function is later modified to use the parameter. More importantly, `navigate('/dashboard')` fires at the end and triggers a full re-render, so the container reference is not needed -- but the caller's intent is unclear.

**Fix:** Either remove the argument from the call site (`() => _completeOnboarding()`) or add the parameter to the function signature for clarity.

---

## IMPORTANT

### I1. Module-level mutable state creates cross-test contamination risk

**File:** `js/views/onboarding.js`, lines 107, 128  
**Description:** `_store` and `_wizardState` are module-level `let` variables. The tests directly reassign these (e.g., `_wizardState = _defaultState()`), which works within the test function body because they share the module scope. However, exporting `_wizardState` on line 698 exports a live binding -- external consumers reading this export will see the reassigned values, which is intentional for tests but fragile. More critically, if `renderOnboarding()` is ever called during a test run (or between test blocks), it will reset `_wizardState` via `_defaultState()`, potentially corrupting in-progress test assertions.

The cleanup block at lines 896-897 resets state, which is good. But the tests that call `_renderWizard()` (which attaches a `container.onkeydown` handler) could leak event listeners to detached DOM nodes. This is minor but worth noting.

**Recommendation:** Consider wrapping the wizard state in a factory function or closure to make tests fully isolated, or at minimum document the fragility.

---

### I2. Keyboard Enter handler may fire on input/textarea/select elements unexpectedly

**File:** `js/views/onboarding.js`, lines 197-203  
**Description:** The keyboard handler on `container.onkeydown` listens for `Enter` to advance the wizard. However, on steps with text inputs (step 4: plant count, step 6: strain name, step 7: space dimensions), pressing Enter while focused on an input field will trigger the advance behavior AND potentially submit nothing (or worse, advance past a step the user is still filling out). This is particularly problematic on step 4 where the user types a plant count -- pressing Enter after typing "5" will immediately advance past the step.

**Fix:** Check the event target before advancing:
```js
container.onkeydown = (e) => {
  // Don't intercept Enter on form elements
  const tag = e.target.tagName;
  if (e.key === 'Enter' && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) return;
  // ... existing logic
};
```

---

### I3. Wattage input does not validate negative or unreasonable values

**File:** `js/views/onboarding.js`, line 638  
**Description:** The wattage input uses `parseInt(input.value, 10)` but the field has `min="1"` only as an HTML attribute (advisory, not enforced). A user could type -100 or 99999. The `_validateStep` for step 3 only validates that a lighting type is selected, not the wattage value. While wattage is optional, if provided, it should be sanitized to a reasonable range (e.g., 1-5000W).

**Fix:** Add range validation in `_validateStep` case 3:
```js
case 3: {
  if (!_wizardState.lighting) return { valid: false, error: 'Please select a lighting type.' };
  const w = _wizardState.lightWattage;
  if (w !== null && (w < 1 || w > 5000)) return { valid: false, error: 'Wattage must be 1-5000W.' };
  return { valid: true };
}
```

---

### I4. `_renderSummaryStep` Edit button uses fragile DOM traversal

**File:** `js/views/onboarding.js`, line 579  
**Description:** The edit button handler does `container.closest('.wizard')?.parentElement || container.parentElement` to find the wizard's parent for re-rendering. The `container` here is the `.wizard-step` div. The traversal depends on the exact nesting structure (`.wizard-step` inside `.wizard` inside the main content area). If the DOM structure changes, or if the summary is rendered in a test container (as it is in the tests), the `closest('.wizard')` call returns `null` and falls back to `container.parentElement`, which may not be the correct re-render target.

**Fix:** Pass the root container reference explicitly through the render chain rather than traversing the DOM.

---

### I5. No back button on the summary step (step 10)

**File:** `js/views/onboarding.js`, line 164  
**Description:** The navigation rendering condition is `if (_wizardState.step > 1 && _wizardState.step < TOTAL_STEPS)`, meaning step 10 (summary) gets neither a back button nor a next button. Users on the summary screen who want to go back to step 9 must use the "Edit" links or browser back. The plan says "Back button on each step (except step 1)" -- step 10 should have a back button.

**Fix:** Change the condition to `if (_wizardState.step > 1)`:
```js
if (_wizardState.step > 1) {
  const backBtn = document.createElement('button');
  // ...
}
```

---

### I6. Strain name not sanitized on input, only on storage

**File:** `js/views/onboarding.js`, lines 399-400, 664  
**Description:** The strain name is stored raw in `_wizardState.strainName` during input, then `escapeHtml()` is called only during `_completeOnboarding()` at line 664. This is fine because all display uses `textContent` (safe), but the summary step on line 550 displays `_wizardState.strainName` via `textContent`, which is also safe. However, the escaped value is stored as `strainCustom.name` in the plant object -- meaning downstream code will see `&amp;` instead of `&` in strain names containing special characters. This is double-encoding if the downstream display also uses `textContent`.

**Fix:** Store the raw string and let the display layer handle escaping, or if `innerHTML` will be used downstream, escape at display time rather than storage time.

---

## SUGGESTION

### S1. Inline styles should be in the CSS file

**File:** `js/views/onboarding.js`, multiple locations  
**Description:** Several elements use inline `style` properties instead of CSS classes:
- Line 97-98: `btn.style.fontSize`, `btn.style.padding` on the Get Started button
- Line 659: `input.style.maxWidth`, `input.style.fontSize`, `input.style.textAlign` on plant count input
- Line 590-593: Complete button has four inline style properties
- Lines 213-215: `_showStepError` uses inline styles for color/fontSize/marginTop

These should be CSS classes for maintainability and to keep the JS focused on behavior.

---

### S2. Selection cards use `role="radio"` without a `role="radiogroup"` parent

**File:** `js/views/onboarding.js`, lines 573-574  
**Description:** Each selection card has `role="radio"` and `aria-checked`, which is correct. But the parent `.selection-cards` container does not have `role="radiogroup"` or `aria-label`. The priority step (line 797) correctly sets `role="radiogroup"` on the star rating container, showing the pattern is known. Apply it consistently.

**Fix:** In `_renderSelectionCards`, add to the `cards` div:
```js
cards.setAttribute('role', 'radiogroup');
cards.setAttribute('aria-label', title);
```

---

### S3. Arrow key navigation not implemented for selection cards

**File:** `js/views/onboarding.js`  
**Description:** The plan mentions keyboard navigation. While Enter/Space work on individual cards, and Enter/Escape work globally for step navigation, there is no arrow key navigation between radio-like selection cards. This is the standard expected keyboard pattern for `role="radio"` elements -- users expect left/right or up/down arrow keys to move between options.

---

### S4. `_completeOnboarding` calls `navigate('/dashboard')` but dashboard view is not yet registered

**File:** `js/views/onboarding.js`, line 693; `js/main.js`, line 42  
**Description:** The view map in `main.js` only has `landing`, `onboarding`, and `test-runner`. The `dashboard` view is not registered. When the wizard completes and navigates to `/dashboard`, the router will render a placeholder "Dashboard -- This view is coming soon." This is expected (section 09 dependency noted in the plan), but there is no user feedback that explains why they are seeing a stub. Consider adding a congratulatory message or redirect note.

---

### S5. Test for profile creation calls `_completeOnboarding()` which triggers `navigate('/dashboard')`

**File:** `js/views/onboarding.js`, line 846  
**Description:** The test at line 846 calls `_completeOnboarding()`, which calls `navigate('/dashboard')` at the end. This will actually modify the browser history during test execution. The comment on line 843 says "Mock navigate to prevent actual navigation" but no actual mocking occurs -- `origNavigate` captures the pathname but is never used. This causes side effects during testing: the URL changes and the router may attempt to render the dashboard view.

**Fix:** Either mock `navigate` before the test or refactor `_completeOnboarding` to accept a callback/flag for skipping navigation in test mode.

---

### S6. Default plant count of 3 is an assumption not in the plan

**File:** `js/views/onboarding.js`, line 115  
**Description:** The default `plantCount` is set to 3. The plan does not specify a default value -- it only says the input has `min=1, max=20`. A default of 3 means a user who skips step 4 entirely (which they cannot do since it validates) or who simply clicks Next without changing the value will get 3 plants. This is a reasonable default but is an undocumented assumption.

---

### S7. Progress dots lack accessible labels

**File:** `js/views/onboarding.js`, lines 143-151  
**Description:** The progress dots are purely visual with no ARIA labels. Screen reader users cannot tell which step they are on from the dots alone. The step heading provides some context, but the dots themselves are inaccessible.

**Fix:** Add `aria-label` to each dot and wrap in a region:
```js
progress.setAttribute('role', 'navigation');
progress.setAttribute('aria-label', `Step ${_wizardState.step} of ${TOTAL_STEPS}`);
```

---

## POSITIVE

### P1. Correct use of `textContent` throughout -- no XSS risk

All user-facing text is set via `textContent` or DOM element creation, never via `innerHTML` with user data. The `escapeHtml()` usage on strain name during storage is belt-and-suspenders. This is excellent defensive practice.

### P2. Design system compliance

Every CSS custom property used in `onboarding.css` is defined in `variables.css`. No hardcoded colors or fonts were introduced (the one `rgba(143, 184, 86, 0.08)` on the selected card is a transparent variant of `--accent-green`, which is acceptable since CSS custom properties do not support alpha channel modification natively).

### P3. `prefers-reduced-motion` respected

Transitions on wizard dots and selection cards are wrapped in `@media (prefers-reduced-motion: no-preference)`, which is the correct approach per the plan requirement.

### P4. Complete plan coverage

All 10 steps are implemented. The landing page has the correct hero text, three feature cards, and Get Started button. The wizard has progress dots, back/next navigation, validation, and a summary with edit links. The completion flow creates profile, generates plants, sets grow start date, persists to localStorage, and redirects. All planned tests are present.

### P5. Clean data model

The profile and grow objects created in `_completeOnboarding` are well-structured with clear field names, version number, and complete plant initialization including empty arrays for future logs/diagnoses.

### P6. Good fallback strategy for section 05 dependency

The strain picker correctly falls back to a simple text input with a hint that per-plant assignment comes later, exactly as the plan prescribes.

---

## Checklist vs Plan

| Plan Item | Status | Notes |
|-----------|--------|-------|
| Landing page with hero + 3 features + Get Started | Done | Matches spec |
| 10-step wizard | Done | All steps present |
| Step 1: Stage selector | Done | 13 options as specified |
| Step 2: Medium selector | Done | 4 options with descriptions |
| Step 3: Lighting + optional wattage | Done | Wattage validation could be tighter (I3) |
| Step 4: Plant count 1-20 | Done | Validation correct |
| Step 5: Pot size required | Done | 7 options as specified |
| Step 6: Strain picker fallback | Done | Text input with hint |
| Step 7: Space dimensions optional | Done | L x W x H in cm |
| Step 8: Experience level | Done | 5 options with descriptions |
| Step 9: Priorities + conditional effect | Done | Star ratings with correct colors |
| Step 10: Summary with edit links | Done | All sections shown |
| Progress dots | Done | Correct completed/current states |
| Back button (except step 1) | Deviation | Missing on step 10 (I5) |
| Skip forward for optional fields | Done | Steps 6, 7 skip correctly |
| Keyboard navigation | Partial | Enter/Escape work but may conflict with inputs (I2) |
| Profile creation on complete | Done | Correct structure |
| Plant generation on complete | Done | Correct count, pot size, stage |
| Grow start date set | Done | ISO string |
| Redirect to dashboard | Done | Via navigate() |
| Tests: step navigation | Done | 3 tests |
| Tests: validation | Done | 6 tests |
| Tests: profile creation | Done | But runTests is not async (C1) |
| Tests: summary display | Done | Content verification |
| CSS: mobile responsive | Done | Breakpoint at 768px |
| CSS: reduced motion | Done | Correctly implemented |
| Sanitization via escapeHtml | Done | But double-encoding concern (I6) |
