// Stripe Config API
// Returns publishable key to frontend (safe to expose)

// Standard API response format
function createResponse(success, data = null, error = null, statusCode = 200) {
    const response = { success };
    if (data) response.data = data;
    if (error) response.error = error;
    return { response, statusCode };
}

export default function handler(req, res) {
    if (req.method !== 'GET') {
        const { response, statusCode } = createResponse(false, null, 'Method not allowed', 405);
        return res.status(statusCode).json(response);
    }

    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
        const { response, statusCode } = createResponse(
            false,
            null,
            'Stripe not configured: STRIPE_PUBLISHABLE_KEY environment variable is missing',
            500
        );
        return res.status(statusCode).json(response);
    }

    const { response } = createResponse(
        true,
        {
            publishableKey: publishableKey,
            mode: publishableKey.startsWith('pk_test_') ? 'test' : 'live'
        },
        null,
        200
    );
    return res.status(200).json(response);
}
