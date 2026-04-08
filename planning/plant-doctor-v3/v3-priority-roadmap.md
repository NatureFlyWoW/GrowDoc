# Plant Doctor v3: Priority Roadmap

**Objective:** Move from "nice-to-have reference" to "must-use diagnostic tool"  
**Timeline:** 2-3 weeks (can parallelize)  
**Owner:** Product + Engineering  
**Success Criteria:** Analytics integration complete, hero section live, all changes tested

---

## Phase 1: Quick Wins (Week 1 — Highest ROI)

### 1.1 Add Hero Section with Value Proposition
**Why:** Users don't understand what the tool does or why they should use it.  
**Impact:** +25-35% CTR from landing → diagnosis flow

**Changes:**
- Remove/hide first question until "Start Diagnosis" clicked
- Add hero card above mode selector:

```html
<section class="hero">
  <h2>Plant Doctor — Diagnose in 2 Minutes</h2>
  <p>Your plant is struggling. Diagnose what's wrong.</p>
  <ul class="hero-benefits">
    <li>44 plant conditions covered</li>
    <li>Personalized to your grow setup</li>
    <li>Step-by-step fixes</li>
  </ul>
  <button class="btn btn-primary" onclick="startDiagnosis()">
    Start Diagnosis
  </button>
  <button class="btn btn-secondary" onclick="showExamples()">
    See Examples
  </button>
</section>
```

- Add CSS for hero styling (background, typography, spacing)
- Add optional "Examples" modal (3-4 common issues with images)
- Hide hero after first diagnosis (show "New diagnosis" link instead)

**Effort:** 1 day  
**Testing:** Visual QA, mobile rendering, click tracking

---

### 1.2 Integrate Analytics & Feedback Loop
**Why:** No data = no iteration. Can't prove product value or improve diagnoses.  
**Impact:** Enables data-driven decision-making for all future changes

**Changes:**
- Add lightweight analytics library (recommend: Vercel Analytics or Plausible)
- Instrument key funnel points:
  ```javascript
  // Page loads
  trackEvent('plant_doctor:view', {mode: 'initial'});
  
  // User interactions
  trackEvent('plant_doctor:mode_selected', {mode: 'wizard'|'expert'|'multi_dx'});
  trackEvent('plant_doctor:diagnosis_completed', {
    resultId: 'r-n-def',
    confidence: 0.87,
    symptomCount: 3,
    mode: 'wizard'
  });
  
  // Feedback collection
  trackEvent('plant_doctor:feedback', {
    accuracy: 'spot_on'|'mostly_right'|'not_helpful',
    diagnoses: ['r-n-def', 'r-ca-def']
  });
  ```

- Add post-diagnosis feedback form:
  ```html
  <div class="feedback-form">
    <p>How accurate was this diagnosis?</p>
    <button onclick="submitFeedback('spot_on')">Spot on ✓</button>
    <button onclick="submitFeedback('mostly_right')">Mostly right</button>
    <button onclick="submitFeedback('not_helpful')">Not helpful</button>
  </div>
  ```
  
- Store feedback in localStorage, beacon to analytics endpoint

**Effort:** 1.5 days  
**Testing:** Network inspection (verify events send), analytics dashboard verification

---

### 1.3 Replace Plant Sidebar with Dropdown
**Why:** Sidebar wastes 15% screen space, adds clutter. Dropdown provides same functionality.  
**Impact:** +15% perceived cleanliness, better mobile UX

**Changes:**
- Remove sidebar HTML (DOM simplification)
- Replace with dropdown selector at top:
  ```html
  <div class="plant-selector">
    <label>Plant:</label>
    <select id="plant-select" onchange="switchPlant(this.value)">
      <option value="plant-1">Plant #1</option>
      <option value="plant-2">Plant #2</option>
      <option value="">+ Add Plant</option>
    </select>
  </div>
  ```
- Update CSS to remove sidebar layout (grid/flex adjustment)
- Update state management to sync dropdown with selected plant
- localStorage still persists per-plant data

**Effort:** 2 days  
**Testing:** Switching plants, persistence across reloads, mobile responsiveness

