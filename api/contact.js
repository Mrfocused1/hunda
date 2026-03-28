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

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        const { response, statusCode } = createResponse(false, null, 'Method not allowed', 405);
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
Name: ${name}
Email: ${email}
Subject: ${subject}
${orderNumber ? `Order Number: ${orderNumber}\n` : ''}
Message:
${message}

---
Sent from 1hundredornothing.co.uk/contact
    `.trim();

    try {
        // Send email via Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: process.env.FROM_EMAIL || 'hundredornothing@outlook.com',
                to: ['hundredornothing@outlook.com'],
                reply_to: email,
                subject: emailSubject,
                html: emailHtml,
                text: emailText
            })
        });

        const data = await response.json();

        if (!response.ok) {
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
    const div = { toString: () => text };
    if (typeof text !== 'string') return text;
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
