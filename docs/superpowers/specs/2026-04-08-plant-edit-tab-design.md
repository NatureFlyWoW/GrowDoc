# Plant Edit Tab & Existing Plant Import — Design Spec

**Date:** 2026-04-08
**Status:** Approved

## Summary

Add a 5th "Edit" tab to the plant detail view for comprehensive plant property editing. Enhance the "Add Plant" form to support importing existing mid-grow plants. Add edit icon to plant cards for quick navigation to the edit tab.

## Edit Tab Fields

Located at `/grow/plant/:id`, tab order: Overview | Log History | Diagnoses | Training | **Edit**

| Field | Input Type | Default | Notes |
|-------|-----------|---------|-------|
| Name | Text input | Current name | Sanitized via escapeHtml |
| Strain | Strain picker or text input | Current strain | "Unknown" option available |
| Pot Size | Dropdown (1, 3, 5, 7, 10, 15, 20 L) | Current pot size | |
| Stage | Stage selector (13 stages from STAGES) | Current stage | Triggers stageStartDate recalculation |
| Days in Stage | Number input (0-999) | Calculated from current stageStartDate | Back-calculates stageStartDate |
| Medium Override | Checkbox + dropdown | Unchecked = profile default | Shows soil/coco/hydro/soilless dropdown only when checked |
| Training Method | Dropdown from TRAINING_METHODS | Current method | Regenerates milestones on change |
| Context Notes | Textarea (2 rows) | Current plant notes | Parsed by profile-context-rules.js, stored per-plant |

## Stage Change Flow

1. User selects new stage from dropdown
2. "Days in this stage?" number input appears, default 0
3. On confirm: `plant.stage = newStage`, `plant.stageStartDate = new Date(Date.now() - days * 86400000).toISOString()`
4. Previous stage entry in stageHistory gets endDate = now
5. New stage entry added to stageHistory
6. `store.publish('stage:changed', { plantId, oldStage, newStage })` triggers task regeneration
7. Training milestones filtered to new stage context

## Enhanced Add Plant Form

Expanded from name + pot size to full plant profile:

| Field | Default |
|-------|---------|
| Name | "Plant {N+1}" |
| Stage | grow.currentStage or 'early-veg' |
| Days in Stage | 0 |
| Pot Size | profile pot size or 5 |
| Strain | Empty (optional) |
| Medium Override | None (uses profile) |
| Training Method | none |
| Context Notes | Empty |

"Days in Stage" enables importing existing plants: set stage to "mid-flower" and days to "15" creates a plant 15 days into mid-flower.

## Plant Card Enhancement

Each plant card header gets a pencil icon (right side) that navigates to `/grow/plant/:id#edit` — the Edit tab pre-selected.

## Save Behavior

- Each field commits to store individually on change (blur or select)
- No "Save All" button — instant persistence via store.commit
- Visual feedback: brief green flash on the changed field

## Medium Override Behavior

- Default: plant uses `profile.medium` for all recommendation lookups
- Override: `plant.mediumOverride = 'coco'` (or null for default)
- Consumers check `plant.mediumOverride || profile.medium`
- Task engine, feeding calculator, watering frequency all respect the override

## Per-Plant Context Notes

- Stored in `plant.notes` (string)
- Parsed by `parseProfileNotes({ plant: plant.notes })` on save
- Result stored in `plant.context` (structured object)
- Plant-level context overrides profile-level context for that plant
- Example: profile says "soil" but plant note says "this one is in coco with perlite" → plant.context.mediumDetail overrides

## Files Modified

| File | Change |
|------|--------|
| `js/views/plant-detail.js` | Add Edit tab with all editable fields, stage change flow |
| `js/views/my-grow.js` | Expand add form with stage/days/strain/medium/training/notes, add edit icon |
| `js/data/stage-rules.js` | No changes — STAGES already exported |
| `js/data/training-protocols.js` | No changes — TRAINING_METHODS already exported |
| `js/components/task-engine.js` | Read plant.mediumOverride for per-plant medium |
| `js/data/feeding-calculator.js` | Accept plant-level medium override |

## Data Shape Changes

```javascript
// plant object — new/modified fields
{
  ...existingFields,
  mediumOverride: null | 'soil' | 'coco' | 'hydro' | 'soilless',
  notes: '',           // free-text context notes
  context: {},         // parsed structured context (from notes)
}
```
