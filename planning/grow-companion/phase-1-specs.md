# Phase 1 Implementation Specs: "Grow Intelligence" MVP

**Duration:** 4 weeks (Weeks 1–4)  
**Goal:** Transform Plant Doctor into a proactive daily companion  
**Deployed to:** growdoc.vercel.app (Vercel)

---

## OVERVIEW: The Daily Companion Loop

**Current state:** Users visit Plant Doctor when they have a problem.  
**Desired state:** Users visit daily to check tasks, monitor progress, log data.

**The mechanism:**
1. User creates a grow (setup profile captures medium, lights, space, nutrients)
2. User starts a plant (selects strain, sets veg/flower duration)
3. System generates daily tasks based on current stage + setup
4. User checks off tasks, logs environment, adds photos
5. System alerts them to problems *before* they become critical
6. When diagnosis happens, system auto-prompts for outcomes 3 days later
7. Over time, user builds a personal grow history with measurable results

---

## FEATURE 1: Enhanced Setup Profile (P0 — 3 days)

### Current State
- User selects: Growing medium (soil/coco/hydro) + Lighting (LED/HPS/CFL/sunlight)
- Stored per plant in: `growdoc-plants` localStorage array

### Enhancement: Space & Nutrients Context
**Why:** Tasks, environment targets, and recommendations need to know the full setup.

**New fields to collect:**

```javascript
{
  plantName: "Blue Dream #1",
  medium: "soil",
  lighting: "led",
  
  // NEW:
  spaceWidth: 80,           // cm
  spaceDepth: 60,           // cm
  spaceHeight: 160,         // cm
  spaceLiters: 768,         // calculated from dimensions
  
  lightWattage: 240,        // LED watts
  potSize: 11,              // liters
  potType: "fabric",        // fabric, plastic, cloth
  
  nutrientLine: "general-hydroponics", // dropdown: GH, Botanicare, MaxiGro, etc.
  feedingStyle: "feed-to-drain",      // feed-to-drain, passive, hydro
  
  climateControl: "manual",  // manual, dehumidifier, ac-unit
  targetTemp: "22-26",       // range
  targetRH: "45-55",         // range
  
  budgetTier: "hobby",       // hobby, semi-pro, commercial (affects recommendations)
  growerExperience: "beginner", // beginner, intermediate, advanced
}
```

### UI Design

**Option A: Conversational Form** (Recommended — matches Plant Doctor UX)
```
Screen 1: "What's your growing space? (optional, helps with recommendations)"
  [Space Width?] [cm/in toggle]
  [Space Depth?] → Calculated: "So about 0.48 m²"
  [Space Height?] → Shows diagram (height budget for led + pot + stretch)

Screen 2: "Light setup?"
  [LED Wattage?] OR [HPS Wattage?]
  Already have: medium, lighting type from plant setup

Screen 3: "What nutrients are you using?"
  [Nutrient Line dropdown] → GH / Canna / Remo / Other
  [Feeding style?] → Feed-to-drain / passive / hydro

Screen 4: "Climate control?"
  [Temp range?] [RH range?]
  [Manual adjustments only?] or [AC/dehumidifier]
```

**Option B: Single Form** (Faster but less UX-friendly)
- 1 page, all fields, collapsible sections

**Recommendation:** Option A (conversational) matches Plant Doctor's successful pattern.

### Data Persistence
- Save to existing: `growdoc-grow-profile` localStorage key
- Structure: `{ plants: { [plantId]: { medium, lighting, space, nutrients, ... } } }`
- No server-side storage (MVP is client-side only)

### Success Criteria
- >80% of new growers complete the setup (measure with GA events)
- Setup form completion time <3 min
- No validation errors on submission

---

## FEATURE 2: Growth Timeline (P0 — 6 days)

### Current State
- User manually selects "Vegetative" or "Flowering" stage
- No timeline or progression tracking

### Enhancement: Visual Timeline with Milestones

