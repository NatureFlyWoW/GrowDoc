# Section 1: Sidebar Integration

## Overview

This section adds a pinned "Tools" group to the GrowDoc sidebar, above all existing priority-based document groups. Four interactive tool entries are registered in `docs.json` with `"category": "tool"`. The sidebar, mobile nav, and filter chip counting logic in `app.js` are updated so that tools always appear regardless of status filters, and tool entries do not inflate the DONE filter count. New CSS rules in `style.css` style the tool category with a distinct green tint on the light parent-page theme.

**Files to modify:**
- `docs/docs.json` — add four tool entries
- `app.js` — update `render()` for tools section, filter count exclusion, mobile nav
- `style.css` — add `.cat-tool` and `.prio-tools` styling rules

**Dependencies:** None. This section must be completed before Sections 02–05 (all tool pages depend on appearing in the sidebar).

---

## Tests

### Console Tests

```js
function runSidebarTests() {
  const results = [];
  function assert(name, condition) {
    results.push({ name, pass: !!condition });
    if (!condition) console.error('FAIL:', name);
  }

  // Test: tools extracted from docs array regardless of status filter
  const toolDocs = docs.filter(d => d.category === 'tool');
  assert('Four tool entries exist in docs array', toolDocs.length === 4);

  // Test: filter chip counts exclude tool-category entries
  const doneChip = document.querySelector('.filter-chip[onclick*="DONE"]');
  const doneCount = doneChip ? parseInt(doneChip.querySelector('.count').textContent, 10) : -1;
  const nonToolDoneCount = docs.filter(d => d.category !== 'tool' && (d.status || 'OPEN') === 'DONE').length;
  assert('DONE filter chip count excludes tools', doneCount === nonToolDoneCount);

  // Test: tools render above priority groups in nav-list
  const navList = document.getElementById('nav-list');
  const firstGroup = navList.querySelector('.priority-group');
  assert('First priority group has prio-tools class', firstGroup && firstGroup.classList.contains('prio-tools'));

  // Test: tools always visible even when all status filters are toggled off
  const savedFilters = new Set(activeFilters);
  activeFilters.clear();
  render();
  const toolsGroup = document.querySelector('.priority-group.prio-tools');
  const toolItems = toolsGroup ? toolsGroup.querySelectorAll('.nav-item.cat-tool') : [];
  assert('Tools visible when all filters toggled off', toolItems.length === 4);
  savedFilters.forEach(f => activeFilters.add(f));
  render();

  // Test: mobile nav includes tool items before doc items
  const mobileItems = document.querySelectorAll('#mobile-nav .mobile-nav-item');
  const firstFourAreTool = mobileItems.length >= 4 &&
    Array.from(mobileItems).slice(0, 4).every(el => el.classList.contains('cat-tool'));
  assert('Mobile nav has tool items first', firstFourAreTool);

  console.table(results);
  const passed = results.filter(r => r.pass).length;
  console.log(`Sidebar tests: ${passed}/${results.length} passed`);
}
```

### Manual Verification Checklist

- [ ] Four tool entries appear at top of sidebar in their own "Tools" group
- [ ] Tool nav items have green tint distinct from botanical and planning
- [ ] Clicking a tool loads the correct iframe src
- [ ] Toggling all status filters off still shows tools section
- [ ] DONE filter chip count does NOT inflate by 4
- [ ] Active tool item has correct green background (#4a7c23)
- [ ] Mobile: tools appear first in horizontal scroll strip with green border
- [ ] Mobile: tool pills meet 44px touch target height

---

## Implementation Details

### 1. docs.json — Add Tool Entries

Append four entries to the JSON array with `"category": "tool"` and `"status": "DONE"`. No `priority` field.

```json
{
  "id": "plant-doctor", "title": "Plant Doctor", "subtitle": "Interactive symptom diagnosis",
  "icon": "🩺", "status": "DONE", "category": "tool", "file": "tool-plant-doctor.html"
},
{
  "id": "env-dashboard", "title": "Environment Dashboard", "subtitle": "VPD + DLI calculator & chart",
  "icon": "🌡️", "status": "DONE", "category": "tool", "file": "tool-env-dashboard.html"
},
{
  "id": "cure-tracker", "title": "Drying & Cure Tracker", "subtitle": "Harvest-to-jar protocol tracker",
  "icon": "🫙", "status": "DONE", "category": "tool", "file": "tool-cure-tracker.html"
},
{
  "id": "stealth-audit", "title": "Stealth Audit", "subtitle": "Monthly OPSEC security checklist",
  "icon": "🔒", "status": "DONE", "category": "tool", "file": "tool-stealth-audit.html"
}
```

### 2. app.js — Render Logic Changes

#### 2a. Filter Chip Counts Exclude Tools

Change the filter count to:
```js
const count = docs.filter(d => d.category !== 'tool' && (d.status || 'OPEN') === s).length;
```

#### 2b. Sidebar: Extract Tools, Render Above Priority Groups

Exclude tools from `visibleDocs`:
```js
const visibleDocs = docs.filter(d => d.category !== 'tool' && activeFilters.has(d.status || 'OPEN'));
```

Extract tools from full `docs` array:
```js
const toolDocs = docs.filter(d => d.category === 'tool');
```

Update `activeId` resolution to include tools:
```js
const allSelectableDocs = [...toolDocs, ...visibleDocs];
if (allSelectableDocs.length === 0) {
  activeId = null;
} else if (!allSelectableDocs.find(d => d.id === activeId)) {
  activeId = allSelectableDocs[0].id;
}
const active = docs.find(d => d.id === activeId) ?? null;
```

Before the priority group `for` loop, render tools section using `.priority-group.prio-tools` with header "Tools" / "Interactive grow utilities". Each tool renders as `.nav-item.cat-tool` with same markup pattern as existing nav items.

#### 2c. Mobile Nav: Prepend Tool Items

Build mobile nav by concatenating tool items (`.mobile-nav-item.cat-tool`) before the priority-sorted doc items. Same keyboard/ARIA attributes as existing mobile items.

### 3. style.css — Tool Category Styles (Light Theme)

These styles apply to the parent page (light cream theme `--sidebar-bg: #e8dcc8`).

#### Desktop Sidebar

```css
.nav-item.cat-tool {
  background: rgba(74, 124, 35, 0.12);
  border-left: 3px solid rgba(74, 124, 35, 0.5);
  padding-left: 9px;
}
.nav-item.cat-tool:hover { background: rgba(74, 124, 35, 0.22); }
.nav-item.cat-tool.active {
  background: #4a7c23; color: var(--bg); border-left-color: #4a7c23;
}
```

#### Priority Group Header

```css
.prio-tools .priority-label { color: #4a7c23; }
.prio-tools .priority-header { border-bottom-color: rgba(74, 124, 35, 0.4); }
```

#### Mobile Nav (inside @media max-width: 768px)

```css
.mobile-nav-item.cat-tool {
  border-color: rgba(74, 124, 35, 0.5);
  background: rgba(74, 124, 35, 0.08);
}
.mobile-nav-item.cat-tool.active {
  background: #4a7c23; color: var(--bg); border-color: #4a7c23;
}
```

## Edge Cases

- Tool HTML files don't exist yet — iframe shows 404 until Sections 02–05 are built. Optionally create placeholder pages.
- Tools appended at end of docs.json — initial page load selects first doc, not a tool.
- Tool items show "DONE" status badge — intentional, tools are always available.
- `select()` function works without modification for tool IDs.
