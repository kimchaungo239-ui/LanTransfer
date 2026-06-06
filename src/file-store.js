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
