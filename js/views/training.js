// GrowDoc Companion — Training Planner View

import { TRAINING_METHODS, getMethodById, generateMilestones } from '../data/training-protocols.js';
import { navigate } from '../router.js';

/**
 * renderTrainingView(container, store) — Training planner view.
 */
export function renderTrainingView(container, store) {
  container.innerHTML = '';
  const grow = store.state.grow;
  if (!grow || !grow.active) { container.textContent = 'No active grow.'; return; }

  const h1 = document.createElement('h1');
  h1.textContent = 'Training Planner';
  container.appendChild(h1);

  const plants = grow.plants || [];
  for (const plant of plants) {
    const section = document.createElement('div');
    section.className = 'training-plant';

    const h3 = document.createElement('h3');
    h3.textContent = plant.name;
    section.appendChild(h3);

    const current = plant.training?.method || 'none';
    const currentMethod = getMethodById(current);

    // Method selector
    const select = document.createElement('select');
    select.className = 'input';
    for (const m of TRAINING_METHODS) {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} (Difficulty: ${m.difficulty}/3)`;
      if (m.id === current) opt.selected = true;
      select.appendChild(opt);
    }

    select.addEventListener('change', () => {
      const growSnap = store.getSnapshot().grow;
      const p = growSnap.plants.find(pp => pp.id === plant.id);
      if (p) {
        p.training = { method: select.value, milestones: generateMilestones(select.value) };
        store.commit('grow', growSnap);
        renderTrainingView(container, store);
      }
    });
    section.appendChild(select);

    // Method description
    if (currentMethod) {
      const desc = document.createElement('p');
      desc.className = 'text-muted';
      desc.textContent = currentMethod.description;
      section.appendChild(desc);

      // Impact ratings
      const impacts = document.createElement('div');
      impacts.className = 'training-impacts';
      impacts.textContent = `Impact: Yield ${currentMethod.impact.yield}/5 | Quality ${currentMethod.impact.quality}/5 | Terpenes ${currentMethod.impact.terpenes}/5`;
      section.appendChild(impacts);
    }

    // Milestones
    const milestones = plant.training?.milestones || [];
    if (milestones.length > 0) {
      const mList = document.createElement('div');
      mList.className = 'training-milestones';
      const mTitle = document.createElement('h4');
      mTitle.textContent = 'Milestones';
      mList.appendChild(mTitle);
      for (const m of milestones) {
        const item = document.createElement('div');
        item.className = 'milestone-item';
        item.textContent = `${m.completed ? '✓' : '○'} ${m.name} (${m.triggerStage}, day ${m.triggerDay})`;
        if (!m.completed) {
          const completeBtn = document.createElement('button');
          completeBtn.className = 'btn btn-sm';
          completeBtn.textContent = 'Done';
          completeBtn.addEventListener('click', () => {
            const growSnap = store.getSnapshot().grow;
            const p = growSnap.plants.find(pp => pp.id === plant.id);
            const ms = p?.training?.milestones?.find(mm => mm.id === m.id);
            if (ms) { ms.completed = true; ms.completedDate = new Date().toISOString(); }
            store.commit('grow', growSnap);
            renderTrainingView(container, store);
          });
          item.appendChild(completeBtn);
        }
        mList.appendChild(item);
      }
      section.appendChild(mList);
    }

    container.appendChild(section);
  }
}
