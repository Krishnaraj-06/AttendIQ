// FANG-LEVEL BULLETPROOF QR GENERATION SYSTEM
// This completely replaces the buggy QR system

window.BulletproofQR = {
    currentModal: null,
    currentSession: null,
    
    async generateBulletproofQR() {
        try {
            console.log('🚀 Starting FANG-level QR generation...');
            
            // Get subject and room
            const subject = prompt('Enter subject name for attendance:');
            if (!subject) return;
            
            const room = prompt('Enter room/location:') || 'Classroom';
            
            // Show loading notification
            this.showNotification('🔄 Generating bulletproof QR code...', 'info');
            
            // Get current user
            const userData = localStorage.getItem('userData');
            if (!userData) {
                this.showNotification('❌ Please login first', 'error');
                return;
            }
            
            const currentUser = JSON.parse(userData);
            
            // Make API call
            const response = await fetch(window.API_BASE_URL + '/api/faculty/generate-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    facultyId: currentUser.id,
                    subject: subject,
                    room: room
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentSession = data.sessionId;
                this.displayBulletproofQR(data);
                this.showNotification('✅ QR Code generated successfully!', 'success');
                console.log('✅ QR generated:', data.sessionId);
            } else {
                this.showNotification('❌ Error: ' + data.error, 'error');
            }
            
        } catch (error) {
            console.error('QR Generation Error:', error);
            this.showNotification('❌ Connection error. Check console.', 'error');
        }
    },
    
    displayBulletproofQR(data) {
        // Remove any existing modal
        if (this.currentModal) {
            this.currentModal.remove();
        }
        
        // Create bulletproof modal
        const modal = document.createElement('div');
        modal.id = 'bulletproof-qr-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;
        
        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                border: 2px solid #10b981;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="margin-bottom: 20px;">
                    <h2 style="color: #10b981; margin: 0; font-size: 1.5rem;">
                        🎯 FANG-Level QR Code
                    </h2>
                    <p style="color: #64748b; margin: 10px 0 0 0;">Bulletproof & Persistent</p>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 15px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #fff; margin: 0 0 10px 0;">📚 ${data.subject}</h3>
                    <p style="color: #94a3b8; margin: 0;">📍 ${data.room}</p>
                    <p style="color: #fbbf24; margin: 10px 0 0 0; font-size: 0.9rem;">
                        ⏰ Expires: ${new Date(data.expiresAt).toLocaleTimeString()}
                    </p>
                </div>
                
                <div style="background: white; border-radius: 15px; padding: 20px; margin: 20px 0;">
                    <img src="${data.qrCode}" alt="QR Code" style="
                        width: 200px;
                        height: 200px;
                        display: block;
                        margin: 0 auto;
                        border-radius: 10px;
                    ">
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button onclick="window.BulletproofQR.generateBulletproofQR()" style="
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                    ">🔄 New QR</button>
                    
                    <button onclick="window.BulletproofQR.closeQR()" style="
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                    ">❌ Close</button>
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(16, 185, 129, 0.1); border-radius: 10px;">
                    <p style="color: #10b981; margin: 0; font-size: 0.9rem;">
                        📱 Students can scan this QR code to mark attendance
                    </p>
                </div>
            </div>
        `;
        
        // Add to body
        document.body.appendChild(modal);
        this.currentModal = modal;
        
        // Prevent modal from closing accidentally
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                // Don't close on backdrop click
                e.preventDefault();
                e.stopPropagation();
            }
        });
        
        console.log('✅ Bulletproof QR modal created and displayed');
    },
    
    closeQR() {
        if (this.currentModal) {
            this.currentModal.remove();
            this.currentModal = null;
            console.log('✅ QR modal closed');
        }
    },
    
    showNotification(message, type) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.bulletproof-notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = 'bulletproof-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 10001;
            font-weight: 600;
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

console.log('🚀 Bulletproof QR system loaded and ready!');
