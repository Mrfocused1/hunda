// Generic email sending endpoint using Resend
// Supports: order-confirmation, shipping, welcome, abandoned-cart

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Escape HTML to prevent XSS in email templates
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// CSRF protection: verify request origin
function validateOrigin(req) {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];
    const allowed = ['https://www.1hundredornothing.co.uk', 'https://1hundredornothing.co.uk', 'http://localhost:3000'];
    if (origin && allowed.some((a) => origin.startsWith(a))) return true;
    if (referer && allowed.some((a) => referer.startsWith(a))) return true;
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

    // Rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
        const { response, statusCode } = createResponse(false, null, 'Too many requests. Please try again later.', 429);
        return res.status(statusCode).json(response);
    }

    const { type, to, data } = req.body;

    if (!type || !to || !data) {
        const { response, statusCode } = createResponse(false, null, 'Missing required fields: type, to, data', 400);
        return res.status(statusCode).json(response);
    }

    // Validate email format
    if (!EMAIL_REGEX.test(to)) {
        const { response, statusCode } = createResponse(false, null, 'Invalid recipient email address', 400);
        return res.status(statusCode).json(response);
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'contact@1hundredornothing.co.uk';

    if (!apiKey) {
        const { response, statusCode } = createResponse(false, null, 'Server configuration error', 500);
        return res.status(statusCode).json(response);
    }

    // Get email template based on type (with sanitized data)
    const template = getEmailTemplate(type, data);
    if (!template) {
        const { response, statusCode } = createResponse(false, null, 'Invalid email type', 400);
        return res.status(statusCode).json(response);
    }

    try {
        const fetchResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [to],
                subject: template.subject,
                html: template.html,
                text: template.text
            })
        });

        let result;
        try {
            result = await fetchResponse.json();
        } catch (parseError) {
            const { response: errorResponse, statusCode } = createResponse(
                false,
                null,
                'Invalid response from email service',
                502
            );
            return res.status(statusCode).json(errorResponse);
        }

        if (!fetchResponse.ok) {
            const { response: errorResponse, statusCode } = createResponse(
                false,
                null,
                result.message || 'Failed to send email',
                500
            );
            return res.status(statusCode).json(errorResponse);
        }

        const { response: successResponse } = createResponse(
            true,
            { id: result.id, message: 'Email sent successfully', type, to },
            null,
            200
        );
        return res.status(200).json(successResponse);
    } catch (error) {
        const { response: errorResponse, statusCode } = createResponse(
            false,
            null,
            error.message || 'Failed to send email',
            500
        );
        return res.status(statusCode).json(errorResponse);
    }
}

