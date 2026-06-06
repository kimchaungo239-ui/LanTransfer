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
    <section class="hero-band">
      <div>
        <p class="eyebrow">LAN File Transfer</p>
        <h1>Local file transfer, no login required.</h1>
        <p class="muted">Keep both devices on the same Wi-Fi or phone hotspot. Files move through this local network.</p>
      </div>
      <ol class="steps">
        <li>Open this window on the computer.</li>
        <li>Scan the QR code with your phone.</li>
        <li>Send files in either direction.</li>
      </ol>
    </section>

    <section class="panel console-grid">
      <div>
        <h2>Connect phone</h2>
        <p class="muted">Scan the QR code or copy the URL into a phone browser.</p>
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

    <section class="two-column">
      <div class="panel">
        <h2>Send to phone</h2>
        <p class="muted">Choose files here. They appear on the phone as download links.</p>
        <form id="shareForm" class="upload-box">
          <input id="shareFiles" name="files" type="file" multiple>
          <button type="submit">Add for phone download</button>
        </form>
        <ul id="sharedFiles" class="file-list"></ul>
      </div>

      <div class="panel">
        <h2>Received from phone</h2>
        <p class="muted" id="receiveDir"></p>
        <ul id="receivedFiles" class="file-list"></ul>
      </div>
    </section>

    <section class="panel">
      <h2>Receive folder</h2>
      <p class="muted">Phone uploads are saved here. Paste a new folder path and apply it before uploading.</p>
      <form id="receiveDirForm" class="share-row">
        <input id="receiveDirInput" placeholder="Example: D:\\Downloads\\PhoneFiles">
        <button type="submit">Use this folder</button>
      </form>
      <p id="receiveDirMessage" class="status-line"></p>
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
    <section class="hero-band phone-hero">
      <div>
        <p class="eyebrow">Connected</p>
        <h1>File transfer</h1>
        <p id="status" class="muted">Checking connection...</p>
      </div>
    </section>

    <section class="panel">
      <h2>Send to computer</h2>
      <p class="muted">Selected files are saved to the computer receive folder.</p>
      <form id="uploadForm" class="upload-box">
        <input id="files" name="files" type="file" multiple>
        <button type="submit">Send to computer</button>
      </form>
      <ul id="uploadResults" class="file-list"></ul>
    </section>

    <section class="panel">
      <h2>Files from computer</h2>
      <p class="muted">Tap Download to save a file on this phone.</p>
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
