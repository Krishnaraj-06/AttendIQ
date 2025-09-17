const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');
const multer = require('multer');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const uuid = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// File upload configuration
const upload = multer({ dest: 'uploads/' });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// SQLite Database Configuration
const db = new sqlite3.Database('attendiq.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database');
    createTables();
  }
});

// Create required tables
function createTables() {
  // Students table
  const studentsTable = `
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Faculty table
  const facultyTable = `
    CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      faculty_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Sessions table for QR codes
  const sessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE NOT NULL,
      faculty_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      qr_code_data TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Attendance table
  const attendanceTable = `
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT CHECK(status IN ('present', 'late')) DEFAULT 'present'
    )
  `;

  // Create unique constraint for attendance
  const attendanceIndex = `
    CREATE UNIQUE INDEX IF NOT EXISTS unique_attendance 
    ON attendance(session_id, student_id)
  `;

  db.run(studentsTable, (err) => {
    if (err) console.error('Error creating students table:', err);
  });

  db.run(facultyTable, (err) => {
    if (err) console.error('Error creating faculty table:', err);
  });

  db.run(sessionsTable, (err) => {
    if (err) console.error('Error creating sessions table:', err);
  });

  db.run(attendanceTable, (err) => {
    if (err) console.error('Error creating attendance table:', err);
    else console.log('Database tables created successfully');
  });

  db.run(attendanceIndex, (err) => {
    if (err) console.error('Error creating attendance index:', err);
  });
}

// In-memory storage for active QR codes (for 2-minute expiration)
const activeQRCodes = new Map();

// Clean up expired QR codes every minute
setInterval(() => {
  const now = new Date();
  for (const [sessionId, sessionData] of activeQRCodes) {
    if (now > sessionData.expiresAt) {
      activeQRCodes.delete(sessionId);
    }
  }
}, 60000);

// Routes

// Student login
app.post('/api/student/login', (req, res) => {
  const { studentId, email, password } = req.body;

  // Accept either studentId or email
  const loginField = studentId || email;
  
  if (!loginField || !password) {
    return res.status(400).json({ error: 'Student ID/email and password are required' });
  }

  // Search by email first, then by student_id if no email match
  const query = loginField.includes('@') ? 
    'SELECT * FROM students WHERE email = ?' : 
    'SELECT * FROM students WHERE student_id = ?';

  db.get(query, [loginField], (err, student) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Use bcrypt.compare with callback instead of async/await
    bcrypt.compare(password, student.password_hash, (bcryptErr, isValidPassword) => {
      if (bcryptErr) {
        console.error('Bcrypt error:', bcryptErr);
        return res.status(500).json({ error: 'Authentication error' });
      }

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({
        userId: student.student_id,
        type: 'student'
      }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        token,
        student: {
          id: student.student_id,
          name: student.name,
          email: student.email
        }
      });
    });
  });
});

// Faculty login
app.post('/api/faculty/login', (req, res) => {
  const { facultyId, email, password } = req.body;

  // Accept either facultyId or email
  const loginField = facultyId || email;

  if (!loginField || !password) {
    return res.status(400).json({ error: 'Faculty ID/email and password are required' });
  }

  // Search by email first, then by faculty_id if no email match
  const query = loginField.includes('@') ? 
    'SELECT * FROM faculty WHERE email = ?' : 
    'SELECT * FROM faculty WHERE faculty_id = ?';

  db.get(query, [loginField], (err, faculty) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!faculty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Use bcrypt.compare with callback instead of async/await
    bcrypt.compare(password, faculty.password_hash, (bcryptErr, isValidPassword) => {
      if (bcryptErr) {
        console.error('Bcrypt error:', bcryptErr);
        return res.status(500).json({ error: 'Authentication error' });
      }

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({
        userId: faculty.faculty_id,
        type: 'faculty'
      }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        token,
        faculty: {
          id: faculty.faculty_id,
          name: faculty.name,
          email: faculty.email
        }
      });
    });
  });
});

