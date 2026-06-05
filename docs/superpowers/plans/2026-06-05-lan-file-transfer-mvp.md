# LAN File Transfer MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows-first local LAN file transfer MVP where a computer hosts a temporary browser-based transfer room and phones scan a QR code to upload/download files.

**Architecture:** Use a local Node.js Express server with small focused modules for session keys, file safety, network address discovery, routes, and static browser UI. The computer console and phone page are plain HTML/CSS/JS served by the local app; files never leave the LAN service.

**Tech Stack:** Node.js, Express, Multer, QRCode, node:test, native browser JavaScript.

---

## File Structure

- `package.json`: npm scripts and dependencies.
- `src/index.js`: CLI entrypoint, receive directory prompt, server startup.
- `src/app.js`: Express app composition.
- `src/session.js`: access key generation, expiry, validation, refresh.
- `src/file-store.js`: receive directory handling, duplicate-safe filenames, shared-file registry.
- `src/network.js`: LAN IPv4 discovery and port selection.
- `src/routes/api.js`: JSON API, upload endpoint, download endpoint.
- `src/routes/pages.js`: computer console and phone page rendering.
- `src/public/styles.css`: shared utilitarian UI styling.
- `src/public/console.js`: computer console browser behavior.
- `src/public/phone.js`: phone transfer page browser behavior.
- `test/session.test.js`: session key tests.
- `test/file-store.test.js`: safe filename and shared-file tests.
- `test/api.test.js`: keyed API/upload/download route tests.
- `README.md`: local run instructions and MVP scope.
- `D:\Codex\log\lan-file-transfer-mvp.md`: task record after implementation completes.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `README.md`

- [ ] **Step 1: Create package metadata**

Create `package.json`:

```json
{
  "name": "lan-file-transfer",
  "version": "0.1.0",
  "private": true,
  "description": "Local LAN file transfer MVP for browser-based phone and Windows computer transfer.",
  "type": "module",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^4.19.2",
    "multer": "^1.4.5-lts.1",
    "qrcode": "^1.5.4"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create README**

Create `README.md`:

```markdown
# LAN File Transfer

Windows-first local file transfer MVP. The computer runs a temporary local web service, shows a QR code, and phones on the same Wi-Fi or hotspot use a browser to upload/download files.

## Run

```powershell
npm install
npm start
```

The app asks for a receive directory. After startup, open the computer console URL shown in the terminal and scan the QR code with a phone on the same network.

## Scope

- No login.
- No public domain.
- No cloud relay.
- Files stay on the local network.
- Phone side uses standard mobile browser upload/download behavior.
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`

Expected: `node_modules` is created and `package-lock.json` is generated.

- [ ] **Step 4: Commit scaffold**

Run:

```powershell
git add package.json package-lock.json README.md
git commit -m "chore: scaffold Node project"
```

Expected: commit succeeds.

## Task 2: Session Key Module

**Files:**
- Create: `src/session.js`
- Test: `test/session.test.js`

- [ ] **Step 1: Write failing session tests**

Create `test/session.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/session.test.js`

Expected: FAIL with module not found for `src/session.js`.

- [ ] **Step 3: Implement session module**

Create `src/session.js`:

```js
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
```

- [ ] **Step 4: Run session tests**

Run: `npm test -- test/session.test.js`

Expected: PASS.

- [ ] **Step 5: Commit session module**

Run:

```powershell
git add src/session.js test/session.test.js
git commit -m "feat: add expiring access keys"
```

Expected: commit succeeds.

## Task 3: File Store Module

**Files:**
- Create: `src/file-store.js`
- Test: `test/file-store.test.js`

- [ ] **Step 1: Write failing file-store tests**

Create `test/file-store.test.js`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createFileStore } from '../src/file-store.js';

test('reserveUploadPath preserves names without overwriting existing files', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lan-transfer-'));
  const store = createFileStore({ receiveDir: dir });
  await fs.writeFile(path.join(dir, 'photo.jpg'), 'existing');

  const first = await store.reserveUploadPath('photo.jpg');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/file-store.test.js`