**What we're tracking:**
```javascript
{
  plantId: "plant-1",
  
  // Timeline inputs (user provides once)
  vegStartDate: "2026-04-08",    // Date plant entered veg (or transplant date)
  vegDurationDays: 28,            // How long user plans to veg (optional default: 21)
  flowerStartDate: null,          // Automatically set when user flips
  flowerDurationDays: 56,         // Expected flower time (from strain DB or manual; default: 56)
  
  // Timeline state (derived)
  currentStage: "vegetative",     // vegetative | flowering | curing
  daysInStage: 12,                // Calculated from now vs start date
  daysRemaining: 16,              // In current stage
  progressPercent: 43,            // (daysInStage / planDuration) * 100
  nextMilestone: "flip",          // Next expected action
  daysUntilNextMilestone: 16,
}
```

### Visual Design

**Timeline Card Layout:**
```
┌─────────────────────────────────────────┐
│ GROWTH PROGRESS: Blue Dream #1          │
├─────────────────────────────────────────┤
│                                         │
│  Vegetative (12 / 28 days)              │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  43%
│                                         │
│  Week 2 of 4 planned                    │
│  ✓ Week 1: Establish roots              │
│  ⬤ Week 2: 4th node → ready for LST     │
│  • Week 3: Defoliate + train             │
│  • Week 4: Prepare for flip              │
│                                         │
│  ⏱️  16 days until flip (recommended)   │
│                                         │
│  [ADVANCED SETTINGS ▼]                  │
│  (Shows: adjust veg duration, flip now, │
│   manual stage override)                │
│                                         │
└─────────────────────────────────────────┘
```

**Milestone alerts (auto-generated tasks linked to timeline):**
- Week 1 (day 0–7): Establish root system
- Week 2 (day 8–14): Growth stage, ready for training
- Week 3 (day 15–21): Can defoliate and train
- Week 4 (day 22–28): Prepare to flip (start nutrient adjustment if applicable)

### Flowering Stage Tracking

**Once user flips:**
```
Current state: Flowering (3 / 56 days)
████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 5%

Early flower (0–14 days)
├─ Days 0–3: Transition (watch for hermies, stress)
├─ Days 4–7: Bud set
├─ Days 8–14: Stretch continues

Mid flower (15–35 days)
├─ Peak feeding, CalMag critical
├─ Watch for: powdery mildew, bud rot

Late flower (36–56 days)
├─ Reduce N, watch for amber trichomes
├─ Harvest window: ~52–60 days

Harvest & Cure (56+ days)
└─ Trichome timing, dry, cure
```

### Strain Database Integration (MVP: Manual Entry)

**MVP approach:** User manually enters strain name + expected flower time.  
**Future (v1.1):** Autocomplete from Seedfinder API.

```javascript
{
  strainName: "Blue Dream",
  strainSource: "seedfinder", // seedfinder | manual | own-genetics
  expectedFlowerTime: 56,     // days
  expectedStretch: 1.8,       // final height / transplant height
  terpeneProfile: "fruity-sweet", // from API or manual
}
```

### Implementation Plan (Day-by-day breakdown)

**Day 1:** Data structure + localStorage schema  
**Day 2–3:** Timeline calculation logic + milestone generation  
**Day 4:** UI rendering (timeline card, milestone list)  
**Day 5:** Strain DB MVP (manual entry form + storage)  
**Day 6:** Testing + integration with task list (upcoming feature)

### Success Criteria
- Timeline renders on plant detail view
- Milestone alerts trigger at correct times
- Days remaining countdown updates daily
- >60% of users enter expected veg/flower duration

---

## FEATURE 3: Daily Task List (P0 — 7 days)

### Current State
- No task generation; users must know what to do based on Plant Doctor diagnoses

### Enhancement: Smart Daily Task Generation

**Task generation logic:**

