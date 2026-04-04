const docs = [
  {
    id: 'tent-guide',
    title: '80×80 Grow Tent Guide',
    subtitle: 'Assembly, Ventilation & Stealth Planning',
    icon: '📄',
    src: 'docs/tent-guide.html'
  },
  {
    id: 'construction',
    title: 'Construction Plans',
    subtitle: '8 Illustrated Build Diagrams',
    icon: '📐',
    src: 'docs/construction-plans.html'
  },
  {
    id: 'pheno',
    title: 'Pheno Hunting',
    subtitle: 'Sativa Super Skunk Selection Guide',
    icon: '🧬',
    src: 'docs/pheno-hunting.html'
  },
  {
    id: 'grow-200g',
    title: '200g Grow Guide',
    subtitle: 'Pushing Yields to the Max',
    icon: '🌱',
    src: 'docs/200g-grow-guide.html'
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
    active.subtitle;

  const iframe = document.getElementById('viewer-iframe');
  iframe.src = active.src;
}

function select(id) {
  activeId = id;
  render();
}

document.addEventListener('DOMContentLoaded', render);
