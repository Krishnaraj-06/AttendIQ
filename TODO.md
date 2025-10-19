# Profile Photo Verification Implementation

## Database Changes
- [ ] Add profile_photos table to store student profile photos
- [ ] Add profile_photo column to students table (optional, for migration)

## Server API Endpoints
- [x] POST /api/student/upload-profile-photo - Upload profile photo
- [x] GET /api/student/profile-photo/:studentId - Get profile photo
- [x] POST /api/student/compare-faces - Compare live photo with profile photo

## Student Dashboard Updates
- [ ] Add profile photo upload section to Profile tab
- [ ] Add photo preview and upload functionality
- [ ] Show current profile photo status

## Check-in Page Modifications
- [ ] Replace complex face-api.js real-time detection with simple photo capture
- [ ] Add "Take Photo" button to capture live photo
- [ ] Show detailed verification status (StudentID, Date, QR, Location, Face, Status)
- [ ] Implement face comparison using face-api.js (one-time load)
- [ ] Update UI to show verification results clearly

## Testing
- [ ] Test profile photo upload
- [ ] Test photo comparison accuracy
- [ ] Test complete check-in flow
- [ ] Test error handling

## Cleanup
- [ ] Remove or repurpose face-registration.html
- [ ] Remove complex face verification code from checkin.html
- [ ] Update documentation
