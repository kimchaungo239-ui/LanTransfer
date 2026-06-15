# Release Guide

This guide describes the current manual release flow.

## 1. Verify

```powershell
npm test
```

## 2. Build Windows Portable Package

```powershell
npm run build:win
```

Current default output:

```text
D:\Codex\output\lan-file-transfer-portable\LanTransfer-Windows.zip
```

Override the portable output folder when needed:

```powershell
$env:LANTRANSFER_PORTABLE_OUTPUT="D:\Release\lan-transfer-portable"
npm run build:win
```

## 3. Build Download Page

```powershell
npm run build:site
```

Current default output:

```text
D:\Codex\output\lan-transfer-download-page
```

Override the site output folder when needed:

```powershell
$env:LANTRANSFER_SITE_OUTPUT="D:\Release\lan-transfer-site"
npm run build:site
```

## 4. Smoke Test

Run `LanTransfer.exe`, confirm it prints:

- Computer console URL
- Phone URL
- Receive folder

Open the computer console and check:

- QR code renders.
- Language and theme selectors work.
- Phone upload page opens from the QR URL.
- Receive folder picker button is present.

## 5. GitHub Release

Create a release such as `v0.1.0` and upload:

```text
LanTransfer-Windows.zip
```

Suggested release title:

```text
LanTransfer v0.1.0
```

Suggested release notes:

```markdown
Initial portable Windows release.

- Local LAN file transfer between Windows and phones
- Phone browser upload/download
- QR access key with refresh
- Native receive folder picker
- Chinese/English UI
- Light/dark/system theme
```

## 6. Publish Static Download Page

Upload the contents of:

```text
D:\Codex\output\lan-transfer-download-page
```

to a static host.

## Notes

- The portable zip includes `LanTransfer.ico` as the project icon asset.
- The current Node SEA build does not yet embed that icon directly into `LanTransfer.exe`.
