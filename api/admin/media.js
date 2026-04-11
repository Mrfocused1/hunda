// Admin-only media gallery CRUD. Mirrors api/admin/products.js but for the
// media_items table used by the public /media page.

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
        const item = req.body || {};
        if (!item.type || !['image', 'video'].includes(item.type)) {
            return jsonError(res, 'Invalid media type', 400);
        }
        if (!item.url || typeof item.url !== 'string') {
            return jsonError(res, 'Missing media url', 400);
        }
        const payload = {
            type: item.type,
            url: item.url,
            thumbnail_url: item.thumbnail_url || null,
            title: (item.title || '').slice(0, 200),
            position: Number.isFinite(item.position) ? item.position : 0
        };
        const { data, error } = await db.from('media_items').insert([payload]).select().single();
        if (error) return jsonError(res, error.message, 500);
        return jsonOk(res, data);
    }

    if (req.method === 'DELETE') {
        const id = req.query?.id || req.body?.id;
        if (!id) return jsonError(res, 'Missing media id', 400);
        const { error } = await db.from('media_items').delete().eq('id', id);
        if (error) return jsonError(res, error.message, 500);
        return jsonOk(res, { id });
    }

    return jsonError(res, 'Method not allowed', 405);
}
