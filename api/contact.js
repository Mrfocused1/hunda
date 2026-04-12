// Resend API endpoint for contact form
// Requires RESEND_API_KEY environment variable

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
function checkRateLimit(ip, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);
    if (!entry || now - entry.start > windowMs) {
        rateLimitMap.set(ip, { start: now, count: 1 });
        return true;
    }
    entry.count++;
    return entry.count <= maxRequests;
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
    // Only allow POST requests
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

    const { name, email, subject, orderNumber, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
        const { response, statusCode } = createResponse(false, null, 'Missing required fields', 400);
        return res.status(statusCode).json(response);
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
        const { response, statusCode } = createResponse(false, null, 'Invalid email address', 400);
        return res.status(statusCode).json(response);
    }

    // Validate name length (prevent spam)
    if (name.length > 100 || subject.length > 200 || message.length > 5000) {
        const { response, statusCode } = createResponse(false, null, 'Input too long', 400);
        return res.status(statusCode).json(response);
    }

    // Get API key from environment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        const { response, statusCode } = createResponse(false, null, 'Server configuration error', 500);
        return res.status(statusCode).json(response);
    }

    // Construct email content
    const emailSubject = `1 HUNDRED Contact: ${subject}${orderNumber ? ` (Order: ${orderNumber})` : ''}`;

    const emailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        ${orderNumber ? `<p><strong>Order Number:</strong> ${escapeHtml(orderNumber)}</p>` : ''}
        <hr>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Sent from 1hundredornothing.co.uk/contact</p>
    `;

    const emailText = `
Name: ${escapeHtml(name)}
Email: ${escapeHtml(email)}
Subject: ${escapeHtml(subject)}
${orderNumber ? `Order Number: ${escapeHtml(orderNumber)}\n` : ''}
Message:
${escapeHtml(message)}

---
Sent from 1hundredornothing.co.uk/contact
    `.trim();

    try {
        // Send email via Resend API
        const fetchResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: process.env.FROM_EMAIL || 'contact@1hundredornothing.co.uk',
                to: ['contact@1hundredornothing.co.uk'],
                reply_to: email,
                subject: emailSubject,
                html: emailHtml,
                text: emailText
            })
        });

        let data;
        try {
            data = await fetchResponse.json();
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
                data.message || 'Failed to send email',
                500
            );
            return res.status(statusCode).json(errorResponse);
        }

        const { response: successResponse } = createResponse(
            true,
            { id: data.id, message: 'Email sent successfully' },
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

// Helper function to escape HTML
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
