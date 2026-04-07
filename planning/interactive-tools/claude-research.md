# GrowDoc Interactive Tools — Research Findings

## 1. Codebase Design System

### Color Palette (CSS Custom Properties)
Dark theme with accent colors. Each doc defines its own `:root` vars following this pattern:

- **Backgrounds**: `--bg` (#0c0f0a), `--bg2` (#141a10 cards), `--bg3` (#1a2214 nested)
- **Text**: `--text` (#d4cdb7), `--text2` (#a39e8a muted), `--text3` (#6b6756 hint)
- **Accent**: `--accent` (#8fb856 green), `--accent2` (#6a9e3a), `--accent3` (#4a7a25)
- **Status**: `--gold` (#c9a84c), `--red` (#c45c4a), `--blue` (#5a9eb8), `--purple` (#8a7abf)
- **Borders**: `--border` (#2a3320), `--border2` (#3a4530)

### Typography
```css
--serif: 'DM Serif Display', Georgia, serif     /* headings */
--body: 'Source Serif 4', Georgia, serif         /* body text */
--mono: 'IBM Plex Mono', monospace              /* labels, data */
```
- h1: 2.4–2.6em serif, accent color
- h2: 1.4–1.5em serif, border-top separator
- h3: 1.0em sans-serif, gold color
- Body: 15px, font-weight: 300, line-height: 1.75

### Card Patterns
```css
.cd { background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; padding: 14-18px; }
.cd .lb { font-family: var(--mono); font-size: 0.65rem; text-transform: uppercase; color: var(--text3); }
.cd .vl { font-size: 0.92-1.1em; font-weight: 600; color: var(--text); }
```

### Grid Layouts
```css
.g2 { grid-template-columns: 1fr 1fr; gap: 12px; }
.g3 { grid-template-columns: 1fr 1fr 1fr; }
@media(max-width: 640px) { .g2, .g3 { grid-template-columns: 1fr; } }
```

### Alert Boxes (all use left-border + tinted background)
- `.tip` — green (#6a9e3a at 10%), success/positive
- `.warn` — gold (#c9a84c at 8%), warnings
- `.crit` — red (#c45c4a at 10%), critical
- `.da` — purple (#8a7abf at 8%), explanatory

### Container Layout
```css
.container { max-width: 880px; margin: 0 auto; padding: 60px 32px 80px; }
@media(max-width: 640px) { .container { padding: 28px 16px 60px; } }
```

## 2. App Architecture

### Iframe Loading
- Parent loads `docs/docs.json` → renders sidebar → sets iframe `src` to `docs/{file}?t=timestamp`
- **Iframe is sandboxed** — no parent-frame communication
- Tools must be fully self-contained HTML files

### docs.json Entry Structure
```json
{ "id": "tool-id", "title": "Tool Name", "subtitle": "Description",
  "icon": "emoji", "status": "IN REVIEW", "category": "botanical|planning",
  "priority": 1-4, "file": "filename.html" }
```

### API Endpoints (reusable for tool persistence)
- `POST /api/login` → `{ password }` → `{ token }` (14-day JWT)
- `GET /api/state` → `{ docs, sha }` (current docs.json from GitHub)
- `POST /api/save` → `{ docs, sha, upsertFile?, commitNote? }` (save with optimistic concurrency)
- File names must match `/^[a-z0-9\-]+\.html$/`, max 500KB

### Existing Interactive Patterns
- **No interactive elements in current docs** — all read-only HTML/CSS/SVG
- Admin panel (`admin.html`) has forms, tabs, modals as reference
- API client pattern with auth headers available in `admin.js`

## 3. Interactive Decision Tree Patterns

### Best Architecture: Functional Composition
```javascript
const decision = (condFn, trueOutcome, falseOutcome) =>
    (context) => condFn(context) ? trueOutcome : falseOutcome;
const decide = (context, decision) => {
    const outcome = decision(context);
    return typeof outcome === "function" ? decide(context, outcome) : outcome;
};
```

### For Complex Trees: JSON Data Structure
```javascript
{ id: "root", question: "What color are the leaves?", type: "symptom",
  next: { yellow: { question: "Old leaves first?", next: {...} }, brown: {...} } }
```

### Wizard Navigation: Class-based with history
- `selectOption()` pushes to history stack, advances current node
- `goBack()` pops history
- `isDone()` checks for terminal diagnosis node

### Smooth Transitions
CSS `opacity` transitions (0.3s ease) with fade-out → update DOM → fade-in pattern.

## 4. localStorage Persistence Patterns

### Schema Versioning (critical for tool updates)
```javascript
const STORAGE_VERSION = 2;
const migrations = {
    1: (data) => ({ ...data, newField: data.oldField }),
    2: (data) => ({ ...data, addedDefault: 'value' })
};
```
- Store `version` in saved data, run migrations on load if outdated
- Wrap in try/catch for corrupted data recovery

### Debounced Auto-Save
```javascript
const debouncedSave = debounce(saveToLocalStorage, 1000);
document.addEventListener('input', (e) => { if (trackable) debouncedSave(); });
```

### Import/Export
- Export: `JSON.stringify` → `Blob` → `URL.createObjectURL` → download link
- Import: `FileReader` → `JSON.parse` → validate → migrate → save → reload

### Storage Limits
- ~5MB per domain typical
- Monitor usage, clean old cache entries if >80%

## 5. Accessible Forms (WCAG Compliant)

### Core Requirements
- All form controls need `<label>`, `aria-required`, `aria-describedby` for help text
- Use `<fieldset>` + `<legend>` for grouped inputs
- Minimum button/touch target: 44x44px

### ARIA Live Regions for Dynamic Results
```html
<div id="results" role="region" aria-live="polite" aria-atomic="true"></div>
```
- `polite` for normal updates (calculation results, step changes)
- `assertive` only for errors

### Focus Management
- Move focus to first input when wizard step changes
- Use `tabindex="-1"` + `.focus()` for non-interactive elements receiving focus
- Announce step changes via screen-reader-only status elements

### Keyboard Navigation
- Tab/Shift+Tab for standard navigation
- Enter/Space on buttons
- Arrow keys optional for wizard steps

### Dark Theme Contrast
- Text: 4.5:1 minimum ratio (WCAG AA)
- UI components (borders, icons): 3:1 minimum
- Focus indicators: 3px solid outline with offset, add box-shadow in dark mode

### Screen Reader Utility
```css
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
```

## 6. Testing Approach
No existing test framework in the project. For interactive tools:
- Manual testing in iframe viewer context
- Keyboard-only navigation testing
- Screen reader testing (NVDA/VoiceOver)
- localStorage persistence across page reloads
- Mobile responsiveness at 640px breakpoint
