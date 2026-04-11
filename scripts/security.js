// ========================================
// Security Utilities
// ========================================

const Security = {
    // Generate a CSRF token
    generateToken() {
        const array = new Uint8Array(32);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(array);
        } else {
            // Fallback for older browsers
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    },

    // Get or create CSRF token
    getCsrfToken() {
        let token = sessionStorage.getItem('csrf_token');
        if (!token) {
            token = this.generateToken();
            sessionStorage.setItem('csrf_token', token);
        }
        return token;
    },

    // Validate CSRF token
    validateToken(token) {
        const storedToken = sessionStorage.getItem('csrf_token');
        return token && storedToken && token === storedToken;
    },

    // Refresh CSRF token
    refreshToken() {
        const token = this.generateToken();
        sessionStorage.setItem('csrf_token', token);
        return token;
    },

    // Sanitize HTML to prevent XSS
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Validate email format
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Check if running in iframe (clickjacking protection)
    isInIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    },

    // Simple hash function for passwords (NOT for production - use bcrypt server-side)
    // This is a client-side-only obfuscation to prevent casual snooping
    async hashPassword(password, salt = '1hundred_salt') {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);

        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        }

        // Fallback for older browsers
        return btoa(password + salt);
    },

    // Rate limiting for form submissions
    checkRateLimit(key, maxAttempts = 5, windowMs = 60000) {
        const now = Date.now();
        let attempts;
        try {
            attempts = JSON.parse(localStorage.getItem(`rate_limit_${key}`) || '[]');
            if (!Array.isArray(attempts)) attempts = [];
        } catch (e) {
            attempts = [];
        }

        // Filter out old attempts
        const recentAttempts = attempts.filter((time) => now - time < windowMs);

        if (recentAttempts.length >= maxAttempts) {
            const oldestAttempt = recentAttempts[0];
            const waitTime = Math.ceil((windowMs - (now - oldestAttempt)) / 1000);
            return { allowed: false, waitTime };
        }

        recentAttempts.push(now);
        localStorage.setItem(`rate_limit_${key}`, JSON.stringify(recentAttempts));
        return { allowed: true, waitTime: 0 };
    },

    // Clear rate limit
    clearRateLimit(key) {
        localStorage.removeItem(`rate_limit_${key}`);
    }
};

// Initialize CSRF token on load
Security.getCsrfToken();

// Expose globally
window.Security = Security;
