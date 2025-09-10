// ========================================
// 🚀 PORTABLE CONFIG - Works Everywhere!
// ========================================
// Automatically detects Replit vs Local environment
// No hardcoded URLs - works in VS Code, Replit, anywhere!

window.AttendIQConfig = {
    // Smart environment detection
    getEnvironment() {
        const hostname = window.location.hostname;
        const isReplit = hostname.includes('replit.dev') || hostname.includes('replit.com');
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
        
        return {
            isReplit,
            isLocal,
            isDevelopment: isLocal,
            isProduction: isReplit,
            name: isReplit ? 'Replit Cloud ☁️' : isLocal ? 'Local Development 💻' : 'Custom Environment'
        };
    },

    // Smart API base URL detection
    getApiBaseUrl() {
        const env = this.getEnvironment();
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        
        if (env.isReplit) {
            // Replit environment - use current domain
            return `${protocol}//${hostname}`;
        } else if (env.isLocal) {
            // Local development - backend usually on port 5000
            return `${protocol}//${hostname}:5000`;
        } else {
            // Custom environment - assume same domain
            return `${protocol}//${hostname}`;
        }
    },

    // Smart Socket.io URL
    getSocketUrl() {
        return this.getApiBaseUrl();
    },

    // Camera scanner configuration
    getCameraConfig() {
        const env = this.getEnvironment();
        return {
            // Camera works on localhost (HTTP) and HTTPS environments
            allowHttp: env.isLocal,
            requireHttps: env.isReplit,
            facingMode: 'environment', // Back camera for QR scanning
            width: { ideal: 1280 },
            height: { ideal: 720 }
        };
    },

    // Debug info for troubleshooting
    getDebugInfo() {
        const env = this.getEnvironment();
        return {
            environment: env.name,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            port: window.location.port,
            apiUrl: this.getApiBaseUrl(),
            socketUrl: this.getSocketUrl(),
            userAgent: navigator.userAgent.substring(0, 50) + '...'
        };
    },

    // Initialize and log environment info
    init() {
        const debug = this.getDebugInfo();
        console.log('🔧 AttendIQ Environment Detection:', debug);
        
        // Store for easy access
        window.ATTENDIQ_API_URL = this.getApiBaseUrl();
        window.ATTENDIQ_SOCKET_URL = this.getSocketUrl();
        window.ATTENDIQ_ENV = this.getEnvironment();
        
        return this;
    }
};

// Auto-initialize when script loads
window.AttendIQConfig.init();

// Export for easy access
window.API_BASE_URL = window.ATTENDIQ_API_URL;
window.SOCKET_URL = window.ATTENDIQ_SOCKET_URL;

console.log('✅ Portable AttendIQ Config loaded successfully!');
console.log('📍 Current Environment:', window.ATTENDIQ_ENV.name);
console.log('🔗 API URL:', window.API_BASE_URL);