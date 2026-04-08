// GrowDoc Companion — Knowledge Base Browser (v2)

import { KNOWLEDGE_ARTICLES, TOPICS } from '../data/knowledge-articles.js';
import { MYTHS } from '../data/myths-data.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STAGES = [
  { value: '', label: 'All Stages' },
  { value: 'seedling', label: 'Seedling' },
  { value: 'early-veg', label: 'Early Veg' },
  { value: 'late-veg', label: 'Late Veg' },
  { value: 'transition', label: 'Transition' },
  { value: 'early-flower', label: 'Early Flower' },
  { value: 'mid-flower', label: 'Mid-Flower' },
  { value: 'late-flower', label: 'Late Flower' },
  { value: 'ripening', label: 'Ripening' },
];

const EVIDENCE_LABELS = {
  established: 'Established science',
  moderate: 'Moderate evidence',
  emerging: 'Emerging research',
  anecdotal: 'Anecdotal',
};

const VERDICT_ICONS = {
  'Busted': '✗',
  'Partially True': '~',
  'Unproven': '?',
};

// Minimum content length (chars) before the reading-progress bar is shown.
const PROGRESS_THRESHOLD = 400;

// Debounce delay for search input (ms).
const SEARCH_DEBOUNCE = 220;

// ─── Utility helpers ──────────────────────────────────────────────────────────

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Escape a string for safe use inside a RegExp literal.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Wrap every occurrence of `query` in `text` with a <mark> element.
 * Returns a DocumentFragment so it can be appended directly.
 */
function highlightText(text, query) {
  const frag = document.createDocumentFragment();
  if (!query) {
    frag.appendChild(document.createTextNode(text));
    return frag;
  }
  const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(re);
  for (const part of parts) {
    if (re.test(part)) {
      const mark = document.createElement('mark');
      mark.textContent = part;
      frag.appendChild(mark);
      re.lastIndex = 0; // reset after test()
    } else {
      frag.appendChild(document.createTextNode(part));
    }
  }
  return frag;
}

/**
 * Build a small inline element node. Convenience wrapper.
 */
function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.textContent !== undefined) node.textContent = opts.textContent;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  }
  return node;
}

// ─── Knowledge article rendering ─────────────────────────────────────────────

/**
 * Attempt to dynamically import knowledge-science.js and return the
 * KNOWLEDGE_SCIENCE export. Resolves to null if the file does not exist
 * or does not export the expected object.
 */
async function loadScienceData() {
  try {
    const mod = await import('../data/knowledge-science.js');
    return mod.KNOWLEDGE_SCIENCE || null;
  } catch {
    return null;
  }
}

// Cached result so we only attempt the dynamic import once per session.
let _scienceDataPromise = null;
function getScienceData() {
  if (!_scienceDataPromise) _scienceDataPromise = loadScienceData();
  return _scienceDataPromise;
}

/**
 * Build one article card (all three layers).
 *
 * @param {Object} article  - article data object from KNOWLEDGE_ARTICLES
 * @param {string} query    - current search query (for highlight)
 * @param {Map}    indexMap - id → article lookup for related-article links
 * @param {Function} openById - callback(id) to open another article by id
 * @returns {HTMLElement}
 */
