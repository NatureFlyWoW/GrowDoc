# GrowDoc Grow Companion — Interview Transcript

## Round 1: App Shell & First Experience

### Q1: First Visit Experience
**Q:** When a user visits GrowDoc for the first time, what should they see?
**A:** Landing page first — a brief 'what is GrowDoc' page explaining the tool, with a 'Get Started' button leading to setup.

### Q2: Existing Guide Documents
**Q:** The current GrowDoc has 14 guide documents loaded via sidebar + iframe. What happens to these?
**A:** Break into contextual content — dissolve the guides, extract relevant content and surface it contextually within the companion tools.

### Q3: Admin Panel
**Q:** Does the admin panel stay, get removed, or evolve?
**A:** Remove it entirely. The companion replaces the need for editable docs.

### Q4: Sidebar Navigation
**Q:** Always visible, collapsible, icons-only, or top nav?
**A:** Collapsible with toggle — full sidebar with collapse button, collapses to icons-only (~60px). User controls when to expand.

---

## Round 2: Grow Setup & Profile

### Q5: Multiple Simultaneous Grows
**Q:** One active grow at a time or multiple parallel grows?
**A:** One active grow at a time. Simpler UX. Past grows archived.

### Q6: Pot Size Tracking
**Q:** Track pot size? How granular?
**A:** Yes, track per plant. Dropdown with standard sizes. Used for watering frequency estimates.

### Q7: Strain Tracking
**Q:** Free text, optional traits, or strain database?
**A:** Strain database integration. Build/compile a database with known characteristics. User selects from list or adds custom.

### Q8: Units
**Q:** Metric, imperial, or user choice?
**A:** Metric only. Celsius, liters, centimeters, grams.

---

## Round 3: Daily Task Engine

### Q9: Task Specificity
**Q:** How specific should daily task recommendations be?
**A:** Experience-level dependent. Beginners get hyper-specific numbers. Advanced users get brief action items. Content adapts to declared expertise level.

### Q10: Task Actions
**Q:** What can users do with generated tasks?
**A:** Full task management. Done, Dismiss, Snooze, Notes, AND ability to add custom tasks. Grow-specific todo list.

### Q11: Autoflower Support
**Q:** Should the task engine account for autoflowering strains?
**A:** Photoperiod ONLY. No autoflower support.

### Q12: Multi-Stage Plants
**Q:** How handle plants at different stages?
**A:** Per-plant tasks. Each plant gets its own task list based on individual stage. Dashboard shows combined view sorted by priority.

---

## Round 4: Environment, Nutrients & Calculators

### Q13: VPD Calculator Placement
**Q:** Standalone tool or integrated into dashboard?
**A:** Integrated into dashboard. Dashboard shows VPD widget with last-entered temp/RH and current status. User updates values inline.

### Q14: Nutrient Brand Support
**Q:** Brand-specific feeding schedules or brand-agnostic?
**A:** Brand-agnostic only. Generic N-P-K ratios, EC targets, pH ranges. User translates to their specific products.

### Q15: Environment History
**Q:** Point-in-time calculator or historical tracking with trends?
**A:** Log + trend graphs. User can log daily temp/RH highs and lows. App shows trend graphs over weeks. Alerts on drift patterns.

### Q16: Cure Tracker Integration
**Q:** Keep as separate tool, absorb into timeline, or rebuild?
**A:** Absorb into grow timeline. Dry and Cure become stages in the grow timeline. Cure tracking data flows into the same plant/grow profile.

---

## Round 5: Knowledge Base & Evidence

### Q17: Debunked Practice Handling
**Q:** Actively discourage, neutral, or dedicated section?
**A:** Dedicated myth-busting section. Create a 'Myths vs Science' section in the Knowledge Base. Don't interrupt workflow.

### Q18: Evidence Badge Visibility
**Q:** How visible should evidence confidence badges be?
**A:** Visible in Layer 2 (expandable). Recommendation shown clean. When user expands 'Why?', they see evidence level and source.

### Q19: Science vs Practitioner Conflicts
**Q:** When Franco and Professor disagree, who wins?
**A:** Practitioner first, science as validation. Lead with practical advice from experience. Add science as supporting or contradicting evidence below.

### Q20: Deep Reference Links
**Q:** Internal content only or external sources too?
**A:** Internal only. All references point to content within GrowDoc's Knowledge Base. Self-contained, no external dependencies.

---

## Round 6: Plant Doctor Integration

### Q21: Doctor UI in Companion
**Q:** Full page, modal, slide-in panel, or inline?
**A:** Full page view. Navigate to Plant Doctor as its own page. Full screen, all modes. Back button returns to dashboard.

### Q22: Diagnosis Feedback to Task Engine
**Q:** Should past diagnoses auto-generate follow-up tasks?
**A:** User chooses per diagnosis. After a diagnosis, ask: 'Create a follow-up reminder?' If yes, add to task engine. If no, stays in journal.

### Q23: Diagnostic Modes
**Q:** Keep all 3 modes, 2 modes, or redesign?
**A:** Redesign into unified flow. Merge Wizard and Multi-Dx into a single adaptive flow: start with a question, allow multi-symptom selection at any point, refine as needed.

### Q24: Treatment Outcome Tracking
**Q:** Track treatment outcomes over time?
**A:** Yes, track outcomes. Every diagnosis gets follow-up. Outcomes logged. Build personal 'what works' database.

---

## Round 7: Quick Log, Journal & Data

### Q25: Feed Log Detail
**Q:** What data fields for logging a feeding?
**A:** Adaptive: minimal default, expandable. 'Fed' is one tap. Expanding shows optional pH, EC, volume, nutrient fields.

