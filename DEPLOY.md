# GrowDoc — Vercel Deploy Guide

One-time setup to move from GitHub Pages to Vercel. After this, your friends
only need a **team password** to edit docs — no GitHub accounts.

## 1. Generate your secrets

Pick a team password, then run:

```bash
node scripts/setup-password.js 'your-chosen-password-here'
```

It prints 3 environment-variable values you'll paste into Vercel in step 4.
Keep the output open in a terminal.

## 2. Create a GitHub Personal Access Token

This is **your** token only — your friends never see it. It lets the Vercel
backend commit on everyone's behalf.

1. Open https://github.com/settings/tokens/new?scopes=public_repo&description=GrowDoc%20Backend
2. Click **Generate token**
3. Copy the `ghp_...` token somewhere safe

## 3. Import the repo to Vercel

1. Go to https://vercel.com/new
2. Sign in with GitHub (first time only)
3. Click **Import** next to `NatureFlyWoW/GrowDoc`
4. Leave all defaults, don't click Deploy yet

## 4. Add environment variables

On the import screen, expand **Environment Variables** and add all 6:

| Name | Value |
|------|-------|
| `TEAM_PASSWORD_HASH` | from `setup-password.js` output |
| `TEAM_PASSWORD_SALT` | from `setup-password.js` output |
| `JWT_SECRET` | from `setup-password.js` output |
| `GITHUB_TOKEN` | your `ghp_...` token from step 2 |
| `GITHUB_REPO_OWNER` | `NatureFlyWoW` |
| `GITHUB_REPO_NAME` | `GrowDoc` |

Click **Deploy**. Takes about 30 seconds.

## 5. Share the URL

Vercel gives you a URL like `https://growdoc-xxx.vercel.app`. Share that
with your friends along with the team password.

Every git push to `main` re-deploys automatically.

## How it works

- Your friends visit `/admin.html`, enter the team password once (stored in
  their browser for 14 days)
- Each save calls the Vercel backend, which commits to GitHub using your
  token — your friends never touch GitHub
- Every commit message shows which doc was changed; no per-person
  attribution since everyone shares one auth token