function buildArticleCard(article, query, indexMap, openById) {
  const card = el('article', { className: 'knowledge-card' });
  card.setAttribute('data-id', article.id);

  // ── Layer 1: header (always visible) ──
  const header = el('div', { className: 'kc-header' });
  header.setAttribute('role', 'button');
  header.setAttribute('tabindex', '0');
  header.setAttribute('aria-expanded', 'false');
  header.setAttribute('aria-controls', `kc-body-${article.id}`);

  const headerText = el('div', { className: 'kc-header-text' });

  const topicTag = el('span', { className: 'kc-topic-tag', textContent: article.topic });
  headerText.appendChild(topicTag);

  const titleEl = el('h3', { className: 'kc-title' });
  titleEl.appendChild(highlightText(article.title, query));
  headerText.appendChild(titleEl);

  const actionEl = el('p', { className: 'kc-action' });
  actionEl.appendChild(highlightText(article.layer1, query));
  headerText.appendChild(actionEl);

  const expandIcon = el('span', { className: 'kc-expand-icon', textContent: '▼' });
  expandIcon.setAttribute('aria-hidden', 'true');

  header.appendChild(headerText);
  header.appendChild(expandIcon);
  card.appendChild(header);

  // ── Layer 2: expandable body ──
  const body = el('div', { className: 'kc-body' });
  body.id = `kc-body-${article.id}`;
  body.setAttribute('role', 'region');
  body.setAttribute('aria-label', `Details for ${article.title}`);

  // Reading progress bar (only rendered for long content)
  const combinedLength = (article.layer2 || '').length;
  if (combinedLength >= PROGRESS_THRESHOLD) {
    const progressWrap = el('div', { className: 'kc-progress-wrap' });
    const progressBar = el('div', { className: 'kc-progress-bar' });
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-hidden', 'true');
    progressWrap.appendChild(progressBar);
    body.appendChild(progressWrap);

    // Update bar on scroll inside the main #content element.
    const onScroll = () => {
      const rect = body.getBoundingClientRect();
      const parentRect = body.closest('#content')?.getBoundingClientRect() ?? rect;
      const visible = parentRect.bottom - rect.top;
      const total = rect.height;
      const pct = total > 0 ? Math.min(100, Math.max(0, (visible / total) * 100)) : 0;
      progressBar.style.width = `${pct}%`;
    };
    // Attach scroll listener lazily when card opens.
    card._progressHandler = onScroll;
  }

  if (article.layer2) {
    const detailEl = el('p', { className: 'kc-detail' });
    detailEl.appendChild(highlightText(article.layer2, query));

    if (article.evidence) {
      const badge = el('span', {
        className: `evidence-badge evidence-${article.evidence}`,
        textContent: EVIDENCE_LABELS[article.evidence] || article.evidence,
      });
      detailEl.appendChild(badge);
    }
    body.appendChild(detailEl);
  }

  // Tags
  if (article.tags && article.tags.length > 0) {
    const tagsRow = el('div', { className: 'kc-tags' });
    for (const tag of article.tags) {
      tagsRow.appendChild(el('span', { className: 'kc-tag', textContent: tag }));
    }
    body.appendChild(tagsRow);
  }

  // Actions row: Research button
  const actionsRow = el('div', { className: 'kc-actions' });

  const researchBtn = el('button', { className: 'btn-research', textContent: 'Research' });
  researchBtn.setAttribute('aria-expanded', 'false');
  researchBtn.setAttribute('aria-controls', `kc-research-${article.id}`);
  researchBtn.prepend(el('span', { className: 'btn-research-icon', textContent: '◈ ' }));
  actionsRow.appendChild(researchBtn);

  // Layer 3: research panel (hidden until button clicked)
  const researchPanel = el('div', { className: 'kc-research' });
  researchPanel.id = `kc-research-${article.id}`;
  researchPanel.hidden = true;

  let researchLoaded = false;

  researchBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const open = researchPanel.hidden;
    researchPanel.hidden = !open;
    researchBtn.setAttribute('aria-expanded', String(open));

    if (open && !researchLoaded) {
      researchLoaded = true;
      researchPanel.innerHTML = '<p class="kc-research-loading">Loading research data…</p>';

      const scienceData = await getScienceData();
      const entry = scienceData && scienceData[article.id];

      researchPanel.innerHTML = '';

      if (entry) {
        const content = el('div', { className: 'kc-research-content' });
        if (typeof entry === 'string') {
          content.textContent = entry;
        } else if (entry.html) {
          // Trusted internal HTML only — data file is part of this repo.
          content.innerHTML = entry.html;
        } else {
          content.textContent = JSON.stringify(entry);
        }
        researchPanel.appendChild(content);
      } else {
        researchPanel.appendChild(
          el('p', { className: 'kc-research-coming-soon', textContent: 'Research data coming soon.' })
        );
      }
    }
  });

  body.appendChild(actionsRow);
  body.appendChild(researchPanel);

  // Related articles
  const related = (article.relatedArticles || [])
    .map((id) => indexMap.get(id))
    .filter(Boolean);

  if (related.length > 0) {
    const relatedSection = el('div', { className: 'kc-related' });
    relatedSection.appendChild(el('div', { className: 'kc-related-label', textContent: 'Related' }));
    const linksRow = el('div', { className: 'kc-related-links' });
    for (const rel of related) {
      const link = el('span', { className: 'kc-related-link', textContent: rel.title });
      link.setAttribute('role', 'button');
      link.setAttribute('tabindex', '0');
      link.setAttribute('aria-label', `Open article: ${rel.title}`);
      link.addEventListener('click', () => openById(rel.id));
      link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openById(rel.id); }
      });
      linksRow.appendChild(link);
    }
    relatedSection.appendChild(linksRow);
    body.appendChild(relatedSection);
  }

  card.appendChild(body);

  // ── Toggle expand / collapse ──
  function toggleExpand(force) {
    const willOpen = force !== undefined ? force : !card.classList.contains('is-expanded');
    card.classList.toggle('is-expanded', willOpen);
    header.setAttribute('aria-expanded', String(willOpen));

    if (willOpen && card._progressHandler) {
      const contentEl = card.closest('#content');
      if (contentEl) {
        contentEl.addEventListener('scroll', card._progressHandler, { passive: true });
        card._progressHandler();
      }
    } else if (!willOpen && card._progressHandler) {
      const contentEl = card.closest('#content');
      if (contentEl) contentEl.removeEventListener('scroll', card._progressHandler);
    }
  }

  header.addEventListener('click', () => toggleExpand());
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(); }
  });

  // Expose a programmatic open method for related-article links.
  card._openArticle = () => {
    toggleExpand(true);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return card;
}

