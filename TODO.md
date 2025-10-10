# TODO: Enable Cross-Network QR Functionality

## Steps to Complete
- [x] Read checkin.html to understand QR scanning and API call logic
- [x] Edit server.js: Add 'serverUrl' to qrData in /api/faculty/generate-qr endpoint (use localIP in dev, REPLIT_DEV_DOMAIN in prod)
- [x] Edit checkin.html: Update API base URL to use qrData.serverUrl instead of hardcoded localhost
- [x] Restart server to apply changes
- [x] Test: Generate QR with serverUrl, scan from same/different network, verify attendance mark works
