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