Expected: FAIL with module not found for `src/file-store.js`.

- [ ] **Step 3: Implement file-store module**

Create `src/file-store.js`:

```js
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function createFileStore({ receiveDir }) {
  const shared = new Map();
  const reservedUploads = new Set();

  async function reserveUploadPath(originalName) {
    const parsed = path.parse(path.basename(originalName || 'file'));
    const base = parsed.name || 'file';
    const ext = parsed.ext || '';
    let index = 0;

    while (true) {
      const name = index === 0 ? `${base}${ext}` : `${base} (${index})${ext}`;
      const fullPath = path.join(receiveDir, name);
      if (!reservedUploads.has(fullPath) && !(await exists(fullPath))) {
        reservedUploads.add(fullPath);
        return fullPath;
      }
      index += 1;
    }
  }

  async function addSharedFile(filePath) {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      throw new Error('Only files can be shared.');
    }

    const entry = {
      id: crypto.randomUUID(),
      name: path.basename(filePath),
      path: filePath,
      size: stat.size,
      addedAt: Date.now()
    };
    shared.set(entry.id, entry);
    return { id: entry.id, name: entry.name, size: entry.size, addedAt: entry.addedAt };
  }

  function listSharedFiles() {
    return [...shared.values()].map(({ id, name, size, addedAt }) => ({ id, name, size, addedAt }));
  }

  function getSharedFile(id) {
    return shared.get(id) || null;
  }

  return { receiveDir, reserveUploadPath, addSharedFile, listSharedFiles, getSharedFile };
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run file-store tests**

Run: `npm test -- test/file-store.test.js`

Expected: PASS.

- [ ] **Step 5: Commit file-store module**

Run:

```powershell
git add src/file-store.js test/file-store.test.js
git commit -m "feat: add safe local file store"
```

Expected: commit succeeds.

## Task 4: Network Utilities

**Files:**
- Create: `src/network.js`

- [ ] **Step 1: Implement LAN address and port helpers**

Create `src/network.js`:

```js
import net from 'node:net';
import os from 'node:os';

export function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
}

export function getPreferredLanAddress() {
  return getLanAddresses()[0] || '127.0.0.1';
}

export async function findAvailablePort(startPort = 43210) {
  for (let port = startPort; port < startPort + 50; port += 1) {
    if (await canListen(port)) {
      return port;
    }
  }
  throw new Error(`No available port found from ${startPort} to ${startPort + 49}.`);
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '0.0.0.0');
  });
}
```

- [ ] **Step 2: Commit network utilities**

Run:

```powershell
git add src/network.js
git commit -m "feat: add LAN network helpers"
```

Expected: commit succeeds.

## Task 5: Express API

**Files:**
- Create: `src/app.js`
- Create: `src/routes/api.js`
- Test: `test/api.test.js`

- [ ] **Step 1: Write failing API tests**

Create `test/api.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/api.test.js`

Expected: FAIL with module not found for `src/app.js`.

- [ ] **Step 3: Implement API app**

Create `src/app.js`:

```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ session, fileStore, lanUrl, qrDataUrl = '' }) {
  const app = express();
  app.use(express.json());
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use('/api', createApiRouter({ session, fileStore, lanUrl, qrDataUrl }));
  return app;
}
```

Create `src/routes/api.js`:

```js
import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import path from 'node:path';

