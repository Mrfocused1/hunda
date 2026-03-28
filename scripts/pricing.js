// ========================================
// Pricing & Tax Calculation Utilities
// ========================================

const Pricing = {
    // Tax rates by country code
    taxRates: {
        GB: 0.2, // UK VAT
        US: 0.0, // No federal VAT (varies by state)
        CA: 0.13, // Canadian GST/HST (varies by province)
        AU: 0.1, // Australian GST
        DE: 0.19, // Germany VAT
        FR: 0.2, // France VAT
        IT: 0.22, // Italy VAT
        ES: 0.21, // Spain VAT
        NL: 0.21, // Netherlands VAT
        IE: 0.23, // Ireland VAT
        AT: 0.2, // Austria VAT
        BE: 0.21, // Belgium VAT
        CH: 0.077, // Switzerland VAT
        SE: 0.25, // Sweden VAT
        NO: 0.25, // Norway VAT
        DK: 0.25, // Denmark VAT
        FI: 0.24 // Finland VAT
    },

    // Default tax rate (UK)
    defaultTaxRate: 0.2,

    // Free shipping threshold
    freeShippingThreshold: 50,

    // Standard shipping cost
    standardShippingCost: 4.99,

    /**
     * Get tax rate for a country
     * @param {string} countryCode - 2-letter country code
     * @returns {number} Tax rate (e.g., 0.20 for 20%)
     */
    getTaxRate(countryCode) {
        if (!countryCode) return this.defaultTaxRate;
        return this.taxRates[countryCode.toUpperCase()] || this.defaultTaxRate;
    },

    /**
     * Calculate tax amount
     * @param {number} subtotal - Subtotal before tax
     * @param {string} countryCode - 2-letter country code
     * @returns {number} Tax amount
     */
    calculateTax(subtotal, countryCode = 'GB') {
        const rate = this.getTaxRate(countryCode);
        return subtotal * rate;
    },

    /**
     * Calculate shipping cost
     * @param {number} subtotal - Cart subtotal
     * @param {string} countryCode - 2-letter country code
     * @returns {number} Shipping cost
     */
    calculateShipping(subtotal, countryCode = 'GB') {
        // Free shipping for UK orders over threshold
        if (countryCode === 'GB' && subtotal >= this.freeShippingThreshold) {
            return 0;
        }

        // International shipping (simplified - would be more complex in real app)
        if (countryCode !== 'GB') {
            return this.standardShippingCost + 5.0; // Extra for international
        }

        return subtotal >= this.freeShippingThreshold ? 0 : this.standardShippingCost;
    },

    /**
     * Calculate order totals
     * @param {number} subtotal - Cart subtotal
     * @param {string} countryCode - 2-letter country code
     * @param {string} discountCode - Optional discount code
     * @returns {Object} Complete pricing breakdown
     */
    calculateTotals(subtotal, countryCode = 'GB', discountCode = null) {
        const shipping = this.calculateShipping(subtotal, countryCode);
        const discount = this.calculateDiscount(subtotal, discountCode);
        const taxableAmount = subtotal - discount;
        const tax = this.calculateTax(taxableAmount, countryCode);
        const total = taxableAmount + shipping + tax;

        return {
            subtotal: subtotal,
            shipping: shipping,
            shippingDisplay: shipping === 0 ? 'Free' : `£${shipping.toFixed(2)}`,
            discount: discount,
            discountDisplay: discount > 0 ? `-£${discount.toFixed(2)}` : null,
            tax: tax,
            taxRate: this.getTaxRate(countryCode),
            total: total,
            isFreeShipping: shipping === 0
        };
    },

    /**
     * Calculate discount amount
     * @param {number} subtotal - Cart subtotal
     * @param {string} code - Discount code
     * @returns {number} Discount amount
     */
    calculateDiscount(subtotal, code) {
        if (!code) return 0;

        const codeUpper = code.toUpperCase();

        // Percentage discounts
        if (codeUpper === 'SAVE15') {
            return subtotal * 0.15;
        }
        if (codeUpper === 'SAVE10') {
            return subtotal * 0.1;
        }

        // Fixed amount discounts
        if (codeUpper === 'WELCOME10') {
            return Math.min(10, subtotal); // £10 off, not more than subtotal
        }
        if (codeUpper === 'WELCOME20') {
            return Math.min(20, subtotal); // £20 off, not more than subtotal
        }

        return 0;
    },

    /**
     * Validate discount code
     * @param {string} code - Discount code to validate
     * @returns {Object} Validation result
     */
    validateDiscountCode(code) {
        const validCodes = ['SAVE10', 'SAVE15', 'WELCOME10', 'WELCOME20'];
        const isValid = validCodes.includes(code?.toUpperCase());

        return {
            valid: isValid,
            code: code?.toUpperCase(),
            message: isValid ? 'Valid discount code' : 'Invalid discount code'
        };
    },

    /**
     * Format price for display
     * @param {number} price - Price value
     * @param {string} currency - Currency code (default: GBP)
     * @returns {string} Formatted price
     */
    formatPrice(price, currency = 'GBP') {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency
        }).format(price);
    },

    /**
     * Get shipping message for display
     * @param {number} subtotal - Current subtotal
     * @param {string} countryCode - Country code
     * @returns {string} Shipping message
     */
    getShippingMessage(subtotal, countryCode = 'GB') {
        const remaining = this.freeShippingThreshold - subtotal;

        if (countryCode !== 'GB') {
            return 'International shipping calculated at checkout';
        }

        if (remaining <= 0) {
            return '✓ You qualify for free shipping!';
        }

        return `Add £${remaining.toFixed(2)} more for free shipping`;
    }
};

// Expose globally
window.Pricing = Pricing;