---

### 1.4 Add Urgency Badges to Critical Diagnoses
**Why:** Broad mites need action in hours; N deficiency can wait. Users need clear urgency.  
**Impact:** Safety + credibility

**Changes:**
- Add urgency field to result nodes in TREE/SCORING:
  ```javascript
  r: {
    // ... existing fields
    urgency: 'critical',  // 'critical' | 'warning' | 'informational'
    timeframe: '24 hours' // e.g., '24 hours', '3-5 days'
  }
  ```

- Add urgency badge to result card:
  ```html
  <div class="result-urgency urgent-critical">
    🔴 CRITICAL — Act within 24 hours
  </div>
  ```

- CSS for urgency colors:
  ```css
  .result-urgency {
    margin-bottom: 14px;
    padding: 8px 12px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.85rem;
  }
  .urgent-critical {
    background: rgba(196,92,74,0.2);
    color: var(--red);
  }
  .urgent-warning {
    background: rgba(201,168,76,0.2);
    color: var(--gold);
  }
  ```

**Effort:** 1 day  
**Testing:** Visual verification, edge cases (multiple diagnoses with different urgencies)

---

## Phase 2: Core Experience Improvements (Week 2)

### 2.1 Move Lighting Question to Primary Flow
**Why:** Lighting type (LED vs HPS) significantly affects Ca/Mg diagnosis accuracy. Currently buried in v3 spec.  
**Impact:** +15% diagnostic accuracy for Cal/Mag deficiencies

**Changes:**
- Add lighting question after medium question in all modes:
  ```
  Wizard flow: Medium → Lighting → Stage → Symptoms
  Expert mode: Medium dropdown, Lighting dropdown, Stage dropdown, ...
  Multi-Dx: Medium selector, Lighting selector, Stage pills, Symptoms checkboxes
  ```

- Add to state object:
  ```javascript
  state.lighting = 'led' | 'hps' | 'cfl' | 'fluorescent' | 'natural';
  ```

- Update scoring engine to apply lighting modifier:
  ```javascript
  if (state.lighting === 'led') {
    // Boost Cal/Mag-related diagnoses by +0.15
    scores.forEach(function(s) {
      if (['r-ca-def', 'r-ca-def-new', 'r-mg-def', 'r-mg-def-spots', 'r-ca-mg'].includes(s.resultId)) {
        s.score = Math.min(s.score + 0.15, s.baseConfidence);
      }
    });
  }
  ```

- Persist lighting selection in localStorage and show as editable badge

**Effort:** 2 days  
**Testing:** Scoring verification (LED boosts Cal/Mg), persistence, all modes

---

### 2.2 Reframe Notes as "Describe Your Situation"
**Why:** Current "Add notes" label is hidden/optional. Notes are core feature, not annotation.  
**Impact:** +40-50% adoption, users feel heard, better diagnoses

**Changes:**
- Rename toggle: "Add notes" → "Describe your situation (helps with diagnosis)"
- Add help text: "Details about environment, water, etc. improve accuracy"
- Add example placeholder:
  ```html
  <textarea placeholder="e.g., 'temp is 75°F, RH 50%, using tap water 2 weeks into flower'">
  </textarea>
  ```

- In results, surface impact:
  ```html
  <div class="result-notes">
    <p class="result-notes-title">Based on your notes:</p>
    <div class="note-insights">
      <p>High temperature + high RH confirms heat stress risk...</p>
    </div>
  </div>
  ```

- In journal: Show "Notes that helped this diagnosis" (learning loop)

**Effort:** 1.5 days  
**Testing:** UX testing (feels like context gathering, not annotation)

---

### 2.3 Make Growth Stage Optional (Default: Vegetative)
**Why:** Many users don't know exact stage. Optional with smart default reduces friction.  
**Impact:** Faster onboarding, reduced form abandonment

**Changes:**
- Update wizard flow: If user skips stage question, default to 'vegetative'
- Update expert mode: Stage dropdown has placeholder "Unknown (will assume Veg)"
- Update multi-dx: Stage pills have "Unsure? Skip" option (uses default)
- Update scoring: If stage is not explicitly set, use 'vegetative' modifier

