export function showCriticalError(message) {
  const existing = document.querySelector('.critical-error-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'critical-error-banner';
  const icon = document.createElement('span');
  icon.textContent = '\u26A0';
  const msg = document.createElement('span');
  msg.textContent = message;
  banner.appendChild(icon);
  banner.appendChild(msg);

  const btn = document.createElement('button');
  btn.className = 'dismiss-btn';
  btn.textContent = '\u2715';
  btn.addEventListener('click', dismissError);
  banner.appendChild(btn);

  const shell = document.getElementById('app-shell');
  const target = shell || document.body;
  target.insertBefore(banner, target.firstChild);
  target.style.paddingTop = banner.offsetHeight + 'px';
}

export function dismissError() {
  const banner = document.querySelector('.critical-error-banner');
  if (!banner) return;
  banner.remove();
  const shell = document.getElementById('app-shell');
  const target = shell || document.body;
  target.style.paddingTop = '';
}

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  showCriticalError('test message');
  assert(document.querySelector('.critical-error-banner') !== null, 'showCriticalError creates banner element');
  assert(document.querySelector('.critical-error-banner').textContent.includes('test message'), 'banner contains the message text');
  assert(document.querySelector('.critical-error-banner .dismiss-btn') !== null, 'banner has dismiss button');

  dismissError();
  assert(document.querySelector('.critical-error-banner') === null, 'dismissError removes banner');
  const shell = document.getElementById('app-shell');
  assert(!shell || shell.style.paddingTop === '', 'dismissError resets app-shell paddingTop');

  showCriticalError('first');
  showCriticalError('second');
  const banners = document.querySelectorAll('.critical-error-banner');
  assert(banners.length === 1, 'duplicate calls produce only one banner');
  assert(banners[0].textContent.includes('second'), 'latest message wins');
  dismissError();

  const savedShell = document.getElementById('app-shell');
  if (savedShell) savedShell.remove();
  showCriticalError('no shell');
  assert(document.querySelector('.critical-error-banner').parentNode === document.body, 'banner falls back to document.body when #app-shell missing');
  dismissError();
  if (savedShell) document.body.appendChild(savedShell);

  document.querySelectorAll('.critical-error-banner').forEach(el => el.remove());
  if (shell) shell.style.paddingTop = '';

  return results;
}
