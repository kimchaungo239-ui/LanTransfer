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
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LanTransfer</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body data-expires-at="${expiresAt}">
  <main class="shell">
    <section class="hero-band app-hero">
      <div>
        <p class="eyebrow">LanTransfer</p>
        <h1 data-i18n="console.heroTitle"></h1>
        <p class="muted" data-i18n="console.heroText"></p>
      </div>
      <div class="hero-side">
        <div id="preferences" class="preferences"></div>
        <ol class="steps">
          <li data-i18n="console.stepKeepOpen"></li>
          <li data-i18n="console.stepScan"></li>
          <li data-i18n="console.stepTransfer"></li>
        </ol>
      </div>
    </section>

    <section class="panel console-grid">
      <div>
        <h2 data-i18n="console.connectTitle"></h2>
        <p class="muted" data-i18n="console.connectText"></p>
        <div class="field">
          <label data-i18n="console.phoneUrl"></label>
          <input id="phoneUrl" value="${escapeHtml(phoneUrl)}" readonly>
        </div>
        <div class="actions">
          <button id="copyUrl" data-i18n="console.copyUrl"></button>
          <button id="refreshKey" class="secondary" data-i18n="console.refreshQr"></button>
        </div>
      </div>
      <div class="qr-wrap">
        ${qrDataUrl ? `<img id="qrCode" src="${qrDataUrl}" alt="Phone QR code">` : '<div id="qrCode" class="qr-placeholder">QR</div>'}
        <p id="countdown" class="countdown"></p>
      </div>
    </section>

    <section class="two-column">
      <div class="panel">
        <h2 data-i18n="console.shareTitle"></h2>
        <p class="muted" data-i18n="console.shareText"></p>
        <form id="shareForm" class="upload-box">
          <input id="shareFiles" name="files" type="file" multiple>
          <button type="submit" data-i18n="console.addForPhone"></button>
        </form>
        <ul id="sharedFiles" class="file-list"></ul>
      </div>

      <div class="panel">
        <h2 data-i18n="console.receivedTitle"></h2>
        <p class="muted" id="receiveDir"></p>
        <ul id="receivedFiles" class="file-list"></ul>
      </div>
    </section>

    <section class="panel">
      <h2 data-i18n="console.receiveFolderTitle"></h2>
      <p class="muted" data-i18n="console.receiveFolderText"></p>
      <div class="actions">
        <button id="pickReceiveDir" type="button" data-i18n="console.chooseFolder"></button>
      </div>
      <form id="receiveDirForm" class="share-row">
        <input id="receiveDirInput" placeholder="Example: D:\\Downloads\\PhoneFiles">
        <button type="submit" data-i18n="console.useFolder"></button>
      </form>
      <p id="receiveDirMessage" class="status-line"></p>
    </section>
  </main>
  <script type="module" src="/public/console.js"></script>
</body>
</html>`;
}

function phonePage({ key }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LanTransfer</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body data-key="${escapeHtml(key)}">
  <main class="shell phone-shell">
    <section class="hero-band phone-hero">
      <div id="preferences" class="preferences phone-preferences"></div>
      <div>
        <p class="eyebrow">LanTransfer</p>
        <h1 data-i18n="phone.heroTitle"></h1>
        <p id="status" class="muted" data-i18n="phone.checking"></p>
      </div>
    </section>

    <section class="panel">
      <h2 data-i18n="phone.sendTitle"></h2>
      <p class="muted" data-i18n="phone.sendText"></p>
      <form id="uploadForm" class="upload-box">
        <input id="files" name="files" type="file" multiple>
        <button type="submit" data-i18n="phone.sendButton"></button>
      </form>
      <ul id="uploadResults" class="file-list"></ul>
    </section>

    <section class="panel">
      <h2 data-i18n="phone.filesTitle"></h2>
      <p class="muted" data-i18n="phone.filesText"></p>
      <ul id="sharedFiles" class="file-list"></ul>
    </section>
  </main>
  <script type="module" src="/public/phone.js"></script>
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
