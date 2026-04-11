// Stripe Payment Intent API
// Creates a payment intent for secure checkout

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Standard API response format
function createResponse(success, data = null, error = null, statusCode = 200) {
    const response = { success };
    if (data) response.data = data;
    if (error) response.error = error;
    return { response, statusCode };
}

// Simple in-memory rate limiter (per serverless instance)
const rateLimitMap = new Map();
function checkRateLimit(ip, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.start > windowMs) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return true;
    }
    entry.count++;
    return entry.count <= maxRequests;
}

// Known product prices for server-side validation
const PRODUCT_PRICES = {
    3: 30,  // 1H Star Cap
    4: 85,  // The No Half Measures Hoodie
    5: 85,  // Endless Possibilities Hoodie
    6: 30,  // 1H Multi Colour Cap
    7: 40,  // Relentless Trophy Tee
    9: 40   // 100MPH Tee
};

const SHIPPING_COST = 4.99;
const FREE_SHIPPING_THRESHOLD = 50;

// Known discount codes — single source of truth. Values are percentage rates (0.1 = 10% off).
// Keep in sync with cart.html applyPromoCode + the intro popup code in main.js.
const DISCOUNT_CODES = {
    WELCOME10: 0.1,
    SAVE10: 0.1,
    SAVE15: 0.15
};

// CSRF protection: verify request origin
function validateOrigin(req) {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];
    const allowed = ['https://www.1hundredornothing.co.uk', 'https://1hundredornothing.co.uk', 'http://localhost:3000'];
    if (origin && allowed.some((a) => origin.startsWith(a))) return true;
    if (referer && allowed.some((a) => referer.startsWith(a))) return true;
    // Allow in development when no origin (e.g., server-side calls)
    if (!origin && !referer) return true;
    return false;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        const { response, statusCode } = createResponse(false, null, 'Method not allowed', 405);
        return res.status(statusCode).json(response);
    }

    // CSRF: reject cross-origin requests
    if (!validateOrigin(req)) {
        const { response, statusCode } = createResponse(false, null, 'Forbidden', 403);
        return res.status(statusCode).json(response);
    }

    // Validate environment
    if (!process.env.STRIPE_SECRET_KEY) {
        const { response, statusCode } = createResponse(false, null, 'Payment system not configured', 500);
        return res.status(statusCode).json(response);
    }

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        const { response, statusCode } = createResponse(false, null, 'Too many requests. Please try again later.', 429);
        return res.status(statusCode).json(response);
    }

    try {
        const { amount, currency = 'gbp', metadata = {}, items = [], discountCode: rawDiscountCode } = req.body;

        // Validate amount
        if (!amount || typeof amount !== 'number' || amount <= 0) {
            const { response, statusCode } = createResponse(false, null, 'Invalid amount', 400);
            return res.status(statusCode).json(response);
        }

        // Validate amount is reasonable (under £10,000)
        if (amount > 10000) {
            const { response, statusCode } = createResponse(false, null, 'Amount exceeds maximum', 400);
            return res.status(statusCode).json(response);
        }

        // Validate the discount code (if any) against the server-side whitelist
        let discountRate = 0;
        let appliedDiscountCode = '';
        if (rawDiscountCode) {
            const code = String(rawDiscountCode).toUpperCase().slice(0, 32);
            if (DISCOUNT_CODES[code] !== undefined) {
                discountRate = DISCOUNT_CODES[code];
                appliedDiscountCode = code;
            } else {
                const { response, statusCode } = createResponse(false, null, 'Invalid discount code', 400);
                return res.status(statusCode).json(response);
            }
        }

        // Server-side price verification: if cart items are provided, validate total
        if (items && Array.isArray(items) && items.length > 0) {
            let expectedSubtotal = 0;
            for (const item of items) {
                const knownPrice = PRODUCT_PRICES[item.id];
                if (knownPrice !== undefined) {
                    if (Math.abs(item.price - knownPrice) > 0.01) {
                        const { response, statusCode } = createResponse(false, null, 'Price mismatch detected. Please refresh and try again.', 400);
                        return res.status(statusCode).json(response);
                    }
                    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
                    expectedSubtotal += knownPrice * qty;
                }
            }

            // Expected total = subtotal * (1 - discount) + shipping (free over threshold)
            const expectedShipping = expectedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
            const expectedTotal = expectedSubtotal * (1 - discountRate) + expectedShipping;
            // Range-check both directions with a few pence of float tolerance:
            // - Too high protects the customer from accidental overcharge
            // - Too low prevents undercharge fraud (user crafting a fake discount in localStorage)
            if (expectedSubtotal > 0 && (amount > expectedTotal + 0.02 || amount < expectedTotal - 0.02)) {
                const { response, statusCode } = createResponse(false, null, 'Order total mismatch. Please refresh and try again.', 400);
                return res.status(statusCode).json(response);
            }
        }

        // Sanitize metadata - only allow known fields
        const safeMetadata = {
            orderNumber: String(metadata.orderNumber || '').slice(0, 50),
            customerEmail: String(metadata.customerEmail || '').slice(0, 100),
            customerName: String(metadata.customerName || '').slice(0, 100),
            discountCode: appliedDiscountCode,
            site: '1hundredornothing.co.uk'
        };

        // Build an idempotency key so retries within 24h return the same PaymentIntent
        // instead of creating a new one. Prefer the client-supplied orderNumber (which the
        // checkout flow generates fresh per attempt), fall back to a hash-ish composite.
        const idemKey =
            safeMetadata.orderNumber ||
            `pi-${Math.round(amount * 100)}-${safeMetadata.customerEmail || 'anon'}-${Date.now()}`;

        // Create payment intent with Stripe (idempotent)
        const paymentIntent = await stripe.paymentIntents.create(
            {
                amount: Math.round(amount * 100), // Convert to pence/cents
                currency: currency.toLowerCase(),
                automatic_payment_methods: { enabled: true },
                metadata: safeMetadata
            },
            { idempotencyKey: idemKey }
        );

        const { response } = createResponse(
            true,
            {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id
            },
            null,
            200
        );
        return res.status(200).json(response);
    } catch (error) {
        const { response, statusCode } = createResponse(
            false,
            null,
            error.message || 'Failed to create payment intent',
            500
        );
        return res.status(statusCode).json(response);
    }
}
