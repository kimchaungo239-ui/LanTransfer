# Windows Portable Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package the LAN File Transfer MVP as a Windows portable release so users can run an `.exe` without source files, Node.js, npm, or developer commands.

**Architecture:** Keep the existing Node/Express app and add a packaging layer with `@yao-pkg/pkg`. Adjust startup behavior so the executable uses a sensible default receive folder, opens the computer console in the default browser, and still supports an explicit receive directory argument for verification.

**Tech Stack:** Node.js, Express, `@yao-pkg/pkg`, PowerShell release script, Windows zip packaging.

---

## File Structure

- `package.json`: add package assets, bin entry, and `build:win` script.
- `src/index.js`: default receive directory and browser auto-open.
- `scripts/build-portable.ps1`: build exe, create Chinese usage guide, zip release.
- `docs/superpowers/specs/2026-06-05-lan-file-transfer-design.md`: portable release scope.
- `docs/superpowers/plans/2026-06-06-windows-portable-release.md`: this plan.
- `D:\Codex\output\lan-file-transfer-portable`: final release output folder.

## Task 1: Startup Behavior

**Files:**
- Modify: `src/index.js`

- [ ] **Step 1: Update startup behavior**

Modify `src/index.js` so no-argument startup uses `%USERPROFILE%\Downloads\LanTransfer-Receive`, and successful startup opens the computer console URL:

```js
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import QRCode from 'qrcode';
import { createApp } from './app.js';
import { createFileStore } from './file-store.js';
import { findAvailablePort, getPreferredLanAddress } from './network.js';
import { createSessionManager } from './session.js';

async function main() {
  const receiveDir = await resolveReceiveDir();
  const port = await findAvailablePort();
  const host = getPreferredLanAddress();
  const lanUrl = `http://${host}:${port}`;
  const session = createSessionManager();
  const current = session.getCurrent();
  const phoneUrl = `${lanUrl}/phone?key=${encodeURIComponent(current.key)}`;
  const qrDataUrl = await QRCode.toDataURL(phoneUrl, { margin: 1, width: 220 });
  const fileStore = createFileStore({ receiveDir });
  const app = createApp({ session, fileStore, lanUrl, qrDataUrl });
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(port, '0.0.0.0', resolve));

  console.log('');
  console.log('LAN File Transfer is running.');
  console.log(`Computer console: ${lanUrl}`);
  console.log(`Phone URL:        ${phoneUrl}`);
  console.log(`Receive folder:   ${receiveDir}`);
  console.log('');
  console.log('Keep this window open while transferring files. Press Ctrl+C to stop.');

  openBrowser(lanUrl);
}

async function resolveReceiveDir() {
  const argDir = process.argv[2];
  const target = argDir || path.join(os.homedir(), 'Downloads', 'LanTransfer-Receive');
  return ensureDirectory(target);
}

async function ensureDirectory(dir) {
  const resolved = path.resolve(dir.trim());
  await fs.mkdir(resolved, { recursive: true });
  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`${resolved} is not a directory.`);
  }
  return resolved;
}

function openBrowser(url) {
  const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = execFile(command, args, { windowsHide: true }, () => {});
  child.unref();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Run tests**

Run: `npm.cmd test`

Expected: 8 tests pass.

- [ ] **Step 3: Smoke-run startup**

Run a short PowerShell job with `node src/index.js D:\Codex\temp\lan-file-transfer-receive`.

Expected: output includes `Computer console:`, `Phone URL:`, and `Receive folder:`.

## Task 2: Packaging Script

**Files:**
- Modify: `package.json`
- Create: `scripts/build-portable.ps1`

- [ ] **Step 1: Install packager**

Run: `npm.cmd install --save-dev @yao-pkg/pkg`

Expected: `package.json` and `package-lock.json` include `@yao-pkg/pkg`.

- [ ] **Step 2: Update package metadata**

Modify `package.json` to include:

```json
{
  "bin": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "node --test",
    "build:win": "powershell -ExecutionPolicy Bypass -File scripts/build-portable.ps1"
  },
  "pkg": {
    "assets": [
      "src/public/**/*"
    ],
    "targets": [
      "node24-win-x64"
    ],
    "outputPath": "dist"
  }
}
```

- [ ] **Step 3: Create release script**

Create `scripts/build-portable.ps1`:

```powershell
$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $projectRoot "dist"
$outputDir = "D:\Codex\output\lan-file-transfer-portable"
$releaseDir = Join-Path $outputDir "LanTransfer-Windows"
$exeSource = Join-Path $distDir "lan-file-transfer.exe"
$exeTarget = Join-Path $releaseDir "LanTransfer.exe"
$guidePath = Join-Path $releaseDir "使用说明.txt"
$zipPath = Join-Path $outputDir "LanTransfer-Windows.zip"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

npx.cmd --yes @yao-pkg/pkg . --targets node24-win-x64 --output $exeSource

Copy-Item -LiteralPath $exeSource -Destination $exeTarget -Force

@"
LanTransfer 使用说明

1. 双击 LanTransfer.exe。
2. 如果 Windows 防火墙提示，请允许局域网访问。
3. 程序会自动打开电脑浏览器控制台。
4. 手机和电脑连接同一个 Wi-Fi 或手机热点。
5. 手机扫描电脑页面二维码，即可上传文件到电脑。
6. 默认接收目录是当前用户 Downloads\LanTransfer-Receive。
7. 如果要指定接收目录，可以在命令行运行：
   LanTransfer.exe D:\你的接收目录
8. 传输时请保持 LanTransfer.exe 窗口打开。
"@ | Set-Content -LiteralPath $guidePath -Encoding UTF8

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $releaseDir -DestinationPath $zipPath -Force

Write-Output "Release folder: $releaseDir"
Write-Output "Release zip: $zipPath"
```

- [ ] **Step 4: Build portable release**

Run: `npm.cmd run build:win`

Expected:

- `D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows\LanTransfer.exe`
- `D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows\README.txt`
- `D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows.zip`

## Task 3: Verification And Commit

**Files:**
- Modify: `D:\Codex\log\lan-file-transfer-mvp.md`

- [ ] **Step 1: Run tests**

Run: `npm.cmd test`

Expected: 8 tests pass.

- [ ] **Step 2: Smoke-run packaged exe**

Run a short PowerShell job against `D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows\LanTransfer.exe D:\Codex\temp\lan-file-transfer-exe-receive`.

Expected: output includes `Computer console:`, `Phone URL:`, and `Receive folder:`.

- [ ] **Step 3: Update log**

Append to `D:\Codex\log\lan-file-transfer-mvp.md`:

```markdown

## Portable Release

- Added a Windows portable `.exe` build.
- Release folder: `D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows`
- Release zip: `D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows.zip`
- Packaged executable smoke run succeeded.
```

- [ ] **Step 4: Commit project changes**

Run:

```powershell
git add package.json package-lock.json src/index.js scripts/build-portable.ps1 docs/superpowers/specs/2026-06-05-lan-file-transfer-design.md docs/superpowers/plans/2026-06-06-windows-portable-release.md
git commit -m "feat: add Windows portable release"
```

Expected: commit succeeds.
