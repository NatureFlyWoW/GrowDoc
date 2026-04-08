# GrowDoc Grow Companion: Complete Product Strategy

**Status:** Strategic Framework Complete | Ready for Implementation  
**Date:** 2026-04-08  
**Author:** Product Management  
**Audience:** Product Leadership, Franco (cultivation expert), Engineering, UX, Marketing

---

## OVERVIEW

GrowDoc is evolving from a **diagnostic tool** (Plant Doctor v3) into a **daily companion** that guides cannabis growers through their entire grow lifecycle.

**Current state:** Users visit when they have a problem.  
**Future state:** Users visit daily to check tasks, monitor progress, log outcomes.

This document package provides:
1. **Strategic vision** (why we're doing this)
2. **Feature roadmap** (what we're building)
3. **Implementation specs** (how to build it)
4. **User insights** (who we're serving)
5. **Competitive positioning** (how we win)
6. **Execution checklist** (making it happen)

---

## DOCUMENTS IN THIS PACKAGE

### 1. EXECUTIVE-BRIEF.md (Start here — 3 min read)
**For:** Leadership, decision-makers  
**Contains:**
- The opportunity (why now)
- The strategy (Phase 1, 2, 3)
- Competitive advantage
- Financial projections
- Go/no-go recommendation

**Key takeaway:** Launch Phase 1 in 4 weeks. If successful, we build $500K+ business in 18 months.

---

### 2. product-strategy.md (Deep dive — 30 min read)
**For:** Product team, team leads  
**Contains:**
- Complete vision & positioning
- Feature prioritization (RICE scores)
- User segmentation
- Phased roadmap (Q2–Q4 2026)
- Data architecture & moat strategy
- Success metrics
- Monetization strategy (freemium model)

**Key takeaway:** Execution depends on closing feedback loops (outcome verification) to build defensible moat.

---

### 3. phase-1-specs.md (Tactical guide — detailed reference)
**For:** Engineering, UX, Franco (validation)  
**Contains:**
- Feature-by-feature specifications
- Data structures (localStorage schema)
- UI designs + layouts
- Implementation plan (day-by-day breakdown)
- Integration checklist
- Testing strategy

**Key sections:**
- Enhanced Setup Profile (3 days)
- Growth Timeline (6 days)
- Daily Task List (7 days)
- Environment Calculator (5 days)
- Outcome Verification (4 days)

**Key takeaway:** ~25 dev days to complete Phase 1. All features depend on accurate setup context.

---

### 4. competitive-analysis.md (Market context — 20 min read)
**For:** Product leadership, marketing  
**Contains:**
- Market landscape (TAM, competitors, positioning)
- Deep-dive on 6 major competitors
  - Grow with Jane (direct competitor, journaling focus)
  - BudLabs (hardware play)
  - GrowDiaries (community play)
  - Forums/YouTube (fragmented alternatives)
  - Paid consultants (high-end alternative)
- Competitive positioning matrix
- How we differentiate (expertise + data + outcomes)
- SWOT analysis
- Go-to-market strategy

**Key takeaway:** We own the "expert companion" space. Others own community, hardware, education. Our moat is outcome data.

---

### 5. user-research-personas.md (Deep user understanding — 25 min read)
**For:** Product, UX, marketing  
**Contains:**
- Three primary personas with full profiles
  - **Alexis (Beginner):** Anxious, first-time grower. Loves task list + daily reassurance.
  - **Jordan (Intermediate):** Optimization-focused. Loves outcome data + benchmarking.
  - **Casey (Advanced):** Data-driven. Loves genetics intelligence + analytics.
- User segmentation framework
- Jobs-to-be-done mapping
- Feature adoption by persona
- Retention hooks + engagement patterns
- Discovery paths
- Pain point hierarchy

**Key takeaway:** Alexis is high-growth/high-churn. Jordan is high-retention/medium-LTV. Casey is high-LTV/niche. Serve all three.

---

### 6. implementation-checklist.md (Execution guide — reference document)
**For:** Engineering, product, QA  
**Contains:**
- Week-by-week breakdown (4 weeks)
- Daily task assignments
- Feature dependencies
- Analytics instrumentation plan
- QA checklist
- Risk mitigation strategies
- Success criteria
- Deployment checklist
- Weekly standup cadence
- Definition of done per feature

**Key takeaway:** Track daily progress. Identify blockers early. 4-week timeline is achievable with 2–3 person engineering team.

---

## HOW TO USE THIS PACKAGE

### For Product Leadership (First Decision)
1. Read: **EXECUTIVE-BRIEF.md** (3 min)
2. Skim: **product-strategy.md** sections I–III (10 min)
3. Decision: Go/No-Go on Phase 1?

### For Engineering Planning
1. Read: **phase-1-specs.md** (detailed, 45 min)
2. Reference: **implementation-checklist.md** (week-by-week, 30 min)
3. Estimate: Effort per feature (3–7 days each)
4. Plan: Sprint allocation + dependencies

### For UX/Design
1. Read: **phase-1-specs.md** sections on UI Design (20 min)
2. Reference: **user-research-personas.md** (understand users)
3. Create: Detailed mockups per feature
4. Validate: Accessibility (WCAG 2.1 AA)

### For Franco (Validation)
1. Review: **phase-1-specs.md** sections on cultivation science
   - VPD targets
   - DLI calculations
   - Nutrient EC ranges
   - Task definitions
2. Review: **user-research-personas.md** task prioritization
3. Sign-off: "Cultivation science is sound"
4. Validate: Weekly during implementation

### For Marketing
1. Read: **competitive-analysis.md** (positioning, 20 min)
2. Read: **user-research-personas.md** (understand users)
3. Create: Launch messaging + content plan
4. Strategy: SEO keywords, Reddit outreach, email drip, blog content

### For Analytics
1. Read: **phase-1-specs.md** GA events section
2. Set up: GA4 events + custom dimensions
3. Create: Funnel dashboard (signup → setup → timeline → tasks → outcomes)
4. Monitor: Daily metrics (adoption, engagement, retention)

---

## KEY DECISIONS REQUIRED

### Decision 1: Phase 1 Go/No-Go
**Required by:** End of Week 0  
**Decision-maker:** Product leadership + Franco  
**Questions to answer:**
- Is 4-week timeline feasible?
- Do we have team capacity?
- Is Franco available for validation?
- Are success metrics aligned?

**Recommendation:** GO. Execute Phase 1 immediately.

---

### Decision 2: Freemium Pricing Timing
**Required by:** Week 3 (during implementation)  
**Options:**
- **Option A:** Free tier only (Phase 1 + Phase 2), launch freemium in Month 6
- **Option B:** Soft monetization (Phase 1–2 free, premium hints), launch in Month 4
- **Option C:** Premium lite (basic features free, some premium features gated), launch immediately

**Recommendation:** Option A (free tier only during Phase 1–2). Build retention first, monetize later.

---

### Decision 3: Strain Database Approach
**Required by:** Week 1 (affects Phase 1 scope)  
**Options:**
- **Option A:** Manual entry only (MVP, Phase 1)
- **Option B:** Seedfinder API autocomplete (Phase 1.5, Week 5–6)
- **Option C:** Pre-built curated database (Phase 2, more effort)

**Recommendation:** Option A (manual entry MVP). Add API integration post-launch if data quality validates.

---

### Decision 4: Outcome Verification Timing
**Required by:** Week 1  
**Options:**
- **Option A:** All diagnoses → 3-day check-in (current spec)
- **Option B:** Opt-in check-in (user decides per diagnosis)
- **Option C:** Smart timing (different diagnoses → different windows)

**Recommendation:** Option A (simpler, enough data post-launch to optimize timing).

---

## CRITICAL SUCCESS FACTORS

1. **Franco Validation (Week 1)**
   - All cultivation science must be Franco-approved
   - Especially: VPD targets, DLI formulas, task definitions, EC ranges
   - Risk: Wrong advice = credibility damage

2. **Setup Profile Adoption (Week 2–4)**
   - >80% completion rate required for personalization to work
   - Risk: Too many required fields = abandonment
   - Mitigation: Make optional, provide defaults

3. **Task List Engagement (Week 4+)**
   - >40% completion rate = habit formation signal
   - <30% = feature redesign needed
   - Risk: Too many tasks = overwhelm; too few = not helpful
   - Mitigation: A/B test task language, count

4. **Outcome Check-in Response (Week 4+)**
   - >70% response rate = feedback loop working
   - <50% = timing or framing problem
   - Risk: Perceived as spam = churn
   - Mitigation: Non-intrusive modal, show value

5. **7-Day Retention (Week 5)**
   - >70% D7R = product-market fit signal
   - <50% = something fundamentally broken
   - Risk: Beginner churn if plant dies
   - Mitigation: Excellent diagnosis accuracy, supportive tone

---

## TIMELINE AT A GLANCE

```
WEEK 0 (APRIL 8–14):
├─ Leadership review + GO/NO-GO decision
├─ Franco validation kickoff
├─ UX design sprints
└─ Engineering estimates

WEEK 1 (APRIL 15–21):
├─ Setup Profile implementation
├─ Timeline Part 1
├─ GA events infrastructure
└─ Franco science sign-off

WEEK 2 (APRIL 22–28):
├─ Timeline completion
├─ Task List Part 1
├─ Environment Calculator Part 1
└─ Analytics integration

WEEK 3 (APRIL 29–MAY 5):
├─ Task List completion
├─ Environment Calculator completion
├─ Testing + refinement
└─ Code review

WEEK 4 (MAY 6–12):
├─ Outcome Verification implementation
├─ Full regression testing
├─ QA + bug fixes
└─ Vercel production deployment

WEEK 5+ (MAY 13+):
├─ User testing + feedback collection
├─ First iteration fixes
├─ Marketing launch
├─ Phase 2 planning
└─ Daily metrics monitoring
```

---

## SUCCESS METRICS (4-Week Target)

### Adoption
- ✅ >80% of new plants have setup profile
- ✅ >60% view growth timeline
- ✅ >50% generate daily tasks

### Engagement
- ✅ >40% complete at least one task daily
- ✅ >30% engage with environment calculator
- ✅ >70% respond to outcome check-in prompts

### Retention
- ✅ >70% 7-day retention (vs ~20% current)
- ✅ >50% 14-day retention
- ✅ >30% 30-day retention

### Quality
- ✅ >80% diagnosis satisfaction rating
- ✅ >85% successful outcomes (improved/resolved)
- ✅ NPS >45 (strong advocacy)

### Growth
- ✅ >50% of new users from word-of-mouth
- ✅ Zero critical bugs in production
- ✅ <2 sec page load time

---

## NEXT STEPS (Immediate)

### This Week (April 8–12)
- [ ] Circulate EXECUTIVE-BRIEF.md to leadership
- [ ] Get Franco's calendar availability confirmed
- [ ] Schedule Phase 1 kickoff meeting
- [ ] UX team starts design sprints

### Week 1 (April 15–19)
- [ ] Leadership decision (GO/NO-GO)
- [ ] Franco completes science validation
- [ ] Engineering estimates finalized
- [ ] Sprint planning + team assignment
- [ ] Development begins

### Week 2–4
- [ ] Daily standup (15 min)
- [ ] Weekly code review + demo
- [ ] Franco validation checkpoints
- [ ] Analytics instrumentation
- [ ] QA testing

### Week 5
- [ ] Vercel production deployment
- [ ] User testing begins
- [ ] Marketing launch
- [ ] Phase 2 planning kickoff

---

## FREQUENTLY ASKED QUESTIONS

### "Why not just copy Grow with Jane?"
We're not copying them. They focus on journaling (passive, user-directed). We focus on guidance (proactive, expert-directed). Different positioning, different moat.

### "What if Franco isn't available?"
Single-key-person risk. Mitigation: Document all protocols now, validate with external expert (if needed). Can't proceed without Franco for Phase 1 science validation.

### "When do we monetize?"
Year 2. Phase 1–2 (free tier) to build retention. Freemium launch Month 5–6 when user base is >10K and retention is validated.

### "Can we parallelize features?"
Partially. Setup profile must come first (enables all personalization). Timeline and Task list are dependent. Environment Calculator is semi-independent. Outcome Verification is independent but low priority.

### "What if retention is bad?"
Have pivot options:
1. Reduce task count (too many = overwhelm)
2. Simplify setup profile (too complex = abandonment)
3. Add social features (network effects)
4. Improve diagnosis accuracy (core trust issue)

Each has its own testing plan. Execute first option quickly.

### "How do we handle privacy?"
- Local-first by default (all data in localStorage)
- Explicit opt-in for outcome data aggregation
- Anonymized + aggregated (no individual user tracking)
- Transparent policy (explain what we collect, why)

### "What's the long-term vision?"
Year 1: Diagnostic + companion tool (expert-driven)  
Year 2: Community intelligence (network effects)  
Year 3: Genetics database + breeding tools (defensible moat)  
Year 4+: Global grow OS (ecosystem play)

---

## SUCCESS SUMMARY

**If Phase 1 succeeds:**
- 5–10K users with >70% D7R
- Daily habit loop established
- Outcome data foundation (100–500 tuples)
- Freemium monetization validated ($1–2K MRR possible)
- Team confidence in roadmap

**Next phase:** Phase 2 (outcome loops) builds moat. Phase 3 (personalization) enables monetization. Phase 4 (community) creates defensible network effects.

**Big picture:** GrowDoc becomes the default grow companion for cannabis growers worldwide. Franco's expertise, scaled globally.

---

## CONTACTS & ACCOUNTABILITY

| Role | Owner | Contact |
|------|-------|---------|
| **Product Leadership** | [PM Name] | [Contact] |
| **Franco (Cultivation Expert)** | Franco | [Contact] |
| **Engineering Lead** | [Eng Lead] | [Contact] |
| **UX/Design Lead** | [UX Lead] | [Contact] |
| **Analytics** | [Analyst] | [Contact] |
| **Marketing** | [Marketing] | [Contact] |

---

## HOW TO READ THIS PACKAGE

**Recommended reading order by role:**

**CEO/Leadership:** EXECUTIVE-BRIEF → product-strategy (Sections I–II)

**Product Manager:** All documents in order, take notes

**Engineering Lead:** phase-1-specs → implementation-checklist → competitive-analysis

**UX/Design:** phase-1-specs + user-research-personas + competitive-analysis

**Franco:** phase-1-specs (cultivation sections) + user-research-personas (task definitions)

**Marketing:** competitive-analysis + user-research-personas + EXECUTIVE-BRIEF

**QA/Testing:** phase-1-specs (integration points) + implementation-checklist (testing strategy)

---

## DOCUMENT MANIFEST

```
planning/grow-companion/
├── README.md (this file)
├── EXECUTIVE-BRIEF.md (3 min summary, go/no-go)
├── product-strategy.md (30 min, full vision + roadmap)
├── phase-1-specs.md (45 min, feature specifications)
├── competitive-analysis.md (20 min, market positioning)
├── user-research-personas.md (25 min, user insights)
└── implementation-checklist.md (30 min reference, week-by-week)
```

**Total reading time:** ~3 hours for full comprehension  
**Decision-maker time:** 15 minutes (EXECUTIVE-BRIEF only)

---

## FINAL THOUGHT

This isn't just a feature expansion. This is **the beginning of GrowDoc's dominance in the grow companion space**. 

Plant Doctor solved one problem (diagnosis). Grow Companion solves the whole lifecycle (guidance + learning + optimization). 

If we execute Phase 1 well, we're not competing on features. We're competing on **expertise + personalization + outcome data**—things that take years to replicate.

The window is open for 6–12 months before competitors react. Let's move fast.

---

**Questions? Start with EXECUTIVE-BRIEF.md. Then read phase-1-specs.md. Then let's build.**

