# LAN File Transfer

Windows-first local file transfer MVP. The computer runs a temporary local web service, shows a QR code, and phones on the same Wi-Fi or hotspot use a browser to upload/download files.

## Run

```powershell
npm install
npm start
```

The app asks for a receive directory. After startup, open the computer console URL shown in the terminal and scan the QR code with a phone on the same network.

## Scope

- No login.
- No public domain.
- No cloud relay.
- Files stay on the local network.
- Phone side uses standard mobile browser upload/download behavior.
