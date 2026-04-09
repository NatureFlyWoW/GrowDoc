// GrowDoc Companion — Trichome Sliders (Three Linked, Sum to 100%)

/**
 * renderTrichomeSliders(container, options) — Three linked sliders.
 *   options.clear   — Initial clear % (default 0)
 *   options.milky   — Initial milky % (default 80)
 *   options.amber   — Initial amber % (default 20)
 *   options.onChange({ clear, milky, amber }) — Callback on any change
 */
export function renderTrichomeSliders(container, options = {}) {
  let values = {
    clear: options.clear ?? 0,
    milky: options.milky ?? 80,
    amber: options.amber ?? 20,
  };

  const wrapper = document.createElement('div');
  wrapper.className = 'trichome-sliders';

  const sliders = {};

  function update(changed) {
    // Redistribute: ensure sum = 100
    const others = Object.keys(values).filter(k => k !== changed);
    const remaining = 100 - values[changed];

    const otherSum = others.reduce((s, k) => s + values[k], 0);
    if (otherSum === 0) {
      // Split equally
      for (const k of others) values[k] = Math.round(remaining / others.length);
    } else {
      // Proportional redistribution
      for (const k of others) {
        values[k] = Math.round((values[k] / otherSum) * remaining);
      }
    }

    // Fix rounding to ensure exactly 100
    const total = Object.values(values).reduce((s, v) => s + v, 0);
    if (total !== 100) {
      values[others[0]] += (100 - total);
    }

    // Clamp
    for (const k of Object.keys(values)) {
      values[k] = Math.max(0, Math.min(100, values[k]));
    }

    // Update UI
    for (const k of Object.keys(sliders)) {
      sliders[k].input.value = values[k];
      sliders[k].label.textContent = `${values[k]}%`;
    }

    if (options.onChange) options.onChange({ ...values });
  }

  for (const key of ['clear', 'milky', 'amber']) {
    const row = document.createElement('div');
    row.className = 'trichome-row';

    const name = document.createElement('span');
    name.className = 'trichome-name';
    name.textContent = key.charAt(0).toUpperCase() + key.slice(1);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '100';
    input.value = values[key];
    input.className = `trichome-slider trichome-${key}`;

    const label = document.createElement('span');
    label.className = 'trichome-pct';
    label.textContent = `${values[key]}%`;

    input.addEventListener('input', () => {
      values[key] = parseInt(input.value, 10);
      update(key);
    });

    sliders[key] = { input, label };
    row.appendChild(name);
    row.appendChild(input);
    row.appendChild(label);
    wrapper.appendChild(row);
  }

  container.appendChild(wrapper);

  return {
    getValues: () => ({ ...values }),
    setValues: (v) => { Object.assign(values, v); update(Object.keys(v)[0]); },
    element: wrapper,
  };
}
