# 🚀 AttendIQ - Local VS Code Setup Guide

## 📋 Quick Setup for VS Code

### 1. **Download & Extract**
- Download the ZIP file from Replit
- Extract to your desired folder
- Open folder in VS Code

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Start Backend Server**
```bash
npm start
```
This starts the Node.js server on **port 5000**

### 4. **Frontend Options**

#### Option A: Live Server Extension (Recommended)
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html` 
3. Select "Open with Live Server"
4. This runs frontend on **port 5500**

#### Option B: Direct File Access
- Open `login.html` directly in browser: `http://localhost:5000/login.html`

### 5. **Test Login Credentials**
- **Faculty:** `faculty@test.com` / `password123`  
- **Student:** `alice@test.com` / `student123`

## 🔧 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | `http://localhost:5000` |
| Frontend (Live Server) | 5500 | `http://localhost:5500` |
| Direct Frontend | 5000 | `http://localhost:5000/login.html` |

## 📱 Mobile Testing

For mobile phone testing:
1. Find your computer's IP address
2. Use: `http://[YOUR-IP]:5000/login.html`
3. Example: `http://192.168.1.100:5000/login.html`

## ✅ Features Working Locally

- ✅ Faculty/Student Login
- ✅ QR Code Generation (2-minute timer)  
- ✅ QR Code Scanning (Camera works on localhost!)
- ✅ Real-time attendance updates
- ✅ Live attendance feed
- ✅ Count updates (Present/Late/Total)
- ✅ Socket.io real-time communication
- ✅ SQLite database

## 🐛 Troubleshooting

### "Scanner not working"
- Camera works on `localhost` (HTTP allowed)
- Make sure to allow camera permissions
- Use Chrome/Safari for best camera support

### "Connection refused"
- Make sure backend is running (`npm start`)
- Check port 5000 is not blocked
- Try `http://localhost:5000/login.html` directly

### "Socket.io errors"
- Backend must be running first
- Check browser console for specific errors
- Try refreshing the page

## 🎯 Development Tips

1. **Backend Changes:** Restart with `npm start`
2. **Frontend Changes:** Refresh browser (Live Server auto-refreshes)
3. **Database Reset:** Delete `attendiq.db` file and restart
4. **Port Conflicts:** Change PORT in `server.js` if needed

## 🔑 Default Test Users

The system creates these test users automatically:

**Faculty:**
- `faculty@test.com` / `password123`

**Students:**
- `alice@test.com` / `student123`
- `bob@test.com` / `student123`  
- `carol@test.com` / `student123`
- `david@test.com` / `student123`
- `eva@test.com` / `student123`

## 🌟 Perfect Setup Checklist

- [ ] `npm install` completed
- [ ] `npm start` running (backend on port 5000)
- [ ] Live Server running (frontend on port 5500) OR direct access via port 5000
- [ ] Login working for both faculty and students
- [ ] QR generation shows 2-minute countdown
- [ ] Scanner opens camera properly
- [ ] Real-time updates showing in live feed
- [ ] Counts updating when students scan

**Everything should work perfectly in VS Code now!** 🎉