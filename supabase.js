// ========================================
// Supabase Configuration
// ========================================

// Initialize Supabase client
const SUPABASE_URL = 'https://wsgbnfoazvdkxpdqwgyo.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzZ2JuZm9henZka3hwZHF3Z3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDY4MTMsImV4cCI6MjA5MDEyMjgxM30.YUl4-O9q39Wn5xqUjp8S1F8VmTQH76PTIcQGpnrHXNE';

let supabaseClient = null;

// Initialize Supabase (works with both module and script tag approaches)
function initSupabase() {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase connected successfully');
        return supabaseClient;
    } else if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase connected successfully');
        return supabaseClient;
    }
    console.warn('⚠️ Supabase library not loaded yet');
    return null;
}

// Get Supabase client (initializes if needed)
function getSupabase() {
    if (!supabaseClient) {
        return initSupabase();
    }
    return supabaseClient;
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

    // Create new product
    async create(product) {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.from('products').insert([product]).select().single();

        return { data, error };
    },

    // Update product
    async update(id, updates) {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.from('products').update(updates).eq('id', id).select().single();

        return { data, error };
    },

    // Delete product
    async delete(id) {
        const client = getSupabase();
        if (!client) return { data: null, error: new Error('Supabase not initialized') };

        const { data, error } = await client.from('products').delete().eq('id', id);

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

    // If it's a storage path, get the public URL
    if (imagePath && typeof StorageAPI !== 'undefined') {
        return StorageAPI.getPublicUrl(bucket, imagePath);
    }

    // Fallback: return the path as-is (for local files)
    return imagePath || 'product-1.png';
}

// Export for module usage (if applicable)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getSupabase, ProductAPI, StorageAPI, getProductImageUrl, SUPABASE_URL, SUPABASE_ANON_KEY };
}
