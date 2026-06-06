import crypto from 'node:crypto';

export function createSessionManager({ ttlMs = 600_000, now = () => Date.now() } = {}) {
  let current = null;

  function refresh() {
    current = {
      key: crypto.randomBytes(24).toString('base64url'),
      expiresAt: now() + ttlMs
    };
    return getCurrent();
  }

  function getCurrent() {
    if (!current) {
      return refresh();
    }
    return { ...current, remainingMs: Math.max(0, current.expiresAt - now()) };
  }

  function validate(key) {
    if (!current || !key || key !== current.key) {
      return false;
    }
    return now() <= current.expiresAt;
  }

  return { refresh, getCurrent, validate };
}
