# GrowDoc: Grow Companion — Product Strategy & Roadmap

**Date:** 2026-04-08  
**Author:** Product Management  
**Status:** Strategic Framework (Ready for implementation planning)

---

## EXECUTIVE SUMMARY

GrowDoc is at an inflection point. Plant Doctor v3 has established the diagnostic foundation (166 rules, note-aware advice, multi-plant support). Now we expand from **"What's wrong with my plant?"** into **"How do I grow the best plant possible?"**

**The Opportunity:**
- Diagnostics solve a pain point (problems). Companion tools drive engagement (growth).
- Daily habit tools create defensible network effects (data → insights → community).
- Most growers lack a **single source of truth** for their grow — scattered across notes, forums, YouTube, old grows.

**The Vision:**
A tool that becomes indispensable because it:
1. Continuously adapts to each grower's setup and goals
2. Proactively guides through the entire grow lifecycle (planning → execution → harvest → cure)
3. Learns from outcomes (closed feedback loops)
4. Connects to Franco's cultivation expertise at every stage

**Success Definition:** >50% monthly active users perform a "daily" companion action (check tasks, log environment, review plan, adjust strategy) with >80% retention.

---

## I. PRODUCT VISION & POSITIONING

### Market Positioning

**Current Market:**
- **Grow with Jane** (competitor): Journaling + tracking, but passive (user-directed logging)
- **BudLabs** (competitor): Environment monitoring, but IoT-hardware dependent
- **Forums/Discord** (free alternative): Fast community but inconsistent quality
- **YouTube/Blogs** (free alternative): High-quality but static, not personalized

**GrowDoc's Unique Position:**

| Dimension | Competitor | GrowDoc |
|-----------|-----------|---------|
| **Expertise source** | Crowdsourced | Franco-validated science + community data |
| **Personalization** | Generic recommendations | Setup-aware + goal-driven + dynamic |
| **Proactivity** | None (reactive logging) | Predictive tasks, timely alerts, stage alerts |
| **Feedback loops** | Rarely closed | Closed: diagnose → treat → verify → learn |
| **Accessibility** | Gated/app-only | Free, web-based, no login friction |
| **Offline-first** | No | Works with/without internet |

**Core Value Proposition:**
> **"The daily companion that helps you master YOUR grow—not someone else's."**
>
> GrowDoc combines Franco's 20+ years of cultivation science with YOUR setup specifics (medium, lights, nutrients, space) and YOUR goals (yield, quality, terpenes, effect) to create a personalized, real-time guide that adapts as your grow progresses.

**Why This Matters:**
- Beginners get scaffolding (what to do → when → why)
- Intermediate growers get optimization (fine-tune for their priorities)
- Advanced growers get data + accountability (close the feedback loop)

### Brand Identity

**Tone:** Knowledgeable but not condescending. Franco's voice: generous, direct, evidence-based.

**Visual:** Clean, focused on plant health and progression. Not overwhelming with data.

**Trust Drivers:**
- Franco's embedded expertise cited in every recommendation
- Success rate transparency ("92% of growers with your setup fixed this in 3 days")
- Community validation ("Similar growers achieved X with this approach")
- Outcome tracking (show what actually worked for this user)

---

## II. FEATURE PRIORITIZATION & PHASED ROADMAP

### MVP Expansion Framework (Phased Release)

#### PHASE 1: "Grow Intelligence" (Weeks 1-4)
**Goal:** Turn Plant Doctor into a proactive guide that anticipates needs.

**Core Features:**
1. **Grow Setup Profile (Enhanced)**
   - What we have: Medium, lighting selection
   - What we add:
     - Space dimensions (W × D × H in cm/in)
     - Nutrient line + feeding schedule type (weekly vs feed-to-drain vs passive)
     - Pot type/size + growing containers
     - Temperature/RH control capability (manual vs climate control)
     - Budget tier (hobby/semi-pro/commercial) — affects recommendations
   - **Impact:** Context for all downstream features
   - **Effort:** 3-4 days
   - **Data:** Saved to localStorage; enables personalized advice

2. **Growth Stage Timeline (Dynamic)**
   - What we have: User selects "vegetative" or "flowering"
   - What we add:
     - Interactive timeline visual showing: Days → Stage → Key milestones
     - Strain-specific (if data available): Expected veg duration, flower time, stretch
     - Real-time countdown ("3 weeks until flip recommended")
     - Predictive alerts ("You're entering week 7 of flower—watch for these issues")
   - **Impact:** Proactive problem prevention
   - **Effort:** 5-6 days
   - **Data:** Requires strain database integration (MVP: manual input; v1.1: autocomplete)

