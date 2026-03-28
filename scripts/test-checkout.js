/**
 * Checkout Testing Script
 * Run this in browser console on checkout page to test Stripe integration
 */

const CheckoutTester = {
    // Test if Stripe is loaded
    testStripeLoaded() {
        if (typeof Stripe === 'undefined') {
            console.error('❌ Stripe.js not loaded');
            return false;
        }
        console.log('✅ Stripe.js loaded');
        return true;
    },

    // Test if StripeService is initialized
    testStripeService() {
        if (typeof StripeService === 'undefined') {
            console.error('❌ StripeService not loaded');
            return false;
        }
        if (!StripeService.stripe) {
            console.error('❌ Stripe not initialized in StripeService');
            return false;
        }
        console.log('✅ StripeService initialized');
        return true;
    },

    // Test API endpoint
    async testStripeConfigAPI() {
        try {
            const response = await fetch('/api/stripe-config');
            const data = await response.json();

            if (data.success && data.data?.publishableKey) {
                console.log('✅ Stripe Config API working');
                console.log('   Mode:', data.data.mode);
                return true;
            } else {
                console.error('❌ Stripe Config API error:', data.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Stripe Config API failed:', error.message);
            return false;
        }
    },

    // Test payment intent creation
    async testPaymentIntent() {
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 10.0,
                    currency: 'gbp',
                    metadata: { test: true }
                })
            });

            const data = await response.json();

            if (data.success && data.data?.clientSecret) {
                console.log('✅ Payment Intent API working');
                return true;
            } else {
                console.error('❌ Payment Intent API error:', data.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Payment Intent API failed:', error.message);
            return false;
        }
    },

    // Run all tests
    async runAllTests() {
        console.log('🧪 Running Checkout Tests...\n');

        const results = {
            stripeLoaded: this.testStripeLoaded(),
            stripeService: this.testStripeService(),
            configAPI: await this.testStripeConfigAPI(),
            paymentIntent: await this.testPaymentIntent()
        };

        console.log('\n📊 Test Results:');
        const allPassed = Object.values(results).every((r) => r === true);

        if (allPassed) {
            console.log('✅ All tests passed! Payments should work.');
        } else {
            console.log('❌ Some tests failed. Check errors above.');
        }

        return results;
    }
};

// Auto-run if in browser
if (typeof window !== 'undefined') {
    window.CheckoutTester = CheckoutTester;
    console.log('CheckoutTester loaded. Run CheckoutTester.runAllTests() to test.');
}
