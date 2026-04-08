# Interactive Tools

Self-contained HTML applications in `docs/` with `category: "tool"` in `docs.json`. Each tool is a single HTML file using the GrowDoc design system.

## Current Tools

| Tool | File | Description |
|------|------|-------------|
| Plant Doctor | `tool-plant-doctor.html` | Symptom-based plant diagnosis with note-aware advice (v3) |
| Environment Dashboard | `tool-env-dashboard.html` | VPD/DLI calculator and environment monitoring |
| Cure Tracker | `tool-cure-tracker.html` | Drying and curing progress tracker |
| Stealth Audit | `tool-stealth-audit.html` | Operational security checklist |

## Data Files

Tools can use external JS data modules in `docs/`:

- `plant-doctor-data.js` — symptom/diagnosis database, 166 advice rules
- `note-context-rules.js` — note-aware context matching for Plant Doctor v3

## Building a New Tool

1. Create `docs/tool-{name}.html` using the design system from `docs/_design-system.md`
2. Keep it self-contained — all JS/CSS inline or via data files in `docs/`
3. Add metadata entry to `docs/docs.json` with `"category": "tool"`
4. Tools render inside an iframe in the viewer — design for iframe embedding
5. No external dependencies beyond CDN libs (Marked.js, etc.)
6. Responsive design — works on mobile

## Planning & Specs

Implementation plans for tools live in `planning/`:
- `planning/plant-doctor-v2/` and `planning/plant-doctor-v3/` — TDD plans
- `planning/grow-companion/` — next-phase product specs
- `planning/interactive-tools/` — design specs for tool suite
