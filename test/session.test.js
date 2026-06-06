import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionManager } from '../src/session.js';

test('session manager creates and validates current key', () => {
  const manager = createSessionManager({ ttlMs: 600_000, now: () => 1000 });
  const session = manager.refresh();

  assert.equal(typeof session.key, 'string');
  assert.equal(session.key.length >= 32, true);
  assert.equal(session.expiresAt, 601000);
  assert.equal(manager.validate(session.key), true);
});

test('session manager rejects missing, old, and expired keys', () => {
  let now = 1000;
  const manager = createSessionManager({ ttlMs: 1000, now: () => now });
  const first = manager.refresh();

  assert.equal(manager.validate(''), false);
  assert.equal(manager.validate(first.key), true);

  const second = manager.refresh();
  assert.equal(manager.validate(first.key), false);
  assert.equal(manager.validate(second.key), true);

  now = 3001;
  assert.equal(manager.validate(second.key), false);
});