```
Task pool based on:
├─ Current stage (veg week 1 vs week 4 vs flower week 2)
├─ Plant setup (soil vs hydro vs coco → different care)
├─ Recent diagnoses (had Ca deficiency? Track CalMag dose)
├─ Grower experience (beginner → more guidance; advanced → less handholding)
└─ User priority goals (yield-focused → heavier feeding; quality-focused → more conservative)

Example task progression:
├─ Veg Week 1 (seedling): Water, monitor height, check light distance
├─ Veg Week 2 (vegetating): Water, feed lightly, check node spacing
├─ Veg Week 3 (pre-flip): Water, full feed, defoliate, start training
├─ Veg Week 4 (flip-prep): Water, full feed, stop training, prepare environment
├─ Flower Week 1–2 (stretch): Water, feed (nitrogen still OK), monitor height
├─ Flower Week 3–4 (bud set): Water, reduce N, feed CalMag, watch humidity
├─ Flower Week 5–7 (mid flower): Full feed, monitor for pests/mold, check canopy
├─ Flower Week 8+ (late flower): Reduce N, flush schedule prep, trichome checks
└─ Post-harvest: Dry, cure, store
```

### UI Design

**Daily Task Card Layout:**
```
┌────────────────────────────────────────┐
│ TODAY'S TASKS: Blue Dream #1           │
├────────────────────────────────────────┤
│                                        │
│  ESSENTIAL (3 tasks)                   │
│  ☐ [1] Water soil (soil dryness test)  │
│  ☐ [2] Feed (GH schedule, EC 1.4)      │
│  ☐ [3] Check humidity (<55% target)    │
│                                        │
│  MONITORING (2 tasks)                  │
│  ☐ Check for pests on lower leaves     │
│  ☐ Measure temperature (aim: 22–26°C)  │
│                                        │
│  OPTIONAL (1 task)                     │
│  ☐ Defoliate (light, ~10% removal)     │
│                                        │
│  COMPLETED TODAY (4 tasks)             │
│  ✓ [1] Watered (8:42 AM)               │
│  ✓ [2] Fed (8:43 AM)                   │
│  ✓ [3] Checked humidity (9:15 AM)      │
│  ✓ Check for pests (10:30 AM)          │
│                                        │
│  Progress: 4 / 6 tasks (67%)            │
│                                        │
│  [Take Photo] [Add Note] [Log Data]    │
│                                        │
└────────────────────────────────────────┘
```

### Task Categories

| Category | Role | Example |
|----------|------|---------|
| **Essential** | Must do today | Water, feed, check environment |
| **Monitoring** | Good to track | Pest check, pH, temp, humidity |
| **Optional** | Optimization | Defoliate, train, adjust lights |
| **Learning** | Education link | "Why CalMag matters" (link to guide) |

### Data Structure

```javascript
const TASK_DEFINITIONS = {
  veg_week_1: [
    { id: "water", text: "Water soil (lift test first)", category: "essential", icon: "water-drop" },
    { id: "light-check", text: "Check light distance (should be X cm above canopy)", category: "monitoring", icon: "flashlight" },
    { id: "pest-check", text: "Inspect for pests", category: "monitoring", icon: "search" },
  ],
  veg_week_2: [
    { id: "water", text: "Water", category: "essential" },
    { id: "feed", text: "Feed (light dose)", category: "essential" },
    { id: "node-spacing", text: "Check node spacing (sign of healthy growth)", category: "monitoring" },
  ],
  flower_week_3: [
    { id: "water", text: "Water", category: "essential" },
    { id: "feed-full", text: "Feed full strength", category: "essential" },
    { id: "calmag", text: "CalMag dose (critical under LED)", category: "essential" },
    { id: "humidity", text: "Check humidity (should be <60% to prevent mold)", category: "monitoring" },
  ],
  // ... more by stage
};

const TASK_RULES = [
  {
    trigger: "medium:soil && stage:veg_week_1",
    tasks: ["water", "light-check", "pest-check"],
  },
  {
    trigger: "lighting:led && stage:flower_week_3",
    tasks: ["water", "feed-full", "calmag", "humidity"],
    reason: "CalMag is critical for LED growers mid-flower",
  },
  {
    trigger: "recent_diagnosis:calmag_deficiency",
    tasks: ["calmag"], // persist for 2–3 weeks post-diagnosis
    reason: "You treated CalMag deficiency; continue monitoring",
  },
];
```