### Q26: Data Export/Backup
**Q:** Support export/import for backup?
**A:** Not important for now. Skip backup features. Can add later.

### Q27: Grow Comparison
**Q:** What should grow comparison look like?
**A:** Skip for first version. Build data model to support comparison but don't build UI yet.

### Q28: Data Retention
**Q:** How long keep grow history in localStorage?
**A:** Archive old grows (summary only). After grow completion, keep summary but discard detailed daily logs. Saves space.

---

## Round 8: Priority System Deep Dive

### Q29: Slider Math
**Q:** Sum to 100%, independent 0-100, stars, or primary/secondary?
**A:** Weighted 1-5 stars each. Rate each priority 1-5 stars. Simpler UI. App calculates relative weights internally.

### Q30: Effect Priority Detail
**Q:** Specific effect selection or general optimization?
**A:** Specific effect selection. Dropdown or tags: Energetic / Relaxing / Creative / Pain Relief / Anti-Anxiety / Sleep. Targets specific terpene profiles.

### Q31: Priority Timing
**Q:** Set per-grow (locked) or changeable mid-grow?
**A:** Changeable anytime. Priorities can be adjusted at any point. Recommendations immediately recalculate.

### Q32: Recommendation Display
**Q:** Show only priority-adjusted rec, full range, or trade-off note?
**A:** Priority recommendation + trade-off note. Show your recommendation PLUS what you'd gain/lose by waiting or changing approach.

---

## Round 9: Landing Page, Onboarding & Experience Level

### Q33: Landing Page Tone
**Q:** Clean/minimal, feature showcase, value prop, or interactive demo?
**A:** Clean and minimal. Hero text, 3 feature highlights, one 'Get Started' button. Under 1 screen.

### Q34: Onboarding Steps
**Q:** How many steps before dashboard?
**A:** Full setup wizard (7-10 steps). Stage, medium, lights, pot size, plant count, strain, space size, experience, priorities. ~2-3 minutes. Best first recommendations.

### Q35: Experience Level Labels
**Q:** What labels for experience levels?
**A:** First Grow / Beginner / Intermediate / Advanced / Expert. Standard 5-level scale.

### Q36: Indoor/Outdoor Question
**Q:** Ask about indoor vs outdoor?
**A:** Don't ask, assume indoor. The app is clearly indoor-focused.

---

## Round 10: Harvest, Training & Stage Management

### Q37: Trichome Input Method
**Q:** How should users enter trichome data?
**A:** Three sliders: Clear / Milky / Amber. Must sum to 100%. Most precise.

### Q38: Training Planner
**Q:** Dedicated planner, part of task engine, or reference only?
**A:** Dedicated Training Planner. A section in 'My Grow' where users set training strategy. App generates schedule with milestones.

### Q39: Stage Transitions
**Q:** Auto-advance, manual, or hybrid?
**A:** Auto-advance with confirm. App detects typical duration, shows prompt: 'Ready to move to veg? [Yes] [Not yet]'

### Q40: Dry/Cure Detail Level
**Q:** Full logging, simplified check-ins, adaptive, or milestone-based?
**A:** Full logging (like current Cure Tracker). Detailed daily logs: temp, RH, smell, snap test. Week-by-week cure tracking with burp reminders.

---

## Round 11: Strain Database & Technical

### Q41: Strain Database Source
**Q:** Curated list, large pre-built, user-contributed, or hybrid?
**A:** Large pre-built database. Compile 500+ strains from public sources. More coverage.

### Q42: Strain Data Fields
**Q:** Minimal, standard, comprehensive, or progressive?
**A:** Standard: name + flower time + stretch ratio + known sensitivities. Good balance for recommendations.

### Q43: localStorage Strategy
**Q:** Accept 5MB limit, compression, hybrid, or warn at 80%?
**A:** Warn user at 80% capacity. Accept the limit but show warning. Suggest archiving or exporting.

### Q44: Offline Support
**Q:** Online only, PWA later, PWA now, or full PWA?
**A:** Online only (current behavior). Requires internet. Simplest.

---

## Round 12: Visual Design & Polish

### Q45: Theme Direction
**Q:** Dark, light, toggle, or hybrid?
**A:** Dark theme (Plant Doctor style). #0c0e0a background, green accents. Matches grow room vibe.

### Q46: Landing Page Style
**Q:** Purely functional, botanical touches, illustration, or animated?
**A:** Purely functional. Text, maybe an icon, one button. Fast load, clear purpose.

### Q47: Timeline Visualization
**Q:** Horizontal bar, vertical timeline, arc, or calendar?
**A:** Horizontal progress bar. Left-to-right with stage markers. Current position highlighted. Clean and scannable.

### Q48: Priority Colors
**Q:** Suggested colors or adjust?
**A:** Custom adjustment: Quality=Gold, Yield=Green, Terpenes=Purple, Effect=Indigo. (Swapped Quality and Yield from original suggestion.)

---

## Final Round: Edge Cases

### Q49: Grow End Flow
**Q:** Finish flow, auto-archive on new grow, or just archive?
**A:** Finish flow + between-grows mode. Explicit finish with summary. App enters 'between grows' mode with past grow summary and planning tools.

### Q50: Stealth Audit
**Q:** Include, remove, or reimagine?
**A:** Include as-is in Tools. Keep as standalone tool in Tools section.

### Q51: Community Features
**Q:** Personal only, community later, anonymous insights, or open to ideas?
**A:** Strictly personal, always. No community features ever. Privacy-first. No data leaves the browser.

### Q52: Anything Else
**Q:** Any additional requirements or opinions?
**A:** No, you've covered everything. Proceed to writing the plan.
