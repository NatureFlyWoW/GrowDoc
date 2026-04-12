// GrowDoc Companion — Strain Picker Component
// Lazy-loads strain database, provides search/select + custom strain creation.

import { escapeHtml } from '../utils.js';

let _cachedDatabase = null;

/** Dynamically imports strain-database.js on first call, caches for subsequent use. */
export async function loadStrainDatabase() {
  if (_cachedDatabase) return _cachedDatabase;
  const mod = await import('../data/strain-database.js');
  _cachedDatabase = mod.STRAINS;
  return _cachedDatabase;
}

/** Search strains by query. Returns array of [id, strainData] pairs. */
export function searchStrains(query, database) {
  const entries = Object.entries(database);
  if (!query || !query.trim()) return entries;
  const q = query.toLowerCase().trim();
  return entries.filter(([, s]) =>
    s.name.toLowerCase().includes(q) ||
    (s.breeder && s.breeder.toLowerCase().includes(q)) ||
    s.type.toLowerCase().includes(q)
  );
}

/** Get custom strains from localStorage. */
function getCustomStrains() {
  try {
    return JSON.parse(localStorage.getItem('growdoc-companion-custom-strains') || '{}');
  } catch (err) { console.error('[strain-picker:load]', err); return {}; }
}

/** Save custom strain to localStorage. */
function saveCustomStrain(id, data) {
  const customs = getCustomStrains();
  customs[id] = data;
  localStorage.setItem('growdoc-companion-custom-strains', JSON.stringify(customs));
}

/**
 * Render the strain picker into a container.
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Function} options.onSelect - Called with (strainId, strainData)
 * @param {Function} options.onCustom - Called with (customStrain)
 * @param {string} [options.initialValue] - Pre-selected strain ID
 */
