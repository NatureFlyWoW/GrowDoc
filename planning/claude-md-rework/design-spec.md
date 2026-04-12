# CLAUDE.md Rework — Design Spec

**Date:** 2026-04-12
**Goal:** Restructure CLAUDE.md for token efficiency and subagent-as-team orchestration.

## Problem

Current CLAUDE.md loads ~290 lines into every conversation regardless of task. API conventions load when editing docs. Design system colors load when editing serverless functions. No agent dispatch rules, workflow patterns, or product vision are captured — they exist only in memory files that decay and require manual recall.

## Design Principles

1. **Orchestrator vs implementer separation.** Root CLAUDE.md is the control plane (team, dispatch, workflows). Child-directory CLAUDE.md files are the data plane (domain conventions).
2. **Auto-loading over manual navigation.** `api/CLAUDE.md` and `docs/CLAUDE.md` auto-load when working in those directories — zero navigation cost.
3. **Every line earns its place.** ~150 instruction slots available after system prompt. Each redundant line competes with critical rules.
4. **Encode what's been learned.** Agent dispatch rules, parallel patterns, and product vision — currently scattered across 18 memory files — get permanent homes.

## New File Structure

```
GrowDoc/
  CLAUDE.md                  # Orchestration control plane (~75 lines)
  CLAUDE/
    team.md                  # Agent roster, dispatch rules, domain boundaries (~90 lines)
    workflows.md             # Pipeline, parallel patterns, token efficiency (~70 lines)
    vision.md                # Product north star, principles, deferrals (~40 lines)
  api/
    CLAUDE.md                # API conventions, handler pattern, endpoints (~50 lines)
  docs/
    CLAUDE.md                # Design system, tool building, data files, naming (~55 lines)
```

**Total:** ~380 lines across 6 files.
**Loaded per conversation:** 75 (root) + ~50-90 (one domain file) = **~125-165 lines typical**.
**Savings:** 55-74% token reduction vs current ~290 lines loaded every time.

## File Contents

### Root CLAUDE.md (~75 lines)

Always loaded. Only universally-applicable content:

- Project identity (one line)
- 6 critical rules (unchanged — these are the hard constraints)
- Repo map with pointers to child CLAUDE.md files
- Environment variables
- Links to CLAUDE/team.md, CLAUDE/workflows.md, CLAUDE/vision.md

Does NOT contain: API handler patterns, design system values, tool building guide, deployment details, architecture deep-dive.

### CLAUDE/team.md (~90 lines)

New file. Encodes subagent-as-team philosophy:

- Agent roster table: Franco, Professor, note-contextualizer, javascript-pro, code-reviewer, agent-organizer — with dispatch triggers
- 6 dispatch rules: parallelize by default, file collision detection, Franco priority, javascript-pro for JS, brief reviews, main-thread fallback
- Domain boundary table: which agent owns which directories/files
- MCP server inventory: Vercel, Playwright, Context7, JSON Schema Validator

### CLAUDE/workflows.md (~70 lines)

New file. Captures established patterns:

- Planning-to-implementation pipeline (brainstorm → plan → split → implement → review → deploy)
- Parallel subagent dispatch checklist (DAG, collisions, snapshots, file ownership, contracts)
- Token efficiency principles (split artifacts, child CLAUDE.md, brief prompts, delegate research)
- Error handling convention ([module:context] labels, critical banner rules)
- Testing philosophy (lean: /test runner + Playwright smoke, no jest/vitest)

### CLAUDE/vision.md (~40 lines)

New file. Captures product decisions from council interview:

- North star: maximize plant outcomes, "All good" banner = permission to walk away
- Principles: daily tool + retrospective, passion project, EU-first, stabilize before iterate, notes on everything
- Explicit deferrals: photos, cloud, multi-tent, accounts, payments
- Authority hierarchy: Franco → user gut → Professor → Claude orchestrator

### api/CLAUDE.md (~50 lines)

New file, auto-loads when editing api/ files. Consolidates from current architecture.md, conventions.md, api.md:

- Handler pattern (CORS → method → auth → business logic)
- Shared library exports table (auth.js, cors.js, github.js)
- Endpoint reference table (login, state, save)
- Security model (scrypt, JWT, FILE_NAME_RE, iframe isolation)

### docs/CLAUDE.md (~55 lines)

New file, auto-loads when editing docs/ files. Consolidates from conventions.md, tools.md:

- Design system tokens table (colors, fonts, status colors)
- Tool building checklist (6 steps)
- Data files inventory (plant-doctor-data.js, note-context-rules.js)
- docs.json schema (required fields, categories, priorities)
- File naming rules (kebab-case, tool-{name}, FILE_NAME_RE)

## Migration Plan

| Current File | Action | Destination(s) |
|---|---|---|
| `CLAUDE.md` | Rewrite | Root — lean orchestration |
| `CLAUDE/architecture.md` | Split + delete | Security → `api/CLAUDE.md`, data flow → root repo map |
| `CLAUDE/conventions.md` | Split + delete | JS/API → `api/CLAUDE.md`, design/naming → `docs/CLAUDE.md`, git → root |
| `CLAUDE/api.md` | Move + delete | → `api/CLAUDE.md` |
| `CLAUDE/deployment.md` | Absorb + delete | Deploy step → `CLAUDE/workflows.md`, env vars → root |
| `CLAUDE/tools.md` | Move + delete | → `docs/CLAUDE.md` |
| *(new)* | Create | `CLAUDE/team.md` |
| *(new)* | Create | `CLAUDE/workflows.md` |
| *(new)* | Create | `CLAUDE/vision.md` |
| *(new)* | Create | `api/CLAUDE.md` |
| *(new)* | Create | `docs/CLAUDE.md` |

## Validation Criteria

1. Root CLAUDE.md under 80 lines
2. No content duplication across files
3. API task loads only root + api/CLAUDE.md (~125 lines)
4. Docs task loads only root + docs/CLAUDE.md (~130 lines)
5. All 6 critical rules preserved verbatim in root
6. All agent dispatch rules from memory files captured in team.md
7. All workflow patterns from memory files captured in workflows.md
8. Product vision from interview synthesis captured in vision.md
9. Old CLAUDE/ sub-files deleted after migration