3. **Daily Task List ("What to Do Today")**
   - What we need:
     - Curated action items for current stage (water, feed, defoliate, adjust environment, train, prune)
     - Sourced from: Growth stage + recent diagnoses + goal priorities
     - Smart filtering: Only tasks relevant to this setup/stage
     - Check-off system with timestamps
   - **Example task flow:**
     - Week 1 veg on soil with LED → [Water tomorrow, Check node spacing, Monitor temp]
     - Week 7 flower with calmag deficiency history → [Feed CalMag today, Check humidity, Monitor buds]
   - **Impact:** Habit formation, daily return visits
   - **Effort:** 6-7 days
   - **Data:** Task completion history → analytics + user behavior

4. **Environment Calculator (VPD/DLI/Nutrient Mix)**
   - What we need:
     - Real-time VPD calculator (temp × RH → optimal range for stage)
     - DLI estimator (light wattage × hours → target DLI for stage)
     - Nutrient EC calculator (stage + medium + feed-to-drain ratio → target EC)
     - Comparison against Franco's benchmarks
   - **Impact:** Removes guesswork from environment optimization
   - **Effort:** 4-5 days
   - **Data:** Optional sensor inputs (manual or eventual IoT integration)

**Phase 1 Success Metrics:**
- Task list click-through >30% of daily active users
- Average session duration +2 min
- 7-day retention +15%

---

#### PHASE 2: "Grow Journal & Outcome Tracking" (Weeks 5-8)
**Goal:** Close the feedback loop so growers learn from their own experience.

**Core Features:**
1. **Enhanced Grow Journal**
   - What we have: Journal entry creation (notes + diagnosis link)
   - What we add:
     - Photo timeline (upload + date-track plant photos for growth comparison)
     - Environment log (manual entry + future: API integration for sensors)
     - Feeding log (date + nutrient, EC, pH, volume)
     - Action tracking (automatic: "Applied advice from deficiency diagnosis on day X")
     - Auto-prompted check-ins (3 days after diagnosis: "How'd it go?")
   - **Impact:** Personal data becomes insight
   - **Effort:** 7-8 days
   - **Data:** Photo compression + storage strategy (Vercel Blob or external); analytics

2. **Harvest Window Advisor**
   - What we need:
     - Trichome-stage guidance (when to harvest, what amber % for desired effect)
     - Strain-based timing (if data available)
     - Curing guidance (humidity, duration, peak quality window)
     - Storage recommendations (long-term vs short-term)
   - **Impact:** Quality optimization (terpene preservation, effect profile)
   - **Effort:** 4-5 days
   - **Data:** Manual trichome photos → visual guide training

3. **Outcome Verification System**
   - What we need:
     - "Did this work?" prompt (automatic after 3-7 days, customizable)
     - Success rate aggregation ("92% of growers with [your setup] fixed [this issue] in X days")
     - Contributing to Franco-validated community data
   - **Impact:** Credibility + closed feedback loop
   - **Effort:** 3-4 days
   - **Data:** Anonymized outcome DB; builds predictive power

**Phase 2 Success Metrics:**
- Photo upload rate >40% of active growers
- Check-in completion rate >70% of tracked diagnoses
- Outcome data sufficient for "Similar setup success rate" badges

---

#### PHASE 3: "Goal-Driven Priorities" (Weeks 9-12)
**Goal:** Personalize recommendations by grower's objectives (not one-size-fits-all).

**Core Features:**
1. **Priority Slider System**
   - What we need:
     - 4 sliders (Yield / Quality / Terpenes / Effect) ranging 0–100
     - Affects: Feeding strategy, defoliation timing, harvest window, strain recommendations
     - Example profiles:
       - Yield-focused (80/20/0/0): Heavy feeding, aggressive defoliation, harvest at light amber
       - Quality-focused (30/100/80/50): Organic nutrients, conservative approach, cure-focused
       - Terpene-focused (20/80/100/70): Late-flower temp drop, slow dry, long cure
   - **Impact:** Recommendations shift dynamically
   - **Effort:** 5-6 days
   - **Data:** Adjusts scoring in Plant Doctor, task list prioritization, journal guidance

2. **Strain Database Integration (MVP)**
   - What we need:
     - Search by strain name → fetch terpene profile, genetics, expected flower time, phenotype data
     - Source: Seedfinder API (free tier) or manual curated DB
     - Integration: Allows timeline + task list to adapt to strain
     - Example: "Blue Dream (mostly sativa) typically stretches 1.5–2x → plan accordingly"
   - **Impact:** Strain-specific guidance from day 1
   - **Effort:** 6-7 days
   - **Data:** API integration + caching strategy

