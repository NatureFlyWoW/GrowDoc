<!-- PROJECT_CONFIG
runtime: vanilla-js
test_command: echo "Open in browser and run runTests() in console"
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-sidebar-integration
section-02-env-dashboard
section-03-stealth-audit
section-04-cure-tracker
section-05-plant-doctor
END_MANIFEST -->

# Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-sidebar-integration | - | 02, 03, 04, 05 | Yes |
| section-02-env-dashboard | 01 | - | Yes |
| section-03-stealth-audit | 01 | - | Yes |
| section-04-cure-tracker | 01 | - | Yes |
| section-05-plant-doctor | 01 | - | Yes |

## Execution Order

1. **Batch 1**: section-01-sidebar-integration (no dependencies — must complete first)
2. **Batch 2**: section-02-env-dashboard, section-03-stealth-audit, section-04-cure-tracker, section-05-plant-doctor (all parallel after section-01)

## Section Summaries

### section-01-sidebar-integration
Update `app.js`, `style.css`, and `docs.json` to add a pinned "Tools" section at the top of the sidebar. Add tool category styling for the light-theme parent page. Exclude tools from status filter counts. Add mobile nav support for tool items.

### section-02-env-dashboard
Build `docs/tool-env-dashboard.html` — combined VPD calculator with interactive heatmap chart and DLI calculator with gauge bar. Pure calculation, real-time updates on input change, localStorage for remembering last inputs.

### section-03-stealth-audit
Build `docs/tool-stealth-audit.html` — monthly OPSEC security checklist with 18 items across 5 weighted categories. Radio button scoring (Pass/Fail/N/A), real-time weighted score calculation, audit history in localStorage.

### section-04-cure-tracker
Build `docs/tool-cure-tracker.html` — multi-phase harvest tracker (idle → drying → curing → complete). Daily drying logs, burp session logging, auto-triggered alerts, state machine with backward transitions, completedSummaries history.

### section-05-plant-doctor
Build `docs/tool-plant-doctor.html` — diagnostic symptom checker with step-by-step wizard (default) and expert mode (scrollable form). Full decision tree encoding the plant-diagnostics skill's diagnostic map. Fade transitions, history stack navigation, last diagnosis saved.
