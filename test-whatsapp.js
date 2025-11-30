// Test WhatsApp notification system
const axios = require('axios');

async function testWhatsAppNotification() {
    try {
        // Test notification to Krishnaraj's number
        const response = await axios.post('http://localhost:5000/api/test-whatsapp', {
            phone: '9699588803',
            message: '⚠️ Hi Krishnaraj, you have missed 2 consecutive sessions of Computer Science by Prof. Dr. John Smith. Please attend the next class!'
        }, {
            headers: {
                'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE', // Replace with actual token
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ WhatsApp notification test successful:', response.data);
    } catch (error) {
        console.error('❌ WhatsApp notification test failed:', error.response?.data || error.message);
    }
}

// Run test
testWhatsApp Notification();