export function renderStrainPicker(container, options = {}) {
  const { onSelect = () => {}, onCustom = () => {}, initialValue } = options;
  let db = null;
  let activeIndex = -1;

  container.innerHTML = `
    <div class="strain-picker">
      <div class="strain-picker__search">
        <input type="text" class="strain-picker__input" placeholder="Search strains..."
          role="combobox" aria-expanded="true" aria-owns="strain-results"
          aria-autocomplete="list" autocomplete="off" />
      </div>
      <div class="strain-picker__loading" style="padding:12px;color:var(--text-muted)">Loading strain database...</div>
      <div id="strain-results" role="listbox" class="strain-picker__results" style="display:none;max-height:280px;overflow-y:auto"></div>
      <button type="button" class="strain-picker__custom-btn" style="display:none;margin-top:8px;font-size:0.85rem;color:var(--accent);background:none;border:none;cursor:pointer;text-decoration:underline">
        + Add custom strain
      </button>
      <div class="strain-picker__custom-form" style="display:none"></div>
    </div>
  `;

  const input = container.querySelector('.strain-picker__input');
  const loading = container.querySelector('.strain-picker__loading');
  const resultsList = container.querySelector('#strain-results');
  const customBtn = container.querySelector('.strain-picker__custom-btn');
  const customForm = container.querySelector('.strain-picker__custom-form');

  let debounceTimer = null;

  // Load database
  loadStrainDatabase().then(database => {
    db = { ...database, ...getCustomStrains() };
    loading.style.display = 'none';
    resultsList.style.display = '';
    customBtn.style.display = '';
    renderResults('');
    if (initialValue && db[initialValue]) {
      input.value = db[initialValue].name;
    }
  });

  function renderResults(query) {
    if (!db) return;
    const matches = searchStrains(query, db);
    const limited = matches.slice(0, 50); // Show max 50 for performance

    if (limited.length === 0) {
      resultsList.innerHTML = `<div style="padding:12px;color:var(--text-muted)">No strains found. <a href="#" class="strain-picker__add-link" style="color:var(--accent)">Add a custom strain?</a></div>`;
      const addLink = resultsList.querySelector('.strain-picker__add-link');
      if (addLink) addLink.addEventListener('click', (e) => { e.preventDefault(); showCustomForm(); });
      return;
    }

    resultsList.innerHTML = limited.map(([id, s], i) => {
      const typeBadge = s.type === 'indica-dom' ? 'IND' : s.type === 'sativa-dom' ? 'SAT' : 'HYB';
      const autoTag = s.isAuto ? ' <span style="color:var(--accent);font-size:0.75rem">AUTO</span>' : '';
      return `<div role="option" class="strain-picker__item" data-id="${escapeHtml(id)}" data-index="${i}"
        style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border-subtle, #333);display:flex;justify-content:space-between;align-items:center"
        tabindex="-1">
        <div>
          <div style="font-weight:500">${escapeHtml(s.name)}${autoTag}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${escapeHtml(s.breeder || '')}</div>
        </div>
        <div style="text-align:right;font-size:0.8rem">
          <div>${s.flowerWeeks.min}-${s.flowerWeeks.max} wk</div>
          <span style="background:var(--surface-elevated, #2a2a2a);padding:2px 6px;border-radius:3px;font-size:0.7rem">${typeBadge}</span>
        </div>
      </div>`;
    }).join('');

    activeIndex = -1;
  }

  // Search with debounce
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderResults(input.value), 200);
  });

  // Click selection
  resultsList.addEventListener('click', (e) => {
    const item = e.target.closest('.strain-picker__item');
    if (!item) return;
    const id = item.dataset.id;
    if (db[id]) {
      input.value = db[id].name;
      onSelect(id, db[id]);
    }
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = resultsList.querySelectorAll('.strain-picker__item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActiveItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActiveItem(items);
    } else if (e.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
      e.preventDefault();
      items[activeIndex].click();
    }
  });

  function updateActiveItem(items) {
    items.forEach((item, i) => {
      item.style.background = i === activeIndex ? 'var(--surface-elevated, #2a2a2a)' : '';
    });
    if (items[activeIndex]) items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  // Custom strain form
  customBtn.addEventListener('click', showCustomForm);

  function showCustomForm() {
    customBtn.style.display = 'none';
    customForm.style.display = '';
    customForm.innerHTML = `
      <div style="border:1px solid var(--border-subtle, #333);padding:12px;border-radius:6px;margin-top:8px">
        <div style="font-weight:600;margin-bottom:8px">Add Custom Strain</div>
        <label style="display:block;margin-bottom:6px;font-size:0.85rem">
          Name *<br><input type="text" class="custom-name" style="width:100%;padding:4px 8px" required />
        </label>
        <div style="display:flex;gap:8px">
          <label style="flex:1;font-size:0.85rem">
            Flower min (wk) *<br><input type="number" class="custom-fw-min" min="4" max="20" value="8" style="width:100%;padding:4px 8px" />
          </label>
          <label style="flex:1;font-size:0.85rem">
            Flower max (wk) *<br><input type="number" class="custom-fw-max" min="4" max="20" value="10" style="width:100%;padding:4px 8px" />
          </label>
        </div>
        <label style="display:block;margin-top:6px;font-size:0.85rem">
          Type<br>
          <select class="custom-type" style="width:100%;padding:4px 8px">
            <option value="hybrid">Hybrid</option>
            <option value="indica-dom">Indica Dominant</option>
            <option value="sativa-dom">Sativa Dominant</option>
          </select>
        </label>
        <div style="margin-top:8px;display:flex;gap:8px">
          <button type="button" class="custom-save" style="padding:6px 16px;background:var(--accent);color:white;border:none;border-radius:4px;cursor:pointer">Save</button>
          <button type="button" class="custom-cancel" style="padding:6px 16px;background:none;border:1px solid var(--border-subtle, #333);border-radius:4px;cursor:pointer;color:var(--text-muted)">Cancel</button>
        </div>
      </div>
    `;

    customForm.querySelector('.custom-save').addEventListener('click', () => {
      const name = customForm.querySelector('.custom-name').value.trim();
      if (!name) return;
      const fwMin = parseInt(customForm.querySelector('.custom-fw-min').value) || 8;
      const fwMax = parseInt(customForm.querySelector('.custom-fw-max').value) || 10;
      const type = customForm.querySelector('.custom-type').value;
      const id = 'custom-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const strain = {
        name, breeder: 'Custom', flowerWeeks: { min: fwMin, max: fwMax },
        stretchRatio: { min: 1.5, max: 2.0 }, sensitivities: [], type, isAuto: false
      };
      saveCustomStrain(id, strain);
      db[id] = strain;
      customForm.style.display = 'none';
      customBtn.style.display = '';
      input.value = name;
      onSelect(id, strain);
      onCustom(strain);
    });

    customForm.querySelector('.custom-cancel').addEventListener('click', () => {
      customForm.style.display = 'none';
      customBtn.style.display = '';
    });
  }
}
