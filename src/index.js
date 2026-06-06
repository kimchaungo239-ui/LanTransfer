import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';
import { createApp } from './app.js';
import { createFileStore } from './file-store.js';
import { findAvailablePort, getPreferredLanAddress } from './network.js';
import { createSessionManager } from './session.js';

async function main() {
  const receiveDir = await resolveReceiveDir();
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

  openBrowser(lanUrl);
}

async function resolveReceiveDir() {
  const argDir = process.argv[2];
  const target = argDir || path.join(os.homedir(), 'Downloads', 'LanTransfer-Receive');
  return ensureDirectory(target);
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

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = execFile(command, args, { windowsHide: true }, () => {});
  child.unref();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
