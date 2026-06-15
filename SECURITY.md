# Security Policy

## Supported Versions

LanTransfer is currently pre-1.0. Security fixes target the latest `master` branch and the latest public release.

## Reporting a Vulnerability

If you find a security issue, please avoid posting exploit details in a public issue first.

For now, open a GitHub issue with a high-level description and mark it clearly as a security report. If this project later publishes a dedicated security contact, this file should be updated.

## Security Model

LanTransfer is intended for trusted local networks:

- The computer starts a local HTTP service.
- Phones connect through a QR code containing a temporary key.
- Refreshing the QR invalidates previous links.
- Files are transferred through the local network, not through a cloud relay operated by this project.

Anyone who can reach the computer on the LAN and has the active QR/link can upload files while the key is valid. Stop the tool or refresh the QR code when a session is finished.

## Not Yet Covered

- Code signing.
- End-to-end encryption beyond local HTTP transport.
- Automatic malware scanning of uploaded files.
- Transfer resume validation for interrupted large files.