3. **Training Schedule Planner**
   - What we need:
     - Based on: Strain type (bushy/lanky/balanced), grower experience, setup constraints
     - Generates: Week-by-week training guide (topping, LST, defoliation, etc.)
     - Linked to Plant Doctor (if hermie detected → adjust schedule)
     - Visual timeline (week 1: "FIM + bend" vs week 3: "Remove large fan leaves")
   - **Impact:** Structure + confidence for training decisions
   - **Effort:** 5-6 days
   - **Data:** Training technique library (100+ protocols from Franco)

**Phase 3 Success Metrics:**
- >60% of users define priorities
- Recommendations relevance score +25% vs generic baseline
- User satisfaction with training guidance >80%

---

#### PHASE 4: "Community & Network Effects" (Weeks 13+)
**Goal:** Build defensible moat through data + community intelligence.

**Features (Post-MVP):**
1. **Similar Setups Analytics**
   - "Growers with [soil+LED+your nutrients] who [had yellow leaves] applied [this fix] with [92% success]"
   - Anonymized comparison: your metrics vs peer growers
   - Privacy-first: Opt-in data sharing

2. **Community Advice Matching**
   - Franco-validated tips from growers with similar setup + goals
   - Not forums; curated insights from closed feedback loops

3. **Advanced Analytics Dashboard**
   - Yield trends, environment optimization heatmap, terpene progression
   - Exportable for grower's records

---

### MVP Feature Prioritization Matrix (RICE)

| Feature | Reach (0–10) | Impact (0–3x) | Confidence (0–100%) | Effort (days) | RICE Score | Priority |
|---------|--------------|---|----|----|-------|----------|
| **Phase 1** | | | | | | |
| Setup Profile (Enhanced) | 10 | 2x | 100% | 3 | **667** | P0 |
| Growth Timeline | 9 | 2x | 95% | 6 | **285** | P0 |
| Daily Task List | 8 | 2.5x | 90% | 7 | **257** | P0 |
| Environment Calculator | 6 | 1.5x | 85% | 5 | **153** | P1 |
| **Phase 2** | | | | | | |
| Enhanced Journal | 7 | 2x | 85% | 8 | **148** | P1 |
| Harvest Window Advisor | 5 | 2x | 80% | 5 | **80** | P2 |
| Outcome Verification | 8 | 2x | 90% | 4 | **360** | P0 |
| **Phase 3** | | | | | | |
| Priority Sliders | 7 | 2.5x | 85% | 6 | **248** | P1 |
| Strain Database | 6 | 2x | 75% | 7 | **129** | P2 |
| Training Schedule | 5 | 2x | 80% | 6 | **133** | P2 |

**Key observations:**
- P0 (Do first): Setup profile, timeline, task list, outcome verification
- P1 (Follow quickly): Enhanced journal, priority sliders
- P2 (Optimize later): Harvest advisor, strain DB, training schedule

---

## III. USER SEGMENTATION & MESSAGING

### Persona Development

#### 1. **Alexis (The Beginner)**
- Profile: First or second grow, overwhelmed by options
- Pain: "I don't know if my plant is healthy. I've read 10 different guides and they contradict."
- Value needs: Scaffolding, clear steps, reassurance
- GrowDoc fit: Task list + stage timeline removes "what do I do next?" anxiety
- Messaging: "You've got this. We'll tell you exactly what to do, when."
- Monetization: Free tier (task list, basic advice)

#### 2. **Jordan (The Intermediate)**
- Profile: 3–5 grows, wants to optimize, still learning
- Pain: "I got decent results, but I feel like I'm leaving yield/quality on the table."
- Value needs: Personalization, optimization tips, honest feedback
- GrowDoc fit: Priority sliders, outcome tracking, environment calculator
- Messaging: "Dial in YOUR grow—not a generic template."
- Monetization: Freemium (analytics dashboard, advanced journal, community insights)

#### 3. **Casey (The Advanced/Optimizer)**
- Profile: 10+ grows, specific goals, wants data-driven decisions
- Pain: "I want to optimize for [terpenes/effect], but I need real data to prove what works."
- Value needs: Data, validation, community benchmarks
- GrowDoc fit: Full analytics, outcome verification, strain database, training protocols
- Messaging: "Prove what works. Learn from every grow."
- Monetization: Premium (advanced analytics, exclusive training protocols, API access for IoT)

#### 4. **Professional/Commercial**
- Profile: Growing as business, compliance-focused
- Pain: "I need consistent results at scale, with documentation."
- Value needs: Batch tracking, compliance reporting, yield forecasting
- GrowDoc fit: Could expand to batch-level tracking, export reports
- Monetization: High-value enterprise plan (TBD based on demand)

