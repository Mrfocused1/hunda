// Resend API endpoint for contact form
// Requires RESEND_API_KEY environment variable

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, subject, orderNumber, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get API key from environment
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.error('RESEND_API_KEY not configured');
        return res.status(500).json({ error: 'Server configuration error' });
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
                from: process.env.FROM_EMAIL || 'contact@1hundredornothing.co.uk',
                to: ['hundredornothing@outlook.com'],
                reply_to: email,
                subject: emailSubject,
                html: emailHtml,
                text: emailText
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Resend API error:', data);
            return res.status(500).json({
                error: 'Failed to send email',
                details: data.message || 'Unknown error'
            });
        }

        console.log('Email sent successfully:', data.id);
        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            id: data.id
        });
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({
            error: 'Failed to send email',
            details: error.message
        });
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
