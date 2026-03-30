// Email Service - Integrates with Resend API for transactional emails
// Supports: order-confirmation, shipping, welcome, abandoned-cart, contact

// Debug utility — use window.debugLog if available, otherwise local fallback
const EMAIL_DEBUG = window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app');
if (typeof window.debugLog !== 'function')
    window.debugLog = (...args) => {
        if (EMAIL_DEBUG) console.log(...args);
    };
if (typeof window.debugError !== 'function')
    window.debugError = (...args) => {
        if (EMAIL_DEBUG) console.error(...args);
    };

const EmailService = {
    // API endpoint base URL
    baseUrl: '',

    // Initialize with base URL
    init(baseUrl = '') {
        this.baseUrl = baseUrl;
    },

    /**
     * Check if email automation is enabled
     * @param {string} emailType - Type of email
     * @returns {boolean}
     */
    isEmailEnabled(emailType) {
        const settings = JSON.parse(localStorage.getItem('1hundred_email_settings') || '{}');
        // Default to true if not set
        return settings[emailType] !== false;
    },

    /**
     * Send order confirmation email
     * @param {string} email - Customer email
     * @param {Object} orderData - Order details
     */
    async sendOrderConfirmation(email, orderData) {
        if (!this.isEmailEnabled('order-confirmation')) {
            debugLog('Order confirmation emails disabled');
            return { success: false, error: 'Email type disabled' };
        }
        return this.sendEmail('order-confirmation', email, {
            firstName: orderData.firstName || orderData.name?.split(' ')[0] || 'Customer',
            orderNumber: orderData.orderNumber,
            total: orderData.total,
            items: orderData.items || []
        });
    },

    /**
     * Send shipping notification email
     * @param {string} email - Customer email
     * @param {Object} shippingData - Shipping details
     */
    async sendShippingNotification(email, shippingData) {
        if (!this.isEmailEnabled('shipping-confirmation')) {
            debugLog('Shipping confirmation emails disabled');
            return { success: false, error: 'Email type disabled' };
        }
        return this.sendEmail('shipping', email, {
            firstName: shippingData.firstName || shippingData.name?.split(' ')[0] || 'Customer',
            orderNumber: shippingData.orderNumber,
            trackingNumber: shippingData.trackingNumber,
            carrier: shippingData.carrier
        });
    },

    /**
     * Send welcome email to new customers
     * @param {string} email - Customer email
     * @param {Object} userData - User details
     */
    async sendWelcomeEmail(email, userData) {
        if (!this.isEmailEnabled('welcome')) {
            debugLog('Welcome emails disabled');
            return { success: false, error: 'Email type disabled' };
        }
        return this.sendEmail('welcome', email, {
            firstName: userData.firstName || userData.name?.split(' ')[0] || 'Customer'
        });
    },

    /**
     * Send abandoned cart reminder
     * @param {string} email - Customer email
     * @param {Object} cartData - Cart details
     */
    async sendAbandonedCartEmail(email, cartData) {
        if (!this.isEmailEnabled('abandoned-cart')) {
            debugLog('Abandoned cart emails disabled');
            return { success: false, error: 'Email type disabled' };
        }
        return this.sendEmail('abandoned-cart', email, {
            firstName: cartData.firstName || cartData.name?.split(' ')[0] || 'Customer',
            total: cartData.total,
            items: cartData.items || []
        });
    },

    /**
     * Generic email sending method
     * @param {string} type - Email type
     * @param {string} to - Recipient email
     * @param {Object} data - Email data
     */
    async sendEmail(type, to, data) {
        try {
            const response = await fetch(`${this.baseUrl}/api/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, to, data })
            });

            const result = await response.json();

            if (!response.ok) {
                debugError('Email send error:', result);
                return { success: false, error: result.error };
            }

            debugLog(`Email sent successfully: ${type} to ${to}`);
            return { success: true, ...result };
        } catch (error) {
            debugError('Email service error:', error);
            return { success: false, error: error.message };
        }
    },

    // Schedule abandoned cart email (with 1 hour delay)
    scheduleAbandonedCart(email, cartData) {
        // Store cart data in localStorage with timestamp
        const cartReminder = {
            email,
            cartData,
            timestamp: Date.now()
        };
        localStorage.setItem('1hundred_cartReminder', JSON.stringify(cartReminder));
    },

    // Check and send abandoned cart emails (call on page load)
    async checkAbandonedCarts() {
        const reminder = localStorage.getItem('1hundred_cartReminder');
        if (!reminder) return;

        const { email, cartData, timestamp } = JSON.parse(reminder);
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

        // Check if 1 hour has passed and cart still has items
        if (Date.now() - timestamp >= oneHour) {
            const cart = JSON.parse(localStorage.getItem('1hundred_cart') || '[]');
            if (cart.length > 0) {
                // Calculate total
                const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
                await this.sendAbandonedCartEmail(email, {
                    ...cartData,
                    items: cart,
                    total
                });
            }
            // Clear the reminder
            localStorage.removeItem('1hundred_cartReminder');
        }
    },

    // Clear abandoned cart reminder (call after successful checkout)
    clearCartReminder() {
        localStorage.removeItem('1hundred_cartReminder');
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    EmailService.init('');
    EmailService.checkAbandonedCarts();
});

// Export for use in other scripts
window.EmailService = EmailService;
