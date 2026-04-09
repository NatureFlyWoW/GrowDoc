// GrowDoc Companion — Reusable Star Rating Component

const EFFECT_TYPES = ['Energetic', 'Relaxing', 'Creative', 'Pain Relief', 'Anti-Anxiety', 'Sleep'];

/**
 * renderStarRating(container, options) — Renders a star rating into the container.
 *   options.name       — Priority dimension name ('yield', 'quality', 'terpenes', 'effect')
 *   options.label      — Display label ('Yield', 'Quality', 'Terpenes', 'Effect')
 *   options.color      — CSS color value (e.g., 'var(--priority-yield)')
 *   options.value      — Initial value (0-5, default 3)
 *   options.onChange(value) — Callback when rating changes
 */
export function renderStarRating(container, options) {
  const { name, label, color, value = 3, onChange } = options;
  let currentValue = value;

  const group = document.createElement('div');
  group.className = 'star-rating-group';
  group.dataset.priority = name;

  const rating = document.createElement('div');
  rating.className = 'star-rating';
  rating.setAttribute('role', 'radiogroup');
  rating.setAttribute('aria-label', `${label} priority`);

  const labelEl = document.createElement('span');
  labelEl.className = 'star-rating-label';
  labelEl.style.color = color;
  labelEl.textContent = label;
  rating.appendChild(labelEl);

  // Live region for accessibility announcements
  const liveRegion = document.createElement('span');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.className = 'sr-only';
  liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
  rating.appendChild(liveRegion);

  const stars = [];

  function updateStars() {
    // Roving tabindex: the selected star (or star 1 if none selected) is tabbable
    const focusIdx = currentValue > 0 ? currentValue - 1 : 0;
    for (let i = 0; i < 5; i++) {
      const starNum = i + 1;
      const filled = starNum <= currentValue;
      stars[i].className = 'star-btn' + (filled ? ' filled' : '');
      stars[i].style.setProperty('--star-color', color);
      stars[i].textContent = filled ? '\u2605' : '\u2606';
      stars[i].setAttribute('aria-checked', String(starNum === currentValue));
      stars[i].setAttribute('tabindex', i === focusIdx ? '0' : '-1');
    }
    liveRegion.textContent = `${label} set to ${currentValue} star${currentValue !== 1 ? 's' : ''}`;
  }

  function setRating(newValue) {
    currentValue = newValue;
    updateStars();
    if (onChange) onChange(currentValue);
  }

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('button');
    star.type = 'button';
    star.setAttribute('aria-label', `${i} star${i > 1 ? 's' : ''}`);
    star.setAttribute('role', 'radio');
    star.setAttribute('tabindex', i === currentValue ? '0' : '-1');

    star.addEventListener('click', () => {
      // Toggle: clicking same star decrements by 1
      if (i === currentValue) {
        setRating(Math.max(0, i - 1));
      } else {
        setRating(i);
      }
    });

    star.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.min(5, currentValue + 1);
        setRating(next);
        stars[next - 1].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(1, currentValue - 1);
        setRating(prev);
        stars[prev - 1].focus();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (i === currentValue) {
          setRating(Math.max(0, i - 1));
        } else {
          setRating(i);
        }
      }
    });

    stars.push(star);
    rating.appendChild(star);
  }

  updateStars();
  group.appendChild(rating);
  container.appendChild(group);

  return {
    getValue: () => currentValue,
    setValue: (v) => { currentValue = v; updateStars(); },
    element: group,
  };
}

/**
 * renderEffectSelector(container, options) — Renders the effect type dropdown.
 *   options.value      — Initial selection (string or null)
 *   options.onChange(value) — Callback when selection changes
 *   options.visible    — Whether to show the selector initially
 */
export function renderEffectSelector(container, options) {
  const { value = null, onChange, visible = false, idSuffix = '' } = options;
  const selectId = 'effect-type' + (idSuffix ? `-${idSuffix}` : '');

  const field = document.createElement('div');
  field.className = 'wizard-field effect-selector';
  field.style.marginTop = 'var(--space-4)';
  if (!visible) field.style.display = 'none';

  const label = document.createElement('label');
  label.textContent = 'Target effect';
  label.setAttribute('for', selectId);

  const select = document.createElement('select');
  select.id = selectId;
  select.className = 'input';

  const emptyOpt = document.createElement('option');
  emptyOpt.value = '';
  emptyOpt.textContent = 'Select effect type...';
  select.appendChild(emptyOpt);

  for (const eff of EFFECT_TYPES) {
    const opt = document.createElement('option');
    opt.value = eff.toLowerCase().replace(/\s+/g, '-');
    opt.textContent = eff;
    if (value === opt.value) opt.selected = true;
    select.appendChild(opt);
  }

  select.addEventListener('change', () => {
    if (onChange) onChange(select.value || null);
  });

  field.appendChild(label);
  field.appendChild(select);
  container.appendChild(field);

  return {
    show() { field.style.display = ''; },
    hide() { field.style.display = 'none'; select.value = ''; if (onChange) onChange(null); },
    getValue() { return select.value || null; },
    element: field,
  };
}

/**
 * renderPriorityDisplay(container, priorities) — Compact read-only priority visualization.
 *   priorities: { yield: 1-5, quality: 1-5, terpenes: 1-5, effect: 1-5 }
 *
 * Shows four colored horizontal bars proportional to star count.
 */
export function renderPriorityDisplay(container, priorities) {
  const dims = [
    { key: 'yield', label: 'Yield', color: 'var(--priority-yield)' },
    { key: 'quality', label: 'Quality', color: 'var(--priority-quality)' },
    { key: 'terpenes', label: 'Terpenes', color: 'var(--priority-terpenes)' },
    { key: 'effect', label: 'Effect', color: 'var(--priority-effect)' },
  ];

  const widget = document.createElement('div');
  widget.className = 'priority-display';

  for (const d of dims) {
    const row = document.createElement('div');
    row.className = 'priority-display-row';

    const label = document.createElement('span');
    label.className = 'priority-display-label';
    label.style.color = d.color;
    label.textContent = d.label;

    const barTrack = document.createElement('div');
    barTrack.className = 'priority-display-track';

    const barFill = document.createElement('div');
    barFill.className = 'priority-display-fill';
    barFill.style.width = `${(priorities[d.key] / 5) * 100}%`;
    barFill.style.backgroundColor = d.color;

    const count = document.createElement('span');
    count.className = 'priority-display-count';
    count.textContent = priorities[d.key];

    barTrack.appendChild(barFill);
    row.appendChild(label);
    row.appendChild(barTrack);
    row.appendChild(count);
    widget.appendChild(row);
  }

  const hint = document.createElement('p');
  hint.className = 'text-muted priority-display-hint';
  hint.style.fontSize = '0.78rem';
  hint.style.marginTop = 'var(--space-2)';
  hint.textContent = 'These priorities affect all recommendations throughout the app.';
  widget.appendChild(hint);

  container.appendChild(widget);
  return { element: widget };
}

export { EFFECT_TYPES };
