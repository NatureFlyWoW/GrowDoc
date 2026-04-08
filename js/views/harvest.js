// GrowDoc Companion — Harvest Advisor View

import { renderTrichomeSliders } from '../components/trichome-sliders.js';
import { getHarvestRecommendation, RECOMMENDATION_LABELS } from '../data/harvest-advisor.js';

/**
 * renderHarvestView(container, store) — Harvest advisor view.
 */
export function renderHarvestView(container, store) {
  container.innerHTML = '';
  const profile = store.state.profile || {};
  const priorities = profile.priorities || { yield: 3, quality: 3, terpenes: 3, effect: 3 };

  const h1 = document.createElement('h1');
  h1.textContent = 'Harvest Advisor';
  container.appendChild(h1);

  const intro = document.createElement('p');
  intro.className = 'text-muted';
  intro.textContent = 'Assess your trichomes and get a priority-based harvest recommendation.';
  container.appendChild(intro);

  // Trichome sliders
  const sliderSection = document.createElement('div');
  sliderSection.className = 'harvest-section';
  const sliderTitle = document.createElement('h3');
  sliderTitle.textContent = 'Trichome Assessment';
  sliderSection.appendChild(sliderTitle);

  const resultEl = document.createElement('div');
  resultEl.className = 'harvest-result';

  const sliders = renderTrichomeSliders(sliderSection, {
    clear: 20, milky: 60, amber: 20,
    onChange: (values) => _updateRecommendation(resultEl, values, priorities),
  });

  container.appendChild(sliderSection);

  // Initial recommendation
  _updateRecommendation(resultEl, sliders.getValues(), priorities);
  container.appendChild(resultEl);
}

function _updateRecommendation(container, trichomes, priorities) {
  container.innerHTML = '';
  const rec = getHarvestRecommendation(trichomes, priorities);
  const labelInfo = RECOMMENDATION_LABELS[rec.recommendation] || { label: rec.recommendation, color: 'var(--text-primary)' };

  const badge = document.createElement('div');
  badge.className = 'harvest-badge';
  badge.style.color = labelInfo.color;
  badge.style.borderColor = labelInfo.color;
  badge.textContent = labelInfo.label;
  container.appendChild(badge);

  if (rec.tradeoffNote) {
    const note = document.createElement('p');
    note.className = 'harvest-note';
    note.textContent = rec.tradeoffNote;
    container.appendChild(note);
  }

  if (rec.staggerSuggestion) {
    const stagger = document.createElement('p');
    stagger.className = 'text-muted';
    stagger.style.fontSize = '0.85rem';
    stagger.textContent = rec.staggerSuggestion;
    container.appendChild(stagger);
  }

  // Post-harvest protocols
  const protocols = document.createElement('div');
  protocols.className = 'harvest-protocols';
  protocols.style.marginTop = 'var(--space-4)';

  const dryTitle = document.createElement('h4');
  dryTitle.textContent = 'Drying Protocol';
  protocols.appendChild(dryTitle);
  const dryInfo = document.createElement('div');
  dryInfo.className = 'text-muted';
  dryInfo.textContent = `Target: ${rec.dryingProtocol.temp.min}-${rec.dryingProtocol.temp.max}°C, ${rec.dryingProtocol.rh.min}-${rec.dryingProtocol.rh.max}% RH. Dry for 10-14 days until stems snap.`;
  protocols.appendChild(dryInfo);

  const cureTitle = document.createElement('h4');
  cureTitle.textContent = 'Curing Protocol';
  protocols.appendChild(cureTitle);
  const cureInfo = document.createElement('div');
  cureInfo.className = 'text-muted';
  cureInfo.textContent = `Target jar RH: ${rec.curingProtocol.jarRH.min}-${rec.curingProtocol.jarRH.max}%. Cure for ${rec.curingProtocol.recommendedWeeks.min}-${rec.curingProtocol.recommendedWeeks.max} weeks.`;
  protocols.appendChild(cureInfo);

  container.appendChild(protocols);
}
