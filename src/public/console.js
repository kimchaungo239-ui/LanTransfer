const countdown = document.querySelector('#countdown');
const phoneUrl = document.querySelector('#phoneUrl');
const copyUrl = document.querySelector('#copyUrl');
const refreshKey = document.querySelector('#refreshKey');
const shareForm = document.querySelector('#shareForm');
const shareFilesInput = document.querySelector('#shareFiles');
const sharedFiles = document.querySelector('#sharedFiles');
const receivedFiles = document.querySelector('#receivedFiles');
const receiveDir = document.querySelector('#receiveDir');
const receiveDirForm = document.querySelector('#receiveDirForm');
const receiveDirInput = document.querySelector('#receiveDirInput');
const receiveDirMessage = document.querySelector('#receiveDirMessage');
const qrCode = document.querySelector('#qrCode');

let expiresAt = Number(document.body.dataset.expiresAt || 0);
let currentReceiveDir = '';

copyUrl.addEventListener('click', async () => {
  await navigator.clipboard.writeText(phoneUrl.value);
  copyUrl.textContent = 'Copied';
  setTimeout(() => {
    copyUrl.textContent = 'Copy URL';
  }, 1200);
});

refreshKey.addEventListener('click', async () => {
  const response = await fetch('/api/refresh-key', { method: 'POST' });
  const data = await response.json();
  phoneUrl.value = data.phoneUrl;
  if (data.qrDataUrl && qrCode.tagName === 'IMG') {
    qrCode.src = data.qrDataUrl;
  }
  expiresAt = data.expiresAt;
});

shareForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!shareFilesInput.files.length) return;

  const form = new FormData();
  for (const file of shareFilesInput.files) {
    form.append('files', file);
  }

  const response = await fetch('/api/share-upload', {
    method: 'POST',
    body: form
  });
  const data = await response.json();
  if (!response.ok) {
    alert(data.error || 'Failed to add files');
    return;
  }
  shareFilesInput.value = '';
  renderShared(data.sharedFiles);
});

receiveDirForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const nextDir = receiveDirInput.value.trim();
  if (!nextDir || nextDir === currentReceiveDir) return;

  receiveDirMessage.textContent = 'Updating receive folder...';
  const response = await fetch('/api/receive-dir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiveDir: nextDir })
  });
  const data = await response.json();
  if (!response.ok) {
    receiveDirMessage.textContent = data.error || 'Failed to update receive folder.';
    return;
  }
  currentReceiveDir = data.receiveDir;
  receiveDirInput.value = currentReceiveDir;
  receiveDir.textContent = `Saved to: ${currentReceiveDir}`;
  receiveDirMessage.textContent = 'Receive folder updated.';
});

async function loadConsole() {
  const response = await fetch('/api/console');
  const data = await response.json();
  currentReceiveDir = data.receiveDir;
  receiveDir.textContent = `Saved to: ${data.receiveDir}`;
  if (document.activeElement !== receiveDirInput) {
    receiveDirInput.value = data.receiveDir;
  }
  renderShared(data.sharedFiles);
  renderReceived(data.receivedFiles);
}

function renderShared(files) {
  sharedFiles.innerHTML = files.length
    ? files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('')
    : '<li><span>No files added yet</span></li>';
}

function renderReceived(files) {
  receivedFiles.innerHTML = files.length
    ? files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('')
    : '<li><span>No files received yet</span></li>';
}

function tick() {
  const remaining = Math.max(0, expiresAt - Date.now());
  countdown.textContent = remaining > 0
    ? `QR expires in ${Math.ceil(remaining / 1000)}s`
    : 'QR expired. Refresh it.';
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
setInterval(loadConsole, 2000);
