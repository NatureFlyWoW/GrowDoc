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
