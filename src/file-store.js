import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export function createFileStore({ receiveDir }) {
  const shared = new Map();
  const received = [];
  const reservedUploads = new Set();
  let currentReceiveDir = receiveDir;

  async function reserveUploadPath(originalName) {
    const parsed = path.parse(normalizeUploadName(originalName));
    const base = parsed.name || 'file';
    const ext = parsed.ext || '';
    let index = 0;

    while (true) {
      const name = index === 0 ? `${base}${ext}` : `${base} (${index})${ext}`;
      const fullPath = path.join(currentReceiveDir, name);
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

  function recordReceivedFile(file) {
    const entry = {
      id: crypto.randomUUID(),
      name: file.name,
      path: file.path,
      size: file.size,
      receivedAt: Date.now()
    };
    received.unshift(entry);
    return { id: entry.id, name: entry.name, size: entry.size, receivedAt: entry.receivedAt };
  }

  function listReceivedFiles() {
    return received.map(({ id, name, size, receivedAt }) => ({ id, name, size, receivedAt }));
  }

  async function setReceiveDir(nextReceiveDir) {
    const resolved = path.resolve(String(nextReceiveDir || '').trim());
    await fs.mkdir(resolved, { recursive: true });
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) {
      throw new Error(`${resolved} is not a directory.`);
    }
    currentReceiveDir = resolved;
    reservedUploads.clear();
    return currentReceiveDir;
  }

  function getSharedFile(id) {
    return shared.get(id) || null;
  }

  return {
    get receiveDir() {
      return currentReceiveDir;
    },
    reserveUploadPath,
    setReceiveDir,
    addSharedFile,
    listSharedFiles,
    recordReceivedFile,
    listReceivedFiles,
    getSharedFile
  };
}

export function normalizeUploadName(originalName) {
  const safeName = path.basename(originalName || 'file');
  const repaired = Buffer.from(safeName, 'latin1').toString('utf8');
  return repaired.includes('\uFFFD') ? safeName : repaired;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