export function createApiRouter({ session, fileStore, lanUrl, qrDataUrl }) {
  const router = express.Router();

  const upload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, fileStore.receiveDir),
      filename: async (_req, file, cb) => {
        try {
          cb(null, path.basename(await fileStore.reserveUploadPath(file.originalname)));
        } catch (error) {
          cb(error);
        }
      }
    })
  });

  router.get('/console', (_req, res) => {
    const current = session.getCurrent();
    res.json({
      lanUrl,
      phoneUrl: `${lanUrl}/phone?key=${encodeURIComponent(current.key)}`,
      qrDataUrl,
      expiresAt: current.expiresAt,
      remainingMs: current.remainingMs,
      receiveDir: fileStore.receiveDir,
      sharedFiles: fileStore.listSharedFiles()
    });
  });

  router.post('/refresh-key', (_req, res) => {
    const current = session.refresh();
    res.json({
      phoneUrl: `${lanUrl}/phone?key=${encodeURIComponent(current.key)}`,
      expiresAt: current.expiresAt,
      remainingMs: current.remainingMs
    });
  });

  router.get('/status', requireKey(session), (_req, res) => {
    const current = session.getCurrent();
    res.json({
      ok: true,
      receiveDir: fileStore.receiveDir,
      expiresAt: current.expiresAt,
      remainingMs: current.remainingMs
    });
  });

  router.get('/shared', requireKey(session), (_req, res) => {
    res.json({ files: fileStore.listSharedFiles() });
  });

  router.post('/upload', requireKey(session), upload.array('files'), (req, res) => {
    const files = (req.files || []).map((file) => ({
      name: file.filename,
      size: file.size
    }));
    res.json({ files });
  });

  router.post('/share', async (req, res) => {
    try {
      const filePath = String(req.body.filePath || '');
      const shared = await fileStore.addSharedFile(filePath);
      res.json({ file: shared, files: fileStore.listSharedFiles() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get('/download/:id', requireKey(session), (req, res) => {
    const file = fileStore.getSharedFile(req.params.id);
    if (!file || !fs.existsSync(file.path)) {
      res.status(404).json({ error: 'Shared file is no longer available.' });
      return;
    }
    res.download(file.path, file.name);
  });

  return router;
}

function requireKey(session) {
  return (req, res, next) => {
    const key = req.query.key || req.get('x-transfer-key');
    if (!session.validate(String(key || ''))) {
      res.status(401).json({ error: 'Invalid or expired access key.' });
      return;
    }
    next();
  };
}
```

- [ ] **Step 4: Run API tests**

Run: `npm test -- test/api.test.js`

Expected: PASS.

- [ ] **Step 5: Commit API**

Run:

```powershell
git add src/app.js src/routes/api.js test/api.test.js
git commit -m "feat: add keyed transfer API"
```

Expected: commit succeeds.

## Task 6: Browser Pages And Static UI

**Files:**
- Modify: `src/app.js`
- Create: `src/routes/pages.js`
- Create: `src/public/styles.css`
- Create: `src/public/console.js`
- Create: `src/public/phone.js`

- [ ] **Step 1: Add page routes**

Modify `src/app.js` to include page routes:

```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './routes/api.js';
import { createPageRouter } from './routes/pages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ session, fileStore, lanUrl, qrDataUrl = '' }) {
  const app = express();
  app.use(express.json());
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.use('/api', createApiRouter({ session, fileStore, lanUrl, qrDataUrl }));
  app.use('/', createPageRouter({ session, lanUrl, qrDataUrl }));
  return app;
}
```

Create `src/routes/pages.js`:

```js
import express from 'express';

export function createPageRouter({ session, lanUrl, qrDataUrl }) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    const current = session.getCurrent();
    const phoneUrl = `${lanUrl}/phone?key=${encodeURIComponent(current.key)}`;
    res.type('html').send(consolePage({ phoneUrl, qrDataUrl, expiresAt: current.expiresAt }));
  });

  router.get('/phone', (req, res) => {
    const key = String(req.query.key || '');
    res.type('html').send(phonePage({ key }));
  });

  return router;
}

