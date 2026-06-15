# Changelog

All notable changes to LanTransfer will be documented in this file.

## 0.1.0 - 2026-06-14

### Added

- Windows portable build using Node SEA.
- Local computer console with QR code access.
- Phone browser page for uploading files to the computer.
- Computer file selection flow for sharing files to the phone.
- Expiring QR access key with manual refresh.
- Receive folder customization with manual path entry.
- Native Windows receive-folder picker.
- Received-file list on the computer console.
- Common Chinese filename mojibake repair for browser uploads.
- Chinese and English UI.
- Light, dark, and system theme preferences.
- Static download page.
- Project icon for GitHub and portable package assets.

### Security

- Requests without the current access key are rejected.
- Refreshing the QR code invalidates old phone links.
- Native folder picker API is restricted to local computer requests.

### Known limitations

- The portable package currently includes `LanTransfer.exe`, `LanTransfer.ico`, and `public` assets.
- No transfer resume for very large files yet.
- No code signing yet.
