/**
 * Shared Utilities - Common functions used across the application
 * This file centralizes utility functions to avoid duplication
 */

const Utils = {
    // Configuration constants
    config: {
        TAX_RATE: 0.2,
        FREE_SHIPPING_THRESHOLD: 50,
        SHIPPING_COST: 4.99,
        CURRENCY: 'GBP',
        CURRENCY_SYMBOL: '£',
        STORAGE_PREFIX: '1hundred_'
    },

    /**
     * Sanitize HTML to prevent XSS attacks
     * @param {string} str - String to sanitize
     * @returns {string} Sanitized string
     */
    sanitizeHTML(str) {
        if (!str || typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Format price with currency symbol
     * @param {number} price - Price to format
     * @returns {string} Formatted price
     */
    formatPrice(price) {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return `${this.config.CURRENCY_SYMBOL}0.00`;
        return `${this.config.CURRENCY_SYMBOL}${numPrice.toFixed(2)}`;
    },

    /**
     * Calculate shipping cost based on subtotal
     * @param {number} subtotal - Cart subtotal
     * @returns {number} Shipping cost
     */
    calculateShipping(subtotal) {
        return subtotal >= this.config.FREE_SHIPPING_THRESHOLD ? 0 : this.config.SHIPPING_COST;
    },

    /**
     * Calculate tax amount
     * @param {number} amount - Amount to calculate tax on
     * @returns {number} Tax amount
     */
    calculateTax(amount) {
        return amount * this.config.TAX_RATE;
    },

    /**
     * Get storage key with prefix
     * @param {string} key - Base key name
     * @returns {string} Prefixed key
     */
    getStorageKey(key) {
        return `${this.config.STORAGE_PREFIX}${key}`;
    },

    /**
     * Safely get item from localStorage
     * @param {string} key - Key to retrieve
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Parsed value or default
     */
    getStorageItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.getStorageKey(key));
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            debugError('Error reading from localStorage:', e);
            return defaultValue;
        }
    },

    /**
     * Safely set item in localStorage
     * @param {string} key - Key to set
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    setStorageItem(key, value) {
        try {
            localStorage.setItem(this.getStorageKey(key), JSON.stringify(value));
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                showToast('Storage full. Please clear some data.', 'error');
            }
            debugError('Error writing to localStorage:', e);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Key to remove
     */
    removeStorageItem(key) {
        try {
            localStorage.removeItem(this.getStorageKey(key));
        } catch (e) {
            debugError('Error removing from localStorage:', e);
        }
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Is valid
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },

    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date
     */
    formatDate(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid date';
        return d.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    },

    /**
     * Deep clone an object
     * @param {*} obj - Object to clone
     * @returns {*} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (Array.isArray(obj)) return obj.map((item) => this.deepClone(item));
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    },

    /**
     * Safely parse JSON
     * @param {string} json - JSON string to parse
     * @param {*} defaultValue - Default value if parsing fails
     * @returns {*} Parsed value or default
     */
    safeJSONParse(json, defaultValue = null) {
        try {
            return JSON.parse(json);
        } catch (e) {
            return defaultValue;
        }
    },

    /**
     * Add loading state to button
     * @param {HTMLElement} button - Button element
     * @param {string} loadingText - Text to show while loading
     * @returns {Function} Function to restore button
     */
    setButtonLoading(button, loadingText = 'Loading...') {
        if (!button) return () => {};
        const originalText = button.textContent;
        const originalDisabled = button.disabled;

        button.textContent = loadingText;
        button.disabled = true;
        button.classList.add('btn-loading');

        return () => {
            button.textContent = originalText;
            button.disabled = originalDisabled;
            button.classList.remove('btn-loading');
        };
    },

    /**
     * Create element from HTML string
     * @param {string} html - HTML string
     * @returns {HTMLElement} Created element
     */
    createElementFromHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        return div.firstChild;
    },

    /**
     * Get URL parameter value
     * @param {string} name - Parameter name
     * @returns {string|null} Parameter value
     */
    getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    /**
     * Set URL parameter without reload
     * @param {string} name - Parameter name
     * @param {string} value - Parameter value
     */
    setUrlParam(name, value) {
        const url = new URL(window.location);
        if (value) {
            url.searchParams.set(name, value);
        } else {
            url.searchParams.delete(name);
        }
        window.history.pushState({}, '', url);
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
