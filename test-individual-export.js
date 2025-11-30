// Test Individual Report Export - AttendIQ
// Run this in browser console to test individual report Excel export

console.log('🧪 Testing Individual Report Excel Export');

// Create sample data if not exists
if (typeof students === 'undefined' || students.length === 0) {
    window.students = [
        { id: 'STU001', name: 'Alice Johnson', roll: 'STU001', email: 'alice@test.com' },
        { id: 'STU002', name: 'Bob Smith', roll: 'STU002', email: 'bob@test.com' },
        { id: 'STU003', name: 'Charlie Brown', roll: 'STU003', email: 'charlie@test.com' }
    ];
    console.log('✅ Created sample students');
}

if (typeof attendanceData === 'undefined' || attendanceData.length === 0) {
    window.attendanceData = [];
    const now = new Date();
    
    // Create sample attendance data for each student
    students.forEach((student, studentIndex) => {
        for (let i = 0; i < 10; i++) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)); // Last 10 days
            const statuses = ['present', 'present', 'present', 'late', 'absent'];
            const status = statuses[(studentIndex + i) % statuses.length];
            
            attendanceData.push({
                id: `ATT_${student.id}_${i}`,
                sessionId: `SES_${i}`,
                studentId: student.id,
                studentRoll: student.roll,
                studentName: student.name,
                status: status,
                timestamp: date.toISOString()
            });
        }
    });
    console.log('✅ Created sample attendance data:', attendanceData.length, 'records');
}

// Test individual export function
function testIndividualExport() {
    if (typeof XLSX === 'undefined') {
        console.error('❌ XLSX library not loaded');
        return;
    }
    
    const student = students[0]; // Use first student
    const studentData = attendanceData.filter(record => record.studentId === student.id);
    
    const presentCount = studentData.filter(r => r.status === 'present').length;
    const lateCount = studentData.filter(r => r.status === 'late').length;
    const absentCount = studentData.filter(r => r.status === 'absent').length;
    const attendanceRate = studentData.length > 0 ? Math.round(((presentCount + lateCount) / studentData.length) * 100) : 0;
    
    const filename = `individual_report_${student.name.replace(/[^a-zA-Z0-9]/g, '_')}_test.xlsx`;
    
    // Create Excel data
    const summaryData = [
        ['Individual Attendance Report'],
        [''],
        ['Student Name', student.name],
        ['Roll Number', student.roll],
        ['Email', student.email || 'Not provided'],
        ['Report Period', 'Last 10 days'],
        [''],
        ['Summary Statistics'],
        ['Total Sessions', studentData.length],
        ['Present', presentCount],
        ['Late', lateCount],
        ['Absent', absentCount],
        ['Attendance Rate', `${attendanceRate}%`],
        [''],
        ['Detailed Records'],
        ['Date', 'Time', 'Status', 'Session ID']
    ];
    
    studentData.forEach(record => {
        summaryData.push([
            new Date(record.timestamp).toLocaleDateString(),
            new Date(record.timestamp).toLocaleTimeString(),
            record.status,
            record.sessionId
        ]);
    });
    
    // Create and download Excel file
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Individual Report');
    XLSX.writeFile(wb, filename);
    
    console.log('✅ Individual report exported successfully!');
    console.log('📁 Filename:', filename);
    console.log('📊 Student:', student.name);
    console.log('📈 Attendance Rate:', attendanceRate + '%');
    
    return true;
}

// Run the test
try {
    testIndividualExport();
    console.log('🎉 Individual report export test completed successfully!');
} catch (error) {
    console.error('❌ Individual report export test failed:', error);
}

// Make function available globally
window.testIndividualExport = testIndividualExport;