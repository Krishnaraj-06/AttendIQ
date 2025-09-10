# AttendIQ - Local Development Setup Guide

## 🚀 Quick Start for Local Development

### Prerequisites
- Node.js 18+ installed
- VS Code or any code editor
- Git (optional)

### 1. Initial Setup
```bash
# Navigate to the project directory
cd AttendIQ

# Install dependencies
npm install

# Start the server
node server.js
```

### 2. Access the Application
- **Main Website**: http://localhost:5000
- **Login Page**: http://localhost:5000/login.html
- **Faculty Dashboard**: http://localhost:5000/faculty-dashboard.html
- **Student Dashboard**: http://localhost:5000/student-dashboard.html

## 📱 Mobile Testing Over Local Network

### Option 1: Same Wi-Fi Network
1. Find your computer's IP address:
   - Windows: Open Command Prompt and type `ipconfig`
   - Mac/Linux: Open Terminal and type `ifconfig`
2. Note your local IP address (usually starts with 192.168.x.x or 10.0.x.x)
3. Access from mobile device: `http://YOUR_IP_ADDRESS:5000`

### Option 2: Using ngrok for External Access
1. Install ngrok: https://ngrok.com/download
2. Start your local server: `node server.js`
3. In a new terminal, run: `ngrok http 5000`
4. Use the https URL provided by ngrok to access from any device

## 🔄 QR Code Testing Flow

1. Start the server: `node server.js`
2. Login as faculty: `faculty@test.com` / `password123`
3. Click "Generate QR Code" on the faculty dashboard
4. Enter subject name and room
5. Scan the QR code with a mobile device
6. Login as student if prompted: `alice@test.com` / `student123`
7. The attendance will be marked automatically
8. Check the faculty dashboard for real-time updates

## 🛠️ Troubleshooting

### Connection Issues
- Ensure server is running on port 5000
- Check firewall settings to allow connections on port 5000
- Verify all devices are on the same network for local testing

### QR Code Not Working
- Ensure the mobile device has internet access
- Check that the QR code contains the correct URL format
- Verify the server is accessible from the mobile device

### Real-time Updates Not Working
- Check browser console for Socket.io connection errors
- Ensure WebSocket connections are not blocked by network
- Restart the server if needed

## 🚀 Deployment Options

### Option 1: Traditional Hosting
1. Choose a Node.js hosting provider (Heroku, DigitalOcean, AWS, etc.)
2. Update all hardcoded localhost:5000 URLs to your production domain
3. Set up environment variables for production
4. Deploy using the provider's instructions

### Option 2: Docker Deployment
1. Create a Dockerfile in the project root
2. Build the Docker image
3. Deploy to any container service

### Option 3: Serverless Deployment
1. Adapt the application for serverless architecture
2. Deploy API functions to AWS Lambda or similar
3. Host static files on S3 or similar service

## 📊 Test Credentials

### Faculty Login
- **Email**: faculty@test.com
- **Password**: password123

### Student Logins
- **Alice**: alice@test.com / student123
- **Smith**: smith@test.com / student123
- **Bob**: bob@test.com / student123
- **Carol**: carol@test.com / student123