// ─── Main view ────────────────────────────────────────────────────────────────

/**
 * renderKnowledgeView(container, store)
 * Renders the full knowledge base browser with search, filters, and progressive disclosure.
 */
export function renderKnowledgeView(container, store) {
  container.innerHTML = '';

  const profile = store?.state?.profile || {};
  const currentStageFromStore = profile.currentStage || '';

  // Build id → article lookup map once.
  const indexMap = new Map(KNOWLEDGE_ARTICLES.map((a) => [a.id, a]));

  // ── State ──
  let currentTopic = null;
  let currentStage = currentStageFromStore;
  let searchQuery = '';
  let renderedCards = [];

  // ── Header ──
  const headerEl = el('div', { className: 'knowledge-header' });
  const h1 = el('h1', { textContent: 'Knowledge Base' });
  const subtitle = el('p', {
    className: 'knowledge-subtitle',
    textContent: `${KNOWLEDGE_ARTICLES.length} articles covering environment, nutrition, training, and more.`,
  });
  headerEl.appendChild(h1);
  headerEl.appendChild(subtitle);
  container.appendChild(headerEl);

  // ── Search ──
  const searchWrap = el('div', { className: 'knowledge-search-wrap' });
  const searchIcon = el('span', { className: 'knowledge-search-icon', textContent: '⌕' });
  searchIcon.setAttribute('aria-hidden', 'true');
  const searchInput = el('input', { className: 'knowledge-search' });
  searchInput.type = 'search';
  searchInput.placeholder = 'Search articles…';
  searchInput.setAttribute('aria-label', 'Search articles');
  searchInput.autocomplete = 'off';
  searchWrap.appendChild(searchIcon);
  searchWrap.appendChild(searchInput);
  container.appendChild(searchWrap);

  // ── Topic filter chips ──
  const topicFilterRow = el('div', { className: 'filter-row' });
  const topicLabel = el('span', { className: 'filter-label', textContent: 'Topic:' });
  topicFilterRow.appendChild(topicLabel);

  const chipSet = el('div', { className: 'chip-set' });
  chipSet.setAttribute('role', 'group');
  chipSet.setAttribute('aria-label', 'Filter by topic');

  // Count articles per topic for count badges.
  const topicCounts = new Map();
  topicCounts.set(null, KNOWLEDGE_ARTICLES.length);
  for (const topic of TOPICS) {
    topicCounts.set(topic, KNOWLEDGE_ARTICLES.filter((a) => a.topic === topic).length);
  }

  const chipButtons = new Map(); // topic → chip element

  function buildChip(label, value) {
    const chip = el('span', { className: 'chip' });
    if (value === null) chip.classList.add('active');
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('aria-pressed', String(value === null));
    chip.setAttribute('aria-label', `${label || 'All topics'}, ${topicCounts.get(value) || 0} articles`);

    const labelNode = document.createTextNode(label || 'All');
    chip.appendChild(labelNode);

    const countBadge = el('span', { className: 'chip-count', textContent: String(topicCounts.get(value) || 0) });
    chip.appendChild(countBadge);

    chipButtons.set(value, chip);

    function activate() {
      currentTopic = value;
      chipButtons.forEach((c, k) => {
        const active = k === value;
        c.classList.toggle('active', active);
        c.setAttribute('aria-pressed', String(active));
      });
      renderArticles();
    }

    chip.addEventListener('click', activate);
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });

    return chip;
  }

  chipSet.appendChild(buildChip('All', null));
  for (const topic of TOPICS) {
    chipSet.appendChild(buildChip(topic, topic));
  }

  topicFilterRow.appendChild(chipSet);
  container.appendChild(topicFilterRow);

  // ── Stage filter dropdown ──
  const stageFilterRow = el('div', { className: 'filter-row' });
  const stageLabel = el('span', { className: 'filter-label', textContent: 'Stage:' });
  stageFilterRow.appendChild(stageLabel);

  const stageSelect = el('select', { className: 'stage-select' });
  stageSelect.setAttribute('aria-label', 'Filter by grow stage');
  for (const { value, label } of ALL_STAGES) {
    const opt = el('option', { textContent: label });
    opt.value = value;
    if (value === currentStage) opt.selected = true;
    stageSelect.appendChild(opt);
  }
  if (currentStage) stageSelect.classList.add('stage-active');

  stageSelect.addEventListener('change', () => {
    currentStage = stageSelect.value;
    stageSelect.classList.toggle('stage-active', !!currentStage);
    renderArticles();
  });

  stageFilterRow.appendChild(stageSelect);
  container.appendChild(stageFilterRow);

  // ── Results summary + article list container ──
  const summaryEl = el('p', { className: 'results-summary' });
  container.appendChild(summaryEl);

  const listContainer = el('div', { className: 'article-list' });
  container.appendChild(listContainer);

  // ── openById: scroll to and open an article card by its id ──
  function openById(id) {
    // Ensure any active filters are cleared so the target article is visible.
    const target = indexMap.get(id);
    if (!target) return;

    // Clear topic / stage filter if they would hide this article.
    if (currentTopic && target.topic !== currentTopic) {
      currentTopic = null;
      chipButtons.forEach((c, k) => {
        c.classList.toggle('active', k === null);
        c.setAttribute('aria-pressed', String(k === null));
      });
    }
    if (currentStage && !(target.stages || []).includes(currentStage)) {
      currentStage = '';
      stageSelect.value = '';
      stageSelect.classList.remove('stage-active');
    }

    renderArticles();

    // Find and open the card after re-render.
    requestAnimationFrame(() => {
      const targetCard = listContainer.querySelector(`[data-id="${id}"]`);
      if (targetCard && targetCard._openArticle) {
        targetCard._openArticle();
      }
    });
  }

  // ── Main render function ──
  function renderArticles() {
    listContainer.innerHTML = '';
    renderedCards = [];

    const query = searchQuery.trim().toLowerCase();

    let filtered = KNOWLEDGE_ARTICLES;

    if (query) {
      filtered = filtered.filter((a) => {
        const haystack = [a.title, a.layer1, a.layer2 || '', ...(a.tags || [])].join(' ').toLowerCase();
        return haystack.includes(query);
      });
    }

    if (currentTopic) {
      filtered = filtered.filter((a) => a.topic === currentTopic);
    }

    if (currentStage) {
      filtered = filtered.filter((a) => (a.stages || []).includes(currentStage));
    }

    // Update results summary.
    const totalCount = KNOWLEDGE_ARTICLES.length;
    if (filtered.length === totalCount && !query && !currentTopic && !currentStage) {
      summaryEl.textContent = '';
    } else {
      summaryEl.textContent = `Showing ${filtered.length} of ${totalCount} articles`;
    }

    if (filtered.length === 0) {
      listContainer.appendChild(buildEmptyState(query, currentTopic, currentStage, () => {
        // Clear all filters.
        searchInput.value = '';
        searchQuery = '';
        currentTopic = null;
        currentStage = '';
        stageSelect.value = '';
        stageSelect.classList.remove('stage-active');
        chipButtons.forEach((c, k) => {
          c.classList.toggle('active', k === null);
          c.setAttribute('aria-pressed', String(k === null));
        });
        renderArticles();
      }));
      return;
    }

    for (const article of filtered) {
      const card = buildArticleCard(article, query, indexMap, openById);
      renderedCards.push(card);
      listContainer.appendChild(card);
    }
  }

  // ── Debounced search handler ──
  const handleSearch = debounce(() => {
    searchQuery = searchInput.value;
    renderArticles();
  }, SEARCH_DEBOUNCE);

  searchInput.addEventListener('input', handleSearch);

  // ── Initial render ──
  renderArticles();
}

