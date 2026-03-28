/**
 * Product Configuration - Single Source of Truth
 * All product data is defined here and imported by other files
 */

const PRODUCTS_CONFIG = {
    // Product slug mappings for clean URLs
    slugs: {
        3: '1h-star-cap',
        4: 'no-half-measures-hoodie',
        5: 'endless-possibilities-hoodie',
        6: '1h-multi-colour-cap',
        7: 'relentless-trophy-tee',
        8: '1hundred-ornothing-hoodie'
    },

    // Get URL for a product
    getProductUrl(productId) {
        return this.slugs[productId] ? `/${this.slugs[productId]}` : `/product?id=${productId}`;
    },

    // Get product ID from slug
    getProductIdFromSlug(slug) {
        const entry = Object.entries(this.slugs).find(([id, s]) => s === slug);
        return entry ? parseInt(entry[0]) : null;
    },

    // Default fallback products (used when Supabase is unavailable)
    fallbackProducts: [
        {
            id: 3,
            title: '1H Star Cap',
            price: 30,
            category: 'Hats',
            images: ['product-3.png'],
            sizes: ['One Size'],
            colors: ['White/Black'],
            stock: 12,
            description: `1H Star Cap (Black & White)

A refined essential, the 1H Star Cap is defined by contrast, structure, and intent. Rendered in a distressed black and white finish, the design carries a worn-in character that speaks to experience, not excess.

The front is anchored by the signature 1H star emblem, a symbol of commitment at the highest level. Clean yet commanding, it reflects a mindset built on discipline and consistency.

At the back, the statement "No Half Measures" is subtly placed—reinforcing the philosophy behind the piece. Every detail is deliberate, from the curved brim to the structured crown, balancing durability with a sharp, elevated silhouette.

Understated. Focused. Uncompromising.

All or nothing.`
        },
        {
            id: 4,
            title: 'The No Half Measures Hoodie',
            price: 85,
            category: 'Hoodies',
            images: ['product-4.jpeg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Black'],
            stock: 8,
            description: `The No Half Measures Hoodie

The No Half Measures Hoodie is a study in precision and intent. Rendered in deep black with a subtle tonal pattern, the piece is defined by its layered composition—balancing restraint with quiet complexity.

A collage of monochrome portrait graphics introduces a raw, expressive edge, contrasted by the structured 1H insignia, a symbol of total commitment. Minimal text detailing reinforces the philosophy: nothing partial, nothing diluted.

Refined embellishments are placed with purpose, adding texture without excess. The silhouette remains clean and controlled, offering a relaxed fit that moves effortlessly between statement and staple.

Every element is considered. Nothing is accidental.

All in. Always.`
        },
        {
            id: 5,
            title: 'Endless Possibilities Hoodie',
            price: 85,
            category: 'Hoodies',
            images: ['product-5.jpeg'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Blue'],
            stock: 15,
            description: `Endless Possibilities Hoodie

A refined expression of intent, the Endless Possibilities Hoodie is defined by its balance of structure and ease. Crafted in a washed blue finish, the silhouette is relaxed yet precise, offering a quiet sense of presence.

The signature 1H mark anchors the piece, while subtle text detailing speaks to a mindset of limitless direction. Studded accents introduce a restrained edge, complementing the garment's considered construction and tactile depth.

Understated yet deliberate, this piece moves beyond trend—designed for those who operate with clarity and purpose.

Without limits.`
        },
        {
            id: 6,
            title: '1H Multi Colour Cap',
            price: 30,
            category: 'Hats',
            images: ['product-6.jpeg'],
            sizes: ['One Size'],
            colors: ['White/Black'],
            stock: 20,
            description: 'Colorful trucker hat with 1H branding.'
        },
        {
            id: 7,
            title: 'Relentless Trophy Tee',
            price: 40,
            category: 'Tops',
            images: ['product-relentless-front.png', 'product-relentless-back.png'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Grey'],
            stock: 25,
            description: `The Relentless Trophy Tee distills discipline into design. A monochrome composition of a faceless, armored figure holding its reward—symbolizing victory earned through persistence, not chance.

Refined, understated, and intentional, this piece speaks to those who pursue excellence without compromise.

Earned. Never given.`
        },
        {
            id: 8,
            title: '1Hundred OrNothing Hoodie',
            price: 85,
            category: 'Hoodies',
            images: ['product-2.png'],
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Black'],
            stock: 10,
            description: 'Classic 1Hundred OrNothing hoodie with signature branding.'
        }
    ],

    // Get a single product by ID
    getProductById(id) {
        return this.fallbackProducts.find((p) => p.id === id) || null;
    },

    // Get products by category
    getProductsByCategory(category) {
        return this.fallbackProducts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    },

    // Get all categories
    getCategories() {
        const counts = {};
        this.fallbackProducts.forEach((p) => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        return Object.entries(counts).map(([name, count]) => ({
            name,
            slug: name.toLowerCase(),
            count
        }));
    },

    // Transform Supabase product to local format
    transformProduct(supabaseProduct) {
        return {
            id: supabaseProduct.id,
            title: supabaseProduct.title,
            price: supabaseProduct.price,
            category: supabaseProduct.category,
            images: supabaseProduct.images || [supabaseProduct.image],
            sizes: supabaseProduct.sizes || ['S', 'M', 'L', 'XL'],
            colors: supabaseProduct.colors || ['Default'],
            stock: supabaseProduct.stock || 0,
            description: supabaseProduct.description || ''
        };
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRODUCTS_CONFIG;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.PRODUCTS_CONFIG = PRODUCTS_CONFIG;
}