### Check-off Behavior

**When user checks off task:**
1. Record timestamp in localStorage
2. Show tiny confirmation (checkmark animation)
3. Update progress bar
4. Track event in GA (for analytics)
5. Optional: Suggest photo/note ("Want to take a progress photo?")

### Task Completion Analytics

**Track (for future retention/engagement analysis):**
- % of daily tasks completed by user
- Which tasks are consistently done vs skipped
- Correlation: Task completion → better diagnoses / better outcomes
- Example insight: "Users who check humidity daily have 30% fewer mold issues"

### Implementation Plan (Day-by-day breakdown)

**Day 1:** Task definitions library + rule engine (Franco validates)  
**Day 2:** Task generation logic (stage-aware, setup-aware)  
**Day 3:** UI component (task card, checkboxes, progress tracking)  
**Day 4:** Check-off behavior + localStorage persistence  
**Day 5:** Task history view + analytics events  
**Day 6:** Mobile responsive testing  
**Day 7:** Franco review + refinements

### Success Criteria
- >50% of active plants have tasks generated on day 1
- >40% of users complete at least 1 task per day (7-day avg)
- >25% of users complete all essential tasks daily
- Task completion rate increases over time (habit formation)

---

## FEATURE 4: Environment Calculator (P1 — 5 days)

### Current State
- No environment monitoring or guidance

### Enhancement: Real-Time VPD, DLI, Nutrient EC Targets

**Why this matters:**
- VPD (vapor pressure deficit) is the single most reliable environment metric
- DLI (daily light integral) predicts light adequacy
- Nutrient EC targets prevent burn/deficiency
- Franco validates: These 3 metrics = 80% of environment optimization

### VPD Calculator

**Formula:**
```
VPD = (SVP_sat - SVP_actual)
where:
  SVP_sat = saturated vapor pressure at air temp
  SVP_actual = actual vapor pressure (RH × SVP_sat)
  
VPD targets by stage:
  Seedling:     0.4–0.8 kPa
  Veg:          0.8–1.2 kPa
  Early flower: 1.0–1.4 kPa
  Late flower:  1.2–1.6 kPa
```

**UI:**
```
┌─────────────────────────────────────────┐
│ ENVIRONMENT TARGETS                     │
├─────────────────────────────────────────┤
│                                         │
│ Current Conditions                      │
│ Temperature:  24°C      [slider / input]│
│ Humidity:     52%       [slider / input]│
│                                         │
│ ✓ VPD Status: 1.0 kPa (GOOD)            │
│   Target for flowering: 1.0–1.4 kPa     │
│   Recommendation: Humidity is perfect   │
│                                         │
│ ⚠️  DLI Status: 18 mol/day (LOW)        │
│   Target for veg: 20–25 mol/day         │
│   Your lights: 240W LED @ 60cm = 600PPFD│
│   Recommendation: Raise lights 5cm      │
│                                         │
│ Nutrient EC Target: 1.4–1.8 mS/cm       │
│ (Your setup: Soil + GH schedule)        │
│                                         │
│ [DETAILED GUIDE] [SAVE PREFERENCES]     │
│                                         │
└─────────────────────────────────────────┘
```

### DLI Calculator

**Formula:**
```
DLI = PPFD × (hours per day / 1000) × 0.0036

where:
  PPFD = photosynthetic photon flux density (μmol/m²/s)
         Estimated from light wattage + distance
  hours = daily photoperiod (18h for veg, 12h for flower)
  0.0036 = conversion factor

DLI targets by stage:
  Seedling:    10–15 mol/day
  Veg:         20–25 mol/day
  Early flower: 25–30 mol/day
  Peak flower:  30–35 mol/day
```

**Estimate PPFD from light wattage (rough):**
- 240W LED @ 80cm over 1m² → ~600 PPFD
- Adjust by distance (inverse square law)

