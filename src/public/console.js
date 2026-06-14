import { initPreferences, t } from './preferences.js';

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
const pickReceiveDir = document.querySelector('#pickReceiveDir');
const qrCode = document.querySelector('#qrCode');

let expiresAt = Number(document.body.dataset.expiresAt || 0);
let currentReceiveDir = '';
let currentSharedFiles = [];
let currentReceivedFiles = [];

initPreferences({ onLanguageChange: () => {
  renderConsoleText();
  tick();
} });

copyUrl.addEventListener('click', async () => {
  await navigator.clipboard.writeText(phoneUrl.value);
  copyUrl.textContent = t('console.copied');
  setTimeout(() => {
    copyUrl.textContent = t('console.copyUrl');
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
    alert(data.error || t('console.addFilesFailed'));
    return;
  }
  shareFilesInput.value = '';
  renderShared(data.sharedFiles);
});

receiveDirForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const nextDir = receiveDirInput.value.trim();
  if (!nextDir || nextDir === currentReceiveDir) return;

  await updateReceiveDir('/api/receive-dir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ receiveDir: nextDir })
  });
});

pickReceiveDir.addEventListener('click', async () => {
  pickReceiveDir.disabled = true;
  await updateReceiveDir('/api/pick-receive-dir', { method: 'POST' });
  pickReceiveDir.disabled = false;
});

async function updateReceiveDir(url, options) {
  receiveDirMessage.textContent = t('console.updatingFolder');
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    receiveDirMessage.textContent = data.error || t('console.folderFailed');
    return false;
  }
  currentReceiveDir = data.receiveDir;
  receiveDirInput.value = currentReceiveDir;
  receiveDir.textContent = t('console.savedTo', { path: currentReceiveDir });
  receiveDirMessage.textContent = t('console.folderUpdated');
  return true;
}

async function loadConsole() {
  const response = await fetch('/api/console');
  const data = await response.json();
  currentReceiveDir = data.receiveDir;
  receiveDir.textContent = t('console.savedTo', { path: data.receiveDir });
  if (document.activeElement !== receiveDirInput) {
    receiveDirInput.value = data.receiveDir;
  }
  renderShared(data.sharedFiles);
  renderReceived(data.receivedFiles);
}

function renderShared(files) {
  currentSharedFiles = files;
  sharedFiles.innerHTML = files.length
    ? files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('')
    : `<li><span>${escapeHtml(t('console.noShared'))}</span></li>`;
}

function renderReceived(files) {
  currentReceivedFiles = files;
  receivedFiles.innerHTML = files.length
    ? files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('')
    : `<li><span>${escapeHtml(t('console.noReceived'))}</span></li>`;
}

function tick() {
  const remaining = Math.max(0, expiresAt - Date.now());
  countdown.textContent = remaining > 0
    ? t('console.qrExpires', { seconds: Math.ceil(remaining / 1000) })
    : t('console.qrExpired');
}

function renderConsoleText() {
  if (currentReceiveDir) {
    receiveDir.textContent = t('console.savedTo', { path: currentReceiveDir });
  }
  copyUrl.textContent = t('console.copyUrl');
  renderShared(currentSharedFiles);
  renderReceived(currentReceivedFiles);
  loadConsole();
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
