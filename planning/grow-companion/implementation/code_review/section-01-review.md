# Section 01: App Shell, Sidebar & Routing -- Code Review

## Summary

Solid foundational implementation that delivers the HTML shell, CSS design system, sidebar navigation, client-side router, test infrastructure, and Vercel SPA rewrites. The code is well-organized with clean module boundaries, good accessibility defaults, and comprehensive inline tests. There is one critical XSS vulnerability in the error screen and several important issues around sidebar state management and missing test coverage that should be addressed before merging.

---

## CRITICAL

### C1. XSS vulnerability in `showErrorScreen` via `message` parameter

**File:** `C:/GrowDoc/js/main.js`, `showErrorScreen` function (approx. line 72-87 in the new file)

The `message` parameter is interpolated directly into an `innerHTML` template literal without escaping:

```js
function showErrorScreen(message) {
  document.body.innerHTML = `
    <div class="error-screen">
      <h1>Something Went Wrong</h1>
      <p>${message}</p>
      ...
```

Currently `message` is only called with hardcoded strings (`'App structure is missing. Please reload.'`, `'Something went wrong during startup.'`), so the risk is low today. However, this function is the designated error recovery handler. If any future code passes user-influenced data (e.g., an error message from a thrown exception, or localStorage-sourced content), this becomes a direct XSS vector. Given that the section plan explicitly states "Use `innerHTML` only for trusted template strings that contain no user data" and that `escapeHtml` exists in `utils.js` for exactly this purpose, this should be fixed now.

**Recommended fix:** Either use `textContent` for the message, or import and apply `escapeHtml`. The safest approach is DOM construction:

```js
function showErrorScreen(message) {
  document.body.innerHTML = ''; // clear
  const screen = document.createElement('div');
  screen.className = 'error-screen';
  const h1 = document.createElement('h1');
  h1.textContent = 'Something Went Wrong';
  const p = document.createElement('p');
  p.textContent = message;
  // ... append buttons ...
  screen.appendChild(h1);
  screen.appendChild(p);
  document.body.appendChild(screen);
}
```

---

## IMPORTANT

### I1. Sidebar uses module-level mutable state -- fragile and test-hostile

**File:** `C:/GrowDoc/js/components/sidebar.js`, lines 725-729 (in diff numbering)

```js
let _collapsed = false;
let _container = null;
let _store = null;
let _activeRoute = null;
let _hasActiveGrow = false;
```

Five module-level mutable variables store all sidebar state. This creates several problems:

1. **Tests mutate shared state directly** -- the test function reaches in and sets `_hasActiveGrow = false` and `_activeRoute = '/dashboard'` to test behaviors. This couples tests tightly to internal implementation details.
2. **No cleanup between test runs** -- if the test runner were invoked twice, the second run would inherit stale state from the first.
3. **Full re-render on every change** -- `_render()` is called for every state change (collapse toggle, active route update, grow state change), rebuilding the entire sidebar DOM each time. For Section 01 this is acceptable, but as the app grows this will cause noticeable flicker or performance issues.

**Recommended fix (for now):** At minimum, add a `_reset()` or `_destroy()` function that tests can call to restore initial state. Consider grouping state into a single object for clarity. The full re-render approach is fine for now but should be noted as a future refactor target when views get heavier.

### I2. `_isActive` has a false-positive matching bug

**File:** `C:/GrowDoc/js/components/sidebar.js`, `_isActive` function

```js
function _isActive(path) {
  if (!_activeRoute) return false;
  return _activeRoute === path || _activeRoute.startsWith(path + '/');
}
```

This will incorrectly mark the "My Grow" parent (`/grow`) as active when the route is `/grow/training`, `/grow/environment`, etc. -- which is the desired behavior for group highlighting. However, it will also produce a false positive if two unrelated routes share a prefix. For example, if a route `/growing-tips` existed, visiting it would cause `/grow` to match via `startsWith('/grow/')`. The current route table does not have this collision, but the logic is fragile.

More concretely for the current routes: the child link for "Plants" at path `/grow` will show as active for ANY `/grow/*` sub-route because `_activeRoute === '/grow'` is false but `_activeRoute.startsWith('/grow/')` is true. Wait -- actually no, the child checks `_isActive(child.path)` where child.path is `/grow`, and `'/grow/training'.startsWith('/grow/')` is true, so the "Plants" child link will incorrectly appear active when any other `/grow/*` sub-route is visited.

**Recommended fix:** For child links, use exact matching only. Reserve the `startsWith` prefix matching for parent group highlighting in `_isGroupActive`. One approach:

```js
function _isExactActive(path) {
  return _activeRoute === path;
}
```

Use `_isExactActive` for child links and `_isActive` (with prefix matching) only for parent items.

### I3. `nav-child-link` elements are `<a>` tags with `aria-disabled="true"` but remain in tab order

**File:** `C:/GrowDoc/js/components/sidebar.js`, between-grows disabled child links

When `_hasActiveGrow` is false, disabled child links get `aria-disabled="true"` and a click handler that calls `preventDefault()`. However:

1. The link's `href` attribute is still set, so right-click "Open in new tab" would navigate there.
2. The link is still focusable and in the tab order -- `aria-disabled` does not remove focusability.
3. Keyboard users pressing Enter on the focused disabled link will trigger the default navigation since the `click` event listener only handles mouse clicks; keyboard activation of links fires a `click` event, but it is worth verifying this works correctly across browsers.

**Recommended fix:** Either remove the `href` attribute on disabled links (or set `href="#"`) and add `tabindex="-1"`, or use a `<span>` instead of `<a>` for disabled items. Also add `role="link"` to the span so screen readers still understand the semantics.

### I4. Missing "Restore backup" button in error recovery screen

**File:** `C:/GrowDoc/js/main.js`, `showErrorScreen` function

The section plan specifies (item 4 under Error Recovery): "Offer 'Restore backup' button if pre-migration backup keys exist." The implementation only provides "Reload App", "Export Your Data", and "Reset App Data". The restore-from-backup functionality is missing.

**Recommended fix:** Add a fourth button that checks for `growdoc-companion-backup-*` keys in localStorage and, if found, offers to restore them. If no backup keys exist, the button should be hidden.

### I5. Router tests do not cover first-visit redirect or auth guard behavior

**File:** `C:/GrowDoc/js/router.js`, `runTests()` function

The plan specifies these test cases:
- "First visit without profile redirects to landing page"
- "First visit with profile redirects to dashboard"

Neither is tested. The `_handleRoute` function contains the logic for these redirects, but `runTests()` only tests `matchRoute()` (pure function) and does not exercise `_handleRoute`, `initRouter`, or the auth guard logic.

This is understandable since testing navigation side effects in a browser-based inline test is harder than testing pure functions. However, at minimum a comment acknowledging the gap would help, and ideally a test that mocks `localStorage` and verifies redirect behavior.

**Recommended fix:** Add tests that:
1. Clear `localStorage` of `growdoc-companion-profile`, call `_handleRoute`, and verify the view rendered is `landing`.
2. Set a profile in localStorage, call `_handleRoute` from `/`, and verify the view rendered is `dashboard`.

This may require exporting `_handleRoute` or creating a testable wrapper.

### I6. Sidebar `role="navigation"` is on the inner `div`, but the outer `<nav>` already has `aria-label="Main navigation"`

**File:** `C:/GrowDoc/index.html` line 16 and `C:/GrowDoc/js/components/sidebar.js` render function

The HTML has:
```html
<nav id="sidebar" aria-label="Main navigation"></nav>
```

Then the JS `_render()` creates a child `div` with:
```js
navList.setAttribute('role', 'navigation');
navList.setAttribute('aria-label', 'Main navigation');
```

This results in a nested navigation landmark: `<nav aria-label="Main navigation"><div><div role="navigation" aria-label="Main navigation">`. Screen readers will announce two navigation landmarks with the same label, which is confusing.

**Recommended fix:** Remove `role="navigation"` and `aria-label` from the inner `navList` div. The outer `<nav>` element already provides the navigation landmark semantics.

---

## SUGGESTIONS

### S1. Icon sprite file created but not used

**File:** `C:/GrowDoc/assets/icons.svg`

An SVG sprite file with `<symbol>` definitions was created (43 lines, 7 icons), but `sidebar.js` uses inline SVG strings in the `_getIcon` function instead of referencing the sprite via `<use href="/assets/icons.svg#icon-dashboard">`. This means the icon definitions are duplicated -- once in the sprite file and once as inline strings.

**Recommended fix:** Either remove `assets/icons.svg` (if the inline approach is preferred) or refactor `_getIcon` to use `<svg><use href="/assets/icons.svg#icon-${name}"></use></svg>`. The sprite approach is generally better for cacheability and maintainability, though it requires a network request for the sprite file.

### S2. Test runner renders results using `innerHTML` with unescaped module names and error messages

**File:** `C:/GrowDoc/js/main.js`, `renderTestRunner` function

Test result messages (`r.msg`) and error messages (`err.message`) are inserted via `innerHTML` without escaping:

```js
output.innerHTML += `<div style="padding-left:16px">${icon} ${r.msg}</div>`;
output.innerHTML += `<div style="color:var(--status-urgent);margin-top:12px">ERROR ${mod.name}: ${err.message}</div>`;
```

Since test messages are developer-controlled strings, the XSS risk is negligible. However, for consistency with the project's security conventions and to model good practices for future sections, these should use `escapeHtml` or `textContent`.

### S3. Consider using `<ul>/<li>` for nav item lists

**File:** `C:/GrowDoc/js/components/sidebar.js`, `_render` function

The sidebar nav items are rendered as `<a>` elements inside a `<div>`. Using a `<ul>/<li>` structure would give screen readers better context about the number of items in the navigation and their grouping. This is a minor accessibility enhancement.

### S4. `debounce` test only checks return type

**File:** `C:/GrowDoc/js/utils.js`, test section

The debounce test only asserts `typeof debounce(() => {}, 100) === 'function'`. It does not test that the debounced function actually delays execution. While a full async timing test is complex for inline assertions, even a basic test with `setTimeout` and a counter would add meaningful coverage.

### S5. Mobile bottom nav padding may clip content on devices with safe area insets

**File:** `C:/GrowDoc/css/layout.css`, mobile styles

```css
#content {
  padding-bottom: calc(var(--space-16) + var(--space-8));
}
```

This uses a fixed calculation for bottom padding to account for the fixed bottom nav. On devices with home indicator bars (iPhone X+), content may still be clipped. Consider adding `env(safe-area-inset-bottom)` to the padding calculation.

### S6. `app.js` (the old entry point) was not moved to legacy

**File:** `C:/GrowDoc/app.js`

The plan says "move old to `/legacy/index.html`" which was done for `index.html`. The old `app.js` was copied to `legacy/app.js`, but the original `app.js` in the root appears to still exist (it was not deleted in the diff). Similarly, `style.css` was copied to `legacy/style.css` but the root `style.css` was not removed. This is fine if intentional (preserving backward compatibility), but if the old doc viewer is fully replaced, these root files are dead code.

---

## POSITIVE

### P1. Clean module boundary design

Each module (`router.js`, `sidebar.js`, `utils.js`, `main.js`) has a clear, well-documented public API with `export` functions matching the plan's specified signatures. The store stub in `main.js` is appropriately minimal with a clear comment that it will be replaced in Section 02.

### P2. Comprehensive CSS design system

`variables.css` defines all tokens from the plan exactly -- colors, typography, spacing, radii, transitions, and shadows. The spacing scale is consistent (4px base). The sidebar width tokens are defined as CSS custom properties, enabling the grid-based layout to respond to collapse state changes via a single class toggle.

### P3. Good accessibility foundations

Focus management on route changes (setting `tabindex="-1"` and calling `.focus()`), `aria-current="page"` on active nav items, `aria-expanded` on the collapse toggle, `focus-visible` outlines on all interactive elements, and `prefers-reduced-motion` respect in both `layout.css` (blanket override) and `components.css` (individual transitions wrapped in media queries). This is a strong baseline.

### P4. Correct SPA rewrite pattern

The Vercel rewrite regex `/((?!api|legacy|assets|css|js|docs).*)` correctly uses a negative lookahead to exclude all the necessary path prefixes. This matches the plan exactly and will prevent 404s on browser refresh of SPA routes.

### P5. Legacy files preserved properly

The old `index.html`, `app.js`, and `style.css` were copied to `/legacy/` before replacing `index.html`. This provides a rollback path and preserves the original doc viewer at `/legacy/index.html`.

### P6. Thoughtful error recovery

The error screen correctly operates without depending on the store or router (static HTML fallback). The export-data function filters localStorage keys by prefix and generates a timestamped JSON download. The reset function uses `confirm()` before destructive action. These are solid defensive patterns.

### P7. Router implements all plan requirements

All 18 routes from the plan are defined. Parameterized route matching works via regex conversion. Trailing slash normalization, auth guards, first-visit detection, and unknown-route fallback are all implemented. The link interception correctly checks for `data-external` attribute to allow opt-out.

---

## Files Reviewed

- `C:/GrowDoc/index.html`
- `C:/GrowDoc/css/variables.css`
- `C:/GrowDoc/css/layout.css`
- `C:/GrowDoc/css/components.css`
- `C:/GrowDoc/js/main.js`
- `C:/GrowDoc/js/router.js`
- `C:/GrowDoc/js/utils.js`
- `C:/GrowDoc/js/components/sidebar.js`
- `C:/GrowDoc/js/tests/vercel-config.test.js`
- `C:/GrowDoc/assets/icons.svg`
- `C:/GrowDoc/vercel.json`
- `C:/GrowDoc/legacy/index.html`
- `C:/GrowDoc/legacy/app.js`
- `C:/GrowDoc/legacy/style.css`
