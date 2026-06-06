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