**Effort:** 1 day  
**Testing:** Scoring verification with and without stage

---

### 2.4 Consolidate Grow Profile Display
**Why:** Current editable badges + dropdowns + pills are 3 different patterns. Consolidate.  
**Impact:** Cleaner UI, easier to understand

**Changes:**
- Replace badges with single "Growing Setup" card at top:
  ```html
  <div class="growing-setup-card">
    <div class="setup-item">
      <label>Medium</label>
      <select>...</select>
    </div>
    <div class="setup-item">
      <label>Lighting</label>
      <select>...</select>
    </div>
    <div class="setup-item">
      <label>Growth Stage</label>
      <select>...</select>
    </div>
    <button onclick="hideSetupCard()">Done</button>
  </div>
  ```
- Only show when clicked from "Edit Setup" link
- Cleaner presentation overall

**Effort:** 1.5 days  
**Testing:** Visual QA, interaction flows

---

## Phase 3: Retention & Feedback (Week 3)

### 3.1 Simplify Journal — Add Outcome Tracking
**Why:** Journal exists but isn't compelling. Add "Did it work?" to close loop.  
**Impact:** +30% retention, clear outcome data

**Changes:**
- Simplify "Save & Start Tracking" flow:
  1. Show diagnosis
  2. User clicks "Track This" (saves to journal with timestamp)
  3. Later: Show "Check In" prompt in journal
  4. User selects: "Improved" / "Same" / "Worse" / "New symptoms"
  5. If improved: "Which fixes helped most?" (multi-select)
  6. Show success rate: "92% of growers fixed this in 3 days"

- Update journal data model:
  ```javascript
  journalEntry = {
    id: uuid(),
    diagnosis: 'r-n-def',
    createdAt: timestamp,
    outcomes: [
      { checkInAt: timestamp, status: 'improved', fixesTried: ['reduce_nitrogen', ...] }
    ],
    resolved: true
  };
  ```

- Update UI: Journal dashboard shows:
  - "Active treatments" (diagnosed <7 days ago, no check-in)
  - "Recent outcomes" (checked in, resolved/unresolved)
  - Success stats: "87% success rate for N deficiency in your setup"

**Effort:** 2.5 days  
**Testing:** End-to-end flow, localStorage persistence, success rate calculations

---

### 3.2 Add "Compare Diagnoses" UI
**Why:** Users want to know "why is #1 more likely than #2?" Current design doesn't support this.  
**Impact:** Increased confidence, educational value

**Changes:**
- Add "Compare top 2" button in results section
- Modal shows side-by-side:
  ```
  ┌─────────────────────────┬─────────────────────────┐
  │ N DEFICIENCY (87%)      │ K DEFICIENCY (62%)      │
  ├─────────────────────────┼─────────────────────────┤
  │ ✓ Yellow lower leaves   │ ✓ Yellow leaf edges     │
  │ ✓ Pale overall          │ ✗ Pale overall          │
  │ ✗ Interveinal pattern   │ ✓ Burning on edges      │
  │                         │                         │
  │ Corroborating factors:  │ Corroborating factors:  │
  │ • High N feed applied   │ • Low K in flower stage │
  └─────────────────────────┴─────────────────────────┘
  To confirm N deficiency:   To confirm K deficiency:
  → Check newer growth       → Check leaf edge burn
  → Reduce feed by 30%       → Add K booster
  ```

**Effort:** 1.5 days  
**Testing:** Data accuracy, UI rendering, mobile scrolling

---

## Phase 4: Documentation & Launch (Week 3)

### 4.1 Update Docs & Onboarding Content
**Changes:**
- [ ] Update README with new features
- [ ] Add "How Plant Doctor Works" guide (1-page)
- [ ] Create example diagnoses (3 screenshots)
- [ ] Add FAQ: "When should I use this vs forums?"
- [ ] Update inline help text throughout

**Effort:** 1 day

---

### 4.2 Testing & QA Checklist

