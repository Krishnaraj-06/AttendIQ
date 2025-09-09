const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
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

// MySQL Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendiq'
};

// Create MySQL connection
const db = mysql.createConnection(dbConfig);

// Connect to database and create tables
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    console.log('Attempting to create database...');
    
    // Try to connect without database name to create the database
    const dbWithoutName = { ...dbConfig };
    delete dbWithoutName.database;
    const dbCreator = mysql.createConnection(dbWithoutName);
    
    dbCreator.connect((err) => {
      if (err) {
        console.error('Error connecting to MySQL server:', err);
        return;
      }
      
      // Create database if it doesn't exist
      dbCreator.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
        if (err) {
          console.error('Error creating database:', err);
        } else {
          console.log('Database created or already exists');
          // Reconnect with database name
          db.connect();
        }
        dbCreator.end();
      });
    });
  } else {
    console.log('Connected to MySQL database');
    createTables();
  }
});

// Create required tables
function createTables() {
  // Students table
  const studentsTable = `
    CREATE TABLE IF NOT EXISTS students (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Faculty table
  const facultyTable = `
    CREATE TABLE IF NOT EXISTS faculty (
      id INT AUTO_INCREMENT PRIMARY KEY,
      faculty_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Sessions table for QR codes
  const sessionsTable = `
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      faculty_id VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      qr_code_data TEXT,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE
    )
  `;

  // Attendance table
  const attendanceTable = `
    CREATE TABLE IF NOT EXISTS attendance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      student_id VARCHAR(255) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status ENUM('present', 'late') DEFAULT 'present',
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
      UNIQUE KEY unique_attendance (session_id, student_id)
    )
  `;

  db.query(studentsTable, (err) => {
    if (err) console.error('Error creating students table:', err);
  });

  db.query(facultyTable, (err) => {
    if (err) console.error('Error creating faculty table:', err);
  });

  db.query(sessionsTable, (err) => {
    if (err) console.error('Error creating sessions table:', err);
  });

  db.query(attendanceTable, (err) => {
    if (err) console.error('Error creating attendance table:', err);
    else console.log('Database tables created successfully');
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
  const { studentId, password } = req.body;

  if (!studentId || !password) {
    return res.status(400).json({ error: 'Student ID and password are required' });
  }

  db.query('SELECT * FROM students WHERE student_id = ?', [studentId], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const student = results[0];
    const isValidPassword = await bcrypt.compare(password, student.password_hash);

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

// Faculty login
app.post('/api/faculty/login', (req, res) => {
  const { facultyId, password } = req.body;

  if (!facultyId || !password) {
    return res.status(400).json({ error: 'Faculty ID and password are required' });
  }

  db.query('SELECT * FROM faculty WHERE faculty_id = ?', [facultyId], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const faculty = results[0];
    const isValidPassword = await bcrypt.compare(password, faculty.password_hash);

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
        
        db.query(
          'INSERT INTO students (student_id, name, email, password_hash) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash)',
          [student_id, name, email, passwordHash],
          (err) => {
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
  const { facultyId, subject } = req.body;

  if (!facultyId || !subject) {
    return res.status(400).json({ error: 'Faculty ID and subject are required' });
  }

  const sessionId = uuid.v4();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now
  
  const qrData = {
    sessionId,
    facultyId,
    subject,
    timestamp: new Date().toISOString()
  };

  // Store in database
  db.query(
    'INSERT INTO sessions (session_id, faculty_id, subject, qr_code_data, expires_at) VALUES (?, ?, ?, ?, ?)',
    [sessionId, facultyId, subject, JSON.stringify(qrData), expiresAt],
    async (err) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      try {
        // Generate QR code
        const qrCodeURL = await QRCode.toDataURL(JSON.stringify(qrData));
        
        // Store in memory for quick access
        activeQRCodes.set(sessionId, {
          facultyId,
          subject,
          expiresAt,
          qrData
        });

        res.json({
          success: true,
          sessionId,
          qrCode: qrCodeURL,
          expiresAt: expiresAt.toISOString(),
          subject
        });

        // Emit to faculty dashboard for real-time updates
        io.emit('qr_generated', {
          sessionId,
          facultyId,
          subject,
          expiresAt: expiresAt.toISOString()
        });

      } catch (error) {
        res.status(500).json({ error: 'Error generating QR code' });
      }
    }
  );
});

// Scan QR code and mark attendance
app.post('/api/student/scan-qr', (req, res) => {
  const { qrData, studentId } = req.body;

  if (!qrData || !studentId) {
    return res.status(400).json({ error: 'QR data and student ID are required' });
  }

  try {
    const parsedQRData = JSON.parse(qrData);
    const { sessionId } = parsedQRData;

    // Check if QR code is still valid
    const sessionInfo = activeQRCodes.get(sessionId);
    if (!sessionInfo) {
      return res.status(400).json({ 
        error: 'QR code has expired or is invalid',
        expired: true
      });
    }

    if (new Date() > sessionInfo.expiresAt) {
      activeQRCodes.delete(sessionId);
      return res.status(400).json({ 
        error: 'QR code has expired',
        expired: true
      });
    }

    // Check if student exists
    db.query('SELECT * FROM students WHERE student_id = ?', [studentId], (err, studentResults) => {
      if (err || studentResults.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const student = studentResults[0];

      // Check if already marked present
      db.query(
        'SELECT * FROM attendance WHERE session_id = ? AND student_id = ?',
        [sessionId, studentId],
        (err, attendanceResults) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (attendanceResults.length > 0) {
            return res.status(409).json({ 
              error: 'Attendance already marked for this session',
              alreadyMarked: true
            });
          }

          // Mark attendance
          const now = new Date();
          const sessionStartTime = new Date(parsedQRData.timestamp);
          const timeDiff = (now - sessionStartTime) / (1000 * 60); // Difference in minutes
          const status = timeDiff > 10 ? 'late' : 'present'; // Mark as late if more than 10 minutes

          db.query(
            'INSERT INTO attendance (session_id, student_id, status) VALUES (?, ?, ?)',
            [sessionId, studentId, status],
            (err) => {
              if (err) {
                return res.status(500).json({ error: 'Error marking attendance' });
              }

              const attendanceData = {
                success: true,
                sessionId,
                studentId,
                studentName: student.name,
                subject: sessionInfo.subject,
                status,
                timestamp: now.toISOString(),
                message: `Attendance marked successfully as ${status}`
              };

              res.json(attendanceData);

              // Emit real-time update to faculty dashboard
              io.emit('attendance_marked', {
                sessionId,
                studentId,
                studentName: student.name,
                status,
                timestamp: now.toISOString(),
                subject: sessionInfo.subject
              });
            }
          );
        }
      );
    });

  } catch (error) {
    res.status(400).json({ error: 'Invalid QR code format' });
  }
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

  db.query(query, [sessionId], (err, results) => {
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

  db.query(query, [sessionId, studentId], (err, results) => {
    if (err || results.length === 0) {
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

    const attendance = results[0];
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

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`AttendIQ server running on port ${PORT}`);
});