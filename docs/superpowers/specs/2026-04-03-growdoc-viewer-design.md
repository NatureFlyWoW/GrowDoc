# GrowDoc Viewer — Design Spec

## Purpose
A static, single-page webapp that displays 5 grow planning documents (4 PDFs + 1 HTML) in an embedded viewer with a sidebar navigation. Shared via public URL with 2 friends. View-only, no auth.

## Visual Style
Natural & Earthy botanical journal aesthetic:
- Warm tones: `#f5f0e8` background, `#e8dcc8` sidebar, `#2d5016` accents
- Georgia/serif typography
- Green gradient header
- Rounded corners, subtle borders

## Layout
- **Header**: earthy green gradient, project title + subtitle
- **Sidebar** (left, 260px): document list with icons, active state highlighted
- **Main area**: embedded viewer (iframe) showing selected doc
- **Footer**: minimal branding
- **Responsive**: sidebar collapses to horizontal nav on mobile (<768px)

## Documents
1. Complete Guide to Building an 80x80 Grow Tent (PDF)
2. Construction Plans Illustrated (PDF)
3. Pheno Hunting Sativa Super Skunk (PDF)
4. Pheno Hunting Sativa Super Skunk (HTML)
5. Pushing 200g Grow Guide (PDF)

## Tech
- Single `index.html` + `style.css` + `app.js`
- PDFs/HTML embedded via `<iframe>`
- Zero dependencies, zero build step
- Deploy to GitHub Pages

## Future
- Swap iframes for PDF.js when search is needed