// Upload Excel file with student credentials
app.post('/api/faculty/upload-students', upload.single('excel'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Excel file is required' });
  }

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const students = XLSX.utils.sheet_to_json(worksheet);

    if (students.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    let processedCount = 0;
    const errors = [];

    students.forEach(async (studentData, index) => {
      const { student_id, name, email, password } = studentData;

      if (!student_id || !name || !email || !password) {
        errors.push(`Row ${index + 2}: Missing required fields`);
        return;
      }

      try {
        const passwordHash = await bcrypt.hash(password, 10);
        
        db.run(
          'INSERT OR REPLACE INTO students (student_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
          [student_id, name, email, passwordHash],
          function(err) {
            if (err) {
              errors.push(`Row ${index + 2}: ${err.message}`);
            } else {
              processedCount++;
            }

            // Check if all students are processed
            if (processedCount + errors.length === students.length) {
              res.json({
                success: true,
                message: `Processed ${processedCount} students`,
                errors: errors.length > 0 ? errors : undefined
              });
            }
          }
        );
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error.message}`);
      }
    });

    // Clean up uploaded file
    require('fs').unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });

  } catch (error) {
    res.status(500).json({ error: 'Error processing Excel file: ' + error.message });
  }
});

// Generate QR code for attendance session
app.post('/api/faculty/generate-qr', (req, res) => {
  const { facultyId, subject, room } = req.body;

  if (!facultyId || !subject) {
    return res.status(400).json({ error: 'Faculty ID and subject are required' });
  }

  const sessionId = uuid.v4();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
  
  const sessionData = {
    sessionId,
    facultyId,
    subject,
    room: room || 'Classroom',
    timestamp: new Date().toISOString()
  };

  // Store in database
  db.run(
    'INSERT INTO sessions (session_id, faculty_id, subject, qr_code_data, expires_at) VALUES (?, ?, ?, ?, ?)',
    [sessionId, facultyId, subject, JSON.stringify(sessionData), expiresAt],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // FANG-Level Fix: Generate QR code with URL instead of JSON
      // Smart environment detection for QR code URLs
      const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
      const domain = isReplit ? process.env.REPLIT_DEV_DOMAIN : `localhost:${PORT}`;
      const protocol = isReplit ? 'https' : 'http';
      const checkInURL = `${protocol}://${domain}/checkin.html?sessionId=${sessionId}&subject=${encodeURIComponent(subject)}&room=${encodeURIComponent(room || 'Classroom')}`;

      // Generate QR code with mobile-optimized URL
      QRCode.toDataURL(checkInURL, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(qrCodeURL => {
          // Store in memory for quick access
          activeQRCodes.set(sessionId, {
            facultyId,
            subject,
            room: room || 'Classroom',
            expiresAt,
            qrData: sessionData,
            checkInURL
          });

          res.json({
            success: true,
            sessionId,
            qrCode: qrCodeURL,
            expiresAt: expiresAt.toISOString(),
            subject,
            room: room || 'Classroom',
            checkInURL
          });

          // Emit to faculty dashboard for real-time updates
          io.emit('qr_generated', {
            sessionId,
            facultyId,
            subject,
            room: room || 'Classroom',
            expiresAt: expiresAt.toISOString()
          });

          console.log(`✅ QR Code generated: ${subject} - ${sessionId.slice(0, 8)}... (expires in 2 minutes)`);
        })
        .catch(error => {
          console.error('QR generation error:', error);
          res.status(500).json({ error: 'Error generating QR code' });
        });
    }
  );
});

// Real QR code scanning endpoint - FANG Level
app.post('/api/student/mark-attendance', (req, res) => {
  const { sessionId, studentEmail, timestamp, location } = req.body;

  if (!sessionId || !studentEmail) {
    return res.status(400).json({ error: 'Session ID and student email are required' });
  }

  // Check if session exists and is not expired
  const session = activeQRCodes.get(sessionId);
  if (!session) {
    return res.status(400).json({ error: 'Invalid or expired QR code' });
  }

  if (new Date() > session.expiresAt) {
    activeQRCodes.delete(sessionId);
    return res.status(400).json({ error: 'QR code has expired (2 minutes limit)' });
  }

  // Get student details by email
  db.get('SELECT * FROM students WHERE email = ?', [studentEmail], (err, student) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Determine attendance status based on time
    const scanTime = new Date(timestamp);
    const sessionStart = new Date(session.expiresAt.getTime() - 2 * 60 * 1000); // 2 minutes before expiry
    const timeDiff = (scanTime - sessionStart) / 1000; // seconds
    const status = timeDiff <= 60 ? 'present' : 'late'; // First minute = present, after = late

    // Record attendance
    db.run(
      'INSERT OR REPLACE INTO attendance (session_id, student_id, status, timestamp) VALUES (?, ?, ?, ?)',
      [sessionId, student.student_id, status, timestamp],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to record attendance' });
        }

        res.json({
          success: true,
          message: 'Attendance marked successfully',
          studentName: student.name,
          subject: session.subject,
          status: status,
          timestamp: timestamp,
          sessionId: sessionId
        });

        // 🚀 ENHANCED Real-time update to faculty dashboard
        const realTimeData = {
          sessionId: sessionId,
          studentId: student.student_id,
          studentName: student.name,
          studentEmail: studentEmail,
          subject: session.subject,
          status: status,
          timestamp: timestamp,
          location: location,
          // Additional data for enhanced UI updates
          scanTime: new Date().toLocaleTimeString(),
          timeDifference: timeDiff
        };
        
        // Emit to all connected faculty dashboards
        io.emit('attendance_marked', realTimeData);
        
        // Also emit to specific faculty room if they're connected
        io.to(`faculty_${session.faculty_id}`).emit('attendance_update', realTimeData);
        
        console.log(`📡 Real-time update sent: ${student.name} marked ${status}`);

        console.log(`✅ Attendance marked: ${student.name} (${student.email}) - ${status} in ${session.subject}`);
      }
    );
  });
});