**Functional:**
- [ ] All three modes work (Wizard, Expert, Multi-Dx)
- [ ] Medium + Lighting + Stage persist across reloads
- [ ] Scoring applies modifiers correctly
- [ ] Analytics events send (verify in dashboard)
- [ ] Feedback form submits
- [ ] Journal CRUD works
- [ ] Plant selector switches context correctly

**UX:**
- [ ] Hero section renders correctly (desktop + mobile)
- [ ] Urgency badges show for critical diagnoses
- [ ] Notes feature is discoverable
- [ ] Setup card displays clearly
- [ ] Compare diagnoses modal works

**Performance:**
- [ ] Page load time < 2s (track)
- [ ] No console errors
- [ ] localStorage doesn't exceed quota

**Accessibility:**
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader reads all content
- [ ] Color contrast passes WCAG AA
- [ ] Focus states visible

**Effort:** 2 days

---

## Success Criteria for v3

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| **Engagement** | >40% complete diagnosis | GA funnel (view → select medium → symptoms → result) |
| **Satisfaction** | >75% "helpful" feedback | Feedback form responses |
| **Retention** | >20% return >2x/month | GA cohort analysis (repeat users 30d) |
| **Journal Adoption** | >15% "Save to journal" | localStorage journal entry count / diagnosis count |
| **Growth** | +50% traffic YoY | GA traffic growth (organic search priority) |
| **Outcome Data** | >200 check-ins/month | Journal check-in submissions |

---

## Rollout Plan

1. **Dev:** Build & test on feature branch (5-7 days)
2. **Staging:** Deploy to staging environment, internal QA (1-2 days)
3. **Launch:** Deploy to production (vercel --prod)
4. **Monitor:** Track analytics for 1 week, fix any issues
5. **Review:** Check metrics against targets, iterate

---

## Out of Scope for v3 (Defer to v3.1 or v4)

- [ ] Mobile-specific UX optimizations (e.g., symptom search)
- [ ] Educational content links (external)
- [ ] Predictive alerts (season/environment-based)
- [ ] Community insights leaderboard
- [ ] Expert consultation integration (API)
- [ ] Image upload for diagnosis validation
- [ ] PDF export of diagnosis

---

## Dependencies & Blockers

- **Vercel deployment:** Assumes production access (has it)
- **Analytics setup:** Choose Vercel Analytics, Plausible, or custom beacon (1 day setup)
- **Testing:** Need QA environment for cross-browser testing
- **Designer:** None (text + CSS only, no new visuals needed)

---

## Resource Estimate

| Phase | Owner | Effort | Timeline |
|-------|-------|--------|----------|
| 1.1 Hero section | Frontend | 1 day | Week 1 |
| 1.2 Analytics | Frontend | 1.5 days | Week 1 |
| 1.3 Sidebar → Dropdown | Frontend | 2 days | Week 1 |
| 1.4 Urgency badges | Frontend | 1 day | Week 1 |
| 2.1 Lighting question | Frontend | 2 days | Week 2 |
| 2.2 Reframe notes | Frontend/Copy | 1.5 days | Week 2 |
| 2.3 Stage optional | Frontend | 1 day | Week 2 |
| 2.4 Setup card | Frontend | 1.5 days | Week 2 |
| 3.1 Journal outcomes | Frontend | 2.5 days | Week 3 |
| 3.2 Compare diagnoses | Frontend | 1.5 days | Week 3 |
| 4.1 Docs | Product | 1 day | Week 3 |
| 4.2 QA & Testing | QA/Frontend | 2 days | Week 3 |
| | | | |
| **TOTAL** | 1 person | **18.5 days** | **~3 weeks** |

**Note:** Can parallelize 1.1-1.4 in week 1, 2.1-2.4 in week 2. If 2 engineers, can complete in 2 weeks.

---

## Sign-Off

- **PM:** Review and approve roadmap
- **Engineering:** Estimate and commit to timeline
- **QA:** Prepare testing plan
- **Launch:** Schedule deployment window

---

**Next:** Schedule kickoff meeting to review roadmap and assign tasks.
