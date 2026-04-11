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

    // Create Apple Pay / Google Pay button via Express Checkout Element.
    // Link is explicitly disabled so wallets render as Apple/Google Pay on supported devices.
    // Resolves with the mounted element once the `ready` event reports a usable wallet,
    // or null if no wallet is available (caller hides the "More payment options" link in that case).
    async createPaymentRequestButton(containerId, { amount, label, productId, size, color, quantity }) {
        if (!this.stripe) {
            console.error('Stripe not initialized');
            return null;
        }

        const container = document.getElementById(containerId);
        if (!container) return null;

        const itemPence = Math.round(amount * quantity * 100);
        if (!itemPence || itemPence <= 0) {
            container.style.display = 'none';
            return null;
        }

        const shippingPence = amount * quantity >= 50 ? 0 : 499;
        const totalPence = itemPence + shippingPence;

        const elements = this.stripe.elements({
            mode: 'payment',
            amount: totalPence,
            currency: 'gbp',
            paymentMethodTypes: ['card', 'link', 'paypal'],
            appearance: { theme: 'stripe' }
        });

        const expressCheckoutElement = elements.create('expressCheckout', {
            buttonType: { applePay: 'buy', googlePay: 'buy', paypal: 'paypal' },
            buttonHeight: 48,
            layout: { maxColumns: 3, maxRows: 2 },
            paymentMethods: {
                applePay: 'always',
                googlePay: 'always',
                link: 'auto',
                paypal: 'auto'
            }
        });

        return new Promise((resolve) => {
            let settled = false;
            const settle = (value) => {
                if (settled) return;
                settled = true;
                resolve(value);
            };

            expressCheckoutElement.on('ready', (event) => {
                const methods = event.availablePaymentMethods || {};
                const hasAny = methods.applePay || methods.googlePay || methods.paypal || methods.link;
                if (!hasAny) {
                    container.style.display = 'none';
                    settle(null);
                    return;
                }
                settle(expressCheckoutElement);
            });

            expressCheckoutElement.on('loaderror', (event) => {
                console.error('[Express Checkout] load error:', event);
                container.style.display = 'none';
                settle(null);
            });

            expressCheckoutElement.on('click', (event) => {
                event.resolve({
                    emailRequired: true,
                    phoneNumberRequired: false,
                    shippingAddressRequired: true,
                    shippingRates: [
                        {
                            id: 'standard',
                            displayName: shippingPence === 0 ? 'Free Standard Shipping' : 'Standard Shipping',
                            amount: shippingPence,
                            deliveryEstimate: {
                                maximum: { unit: 'business_day', value: 5 },
                                minimum: { unit: 'business_day', value: 3 }
                            }
                        }
                    ],
                    allowedShippingCountries: ['GB']
                });
            });

            expressCheckoutElement.on('confirm', async (event) => {
                try {
                    const totalPounds = totalPence / 100;
                    const email = event.billingDetails?.email || '';
                    const fullName = event.billingDetails?.name || '';
                    const orderNumber = `1H-${Date.now().toString(36).toUpperCase()}`;

                    const intentData = await this.createPaymentIntent(
                        totalPounds,
                        {
                            orderNumber,
                            productId: String(productId),
                            size: String(size || ''),
                            color: String(color || ''),
                            quantity: String(quantity),
                            customerEmail: email,
                            customerName: fullName
                        },
                        [{ id: productId, price: amount, quantity }]
                    );

                    const clientSecret = intentData.clientSecret;

                    const { error: submitError } = await elements.submit();
                    if (submitError) {
                        console.error('[Express Checkout] submit error:', submitError);
                        if (typeof showToast !== 'undefined') showToast(submitError.message, 'error');
                        return;
                    }

                    const { error } = await this.stripe.confirmPayment({
                        elements,
                        clientSecret,
                        confirmParams: {
                            return_url: window.location.origin + '/checkout?success=true'
                        },
                        redirect: 'if_required'
                    });

                    if (error) {
                        console.error('[Express Checkout] confirm error:', error);
                        if (typeof showToast !== 'undefined') showToast(error.message || 'Payment failed. Please try again.', 'error');
                        return;
                    }

                    // Do NOT addToCart here — the item has already been paid for via the wallet.
                    // Clear any queued abandoned cart reminder so we don't nag the buyer.
                    if (typeof EmailService !== 'undefined') EmailService.clearCartReminder?.();

                    if (typeof showToast !== 'undefined') {
                        showToast('Payment successful! Order confirmed.', 'success');
                    }

                    const orders = JSON.parse(localStorage.getItem('1hundred_orders') || '[]');
                    orders.unshift({
                        id: orderNumber,
                        date: new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
                        status: 'processing',
                        items: [{ title: label, price: amount, quantity, size, color }],
                        total: totalPounds,
                        email,
                        customer: fullName || 'Customer'
                    });
                    localStorage.setItem('1hundred_orders', JSON.stringify(orders));
                } catch (err) {
                    console.error('[Express Checkout] payment error:', err);
                    if (typeof showToast !== 'undefined') showToast('Payment failed. Please try again.', 'error');
                }
            });

            expressCheckoutElement.mount(`#${containerId}`);
        });
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
