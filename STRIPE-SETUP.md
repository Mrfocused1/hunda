# Stripe Payment Integration Setup

This guide will help you connect your Stripe account to accept payments on your 1 HUNDRED website.

## Step 1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up for free
2. Complete your business profile
3. Stripe will start in **Test Mode** (perfect for testing)

## Step 2: Get Your API Keys

1. In your Stripe Dashboard, click **"Developers"** → **"API keys"**
2. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for testing)
   - **Secret key** (starts with `sk_test_` for testing)

> **Note:** When you're ready to go live, toggle to **"Live Mode"** and use the live keys instead.

## Step 3: Add Keys to Vercel Environment Variables

1. Go to [vercel.com](https://vercel.com) → Your project → **Settings** → **Environment Variables**
2. Add these variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | All |
| `STRIPE_SECRET_KEY` | `sk_test_...` | All |

3. Click **Save**

## Step 4: Test the Integration

1. Deploy your changes to Vercel (they happen automatically on git push)
2. Go to your website and add an item to cart
3. Go to checkout
4. Enter test card details:
   - **Card Number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., 12/25)
   - **CVC:** Any 3 digits (e.g., 123)
   - **Postcode:** Any valid UK postcode

5. Complete the order - it should succeed!

## Step 5: Go Live (When Ready)

1. In Stripe Dashboard, toggle **"Test Mode"** OFF
2. Copy your **Live** API keys
3. Update Vercel environment variables with live keys
4. Redeploy your site

## Test Card Numbers

Use these for testing different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

## How It Works

1. Customer enters card details in the secure Stripe Element
2. Stripe tokenizes the card (your server never sees raw card data)
3. Your server creates a Payment Intent with Stripe
4. Stripe confirms the payment
5. Order is completed and confirmation email is sent

## Security

- ✅ Card data never touches your server
- ✅ Stripe handles PCI compliance
- ✅ All transactions are encrypted
- ✅ 3D Secure supported automatically

## Troubleshooting

**"Payment failed" error:**
- Check that environment variables are set correctly in Vercel
- Verify you're using the right keys (test vs live)
- Check browser console for errors

**Stripe Element not showing:**
- Ensure you have internet connection (Stripe.js loads from CDN)
- Check browser console for JavaScript errors

**Need help?**
- Stripe docs: [stripe.com/docs](https://stripe.com/docs)
- Stripe test cards: [stripe.com/docs/testing](https://stripe.com/docs/testing)
