# GrowDoc Design System (extracted from strain-guide.html)

A dark, editorial-feel design language with serif display typography,
monospace labels, and gold/green accent palette. Used across all GrowDoc
documents for visual consistency.

## Theme tokens — paste this `<style>` block at the top of every doc

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0d0a;
  --bg-card: #111611;
  --bg-card-hover: #161b16;
  --bg-section: #0d100d;

  /* Text */
  --text-primary: #e8e4d9;
  --text-secondary: #9ca38e;
  --text-muted: #5e6556;

  /* Accents */
  --accent-gold: #c9a84c;
  --accent-gold-dim: #8a7234;
  --accent-green: #4a7c3f;
  --accent-green-bright: #6db35f;
  --accent-green-dim: #2d4a26;
  --accent-purple: #7c5a9e;
  --accent-red: #b54c4c;
  --accent-orange: #c97a2e;
  --accent-blue: #4a7c9e;
  --accent-teal: #3a8a7a;

  /* Borders */
  --border: #1e241e;
  --border-light: #2a322a;

  /* Fonts */
  --font-display: 'Cormorant Garamond', serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

Load fonts at top of `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Base body styles

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.7;
  font-size: 16px;
  overflow-x: hidden;
}
```

## Hero section (every doc starts with one)

Full-viewport hero with animated fade-up entrances.

```css
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 600px 400px at 30% 40%, rgba(74,124,63,0.12) 0%, transparent 70%),
    radial-gradient(ellipse 500px 500px at 70% 60%, rgba(201,168,76,0.08) 0%, transparent 70%),
    radial-gradient(ellipse 300px 300px at 50% 80%, rgba(124,90,158,0.06) 0%, transparent 70%);
  pointer-events: none;
}
.hero-subtitle {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--accent-gold);
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: fadeUp 0.8s 0.2s forwards;
}
.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(2.8rem, 7vw, 5.5rem);
  font-weight: 700;
  line-height: 1.1;
  max-width: 900px;
  margin-bottom: 1.5rem;
  opacity: 0;
  animation: fadeUp 0.8s 0.4s forwards;
}
.hero h1 span { color: var(--accent-gold); }
.hero-desc {
  font-size: 1.1rem;
  color: var(--text-secondary);
  max-width: 640px;
  line-height: 1.8;
  opacity: 0;
  animation: fadeUp 0.8s 0.6s forwards;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
```

Markup pattern:
```html
<section class="hero">
  <div class="hero-subtitle">Category · Subtopic · Descriptor</div>
  <h1>Main <span>Title</span> Here</h1>
  <p class="hero-desc">One-sentence description of what this doc covers.</p>
</section>
<div class="divider"></div>
```

## Sections

```css
.section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 6rem 2rem;
}
.section-header { margin-bottom: 3rem; }
.section-label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--accent-gold-dim);
  margin-bottom: 0.75rem;
}
.section h2 {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 1rem;
}
.section h2 span { color: var(--accent-gold); }
.section-intro {
  font-size: 1.05rem;
  color: var(--text-secondary);
  max-width: 720px;
  line-height: 1.8;
}
.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-light), transparent);
  margin: 0 auto;
  max-width: 1100px;
}
```

Markup:
```html
<section class="section">
  <div class="section-header">
    <div class="section-label">Chapter I · or SECTION 01</div>
    <h2>The <span>Highlighted</span> Title</h2>
    <p class="section-intro">Short intro paragraph explaining this section.</p>
  </div>
  <!-- content -->
</section>
```

## Cards (general purpose)

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.card:hover {
  border-color: var(--border-light);
  background: var(--bg-card-hover);
  transform: translateY(-2px);
}
.card-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.card-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.card-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.7;
}
/* Colored top accent bar */
.card.accent-top::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent-gold);
}
```

Card grids:
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
  margin-top: 2rem;
}
```

## Badges / pills

```css
.badge {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  padding: 0.35rem 0.75rem;
  border-radius: 3px;
  text-transform: uppercase;
  display: inline-block;
}
.badge-gold { background: rgba(201,168,76,0.12); color: var(--accent-gold); border: 1px solid rgba(201,168,76,0.2); }
.badge-green { background: rgba(74,124,63,0.12); color: var(--accent-green-bright); border: 1px solid rgba(74,124,63,0.2); }
.badge-purple { background: rgba(124,90,158,0.12); color: #a88ad4; border: 1px solid rgba(124,90,158,0.2); }
.badge-red { background: rgba(181,76,76,0.12); color: var(--accent-red); border: 1px solid rgba(181,76,76,0.2); }
.badge-orange { background: rgba(201,122,46,0.12); color: var(--accent-orange); border: 1px solid rgba(201,122,46,0.2); }
.badge-blue { background: rgba(74,124,158,0.12); color: var(--accent-blue); border: 1px solid rgba(74,124,158,0.2); }

.pill {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  padding: 0.2rem 0.5rem;
  border-radius: 3px;
  background: rgba(74,124,63,0.15);
  color: var(--accent-green-bright);
  letter-spacing: 0.05em;
  display: inline-block;
}
```

## Callout boxes

```css
.callout {
  border-left: 3px solid var(--accent-gold);
  background: rgba(201,168,76,0.04);
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  border-radius: 0 6px 6px 0;
}
.callout-red { border-left-color: var(--accent-red); background: rgba(181,76,76,0.04); }
.callout-green { border-left-color: var(--accent-green-bright); background: rgba(109,179,95,0.04); }
.callout-purple { border-left-color: var(--accent-purple); background: rgba(124,90,158,0.04); }
.callout-blue { border-left-color: var(--accent-blue); background: rgba(74,124,158,0.04); }

.callout-label {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.4rem;
  color: var(--accent-gold);
}
.callout-red .callout-label { color: var(--accent-red); }
.callout-green .callout-label { color: var(--accent-green-bright); }
.callout-purple .callout-label { color: var(--accent-purple); }

.callout p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.7;
}
```

