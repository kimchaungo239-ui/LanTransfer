const key = document.body.dataset.key;
const statusEl = document.querySelector('#status');
const uploadForm = document.querySelector('#uploadForm');
const filesInput = document.querySelector('#files');
const uploadResults = document.querySelector('#uploadResults');
const sharedFiles = document.querySelector('#sharedFiles');

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData();
  for (const file of filesInput.files) {
    form.append('files', file);
  }
  if (!filesInput.files.length) return;

  statusEl.textContent = 'Uploading...';
  const response = await fetch(`/api/upload?key=${encodeURIComponent(key)}`, { method: 'POST', body: form });
  const data = await response.json();
  if (!response.ok) {
    statusEl.textContent = data.error || 'Upload failed. Try again.';
    return;
  }
  statusEl.textContent = 'Upload complete';
  uploadResults.innerHTML = data.files.map((file) => `<li><span>${escapeHtml(file.name)}</span><span>${formatSize(file.size)}</span></li>`).join('');
  filesInput.value = '';
});

async function loadStatus() {
  const response = await fetch(`/api/status?key=${encodeURIComponent(key)}`);
  if (!response.ok) {
    statusEl.textContent = 'QR expired. Refresh it on the computer and scan again.';
    uploadForm.hidden = true;
    return;
  }
  statusEl.textContent = 'Connected. Ready to transfer.';
  uploadForm.hidden = false;
  await loadShared();
}

async function loadShared() {
  const response = await fetch(`/api/shared?key=${encodeURIComponent(key)}`);
  if (!response.ok) return;
  const data = await response.json();
  sharedFiles.innerHTML = data.files.length
    ? data.files.map((file) => `<li><span>${escapeHtml(file.name)}</span><a href="/api/download/${file.id}?key=${encodeURIComponent(key)}">Download</a></li>`).join('')
    : '<li><span>No files from computer yet</span></li>';
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

loadStatus();
setInterval(loadShared, 3000);
