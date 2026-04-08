# Deployment

## Platform

Vercel — auto-deploys on push to `main`. No build step needed (static site + serverless functions).

## Deploy Command

```bash
vercel --prod
```

Always deploy after completing any feature or fix. Deployment is part of "done".

## Environment Variables

Set these in Vercel dashboard (Settings > Environment Variables):

| Variable | Source |
|----------|--------|
| `TEAM_PASSWORD_HASH` | `node scripts/setup-password.js '<password>'` |
| `TEAM_PASSWORD_SALT` | Same script output |
| `JWT_SECRET` | Same script output |
| `GITHUB_TOKEN` | GitHub PAT with `public_repo` scope |
| `GITHUB_REPO_OWNER` | `NatureFlyWoW` |
| `GITHUB_REPO_NAME` | `GrowDoc` |

## Configuration

- `vercel.json` — function timeout (10s), cache headers for `docs.json`
- `.vercelignore` — excludes `.superpowers/`, `scripts/`, `DEPLOY.md`, PNGs

## What Gets Deployed

- `index.html`, `app.js`, `style.css` — public viewer
- `admin.html`, `admin.js`, `admin.css` — authenticated editor
- `api/*.js` — serverless functions
- `docs/` — all published content and data files

## What Does NOT Deploy

- `planning/` — implementation specs
- `scripts/` — setup utilities
- `backup_docs/`, `new_docs/` — archives
- `.claude/` — agent/skill definitions
- `DEPLOY.md`, `CLAUDE.md`, `CLAUDE/` — documentation
