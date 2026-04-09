# Multi-Plant Workspace — Design Spec

## Overview
Add the ability to manage multiple individual plants in the Plant Doctor tool. Each plant is a named entity with its own grow profile (medium, lighting), optional metadata (strain, location, start date), and independent diagnosis history. A persistent "active plant" workspace model scopes all diagnoses, notes, and journal entries to the selected plant.

## Architecture

### Plant Data Model
```javascript
{
  id: 'p-{timestamp}-{random}',
  name: 'GSC #3',               // required, user-chosen
  strain: 'Girl Scout Cookies',  // optional
  location: 'Tent A - Left',    // optional
  startDate: '2026-03-15',      // optional
  medium: 'coco',               // per-plant (was global)
  lighting: 'led',              // per-plant (was global)
  createdAt: ISO timestamp,
  status: 'active'              // active | harvested | removed
}
```

### Storage
New localStorage key: `growdoc-plants` — array of plant objects. The existing `growdoc-grow-profile` becomes a fallback for when no plants are defined (backward compat). Journal entries (`growdoc-plant-doctor-v2`) gain a `plantId` field linking diagnosis to specific plant.

### UI Layout

**Desktop:** Collapsible plant sidebar on the left (~220px wide). Main diagnostic area on the right. Active plant highlighted in sidebar with a green accent border.

**Mobile:** Sidebar collapses to a horizontal strip at the top showing the active plant name + a "switch plant" button. Tap to expand the full plant list as a slide-down panel.

### Plant Sidebar Components
1. **Plant cards** — Name, strain (if set), status badge, last diagnosis date
2. **Active plant indicator** — Green left border on selected card
3. **"+ Add Plant" button** — Opens inline form (name required, rest optional)
4. **Edit/remove** — Swipe or long-press on mobile, hover menu on desktop
5. **Quick stats** — Active diagnosis count badge per plant

### Workspace Behavior
- Selecting a plant sets it as "active" — stored in state and persisted
- All wizard/expert/multi-dx diagnoses auto-scope to the active plant
- Medium/lighting questions are SKIPPED (pulled from plant profile)
- The journal dashboard filters to show only the active plant's entries
- Notes are per-plant (already per-session, now per-plant-session)
- Switching plants mid-diagnosis shows a confirmation if progress exists
- The grow profile badges show the active plant's medium/lighting (read from plant, not global)

### Plant Management
- **Add plant:** Inline form in sidebar. Name required. Medium/lighting are the old setup questions but scoped to the plant. Strain, location, start date are optional text fields.
- **Edit plant:** Click plant card → edit mode. All fields editable.
- **Remove plant:** Confirmation dialog. Option to keep or delete associated journal entries.
- **Plant status:** Active (growing), Harvested (done, keep history), Removed (hidden)

### Migration
- If `growdoc-plants` doesn't exist but `growdoc-grow-profile` does, create a default "Plant 1" with the saved medium/lighting
- If neither exists, show empty sidebar with "Add your first plant" prompt
- Existing journal entries without `plantId` remain accessible under "Unassigned" filter

## Constraints
- ES5 JavaScript only
- Single HTML file (tool-plant-doctor.html) + data files
- Must not break existing 250+ tests
- Sidebar CSS must not conflict with existing layout
- Mobile-first responsive design
- localStorage size limit awareness (~5MB)

## Success Criteria
1. Can add/edit/remove named plants with metadata
2. Active plant scopes all diagnoses and journal entries
3. Medium/lighting are per-plant, skip setup questions when plant is selected
4. Plant switching preserves diagnosis state per-plant
5. Existing users without plants see backward-compatible experience
6. Mobile sidebar is usable on 390px screens
