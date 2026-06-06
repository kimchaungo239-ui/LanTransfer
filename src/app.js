import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiRouter } from './routes/api.js';
import { createPageRouter } from './routes/pages.js';

export function createApp({ session, fileStore, lanUrl, qrDataUrl = '' }) {
  const app = express();
  app.use(express.json());
  app.use('/public', express.static(getPublicDir()));
  app.use('/api', createApiRouter({ session, fileStore, lanUrl, qrDataUrl }));
  app.use('/', createPageRouter({ session, lanUrl, qrDataUrl }));
  return app;
}

function getPublicDir() {
  const executablePublicDir = path.join(path.dirname(process.execPath), 'public');
  if (fs.existsSync(path.join(executablePublicDir, 'styles.css'))) {
    return executablePublicDir;
  }
  return path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
}
