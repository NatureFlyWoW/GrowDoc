# GrowDoc

Collaborative cannabis cultivation documentation platform deployed on Vercel. Vanilla JS frontend + Vercel serverless API + GitHub as data store.

## Quick Reference

- [Architecture & Stack](CLAUDE/architecture.md)
- [Code Conventions](CLAUDE/conventions.md)
- [API Reference](CLAUDE/api.md)
- [Deployment](CLAUDE/deployment.md)
- [Interactive Tools](CLAUDE/tools.md)

## Critical Rules

1. **Never expose secrets.** `GITHUB_TOKEN`, `JWT_SECRET`, password hashes live only in Vercel env vars. Never commit `.env` files or log secrets.
2. **Deploy is part of done.** After building any feature, run `vercel --prod` to deploy.
3. **No frameworks.** This is intentionally vanilla JS/HTML/CSS with zero npm dependencies. Do not introduce React, Vue, bundlers, or transpilers.
4. **Preserve the design system.** All docs use the theme from `docs/_design-system.md`. Use those CSS custom properties — do not introduce new colors or fonts.
5. **GitHub is the database.** All document content lives in `docs/` and metadata in `docs/docs.json`. Changes go through the `api/save.js` endpoint which commits via GitHub API.
6. **Optimistic concurrency.** The save flow uses SHA-based conflict detection. Always pass the current SHA when saving `docs.json`.

## Working With This Repo

```
GrowDoc/
  api/              # Vercel serverless functions (login, save, state)
  api/_lib/         # Shared backend: auth (scrypt+JWT), cors, github client
  docs/             # Published HTML documents + docs.json metadata + JS data files
  planning/         # Implementation plans and specs (not deployed)
  .claude/agents/   # Franco (practitioner) + Professor (academic researcher)
  .claude/skills/   # 7 cannabis cultivation skill domains
  index.html        # Public read-only viewer
  admin.html        # Authenticated editor
  app.js / admin.js # Client-side logic (vanilla ES6)
  style.css / admin.css
```

## Environment Variables (Vercel)

`TEAM_PASSWORD_HASH`, `TEAM_PASSWORD_SALT`, `JWT_SECRET`, `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`

## Common Tasks

- **Add a new interactive tool**: Create `docs/tool-{name}.html` using the design system, add entry to `docs.json` with `category: "tool"`
- **Modify API**: Edit files in `api/` — these are Vercel serverless functions (Node.js ESM)
- **Update a doc**: Edit the HTML file in `docs/`, update `docs.json` if metadata changed
- **Add data files**: JS data modules go in `docs/` (e.g., `plant-doctor-data.js`, `note-context-rules.js`)
