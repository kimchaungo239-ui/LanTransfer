const countdown = document.querySelector('#countdown');
const phoneUrl = document.querySelector('#phoneUrl');
const copyUrl = document.querySelector('#copyUrl');
const refreshKey = document.querySelector('#refreshKey');
const sharePath = document.querySelector('#sharePath');
const shareFile = document.querySelector('#shareFile');
const sharedFiles = document.querySelector('#sharedFiles');

let expiresAt = Number(document.body.dataset.expiresAt || 0);

copyUrl.addEventListener('click', async () => {
  await navigator.clipboard.writeText(phoneUrl.value);
  copyUrl.textContent = '已复制';
  setTimeout(() => {
    copyUrl.textContent = '复制地址';
  }, 1200);
});

refreshKey.addEventListener('click', async () => {
  const response = await fetch('/api/refresh-key', { method: 'POST' });
  const data = await response.json();
  phoneUrl.value = data.phoneUrl;
  expiresAt = data.expiresAt;
  window.location.reload();
});

shareFile.addEventListener('click', async () => {
  const filePath = sharePath.value.trim();
  if (!filePath) return;
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filePath })
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || '添加失败');
    return;
  }
  sharePath.value = '';
  renderShared(data.files);
});

async function loadConsole() {
  const response = await fetch('/api/console');
  const data = await response.json();
  renderShared(data.sharedFiles);
}

function renderShared(files) {
  sharedFiles.innerHTML = files.length
    ? files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('')
    : '<li><span>还没有添加文件</span></li>';
}

function tick() {
  const remaining = Math.max(0, expiresAt - Date.now());
  countdown.textContent = remaining > 0
    ? `二维码 ${Math.ceil(remaining / 1000)} 秒后失效`
    : '二维码已失效，请刷新';
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

loadConsole();
tick();
setInterval(tick, 1000);