### Nutrient EC Targets

**By stage & medium:**
```
Soil (feed-to-drain strategy):
  Veg week 1–2: EC 0.6–1.0 (light)
  Veg week 3–4: EC 1.0–1.4 (moderate)
  Flower week 1–2: EC 1.4–1.8 (ramp up)
  Flower week 3–6: EC 1.6–2.0 (peak)
  Flower week 7+: EC 1.4–1.6 (reduce N)

Coco (daily hand watering):
  Veg: EC 1.2–1.6 (higher than soil, coco strips faster)
  Flower: EC 1.6–2.2 (higher demand)

Hydro (nutrient film):
  Veg: EC 1.0–1.4
  Flower: EC 1.4–1.8
```

### Storage & Preferences

**Allow user to save preferred ranges:**
```javascript
{
  plantId: "plant-1",
  environmentPreferences: {
    tempMin: 22,
    tempMax: 26,
    rhMin: 45,
    rhMax: 55,
    ecTarget: 1.4,
    vpdTarget: "veg", // stage-based, auto-updates
  }
}
```

### Implementation Plan (Day-by-day breakdown)

**Day 1:** VPD calculation logic + formula testing  
**Day 2:** DLI calculator + PPFD estimation  
**Day 3:** UI rendering (cards, sliders, targets)  
**Day 4:** Integration with setup profile (auto-populate from light wattage, space)  
**Day 5:** Testing + mobile responsive + alerts (optional: notify if out of range)

### Success Criteria
- >40% of users visit environment calculator
- >60% of users adjust at least one parameter after seeing recommendations
- VPD/DLI guidance correlates with fewer "environmental stress" diagnoses (future data analysis)

---

## FEATURE 5: Outcome Verification (P0 — 4 days)

### Current State
- Plant Doctor diagnoses issues, users apply fixes, but tool never asks "did it work?"
- No data on diagnosis accuracy, no feedback loop

### Enhancement: Auto-Prompted Check-in & Success Tracking

**The flow:**

```
Day 1: User diagnoses deficiency (e.g., Nitrogen)
  → Auto-save: { diagnosis: "nitrogen-deficiency", date: "2026-04-08", plant: "plant-1" }

Day 4: Auto-trigger check-in prompt
  [Card appears in app]
  "How's the nitrogen deficiency doing?"
  Options: [Much better ✓] [Improving] [Same] [Worse] [Not sure]
  
  If "Much better" or "Improving":
    → Success recorded
    → Show: "Success! 92% of growers with your setup fixed this in 3–5 days"
    → Suggest: "What helped most? [Reduce feeding] [Increase pH] [Change watering]"
    
  If "Same" or "Worse":
    → Refine prompt: "Let's troubleshoot further..."
    → Re-open Plant Doctor in Multi-Dx mode (refine diagnosis)
    → Suggest: [Check pH] [Consider other factors]
    
  If "Not sure":
    → Education: "Look for signs of improvement: yellowing stops, new growth greens up"
```

### Data Structure

```javascript
{
  diagnosisId: "diag-001",
  plantId: "plant-1",
  diagnosis: "nitrogen-deficiency",
  diagnosisDate: "2026-04-08",
  confidence: 0.87,
  
  // Outcome tracking
  outcomeCheckInDate: "2026-04-11", // Auto-triggered 3 days later
  outcomeStatus: "much-better", // much-better | improving | same | worse | not-sure
  outcomeNotes: "Reduced feeding, leaves turned green",
  
  // For aggregation
  daysToResolution: 3,
  successful: true, // (outcomeStatus in [much-better, improving])
}
```

### Why This Matters

**Immediate value:**
- Closes feedback loop for user ("Does this tool actually work?")
- Builds confidence (success rate badges)
- Enables personalized advice ("You had CalMag issues before; watch for it again")

