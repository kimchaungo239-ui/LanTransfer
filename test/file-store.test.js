import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createFileStore, normalizeUploadName } from '../src/file-store.js';

test('reserveUploadPath preserves names without overwriting existing files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lan-transfer-'));
  const store = createFileStore({ receiveDir: dir });
  await fs.writeFile(path.join(dir, 'photo.jpg'), 'existing');

  const first = await store.reserveUploadPath('photo.jpg');
  await fs.writeFile(first, 'first');
  const second = await store.reserveUploadPath('../photo.jpg');

  assert.equal(path.basename(first), 'photo (1).jpg');
  assert.equal(path.basename(second), 'photo (2).jpg');
});

test('shared files are registered by id and never expose arbitrary paths', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lan-transfer-'));
  const file = path.join(dir, 'report.pdf');
  await fs.writeFile(file, 'pdf');

  const store = createFileStore({ receiveDir: dir });
  const shared = await store.addSharedFile(file);

  assert.equal(shared.name, 'report.pdf');
  assert.equal(store.listSharedFiles().length, 1);
  assert.equal(store.getSharedFile(shared.id).path, file);
  assert.equal(store.getSharedFile('missing'), null);
});

test('normalizeUploadName repairs common utf8 filenames decoded as latin1', () => {
  assert.equal(normalizeUploadName('æµè¯æä»¶.txt'), '测试文件.txt');
  assert.equal(normalizeUploadName('../æµè¯.txt'), '测试.txt');
});
