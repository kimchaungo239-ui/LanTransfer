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
  try {
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

    const consoleState = await fetch(`${baseUrl}/api/console`);
    const consoleBody = await consoleState.json();
    assert.equal(consoleBody.receivedFiles[0].name, 'hello.txt');
    assert.equal(consoleBody.receivedFiles[0].size, 5);
  } finally {
    await close();
  }
});

test('console file picker can add shared files without typing a path', async () => {
  const { baseUrl, close, session } = await startTestServer();
  try {
    const current = session.getCurrent();

    const form = new FormData();
    form.append('files', new Blob(['from computer']), 'picked.txt');
    const shared = await fetch(`${baseUrl}/api/share-upload`, { method: 'POST', body: form });
    assert.equal(shared.status, 200);
    const body = await shared.json();
    assert.equal(body.files[0].name, 'picked.txt');

    const list = await fetch(`${baseUrl}/api/shared?key=${current.key}`);
    assert.equal((await list.json()).files[0].name, 'picked.txt');

    const download = await fetch(`${baseUrl}/api/download/${body.files[0].id}?key=${current.key}`);
    assert.equal(await download.text(), 'from computer');
  } finally {
    await close();
  }
});

test('console can change receive directory for later phone uploads', async () => {
  const { baseUrl, close, dir, session } = await startTestServer();
  try {
    const nextReceiveDir = path.join(dir, 'next-receive');
    const changed = await fetch(`${baseUrl}/api/receive-dir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiveDir: nextReceiveDir })
    });
    assert.equal(changed.status, 200);
    assert.equal((await changed.json()).receiveDir, nextReceiveDir);

    const form = new FormData();
    form.append('files', new Blob(['new folder']), 'folder.txt');
    const uploaded = await fetch(`${baseUrl}/api/upload?key=${session.getCurrent().key}`, { method: 'POST', body: form });
    assert.equal(uploaded.status, 200);

    assert.equal(await fs.readFile(path.join(nextReceiveDir, 'folder.txt'), 'utf8'), 'new folder');
  } finally {
    await close();
  }
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

test('refresh creates a new phone URL and QR code', async () => {
  const { baseUrl, close, session } = await startTestServer();
  try {
    const oldKey = session.getCurrent().key;

    const refreshed = await fetch(`${baseUrl}/api/refresh-key`, { method: 'POST' });
    assert.equal(refreshed.status, 200);
    const body = await refreshed.json();

    assert.equal(body.phoneUrl.includes(oldKey), false);
    assert.equal(body.phoneUrl.includes(session.getCurrent().key), true);
    assert.match(body.qrDataUrl, /^data:image\/png;base64,/);
  } finally {
    await close();
  }
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
