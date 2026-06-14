import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';

export function createApiRouter({ session, fileStore, lanUrl, qrDataUrl, pickReceiveDir, isLocalConsoleRequest = defaultIsLocalConsoleRequest }) {
  const router = express.Router();
  const canUseNativePicker = isLocalConsoleRequest || defaultIsLocalConsoleRequest;

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

  router.get('/console', async (_req, res) => {
    const current = session.getCurrent();
    const phoneUrl = buildPhoneUrl(lanUrl, current.key);
    res.json({
      lanUrl,
      phoneUrl,
      qrDataUrl: await buildQrDataUrl(phoneUrl, qrDataUrl),
      expiresAt: current.expiresAt,
      remainingMs: current.remainingMs,
      receiveDir: fileStore.receiveDir,
      sharedFiles: fileStore.listSharedFiles(),
      receivedFiles: fileStore.listReceivedFiles()
    });
  });

  router.post('/refresh-key', async (_req, res) => {
    const current = session.refresh();
    const phoneUrl = buildPhoneUrl(lanUrl, current.key);
    res.json({
      phoneUrl,
      qrDataUrl: await buildQrDataUrl(phoneUrl),
      expiresAt: current.expiresAt,
      remainingMs: current.remainingMs
    });
  });

  router.post('/receive-dir', async (req, res) => {
    try {
      const receiveDir = await fileStore.setReceiveDir(req.body.receiveDir);
      res.json({ receiveDir });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.post('/pick-receive-dir', requireLocalConsole(canUseNativePicker), async (_req, res) => {
    if (!pickReceiveDir) {
      res.status(501).json({ error: 'Native folder picker is not available.' });
      return;
    }
    try {
      const selectedDir = await pickReceiveDir(fileStore.receiveDir);
      if (!selectedDir) {
        res.status(400).json({ error: 'No folder selected.' });
        return;
      }
      const receiveDir = await fileStore.setReceiveDir(selectedDir);
      res.json({ receiveDir });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
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
    const files = (req.files || []).map((file) => fileStore.recordReceivedFile({
      name: file.filename,
      path: file.path,
      size: file.size
    }));
    res.json({ files });
  });

  router.post('/share-upload', upload.array('files'), async (req, res) => {
    try {
      const files = [];
      for (const file of req.files || []) {
        files.push(await fileStore.addSharedFile(file.path));
      }
      res.json({ files, sharedFiles: fileStore.listSharedFiles() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
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

function buildPhoneUrl(lanUrl, key) {
  return `${lanUrl}/phone?key=${encodeURIComponent(key)}`;
}

async function buildQrDataUrl(phoneUrl, fallback = '') {
  return QRCode.toDataURL(phoneUrl, { margin: 1, width: 220 }).catch(() => fallback);
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

function requireLocalConsole(isLocalConsoleRequest) {
  return (req, res, next) => {
    if (isLocalConsoleRequest(req)) {
      next();
      return;
    }
    res.status(403).json({ error: 'Native folder picker is only available from this computer.' });
  };
}

function defaultIsLocalConsoleRequest(req) {
  return isLocalAddress(req.socket.remoteAddress || '');
}

function isLocalAddress(address) {
  const normalizedAddress = address.startsWith('::ffff:') ? address.slice(7) : address;
  return address === '127.0.0.1'
    || address === '::1'
    || address === '::ffff:127.0.0.1'
    || address === 'localhost'
    || getLocalInterfaceAddresses().has(normalizedAddress);
}

function getLocalInterfaceAddresses() {
  const addresses = new Set();
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces || []) {
      addresses.add(item.address);
    }
  }
  return addresses;
}
