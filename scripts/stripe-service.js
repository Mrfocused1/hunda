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
    async createPaymentIntent(amount, metadata = {}, cartItems = []) {
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amount,
                    currency: 'gbp',
                    metadata: metadata,
                    items: cartItems
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (parseErr) {
                throw new Error('Invalid response from payment server');
            }

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

    // Create Apple Pay / Google Pay payment request button
    async createPaymentRequestButton(containerId, { amount, label, productId, size, color, quantity }) {
        if (!this.stripe) {
            console.error('Stripe not initialized');
            return null;
        }

        const container = document.getElementById(containerId);
        if (!container) return null;

        const paymentRequest = this.stripe.paymentRequest({
            country: 'GB',
            currency: 'gbp',
            total: {
                label: label || 'Total',
                amount: Math.round(amount * 100) // Stripe uses pence
            },
            requestPayerName: true,
            requestPayerEmail: true,
            requestShipping: true,
            shippingOptions: [
                {
                    id: 'standard',
                    label: 'Standard Shipping',
                    detail: '3-5 business days',
                    amount: amount >= 50 ? 0 : 499
                }
            ]
        });

        // Check if Apple Pay / Google Pay is available
        const result = await paymentRequest.canMakePayment();
        if (!result) {
            container.style.display = 'none';
            return null;
        }

        const elements = this.stripe.elements();
        const prButton = elements.create('paymentRequestButton', {
            paymentRequest: paymentRequest,
            style: {
                paymentRequestButton: {
                    type: 'buy',
                    theme: 'dark',
                    height: '56px'
                }
            }
        });

        prButton.mount(`#${containerId}`);

        // Handle the payment
        paymentRequest.on('paymentmethod', async (ev) => {
            try {
                // Create payment intent on server
                const intentData = await this.createPaymentIntent(Math.round(amount * 100), {
                    productId,
                    size,
                    color,
                    quantity: String(quantity)
                });

                const clientSecret = intentData.clientSecret;

                const { paymentIntent, error: confirmError } = await this.stripe.confirmCardPayment(
                    clientSecret,
                    { payment_method: ev.paymentMethod.id },
                    { handleActions: false }
                );

                if (confirmError) {
                    ev.complete('fail');
                    if (typeof showToast !== 'undefined') showToast(confirmError.message, 'error');
                    return;
                }

                if (paymentIntent.status === 'requires_action') {
                    const { error } = await this.stripe.confirmCardPayment(clientSecret);
                    if (error) {
                        ev.complete('fail');
                        if (typeof showToast !== 'undefined') showToast(error.message, 'error');
                        return;
                    }
                }

                ev.complete('success');

                // Add to cart and show success
                if (typeof addToCart === 'function') {
                    addToCart(productId, size, color, quantity);
                }

                if (typeof showToast !== 'undefined') {
                    showToast('Payment successful! Order confirmed.', 'success');
                }

                // Save order
                const orderNumber = `1H-${Date.now().toString(36).toUpperCase()}`;
                const orders = JSON.parse(localStorage.getItem('1hundred_orders') || '[]');
                orders.unshift({
                    id: orderNumber,
                    date: new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
                    status: 'processing',
                    items: [{ title: label, price: amount, quantity: quantity, size: size, color: color }],
                    total: amount,
                    email: ev.payerEmail,
                    customer: ev.payerName || 'Customer'
                });
                localStorage.setItem('1hundred_orders', JSON.stringify(orders));
            } catch (err) {
                ev.complete('fail');
                if (typeof showToast !== 'undefined') showToast('Payment failed. Please try again.', 'error');
                console.error('Payment request error:', err);
            }
        });

        return prButton;
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