// ─── Empty state builder ──────────────────────────────────────────────────────

function buildEmptyState(query, topic, stage, onClearAll) {
  const wrap = el('div', { className: 'knowledge-empty' });

  const icon = el('div', { className: 'knowledge-empty-icon', textContent: '◎' });
  icon.setAttribute('aria-hidden', 'true');
  wrap.appendChild(icon);

  let heading = 'No articles found';
  let message = 'Try adjusting your search or filters.';

  if (query && !topic && !stage) {
    heading = `No results for "${query}"`;
    message = 'Try a different keyword — or browse all articles by clearing your search.';
  } else if (topic && !query) {
    heading = `No articles in "${topic}"`;
    message = stage
      ? `There are no ${topic} articles for the ${stage} stage. Try a different stage.`
      : 'No articles match this topic with your current filters.';
  } else if (stage && !query && !topic) {
    heading = `No articles for this stage`;
    message = `No articles are tagged for the "${stage}" stage. Browse all stages instead.`;
  }

  wrap.appendChild(el('h3', { textContent: heading }));
  wrap.appendChild(el('p', { textContent: message }));

  const clearBtn = el('button', { className: 'btn', textContent: 'Clear all filters' });
  clearBtn.addEventListener('click', onClearAll);
  wrap.appendChild(clearBtn);

  return wrap;
}