**Long-term value (moat):**
- Aggregate outcome data: "Soil + LED users with CalMag deficiency had 92% success rate"
- Identify edge cases: "Coco growers had slower resolution (5 days vs 3)"
- Validate diagnoses: Track which diagnosis paths have highest accuracy
- Data for ML models (future): Predict success rate before user applies fix

### Check-in Timing Strategy

**MVP (simple):**
- All diagnoses trigger check-in at day 3
- Customizable later (user sets reminder window)

**Smart timing (future):**
- Different diagnoses have different resolution windows:
  - Nutrient issues: 3–5 days
  - Pest issues: 5–7 days
  - Environmental stress: 1–2 days
  - Root issues: 7–10 days

### UI Placement

**Option A: Modal Card**
```
┌──────────────────────────────┐
│ CHECK IN ON DIAGNOSIS        │
├──────────────────────────────┤
│                              │
│ "Nitrogen deficiency"        │
│ (diagnosed 3 days ago)       │
│                              │
│ How's it doing?              │
│ [Much better ✓]              │
│ [Improving]                  │
│ [Same]                       │
│ [Worse]                      │
│ [Not sure]                   │
│                              │
│ [Optional: Add note]         │
│ [Skip for now]               │
│                              │
└──────────────────────────────┘
```

**Option B: Persistent Card in Timeline**
```
(Appears in journal/history section)
[Nitrogen deficiency] diagnosed 3 days ago
 How did the fix work?
 [Much better ✓] [Improving] [Same] [Worse] [Not sure]
```

**Recommendation:** Option A (modal) — less intrusive, but appears once per diagnosis.

### Implementation Plan (Day-by-day breakdown)

**Day 1:** Data structure + localStorage schema  
**Day 2:** Check-in trigger logic (3-day delay after diagnosis save)  
**Day 3:** UI modal + answer recording  
**Day 4:** Outcome aggregation (for success rate badges) + testing

### Success Criteria
- >70% of diagnosis check-in prompts are answered within 7 days
- >85% of users who answer report "much better" or "improving"
- Success rate badges appear in Plant Doctor diagnoses (future feature)
- Outcome data foundation ready for Phase 2 analytics

---

## INTEGRATION CHECKLIST

### Dependencies Between Features

| Feature | Depends On | Integration Point |
|---------|-----------|-------------------|
| **Task List** | Setup profile + Timeline | Task generation uses stage + medium context |
| **Task List** | Plant Doctor v3 | "Recent diagnoses" → special tasks (e.g., track CalMag) |
| **Env Calculator** | Setup profile | Auto-populate light wattage, space, nutrients |
| **Outcome Verification** | Plant Doctor v3 | Trigger after diagnosis save |
| **Timeline** | Plant Doctor v3 | Link diagnoses to timeline milestones |
| **All features** | localStorage | Unified data model, no server backend |
| **All features** | GA events | Analytics tracking for retention analysis |

### localStorage Schema (Unified)

```javascript
// Existing (keep):
growdoc-plants = [
  {
    id: "plant-1",
    name: "Blue Dream #1",
    medium: "soil",
    lighting: "led",
    createdAt: "2026-04-08",
  }
]

growdoc-active-plant = "plant-1"

growdoc-plant-doctor-v2 = { journal: [...], lastDiagnoses: [...] }

// New (Phase 1):
growdoc-grow-profile = {
  plants: {
    "plant-1": {
      spaceWidth: 80,
      spaceHeight: 160,
      potSize: 11,
      nutrientLine: "general-hydroponics",
      climateControl: "manual",
      // ... rest of enhanced profile
    }
  }
}

growdoc-grow-timeline = {
  plants: {
    "plant-1": {
      vegStartDate: "2026-04-08",
      vegDurationDays: 28,
      flowerStartDate: null,
      flowerDurationDays: 56,
      strainName: "Blue Dream",
      expectedFlowerTime: 56,
    }
  }
}

growdoc-daily-tasks = {
  plants: {
    "plant-1": {
      tasks: [
        { id: "water", text: "...", completed: true, completedAt: "2026-04-08T09:30:00Z" },
        { id: "feed", text: "...", completed: false },
      ],
      lastGenerated: "2026-04-08T00:00:00Z",
    }
  }
}

growdoc-outcome-tracking = {
  diagnoses: [
    { diagnosisId: "diag-001", outcomeStatus: "much-better", outcomeDate: "2026-04-11" }
  ]
}
```

