import crypto from 'crypto';

const TOKEN_TTL_SEC = 14 * 24 * 60 * 60; // 14 days

function getEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function toBase64Url(input) {
  const b64 = Buffer.isBuffer(input)
    ? input.toString('base64')
    : Buffer.from(input).toString('base64');
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

/**
 * Verify the supplied password against the stored scrypt hash.
 * TEAM_PASSWORD_HASH and TEAM_PASSWORD_SALT are hex strings.
 */
export function verifyPassword(password) {
  if (typeof password !== 'string' || password.length === 0) return false;
  try {
    const salt = Buffer.from(getEnv('TEAM_PASSWORD_SALT'), 'hex');
    const expected = Buffer.from(getEnv('TEAM_PASSWORD_HASH'), 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

/**
 * Create an HS256-signed token: base64url(payload).base64url(HMAC)
 */
export function createToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + TOKEN_TTL_SEC };
  const body = toBase64Url(JSON.stringify(payload));
  const sig = toBase64Url(
    crypto.createHmac('sha256', getEnv('JWT_SECRET')).update(body).digest()
  );
  return `${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  let secret;
  try { secret = getEnv('JWT_SECRET'); } catch { return null; }

  const expectedSig = toBase64Url(
    crypto.createHmac('sha256', secret).update(body).digest()
  );
  try {
    const sigBuf = fromBase64Url(sig);
    const expectedBuf = fromBase64Url(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(body).toString('utf-8'));
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

export function requireAuth(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return verifyToken(token);
}
