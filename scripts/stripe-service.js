// Stripe Payment Service
// Handles Stripe Elements integration for secure card payments

const StripeService = {
    stripe: null,
    elements: null,
    cardElement: null,
    publishableKey: null,

    // Initialize Stripe with publishable key
    async init(publishableKey) {
        if (!publishableKey) {
            console.error('Stripe publishable key not provided');
            return false;
        }

        this.publishableKey = publishableKey;

        // Load Stripe.js if not already loaded
        if (!window.Stripe) {
            await this.loadStripeScript();
        }

        this.stripe = window.Stripe(publishableKey);
        return true;
    },

    // Load Stripe.js script dynamically
    loadStripeScript() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // Create payment intent on server
    async createPaymentIntent(amount, metadata = {}) {
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    currency: 'gbp',
                    metadata: metadata
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment intent');
            }

            return data.data || data;
        } catch (error) {
            console.error('Payment intent error:', error);
            throw error;
        }
    },

    // Mount card element to DOM
    mountCardElement(containerId) {
        if (!this.stripe) {
            console.error('Stripe not initialized');
            return null;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container #${containerId} not found`);
            return null;
        }

        // Create elements instance
        this.elements = this.stripe.elements({
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#111111',
                    colorBackground: '#ffffff',
                    colorText: '#111111',
                    colorDanger: '#ef4444',
                    borderRadius: '0px',
                    fontFamily: 'Inter, sans-serif'
                }
            }
        });

        // Create and mount card element
        this.cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#111111',
                    '::placeholder': {
                        color: '#9ca3af'
                    }
                },
                invalid: {
                    color: '#ef4444'
                }
            },
            hidePostalCode: true // We collect postcode separately
        });

        this.cardElement.mount(`#${containerId}`);

        // Return element for event handling
        return this.cardElement;
    },

    // Confirm payment with Stripe
    async confirmPayment(clientSecret, billingDetails = {}) {
        if (!this.stripe || !this.cardElement) {
            throw new Error('Stripe not properly initialized');
        }

        const { paymentIntent, error } = await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: this.cardElement,
                billing_details: billingDetails
            }
        });

        if (error) {
            throw new Error(error.message);
        }

        return paymentIntent;
    },

    // Unmount card element
    unmount() {
        if (this.cardElement) {
            this.cardElement.unmount();
            this.cardElement = null;
        }
        this.elements = null;
    }
};

// Export for use in other scripts
window.StripeService = StripeService;
