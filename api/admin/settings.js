// Admin-only site settings write endpoint. Reads are still public (RLS allows
// anon SELECT on site_settings) so the intro popup and media nav toggle can look
// up their values without hitting this API.

import { requireAdmin, getAdminClient, validateOrigin, jsonError, jsonOk } from './_shared.js';

export default async function handler(req, res) {
    if (!validateOrigin(req)) return jsonError(res, 'Forbidden', 403);

    try {
        await requireAdmin(req);
    } catch (err) {
        return jsonError(res, err.message, err.statusCode || 401);
    }

    if (req.method !== 'PUT' && req.method !== 'POST') {
        return jsonError(res, 'Method not allowed', 405);
    }

    const { key, value } = req.body || {};
    if (!key || typeof key !== 'string') return jsonError(res, 'Missing key', 400);
    if (key.length > 64) return jsonError(res, 'Key too long', 400);

    const db = getAdminClient();
    const { data, error } = await db
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single();
    if (error) return jsonError(res, error.message, 500);
    return jsonOk(res, data);
}