### Go-to-Market by Segment

| Segment | Entry Point | Conversion Path | Expected LTV |
|---------|-------------|-----------------|------|
| **Alexis (Beginner)** | Plant Doctor diagnostic | → Task list daily use | Free → Low-tier premium |
| **Jordan (Intermediate)** | Plant Doctor + outcome feedback | → Priority setup + journal | Freemium tier |
| **Casey (Advanced)** | Analytics dashboard preview | → Full premium suite | High-value premium |
| **Professional** | Batch tracking demo | → Custom enterprise | Highest LTV |

---

## IV. THE DAILY HABIT LOOP

### Engagement Mechanics

**The Hook:** Growers enter crisis ("my plant is dying") or curiosity ("am I on track?")

**The Loop (Daily & Weekly):**

```
DAY 1-7 (VEG WEEK 1)
├─ Setup created → Task list appears
│  Tasks: [✓] Water, [✓] Check nodes, [ ] Adjust light if needed
│
├─ User checks off task → Small dopamine hit + progress visibility
│
└─ 3 days later → Predictive alert: "Ready for training (FIM/topping)?
                   Based on 3 weeks veg planned, now's ideal time"

DAY 21-28 (EARLY FLOWER)
├─ Automated nudge: "Flip to flower in 2 weeks?" (Strain default: 4 weeks veg)
│
├─ Daily tasks shift: [Water], [Feed], [Monitor humidity (RH >60% risk)]
│
├─ Mid-week: "Environment alert: RH trending high. Increase ventilation."
│  → Environment calculator showed 1.3 VPD (should be 1.0–1.4) but humidity drift
│
└─ User logs environment data → Journal entry with photo

DAY 45-60 (FLOWER WEEK 3-4)
├─ Daily tasks: [Feed], [Defoliate (light)], [Check for mold/pests]
│
├─ Predictive alert: "Week 4 of flower: Watch for bud rot, hermies, Ca def (common at this stage)"
│
├─ User reports deficiency symptom → Plant Doctor gives stage-aware advice
│
└─ Journal auto-prompt (3 days later): "You treated the deficiency. How'd it go?"
   User: "Much better in 5 days"
   → Success verified, data feeds community intelligence

DAY 60-70 (LATE FLOWER)
├─ Daily trichome check reminder + guide
├─ Harvest window calculator activated
├─ Cure guidance ready
└─ Outcome tracking closed loop

REPEAT FOR NEXT GROW
├─ Historical comparison: "Last grow: 4.2g/plant, avg 78 THC%, cured 4 weeks"
└─ Suggested adjustments: "To hit your 80%+ THC goal, consider [this] next time"
```

### Retention Mechanics

1. **Closed Feedback Loops**
   - User diagnoses problem → applies fix → verifies outcome
   - Data feeds: Success rate badges, personal history, community insights
   - Feeling: "This tool actually helped me"

2. **Predictive Engagement**
   - Proactive alerts (not reactive)
   - "You're in week 7, here's what to watch for" (not "I have a problem, what do I do?")
   - Feeling: "This tool anticipates my needs"

3. **Comparison Mechanics**
   - Your grow vs your past grows (personal benchmark)
   - Your results vs similar setups (peer benchmark)
   - Feeling: "I'm improving, and I can measure it"

4. **Goal-Driven Customization**
   - Priorities (yield/quality/terpenes/effect) shape every recommendation
   - Harvest timing shifts with goal ("If quality-focused: harvest at 80% amber")
   - Feeling: "This tool is made for MY grow"

---

## V. DATA ARCHITECTURE & MOAT

### What Data Do We Need to Collect vs Derive?

| Data Type | Collect or Derive? | Value | Privacy |
|-----------|-------------------|-------|---------|
| **Setup** | Collect (user input) | Personalizes all features | Private (localStorage) |
| **Grow timeline** | Collect (user input) | Stages, alerts, task generation | Private |
| **Plant photos** | Collect (optional upload) | Visual diagnosis, progress tracking | Private + optional sharing |
| **Environment** | Collect (manual or sensor API) | VPD/DLI calculations, alerts | Private |
| **Feeding log** | Collect (user entry) | Nutrition tracking, EC trending | Private |
| **Diagnosis outcome** | Collect (3-day check-in) | **CRITICAL for moat** | Anonymized + aggregated |
| **Priority goals** | Collect (sliders) | Recommendation personalization | Private |
| **Strain info** | Derive (Seedfinder API) | Timeline + genetics | Public |
| **Task completion** | Collect (user check-off) | Behavior analytics, habit strength | Private |
| **Journal entries** | Collect (user notes) | Personal history + LLM analysis (future) | Private |