function consolePage({ phoneUrl, qrDataUrl, expiresAt }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LAN File Transfer</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body data-expires-at="${expiresAt}">
  <main class="shell">
    <section class="panel console-grid">
      <div>
        <p class="eyebrow">LAN File Transfer</p>
        <h1>扫码传文件</h1>
        <p class="muted">让手机和这台电脑保持在同一个 Wi-Fi 或热点下。</p>
        <div class="field">
          <label>手机访问地址</label>
          <input id="phoneUrl" value="${escapeHtml(phoneUrl)}" readonly>
        </div>
        <div class="actions">
          <button id="copyUrl">复制地址</button>
          <button id="refreshKey">刷新二维码</button>
        </div>
      </div>
      <div class="qr-wrap">
        ${qrDataUrl ? `<img id="qrCode" src="${qrDataUrl}" alt="Phone QR code">` : '<div id="qrCode" class="qr-placeholder">QR</div>'}
        <p id="countdown" class="countdown"></p>
      </div>
    </section>

    <section class="panel">
      <h2>电脑发给手机</h2>
      <div class="share-row">
        <input id="sharePath" placeholder="粘贴要分享的本机文件完整路径">
        <button id="shareFile">添加</button>
      </div>
      <ul id="sharedFiles" class="file-list"></ul>
    </section>
  </main>
  <script src="/public/console.js"></script>
</body>
</html>`;
}

function phonePage({ key }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LAN File Transfer</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body data-key="${escapeHtml(key)}">
  <main class="shell phone-shell">
    <section class="panel">
      <p class="eyebrow">Connected</p>
      <h1>文件传输</h1>
      <p id="status" class="muted">正在检查连接...</p>
      <form id="uploadForm" class="upload-box">
        <input id="files" name="files" type="file" multiple>
        <button type="submit">发送到电脑</button>
      </form>
      <ul id="uploadResults" class="file-list"></ul>
    </section>

    <section class="panel">
      <h2>电脑发来的文件</h2>
      <ul id="sharedFiles" class="file-list"></ul>
    </section>
  </main>
  <script src="/public/phone.js"></script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
```

- [ ] **Step 2: Add shared styles**

Create `src/public/styles.css`:

```css
:root {
  color-scheme: light;
  font-family: "Segoe UI", Arial, sans-serif;
  background: #f3f5f7;
  color: #17202a;
}

body {
  margin: 0;
}

.shell {
  width: min(1040px, calc(100% - 32px));
  margin: 32px auto;
}

.phone-shell {
  width: min(560px, calc(100% - 24px));
  margin: 18px auto;
}

.panel {
  background: #ffffff;
  border: 1px solid #dce3ea;
  border-radius: 8px;
  padding: 22px;
  margin-bottom: 16px;
}

.console-grid {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  align-items: center;
}

.eyebrow {
  margin: 0 0 8px;
  color: #0f766e;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}

h1, h2 {
  margin: 0 0 12px;
  letter-spacing: 0;
}

.muted {
  color: #5c6975;
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #5c6975;
}

input {
  box-sizing: border-box;
  width: 100%;
  min-height: 42px;
  border: 1px solid #c8d2dc;
  border-radius: 6px;
  padding: 0 12px;
  font: inherit;
}

button {
  min-height: 42px;
  border: 0;
  border-radius: 6px;
  padding: 0 14px;
  background: #1f6feb;
  color: white;
  font: inherit;
  cursor: pointer;
}

button.secondary {
  background: #334155;
}

.actions, .share-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.share-row input {
  flex: 1;
}

.qr-wrap {
  text-align: center;
}

.qr-wrap img, .qr-placeholder {
  width: 220px;
  height: 220px;
  border: 1px solid #dce3ea;
  border-radius: 8px;
}

.qr-placeholder {
  display: grid;
  place-items: center;
  color: #6b7280;
}

.countdown {
  font-weight: 700;
}

.upload-box {
  display: grid;
  gap: 12px;
  margin: 18px 0;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}

.file-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid #edf1f5;
}

.file-list a {
  color: #1f6feb;
  font-weight: 700;
}

@media (max-width: 760px) {
  .console-grid, .actions, .share-row {
    grid-template-columns: 1fr;
    display: grid;
  }
}
```

- [ ] **Step 3: Add console browser behavior**

Create `src/public/console.js`:

```js
const countdown = document.querySelector('#countdown');
const phoneUrl = document.querySelector('#phoneUrl');
const copyUrl = document.querySelector('#copyUrl');
const refreshKey = document.querySelector('#refreshKey');
const sharePath = document.querySelector('#sharePath');
const shareFile = document.querySelector('#shareFile');
const sharedFiles = document.querySelector('#sharedFiles');

let expiresAt = Number(document.body.dataset.expiresAt || 0);

copyUrl.addEventListener('click', async () => {
  await navigator.clipboard.writeText(phoneUrl.value);
  copyUrl.textContent = '已复制';
  setTimeout(() => { copyUrl.textContent = '复制地址'; }, 1200);
});

refreshKey.addEventListener('click', async () => {
  const response = await fetch('/api/refresh-key', { method: 'POST' });
  const data = await response.json();
  phoneUrl.value = data.phoneUrl;
  expiresAt = data.expiresAt;
  window.location.reload();
});

shareFile.addEventListener('click', async () => {
  const filePath = sharePath.value.trim();
  if (!filePath) return;
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || '添加失败');
    return;
  }
  sharePath.value = '';
  renderShared(data.files);
});

async function loadConsole() {
  const response = await fetch('/api/console');
  const data = await response.json();
  renderShared(data.sharedFiles);
}

function renderShared(files) {
  sharedFiles.innerHTML = files.length
    ? files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('')
    : '<li><span>还没有添加文件</span></li>';
}

function tick() {
  const remaining = Math.max(0, expiresAt - Date.now());
  countdown.textContent = remaining > 0
    ? `二维码 ${Math.ceil(remaining / 1000)} 秒后失效`
    : '二维码已失效，请刷新';
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

loadConsole();
tick();
setInterval(tick, 1000);
```

- [ ] **Step 4: Add phone browser behavior**

Create `src/public/phone.js`:

```js
const key = document.body.dataset.key;
const statusEl = document.querySelector('#status');
const uploadForm = document.querySelector('#uploadForm');
const filesInput = document.querySelector('#files');
const uploadResults = document.querySelector('#uploadResults');
const sharedFiles = document.querySelector('#sharedFiles');

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData();
  for (const file of filesInput.files) {
    form.append('files', file);
  }
  if (!filesInput.files.length) return;

  statusEl.textContent = '正在上传...';
  const response = await fetch(`/api/upload?key=${encodeURIComponent(key)}`, { method: 'POST', body: form });
  const data = await response.json();
  if (!response.ok) {
    statusEl.textContent = data.error || '上传失败，请重试';
    return;
  }
  statusEl.textContent = '上传完成';
  uploadResults.innerHTML = data.files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('');
  filesInput.value = '';
});

async function loadStatus() {
  const response = await fetch(`/api/status?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    statusEl.textContent = '二维码已失效，请在电脑端刷新后重新扫码';
    uploadForm.hidden = true;
    return;
  }
  statusEl.textContent = '已连接，可以开始传输';
  uploadForm.hidden = false;
  await loadShared();
}

