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
