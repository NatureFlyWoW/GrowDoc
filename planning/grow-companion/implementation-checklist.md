# Phase 1 Implementation Checklist: "Grow Intelligence" MVP

**Duration:** 4 weeks  
**Team:** Product + Franco (validation) + UX + Engineering + Analytics  
**Deployment Target:** Vercel (growdoc.vercel.app)

---

## PRE-LAUNCH: WEEKS -1 TO 0

### [ ] Leadership Alignment
- [ ] Executive brief reviewed and approved
- [ ] Phase 1 scope locked (no scope creep)
- [ ] Timeline agreed (4 weeks hard deadline)
- [ ] Success metrics defined (>70% D7R, >40% task completion, >50% setup adoption)
- [ ] Budget allocated (if needed)
- [ ] Stakeholders assigned (Franco, UX, Eng, Analytics, Marketing)

### [ ] Franco Validation (CRITICAL PATH)
- [ ] VPD targets by stage validated
- [ ] DLI calculation formula approved
- [ ] Nutrient EC ranges by stage + medium confirmed
- [ ] Task definitions (12-16 core tasks) reviewed for cultivation accuracy
- [ ] Outcome verification timing (3 days default) confirmed
- [ ] **Sign-off:** Franco writes "Cultivation science validated" note

### [ ] UX & Design
- [ ] Setup profile form flow designed (conversational or single-page decision)
- [ ] Task list UI mocked up
- [ ] Timeline card layout approved
- [ ] Environment calculator visual approved
- [ ] Outcome check-in modal designed
- [ ] Mobile responsive layouts created (iPhone + Android)
- [ ] Accessibility checklist completed (ARIA roles, keyboard nav)

### [ ] Engineering Estimates
- [ ] Setup profile: 3 days (data structure + persistence + UI)
- [ ] Timeline: 6 days (calculations + milestones + UI)
- [ ] Task list: 7 days (generation logic + UI + check-off behavior)
- [ ] Environment calc: 5 days (VPD/DLI formulas + UI)
- [ ] Outcome verification: 4 days (trigger logic + UI + storage)
- [ ] Testing + refinement: 5 days
- [ ] **Total: 30 days** (5 days buffer for unknowns)

### [ ] Analytics Setup
- [ ] GA events list created (see phase-1-specs.md)
- [ ] GA4 property configured
- [ ] Event tracking code ready (can be deployed in parallel with features)
- [ ] Funnel analysis dashboard sketched (signup → setup profile → timeline → tasks → outcomes)
- [ ] Daily/weekly reporting defined (who sees what, when)

### [ ] Marketing & Communications
- [ ] Launch messaging written (see competitive-analysis.md positioning)
- [ ] Franco's voice guide created ("how Franco would explain this feature")
- [ ] Blog post outline: "Why daily tasks matter in grows" (published post-launch)
- [ ] Reddit post prepared (r/microgrowery) — wait for launch readiness
- [ ] Email template for early users (feature announcement)
- [ ] In-app messaging defined (welcome modal, feature education)

---

## DEVELOPMENT: WEEKS 1–4

### WEEK 1: Foundation

#### Feature 1: Enhanced Setup Profile
- [ ] **Day 1:** Data structure designed
  - [ ] localStorage schema finalized
  - [ ] Plant object extended with: space, nutrients, climate, experience
  - [ ] Validation rules defined (required vs optional fields)

- [ ] **Day 2:** Backend logic
  - [ ] Save/load functions from localStorage
  - [ ] Default values if skipped
  - [ ] Validation error handling

- [ ] **Day 3:** UI implementation (conversational flow)
  - [ ] Screen 1: Space dimensions with optional help text
  - [ ] Screen 2: Lighting wattage (auto-filled from plant profile)
  - [ ] Screen 3: Nutrients + feeding style
  - [ ] Screen 4: Climate control capability
  - [ ] Mobile responsive testing
  - [ ] Accessibility review (keyboard nav, screen readers)

- [ ] Code review + merge to main
- [ ] Vercel preview deploy test

#### Feature 2: Growth Timeline (Part 1)
- [ ] **Day 4:** Data structure + calculations
  - [ ] Timeline object schema
  - [ ] Date math functions (days in stage, progress %, milestones)
  - [ ] Milestone definitions (what happens at week 1, 2, 3, 4 of veg vs flower)

- [ ] **Day 5:** Strain DB MVP (manual entry)
  - [ ] Strain input form + localStorage
  - [ ] Expected flower time defaults by strain (if available)
  - [ ] Stretch ratio estimation

