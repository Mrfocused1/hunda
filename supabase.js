// ========================================
// Supabase Configuration
// ========================================

// SECURITY NOTE: The Supabase anon key is PUBLIC by design.
// It is safe to expose in client-side code. Row Level Security (RLS)
// policies protect your data. Never expose the service_role key here.
// Ensure debug functions exist (may not be defined yet if main.js loads after)
if (typeof window.debugLog !== 'function') window.debugLog = function () {};
if (typeof window.debugError !== 'function') window.debugError = function () {};

const SUPABASE_URL = 'https://keaxchpeotydepqwjooh.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXhjaHBlb3R5ZGVwcXdqb29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTQwNDEsImV4cCI6MjA5MTUzMDA0MX0.Uu-s2iUhzXTE3LeSfyA0XSVbQaFHY124AGrrN79BFRg';

let supabaseClient = null;

/**
 * Initialize Supabase client
 * @returns {Object|null} Supabase client or null if library not loaded
 */
function initSupabase() {
    try {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            debugLog('Supabase connected successfully');
            return supabaseClient;
        } else if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            debugLog('Supabase connected successfully');
            return supabaseClient;
        }
        debugLog('Supabase library not loaded yet');
        return null;
    } catch (error) {
        debugError('Failed to initialize Supabase:', error);
        return null;
    }
}

/**
 * Get Supabase client (initializes if needed)
 * @returns {Object|null} Supabase client
 */
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
}

