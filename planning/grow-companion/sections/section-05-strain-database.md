# Section 05: Strain Database

## Overview

This section builds a large pre-built strain database (500+ entries) and a search/select component (strain picker) for use in onboarding and plant management. The database is lazy-loaded via dynamic `import()` to avoid blocking initial page load with 200-500KB of strain data.

**Tech stack:** Vanilla JS (ES modules). The strain database is a static JS data module. The strain picker is a DOM component with debounced search.

---

## Dependencies

- None. The strain database and picker are self-contained components.

## Blocks

- **Section 03 (Landing/Onboarding):** The strain picker is used in onboarding step 6.

---

## Files to Create

| File | Purpose |
|------|---------|
| `/js/data/strain-database.js` | 500+ strain data entries |
| `/js/components/strain-picker.js` | Strain search/select component with lazy loading |

---

## Tests (Implement First)

The TDD plan refers to these as "Section 16: Strain Database" in the test file.

### Database Integrity Tests

- **Required fields:** all strains have required fields (`name`, `flowerWeeks`)
- **Flower week range:** `flowerWeeks.min <= flowerWeeks.max` for all entries
- **Stretch ratio range:** `stretchRatio` values are in plausible range (1.0-5.0)
- **No duplicates:** no duplicate strain IDs

### Strain Picker Tests

- **Lazy loading:** lazy-loading imports database on first open (not at startup)
- **Search filtering:** search filters results correctly (case-insensitive)
- **Debounce:** debounce prevents excessive filtering (no jank on rapid typing)
- **Strain selection:** selecting a strain populates plant's `strainId`
- **Custom strain:** adding custom strain creates entry in localStorage

---

## Implementation Details

### strain-database.js

A static JS data module containing 500+ strain records. This file is NOT imported at app startup. It is loaded via dynamic `import()` when the strain picker is first opened, then cached by the browser for subsequent uses.

**Data structure per strain:**

```javascript
/**
 * STRAINS = {
 *   [strainId: String]: {
 *     name: String,                    // Display name
 *     breeder: String,                 // Breeder/seed bank name
 *     flowerWeeks: {
 *       min: Number,                   // Minimum flowering weeks
 *       max: Number                    // Maximum flowering weeks
 *     },
 *     stretchRatio: {
 *       min: Number,                   // Minimum height multiplier during stretch (1.0-5.0)
 *       max: Number                    // Maximum height multiplier during stretch
 *     },
 *     sensitivities: String[],         // e.g., ['pm-prone', 'calmag-hungry', 'heat-sensitive', 'cold-tolerant']
 *     type: String,                    // 'indica-dom' | 'hybrid' | 'sativa-dom'
 *     dominantTerpenes: String[],      // optional, e.g., ['myrcene', 'limonene']
 *     thcRange: String,               // optional, e.g., '18-24%'
 *     cbdRange: String,               // optional, e.g., '<1%'
 *     description: String             // optional brief description
 *   }
 * }
 */
export const STRAINS = { /* 500+ entries */ };
```

**Strain ID convention:** kebab-case derived from name, e.g., `blue-dream`, `gorilla-glue-4`, `northern-lights`.

**Data sourcing guidance:** Compile from publicly available strain databases. Focus on accuracy of flowering time and stretch ratio as these are the most impactful for the task engine (timing calculations) and training planner (stretch management). The most critical fields are `name` and `flowerWeeks`. Optional fields (`dominantTerpenes`, `thcRange`, `cbdRange`, `description`) are nice-to-have and can be populated incrementally.

**Sensitivity tags and their meaning:**
- `pm-prone` -- susceptible to powdery mildew, needs lower humidity
- `calmag-hungry` -- higher calcium/magnesium demand
- `heat-sensitive` -- struggles above 28C, needs cooler environment  
- `cold-tolerant` -- can handle lower night temps
- `heavy-feeder` -- tolerates higher EC, needs more nutrients
- `light-feeder` -- sensitive to overfeeding, keep EC low
- `stretch-heavy` -- significant height increase in flower transition
- `mold-prone` -- dense buds susceptible to bud rot, needs good airflow

**Example entries:**