async function loadShared() {
  const response = await fetch(`/api/shared?key=${encodeURIComponent(key)}`);
  if (!response.ok) return;
  const data = await response.json();
  sharedFiles.innerHTML = data.files.length
    ? data.files.map((file) => `<li><span>${escapeHtml(file.name)}</span><a href="/api/download/${file.id}?key=${encodeURIComponent(key)}">下载</a></li>`).join('')
    : '<li><span>电脑还没有添加文件</span></li>';
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

loadStatus();
setInterval(loadShared, 3000);
```

- [ ] **Step 5: Commit pages and UI**

Run:

```powershell
git add src/app.js src/routes/pages.js src/public/styles.css src/public/console.js src/public/phone.js
git commit -m "feat: add browser transfer pages"
```

Expected: commit succeeds.

## Task 7: CLI Entrypoint And QR Generation

**Files:**
- Create: `src/index.js`

- [ ] **Step 1: Implement CLI startup**

Create `src/index.js`:

```js
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import QRCode from 'qrcode';
import { createApp } from './app.js';
import { createFileStore } from './file-store.js';
import { findAvailablePort, getPreferredLanAddress } from './network.js';
import { createSessionManager } from './session.js';

async function main() {
  const receiveDir = await askReceiveDir();
  const port = await findAvailablePort();
  const host = getPreferredLanAddress();
  const lanUrl = `http://${host}:${port}`;
  const session = createSessionManager();
  const current = session.getCurrent();
  const phoneUrl = `${lanUrl}/phone?key=${encodeURIComponent(current.key)}`;
  const qrDataUrl = await QRCode.toDataURL(phoneUrl, { margin: 1, width: 220 });
  const fileStore = createFileStore({ receiveDir });
  const app = createApp({ session, fileStore, lanUrl, qrDataUrl });
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(port, '0.0.0.0', resolve));

  console.log('');
  console.log('LAN File Transfer is running.');
  console.log(`Computer console: ${lanUrl}`);
  console.log(`Phone URL:        ${phoneUrl}`);
  console.log(`Receive folder:   ${receiveDir}`);
  console.log('');
  console.log('Keep this window open while transferring files. Press Ctrl+C to stop.');
}

