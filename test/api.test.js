import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { createFileStore } from '../src/file-store.js';
import { createSessionManager } from '../src/session.js';

test('status requires the current key', async () => {
  const { baseUrl, close, session } = await startTestServer();
  const current = session.getCurrent();

  const denied = await fetch(`${baseUrl}/api/status`);
  assert.equal(denied.status, 401);

  const allowed = await fetch(`${baseUrl}/api/status?key=${current.key}`);
  assert.equal(allowed.status, 200);
  const body = await allowed.json();
  assert.equal(body.receiveDir.endsWith('receive'), true);

  await close();
});

test('upload writes files only with a valid key', async () => {
  const { baseUrl, close, dir, session } = await startTestServer();
  const current = session.getCurrent();

  const deniedForm = new FormData();
  deniedForm.append('files', new Blob(['nope']), 'nope.txt');
  const denied = await fetch(`${baseUrl}/api/upload`, { method: 'POST', body: deniedForm });
  assert.equal(denied.status, 401);

  const form = new FormData();
  form.append('files', new Blob(['hello']), 'hello.txt');
  const uploaded = await fetch(`${baseUrl}/api/upload?key=${current.key}`, { method: 'POST', body: form });
  assert.equal(uploaded.status, 200);

  const saved = await fs.readFile(path.join(dir, 'receive', 'hello.txt'), 'utf8');
  assert.equal(saved, 'hello');

  await close();
});

test('shared files can be listed and downloaded with a valid key', async () => {
  const { baseUrl, close, dir, fileStore, session } = await startTestServer();
  const current = session.getCurrent();
  const sharedPath = path.join(dir, 'shared.txt');
  await fs.writeFile(sharedPath, 'shared');
  const shared = await fileStore.addSharedFile(sharedPath);

  const list = await fetch(`${baseUrl}/api/shared?key=${current.key}`);
  assert.equal(list.status, 200);
  assert.equal((await list.json()).files[0].name, 'shared.txt');

  const download = await fetch(`${baseUrl}/api/download/${shared.id}?key=${current.key}`);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), 'shared');

  const denied = await fetch(`${baseUrl}/api/download/${shared.id}`);
  assert.equal(denied.status, 401);

  await close();
});

async function startTestServer() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lan-transfer-api-'));
  const receiveDir = path.join(dir, 'receive');
  await fs.mkdir(receiveDir);
  const session = createSessionManager({ ttlMs: 600_000 });
  const fileStore = createFileStore({ receiveDir });
  const app = createApp({ session, fileStore, lanUrl: 'http://127.0.0.1:0' });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
    dir,
    fileStore,
    session
  };
}