### Network Effects & Moat

**Virtuous Cycle:**
```
User 1 diagnoses deficiency + applies fix + verifies outcome
  → Data point: "Soil + LED + deficiency X → fix Y → 92% success in 3 days"
  
User 2 hits same issue on soil + LED
  → Recommendation now includes: "Success rate: 92% with similar setup"
  → Higher confidence → better outcomes → more likely to return
  
Repeated N times
  → "GrowDoc knows my setup better than generic guides"
  → Network effect: Value increases with user base (community intelligence)
  → Defensible moat: Can't replicate without years of outcome data
```

**Competitive Moat Layers:**
1. **Data layer:** Closed feedback loops → millions of (setup, problem, fix, outcome) tuples
2. **Expertise layer:** Franco validation → credibility competitors can't match quickly
3. **Personalization layer:** Setup + goals → recommendations no generic tool can provide
4. **Community layer:** Similar setups intelligence → value from peer data, not just algorithm

---

## VI. SUCCESS METRICS & KPIs

### North Star Metric
**Daily Active Users (DAU) Performing Companion Actions**
- Definition: Users who, in a calendar day, perform >1 action beyond passive reading
  - Check off a task
  - Log environment data or feeding
  - Upload a photo
  - Complete a diagnosis check-in
- Target: 50% of monthly active users become daily active
- Why: Signals habit formation, not one-shot usage

### Supporting Metrics

#### Acquisition
| Metric | Target | Why |
|--------|--------|-----|
| New users/week | +15% month-over-month | Organic + viral growth |
| CAC (cost per user) | $0 (organic) | No paid marketing yet; word-of-mouth |
| SEO rankings for "cannabis grow guide" | Top 10 | Long-tail organic |

#### Activation
| Metric | Target | Why |
|--------|--------|-----|
| Diagnosis completion rate | >70% of starters | Core value delivery |
| Task list creation rate | >60% of activated | Habit formation lever |
| Setup profile completion | >80% | Required for personalization |

#### Engagement
| Metric | Target | Why |
|--------|--------|-----|
| Daily active users (DAU) | >10K (Y2 goal) | Habit formation |
| Avg session duration | >4 min | Deep engagement |
| Task completion rate | >50% of generated tasks | User agency + behavior signal |
| Return rate (7-day) | >40% | Retention baseline |
| Return rate (30-day) | >25% | Long-term habit |

#### Retention
| Metric | Target | Why |
|--------|--------|-----|
| Day 7 retention | >50% | Habit loop working |
| Day 30 retention | >30% | Sustained engagement |
| Churn reason tracking | <5% due to value issues | Signals product issues early |

#### Revenue (Freemium Model, Later)
| Metric | Target | Why |
|--------|--------|-----|
| Free → Premium conversion | >5% of activated | Freemium baseline |
| Premium ARPU | $5–15/month | Reasonable for grower segment |
| LTV:CAC ratio | >10:1 | Sustainable unit economics |

#### Quality & Credibility
| Metric | Target | Why |
|--------|--------|-----|
| Diagnosis accuracy satisfaction | >80% ("helpful" feedback) | Core value metric |
| Outcome verification rate | >70% of tracked diagnoses | Feedback loop closure |
| Positive outcome rate | >85% of verified cases | Evidence product works |
| NPS (Net Promoter Score) | >50 | Strong advocacy |

#### Moat (Community Intelligence)
| Metric | Target | Why |
|--------|--------|-----|
| Setup types represented | >50 unique combinations | Data diversity |
| Problem-solution outcome tuples | >1,000 (Y1) | Predictive power foundation |
| Community insights generated | >100 unique benchmarks | Competition-proof advantage |

---

## VII. FREEMIUM MONETIZATION STRATEGY

### Free Tier (Forever Free)
- Plant Doctor diagnostic (note-aware, multi-plant)
- Basic task list (generic stage-based)
- Growth timeline (manual entry)
- Environment calculator (VPD/DLI tools)
- Basic journal (text + diagnosis links)
- Public-facing outcomes ("Success rates")

**Rationale:** Hook users, demonstrate value, build critical mass.

### Premium Tier ($4.99–9.99/month)
- Advanced journal (photo timeline, feeding logs, auto check-ins)
- Personalized priorities (yield/quality/terpenes/effect sliders)
- Strain database integration (search + recommendation)
- Training schedule planner (strain + experience level)
- Advanced analytics (yield trends, terpene progression, environment heatmap)
- Early harvest window predictions
- Unlimited plant tracking (free: 3 plants)
- Export & personal backups