- [ ] **Day 6:** UI rendering (timeline card)
  - [ ] Progress bar with week indicators
  - [ ] Current week + milestone display
  - [ ] "Days remaining" countdown
  - [ ] Mobile responsive testing

#### Analytics Integration (Parallel)
- [ ] **All week:** GA event tracking infrastructure
  - [ ] `setup_profile_started`, `setup_profile_completed` events
  - [ ] `timeline_created` event
  - [ ] Custom dimension: grower experience level
  - [ ] Test GA event firing (use GA debugger)

**End of Week 1 Deliverable:**
- [ ] Setup profile feature complete + tested
- [ ] Timeline feature 80% complete
- [ ] GA events flowing
- [ ] Preview deploy working

### WEEK 2: Core Features

#### Feature 2: Growth Timeline (Part 2)
- [ ] **Day 1:** Finalize timeline UI
  - [ ] Milestone alerts triggering correctly
  - [ ] Stage transitions (veg → flower) working
  - [ ] Manual override for stage changes
  - [ ] Test edge cases (user sets wrong dates, flips early, etc.)

#### Feature 3: Daily Task List (Part 1)
- [ ] **Day 2–3:** Task engine
  - [ ] TASK_DEFINITIONS library finalized (12–16 core tasks)
  - [ ] Task generation logic based on (stage, medium, experience)
  - [ ] Task rules for recent diagnoses (if had CalMag issue, add CalMag task for 3 weeks)
  - [ ] Franco review of task accuracy

- [ ] **Day 4–5:** UI implementation
  - [ ] Task card list view
  - [ ] Checkboxes + completion tracking
  - [ ] Progress bar (X of Y tasks completed)
  - [ ] Category grouping (Essential / Monitoring / Optional)
  - [ ] Mobile responsive

- [ ] **Day 6:** Check-off behavior
  - [ ] Timestamp recording on completion
  - [ ] UI feedback (checkmark animation)
  - [ ] localStorage persistence

#### Analytics (Parallel)
- [ ] `task_generated` event (count, stage)
- [ ] `task_completed` event (task_id, time_of_day)
- [ ] `setup_profile_field_completed` events (track which fields users fill)

**End of Week 2 Deliverable:**
- [ ] Setup profile + Timeline complete + tested
- [ ] Task list 80% complete
- [ ] GA event tracking live
- [ ] Preview deploy tested

### WEEK 3: Optimization & Calculators

#### Feature 3: Daily Task List (Part 2)
- [ ] **Day 1:** Finalize & test
  - [ ] All task categories working
  - [ ] Task language reviewed by Franco (accurate?)
  - [ ] Performance tested (no lag on 20+ tasks)
  - [ ] Mobile UX tested

#### Feature 4: Environment Calculator
- [ ] **Day 2–3:** VPD + DLI formulas
  - [ ] SVP saturation vapor pressure lookup tables
  - [ ] VPD calculation function (tested vs known values)
  - [ ] DLI calculation (PPFD × hours × 0.0036)
  - [ ] PPFD estimation from light wattage + distance

- [ ] **Day 4:** UI implementation
  - [ ] Temperature + humidity input sliders
  - [ ] Real-time VPD calculation display
  - [ ] DLI calculator with light wattage input
  - [ ] Target ranges displayed (with stage-aware context)
  - [ ] EC target calculator

- [ ] **Day 5:** Testing
  - [ ] Franco validates VPD math against known values
  - [ ] Test edge cases (extreme temps, humidity)
  - [ ] Mobile responsive

- [ ] **Day 6:** Integration with setup profile
  - [ ] Auto-populate light wattage
  - [ ] Auto-populate space dimensions (for DLI calculation)
  - [ ] Save user preferences (temp/RH targets)

#### Analytics (Parallel)
- [ ] `environment_calculator_opened`
- [ ] `environment_targets_adjusted` (track which parameters users care about)

**End of Week 3 Deliverable:**
- [ ] Setup profile + Timeline + Task list complete + tested
- [ ] Environment calculator complete
- [ ] All core features deployed to preview branch
- [ ] Code review process complete

### WEEK 4: Outcome Verification & Polish

#### Feature 5: Outcome Verification
- [ ] **Day 1–2:** Trigger logic
  - [ ] Track diagnosis saves (diagnosisId, date)
  - [ ] 3-day timer (trigger check-in on day 3)
  - [ ] Check-in appearance (modal card preferred)
  - [ ] localStorage persistence of outcomes

- [ ] **Day 3:** UI implementation
  - [ ] Modal design (diagnosis name, options, optional notes)
  - [ ] Response recording (much-better, improving, same, worse, not-sure)
  - [ ] Success rate aggregation (first batch)
  - [ ] Mobile responsive

