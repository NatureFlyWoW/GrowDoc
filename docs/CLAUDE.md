# Docs & Tools Conventions

Published HTML documents, interactive tools, and JS data modules. All content serves the GrowDoc viewer (index.html) and editor (admin.html).

## Design System

All HTML must use the theme from `_design-system.md`:

| Token | Value |
|-------|-------|
| `--bg-primary` | `#0a0d0a` (dark background) |
| `--accent-gold` | `#c9a84c` |
| `--accent-green` | `#4a7c3f` |
| Display font | Cormorant Garamond (serif) |
| Body font | DM Sans (sans-serif) |
| Mono font | JetBrains Mono |

Status colors: green=DONE, blue=IN PROGRESS, brown=OPEN, orange=HALTED, purple=IN REVIEW

## Building a Tool

1. Create `tool-{name}.html` using the design system
2. Self-contained — all JS/CSS inline or via data files in `docs/`
3. Add entry to `docs.json` with `"category": "tool"`
4. Renders inside an iframe in the viewer — design for iframe embedding
5. No external dependencies beyond CDN libs (Marked.js)
6. Responsive — must work on mobile

## Data Files

JS data modules live alongside HTML in `docs/`:

| File | Purpose |
|------|---------|
| `plant-doctor-data.js` | 166 advice rules, symptom/diagnosis database |
| `note-context-rules.js` | Note-aware context matching for Plant Doctor v3 |

## docs.json Schema

Each entry requires these fields:

```json
{
  "id": "unique-kebab-id",
  "title": "Display Title",
  "subtitle": "Short description",
  "icon": "emoji",
  "status": "OPEN | IN PROGRESS | HALTED | IN REVIEW | DONE",
  "category": "botanical | planning | tool",
  "priority": 1,
  "file": "filename.html"
}
```

Priority groups: 1=Urgent Care, 2=Setup & Supplies, 3=Future Runs, 4=Reference

## File Naming

- HTML docs: `kebab-case.html` — must match `FILE_NAME_RE = /^[a-z0-9\-]+\.html$/`
- Interactive tools: `tool-{name}.html`
- Data modules: descriptive name `.js` (e.g., `plant-doctor-data.js`)

## Planning & Specs

Implementation plans for tools live in `planning/`, not in `docs/`:
- `planning/plant-doctor-v3/` — current Plant Doctor spec
- `planning/grow-companion/` — product expansion specs
- `planning/interactive-tools/` — tool suite design specs