async function askReceiveDir() {
  const argDir = process.argv[2];
  if (argDir) {
    return ensureDirectory(argDir);
  }

  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('Receive directory: ');
  rl.close();
  return ensureDirectory(answer);
}

async function ensureDirectory(dir) {
  const resolved = path.resolve(dir.trim());
  await fs.mkdir(resolved, { recursive: true });
  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`${resolved} is not a directory.`);
  }
  return resolved;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Run full tests**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 3: Smoke-run server with temp receive directory**

Run:

```powershell
npm start -- D:\Codex\temp\lan-file-transfer-receive
```

Expected: terminal prints computer console URL, phone URL, and receive folder. Stop with `Ctrl+C` after confirming startup.

- [ ] **Step 4: Commit startup**

Run:

```powershell
git add src/index.js
git commit -m "feat: add local transfer server startup"
```

Expected: commit succeeds.

## Task 8: Verification And Log

**Files:**
- Create: `D:\Codex\log\lan-file-transfer-mvp.md`

- [ ] **Step 1: Run automated verification**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Run git status**

Run: `git status --short`

Expected: no uncommitted project changes before creating the log, or only the log file if it has been created.

- [ ] **Step 3: Create workspace log**

Create `D:\Codex\log\lan-file-transfer-mvp.md`:

```markdown
# LAN File Transfer MVP

## Overview

Created an independent Windows-first LAN file transfer project at `D:\Codex\works\lan-file-transfer`.

## Execution Process

- Defined and committed the MVP design.
- Implemented a local Node.js transfer service.
- Added expiring QR access keys.
- Added duplicate-safe upload storage.
- Added explicit shared-file downloads.
- Added browser pages for the computer console and phone transfer page.
- Added automated tests for session, file store, and keyed API behavior.

## Key Results

- Phones on the same LAN or hotspot can use a browser to upload files to the computer.
- The computer can add specific files for phone download.
- Requests without a current access key are rejected.
- Refreshed or expired keys invalidate old links.

## Result Location

Project: `D:\Codex\works\lan-file-transfer`
Design: `D:\Codex\works\lan-file-transfer\docs\superpowers\specs\2026-06-05-lan-file-transfer-design.md`
Plan: `D:\Codex\works\lan-file-transfer\docs\superpowers\plans\2026-06-05-lan-file-transfer-mvp.md`
```

- [ ] **Step 4: Commit final docs**

Run:

```powershell
git add docs/superpowers/plans/2026-06-05-lan-file-transfer-mvp.md
git commit -m "docs: add MVP implementation plan"
```

Expected: project commit succeeds. The workspace log is outside the project repository and should remain untracked by the project git repo.

