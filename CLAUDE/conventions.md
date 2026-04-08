# Code Conventions

## JavaScript

- **ES Modules** everywhere — `import`/`export`, never `require`
- **Arrow functions** for handlers and utilities
- **Template literals** for HTML generation in JS
- **Fetch API** for all HTTP calls (no axios, no XMLHttpRequest)
- **No TypeScript** — plain JavaScript with JSDoc comments where needed
- **No npm runtime deps** — Marked.js loaded via CDN, everything else is native

## File Naming

- HTML docs: `kebab-case.html` — must match `FILE_NAME_RE = /^[a-z0-9\-]+\.html$/`
- Interactive tools: `tool-{name}.html` in `docs/`
- Data modules: descriptive name in `docs/` (e.g., `plant-doctor-data.js`)
- API routes: `api/{verb}.js` with shared libs in `api/_lib/`

## API Pattern

Every API handler follows this structure:
```js
import { handleCors } from './_lib/cors.js';
// ... other imports

export default async function handler(req, res) {
  if (handleCors(req, res)) return;           // 1. CORS preflight
  if (req.method !== 'POST') { ... return; }  // 2. Method check
  if (!requireAuth(req)) { ... return; }      // 3. Auth check (if needed)
  try { ... } catch (err) { ... }             // 4. Business logic + error handling
}
```

## Document Metadata (docs.json)

Each entry requires:
```json
{
  "id": "unique-kebab-id",
  "title": "Display Title",
  "subtitle": "Short description",
  "icon": "emoji",
  "status": "OPEN | IN PROGRESS | HALTED | IN REVIEW | DONE",
  "category": "botanical | planning | tool",
  "priority": 1-4,
  "file": "filename.html"
}
```

Priority groups: 1=Urgent Care, 2=Setup & Supplies, 3=Future Runs, 4=Reference

## Design System

All HTML docs must use the theme from `docs/_design-system.md`:
- Dark background: `--bg-primary: #0a0d0a`
- Gold accent: `--accent-gold: #c9a84c`
- Green accent: `--accent-green: #4a7c3f`
- Display font: Cormorant Garamond (serif)
- Body font: DM Sans (sans-serif)
- Mono font: JetBrains Mono

Status colors: green (DONE), blue (IN PROGRESS), brown (OPEN), orange (HALTED), purple (IN REVIEW)

## Git

- Commit messages: descriptive, present tense
- Branch: `main` only (feature branches for multi-step work)
- Never commit: `.env`, secrets, `node_modules`, `.vercel/`
