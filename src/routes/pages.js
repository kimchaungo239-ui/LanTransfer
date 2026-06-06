import express from 'express';
import QRCode from 'qrcode';

export function createPageRouter({ session, lanUrl, qrDataUrl }) {
  const router = express.Router();

  router.get('/', async (_req, res) => {
    const current = session.getCurrent();
    const phoneUrl = `${lanUrl}/phone?key=${encodeURIComponent(current.key)}`;
    const currentQrDataUrl = await QRCode.toDataURL(phoneUrl, { margin: 1, width: 220 }).catch(() => qrDataUrl);
    res.type('html').send(consolePage({ phoneUrl, qrDataUrl: currentQrDataUrl, expiresAt: current.expiresAt }));
  });

  router.get('/phone', (req, res) => {
    const key = String(req.query.key || '');
    res.type('html').send(phonePage({ key }));
  });

  return router;
}

function consolePage({ phoneUrl, qrDataUrl, expiresAt }) {
  return `<!doctype html>
<html lang="en">
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
        <h1>Scan to transfer</h1>
        <p class="muted">Keep your phone and this computer on the same Wi-Fi or phone hotspot.</p>
        <div class="field">
          <label>Phone URL</label>
          <input id="phoneUrl" value="${escapeHtml(phoneUrl)}" readonly>
        </div>
        <div class="actions">
          <button id="copyUrl">Copy URL</button>
          <button id="refreshKey">Refresh QR</button>
        </div>
      </div>
      <div class="qr-wrap">
        ${qrDataUrl ? `<img id="qrCode" src="${qrDataUrl}" alt="Phone QR code">` : '<div id="qrCode" class="qr-placeholder">QR</div>'}
        <p id="countdown" class="countdown"></p>
      </div>
    </section>

    <section class="panel">
      <h2>Send from computer to phone</h2>
      <form id="shareForm" class="upload-box">
        <input id="shareFiles" name="files" type="file" multiple>
        <button type="submit">Add for phone download</button>
      </form>
      <ul id="sharedFiles" class="file-list"></ul>
    </section>

    <section class="panel">
      <h2>Received from phone</h2>
      <p class="muted" id="receiveDir"></p>
      <ul id="receivedFiles" class="file-list"></ul>
    </section>
  </main>
  <script src="/public/console.js"></script>
</body>
</html>`;
}

function phonePage({ key }) {
  return `<!doctype html>
<html lang="en">
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
      <h1>File transfer</h1>
      <p id="status" class="muted">Checking connection...</p>
      <form id="uploadForm" class="upload-box">
        <input id="files" name="files" type="file" multiple>
        <button type="submit">Send to computer</button>
      </form>
      <ul id="uploadResults" class="file-list"></ul>
    </section>

    <section class="panel">
      <h2>Files from computer</h2>
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
