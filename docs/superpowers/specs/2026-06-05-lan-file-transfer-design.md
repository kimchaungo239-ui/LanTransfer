# LAN File Transfer MVP Design

## Overview

Build a Windows-first local file transfer tool for moving files between a computer and nearby phones without login, data cables, WeChat, cloud drives, or a public domain. The MVP runs a temporary web service on the Windows computer. Phones on the same Wi-Fi or phone hotspot scan a QR code and use a browser page to upload files to the computer or download files the computer has explicitly shared.

The product is local-network first. Files stay inside the current LAN or hotspot network. There is no account system, no cloud storage, no cross-network relay, and no public website requirement in the MVP.

## Target Users And Devices

The first version prioritizes Windows users who need a safer, lighter alternative to logging into messaging or cloud software just to transfer files. The phone side should work in ordinary modern mobile browsers, including Android and iPhone browsers, using standard upload and download flows.

## MVP Scope

Included:

- Windows computer starts a local transfer service.
- User selects a receive directory at startup.
- Computer page shows the local URL, QR code, access-key countdown, refresh action, connected device status, transfer records, and shared-file controls.
- Phone scans the QR code and opens a mobile browser transfer page.
- Phone uploads one or more files to the selected receive directory.
- Computer adds files to a per-session shared list.
- Phone downloads files from the shared list.
- QR code contains a one-time access key.
- Access key expires after a default 10 minutes.
- User can manually refresh the QR code and invalidate the old key.
- Closing the tool stops the service and invalidates the session.
- Duplicate upload names are preserved by appending a suffix instead of overwriting existing files.

Excluded:

- User accounts.
- Public domain, public server, or cloud relay.
- Cross-network transfer.
- Automatic folder sharing.
- Persistent transfer history beyond the running session.
- Native mobile apps.
- Full Windows desktop packaging in the first implementation plan, unless later chosen as a packaging step.

## Architecture

The MVP uses a Windows-local web service. The computer opens an HTTP server bound to the local network interface and an available port. The service exposes two browser interfaces:

- Computer console: local control page for setup, QR display, sharing files, and monitoring transfers.
- Phone transfer page: mobile-friendly upload/download page gated by a valid access key.

Recommended stack: Node.js with Express for the local service and a small browser UI. This keeps the backend and frontend in one JavaScript or TypeScript codebase and leaves a straightforward path toward future desktop packaging.

## Data Flow

Startup:

1. User launches the tool on Windows.
2. Tool asks the user to choose a receive directory.
3. Tool selects an available port and discovers a LAN address.
4. Tool creates a one-time access key with a 10-minute expiry.
5. Computer console displays a QR code containing the phone URL and key.

Phone to computer:

1. Phone scans QR code and opens the keyed URL.
2. Server validates the key and expiry.
3. Phone selects one or more files in the browser.
4. Server streams uploads into the chosen receive directory.
5. If a filename already exists, server writes a non-overwriting suffixed filename.
6. Computer console records success or failure.

Computer to phone:

1. User adds files to the current session's shared-file list from the computer console.
2. Phone page lists those files after key validation.
3. Phone taps a file and downloads it from the local service.
4. Server only serves files explicitly added to the session list.

Key refresh:

1. User clicks refresh on the computer console.
2. Server invalidates the old key immediately.
3. Server creates a new key and QR code.
4. Existing phone pages using the old key can no longer upload, list, or download files.

## Security Model

The MVP protects against casual local-network discovery and accidental access. It is not a hardened zero-trust file server.

- The phone URL must include the current access key.
- Requests without a valid unexpired key are rejected.
- QR codes expire after 10 minutes by default.
- Manual refresh invalidates older links immediately.
- The phone cannot browse the computer filesystem.
- Uploads are restricted to the chosen receive directory.
- Downloads are restricted to files explicitly added to the session shared list.
- Closing the service invalidates all access.
- No original source files from the workspace `input/` folder are used or modified by this project.

## Error Handling

The MVP should provide clear messages for:

- Phone cannot reach the computer because devices are not on the same network.
- QR code or access key has expired.
- Upload failed and can be retried.
- Download failed or shared file is no longer available.
- Disk write failed or receive directory is unavailable.
- Filename already exists and was saved with a suffix.
- Port is unavailable, with automatic retry on another port where practical.
- Windows firewall or network policy may be blocking LAN access.

## UI Direction

The computer console should be quiet and utilitarian: receive directory, QR code, countdown, refresh button, connection status, shared-file controls, and transfer log should be visible without a marketing-style landing page.

The phone page should be compact and task-focused:

- Connection label.
- Upload button or drop area.
- Upload progress and results.
- Shared files list with download actions.
- Expiry or reconnect message when the key is invalid.

## Testing Scope

Manual and automated checks should cover:

- Service starts on Windows.
- Receive directory is selected before transfer.
- QR URL includes an access key.
- Phone browser can open the page on the same Wi-Fi or hotspot.
- Android and iPhone browser flows use standard file upload/download behavior.
- Single and multiple file uploads succeed.
- Computer-added files can be downloaded by phone.
- Requests without a key fail.
- Expired keys fail.
- Refreshed old keys fail.
- Duplicate upload filenames do not overwrite existing files.
- Service shutdown prevents further access.
- Port conflict handling works or reports clearly.

## Future Extensions

Possible later work:

- Windows desktop wrapper with tray behavior.
- Pure web pairing mode with optional public signaling service.
- Cross-network relay with explicit consent and size limits.
- Transfer resume for large files.
- Local HTTPS support for stricter browser features.
- Multi-device room support.
- Persistent trusted device pairing.

