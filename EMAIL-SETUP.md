# Email Automation Setup

This document describes the complete email automation system set up for 1 HUNDRED using Resend API.

## Overview

The email system supports 4 types of automated transactional emails:

1. **Order Confirmation** - Sent immediately after purchase
2. **Shipping Notification** - Sent when order is marked as shipped
3. **Welcome Email** - Sent after account creation
4. **Abandoned Cart** - Sent 1 hour after cart abandonment (logged-in users only)

## Files Created/Modified

### API Endpoints
- `api/send-email.js` - Generic email sending endpoint with templates
- `api/contact.js` - Contact form email endpoint (already existed)

### Frontend Service
- `scripts/email-service.js` - Email service with settings checks and scheduling

### Page Integrations
- `checkout.html` - Order confirmation emails on purchase
- `signup.html` - Welcome emails on account creation
- `cart.html` - Abandoned cart scheduling
- `admin.html` - Email automation settings panel

### Admin Integration
- `admin.js` - Shipping notifications, email toggles, test email sending
- `main.js` - Abandoned cart scheduling on add-to-cart

## Email Templates

All templates include:
- 1 HUNDRED branding (black header)
- Personalized greeting with first name
- Relevant order/cart information
- Footer with contact email

### Order Confirmation
- Order number and total
- Itemized list with quantities
- Message about shipping notification

### Shipping Notification
- Order number
- Tracking number (if available)
- Carrier information (if available)

### Welcome Email
- Welcome message
- Shop now button
- Social media mention

### Abandoned Cart
- Cart items list
- Cart total
- Complete order button linking to cart

## Admin Panel Controls

Located in Admin → Emails tab:

- Toggle switches for each email type (on by default)
- Edit template buttons (for future use)
- Preview buttons with test data
- Send Test button to send actual test emails

## Environment Variables Required

```
RESEND_API_KEY=re_CQnA7NRL_24FVD4P2FGaYhCMa2XC3WVxV
FROM_EMAIL=hundredornothing@outlook.com
```

**Note:** Using `hundredornothing@outlook.com` as the verified sender. This email must be verified in your Resend dashboard.

## How It Works

### Order Confirmation
1. Customer completes checkout
2. `placeOrder()` in checkout.html generates order number
3. `EmailService.sendOrderConfirmation()` called
4. Email sent via `/api/send-email` endpoint
5. Cart reminder cleared (prevents abandoned cart email)

### Shipping Notification
1. Admin marks order as "shipped" in admin panel
2. `updateOrderStatus()` detects status change to shipped
3. `EmailService.sendShippingNotification()` called
4. Admin sees confirmation toast

### Welcome Email
1. User creates account on signup page
2. `EmailService.sendWelcomeEmail()` called after successful registration
3. User redirected to account page

### Abandoned Cart
1. Logged-in user adds item to cart
2. `EmailService.scheduleAbandonedCart()` stores reminder with timestamp
3. On page load, `EmailService.checkAbandonedCarts()` runs
4. If 1 hour passed and cart not empty, email is sent
5. Reminder cleared after checkout or email sent

## Settings Storage

Email settings stored in localStorage:
```javascript
localStorage.getItem('1hundred_email_settings')
// Returns: { 'order-confirmation': true, 'shipping-confirmation': true, 'abandoned-cart': true, 'welcome': true }
```

All email types default to **enabled** if no settings exist.

## Testing

Use the admin panel to send test emails:
1. Go to Admin → Emails
2. Click "Preview" on any email type
3. Click "Send Test" in the preview modal
4. Test email is sent to admin email address

## Troubleshooting

### Emails not sending
- Check Resend API key is configured in Vercel
- Verify FROM_EMAIL is set correctly
- Check browser console for errors
- Verify email type is enabled in admin settings

### Abandoned cart not working
- Only works for logged-in users (email required)
- Requires page refresh to check and send
- Cleared after checkout or email sent

### Sender Email Verification

The FROM email (`hundredornothing@outlook.com`) must be verified in Resend:
1. Go to Resend Dashboard → Domains
2. Add `hundredornothing@outlook.com` as a sender
3. Verify via the confirmation email
4. Emails will fail to send until verification is complete