// ─── Myths view ───────────────────────────────────────────────────────────────

/**
 * renderMythsView(container)
 * Renders the myth-busting section with verdict badges, citations, and share links.
 */
export function renderMythsView(container) {
  container.innerHTML = '';

  // ── Header ──
  const headerEl = el('div', { className: 'myths-header' });
  headerEl.appendChild(el('h1', { textContent: 'Myth Busters' }));
  headerEl.appendChild(
    el('p', {
      className: 'knowledge-subtitle',
      textContent: 'Separating fact from fiction with evidence-backed analysis.',
    })
  );
  container.appendChild(headerEl);

  // ── Myth list ──
  const list = el('div', { className: 'myths-list' });

  for (const myth of MYTHS) {
    const card = el('article', { className: 'myth-card' });
    card.setAttribute('data-id', myth.id);

    // ── Card header (claim + verdict badge + chevron) ──
    const cardHeader = el('div', { className: 'myth-card-header' });
    cardHeader.setAttribute('role', 'button');
    cardHeader.setAttribute('tabindex', '0');
    cardHeader.setAttribute('aria-expanded', 'false');
    cardHeader.setAttribute('aria-controls', `myth-body-${myth.id}`);

    const verdictClass = {
      'Busted': 'verdict-busted',
      'Partially True': 'verdict-partially-true',
      'Unproven': 'verdict-unproven',
    }[myth.verdict] || 'verdict-unproven';

    const verdictBadge = el('span', {
      className: `myth-verdict-badge ${verdictClass}`,
      textContent: `${VERDICT_ICONS[myth.verdict] || '?'} ${myth.verdict}`,
    });

    const claimEl = el('h3', { className: 'myth-claim', textContent: myth.claim });
    const expandIcon = el('span', { className: 'myth-expand-icon', textContent: '▼' });
    expandIcon.setAttribute('aria-hidden', 'true');

    cardHeader.appendChild(verdictBadge);
    cardHeader.appendChild(claimEl);
    cardHeader.appendChild(expandIcon);
    card.appendChild(cardHeader);

    // ── Card body (hidden until expanded) ──
    const body = el('div', { className: 'myth-body' });
    body.id = `myth-body-${myth.id}`;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-label', `Details for myth: ${myth.claim}`);

    body.appendChild(el('p', { className: 'myth-explanation', textContent: myth.explanation }));

    // Sources as formatted citation list.
    if (myth.sources && myth.sources.length > 0) {
      const sourcesSection = el('div');
      sourcesSection.appendChild(
        el('div', { className: 'myth-sources-label', textContent: 'Sources' })
      );

      const sourcesList = el('ul', { className: 'myth-sources-list' });
      for (const source of myth.sources) {
        const item = el('li', { className: 'myth-source-item' });
        const icon = el('span', { className: 'myth-source-icon', textContent: '◈' });
        icon.setAttribute('aria-hidden', 'true');
        item.appendChild(icon);
        item.appendChild(document.createTextNode(source));
        sourcesList.appendChild(item);
      }

      sourcesSection.appendChild(sourcesList);
      body.appendChild(sourcesSection);
    }

    // Share / copy myth-bust link.
    const mythActions = el('div', { className: 'myth-actions' });
    const shareBtn = el('button', { className: 'btn-share', textContent: 'Copy link' });

    const shareLinkIcon = el('span', { textContent: '⎘ ' });
    shareLinkIcon.setAttribute('aria-hidden', 'true');
    shareBtn.prepend(shareLinkIcon);

    shareBtn.setAttribute('aria-label', `Copy link to myth: ${myth.claim}`);

    shareBtn.addEventListener('click', async () => {
      const url = `${location.href.split('#')[0]}#myth-${myth.id}`;
      try {
        await navigator.clipboard.writeText(url);
        shareBtn.classList.add('copied');
        shareBtn.childNodes[1].textContent = 'Copied!';
        setTimeout(() => {
          shareBtn.classList.remove('copied');
          shareBtn.childNodes[1].textContent = 'Copy link';
        }, 2000);
      } catch {
        // Fallback: prompt
        window.prompt('Copy this link:', url);
      }
    });

    mythActions.appendChild(shareBtn);
    body.appendChild(mythActions);

    card.appendChild(body);

    // ── Toggle expand/collapse ──
    function toggleMyth() {
      const willOpen = !card.classList.contains('is-expanded');
      card.classList.toggle('is-expanded', willOpen);
      cardHeader.setAttribute('aria-expanded', String(willOpen));
    }

    cardHeader.addEventListener('click', toggleMyth);
    cardHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMyth(); }
    });

    list.appendChild(card);
  }

  container.appendChild(list);

  // If the URL hash targets a specific myth, open it automatically.
  const hash = location.hash;
  if (hash && hash.startsWith('#myth-')) {
    const targetId = hash.slice('#myth-'.length);
    const targetCard = list.querySelector(`[data-id="${targetId}"]`);
    if (targetCard) {
      targetCard.classList.add('is-expanded');
      targetCard.querySelector('.myth-card-header')?.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }
}
