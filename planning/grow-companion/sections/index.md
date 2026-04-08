<!-- PROJECT_CONFIG
runtime: vanilla-js
test_command: node -e "open index.html and check console for test results"
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-app-shell
section-02-store-storage
section-03-landing-onboarding
section-04-grow-knowledge
section-05-strain-database
section-06-priority-system
section-07-stage-timeline
section-08-task-engine
section-09-dashboard
section-10-environment
section-11-quick-log-plants
section-12-feeding-schedule
section-13-training-planner
section-14-harvest-advisor
section-15-plant-doctor
section-16-knowledge-base
section-17-stealth-audit
section-18-settings-data
section-19-migration
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable With |
|---------|------------|--------|---------------------|
| section-01-app-shell | - | all | - |
| section-02-store-storage | 01 | 03-19 | - |
| section-03-landing-onboarding | 01, 02 | 09 | 04, 05, 06 |
| section-04-grow-knowledge | - | 08, 10, 12, 14 | 03, 05, 06 |
| section-05-strain-database | - | 03 (strain picker) | 03, 04, 06 |
| section-06-priority-system | 02 | 08, 09 | 03, 04, 05 |
| section-07-stage-timeline | 02, 04 | 08, 09 | 06 |
| section-08-task-engine | 02, 04, 06, 07 | 09 | - |
| section-09-dashboard | 02, 06, 07, 08 | - | 10-18 |
| section-10-environment | 02, 04 | - | 09, 11-18 |
| section-11-quick-log-plants | 02 | - | 09, 10, 12-18 |
| section-12-feeding-schedule | 02, 04, 06 | - | 09, 10, 11, 13-18 |
| section-13-training-planner | 02, 04, 07 | - | 09, 10, 11, 12, 14-18 |
| section-14-harvest-advisor | 02, 04, 06 | - | 09-13, 15-18 |
| section-15-plant-doctor | 02, 04 | - | 09-14, 16-18 |
| section-16-knowledge-base | 02, 04 | - | 09-15, 17-18 |
| section-17-stealth-audit | 01 | - | 09-16, 18 |
| section-18-settings-data | 02 | - | 09-17 |
| section-19-migration | 02 | - | - |

## Execution Order (Batched)

**Batch 1** (no dependencies):
- section-01-app-shell

**Batch 2** (after 01):
- section-02-store-storage

**Batch 3** (after 02, parallelizable):
- section-03-landing-onboarding
- section-04-grow-knowledge
- section-05-strain-database
- section-06-priority-system

**Batch 4** (after batch 3):
- section-07-stage-timeline
- section-08-task-engine

**Batch 5** (after batch 4, parallelizable):
- section-09-dashboard
- section-10-environment
- section-11-quick-log-plants
- section-12-feeding-schedule
- section-13-training-planner
- section-14-harvest-advisor
- section-15-plant-doctor
- section-16-knowledge-base
- section-17-stealth-audit
- section-18-settings-data

**Batch 6** (final):
- section-19-migration

## Section Summaries

### section-01-app-shell
HTML shell, CSS design system (variables, layout, components), collapsible sidebar, History API router, Vercel SPA rewrites, error recovery, XSS mitigation, accessibility foundations.

### section-02-store-storage
Proxy-based reactive store with immutable commit pattern, EventTarget event bus, localStorage abstraction with versioning/migration, size budgets, compaction strategy, quota handling.

### section-03-landing-onboarding
First-visit landing page (clean/minimal/functional), 10-step setup wizard (stage, medium, lights, plants, pot size, strain, space, experience, priorities, summary).

### section-04-grow-knowledge
Franco's complete cultivation protocols as JS data modules: VPD targets by stage, DLI targets by stage and priority, nutrient EC/pH/NPK by medium and stage, temperature differentials, watering frequency rules. Evidence classifications for all recommendations.

### section-05-strain-database
500+ strain entries with name, breeder, flower weeks, stretch ratio, sensitivities, type. Lazy-loaded via dynamic import(). Strain picker component with debounced search.

### section-06-priority-system
Star-rating UI component (1-5 stars per dimension), weight calculation engine, priority-adjusted target blending, effect type selector, trade-off note generation. Priority colors: Yield=green, Quality=gold, Terpenes=purple, Effect=indigo.

### section-07-stage-timeline
Horizontal progress bar visualization, stage definitions with typical durations, auto-advance with confirmation prompts, per-plant stage tracking, milestone markers. Dry/cure stages with full logging (absorbed from Cure Tracker).

### section-08-task-engine
Core task generation logic: time-based triggers (watering, feeding, check-in), stage-based triggers (transitions, defoliation, harvest), training triggers, diagnosis follow-ups, environment alerts. Experience-level content adaptation. Full task management (done/dismiss/snooze/notes/custom).

### section-09-dashboard
Today view with 3 zones: status banner, per-plant task list, sidebar widgets (VPD, timeline, stats). Between-grows state (no active grow). Integration point for task engine, VPD widget, timeline snapshot.

### section-10-environment
VPD widget for dashboard, full environment view with logging (temp/RH highs/lows), DLI calculator, temperature differential advisor, simple SVG trend charts, drift detection alerts.

### section-11-quick-log-plants
Plant list management, plant detail view, per-plant quick logging (watered/fed/trained/observed), adaptive detail (minimal default, expandable), "same as last time" pre-fill, days-since counters.

### section-12-feeding-schedule
Brand-agnostic N-P-K ratios, EC/pH targets by medium/stage/priority, nutrient calculator (compare actual to target), medium-specific advice, feeding schedule overview table.

### section-13-training-planner
Training method selector (none/LST/top+LST/mainline/ScrOG/lollipop), method descriptions with impact ratings, milestone generation based on stage and method, task engine integration.

### section-14-harvest-advisor
Three linked trichome sliders (clear/milky/amber = 100%), priority-based harvest recommendations with trade-off notes, stagger harvest suggestion, drying and curing protocol display.

### section-15-plant-doctor
Unified diagnostic flow (merging wizard + multi-dx), context pre-fill from companion profile, real-time scoring, refine questions, follow-up task creation, outcome tracking, extraction from monolithic HTML into ES modules. Preserve 165+ existing tests.

### section-16-knowledge-base
Contextual content browser organized by topic and stage, three-layer disclosure pattern, evidence level badges in Layer 2, myth-busting section with debunked practices, internal-only references.

### section-17-stealth-audit
Embed existing Stealth Audit tool within the companion's Tools section. Either iframe or native extraction. Independent localStorage.

### section-18-settings-data
Profile editor, priority editor with live preview, UI preferences, storage usage indicator with 80% warning, Finish Grow flow (summary, optional yield, rating, archive).

### section-19-migration
Parallel deployment strategy, data migration from existing Plant Doctor/Cure Tracker/Env Dashboard localStorage keys, migration flag, backup preservation, rollback strategy, error recovery.
