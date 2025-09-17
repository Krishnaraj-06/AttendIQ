# AttendIQ Local Development Setup Guide

## 🚀 Quick Start (FANG-Level Implementation)

This guide will help you run AttendIQ locally with full functionality including QR code scanning, real-time updates, and mobile access.

## Prerequisites

- **Node.js** (v16 or higher)
- **VS Code** with Live Server extension
- **Modern browser** (Chrome, Firefox, Safari, Edge)
- **Mobile device** for QR scanning (optional)

## Step 1: Backend Setup

1. **Install Dependencies**
   ```bash
   cd AttendIQ-1
   npm install
   ```

2. **Start Backend Server**
   ```bash
   npm start
   ```
   
   The server will start on `http://localhost:5000` and display:
   ```
   ✅ AttendIQ Server running on port 5000
   🌐 Environment: Local Development 💻
   📱 Mobile access: http://localhost:5000
   ```

## Step 2: Frontend Setup

1. **Open VS Code**
   ```bash
   code .
   ```

2. **Install Live Server Extension**
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "Live Server"
   - Install by Ritwick Dey

3. **Start Frontend**
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Frontend will open at `http://localhost:5500`

## Step 3: Test Login Credentials

### Faculty Login
- **Email:** `faculty@test.com`
- **Password:** `password123`

### Student Login
- **Email:** `alice@test.com` (or `bob@test.com`, `carol@test.com`, etc.)
- **Password:** `student123`

## Step 4: Test QR Code Flow

1. **Login as Faculty**
   - Go to `http://localhost:5500/login.html`
   - Select "Faculty" and login
   - Navigate to Faculty Dashboard

2. **Generate QR Code**
   - Click "Generate QR Code"
   - Enter subject name (e.g., "Computer Science")
   - Enter room (e.g., "Room 301")
   - QR code will be generated with 2-minute expiry

3. **Test QR Scanning**
   - **Option A (Desktop):** Right-click QR code → "Copy image" → Use online QR reader
   - **Option B (Mobile):** Scan QR code with phone camera
   - **Option C (Same Device):** Click the QR code to open check-in page directly

4. **Mark Attendance**
   - Login as student on the check-in page
   - Click "Mark My Attendance"
   - See real-time updates on faculty dashboard

## Step 5: Mobile Access

### For Mobile Testing:
1. **Find Your Computer's IP Address**
   ```bash
   # Windows
   ipconfig
   
   # Look for IPv4 Address (e.g., 192.168.1.100)
   ```

2. **Access from Mobile**
   - Backend: `http://[YOUR-IP]:5000`
   - Frontend: `http://[YOUR-IP]:5500`
   - Example: `http://192.168.1.100:5500`

3. **QR Code Scanning**
   - Generate QR on desktop
   - Scan with mobile camera
   - Complete check-in on mobile

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (Port 5500)   │◄──►│   (Port 5000)   │
│                 │    │                 │
│ • HTML/CSS/JS   │    │ • Express.js    │
│ • Live Server   │    │ • Socket.io     │
│ • Dynamic URLs  │    │ • SQLite DB     │
└─────────────────┘    └─────────────────┘
```

## Key Features Working Locally

✅ **Dynamic Environment Detection**
- Automatically detects local vs Replit environment
- Uses correct API URLs and ports

✅ **Real-time Updates**
- Socket.io connections work across different ports
- Live attendance updates on faculty dashboard

✅ **QR Code Generation & Scanning**
- QR codes contain correct local URLs
- Camera scanning works on localhost (HTTP)
- Mobile scanning fully functional

✅ **Database Persistence**
- SQLite database with real user credentials
- Attendance records stored permanently

✅ **CORS Handling**
- Proper CORS configuration for cross-port communication
- No hardcoded URLs anywhere in the codebase

## Troubleshooting

### Issue: Login Returns "Connection Error"
**Solution:** Ensure backend is running on port 5000
```bash
npm start
```

### Issue: QR Code Doesn't Work
**Solution:** Check that QR URL points to correct port
- Should contain `localhost:5500` for frontend
- Backend generates URLs dynamically

### Issue: Real-time Updates Not Working
**Solution:** Check socket.io connection
- Open browser console
- Should see "Connected to server" message

### Issue: Mobile Can't Access
**Solution:** Use computer's IP address instead of localhost
- Find IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Access via `http://[IP]:5500`

## Production Deployment

For production deployment to platforms like Netlify, Vercel, or Heroku:

1. **Environment Variables**
   ```bash
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-secure-secret
   ```

2. **Build Process**
   - No build step required
   - Static files served directly by Express

3. **Database**
   - SQLite works for small deployments
   - Consider PostgreSQL for production scale

## Security Notes

- JWT tokens expire in 24 hours
- Passwords are bcrypt hashed
- CORS configured for development
- Geolocation is optional for attendance

## Support

If you encounter issues:
1. Check console logs in browser (F12)
2. Check server logs in terminal
3. Verify all ports are available (5000, 5500)
4. Ensure no firewall blocking connections

---

**🎯 AttendIQ is now ready for local development with full production-grade functionality!**
