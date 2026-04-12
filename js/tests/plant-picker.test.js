// GrowDoc Companion — Plant Picker Component Tests

import { renderPlantPicker } from '../components/plant-picker.js';

export async function runTests() {
  const results = [];
  const assert = (cond, msg) => {
    results.push({ pass: !!cond, msg });
    if (!cond) console.error(`FAIL: ${msg}`);
  };

  // 1. renderPlantPicker populates the container with children
  {
    const container = document.createElement('div');
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1', stage: 'veg', stageStartDate: new Date().toISOString() }],
      selectedPlantId: 'p1',
      onSelect: () => {},
    });
    assert(container.children.length > 0, 'plant-picker: container has children after render');
  }

  // 2. Container gets .plant-picker-chip elements
  {
    const container = document.createElement('div');
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1' }, { id: 'p2', name: 'Plant 2' }],
      selectedPlantId: null,
      onSelect: () => {},
    });
    const chips = container.querySelectorAll('.plant-picker-chip');
    assert(chips.length > 0, 'plant-picker: .plant-picker-chip elements are present');
  }

  // 3. Two plants + showAll=false → exactly 2 chips
  {
    const container = document.createElement('div');
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1' }, { id: 'p2', name: 'Plant 2' }],
      selectedPlantId: 'p1',
      onSelect: () => {},
      showAll: false,
    });
    const chips = container.querySelectorAll('.plant-picker-chip');
    assert(chips.length === 2, `plant-picker: 2 plants with showAll=false → 2 chips (got ${chips.length})`);
  }

  // 4. Two plants + showAll=true (default) → 3 chips (All + 2 plants)
  {
    const container = document.createElement('div');
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1' }, { id: 'p2', name: 'Plant 2' }],
      selectedPlantId: 'p1',
      onSelect: () => {},
    });
    const chips = container.querySelectorAll('.plant-picker-chip');
    assert(chips.length === 3, `plant-picker: 2 plants with showAll=true → 3 chips (got ${chips.length})`);
  }

  // 5. Selected chip gets --selected modifier class
  {
    const container = document.createElement('div');
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1' }, { id: 'p2', name: 'Plant 2' }],
      selectedPlantId: 'p1',
      onSelect: () => {},
      showAll: false,
    });
    const chips = Array.from(container.querySelectorAll('.plant-picker-chip'));
    const selected = chips.find(c => c.dataset.plantId === 'p1');
    assert(selected?.classList.contains('plant-picker-chip--selected'), 'plant-picker: selected chip has --selected class');
    const unselected = chips.find(c => c.dataset.plantId === 'p2');
    assert(!unselected?.classList.contains('plant-picker-chip--selected'), 'plant-picker: unselected chip does not have --selected class');
  }

  // 6. Clicking a chip fires onSelect with the correct plant ID
  {
    const container = document.createElement('div');
    let selectedId = 'initial';
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1' }, { id: 'p2', name: 'Plant 2' }],
      selectedPlantId: null,
      onSelect: (id) => { selectedId = id; },
      showAll: false,
    });
    const chips = container.querySelectorAll('.plant-picker-chip');
    // Click the second chip (p2)
    chips[1].click();
    assert(selectedId === 'p2', `plant-picker: clicking p2 chip fires onSelect('p2') (got '${selectedId}')`);
  }

  // 7. Clicking the first chip fires onSelect with correct ID
  {
    const container = document.createElement('div');
    let selectedId = 'initial';
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1' }, { id: 'p2', name: 'Plant 2' }],
      selectedPlantId: 'p2',
      onSelect: (id) => { selectedId = id; },
      showAll: false,
    });
    const chips = container.querySelectorAll('.plant-picker-chip');
    chips[0].click();
    assert(selectedId === 'p1', `plant-picker: clicking p1 chip fires onSelect('p1') (got '${selectedId}')`);
  }

  // 8. "All plants" chip passes null to onSelect
  {
    const container = document.createElement('div');
    let selectedId = 'not-null';
    renderPlantPicker(container, {
      plants: [{ id: 'p1', name: 'Plant 1' }],
      selectedPlantId: 'p1',
      onSelect: (id) => { selectedId = id; },
      showAll: true,
    });
    const allChip = container.querySelector('.plant-picker-chip[data-plant-id=""]');
    allChip?.click();
    assert(selectedId === null, `plant-picker: "All plants" chip fires onSelect(null) (got '${selectedId}')`);
  }

  // 9. With empty plants array, no chips are rendered and container stays empty
  {
    const container = document.createElement('div');
    renderPlantPicker(container, {
      plants: [],
      selectedPlantId: null,
      onSelect: () => {},
    });
    const chips = container.querySelectorAll('.plant-picker-chip');
    assert(chips.length === 0, 'plant-picker: empty plants → no chips rendered');
    assert(container.children.length === 0, 'plant-picker: empty plants → container stays empty');
  }

  // 10. Chip name text matches plant name
  {
    const container = document.createElement('div');
    renderPlantPicker(container, {
      plants: [{ id: 'abc', name: 'Citron Givre' }],
      selectedPlantId: null,
      onSelect: () => {},
      showAll: false,
    });
    const nameSpan = container.querySelector('.plant-picker-chip-name');
    assert(nameSpan?.textContent === 'Citron Givre', `plant-picker: chip name matches plant name (got '${nameSpan?.textContent}')`);
  }

  return results;
}