// Admin helpers — find the Supabase JWT set by admin-login.html and build auth headers
// for /api/admin/* calls. Returns null if no valid session exists.
function getAdminAuthHeaders() {
    try {
        const raw = sessionStorage.getItem('1hundred_admin_session');
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (!session || !session.accessToken) return null;
        // Soft expiry check: expiresAt is Unix seconds
        if (session.expiresAt && Date.now() / 1000 > session.expiresAt) return null;
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`
        };
    } catch (e) {
        return null;
    }
}

async function adminFetch(path, method, body) {
    const headers = getAdminAuthHeaders();
    if (!headers) return { ok: false, reason: 'no-session' };
    try {
        const init = { method, headers };
        if (body !== undefined) init.body = JSON.stringify(body);
        const resp = await fetch(path, init);
        const json = await resp.json().catch(() => null);
        if (!resp.ok) return { ok: false, reason: 'http', status: resp.status, error: json?.error || resp.statusText };
        return { ok: true, data: json?.data ?? null };
    } catch (e) {
        return { ok: false, reason: 'network', error: e.message };
    }
}

// Storage API for image uploads
const StorageAPI = {
    // Upload a file to Supabase Storage
    async uploadFile(bucket, path, file, options = {}) {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.storage.from(bucket).upload(path, file, {
            cacheControl: '3600',
            upsert: true,
            ...options
        });

        if (error) return { data: null, error };

        // Get public URL
        const {
            data: { publicUrl }
        } = client.storage.from(bucket).getPublicUrl(data.path);

        return { data: { ...data, publicUrl }, error: null };
    },

    // Upload base64 image
    async uploadBase64(bucket, path, base64Data, contentType = 'image/png') {
        // Convert base64 to blob
        const base64Response = await fetch(base64Data);
        const blob = await base64Response.blob();

        return this.uploadFile(bucket, path, blob, {
            contentType
        });
    },

    // Delete a file
    async deleteFile(bucket, path) {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.storage.from(bucket).remove([path]);

        return { data, error };
    },

    // Get public URL for a file
    getPublicUrl(bucket, path) {
        const client = getSupabase();
        if (!client) return null;

        const {
            data: { publicUrl }
        } = client.storage.from(bucket).getPublicUrl(path);

        return publicUrl;
    }
};

// Product API
const ProductAPI = {
    // Get all products
    async getAll() {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.from('products').select('*').order('id', { ascending: true });

        return { data, error };
    },

    // Get single product by ID
    async getById(id) {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.from('products').select('*').eq('id', id).single();

        return { data, error };
    },

    // Get products by category
    async getByCategory(category) {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.from('products').select('*').eq('category', category);

        return { data, error };
    },

    // Create new product — prefers the admin API, falls back to direct anon write
    async create(product) {
        const admin = await adminFetch('/api/admin/products', 'POST', product);
        if (admin.ok) return { data: admin.data, error: null };
        if (admin.reason === 'http' && (admin.status === 401 || admin.status === 403)) {
            return { data: null, error: new Error(admin.error || 'Admin auth required') };
        }

        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client.from('products').insert([product]).select().single();
        return { data, error };
    },

    // Update product
    async update(id, updates) {
        const admin = await adminFetch('/api/admin/products', 'PUT', { id, ...updates });
        if (admin.ok) return { data: admin.data, error: null };
        if (admin.reason === 'http' && (admin.status === 401 || admin.status === 403)) {
            return { data: null, error: new Error(admin.error || 'Admin auth required') };
        }

        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client.from('products').update(updates).eq('id', id).select().single();
        return { data, error };
    },

    // Delete product
    async delete(id) {
        const admin = await adminFetch(`/api/admin/products?id=${encodeURIComponent(id)}`, 'DELETE');
        if (admin.ok) return { data: admin.data, error: null };
        if (admin.reason === 'http' && (admin.status === 401 || admin.status === 403)) {
            return { data: null, error: new Error(admin.error || 'Admin auth required') };
        }

        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client.from('products').delete().eq('id', id);
        return { data, error };
    }
};

// Media gallery API (photos + videos managed from the admin Media tab)
const MediaAPI = {
    async getAll() {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client
            .from('media_items')
            .select('*')
            .order('position', { ascending: true })
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async create(item) {
        const admin = await adminFetch('/api/admin/media', 'POST', item);
        if (admin.ok) return { data: admin.data, error: null };
        if (admin.reason === 'http' && (admin.status === 401 || admin.status === 403)) {
            return { data: null, error: new Error(admin.error || 'Admin auth required') };
        }

        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client.from('media_items').insert([item]).select().single();
        return { data, error };
    },

    async update(id, updates) {
        // No admin endpoint for update yet — go direct. Update is rare (reorder only).
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client.from('media_items').update(updates).eq('id', id).select().single();
        return { data, error };
    },

    async delete(id) {
        const admin = await adminFetch(`/api/admin/media?id=${encodeURIComponent(id)}`, 'DELETE');
        if (admin.ok) return { data: admin.data, error: null };
        if (admin.reason === 'http' && (admin.status === 401 || admin.status === 403)) {
            return { data: null, error: new Error(admin.error || 'Admin auth required') };
        }

        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client.from('media_items').delete().eq('id', id);
        return { data, error };
    }
};

// Generic site settings API (JSONB key/value store)
// Tolerates the table not existing yet — on the first PGRST205 (missing table) response we
// cache that fact for the rest of the session so every subsequent page load can skip the
// network call entirely. Self-heals on the next session once the SQL migration is run.
const SettingsAPI = {
    _cache: new Map(),

    _tableMissing() {
        try {
            return sessionStorage.getItem('_settings_table_missing') === '1';
        } catch (e) {
            return false;
        }
    },

    _markTableMissing() {
        try {
            sessionStorage.setItem('_settings_table_missing', '1');
        } catch (e) {
            /* ignore */
        }
    },

    async get(key, fallback = null) {
        if (this._tableMissing()) return fallback;
        const client = getSupabase();
        if (!client) return fallback;
        const { data, error } = await client.from('site_settings').select('value').eq('key', key).maybeSingle();
        if (error) {
            if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message || '')) {
                this._markTableMissing();
            }
            return fallback;
        }
        if (!data) return fallback;
        this._cache.set(key, data.value);
        return data.value;
    },

    async set(key, value) {
        const admin = await adminFetch('/api/admin/settings', 'PUT', { key, value });
        if (admin.ok) {
            this._cache.set(key, value);
            try {
                sessionStorage.removeItem('_settings_table_missing');
            } catch (e) {
                /* ignore */
            }
            return { data: admin.data, error: null };
        }
        if (admin.reason === 'http' && (admin.status === 401 || admin.status === 403)) {
            return { data: null, error: new Error(admin.error || 'Admin auth required') };
        }

        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };
        const { data, error } = await client
            .from('site_settings')
            .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
            .select()
            .single();
        if (!error) {
            this._cache.set(key, value);
            try {
                sessionStorage.removeItem('_settings_table_missing');
            } catch (e) {
                /* ignore */
            }
        }
        return { data, error };
    }
};

// Helper function to get product image URL
function getProductImageUrl(imagePath, bucket = 'product-images') {
    // If it's already a full URL, return as-is
    if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
        return imagePath;
    }

    // If it's a data URL (base64), return as-is
    if (imagePath && imagePath.startsWith('data:')) {
        return imagePath;
    }

    // If it looks like a Supabase Storage uploaded file (product-*-*.png), get public URL
    if (imagePath && /^product-[a-z0-9]+-\d+.*\.(png|jpe?g|webp|gif)$/i.test(imagePath)) {
        if (typeof StorageAPI !== 'undefined') {
            return StorageAPI.getPublicUrl(bucket, imagePath);
        }
        // Fallback: construct URL manually if StorageAPI not available
        return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${imagePath}`;
    }

    // If it's a simple local filename (no slashes, common image extensions), return as-is
    if (imagePath && !imagePath.includes('/') && /\.(png|jpe?g|webp|gif)$/i.test(imagePath)) {
        return imagePath;
    }

    // If it's a storage path (contains folder structure), get the public URL
    if (imagePath && imagePath.includes('/') && typeof StorageAPI !== 'undefined') {
        return StorageAPI.getPublicUrl(bucket, imagePath);
    }

    // Fallback: return the path as-is (for local files)
    return imagePath || 'product-1.png';
}

// Export for module usage (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getSupabase,
        ProductAPI,
        StorageAPI,
        MediaAPI,
        SettingsAPI,
        getProductImageUrl,
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    };
}
