// Admin-only product CRUD. Requires a valid Supabase Auth JWT from an email in the
// admin whitelist. Uses the service_role Supabase client so writes still succeed
// once the products table is locked down to SELECT-only for anon.

import { requireAdmin, getAdminClient, validateOrigin, jsonError, jsonOk } from './_shared.js';

export default async function handler(req, res) {
    if (!validateOrigin(req)) return jsonError(res, 'Forbidden', 403);

    try {
        await requireAdmin(req);
    } catch (err) {
        return jsonError(res, err.message, err.statusCode || 401);
    }

    const db = getAdminClient();

    if (req.method === 'POST') {
        const product = req.body || {};
        if (!product.title || typeof product.price !== 'number' || product.price < 0) {
            return jsonError(res, 'Invalid product payload', 400);
        }
        const { data, error } = await db.from('products').insert([product]).select().single();
        if (error) return jsonError(res, error.message, 500);
        return jsonOk(res, data);
    }

    if (req.method === 'PUT') {
        const { id, ...updates } = req.body || {};
        if (!id) return jsonError(res, 'Missing product id', 400);
        if ('price' in updates && (typeof updates.price !== 'number' || updates.price < 0)) {
            return jsonError(res, 'Invalid price', 400);
        }
        const { data, error } = await db.from('products').update(updates).eq('id', id).select().single();
        if (error) return jsonError(res, error.message, 500);
        return jsonOk(res, data);
    }

    if (req.method === 'DELETE') {
        const id = req.query?.id || req.body?.id;
        if (!id) return jsonError(res, 'Missing product id', 400);
        const { error } = await db.from('products').delete().eq('id', id);
        if (error) return jsonError(res, error.message, 500);
        return jsonOk(res, { id });
    }

    return jsonError(res, 'Method not allowed', 405);
}