```javascript
'blue-dream': {
  name: 'Blue Dream',
  breeder: 'DJ Short / Various',
  flowerWeeks: { min: 9, max: 10 },
  stretchRatio: { min: 1.5, max: 2.5 },
  sensitivities: ['pm-prone'],
  type: 'sativa-dom',
  dominantTerpenes: ['myrcene', 'caryophyllene'],
  thcRange: '17-24%',
  description: 'Popular sativa-dominant hybrid, sweet berry aroma'
},
'northern-lights': {
  name: 'Northern Lights',
  breeder: 'Sensi Seeds',
  flowerWeeks: { min: 7, max: 9 },
  stretchRatio: { min: 1.0, max: 1.5 },
  sensitivities: ['cold-tolerant'],
  type: 'indica-dom',
  dominantTerpenes: ['myrcene', 'pinene'],
  thcRange: '16-21%',
  description: 'Classic indica, compact and resilient'
}
```

### strain-picker.js (Component)

A reusable UI component for searching and selecting strains. Used in onboarding step 6 and in plant detail views for changing a plant's strain.

**Behavior:**

1. **Lazy loading:** On first render, the component dynamically imports `strain-database.js` via `import()`. Shows a loading indicator while the module loads. Once loaded, the module reference is cached in a module-level variable so subsequent opens are instant.

2. **Search input:** Text input with live filtering. Debounced at 200ms to avoid filtering 500+ entries on every keystroke. Case-insensitive matching against strain name, breeder, and type.

3. **Result list:** Scrollable list (max-height with overflow-y scroll) showing matching strains. Each result row displays:
   - Strain name (primary text)
   - Breeder (secondary text)
   - Flower time range (e.g., "9-10 wk")
   - Type badge (indica-dom / hybrid / sativa-dom)

4. **Selection:** Clicking a result row selects that strain. The selected strain's ID is returned to the parent component. In onboarding, this populates the plant's `strainId` field.

5. **"Add Custom Strain" flow:** A button below the results opens a small form with:
   - Name (required, sanitized via escapeHtml)
   - Flower weeks min/max (required)
   - Stretch ratio min/max (optional)
   - Sensitivities multi-select (optional)
   - Type selector (optional)
   Custom strains are saved to localStorage under a `growdoc-companion-custom-strains` key, separate from the main database. They appear in search results alongside database strains.

6. **Empty state:** If search returns no results, show "No strains found. Add a custom strain?" with a link to the custom strain form.

**Signature:**

```javascript
// strain-picker.js

/**
 * renderStrainPicker(container, options) — Renders the strain picker into the given container.
 *   options.onSelect(strainId, strainData) — Callback when a strain is selected
 *   options.onCustom(customStrain) — Callback when a custom strain is created
 *   options.initialValue — Pre-selected strain ID (optional)
 *
 * loadStrainDatabase() — Dynamically imports strain-database.js (internal, cached)
 * searchStrains(query, database) — Filters strains by query (internal)
 */
export function renderStrainPicker(container, options) { /* ... */ }
```

**Accessibility:**
- Search input has `role="combobox"` with `aria-expanded` and `aria-owns` pointing to the result list
- Result list has `role="listbox"` with `role="option"` on each item
- Arrow keys navigate through results, Enter selects
- Custom strain form inputs have proper labels

---

## Implementation Checklist

All items completed.

## Actual Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `/js/data/strain-database.js` | ~607 | 502 strains (81 autos) with Franco-verified flower times |
| `/js/components/strain-picker.js` | ~224 | Lazy-loading search/select + custom strain creation |
| `/js/tests/strain-database.test.js` | ~135 | Database integrity + picker component tests |

## Deviations from Plan

1. **Added `isAuto` and `totalDays` fields** per Franco's recommendation — autos need seed-to-harvest timing, not just flower weeks
2. **Raised `flowerWeeks.max` to 20** — pure sativa landraces (Neville's Haze, Thai) exceed 16 weeks
3. **Breeder-encoded strain IDs** — same strain name from different breeders gets separate entries (e.g., `gelato-33-cookies` vs `gelato-barneys`)
4. **Flower times are from-flip, not from-first-pistils** — adds 7-14 days vs breeder-stated times, per Franco
5. **502 strains total**: 80 classic, 100 modern, 60 current-gen, 81 auto, 50+ CBD, 40 Dutch, 40 West Coast, 25 East Coast, 25 Spanish, 30 landrace, additional fills
