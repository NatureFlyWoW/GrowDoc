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
