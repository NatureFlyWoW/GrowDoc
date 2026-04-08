# Section 17: Stealth Audit -- Embedded Tool

## Overview

This section embeds the existing Stealth Audit tool within the Grow Companion's Tools section. The Stealth Audit is a standalone operational security assessment tool (currently at `/docs/tool-stealth-audit.html`) that helps indoor growers evaluate and improve their security posture across multiple categories (smell, noise, heat, light, electrical, supply chain, waste, digital, visual).

The tool is embedded as-is -- no redesign or feature changes. The implementation uses either an iframe embed (simplest, preserving full isolation) or a native extraction (rendering the tool's HTML/CSS/JS directly within the companion's content area). The iframe approach is recommended for simplicity and to ensure the Stealth Audit's independent localStorage key continues to function without interference.

**Route:** `/tools/stealth`

**Tech stack:** The Stealth Audit itself is a standalone HTML page with inline CSS and JS. The companion integration is vanilla JS (ES modules).

---

## Dependencies

- **Section 01 (App Shell):** The companion's sidebar navigation must include a "Tools" section with a "Stealth Audit" sub-item that routes to `/tools/stealth`. The main content area (`<main id="content">`) hosts the embed.

## Blocks

This section does not block any other section. It can be built in parallel with sections 09-16 and 18.

---

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `/js/views/tools.js` | Tools section view (renders Plant Doctor and Stealth Audit sub-views) |

### Existing Files (Preserved)

| File | Purpose |
|------|----------|
| `/docs/tool-stealth-audit.html` | Existing standalone Stealth Audit tool (remains as-is) |

---

## Tests (Implement First)

### Integration Tests

- **Tool accessible:** Stealth Audit tool is accessible from the Tools section via the `/tools/stealth` route. Navigating to this route renders the tool's content (either an iframe with the correct `src` or the extracted tool content).
- **Independent localStorage:** The Stealth Audit's own localStorage key (`growdoc-stealth-audit`) continues to work independently of the companion's storage keys. Saving data in the Stealth Audit does not write to or corrupt any `growdoc-companion-*` keys, and vice versa.

### Accessibility Tests

- **Keyboard navigation:** the Stealth Audit embed is reachable via keyboard navigation from the companion's sidebar
- **Iframe title (if iframe):** the iframe element has a descriptive `title` attribute for screen readers (e.g., `title="Stealth Audit Tool"`)

---

## Implementation Details

### Approach A: Iframe Embed (Recommended)

The simplest and most robust approach. The existing `tool-stealth-audit.html` is loaded in an iframe within the companion's content area.

**Rendering:**

```javascript
/**
 * In tools.js (or a stealth-specific sub-view):
 *
 * renderStealthAudit(container) -- Render the Stealth Audit tool
 *   inside an iframe. The iframe loads /docs/tool-stealth-audit.html.
 *
 *   The iframe is styled to fill the available content area:
 *   - width: 100%
 *   - height: calculated to fill viewport minus sidebar/header
 *   - border: none
 *   - background: matches companion theme
 *
 *   The iframe's title attribute is set for accessibility.
 */
```

**Implementation notes:**

- The iframe `src` is `/docs/tool-stealth-audit.html` -- this path must be excluded from the SPA rewrite rules in `vercel.json` (it already is -- the rewrite excludes `/docs/*`)
- The iframe should be sized to fill the content area. Use `calc(100vh - headerHeight)` for height or a resize observer
- The Stealth Audit has its own dark theme that is visually compatible with the companion's dark theme, so no theme synchronization is needed
- No cross-frame communication is required -- the Stealth Audit operates independently
- The iframe approach means the Stealth Audit's localStorage operations (`growdoc-stealth-audit` key) are isolated by default since they share the same origin but use a different key prefix

**Styling the iframe container:**

```css
/* In components.css or a tools-specific stylesheet */
.stealth-audit-frame {
  width: 100%;
  height: calc(100vh - 60px); /* adjust for header/nav height */
  border: none;
  background: var(--bg-primary);
  display: block;
}
```