Usage:
- `.callout` (gold) — tips, observations
- `.callout-red` — warnings, danger, hard rules
- `.callout-green` — positive notes, wins, confirmed facts
- `.callout-purple` — devil's-advocate, alternative views
- `.callout-blue` — technical info, data references

## Timeline / protocol

```css
.protocol-timeline {
  position: relative;
  margin: 3rem 0;
  padding-left: 2rem;
}
.protocol-timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, var(--accent-gold), var(--accent-green), var(--accent-purple));
}
.protocol-phase {
  position: relative;
  margin-bottom: 2.5rem;
  padding-left: 2rem;
}
.protocol-phase::before {
  content: '';
  position: absolute;
  left: -2rem;
  top: 0.3rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--accent-gold);
  background: var(--bg-primary);
  transform: translateX(-5px);
}
.protocol-week {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent-gold-dim);
  margin-bottom: 0.3rem;
}
.protocol-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.protocol-body {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.8;
}
.protocol-body strong { color: var(--text-primary); }
```

## Tables

```css
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 2rem 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  font-size: 0.88rem;
}
th {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  background: var(--bg-section);
  text-align: left;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 0.85rem 1.2rem;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--bg-card-hover); color: var(--text-primary); }
td strong { color: var(--text-primary); font-weight: 600; }
```

## Stats / metric display

```css
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
}
.stat {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1.25rem 1.4rem;
}
.stat-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}
.stat-value {
  font-family: var(--font-display);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--accent-gold);
  line-height: 1.1;
}
.stat-sub {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.3rem;
}
```

## Lists

```css
ul, ol {
  margin: 0 0 1rem 1.5rem;
  color: var(--text-secondary);
  font-size: 0.92rem;
}
li {
  margin-bottom: 0.4rem;
  line-height: 1.7;
}
li strong { color: var(--text-primary); }
```

## Text elements

```css
p { margin-bottom: 1rem; color: var(--text-secondary); line-height: 1.8; font-size: 0.95rem; }
p strong { color: var(--text-primary); font-weight: 600; }
a { color: var(--accent-gold); text-decoration: none; border-bottom: 1px solid rgba(201,168,76,0.3); transition: all 0.2s; }
a:hover { border-bottom-color: var(--accent-gold); }
code {
  font-family: var(--font-mono);
  font-size: 0.82em;
  background: rgba(255,255,255,0.04);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  color: var(--accent-gold);
}
blockquote {
  border-left: 3px solid var(--border-light);
  padding: 0.5rem 1.5rem;
  margin: 1.5rem 0;
  color: var(--text-muted);
  font-style: italic;
}
hr { border: none; height: 1px; background: var(--border); margin: 2rem 0; }
```

## Footer

```css
.footer {
  text-align: center;
  padding: 4rem 2rem;
  border-top: 1px solid var(--border);
}
.footer p {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
  letter-spacing: 0.1em;
}
```

## Responsive

```css
@media (max-width: 768px) {
  .section { padding: 4rem 1.25rem; }
  .hero { padding: 2rem 1.25rem; }
  .card-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
```

## Smooth reveal animation (optional)

Add `class="reveal"` to sections/cards to fade them in on scroll:

```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s, transform 0.6s;
}
.reveal.visible { opacity: 1; transform: translateY(0); }
```

With this script at bottom of body:
```html
<script>
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
</script>
```

## Voice & tone guidelines

- **Prose:** write in flowing paragraphs, not just bullet-lists.
  Use bold to emphasize key terms within paragraphs.
- **Section labels:** use roman numerals ("Chapter I") or section numbers
  ("SECTION 01") in mono uppercase above h2s.
- **h1 accents:** wrap 1-2 key words in `<span>` for gold highlighting.
- **Italics:** sparingly, inline within serif headings for emphasis
  (via `<em>` wrapped in display font).
- **Footer:** always end with a centered mono-font line noting the
  doc's purpose or date.

## Document structure

Every document follows this outer structure:

```html
<!DOCTYPE html>
<html lang="en">  <!-- or "de" for German docs -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Title</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* All the CSS from this design system, plus any doc-specific additions */
  </style>
</head>
<body>
  <section class="hero">...</section>
  <div class="divider"></div>
  <section class="section">...</section>
  <div class="divider"></div>
  <section class="section">...</section>
  <!-- more sections -->
  <footer class="footer">
    <p>Closing note · Date · Purpose</p>
  </footer>
  <script>
    /* Reveal-on-scroll script */
  </script>
</body>
</html>
```

## Key aesthetic principles

1. **Dark, editorial, calm.** Never feels like a blog post — feels like a printed field guide.
2. **Generous whitespace.** 6rem section padding, 1.7-1.8 line-height.
3. **Serif for emotion, mono for precision.** Display font for headings & values, mono for labels & metadata.
4. **Gold sparingly.** Gold is the hero accent — use it for the main h1 highlight, section labels, stat values, pills. Don't spam it.
5. **Color = meaning.** Green = botanical/growth/positive. Gold = primary accent. Purple = contrarian. Red = warning. Blue = technical. Orange = hazard/caution.
6. **Cards lift on hover.** Every card gets the `translateY(-2px)` + brighter bg on hover.