function getEmailTemplate(type, rawData) {
    // Sanitize all user-provided data
    const data = {
        firstName: escapeHtml(rawData.firstName || 'Customer'),
        orderNumber: escapeHtml(rawData.orderNumber || ''),
        total: escapeHtml(rawData.total || ''),
        trackingNumber: escapeHtml(rawData.trackingNumber || ''),
        carrier: escapeHtml(rawData.carrier || ''),
        discountCode: escapeHtml(rawData.discountCode || ''),
        items: (rawData.items || []).map((item) => ({
            name: escapeHtml(item.name || ''),
            price: escapeHtml(item.price || ''),
            quantity: escapeHtml(String(item.quantity || 1))
        }))
    };

    const templates = {
        'order-confirmation': {
            subject: `Order Confirmation #${data.orderNumber} - 1 HUNDRED OR NOTHING`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
                    <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">1 HUNDRED OR NOTHING</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="font-size: 20px; margin-bottom: 20px;">Thank you for your order!</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>We've received your order and are preparing it for shipment.</p>

                        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                            <h3 style="margin-top: 0;">Order #${data.orderNumber}</h3>
                            <p><strong>Total:</strong> £${data.total}</p>
                            <p><strong>Items:</strong></p>
                            <ul>
                                ${data.items.map((item) => `<li>${item.name} - £${item.price} x ${item.quantity}</li>`).join('')}
                            </ul>
                        </div>

                        <p>We'll send you another email when your order ships.</p>
                        <p>Thanks for shopping with us!</p>
                    </div>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p>1 HUNDRED OR NOTHING | No half measures.</p>
                        <p>Questions? Contact us at contact@1hundredornothing.co.uk</p>
                    </div>
                </div>
            `,
            text: `Thank you for your order!\n\nHi ${data.firstName},\n\nWe've received your order and are preparing it for shipment.\n\nOrder #${data.orderNumber}\nTotal: £${data.total}\n\nWe'll send you another email when your order ships.\n\nThanks for shopping with us!\n\n1 HUNDRED OR NOTHING | No half measures.`
        },

        shipping: {
            subject: `Your Order #${data.orderNumber} Has Shipped! - 1 HUNDRED OR NOTHING`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
                    <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">1 HUNDRED OR NOTHING</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="font-size: 20px; margin-bottom: 20px;">Your order is on the way!</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>Great news! Your order has been shipped and is on its way to you.</p>

                        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                            <h3 style="margin-top: 0;">Order #${data.orderNumber}</h3>
                            ${data.trackingNumber ? `<p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
                            ${data.carrier ? `<p><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
                        </div>

                        <p>Thanks for your patience!</p>
                    </div>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p>1 HUNDRED OR NOTHING | No half measures.</p>
                        <p>Questions? Contact us at contact@1hundredornothing.co.uk</p>
                    </div>
                </div>
            `,
            text: `Your order is on the way!\n\nHi ${data.firstName},\n\nGreat news! Your order has been shipped and is on its way to you.\n\nOrder #${data.orderNumber}\n${data.trackingNumber ? `Tracking: ${data.trackingNumber}\n` : ''}${data.carrier ? `Carrier: ${data.carrier}\n` : ''}\n\nThanks for your patience!\n\n1 HUNDRED OR NOTHING | No half measures.`
        },

        welcome: {
            subject: 'Welcome to 1 HUNDRED OR NOTHING!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
                    <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">1 HUNDRED OR NOTHING</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="font-size: 20px; margin-bottom: 20px;">Welcome to the family!</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>Welcome to 1 HUNDRED OR NOTHING! We're excited to have you on board.</p>
                        ${data.discountCode ? `
                        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
                            <p style="margin: 0 0 8px; font-size: 14px;">Your exclusive discount code:</p>
                            <p style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${data.discountCode}</p>
                            <p style="margin: 8px 0 0; font-size: 14px; color: #666;">Use at checkout for 10% off your first order</p>
                        </div>
                        ` : ''}
                        <p>Start exploring our latest collection and find your new favorite pieces.</p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://www.1hundredornothing.co.uk/shop" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; text-transform: uppercase; font-weight: bold;">Shop Now</a>
                        </div>

                        <p>Follow us on social media for exclusive drops and behind-the-scenes content.</p>
                    </div>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p>1 HUNDRED OR NOTHING | No half measures.</p>
                        <p>Questions? Contact us at contact@1hundredornothing.co.uk</p>
                    </div>
                </div>
            `,
            text: `Welcome to 1 HUNDRED OR NOTHING!\n\nHi ${data.firstName},\n\nWelcome to the family! We're excited to have you on board.\n\n${data.discountCode ? `Your discount code: ${data.discountCode}\nUse at checkout for 10% off your first order.\n\n` : ''}Start exploring our latest collection:\nhttps://www.1hundredornothing.co.uk/shop\n\n1 HUNDRED OR NOTHING | No half measures.`
        },

        'abandoned-cart': {
            subject: 'You left something behind... - 1 HUNDRED OR NOTHING',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
                    <div style="background: #000; color: #fff; padding: 20px; text-align: center;">
                        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">1 HUNDRED OR NOTHING</h1>
                    </div>
                    <div style="padding: 30px 20px;">
                        <h2 style="font-size: 20px; margin-bottom: 20px;">Your cart is waiting...</h2>
                        <p>Hi ${data.firstName},</p>
                        <p>Looks like you left some items in your cart. Complete your order now and don't miss out!</p>

                        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                            <h3 style="margin-top: 0;">Your Cart</h3>
                            <ul>
                                ${data.items.map((item) => `<li>${item.name} - £${item.price}</li>`).join('')}
                            </ul>
                            <p style="font-weight: bold;">Total: £${data.total}</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://www.1hundredornothing.co.uk/cart" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; display: inline-block; text-transform: uppercase; font-weight: bold;">Complete Order</a>
                        </div>
                    </div>
                    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                        <p>1 HUNDRED OR NOTHING | No half measures.</p>
                        <p>Questions? Contact us at contact@1hundredornothing.co.uk</p>
                    </div>
                </div>
            `,
            text: `You left something behind...\n\nHi ${data.firstName},\n\nLooks like you left some items in your cart. Complete your order now!\n\nTotal: £${data.total}\n\nComplete your order:\nhttps://www.1hundredornothing.co.uk/cart\n\n1 HUNDRED OR NOTHING | No half measures.`
        }
    };

    return templates[type];
}
