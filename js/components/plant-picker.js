// GrowDoc Companion — Plant Picker Component

import { getDaysInStage } from '../data/stage-rules.js';

/**
 * Render a horizontal chip row for selecting an active plant.
 *
 * Uses event delegation on the chip row container so re-renders do not
 * accumulate listeners. The container is fully replaced on each call.
 *
 * @param {HTMLElement} container
 * @param {Object} opts
 * @param {Array<Object>} opts.plants           — plants to show (typically grow.plants)
 * @param {string|null} opts.selectedPlantId    — currently selected plant id
 * @param {(plantId: string|null) => void} opts.onSelect
 * @param {boolean} [opts.showAll=true]         — show an "All plants" chip first (passes null to onSelect)
 */
export function renderPlantPicker(container, { plants, selectedPlantId, onSelect, showAll = true }) {
  container.innerHTML = '';

  if (!plants?.length) return;

  const row = document.createElement('div');
  row.className = 'plant-picker';
  row.setAttribute('role', 'tablist');
  row.setAttribute('aria-label', 'Select plant');

  /**
   * Build a single chip element.
   * @param {string|null} plantId
   * @param {string} labelText
   * @param {string} [metaText]
   * @returns {HTMLButtonElement}
   */
  function buildChip(plantId, labelText, metaText) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'plant-picker-chip';
    btn.setAttribute('role', 'tab');
    btn.dataset.plantId = plantId ?? '';

    const isSelected = plantId === null
      ? selectedPlantId === null
      : plantId === selectedPlantId;

    btn.setAttribute('aria-selected', String(isSelected));
    if (isSelected) btn.classList.add('plant-picker-chip--selected');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'plant-picker-chip-name';
    nameSpan.textContent = labelText;
    btn.appendChild(nameSpan);

    if (metaText) {
      const metaSpan = document.createElement('span');
      metaSpan.className = 'plant-picker-chip-meta';
      metaSpan.textContent = metaText;
      btn.appendChild(metaSpan);
    }

    return btn;
  }

  // "All plants" chip
  if (showAll) {
    row.appendChild(buildChip(null, 'All plants'));
  }

  // Per-plant chips
  for (const plant of plants) {
    const days = getDaysInStage(plant);
    const stage = plant.stage ?? '';
    const metaText = stage ? `${stage} \u00b7 d${days}` : null;
    row.appendChild(buildChip(plant.id, plant.name || plant.id, metaText));
  }

  // ── Keyboard navigation ──────────────────────────────────────────────
  // Arrow keys move focus between chips; Enter/Space select.
  function getChips() {
    return Array.from(row.querySelectorAll('.plant-picker-chip'));
  }

  row.addEventListener('keydown', (e) => {
    const chips = getChips();
    const focused = chips.indexOf(document.activeElement);
    if (focused === -1) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      chips[(focused + 1) % chips.length].focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      chips[(focused - 1 + chips.length) % chips.length].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      chips[focused].click();
    }
  });

  // ── Event delegation for click selection ────────────────────────────
  row.addEventListener('click', (e) => {
    const chip = e.target.closest('.plant-picker-chip');
    if (!chip) return;
    const rawId = chip.dataset.plantId;
    // Empty string maps back to null (the "All" chip)
    const plantId = rawId === '' ? null : rawId;
    onSelect(plantId);
  });

  container.appendChild(row);
}