**Rationale:** Added convenience + optimization for engaged users. Not essential to product use.

### Premium+ Tier ($19.99–29.99/month) [Optional, Post-MVP]
- All Premium features
- Direct Franco consultation access (async Q&A)
- Custom breeding/pheno-hunting protocols
- Advanced IoT sensor integration (Bluetooth/API)
- Batch-level tracking (for small commercial growers)
- Private community access (peer grower network)
- Marketplace integration (strain + equipment recommendations)

**Rationale:** Serve advanced/professional users willing to pay for expertise + community.

### Enterprise Tier [Future, Post-MVP]
- Custom setup for compliance-focused growers
- Batch tracking + reporting
- API access for equipment integration
- SLA support
- White-label option (for seed companies, equipment brands)

---

## VIII. COMPETITIVE POSITIONING

### How GrowDoc Differs

**vs Grow with Jane:**
- ❌ Lacks Franco's science-backed expertise
- ❌ Passive journaling (user-directed, not proactive)
- ❌ No setup-aware personalization
- ❌ No outcome verification

**vs BudLabs:**
- ❌ Requires hardware (expensive, not everyone has sensors)
- ❌ Focused on data collection, not guidance
- ❌ No diagnosis or problem-solving

**vs Forums/Reddit:**
- ❌ Slow (hours to days for response)
- ❌ Inconsistent quality (anyone can answer)
- ❌ No accountability for outcomes

