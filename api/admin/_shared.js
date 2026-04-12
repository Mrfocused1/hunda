// Shared helpers for /api/admin/* routes.
// Authenticates incoming requests via a Supabase JWT issued by the admin login flow,
// and exposes a Supabase client that uses the service_role key to bypass RLS for writes.

import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAILS = new Set([
    'admin@1hundredornothing.co.uk',
    'hundredornothing@outlook.com',
    'contact@hundredornothing.co.uk'
]);

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://keaxchpeotydepqwjooh.supabase.co';

// Lazy clients — one for auth verification (uses anon key), one for admin writes (service role).
let authClient = null;
let adminClient = null;

function getAuthClient() {
    if (authClient) return authClient;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!anonKey) return null;
    authClient = createClient(SUPABASE_URL, anonKey, { auth: { persistSession: false } });
    return authClient;
}

export function getAdminClient() {
    if (adminClient) return adminClient;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return null;
    adminClient = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } });
    return adminClient;
}

// Verify the JWT in the Authorization header. Returns the user object if valid and the
// user's email is in the admin whitelist; otherwise throws.
export async function requireAdmin(req) {
    const header = req.headers['authorization'] || req.headers['Authorization'];
    if (!header || !header.startsWith('Bearer ')) {
        const err = new Error('Missing or malformed Authorization header');
        err.statusCode = 401;
        throw err;
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) {
        const err = new Error('Empty bearer token');
        err.statusCode = 401;
        throw err;
    }

    const client = getAuthClient();
    if (!client) {
        const err = new Error('Auth system not configured');
        err.statusCode = 503;
        throw err;
    }

    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) {
        const err = new Error('Invalid or expired session');
        err.statusCode = 401;
        throw err;
    }

    const email = (data.user.email || '').toLowerCase();
    if (!ADMIN_EMAILS.has(email)) {
        const err = new Error('Not an admin account');
        err.statusCode = 403;
        throw err;
    }

    if (!getAdminClient()) {
        const err = new Error('Admin API not configured — set SUPABASE_SERVICE_ROLE_KEY in Vercel env vars');
        err.statusCode = 503;
        throw err;
    }

    return data.user;
}

// Validate the request origin against an allowlist (mirrors the pattern used by
// api/create-payment-intent.js). Blocks cross-origin writes.
export function validateOrigin(req) {
    const origin = req.headers['origin'];
    const referer = req.headers['referer'];
    const allowed = ['https://www.1hundredornothing.co.uk', 'https://1hundredornothing.co.uk', 'http://localhost:3000'];
    if (origin && allowed.some((a) => origin.startsWith(a))) return true;
    if (referer && allowed.some((a) => referer.startsWith(a))) return true;
    if (!origin && !referer) return true; // allow direct server-side calls / test runner
    return false;
}

export function jsonError(res, message, statusCode = 500) {
    return res.status(statusCode).json({ success: false, error: message });
}

export function jsonOk(res, data = null) {
    return res.status(200).json({ success: true, data });
}