### GA Events to Implement

```javascript
// User onboarding
ga_event("setup_profile_started")
ga_event("setup_profile_completed", { fields_completed: 6 })

ga_event("timeline_created", { veg_days: 28, flower_days: 56 })
ga_event("strain_entered", { strain_name: "Blue Dream" })

ga_event("task_generated", { count: 6, stage: "veg_week_2" })
ga_event("task_completed", { task_id: "water", time_of_day: "morning" })

ga_event("environment_calculator_opened")
ga_event("environment_targets_adjusted", { parameter: "humidity" })

ga_event("outcome_checkin_prompted", { diagnosis: "nitrogen_deficiency" })
ga_event("outcome_checkin_answered", { outcome: "much_better", days_elapsed: 3 })

ga_event("diagnosis_with_outcome", { accuracy_rate: 0.92 })
```

---

## DEPLOYMENT & TESTING PLAN

### Testing Checklist

- [ ] Setup profile form saves to localStorage correctly
- [ ] Timeline milestones render per stage
- [ ] Task list generates correct tasks per setup + stage combo
- [ ] Task check-off persists and updates progress bar
- [ ] Environment calculator VPD/DLI math verified by Franco
- [ ] Outcome check-in triggers at day 3 automatically
- [ ] All GA events fire correctly
- [ ] Mobile responsive (test on iPhone + Android)
- [ ] No console errors
- [ ] <2 sec page load (Vercel performance target)

### Deployment Steps

1. **Week 1:** Local branch + feature branch per team member
2. **Week 2:** Cross-team code review (Franco validates plant science)
3. **Week 3:** Internal testing + refinements
4. **Week 4:** Deploy to Vercel + monitoring

### Rollout Strategy

**Option A: Full Release (Week 4)**
- Deploy all Phase 1 features simultaneously
- Pros: Complete companion loop; clear messaging
- Cons: More QA effort; harder to isolate issues

**Option B: Phased Rollout (Weeks 2–4)**
- Week 2: Setup profile + timeline (foundation)
- Week 3: Daily tasks + environment calc
- Week 4: Outcome verification (closes loop)
- Pros: Easier testing; learn from early feedback
- Cons: Fragmented user experience

**Recommendation:** Option B (phased within 4 weeks) — allows early feedback while staying on schedule.

---

## SUCCESS METRICS (Post-Launch)

### Week 1–2 (Adoption)
- [ ] >70% of new plants have setup profile completed
- [ ] >60% of users view timeline
- [ ] >50% of users have tasks generated

### Week 3–4 (Engagement)
- [ ] >40% daily task completion rate
- [ ] >30% environment calculator visits
- [ ] >20% users check outcomes (when prompted)

### Month 1 (Retention)
- [ ] 7-day retention >50% (vs ~20% current)
- [ ] 30-day retention >30%
- [ ] DAU grows +50% (from task list habit loop)

### Data Quality
- [ ] 1,000+ outcome check-ins recorded
- [ ] 50+ unique setup combinations represented
- [ ] Success rate variance analyzed (which combos work best?)

---

## FOLLOW-UP: Phase 2 Planning (4 weeks later)

Once Phase 1 is live and metrics validate, Phase 2 focuses on:
- Enhanced journal (photo upload + environment logging)
- Harvest window advisor (trichome guidance)
- Outcome aggregation (success rate badges in Plant Doctor)

See: `product-strategy.md` Section II for full Phase 2 spec.

---

**Owner:** Product Management + Franco (cultivation validation)  
**Est. Effort:** 25 dev days + 5 QA/testing days  
**Target Launch:** End of Week 4  
**Success Condition:** >50% DAU with daily tasks in Month 1

