const docs = [
  {
    id: 'tent-guide',
    title: '80×80 Grow Tent Guide',
    subtitle: 'Assembly, Ventilation & Stealth Planning',
    icon: '📄',
    type: 'pdf',
    src: 'docs/tent-guide.pdf'
  },
  {
    id: 'construction',
    title: 'Construction Plans',
    subtitle: 'Illustrated Build Reference',
    icon: '📐',
    type: 'pdf',
    src: 'docs/construction-plans.pdf'
  },
  {
    id: 'pheno-pdf',
    title: 'Pheno Hunting',
    subtitle: 'Sativa Super Skunk',
    icon: '🧬',
    type: 'pdf',
    src: 'docs/pheno-hunting.pdf'
  },
  {
    id: 'pheno-html',
    title: 'Pheno Hunting',
    subtitle: 'Sativa Super Skunk — Interactive',
    icon: '🧬',
    type: 'html',
    src: 'docs/pheno-hunting.html'
  },
  {
    id: 'grow-200g',
    title: '200g Grow Guide',
    subtitle: 'Pushing Yields to the Max',
    icon: '🌱',
    type: 'pdf',
    src: 'docs/200g-grow-guide.pdf'
  }
];

let activeId = docs[0].id;

function render() {
  const active = docs.find(d => d.id === activeId);

  // Sidebar
  document.getElementById('nav-list').innerHTML = docs.map(d => `
    <div class="nav-item ${d.id === activeId ? 'active' : ''}" onclick="select('${d.id}')">
      <span class="icon">${d.icon}</span>
      <span>${d.title}</span>
      <span class="type-badge">${d.type}</span>
    </div>
  `).join('');

  // Mobile nav
  document.getElementById('mobile-nav').innerHTML = docs.map(d => `
    <div class="mobile-nav-item ${d.id === activeId ? 'active' : ''}" onclick="select('${d.id}')">
      ${d.icon} ${d.title}
    </div>
  `).join('');

  // Viewer
  document.getElementById('viewer-title').textContent = active.title;
  document.getElementById('viewer-meta').textContent =
    active.subtitle + ' · ' + active.type.toUpperCase();

  const iframe = document.getElementById('viewer-iframe');
  iframe.src = active.src;
}

function select(id) {
  activeId = id;
  render();
}

document.addEventListener('DOMContentLoaded', render);
