# CLAUDE.md Rework — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure CLAUDE.md from a monolithic 290-line set into token-efficient orchestration root + auto-loading child-directory files, encoding the subagent-as-team philosophy.

**Architecture:** Root CLAUDE.md becomes the orchestration control plane (~75 lines, always loaded). Three new strategy files in CLAUDE/ capture team roster, workflows, and product vision. Two child-directory CLAUDE.md files (api/, docs/) auto-load only when working in those directories. Five old CLAUDE/ sub-files are deleted after migration.

**Tech Stack:** Markdown files only. No code changes.

**Parallelization:** Tasks 1-5 are fully independent — dispatch in parallel. Task 6 depends on Tasks 1-5 paths existing. Task 7 depends on Task 6. Task 8 is final.

---

### Task 1: Create CLAUDE/team.md

**Files:**
- Create: `CLAUDE/team.md`

- [ ] **Step 1: Write CLAUDE/team.md**

```markdown
# Team & Dispatch Rules

GrowDoc uses a multi-agent team model. The main thread orchestrates; subagents implement.
Maximize parallel dispatch. Speed is a core value.

## Agent Roster

| Agent | Source | Domain | When to dispatch |
|-------|--------|--------|-----------------|
| Franco | `.claude/agents/franco.md` | Cultivation practitioner | ANY cultivation data, grow advice, strain/pheno evaluation |
| Professor | `.claude/agents/professor.md` | Academic researcher | Scientific validation, peer-reviewed citations, myth-busting |
| note-contextualizer | `.claude/agents/note-contextualizer.md` | Note systems | Note schema design, context injection, note-to-data parsing |
| javascript-pro | `voltagent-lang:javascript-pro` | JS implementation | ALL .js file creation/edits beyond single-line tweaks |
| code-reviewer | `superpowers:code-reviewer` | Quality gate | After completing major implementation steps |
| agent-organizer | `voltagent-meta:agent-organizer` | Orchestration | Complex multi-section plans with 4+ parallel streams |

## Dispatch Rules

1. **Parallelize by default.** Launch independent tasks simultaneously in a single message with multiple Agent tool calls.
2. **File collision detection first.** Before dispatching N agents, grep each task's spec for files it touches. If two agents write the same file: combine into one prompt, or snapshot the file before dispatch.
3. **Franco has priority** on cultivation data accuracy. Apply his corrections without user confirmation. VPD + watering = survival-critical (daily grower actions).
4. **javascript-pro for JS work.** Plan the file-level DAG, dispatch one agent per independent file set. Include interface contracts in prompts so agents can stub imports without waiting for siblings.
5. **Brief code reviews only.** Blocking issues only, no nits section, under 600 words. Auto-fix obvious issues; only interview user for real tradeoffs or security concerns.
6. **Main-thread fallback.** If a subagent fails or hits usage limits, implement directly in the main thread rather than re-dispatching. Slower but deterministic.

## Domain Boundaries

| Directory / File | Owner | Notes |
|------------------|-------|-------|
| `api/`, `api/_lib/` | backend agents | Auth, CORS, GitHub client |
| `docs/*.html`, `docs/*.js` | javascript-pro | Design system, tool UIs, data modules |
| `docs/docs.json` | main thread only | High-conflict metadata file — never parallelize |
| `.claude/agents/`, `.claude/skills/` | main thread | Agent and skill definitions |
| `app.js`, `admin.js` | javascript-pro | Client-side viewer/editor logic |
| `style.css`, `admin.css` | frontend agents | Styling |
| `planning/` | main thread | Plans, specs, design docs |

## MCP Servers

| Server | Capability |
|--------|------------|
| Vercel MCP | Runtime logs, deployments, project info, doc search |
| Playwright MCP | Browser automation, screenshots, accessibility tree, vision mode |
| Context7 | Live library/framework documentation on demand |
| JSON Schema Validator | Schema validation for docs.json and data structures |
```

- [ ] **Step 2: Verify line count**

Run: `wc -l CLAUDE/team.md`
Expected: ~75-95 lines

---

### Task 2: Create CLAUDE/workflows.md

**Files:**
- Create: `CLAUDE/workflows.md`

- [ ] **Step 1: Write CLAUDE/workflows.md**

```markdown
# Workflows & Patterns

## Planning-to-Implementation Pipeline

1. **Brainstorm** — `superpowers:brainstorming` before any creative work
2. **Write plan** — `superpowers:writing-plans` or `/deep-plan` for complex features
3. **Split into sections** — each self-contained, under 300 lines, with index.md
4. **Implement** — `/deep-implement` or parallel javascript-pro dispatch
5. **Review** — brief code review after each major step
6. **Deploy** — `vercel --prod` (deployment is part of done)

## Parallel Subagent Dispatch Checklist

Before launching parallel implementation agents:

- [ ] Map file dependencies as a DAG — which files can be edited independently?
- [ ] Check for file collisions between agents (grep each spec for target files)
- [ ] Snapshot shared files before dispatch (`cp file /tmp/snapshot.bak`)
- [ ] Tell each agent explicitly which files NOT to touch
- [ ] Include interface contracts for cross-agent dependencies (function signatures, export shapes)
- [ ] Combined commits are fine for tightly coupled sections

## Token Efficiency

- **Split large artifacts.** Any plan, spec, or doc >300 lines / 20KB gets a directory with index.md. Each section file is self-contained.
- **Child-directory CLAUDE.md.** Domain conventions in `api/CLAUDE.md` and `docs/CLAUDE.md` auto-load only when working there — never pollute unrelated tasks.
- **Brief subagent prompts.** Include only the context slice each agent needs, not the full plan.
- **Delegate investigation.** Research and exploration burn main-thread context — dispatch to subagents.

## Error Handling Convention

- `console.error` with `[module:context]` labels (e.g., `[boot:init]`, `[save:commit]`)
- Critical error banner (`showCriticalError`) only for: data loss, boot crash, save failure
- Silent recovery for non-critical failures — log to console and continue
- Never swallow errors without logging

## Testing Philosophy

- **Lean stack.** Expand the built-in `/test` runner + Playwright smoke test. No jest, vitest, or heavy frameworks.
- **Playwright** for browser-level regression: boot, sidebar render, content load, no critical errors.
- **edge-case-engine** has its own `runTests()` — extend for data-layer assertions.
- **Pre-deploy gate.** Run test suite before `vercel --prod`.

## Deploy

```bash
vercel --prod
```

Always after completing any feature or fix. Verify production URL loads after deploy.
```

- [ ] **Step 2: Verify line count**

Run: `wc -l CLAUDE/workflows.md`
Expected: ~60-75 lines

---

### Task 3: Create CLAUDE/vision.md

**Files:**
- Create: `CLAUDE/vision.md`

- [ ] **Step 1: Write CLAUDE/vision.md**

```markdown
# Product Vision

## North Star

Maximize plant outcomes through personalized guidance.

Origin: "stop me from checking plants every 10 minutes."

The "All good" green banner is the app's most important feature — it's permission to walk away.

## Principles

- **Daily tool AND retrospective** — every feature must serve double duty (real-time guidance + historical analysis)
- **Passion project** — open-source aspirational, no accounts, no payments, keep the codebase clean
- **EU-first** — metric units, EU breeders and strains, EU grower context
- **Stabilize before iterating** — fix contradictions, harden errors, improve tests BEFORE adding features
- **Notes on everything** — every decision point (stage transitions, wizard steps, task completions) gets an optional "Add context" textarea, parsed through the context engine
- **Ask when unsure** — pause for clarification on ambiguous decisions rather than assuming

## Explicitly Deferred

Photos, cloud sync, multi-tent support, competitor matching, user accounts, payment systems.

## Authority Hierarchy

1. **Franco** — cannabis cultivation authority. Corrections applied without user confirmation.
2. **User's gut** — reliable on general plant health observations.
3. **Professor** — scientific validation when claims need peer-reviewed backing.
4. **Claude (orchestrator)** — technical architecture, code patterns, agent coordination.
```

- [ ] **Step 2: Verify line count**

Run: `wc -l CLAUDE/vision.md`
Expected: ~35-45 lines

---

### Task 4: Create api/CLAUDE.md

**Files:**
- Create: `api/CLAUDE.md`

- [ ] **Step 1: Write api/CLAUDE.md**

```markdown
# API Conventions

Vercel serverless functions. Node.js ESM (`type: "module"`). CORS enabled for all origins.

## Handler Pattern

Every endpoint follows this structure:

```js
import { handleCors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;           // 1. CORS preflight
  if (req.method !== 'POST') { ... return; }  // 2. Method check
  if (!requireAuth(req)) { ... return; }      // 3. Auth check (if needed)
  try { ... } catch (err) { ... }             // 4. Business logic + error handling
}
```

## Shared Libraries (api/_lib/)

| Module | Exports |
|--------|---------|
| `auth.js` | `verifyPassword(pw)`, `createToken()`, `verifyToken(token)`, `requireAuth(req)` |
| `cors.js` | `handleCors(req, res)` — returns `true` if OPTIONS handled |
| `github.js` | `getFile(path)`, `putFile(path, content, msg, sha?)`, `deleteFile(path, sha, msg)`, `isConflict(err)` |

## Endpoints

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/login` | POST | No | Team password → JWT (14-day TTL) |
| `/api/state` | GET | Yes | Returns `docs.json` + SHA for optimistic concurrency |
| `/api/save` | POST | Yes | Commits document changes via GitHub API |

## Security Model

- `GITHUB_TOKEN` never reaches the browser — server-side only
- Auth flow: scrypt password verification → HS256 JWT → Bearer token in localStorage
- Filename validation: `FILE_NAME_RE = /^[a-z0-9\-]+\.html$/`
- 500ms delay on failed login attempts (brute-force mitigation)
- Documents rendered in sandboxed iframes (XSS isolation)
- SHA-based optimistic locking on `docs.json` updates (409 on conflict)

## JavaScript Conventions

- ES Modules everywhere — `import`/`export`, never `require`
- Arrow functions for handlers and utilities
- Fetch API for HTTP (no axios, no XMLHttpRequest)
- No TypeScript — plain JavaScript with JSDoc where needed
- No npm runtime dependencies
```

- [ ] **Step 2: Verify line count**

Run: `wc -l api/CLAUDE.md`
Expected: ~50-60 lines

---

### Task 5: Create docs/CLAUDE.md

**Files:**
- Create: `docs/CLAUDE.md`

- [ ] **Step 1: Write docs/CLAUDE.md**

```markdown
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
```

- [ ] **Step 2: Verify line count**

Run: `wc -l docs/CLAUDE.md`
Expected: ~55-65 lines

---

### Task 6: Rewrite root CLAUDE.md

**Depends on:** Tasks 1-5 (paths must exist)

**Files:**
- Modify: `CLAUDE.md` (full rewrite)

- [ ] **Step 1: Rewrite CLAUDE.md**

Replace the entire file with:

```markdown
# GrowDoc

Cannabis cultivation documentation platform. Vanilla JS + Vercel serverless + GitHub as data store.

## Critical Rules

1. **Never expose secrets.** `GITHUB_TOKEN`, `JWT_SECRET`, password hashes live only in Vercel env vars. Never commit `.env` files or log secrets.
2. **Deploy is part of done.** Run `vercel --prod` after every feature or fix.
3. **No frameworks.** Vanilla JS/HTML/CSS with zero npm runtime dependencies. Do not introduce React, Vue, bundlers, or transpilers. **Exception:** Playwright (`@playwright/test`) is the only allowed npm devDependency — smoke testing only, does not ship to production.
4. **Preserve the design system.** All docs use the theme from `docs/_design-system.md`. Use those CSS custom properties — do not introduce new colors or fonts.
5. **GitHub is the database.** All document content lives in `docs/` and metadata in `docs/docs.json`. Changes go through `api/save.js` which commits via GitHub API.
6. **Optimistic concurrency.** The save flow uses SHA-based conflict detection. Always pass the current SHA when saving `docs.json`.

## Repo Map

```
GrowDoc/
  api/              # Vercel serverless (Node.js ESM)      — conventions in api/CLAUDE.md
  docs/             # Published content, tools, data files  — conventions in docs/CLAUDE.md
  planning/         # Implementation plans and specs (not deployed)
  .claude/agents/   # Franco (practitioner), Professor (academic), note-contextualizer
  .claude/skills/   # 7 cannabis cultivation skill domains
  index.html        # Public read-only viewer
  admin.html        # Authenticated editor
  app.js / admin.js # Client-side logic (vanilla ES6)
  style.css / admin.css
```

## Environment Variables (Vercel)

`TEAM_PASSWORD_HASH`, `TEAM_PASSWORD_SALT`, `JWT_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`

## Git

- Commit messages: descriptive, present tense
- Branch: `main` (feature branches for multi-step work)
- Never commit: `.env`, secrets, `node_modules/`, `.vercel/`

## Team & Dispatch Rules

See [CLAUDE/team.md](CLAUDE/team.md) — agent roster, dispatch rules, domain boundaries, MCP servers.

## Workflows & Patterns

See [CLAUDE/workflows.md](CLAUDE/workflows.md) — planning pipeline, parallel dispatch checklist, token efficiency, testing, deploy.

## Product Vision

See [CLAUDE/vision.md](CLAUDE/vision.md) — north star, principles, deferrals, authority hierarchy.
```

- [ ] **Step 2: Verify line count**

Run: `wc -l CLAUDE.md`
Expected: ~55-70 lines (well under the 80-line target)

---

### Task 7: Delete old CLAUDE/ sub-files

**Depends on:** Task 6 (root no longer references these files)

**Files:**
- Delete: `CLAUDE/architecture.md`
- Delete: `CLAUDE/conventions.md`
- Delete: `CLAUDE/api.md`
- Delete: `CLAUDE/deployment.md`
- Delete: `CLAUDE/tools.md`

- [ ] **Step 1: Verify no remaining references to old files**

Run: `grep -r "architecture.md\|conventions.md\|CLAUDE/api.md\|deployment.md\|CLAUDE/tools.md" CLAUDE.md CLAUDE/ api/CLAUDE.md docs/CLAUDE.md`
Expected: No matches (zero output). If any matches found, update references before deleting.

- [ ] **Step 2: Delete the five old files**

```bash
git rm CLAUDE/architecture.md CLAUDE/conventions.md CLAUDE/api.md CLAUDE/deployment.md CLAUDE/tools.md
```

- [ ] **Step 3: Verify CLAUDE/ directory contents**

Run: `ls CLAUDE/`
Expected: Only `team.md`, `workflows.md`, `vision.md` remain.

---

### Task 8: Validate & Commit

**Depends on:** Task 7

- [ ] **Step 1: Validate line counts**

Run:
```bash
wc -l CLAUDE.md CLAUDE/team.md CLAUDE/workflows.md CLAUDE/vision.md api/CLAUDE.md docs/CLAUDE.md
```

Expected: All files within target ranges. Total under 400 lines.

- [ ] **Step 2: Validate no content duplication**

Spot-check: the handler pattern code block should appear ONLY in `api/CLAUDE.md`. The design system tokens table should appear ONLY in `docs/CLAUDE.md`. The 6 critical rules should appear ONLY in root `CLAUDE.md`.

Run:
```bash
grep -l "handleCors" CLAUDE.md CLAUDE/*.md api/CLAUDE.md docs/CLAUDE.md
grep -l "accent-gold" CLAUDE.md CLAUDE/*.md api/CLAUDE.md docs/CLAUDE.md
grep -l "Never expose secrets" CLAUDE.md CLAUDE/*.md api/CLAUDE.md docs/CLAUDE.md
```

Expected:
- `handleCors` → only `api/CLAUDE.md`
- `accent-gold` → only `docs/CLAUDE.md`
- `Never expose secrets` → only `CLAUDE.md`

- [ ] **Step 3: Validate all 6 critical rules present in root**

Run: `grep -c "Never expose secrets\|Deploy is part of done\|No frameworks\|Preserve the design system\|GitHub is the database\|Optimistic concurrency" CLAUDE.md`
Expected: 6

- [ ] **Step 4: Stage and commit**

```bash
git add CLAUDE.md CLAUDE/team.md CLAUDE/workflows.md CLAUDE/vision.md api/CLAUDE.md docs/CLAUDE.md
git commit -m "refactor: restructure CLAUDE.md for token efficiency and subagent orchestration

Split monolithic CLAUDE.md (290 lines loaded every conversation) into:
- Lean orchestration root (~65 lines, always loaded)
- CLAUDE/team.md (agent roster, dispatch rules, domain boundaries)
- CLAUDE/workflows.md (pipeline, parallel patterns, token efficiency)
- CLAUDE/vision.md (product north star, principles, deferrals)
- api/CLAUDE.md (auto-loads for API work only)
- docs/CLAUDE.md (auto-loads for docs/tools work only)

Typical conversation now loads ~125 lines instead of ~290 (55-74% reduction)."
```

- [ ] **Step 5: Verify clean git status**

Run: `git status`
Expected: Clean working tree, no untracked CLAUDE files.
