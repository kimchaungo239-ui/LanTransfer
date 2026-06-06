import express from 'express';

export function createPageRouter({ session, lanUrl, qrDataUrl }) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    const current = session.getCurrent();
    const phoneUrl = `${lanUrl}/phone?key=${encodeURIComponent(current.key)}`;
    res.type('html').send(consolePage({ phoneUrl, qrDataUrl, expiresAt: current.expiresAt }));
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
  <title>LAN File Transfer</title>
  <link rel="stylesheet" href="/public/styles.css">
</head>
<body data-expires-at="${expiresAt}">
  <main class="shell">
    <section class="panel console-grid">
      <div>
        <p class="eyebrow">LAN File Transfer</p>
        <h1>扫码传文件</h1>
        <p class="muted">让手机和这台电脑保持在同一个 Wi-Fi 或热点下。</p>
        <div class="field">
          <label>手机访问地址</label>
          <input id="phoneUrl" value="${escapeHtml(phoneUrl)}" readonly>
        </div>
        <div class="actions">
          <button id="copyUrl">复制地址</button>
          <button id="refreshKey">刷新二维码</button>
        </div>
      </div>
      <div class="qr-wrap">
        ${qrDataUrl ? `<img id="qrCode" src="${qrDataUrl}" alt="Phone QR code">` : '<div id="qrCode" class="qr-placeholder">QR</div>'}
        <p id="countdown" class="countdown"></p>
      </div>
    </section>

    <section class="panel">
      <h2>电脑发给手机</h2>
      <div class="share-row">
        <input id="sharePath" placeholder="粘贴要分享的本机文件完整路径">
        <button id="shareFile">添加</button>
      </div>
      <ul id="sharedFiles" class="file-list"></ul>
    </section>
  </main>
  <script src="/public/console.js"></script>
</body>
</html>`;
}

function phonePage({ key }) {
  return `<!doctype html>
<html lang="zh-CN">
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
      <h1>文件传输</h1>
      <p id="status" class="muted">正在检查连接...</p>
      <form id="uploadForm" class="upload-box">
        <input id="files" name="files" type="file" multiple>
        <button type="submit">发送到电脑</button>
      </form>
      <ul id="uploadResults" class="file-list"></ul>
    </section>

    <section class="panel">
      <h2>电脑发来的文件</h2>
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