### Approach B: Native Extraction (Alternative)

If a seamless experience is preferred (no iframe scroll-within-scroll, consistent scrollbar behavior), the Stealth Audit's HTML, CSS, and JS can be extracted and rendered directly in the companion's content area.

**Trade-offs:**
- Pro: No iframe, single scroll context, fully integrated look and feel
- Con: More complex, risk of CSS conflicts, must namespace all Stealth Audit styles, must ensure JS does not conflict with companion's global scope
- Con: Future updates to the standalone Stealth Audit require updating the extracted version too

**If choosing this approach:**
1. Extract the Stealth Audit's `<style>` block and namespace all selectors under a `.stealth-audit-container` wrapper
2. Extract the `<script>` block and wrap in a module (IIFE or ES module) to avoid global scope pollution
3. Extract the HTML body content and render it inside a container `<div class="stealth-audit-container">` in the companion's content area
4. Verify that localStorage access (`growdoc-stealth-audit` key) still works correctly

**Recommendation:** Use Approach A (iframe) unless specific UX issues arise. The iframe is simpler, safer, and easier to maintain.

### Tools Section Routing

The Tools section in the sidebar has two sub-items:
- Plant Doctor (`/tools/doctor`) -- handled by Section 15
- Stealth Audit (`/tools/stealth`) -- handled by this section

The `/js/views/tools.js` view function acts as a sub-router for the Tools section.

```javascript
/**
 * tools.js
 *
 * renderToolsView(container, store, route) -- Render the Tools section.
 *   If route is /tools/doctor: delegate to Plant Doctor view (section 15)
 *   If route is /tools/stealth: render Stealth Audit embed
 *   If route is /tools (no sub-path): render tools index with cards
 *     linking to each available tool
 *
 * renderToolsIndex(container) -- Render the Tools landing page with
 *   cards for Plant Doctor and Stealth Audit. Each card has:
 *   - Tool name and brief description
 *   - Icon
 *   - Click navigates to the tool's route
 */
```

### No State Integration

The Stealth Audit intentionally has no integration with the companion's reactive store or state management. It:

- Does NOT read from or write to `growdoc-companion-*` localStorage keys
- Does NOT participate in the companion's event bus
- Does NOT use the companion's store or dispatch/commit pattern
- Manages its own data under the `growdoc-stealth-audit` localStorage key
- Has its own independent assessment scoring and storage

This isolation is by design -- the Stealth Audit is a standalone assessment that should work even if the companion's data is reset or corrupted, and vice versa.

### Between-Grows Availability

Unlike most My Grow features, the Stealth Audit is available in between-grows state (when no active grow exists). The Tools section remains active in the sidebar regardless of grow status, since operational security assessment is not dependent on having an active cultivation cycle.

---

## Implementation Checklist

1. Write integration test: Stealth Audit accessible from `/tools/stealth` route
2. Write integration test: Stealth Audit localStorage key works independently
3. Write accessibility tests: keyboard reachability, iframe title attribute
4. Create or update `/js/views/tools.js` with the tools section sub-router
5. Implement `renderToolsIndex()` with tool cards for Plant Doctor and Stealth Audit
6. Implement `renderStealthAudit()` using iframe approach (load `/docs/tool-stealth-audit.html`)
7. Style the iframe container to fill the content area (full width, calculated height, no border)
8. Set `title` attribute on the iframe for screen reader accessibility
9. Verify that `/docs/tool-stealth-audit.html` is excluded from SPA rewrites in `vercel.json`
10. Test that Stealth Audit data persists independently (save data in Stealth Audit, verify `growdoc-stealth-audit` key exists, verify no `growdoc-companion-*` keys are affected)
11. Test that the tool is accessible in between-grows state (no active grow)
12. Test iframe rendering on desktop and mobile viewports
13. Run all integration and accessibility tests and verify passing