**vs YouTube:**
- ❌ Static content (not adaptive to user's setup)
- ❌ Long-form (30+ min to find your answer)
- ❌ No closed feedback loop

**What GrowDoc Owns:**
- ✅ Science-backed + Franco-validated
- ✅ Setup-aware personalization (your exact medium + lights + goals)
- ✅ Proactive guidance (anticipates needs, not just reactive)
- ✅ Closed feedback loops (data improves recommendations)
- ✅ Free + accessible (no paywall, no hardware required)

---

## IX. ROADMAP TIMELINE

### Q2 2026 (April–June): Phase 1 Foundation
**Goal:** Expand Plant Doctor into a daily companion tool.

**Milestones:**
- Week 1–2: Enhanced setup profile + localStorage persistence
- Week 3–4: Growth timeline (manual + predictive alerts)
- Week 5–7: Daily task list (stage + diagnosis-aware)
- Week 8: Environment calculator (VPD/DLI tools)
- Week 9: Deploy to Vercel + marketing refresh
- Week 10+: Analytics review + iteration

**Expected Outcomes:**
- DAU +50% (diagnostics still primary, but task list drives return visits)
- Task completion rate >40%
- Setup profile adoption >70%

### Q3 2026 (July–Sept): Phase 2 Outcome Loops
**Goal:** Close feedback loops so data improves recommendations.

**Milestones:**
- Week 1–3: Auto-prompted check-ins (3-day post-diagnosis)
- Week 4–6: Enhanced journal (photos, environment logs, feeding)
- Week 7–8: Outcome verification aggregation + success rate badges
- Week 9: Harvest window advisor (basic MVP)
- Week 10+: Community data pipeline (anonymized outcome aggregation)

**Expected Outcomes:**
- Check-in completion rate >70%
- Outcome data sufficient for "Similar setup success rate" badges
- 30-day retention +15%

### Q4 2026 (Oct–Dec): Phase 3 Personalization
**Goal:** Personalized recommendations by grower's goals.

**Milestones:**
- Week 1–3: Priority sliders (yield/quality/terpenes/effect)
- Week 4–6: Strain database integration (Seedfinder API)
- Week 7–9: Training schedule planner (strain + morphology specific)
- Week 10+: Advanced analytics dashboard (premium feature launch)

**Expected Outcomes:**
- Premium tier adoption >5% of activated users
- Recommendation relevance +25% (self-reported satisfaction)
- NPS >50

### 2027+: Expansion & Monetization
- Community features (similar setups, peer insights)
- IoT sensor integrations (environment APIs)
- Advanced analytics & prediction models
- International expansion (strain databases for other regions)
- Breeding/pheno-hunting tools (Franco expertise)

---

## X. IMPLEMENTATION PRIORITIES

### What to Build First (MVP Phase 1 — 4 weeks)

1. **Enhanced Setup Profile** (3 days)
   - Add: Space dimensions, nutrient line, pot type, climate control capability
   - Persist: localStorage (growdoc-grow-profile already exists)
   - Design: 1-page form or conversational flow

2. **Growth Timeline** (6 days)
   - Visual: Week-by-week timeline with stage indicators
   - Input: Manual veg/flower duration entry (strain database integration deferred)
   - Output: Current stage, days remaining, next milestone
   - Design: SVG timeline or card-based layout

3. **Daily Task List** (7 days)
   - Logic: Task generation based on (stage, recent diagnoses, setup)
   - Action: Checkbox for completion, timestamps logged
   - Data: Task history → analytics (what tasks are users actually doing?)
   - Design: Sortable card list, collapsed by category (water/feed/environment/training/monitor)

4. **Environment Calculator** (5 days)
   - Input fields: Current temp, RH, light wattage, plant count
   - Output: VPD range (with target for current stage), DLI estimate, nutrient EC target
   - Comparison: Show "good" / "OK" / "fix" status
   - Design: Simple widget, integrated into environment section

5. **Outcome Verification** (4 days)
   - Trigger: 3 days after diagnosis save
   - Prompt: "How's [diagnosis name] doing?"
   - Options: Resolved / Improving / Same / Worse / N/A
   - Data: Save outcome + user feedback → analytics
   - Design: Card modal or banner

### What Requires Franco Review
- Task list priority logic (Is the task stack right for stage X?)
- Environment targets (VPD ranges, DLI estimates per stage)
- Outcome data interpretation (What success rate threshold is credible?)

### What Requires UX Iteration
- Setup profile form vs conversational flow decision
- Task list visual hierarchy
- Environment calculator presentation (simple vs detailed mode)
- Timeline interaction patterns

---

## XI. RISK ASSESSMENT & MITIGATION

### Key Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **Low task completion rate** | Habit loop doesn't form | Medium | A/B test task language; make completion frictionless |
| **Setup profile abandonment** | Data incomplete; personalization fails | Medium | Make setup optional; provide defaults; show value immediately |
| **Outcome verification too intrusive** | Users feel spammed; churn | Medium | Use smart timing (3 days default, adjustable); make dismissible |
| **Data quality issues** | Community intelligence unreliable | High | Start with Franco validation; confidence thresholds; human review layer |
| **Strain database unavailable/inaccurate** | Feature blocked; trust damage | Low | Build curated initial DB; allow user corrections; start with common strains |
| **Retention plateau below 20%** | Unit economics fail | Medium | Revisit habit loop design; add social features; re-examine value prop |
| **Privacy concerns** | User hesitation to share setup/outcomes | Medium | Clear opt-in data sharing; local-first by default; transparent aggregation policy |
| **Performance on mobile** | Mobile adoption fails | Medium | Optimize task list; test responsive layouts; lazy-load images |

### Success Dependencies
1. Franco's cultivation protocols are accurate and Franco-validated per feature
2. Task list prioritization logic is intuitive (not overwhelming, not too minimal)
3. Outcome data quality (users honestly report results)
4. Engagement mechanics work (daily habit formation >50% of users)

---

## XII. COMMUNICATION & ROLLOUT

### Internal Messaging (Team)

"We're moving from 'diagnostic tool' to 'daily companion.' This means:
- Shifting from reactive (users come to us with problems) to proactive (we anticipate needs)
- Building closed feedback loops (diagnose → treat → verify → learn)
- Starting data moat (community intelligence that competitors can't replicate)
- Creating daily habit (not one-shot tool)"

### External Messaging (User-Facing)

**Current tagline:** "Diagnose plant problems in 2 minutes"

**New tagline (Companion launch):** "The daily companion for your grow—personalized to YOUR setup and goals"

**Feature announcements (Phased):**
- Phase 1 hero: "Know what to do today" (task list)
- Phase 2 hero: "Learn from every grow" (outcome tracking)
- Phase 3 hero: "Optimize for YOUR goals" (priorities + strain DB)

### User Education
- In-app onboarding for new features
- Email drip campaign for engaged users ("Here's what task list can do")
- Blog posts (Franco's voice): "Why outcome tracking matters" / "VPD explained" / "Terpene timing"

---

## XIII. SUCCESS CRITERIA (Post-MVP)

### Product-Market Fit Validation (End of Q2)
- [ ] >70% diagnosis completion rate
- [ ] >60% setup profile adoption
- [ ] >40% task list usage (of activated users)
- [ ] >50% 7-day retention
- [ ] >80% "helpful" satisfaction on diagnoses
- [ ] DAU growing +15% MoM

### Habit Formation (End of Q3)
- [ ] >50% of DAU perform daily companion action
- [ ] >30% 30-day retention
- [ ] >70% outcome verification completion
- [ ] >85% positive outcome rate (verified cases)
- [ ] NPS >45

### Monetization Ready (End of Q4)
- [ ] >5K premium tier conversions
- [ ] >$25K/month revenue (at $4.99 ARPU × 5K users)
- [ ] Unit economics validated (LTV >10x CAC)
- [ ] 50+ unique setup types in outcome database
- [ ] 1,000+ problem-solution-outcome tuples

---

## XIV. APPENDICES

### A. Product Canvas Summary

| Element | Description |
|---------|-------------|
| **Problem** | Growers lack personalized guidance throughout grow; scattered across forums, YouTube, consultants |
| **Target Users** | Indoor cannabis growers (all experience levels); 500K–2M potential users in NA alone |
| **Solution** | Daily companion tool with Franco science + personalized setup + closed feedback loops |
| **Key Features** | Plant Doctor (diagnostic), Task list (daily guidance), Timeline (stages), Analytics (outcomes) |
| **Unique Value** | Science-backed + setup-aware + proactive + outcome-verified (vs passive tools) |
| **Revenue Model** | Freemium (free core, premium analytics + strain DB + training) |
| **Go-to-Market** | Organic/SEO + viral (word-of-mouth from satisfied users) |
| **Success Metric** | DAU > 50% of MAU performing daily companion actions |

### B. Feature Dependency Map

```
Plant Doctor v3 (foundation)
  ├─ Setup Profile (Enhanced) [P0]
  │  └─ Task List generation depends on accurate setup context
  │  └─ Environment Calculator depends on setup (space, lights, etc.)
  │  └─ Personalization (priorities, recommendations) depends on setup
  │
  ├─ Growth Timeline [P0]
  │  └─ Task List depends on current stage
  │  └─ Predictive alerts depend on stage progression
  │  └─ Strain Database integration (future)
  │
  ├─ Daily Task List [P0]
  │  └─ Foundation for daily habit loop
  │  └─ Input to analytics (task completion tracking)
  │  └─ Links to other tools (training schedule, journal)
  │
  ├─ Environment Calculator [P1]
  │  └─ Optional but valuable for advanced users
  │  └─ Feeds into alerts system
  │
  └─ Outcome Verification [P0]
     └─ CRITICAL for moat (community intelligence)
     └─ Closes feedback loop
     └─ Data foundation for all future features
```

### C. User Journey Map (Alexis, The Beginner)

```
DAY 1: Discovery
  "My plant's leaves are yellow. What's wrong?"
    ↓ [Plant Doctor wizard]
  "Probably nitrogen deficiency or overwatering"
    ↓ [Saves to journal]
  "What do I do?"

DESIRED FUTURE STATE:
  → Task list appears: [Cut watering for 2 days], [Check soil moisture], [Monitor]
  → Timeline shows: "You're in week 2 veg. Common issues at this stage: overwatering, temp stress"
  → Environment calc: "Your RH is 55%—OK for veg, but if <50% increase misting"
  → Feeling: "Oh, so these are the things I specifically should do today"

DAY 4: Check-in (auto-prompted)
  "How's the nitrogen issue?"
    ↓ [User: "Better in 3 days"]
  → Success logged
  → Positive reinforcement: "92% of growers with your setup fixed this in 3 days"
  → Feeling: "This tool actually works!"

DAY 7–14: Habit Formation
  → Daily tasks: [Water], [Check node spacing], [Monitor for pests]
  → User checks off tasks daily → momentum
  → Feeling: "I have a plan and I'm following it"

WEEK 4: Milestone Alert
  → "Ready to flip to flower?" (if veg duration configured)
  → Training schedule: "Do final defoliation today, then no more stress for 3 days"
  → Feeling: "Confident about next decision"

OUTCOME: Beginner completes first grow successfully, returns for second grow, becomes intermediate user.
```

---

## FINAL RECOMMENDATION

**Phase 1 (Weeks 1–4) is doable and high-impact.** Execute the core four features:
1. Enhanced setup profile (enables all personalization)
2. Growth timeline (proactive guidance)
3. Daily task list (habit formation lever)
4. Outcome verification (moat foundation)

These four features transform GrowDoc from "diagnostic tool used once when problems arise" into "daily companion trusted throughout the grow." This is where the retention and defensibility live.

Estimated effort: **~25 days** for a focused team. Deliverables: Working features deployed to Vercel, analytics integrated, ready for user testing.

**Success looks like:** 4 weeks post-Phase 1 launch, >40% task list adoption, >50% 7-day retention (vs ~20% current), >80% diagnosis satisfaction maintained.

From there, Phase 2 (outcome loops) builds the data moat. Phase 3 (priorities) enables premium monetization. Phase 4 (community) creates defensible network effects.

---

**Next Step:** Review this strategy with Franco for cultivation accuracy validation, then execute Phase 1 implementation planning.

