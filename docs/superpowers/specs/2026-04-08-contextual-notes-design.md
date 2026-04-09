# Contextual Notes for Wizard Steps — Design Spec

**Date:** 2026-04-08
**Status:** Approved
**Reviewed by:** Devil's Advocate (architecture), Franco (cultivation)

## Summary

Add an optional "add context" textarea to 7 of 10 onboarding wizard steps. Notes are parsed once on wizard completion via step-scoped keyword patterns into a structured `profile.context` object. All recommendation consumers (task engine, feeding calculator, harvest advisor, stage rules) read this context to adjust advice.

## Steps With Notes (7 of 10)

| Step | Placeholder |
|------|-------------|
| 1. Stage | "e.g., autoflower, 3 weeks from sprout, clones" |
| 2. Medium | "e.g., living soil with worm castings, 30% perlite" |
| 3. Lighting | "e.g., Spider Farmer SF2000, 18 inches, dimmed 75%" |
| 6. Strain | "e.g., breeder says 8-9 weeks flower, sensitive to N" |
| 7. Space | "e.g., 2x4 tent, AC Infinity 4-inch with carbon filter" |
| 9. Priorities | "e.g., stealth is critical, neighbors are close" |

Steps 4 (plant count), 5 (pot size), 8 (experience), 10 (summary) have no notes.

## Data Architecture

### Storage

```javascript
// profile.notes — raw user text per step
profile.notes = {
  stage: "autoflower, 3 weeks old",
  medium: "living soil with worm castings and perlite, organic dry amendments",
  lighting: "SF2000 at 18 inches, dimmed to 75%",
  strain: null,
  space: "2x4 tent, 4 inch AC Infinity with carbon filter",
  priorities: "stealth matters, close neighbors"
}

// profile.context — structured parsed context
profile.context = {
  plantType: "autoflower",          // auto, photo, clone, seed, regular, feminized
  isAutoflower: true,               // convenience flag for system-wide auto-mode
  mediumDetail: "living-soil",      // living-soil, super-soil, amended, standard
  amendments: ["worm-castings", "perlite"],
  amendmentDensity: "high",         // none, low (1), medium (2), high (3+)
  nutrientLine: "organic-dry",      // organic-dry, organic-liquid, synthetic, unknown
  lightBrand: "spider-farmer",
  lightDistance: 18,                 // cm or inches parsed
  lightDimming: 75,                 // percentage
  container: null,                  // fabric, plastic, air-pot, sip
  waterSource: null,                // tap, ro, well, distilled
  waterPH: null,                    // number if mentioned
  ventilation: "carbon-filter",     // carbon-filter, inline-fan, passive, none
  trainingIntent: null,             // lst, scrog, top, mainline
  envConstraints: [],               // ["high-temp", "low-ceiling", "high-humidity"]
  previousProblems: [],             // ["overwatering", "fungus-gnats", "calcium-def"]
  stealthRequired: true,            // from priorities notes
  budgetConstrained: false,
  rawUnmatched: []                  // note fragments that didn't match any pattern
}
```

### Parse Flow

```
Wizard complete → parseProfileNotes(wizardState.notes)
  → For each step, run step-scoped keyword patterns
  → Build profile.context object
  → Store both profile.notes and profile.context
  → Commit to store

Settings edit → re-parse → store.publish('context:changed')
  → Task engine regenerates
```

## Keyword Categories (10)

1. **Plant type**: autoflower, clone, seed, photoperiod, feminized, regular, bagseed, mother
2. **Medium detail**: living soil, super soil, amended, worm castings, perlite ratio, coco brand
3. **Nutrient line**: organic, synthetic, dry amendments, bottled, brand names (GH, Canna, BioBizz)
4. **Lighting detail**: brand names, wattage, distance, dimming percentage
5. **Container type**: fabric pot, plastic, air pot, SIP, autopot
6. **Water source**: tap, RO, well, distilled, pH value, PPM/EC value
7. **Ventilation**: inline fan, carbon filter, passive intake, AC
8. **Training intent**: LST, HST, top, fim, mainline, scrog, sog, lollipop
9. **Environment constraints**: temp/humidity numbers, basement, attic, closet, height limits
10. **Previous problems**: "last grow had...", "always get...", "struggled with..."

## Autoflower Mode (system-wide)

When `context.isAutoflower === true`:
- **Timeline**: compressed 8-11 weeks, no 12/12 flip prompts
- **Training**: LST default, no mainlining, topping only if intermediate+
- **Feeding**: all EC targets reduced 25% from photoperiod baseline
- **Container**: recommend 3-5 gallon, no transplant advice
- **Harvest**: trichome checks start week 6-7, stagger harvest emphasized

## Living Soil Gradient

| Condition | amendmentDensity | Feeding Adjustment |
|-----------|-----------------|-------------------|
| "living soil" + 3+ amendments | high | Water only 4-6 weeks, top-dress after |
| "living soil" + 1-2 amendments | medium | Reduce base EC 30-40%, light feed from week 3 |
| "amended soil" only | low | Reduce base EC 20%, standard schedule |
| No soil amendments | none | Standard feeding schedule |

## UI Component

Collapsible textarea below each eligible step's selection card:

- Default: collapsed, showing "Add context (optional)" link
- Expanded: 2-row textarea with step-specific placeholder
- Hint text: "Helps personalize your recommendations"
- Notes persist across wizard back/forward navigation
- Sanitized via escapeHtml before storage

## Files to Create/Modify

| File | Action |
|------|--------|
| `/js/data/profile-context-rules.js` | NEW — keyword patterns and parseProfileNotes() |
| `/js/views/onboarding.js` | MODIFY — add notes textarea to 7 steps |
| `/js/components/task-engine.js` | MODIFY — read profile.context for adjustments |
| `/js/data/feeding-calculator.js` | MODIFY — living soil gradient, auto EC reduction |
| `/js/views/settings.js` | MODIFY — notes editor with re-parse on save |

## Consumer Adjustments

### Task Engine
- Auto-mode: skip flip prompts, compress training windows
- Living soil: skip/reduce feeding tasks based on amendmentDensity
- Stealth: elevate carbon filter and smell-related tasks
- Previous problems: generate preventive check tasks

### Feeding Calculator
- Living soil gradient: adjust EC per amendmentDensity table
- Auto: reduce all EC by 25%
- Water source pH: add pH-down reminder if tap pH > 7.5

### Harvest Advisor
- Auto: earlier trichome checks, compressed timeline
- Terpene priority + stealth: emphasize smell control during dry/cure

### Stage Rules
- Auto: skip transition stage, compress veg to 3-4 weeks
- Auto: no mainline milestones, LST starts earlier