- [ ] **Day 4:** Integration + testing
  - [ ] Outcome check-in triggered at correct time
  - [ ] No duplicate prompts
  - [ ] Outcome data saved correctly

#### Analytics (Parallel)
- [ ] `outcome_checkin_prompted` (when, for which diagnosis)
- [ ] `outcome_checkin_answered` (response, days_elapsed)
- [ ] `outcome_conversion_rate` (% of diagnoses with outcome verification)

#### Quality Assurance & Testing
- [ ] **Day 5:** Full regression testing
  - [ ] All 5 features working together
  - [ ] Plant Doctor v3 unaffected
  - [ ] Mobile responsive (iPhone + Android)
  - [ ] Performance tested (<2 sec load time)
  - [ ] No console errors

- [ ] **Day 5-6:** Bug fixes + refinements
  - [ ] Franco final review (cultivation accuracy)
  - [ ] UX review (Is the flow intuitive?)
  - [ ] Analytics review (All events firing correctly?)

#### Documentation
- [ ] [ ] Code comments + function documentation
- [ ] [ ] Feature rollout guide for team
- [ ] [ ] Data schema documented (what's in localStorage)
- [ ] [ ] Analytics event list finalized

#### Deployment
- [ ] [ ] Final branch merge to main
- [ ] [ ] Vercel production deployment (`vercel --prod`)
- [ ] [ ] Smoke tests on production (all features working)
- [ ] [ ] GA events confirmed live
- [ ] [ ] Performance monitoring enabled

**End of Week 4 Deliverable:**
- [ ] All 5 Phase 1 features complete + deployed
- [ ] >95% test coverage (unit + integration)
- [ ] Analytics flowing to GA4
- [ ] Vercel production live
- [ ] Team trained on feature behavior
- [ ] Marketing ready to announce

---

## POST-LAUNCH: WEEK 5+

### Week 5: User Testing & Iteration

- [ ] Monitor analytics dashboard daily
  - [ ] Setup profile adoption rate (target: >80%)
  - [ ] Task list completion rate (target: >40%)
  - [ ] Task generation count (should be 6–12 per plant)
  - [ ] Outcome check-in response rate (target: >70%)
  - [ ] Daily active users (should see increase)

- [ ] User feedback collection
  - [ ] In-app survey: "Which feature helped most?"
  - [ ] Monitor Reddit mentions (r/microgrowery)
  - [ ] Collect support tickets (what's confusing?)

- [ ] First iteration based on data
  - [ ] If task completion <30%, redesign task language
  - [ ] If setup profile adoption <60%, make more fields optional
  - [ ] If check-in response <50%, adjust timing or framing
  - [ ] Quick fixes deployed within 3–5 days

### Weeks 6–8: Phase 1 Stabilization

- [ ] Weekly metrics review
  - [ ] Retention cohorts (7-day, 14-day, 30-day)
  - [ ] Feature adoption per user segment
  - [ ] Churn reasons (if available)
  - [ ] NPS if possible (send surveys)

- [ ] Content marketing
  - [ ] Blog post published: "5 Daily Tasks Every Grower Should Do"
  - [ ] Franco guide: "Why outcome tracking matters"
  - [ ] Video content (if possible): Task list walkthrough

- [ ] Community outreach
  - [ ] Reddit posts in r/microgrowery, r/cannabis
  - [ ] Discord communities (ask if you can share)
  - [ ] Forum posts (ICMag, Grower.ch)

### Weeks 9–12: Phase 2 Planning

- [ ] User interviews (5–10 early adopters)
  - [ ] What worked? What didn't?
  - [ ] What would make this essential?
  - [ ] Would you pay for X feature?

- [ ] Metrics analysis
  - [ ] Which features have highest engagement?
  - [ ] Which user segments retained best?
  - [ ] What's the lifetime value looking like?

- [ ] Phase 2 roadmap lock
  - [ ] Prioritize: Enhanced journal vs Harvest window vs Outcome aggregation
  - [ ] Timeline: Start Phase 2 Week 13

---

## SUCCESS CRITERIA (4-Week Mark)

### Quantitative
- [ ] **Adoption:** >80% of new plants have setup profile
- [ ] **Engagement:** >40% daily task completion rate
- [ ] **Retention:** >70% 7-day retention
- [ ] **Outcome:** >70% check-in response rate
- [ ] **Performance:** <2 sec page load time
- [ ] **Quality:** <5 support tickets with feature bugs
- [ ] **Analytics:** All GA events firing correctly

### Qualitative
- [ ] Franco validates all cultivation advice is sound
- [ ] Users report "this is genuinely helpful" (in feedback)
- [ ] >50% of new users complete at least 1 task (habit signal)
- [ ] No major UX friction reported
- [ ] Word-of-mouth referrals starting

---

## RISK MITIGATION CHECKLIST

### Technical Risks
- [ ] **Mobile responsiveness breaks** → Test on real devices weekly, use responsive design patterns
- [ ] **localStorage data corruption** → Back up user data to localStorage + regular sanity checks
- [ ] **GA event tracking breaks** → Test GA events daily in staging, use GA debugger
- [ ] **Vercel deployment fails** → Dry-run deployment process pre-launch, have rollback plan

### Product Risks
- [ ] **Task completion <30%** → Have Plan B: redesigned task language, reduced task count
- [ ] **Setup profile <60% adoption** → Have Plan B: make all fields optional, show value first
- [ ] **Outcome check-in <50%** → Have Plan B: adjust timing, make less intrusive
- [ ] **Retention doesn't improve** → Have Plan B: run user interviews, pivot feature focus

### Team Risks
- [ ] **Key person unavailable** → Cross-train on all features, document code thoroughly
- [ ] **Scope creep** → Weekly scope lock meetings, any new ideas go to Phase 2
- [ ] **Timeline slips** → Daily standup, identify blockers early, escalate if needed
- [ ] **Franco unavailable** → Get all validations & sign-offs by end of Week 1

---

## WEEKLY STANDUP CADENCE

**Every Monday 9 AM (15 min):**
- Status: On track? Risks?
- Blockers: Anything stuck?
- This week's goals: What will be done

**Every Friday 4 PM (30 min):**
- Demo: Show working features
- Metrics: How are we doing vs targets?
- Next week: What's coming

**Franco Check-ins:**
- End of Week 1: Validate all science
- End of Week 3: Environment calculator math + task accuracy
- End of Week 4: Final sign-off on cultivation advice

---

## DEFINITION OF DONE (Per Feature)

Each feature is "done" when:

- [ ] Code complete + reviewed
- [ ] Franco validated (cultivation science)
- [ ] Unit tests written + passing (>80% coverage)
- [ ] Integration tests written + passing
- [ ] Mobile responsive (tested on real devices)
- [ ] Accessibility reviewed (WCAG 2.1 AA)
- [ ] GA events wired + tested
- [ ] Performance tested (<2 sec load)
- [ ] No console errors
- [ ] Documented (code comments + user docs)
- [ ] Deployed to Vercel preview
- [ ] Product sign-off (UX + Product review)

---

## DEPLOYMENT CHECKLIST (Week 5)

**Pre-Deployment (Week 4, Friday)**
- [ ] All tests passing
- [ ] No console errors on production build
- [ ] Performance audit (<2 sec load)
- [ ] Security review (no XSS, CSRF vulnerabilities)
- [ ] Accessibility audit
- [ ] Franco final sign-off

**Deployment Day (Week 5, Monday)**
- [ ] Vercel preview deploy test
- [ ] Smoke test all features on production
- [ ] Check GA events flowing
- [ ] Monitor error tracking (Sentry, etc.)
- [ ] Check performance (Google PageSpeed)

**Post-Deployment (Week 5, Monday–Friday)**
- [ ] Monitor error logs hourly (first 24h)
- [ ] Respond to support tickets <4 hours
- [ ] Watch retention metrics (any unusual dips?)
- [ ] Celebrate launch!

---

## COMMUNICATION TEMPLATES

### Pre-Launch (Internal)
"Phase 1 launch complete. All 5 features deployed: Setup profile, Timeline, Task list, Environment calculator, Outcome verification. Ready for user testing. Key metrics: >80% setup adoption, >40% task completion, >70% outcome check-in response."

### Launch Announcement (External)
"GrowDoc just got smarter. Daily tasks tell you exactly what to do, based on YOUR setup. Track your grow stage. Get proactive alerts. See what actually works. Free, forever."

### Week 1 Follow-up (Post-Launch)
"Week 1 metrics: X users, X% setup completion, X% task engagement. Early feedback: [top 3 pieces of feedback]. Next steps: [iterations planned]."

---

## FINAL SIGN-OFF

**Product Manager:** _______________  Date: _______  
**Franco:** _______________  Date: _______  
**Engineering Lead:** _______________  Date: _______  
**UX Lead:** _______________  Date: _______  

---

**This is the roadmap. Let's execute.**

