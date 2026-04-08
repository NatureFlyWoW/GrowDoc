// GrowDoc Companion — Knowledge Base Browser

import { KNOWLEDGE_ARTICLES, TOPICS } from '../data/knowledge-articles.js';
import { MYTHS } from '../data/myths-data.js';

/**
 * renderKnowledgeView(container, store) — Knowledge base browser.
 */
export function renderKnowledgeView(container, store) {
  container.innerHTML = '';
  const profile = store?.state?.profile || {};

  const h1 = document.createElement('h1');
  h1.textContent = 'Knowledge Base';
  container.appendChild(h1);

  // Search
  const search = document.createElement('input');
  search.type = 'text';
  search.className = 'input';
  search.placeholder = 'Search articles...';
  search.style.marginBottom = 'var(--space-4)';
  search.style.maxWidth = '400px';
  container.appendChild(search);

  // Topic filter
  const filterBar = document.createElement('div');
  filterBar.style.display = 'flex';
  filterBar.style.gap = 'var(--space-2)';
  filterBar.style.marginBottom = 'var(--space-4)';
  filterBar.style.flexWrap = 'wrap';

  let currentTopic = null;

  function renderArticles() {
    let existing = container.querySelector('.article-list');
    if (existing) existing.remove();

    const list = document.createElement('div');
    list.className = 'article-list';

    let filtered = KNOWLEDGE_ARTICLES;
    const query = search.value.toLowerCase().trim();

    if (query) {
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        (a.tags || []).some(t => t.toLowerCase().includes(query))
      );
    }

    if (currentTopic) {
      filtered = filtered.filter(a => a.topic === currentTopic);
    }

    for (const article of filtered) {
      const card = document.createElement('div');
      card.className = 'knowledge-card';

      // Layer 1: Title + summary
      const title = document.createElement('div');
      title.className = 'knowledge-title';
      title.textContent = article.title;
      card.appendChild(title);

      const summary = document.createElement('div');
      summary.className = 'knowledge-summary text-muted';
      summary.textContent = article.layer1;
      card.appendChild(summary);

      // Expandable Layer 2
      if (article.layer2) {
        const details = document.createElement('details');
        const detailsSummary = document.createElement('summary');
        detailsSummary.textContent = 'More detail';
        detailsSummary.style.cursor = 'pointer';
        detailsSummary.style.color = 'var(--accent-green)';
        detailsSummary.style.fontSize = '0.82rem';
        details.appendChild(detailsSummary);

        const content = document.createElement('div');
        content.className = 'knowledge-detail';
        content.textContent = article.layer2;

        if (article.evidence) {
          const badge = document.createElement('span');
          badge.className = 'evidence-badge';
          badge.style.color = `var(--evidence-${article.evidence})`;
          badge.textContent = ` [${article.evidence}]`;
          content.appendChild(badge);
        }

        details.appendChild(content);
        card.appendChild(details);
      }

      list.appendChild(card);
    }

    if (filtered.length === 0) {
      list.innerHTML = '<p class="text-muted">No articles match your search.</p>';
    }

    container.appendChild(list);
  }

  // Topic buttons
  const allBtn = document.createElement('button');
  allBtn.className = 'btn btn-sm btn-primary';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => { currentTopic = null; renderArticles(); });
  filterBar.appendChild(allBtn);

  for (const topic of TOPICS) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm';
    btn.textContent = topic;
    btn.addEventListener('click', () => { currentTopic = topic; renderArticles(); });
    filterBar.appendChild(btn);
  }

  container.appendChild(filterBar);
  search.addEventListener('input', renderArticles);
  renderArticles();
}

/**
 * renderMythsView(container) — Myth-busting section.
 */
export function renderMythsView(container) {
  container.innerHTML = '';
  const h1 = document.createElement('h1');
  h1.textContent = 'Myth Busters';
  container.appendChild(h1);

  for (const myth of MYTHS) {
    const card = document.createElement('div');
    card.className = 'myth-card';

    const title = document.createElement('div');
    title.className = 'myth-title';
    title.textContent = myth.claim;
    card.appendChild(title);

    const verdict = document.createElement('div');
    verdict.className = 'myth-verdict';
    verdict.style.color = myth.verdict === 'Busted' ? 'var(--status-urgent)' : 'var(--status-action)';
    verdict.textContent = myth.verdict;
    card.appendChild(verdict);

    const explanation = document.createElement('div');
    explanation.className = 'text-muted';
    explanation.textContent = myth.explanation;
    card.appendChild(explanation);

    if (myth.sources && myth.sources.length > 0) {
      const sources = document.createElement('div');
      sources.style.fontSize = '0.75rem';
      sources.style.color = 'var(--text-muted)';
      sources.style.marginTop = 'var(--space-2)';
      sources.textContent = `Sources: ${myth.sources.join('; ')}`;
      card.appendChild(sources);
    }

    container.appendChild(card);
  }
}
