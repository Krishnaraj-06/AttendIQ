# AttendIQ - Smart Attendance Management System

## Overview
AttendIQ is a comprehensive smart attendance management system featuring both a professional landing page and full-stack application with QR code-based attendance tracking, facial recognition capabilities, and real-time analytics. The system includes both frontend interfaces and a robust Node.js backend with SQLite database.

## Project Status
- **Type**: Full-Stack Web Application
- **Technology Stack**: HTML5, CSS3, Vanilla JavaScript, Node.js, Express, SQLite
- **Server**: Node.js Express Server (port 5000)
- **Database**: SQLite (attendiq.db)
- **Deployment**: Configured for autoscale deployment

## Recent Changes
- September 10, 2025: GitHub import successfully configured for Replit environment
- Node.js backend properly set up and running on port 5000
- SQLite database initialized with all required tables
- Fixed API endpoint URLs to work with Replit proxy environment
- Default test users created for immediate testing
- Deployment configuration updated for production

## Project Architecture
### File Structure
```
AttendIQ/
├── server.js               # Node.js Express backend server
├── package.json           # Node.js dependencies and scripts
├── attendiq.db            # SQLite database file
├── index.html             # Main landing page
├── login.html             # Login page with API integration
├── faculty-dashboard.html  # Faculty dashboard with QR generation
├── student-dashboard.html  # Student dashboard
├── student-checkin.html   # Student check-in page
├── checkin.html          # Check-in page
├── css/
│   ├── style.css         # Main stylesheet (2855+ lines)
│   └── animations.css    # Animation styles
├── js/
│   ├── main.js          # Main JavaScript functionality
│   └── animations.js    # Animation scripts
├── README.md            # Original project documentation
├── replit.md           # This file
└── .gitignore          # Git ignore rules
```

### Key Features
- **Frontend**: Modern glassmorphism design with dark theme and responsive layout
- **QR Code Attendance**: Dynamic QR codes with 2-minute expiration for fraud prevention
- **Real-time Tracking**: Socket.io integration for live attendance updates
- **User Management**: Separate login systems for students and faculty
- **Database**: SQLite with proper table structure for users, sessions, and attendance
- **File Upload**: Excel file upload for bulk student registration
- **Authentication**: JWT-based authentication system
- **API Endpoints**: RESTful API for all attendance operations
- **Mobile-first Design**: Optimized for all devices

### Technical Details
- **Server**: Node.js Express server with Socket.io
- **Host**: 0.0.0.0 (configured for Replit environment)
- **Port**: 5000 (production ready)
- **Database**: SQLite with tables for students, faculty, sessions, and attendance
- **Dependencies**: Express, Socket.io, SQLite3, bcryptjs, jsonwebtoken, multer, qrcode, uuid, xlsx
- **Authentication**: JWT tokens with bcrypt password hashing
- **External Resources**: 
  - Google Fonts (Inter)
  - Font Awesome icons
  - CDN libraries for QR codes, charts, and Excel processing

## Current Configuration
- **Workflow**: Node.js Express server serving static files and API endpoints
- **Deployment**: Autoscale deployment configured
- **Environment**: Node.js with npm dependencies
- **Test Credentials**: 
  - Faculty: faculty@test.com / password123
  - Student: alice@test.com / student123 (and other test students)
- **Status**: Fully functional with backend API integration

## User Preferences
- Modern, professional design aesthetic
- No build process required
- Simple static hosting preferred
- Focus on performance and user experience