// Get attendance data for faculty dashboard
app.get('/api/faculty/attendance/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  const query = `
    SELECT 
      a.student_id,
      s.name as student_name,
      a.status,
      a.timestamp
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    WHERE a.session_id = ?
    ORDER BY a.timestamp ASC
  `;

  db.all(query, [sessionId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      success: true,
      attendance: results
    });
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join_faculty_dashboard', (facultyId) => {
    socket.join(`faculty_${facultyId}`);
    console.log(`Faculty ${facultyId} joined dashboard room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve check-in success page
app.get('/checkin-success/:sessionId/:studentId', (req, res) => {
  const { sessionId, studentId } = req.params;
  
  // Get attendance details
  const query = `
    SELECT 
      a.*,
      s.name as student_name,
      sess.subject
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    JOIN sessions sess ON a.session_id = sess.session_id
    WHERE a.session_id = ? AND a.student_id = ?
  `;

  db.get(query, [sessionId, studentId], (err, attendance) => {
    if (err || !attendance) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Check-in Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="css/style.css" rel="stylesheet">
        </head>
        <body>
          <div class="checkin-container error">
            <h1>❌ Check-in Error</h1>
            <p>Attendance record not found.</p>
            <a href="/student-dashboard.html" class="btn btn-primary">Back to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    const statusIcon = attendance.status === 'present' ? '✅' : '⏰';
    const statusText = attendance.status === 'present' ? 'Present' : 'Late';
    const statusClass = attendance.status;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Check-in Success - AttendIQ</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="/css/style.css" rel="stylesheet">
        <style>
          .checkin-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--dark-bg) 0%, #1e293b 50%, var(--dark-bg) 100%);
            padding: 2rem;
            text-align: center;
          }
          .success-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            padding: 2rem;
            max-width: 500px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .success-title {
            color: #22c55e;
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          .attendance-details {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin: 1.5rem 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding: 0.25rem 0;
          }
          .detail-label {
            font-weight: 600;
            opacity: 0.8;
          }
          .detail-value {
            color: var(--light-text);
          }
          .status-badge.present {
            background-color: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.9rem;
            font-weight: 600;
          }
          .status-badge.late {
            background-color: rgba(249, 115, 22, 0.2);
            color: #f97316;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.9rem;
            font-weight: 600;
          }
          .btn-home {
            margin-top: 1.5rem;
            background: var(--gradient-primary);
            border: none;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
          }
          .btn-home:hover {
            transform: translateY(-2px);
          }
        </style>
      </head>
      <body>
        <div class="checkin-container">
          <div class="success-card">
            <div class="success-icon">${statusIcon}</div>
            <h1 class="success-title">Check-in Successful!</h1>
            
            <div class="attendance-details">
              <div class="detail-row">
                <span class="detail-label">Student:</span>
                <span class="detail-value">${attendance.student_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Subject:</span>
                <span class="detail-value">${attendance.subject}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge ${statusClass}">${statusText}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${new Date(attendance.timestamp).toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Session ID:</span>
                <span class="detail-value">${sessionId.slice(0, 8)}...</span>
              </div>
            </div>

            <p style="opacity: 0.8; margin-bottom: 1rem;">
              Your attendance has been recorded successfully. 
              ${attendance.status === 'present' ? 'You\'re on time!' : 'You\'re marked as late.'}
            </p>

            <a href="/student-dashboard.html" class="btn-home">
              Back to Dashboard
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create default test users on startup
function createDefaultUsers() {
  console.log('\n🔧 Creating default test users...');
  
  // Create test faculty user
  const facultyPassword = bcrypt.hashSync('password123', 10);
  db.run(
    'INSERT OR IGNORE INTO faculty (faculty_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
    ['faculty001', 'Dr. John Smith', 'faculty@test.com', facultyPassword],
    function(err) {
      if (err) {
        console.log('Faculty user creation error:', err.message);
      } else if (this.changes > 0) {
        console.log('✅ Default faculty user created: faculty@test.com / password123');
      } else {
        console.log('ℹ️  Faculty user already exists: faculty@test.com');
      }
    }
  );

  // Create test student users - FANG level students
  const studentPassword = bcrypt.hashSync('student123', 10);
  const testStudents = [
    ['STU001', 'Alice Johnson', 'alice@test.com'],
    ['STU002', 'Smith Kumar', 'smith@test.com'], 
    ['STU003', 'Krishnaraj Patel', 'krishnaraj@test.com'],
    ['STU004', 'Pratik Sharma', 'pratik@test.com'],
    ['STU005', 'Bob Wilson', 'bob@test.com'],
    ['STU006', 'Carol Davis', 'carol@test.com'],
    ['STU007', 'David Brown', 'david@test.com'],
    ['STU008', 'Eva Singh', 'eva@test.com']
  ];

  testStudents.forEach(([studentId, name, email]) => {
    db.run(
      'INSERT OR IGNORE INTO students (student_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [studentId, name, email, studentPassword],
      function(err) {
        if (err) {
          console.log(`Student creation error for ${email}:`, err.message);
        } else if (this.changes > 0) {
          console.log(`✅ Default student created: ${email} / student123`);
        }
      }
    );
  });

  setTimeout(() => {
    console.log('\n🎯 LOGIN CREDENTIALS:');
    console.log('👨‍🏫 Faculty: faculty@test.com / password123');
    console.log('👩‍🎓 Student: alice@test.com / student123 (or bob@test.com, carol@test.com, etc.)');
    console.log('📚 Ready to generate QR codes and track attendance!\n');
  }, 1000);
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  // Enhanced environment detection for VS Code + Replit compatibility
  const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
  const isLocal = !isReplit;
  
  let domain, protocol;
  if (isReplit) {
    domain = process.env.REPLIT_DEV_DOMAIN;
    protocol = 'https';
  } else {
    // Local development - works with VS Code Live Server
    domain = `localhost:${PORT}`;
    protocol = 'http';
  }
  
  console.log(`✅ AttendIQ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${isReplit ? 'Replit Cloud ☁️' : 'Local Development 💻'}`);
  console.log(`📱 Mobile access: ${protocol}://${domain}`);
  console.log(`📊 Faculty Dashboard: ${protocol}://${domain}/faculty-dashboard.html`);
  console.log(`🎓 Student Dashboard: ${protocol}://${domain}/student-dashboard.html`);
  
  if (isLocal) {
    console.log(`\n🔧 VS Code Local Setup:`);
    console.log(`1. Run "npm start" to start this backend server (port ${PORT})`);
    console.log(`2. Use Live Server extension for frontend (port 5500)`);
    console.log(`3. Camera scanner works perfectly on localhost!`);
    console.log(`4. For mobile testing, use your computer's IP: http://[YOUR-IP]:${PORT}`);
  }
  
  console.log('\n🔑 Test Credentials:');
  console.log('Faculty: faculty@test.com / password123');
  console.log('Students: alice@test.com / student123\n');
  
  // Create default users after server starts
  setTimeout(createDefaultUsers, 1000);
});