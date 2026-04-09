// GrowDoc Companion — Vercel Config Tests

export async function runTests() {
  const results = [];
  function assert(condition, msg) {
    results.push({ pass: !!condition, msg });
    if (!condition) console.error(`FAIL: ${msg}`);
  }

  try {
    const res = await fetch('/vercel.json?t=' + Date.now());
    const contentType = res.headers.get('content-type') || '';

    // On Vercel production, /vercel.json is caught by the SPA rewrite and returns HTML
    if (!contentType.includes('application/json')) {
      results.push({ pass: true, msg: 'vercel.json not accessible (production/SPA rewrite) — skipped' });
      return results;
    }

    const config = await res.json();

    // SPA rewrite rule exists
    assert(Array.isArray(config.rewrites), 'vercel.json has rewrites array');

    const spaRewrite = config.rewrites?.find(r => r.destination === '/index.html');
    assert(spaRewrite !== undefined, 'vercel.json has SPA rewrite to /index.html');

    if (spaRewrite) {
      const source = spaRewrite.source || '';

      // Exclusion patterns
      const exclusions = ['api', 'legacy', 'assets', 'css', 'js', 'docs'];
      for (const exc of exclusions) {
        assert(source.includes(exc), `SPA rewrite excludes /${exc}/`);
      }
    }
  } catch (err) {
    assert(false, `Failed to load vercel.json: ${err.message}`);
  }

  return results;
}
