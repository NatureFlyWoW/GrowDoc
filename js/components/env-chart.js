// GrowDoc Companion — SVG Trend Line Chart

/**
 * renderTrendChart(container, options) — Renders an inline SVG line chart.
 */
export function renderTrendChart(container, options) {
  const { data = [], label = '', unit = '', targetMin, targetMax, width = 400, height = 200, color = 'var(--accent-green)' } = options;

  if (data.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'chart-empty text-muted';
    placeholder.textContent = `Log your first reading to see ${label.toLowerCase()} trends`;
    container.appendChild(placeholder);
    return;
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values) * 0.9;
  const maxVal = Math.max(...values) * 1.1 || 1;
  const yRange = maxVal - minVal || 1;

  const toX = (i) => padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v) => padding.top + chartH - ((v - minVal) / yRange) * chartH;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.classList.add('trend-chart');

  // Optimal range band
  if (targetMin != null && targetMax != null) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', padding.left);
    rect.setAttribute('y', toY(targetMax));
    rect.setAttribute('width', chartW);
    rect.setAttribute('height', Math.abs(toY(targetMin) - toY(targetMax)));
    rect.setAttribute('fill', 'rgba(143, 184, 86, 0.15)');
    svg.appendChild(rect);
  }

  // Grid lines (3 horizontal)
  for (let i = 0; i <= 3; i++) {
    const yVal = minVal + (yRange * i / 3);
    const y = toY(yVal);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padding.left);
    line.setAttribute('x2', width - padding.right);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.08)');
    svg.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', padding.left - 5);
    text.setAttribute('y', y + 4);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-size', '10');
    text.textContent = yVal.toFixed(1);
    svg.appendChild(text);
  }

  // Data line
  if (data.length > 1) {
    const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points);
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', color);
    polyline.setAttribute('stroke-width', '2');
    svg.appendChild(polyline);
  }

  // Data points
  data.forEach((d, i) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', toX(i));
    circle.setAttribute('cy', toY(d.value));
    circle.setAttribute('r', '3');
    circle.setAttribute('fill', color);
    circle.style.cursor = 'pointer';

    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    titleEl.textContent = `${d.date}: ${d.value} ${unit}`;
    circle.appendChild(titleEl);
    svg.appendChild(circle);
  });

  // Title
  const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  titleText.setAttribute('x', padding.left);
  titleText.setAttribute('y', 14);
  titleText.setAttribute('fill', 'var(--text-secondary)');
  titleText.setAttribute('font-size', '12');
  titleText.textContent = `${label} (${unit})`;
  svg.appendChild(titleText);

  container.appendChild(svg);
}
