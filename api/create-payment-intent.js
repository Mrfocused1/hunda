// Stripe Payment Intent API
// Creates a payment intent for secure checkout

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Standard API response format
function createResponse(success, data = null, error = null, statusCode = 200) {
    const response = { success };
    if (data) response.data = data;
    if (error) response.error = error;
    return { response, statusCode };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        const { response, statusCode } = createResponse(false, null, 'Method not allowed', 405);
        return res.status(statusCode).json(response);
    }

    try {
        const { amount, currency = 'gbp', metadata = {} } = req.body;

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

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to pence/cents
            currency: currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true
            },
            metadata: {
                ...metadata,
                site: '1hundredornothing.co.uk'
            }
        });

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
