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
