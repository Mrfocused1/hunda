/**
 * Admin Dashboard JavaScript
 *
 * Features:
 * - Product CRUD via Supabase
 * - Order management (localStorage)
 * - Customer management (localStorage)
 * - Email automation settings
 * - Data export/import
 */

// Ensure showToast is available (may not be if main.js isn't loaded on admin page)
if (typeof showToast === 'undefined') {
    window.showToast = function (message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-msg');
        if (toast && toastMsg) {
            toastMsg.textContent = message;
            toast.style.display = 'flex';
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => { toast.style.display = 'none'; }, 300);
            }, 3000);
        }
    };
}

// Ensure debug functions exist
if (typeof window.debugLog !== 'function') window.debugLog = function () {};
if (typeof window.debugError !== 'function') window.debugError = function () {};

// Fallback products (used when Supabase is not available)
let adminProducts = [
    {
        id: 3,
        title: '1H Star Cap',
        price: 30,
        images: ['product-3.png'],
        category: 'hats',
        sizes: ['One Size'],
        stock: 12,
        description: `1H Star Cap (Black & White)\n\nA refined essential, the 1H Star Cap is defined by contrast, structure, and intent. Rendered in a distressed black and white finish, the design carries a worn-in character that speaks to experience, not excess.\n\nThe front is anchored by the signature 1H star emblem, a symbol of commitment at the highest level. Clean yet commanding, it reflects a mindset built on discipline and consistency.\n\nAt the back, the statement "No Half Measures" is subtly placed—reinforcing the philosophy behind the piece. Every detail is deliberate, from the curved brim to the structured crown, balancing durability with a sharp, elevated silhouette.\n\nUnderstated. Focused. Uncompromising.\n\nAll or nothing.`
    },
    {
        id: 4,
        title: 'The No Half Measures Hoodie',
        price: 85,
        images: ['product-4.jpeg'],
        category: 'hoodies',
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
        images: ['product-5.jpeg'],
        category: 'hoodies',
        stock: 15,
        description: `Endless Possibilities Hoodie\n\nA refined expression of intent, the Endless Possibilities Hoodie is defined by its balance of structure and ease. Crafted in a washed blue finish, the silhouette is relaxed yet precise, offering a quiet sense of presence.\n\nThe signature 1H mark anchors the piece, while subtle text detailing speaks to a mindset of limitless direction. Studded accents introduce a restrained edge, complementing the garment's considered construction and tactile depth.\n\nUnderstated yet deliberate, this piece moves beyond trend—designed for those who operate with clarity and purpose.\n\nWithout limits.`
    },
    {
        id: 6,
        title: '1H Multi Colour Cap',
        price: 30,
        images: ['product-6.jpeg'],
        category: 'hats',
        sizes: ['One Size'],
        stock: 20,
        description: 'Colorful trucker hat with 1H branding.'
    },
    {
        id: 7,
        title: 'Relentless Trophy Tee',
        price: 40,
        images: ['product-relentless-front.png', 'product-relentless-back.png'],
        category: 't-shirts',
        stock: 25,
        description:
            'The Relentless Trophy Tee distills discipline into design. A monochrome composition of a faceless, armored figure holding its reward—symbolizing victory earned through persistence, not chance.\n\nRefined, understated, and intentional, this piece speaks to those who pursue excellence without compromise.\n\nEarned. Never given.'
    },
    {
        id: 9,
        title: '100MPH Tee',
        price: 40,
        images: ['product-100mph-front.png'],
        category: 't-shirts',
        stock: 30,
        description:
            "Push the pedal down and don't look back. The 100MPH Tee is built for those who live life at full throttle—where hesitation isn't an option and momentum is everything.\n\nFeaturing a bold, high-contrast graphic across the chest, this piece captures the raw intensity of speed from a driver's perspective. Crafted from premium heavyweight cotton with an oversized, boxy fit.\n\nAll gas. No brakes."
    }
];

// Supabase integration flag
let useSupabase = false;

// Initialize Supabase connection
async function initAdminSupabase() {
    if (typeof initSupabase === 'function') {
        initSupabase();
    }

    // Try to load from Supabase
    if (typeof ProductAPI !== 'undefined') {
        try {
            const { data, error } = await ProductAPI.getAll();
            if (!error) {
                useSupabase = true;
                if (data && data.length > 0) {
                    adminProducts = data;
                    // Admin: Products loaded from Supabase
                } else {
                    // Admin: No products in Supabase yet, using fallback
                }
            } else {
                // Admin: Supabase error, using fallback
            }
        } catch (err) {
            // Admin: Could not connect to Supabase, using fallback
        }
    }

    // Refresh the UI
    if (typeof loadProducts === 'function') {
        loadProducts();
    }
}

// Admin email whitelist
const ADMIN_EMAILS = ['admin@1hundredornothing.co.uk', 'hundredornothing@outlook.com'];

// Check admin authentication
(function checkAuth() {
    const adminSession = sessionStorage.getItem('1hundred_admin_session');
    if (!adminSession && !window.location.href.includes('admin-login')) {
        window.location.href = '/admin-login';
        return;
    }
    // Validate session structure
    if (adminSession && !window.location.href.includes('admin-login')) {
        try {
            const session = JSON.parse(adminSession);
            if (!session || !session.email || !session.timestamp) {
                sessionStorage.removeItem('1hundred_admin_session');
                window.location.href = '/admin-login';
                return;
            }
            // Verify email is in admin whitelist
            if (!ADMIN_EMAILS.includes(session.email.toLowerCase())) {
                sessionStorage.removeItem('1hundred_admin_session');
                window.location.href = '/admin-login';
                return;
            }
            // Expire sessions after 4 hours
            const maxAge = 4 * 60 * 60 * 1000;
            if (Date.now() - session.timestamp > maxAge) {
                sessionStorage.removeItem('1hundred_admin_session');
                window.location.href = '/admin-login';
                return;
            }
        } catch (e) {
            sessionStorage.removeItem('1hundred_admin_session');
            window.location.href = '/admin-login';
        }
    }
})();

// Admin Data Management
const AdminData = {
    // Get products - returns from Supabase or fallback
    getProducts: function () {
        return adminProducts;
    },

    // Validate product data before saving
    validateProduct: function (product) {
        if (!product.title || typeof product.title !== 'string' || product.title.trim().length === 0) {
            return 'Product title is required';
        }
        if (product.title.length > 200) {
            return 'Product title is too long (max 200 characters)';
        }
        const price = parseFloat(product.price);
        if (!Number.isFinite(price) || price < 0 || price > 10000) {
            return 'Price must be between 0 and 10,000';
        }
        if (product.stock !== undefined && product.stock !== null) {
            const stock = parseInt(product.stock);
            if (!Number.isFinite(stock) || stock < 0) {
                return 'Stock must be a non-negative number';
            }
        }
        if (product.description && product.description.length > 5000) {
            return 'Description is too long (max 5000 characters)';
        }
        return null;
    },

    // Save products - saves to Supabase if available
    saveProducts: async function (products) {
        // Validate all products before saving
        for (const product of products) {
            const validationError = this.validateProduct(product);
            if (validationError) {
                if (typeof showToast === 'function') {
                    showToast(`${product.title || 'Product'}: ${validationError}`, 'error');
                }
                return;
            }
        }

        if (useSupabase && typeof ProductAPI !== 'undefined') {
            // Sync each product to Supabase
            for (const product of products) {
                if (product.id) {
                    const { error } = await ProductAPI.update(product.id, product);
                    if (error) {
                        debugError('Failed to save product:', product.title, error);
                    }
                }
            }
            // Update local cache
            adminProducts = [...products];
        } else {
            // Fallback: just update local cache
            adminProducts = [...products];
        }
    },

    getOrders: function () {
        const stored = localStorage.getItem('1hundred_orders');
        return stored ? JSON.parse(stored) : [];
    },

    saveOrders: function (orders) {
        localStorage.setItem('1hundred_orders', JSON.stringify(orders));
    },

    getCustomers: function () {
        const stored = localStorage.getItem('1hundred_customers');
        return stored ? JSON.parse(stored) : [];
    },

    saveCustomers: function (customers) {
        localStorage.setItem('1hundred_customers', JSON.stringify(customers));
    },

    getEmailSettings: function () {
        const stored = localStorage.getItem('1hundred_email_settings');
        return stored
            ? JSON.parse(stored)
            : {
                  'order-confirmation': true,
                  'shipping-confirmation': true,
                  'abandoned-cart': true,
                  welcome: true
              };
    },

    saveEmailSettings: function (settings) {
        localStorage.setItem('1hundred_email_settings', JSON.stringify(settings));
    }
};

// Navigation
let currentSection = 'dashboard';

function initNavigation() {
    document.querySelectorAll('.admin-nav-item[data-section]').forEach((item) => {
        item.addEventListener('click', function () {
            const section = this.dataset.section;
            showSection(section);

            // Update active state
            document.querySelectorAll('.admin-nav-item').forEach((nav) => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showSection(section) {
    currentSection = section;

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach((s) => s.classList.remove('active'));

    // Show selected section
    document.getElementById(section).classList.add('active');

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        orders: 'Orders',
        customers: 'Customers',
        emails: 'Email Automation',
        content: 'Store Content',
        media: 'Media Gallery'
    };
    document.getElementById('page-title').textContent = titles[section] || section;

    // Refresh data
    if (section === 'dashboard') loadDashboard();
    if (section === 'products') loadProducts();
    if (section === 'orders') loadOrders();
    if (section === 'customers') loadCustomers();
    if (section === 'emails') initEmailToggles();
    if (section === 'media') {
        MediaAdmin.load();
        MediaAdmin.initNavToggle();
    }
}

// Dashboard
function loadDashboard() {
    const products = AdminData.getProducts();
    const orders = AdminData.getOrders();
    const customers = AdminData.getCustomers();

    // Calculate stats
    const totalSales = orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

    const statSales = document.getElementById('stat-sales');
    const statOrders = document.getElementById('stat-orders');
    const statProducts = document.getElementById('stat-products');
    const statCustomers = document.getElementById('stat-customers');

    if (statSales) statSales.textContent = `£${totalSales.toFixed(2)}`;
    if (statOrders) statOrders.textContent = orders.length;
    if (statProducts) statProducts.textContent = products.length;
    if (statCustomers) statCustomers.textContent = customers.length;

    // Recent orders
    const recentOrdersEl = document.getElementById('recent-orders-list');
    if (!recentOrdersEl) return;

    const recentOrders = orders.slice(-5).reverse();

    if (recentOrders.length === 0) {
        recentOrdersEl.innerHTML = '<p class="text-gray-500 text-sm">No recent orders</p>';
    } else {
        recentOrdersEl.innerHTML = recentOrders
            .map(
                (order) => `
            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                    <p class="font-medium text-sm">${order.id}</p>
                    <p class="text-xs text-gray-500">${order.customer}</p>
                </div>
                <span class="font-bold">£${order.total.toFixed(2)}</span>
            </div>
        `
            )
            .join('');
    }

    // Low stock alerts
    const lowStockEl = document.getElementById('low-stock-list');
    if (!lowStockEl) return;
    const lowStock = products.filter((p) => p.stock != null && p.stock < 10);

    if (lowStock.length === 0) {
        lowStockEl.innerHTML = '<p class="text-gray-500 text-sm">No low stock items</p>';
    } else {
        lowStockEl.innerHTML = lowStock
            .map((product) => {
                // Get primary image URL (handles both local and Supabase Storage)
                let primaryImage = 'product-1.png';
                if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    primaryImage =
                        typeof getProductImageUrl !== 'undefined'
                            ? getProductImageUrl(product.images[0])
                            : product.images[0];
                } else if (product.image) {
                    primaryImage =
                        typeof getProductImageUrl !== 'undefined' ? getProductImageUrl(product.image) : product.image;
                }
                return `
            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div class="flex items-center gap-3">
                    <img src="${primaryImage}" alt="${product.title}" class="w-10 h-10 object-cover" onerror="this.src='product-1.png'">
                    <div>
                        <p class="font-medium text-sm">${product.title}</p>
                        <p class="text-xs text-gray-500">${product.category}</p>
                    </div>
                </div>
                <span class="status-badge low-stock">${product.stock} left</span>
            </div>
        `;
            })
            .join('');
    }
}

// Products Management
let productSearchTerm = '';
let productFilterCategory = 'all';
let productFilterStock = 'all';

function loadProducts() {
    const products = AdminData.getProducts();

    updateProductStats();
    renderProducts();
}

function updateProductStats() {
    const products = AdminData.getProducts();
    const inStock = products.filter((p) => p.stock >= 10).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
    const outStock = products.filter((p) => p.stock === 0).length;

    document.getElementById('product-total-count').textContent = products.length;
    document.getElementById('product-instock-count').textContent = inStock;
    document.getElementById('product-lowstock-count').textContent = lowStock;
    document.getElementById('product-outstock-count').textContent = outStock;
}

function getFilteredProducts() {
    let products = AdminData.getProducts();

    // Search filter
    if (productSearchTerm) {
        const term = productSearchTerm.toLowerCase();
        products = products.filter(
            (p) => p.title.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)
        );
    }

    // Category filter
    if (productFilterCategory !== 'all') {
        products = products.filter((p) => p.category === productFilterCategory);
    }

    // Stock filter
    if (productFilterStock !== 'all') {
        products = products.filter((p) => {
            if (productFilterStock === 'instock') return p.stock >= 10;
            if (productFilterStock === 'low') return p.stock > 0 && p.stock < 10;
            if (productFilterStock === 'out') return p.stock === 0;
            return true;
        });
    }

    return products;
}

function renderProducts() {
    const products = getFilteredProducts();
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('products-empty');

    if (products.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = products
        .map((product) => {
            let stockStatus = 'in-stock';
            let stockLabel = 'In Stock';
            let stockClass = 'in-stock';

            if (product.stock === 0) {
                stockStatus = 'out-stock';
                stockLabel = 'Out of Stock';
                stockClass = 'out';
            } else if (product.stock <= 10) {
                stockStatus = 'low-stock';
                stockLabel = 'Low Stock';
                stockClass = 'low';
            }

            // Get primary image (support both local files and Supabase Storage)
            let primaryImage = 'product-1.png';
            let imageCount = 1;
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                primaryImage =
                    typeof getProductImageUrl !== 'undefined'
                        ? getProductImageUrl(product.images[0])
                        : product.images[0];
                imageCount = product.images.length;
            } else if (product.image) {
                primaryImage =
                    typeof getProductImageUrl !== 'undefined' ? getProductImageUrl(product.image) : product.image;
            }

            return `
            <div class="product-card">
                <div class="product-card-image">
                    <img src="${primaryImage}" alt="${product.title}" loading="lazy" onerror="this.src='product-1.png'">
                    <span class="product-card-stock-badge ${stockStatus}">${stockLabel}</span>
                    ${imageCount > 1 ? `<span class="product-card-image-count" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; padding: 2px 8px; font-size: 0.75rem; border-radius: 4px;">${imageCount} images</span>` : ''}
                    <div class="product-card-actions">
                        <button class="product-card-action-btn" onclick="event.stopPropagation(); editProduct(${product.id})" title="Edit">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button class="product-card-action-btn" onclick="event.stopPropagation(); deleteProduct(${product.id})" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="product-card-content">
                    <div class="product-card-category">${product.category}</div>
                    <div class="product-card-title">${product.title}</div>
                    <div class="product-card-footer">
                        <span class="product-card-price">£${product.price.toFixed(2)}</span>
                        <span class="product-card-stock ${stockClass}">${product.stock} in stock</span>
                    </div>
                </div>
            </div>
        `;
        })
        .join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Product search and filter
document.addEventListener('DOMContentLoaded', function () {
    const productSearchInput = document.getElementById('product-search');
    if (productSearchInput) {
        let debounceTimer;
        productSearchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                productSearchTerm = this.value.trim();
                renderProducts();
            }, 300);
        });
    }
});

function filterProducts() {
    productFilterCategory = document.getElementById('product-filter-category').value;
    productFilterStock = document.getElementById('product-filter-stock').value;
    renderProducts();
}

let currentProductImages = [];

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    // Reset image upload state
    currentProductImages = [];
    resetImageUpload();

    if (productId) {
        const products = AdminData.getProducts();
        const product = products.find((p) => p.id === productId);

        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-title').value = product.title;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-description').value = product.description || '';

        // Set current images (support both old single image and new images array)
        if (product.images && Array.isArray(product.images)) {
            currentProductImages = [...product.images];
        } else if (product.image) {
            // Backward compatibility: convert single image to array
            currentProductImages = [product.image];
        }

        if (currentProductImages.length > 0) {
            showImagePreviews(currentProductImages);
        }
    } else {
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('product-id').value = '';
    }

    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    currentProductImages = [];
    resetImageUpload();
}

// Image Upload Functions
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('image-upload-area').classList.add('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('image-upload-area').classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('image-upload-area').classList.remove('drag-over');

    const files = Array.from(event.dataTransfer.files);
    processImageFiles(files);
}

function handleImageSelect(event) {
    const files = Array.from(event.target.files);
    processImageFiles(files);
}

function processImageFiles(files) {
    // Validate max 5 images
    if (currentProductImages.length + files.length > 5) {
        showToast('Maximum 5 images allowed per product');
        return;
    }

    files.forEach((file, index) => {
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast(`Skipping ${file.name}: Invalid file type`);
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast(`Skipping ${file.name}: File too large (max 5MB)`);
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = function (e) {
            currentProductImages.push(e.target.result);
            showImagePreviews(currentProductImages);

            // Show count toast after last image
            if (index === files.length - 1) {
                showToast(`${currentProductImages.length} image${currentProductImages.length > 1 ? 's' : ''} uploaded`);
            }
        };
        reader.readAsDataURL(file);
    });
}

// Backward compatibility - single file upload
function processImageFile(file) {
    processImageFiles([file]);
}

function showImagePreviews(imageSrcs) {
    const previewContainer = document.getElementById('image-preview-container');
    const uploadArea = document.getElementById('image-upload-area');
    const addMoreBtn = document.getElementById('add-more-images-btn');
    const fileInput = document.getElementById('product-image-file');

    // Clear existing previews
    previewContainer.innerHTML = '';

    // Create preview grid
    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem;';

    imageSrcs.forEach((src, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position: relative; aspect-ratio: 1; border: 1px solid #e5e7eb; overflow: hidden;';

        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';

        // Primary badge for first image
        if (index === 0) {
            const badge = document.createElement('span');
            badge.textContent = 'PRIMARY';
            badge.style.cssText =
                'position: absolute; top: 4px; left: 4px; background: #111; color: white; font-size: 0.625rem; padding: 2px 6px; font-weight: 600;';
            wrapper.appendChild(badge);
        }

        // Remove button
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '×';
        removeBtn.style.cssText =
            'position: absolute; top: 4px; right: 4px; width: 24px; height: 24px; background: #dc2626; color: white; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;';
        removeBtn.onclick = () => removeProductImage(index);

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        grid.appendChild(wrapper);
    });

    previewContainer.appendChild(grid);
    previewContainer.style.display = 'block';

    // Show/hide upload area and add more button
    if (imageSrcs.length >= 5) {
        uploadArea.style.display = 'none';
        addMoreBtn.style.display = 'none';
    } else {
        uploadArea.style.display = 'none';
        addMoreBtn.style.display = 'inline-block';
    }

    fileInput.value = '';
}

// Backward compatibility
function showImagePreview(imageSrc) {
    showImagePreviews([imageSrc]);
}

function removeProductImage(index) {
    currentProductImages.splice(index, 1);
    if (currentProductImages.length === 0) {
        resetImageUpload();
    } else {
        showImagePreviews(currentProductImages);
    }
}

function resetImageUpload() {
    const previewContainer = document.getElementById('image-preview-container');
    const uploadArea = document.getElementById('image-upload-area');
    const addMoreBtn = document.getElementById('add-more-images-btn');
    const fileInput = document.getElementById('product-image-file');

    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    uploadArea.classList.remove('has-image');
    if (addMoreBtn) addMoreBtn.style.display = 'none';
    fileInput.value = '';
}

// Helper function to upload images to Supabase Storage
async function uploadProductImages(images, productId) {
    if (!useSupabase || typeof StorageAPI === 'undefined') {
        return images; // Return as-is if Supabase not available
    }

    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // If it's already a filename (not base64), keep it
        if (!image.startsWith('data:')) {
            uploadedImages.push(image);
            continue;
        }

        // It's a base64 image, upload to Storage
        showToast(`📤 Uploading image ${i + 1} of ${images.length}...`);

        const fileName = `product-${productId || 'new'}-${Date.now()}-${i}.png`;
        const { data, error } = await StorageAPI.uploadBase64('product-images', fileName, image, 'image/png');

        if (error) {
            // Failed to upload image
            showToast(`❌ Failed to upload image ${i + 1}`);
            // Keep the original filename as fallback
            uploadedImages.push(`product-${i + 1}.png`);
        } else {
            // Store just the filename/path
            uploadedImages.push(data.path);
            // Image uploaded successfully
        }
    }

    return uploadedImages;
}

async function saveProduct(event) {
    event.preventDefault();

    const id = document.getElementById('product-id').value;

    // Show loading state
    const saveBtn = event.target.querySelector('button[type="submit"]');
    const originalText = saveBtn ? saveBtn.textContent : 'Save';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
    }

    // Prepare base product data
    const category = document.getElementById('product-category').value;

    // Set appropriate sizes based on category
    const sizes = category === 'hats' ? ['One Size'] : ['S', 'M', 'L', 'XL'];

    const baseProductData = {
        title: document.getElementById('product-title').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: category,
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value,
        sizes: sizes,
        colors: (id ? adminProducts.find((p) => p.id === parseInt(id))?.colors : null) || ['Default']
    };

    if (useSupabase && typeof ProductAPI !== 'undefined') {
        let result;
        let productId = id ? parseInt(id) : null;

        if (id) {
            // Update existing - handle images with known product ID
            let images = currentProductImages.length > 0 ? currentProductImages : ['product-1.png'];

            if (images.some((img) => img.startsWith('data:'))) {
                images = await uploadProductImages(images, productId);
            }

            const productData = {
                ...baseProductData,
                images: images,
                image: images[0]
            };

            result = await ProductAPI.update(productId, productData);
        } else {
            // Create new - upload images first, then create product with all data
            // This avoids the RLS issue with UPDATE after CREATE
            let images = currentProductImages.length > 0 ? [...currentProductImages] : ['product-1.png'];

            // Upload any base64 images first (will use 'new' as temp ID in filename)
            if (images.some((img) => img.startsWith('data:'))) {
                showToast('📤 Uploading images...');
                images = await uploadProductImages(images, 'new');
            }

            const productData = {
                ...baseProductData,
                images: images,
                image: images[0]
            };

            result = await ProductAPI.create(productData);
        }

        if (result.error) {
            showToast('❌ Error saving product: ' + result.error.message);
        } else {
            showToast('✅ Product saved to Supabase!');
            // Refresh products list
            const { data } = await ProductAPI.getAll();
            if (data) adminProducts = data;
            loadProducts();
        }
    } else {
        // Local fallback
        let images = currentProductImages.length > 0 ? currentProductImages : ['product-1.png'];

        const productData = {
            ...baseProductData,
            images: images,
            image: images[0]
        };

        if (id) {
            // Update existing
            const index = adminProducts.findIndex((p) => p.id === parseInt(id));
            if (index !== -1) {
                adminProducts[index] = { ...adminProducts[index], ...productData, id: parseInt(id) };
            }
        } else {
            // Create new
            const ids = adminProducts.map((p) => p.id);
            const newId = (ids.length > 0 ? Math.max(...ids) : 0) + 1;
            adminProducts.push({ ...productData, id: newId });
        }
        showToast('✅ Product saved locally');
        loadProducts();
    }

    // Restore button state
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }

    closeProductModal();
}

function editProduct(id) {
    openProductModal(id);
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    if (useSupabase && typeof ProductAPI !== 'undefined') {
        // First, get the product to find its images
        const { data: product } = await ProductAPI.getById(id);

        // Delete the product from database
        const { error } = await ProductAPI.delete(id);

        if (error) {
            showToast('❌ Error deleting product: ' + error.message);
            // Supabase error during delete
            return;
        }

        // Delete images from storage
        if (product && product.images && typeof StorageAPI !== 'undefined') {
            for (const imagePath of product.images) {
                // Only delete if it's a storage path (not a local filename)
                if (imagePath && imagePath.includes('product-') && imagePath.endsWith('.png')) {
                    await StorageAPI.deleteFile('product-images', imagePath);
                }
            }
        }

        showToast('✅ Product deleted from Supabase!');
        // Refresh products list
        const { data } = await ProductAPI.getAll();
        if (data) adminProducts = data;
        loadProducts();
    } else {
        // Local fallback
        const index = adminProducts.findIndex((p) => p.id === parseInt(id));
        if (index !== -1) {
            adminProducts.splice(index, 1);
            showToast('✅ Product deleted locally');
            loadProducts();
        }
    }
}

// Orders Management
let orderSearchTerm = '';
let orderFilterStatus = 'all';
let orderSortBy = 'newest';

function loadOrders() {
    updateOrderStats();
    renderOrders();
}

function updateOrderStats() {
    const orders = AdminData.getOrders();
    const pending = orders.filter((o) => o.status === 'pending').length;
    const processing = orders.filter((o) => o.status === 'processing').length;
    const completed = orders.filter((o) => o.status === 'delivered').length;

    document.getElementById('order-total-count').textContent = orders.length;
    document.getElementById('order-pending-count').textContent = pending;
    document.getElementById('order-processing-count').textContent = processing;
    document.getElementById('order-completed-count').textContent = completed;
}

function getFilteredOrders() {
    let orders = AdminData.getOrders();

    // Search filter
    if (orderSearchTerm) {
        const term = orderSearchTerm.toLowerCase();
        orders = orders.filter(
            (o) =>
                o.id.toLowerCase().includes(term) ||
                o.customer.toLowerCase().includes(term) ||
                (o.email && o.email.toLowerCase().includes(term))
        );
    }

    // Status filter
    if (orderFilterStatus !== 'all') {
        orders = orders.filter((o) => o.status === orderFilterStatus);
    }

    // Sort
    orders.sort((a, b) => {
        if (orderSortBy === 'newest') return new Date(b.date) - new Date(a.date);
        if (orderSortBy === 'oldest') return new Date(a.date) - new Date(b.date);
        if (orderSortBy === 'highest') return b.total - a.total;
        if (orderSortBy === 'lowest') return a.total - b.total;
        return 0;
    });

    return orders;
}

function renderOrders() {
    const orders = getFilteredOrders();
    const grid = document.getElementById('orders-grid');
    const emptyState = document.getElementById('orders-empty');

    if (orders.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = orders
        .map((order) => {
            const initials = (order.customer || 'U')
                .split(' ')
                .map((n) => n[0] || '')
                .join('')
                .toUpperCase() || 'U';
            const date = new Date(order.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const statusColors = {
                pending: { bg: '#fef3c7', text: '#92400e' },
                processing: { bg: '#dbeafe', text: '#1e40af' },
                shipped: { bg: '#d1fae5', text: '#065f46' },
                delivered: { bg: '#111', text: '#fff' }
            };
            const statusColor = statusColors[order.status] || statusColors.pending;

            return `
            <div class="order-card" onclick="viewOrder('${order.id}')">
                <div class="order-card-header">
                    <div>
                        <div class="order-card-id">${order.id}</div>
                        <div class="order-card-date">${date}</div>
                    </div>
                    <span class="status-badge ${order.status}" style="background: ${statusColor.bg}; color: ${statusColor.text};">
                        ${order.status}
                    </span>
                </div>
                
                <div class="order-card-customer">
                    <div class="order-card-avatar">${initials}</div>
                    <div class="order-card-customer-info">
                        <div class="order-card-customer-name">${order.customer}</div>
                        <div class="order-card-customer-email">${order.email || (order.customer || 'unknown').toLowerCase().replace(' ', '.') + '@email.com'}</div>
                    </div>
                </div>
                
                <div class="order-card-footer">
                    <span class="order-card-total">£${(order.total || 0).toFixed(2)}</span>
                    <span style="font-size: 0.8125rem; color: #6b7280;">${Array.isArray(order.items) ? order.items.length : (order.items || 0)} items</span>
                </div>
            </div>
        `;
        })
        .join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Order search and filters
document.addEventListener('DOMContentLoaded', function () {
    const orderSearchInput = document.getElementById('order-search');
    if (orderSearchInput) {
        let debounceTimer;
        orderSearchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                orderSearchTerm = this.value.trim();
                renderOrders();
            }, 300);
        });
    }
});

function filterOrders() {
    orderFilterStatus = document.getElementById('order-filter-status').value;
    renderOrders();
}

function sortOrders() {
    orderSortBy = document.getElementById('order-sort').value;
    renderOrders();
}

async function updateOrderStatus(orderId, status) {
    const orders = AdminData.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
        const previousStatus = order.status;
        order.status = status;
        AdminData.saveOrders(orders);
        showToast(`Order ${orderId} updated to ${status}`);
        updateOrderStats();

        // Send shipping notification when order is marked as shipped
        if (status === 'shipped' && previousStatus !== 'shipped' && order.email) {
            const trackingNumber = order.trackingNumber || '';
            const carrier = order.carrier || '';

            try {
                if (typeof EmailService !== 'undefined') {
                    await EmailService.sendShippingNotification(order.email, {
                        firstName: order.customer?.split(' ')[0] || 'Customer',
                        orderNumber: order.id,
                        trackingNumber: trackingNumber,
                        carrier: carrier
                    });
                    showToast(`Shipping notification sent to ${order.email}`);
                }
            } catch (error) {
                console.error('Failed to send shipping notification:', error);
                showToast('Order updated but email notification failed');
            }
        }
    }
}

function viewOrder(orderId) {
    const orders = AdminData.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
        const itemsList = Array.isArray(order.items)
            ? order.items.map((i) => `${i.title || 'Item'} x${i.quantity || 1} - £${(i.price || 0).toFixed ? i.price.toFixed(2) : i.price}`).join('\n')
            : 'N/A';
        alert(
            `Order Details:\n\nID: ${order.id}\nCustomer: ${order.customer || 'N/A'}\nEmail: ${order.email || 'N/A'}\nTotal: £${(order.total || 0).toFixed(2)}\nStatus: ${order.status || 'N/A'}\n\nItems:\n${itemsList}`
        );
    }
}

function exportOrders() {
    const orders = AdminData.getOrders();
    const csv = [
        ['Order ID', 'Customer', 'Email', 'Date', 'Total', 'Items', 'Status'].join(','),
        ...orders.map((o) =>
            [
                o.id,
                `"${(o.customer || '').replace(/"/g, '""')}"`,
                o.email || '',
                o.date ? new Date(o.date).toISOString().split('T')[0] : '',
                (o.total || 0).toFixed(2),
                Array.isArray(o.items) ? o.items.length : (o.items || 0),
                o.status || ''
            ].join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Orders exported to CSV');
}

// Customers Management
let customerCurrentPage = 1;
let customerPageSize = 12;
let customerSearchTerm = '';
let customerFilterStatus = 'all';
let allCustomers = [];

function loadCustomers() {
    allCustomers = AdminData.getCustomers();
    updateCustomerStats();
    renderCustomers();
}

function updateCustomerStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalCustomers = allCustomers.length;
    const newThisMonth = allCustomers.filter((c) => new Date(c.joined) > thirtyDaysAgo).length;
    const vipCustomers = allCustomers.filter((c) => c.status === 'vip').length;
    // Calculate AOV correctly: Total Revenue / Total Orders
    const totalRevenue = allCustomers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const totalOrders = allCustomers.reduce((sum, c) => sum + (c.orders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    document.getElementById('customer-total-count').textContent = totalCustomers;
    document.getElementById('customer-new-count').textContent = newThisMonth;
    document.getElementById('customer-vip-count').textContent = vipCustomers;
    document.getElementById('customer-aov').textContent = `£${avgOrderValue.toFixed(0)}`;
}

function getFilteredCustomers() {
    let filtered = [...allCustomers];

    // Apply search filter
    if (customerSearchTerm) {
        const term = customerSearchTerm.toLowerCase();
        filtered = filtered.filter(
            (c) =>
                (c.firstName || '').toLowerCase().includes(term) ||
                (c.lastName || '').toLowerCase().includes(term) ||
                (c.email || '').toLowerCase().includes(term)
        );
    }

    // Apply status filter
    if (customerFilterStatus !== 'all') {
        filtered = filtered.filter((c) => c.status === customerFilterStatus);
    }

    // Sort by joined date (newest first)
    filtered.sort((a, b) => new Date(b.joined) - new Date(a.joined));

    return filtered;
}

function renderCustomers() {
    const filtered = getFilteredCustomers();
    const grid = document.getElementById('customers-grid');
    const emptyState = document.getElementById('customers-empty');
    const pagination = document.getElementById('customers-pagination');

    if (filtered.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    pagination.style.display = 'flex';

    // Pagination
    const totalPages = Math.ceil(filtered.length / customerPageSize);
    const start = (customerCurrentPage - 1) * customerPageSize;
    const paginated = filtered.slice(start, start + customerPageSize);

    // Update pagination info
    document.getElementById('pagination-info').textContent =
        `Page ${customerCurrentPage} of ${totalPages} (${filtered.length} customers)`;

    // Render customer cards
    grid.innerHTML = paginated
        .map((customer) => {
            const initials = `${customer.firstName?.[0] || '?'}${customer.lastName?.[0] || '?'}`.toUpperCase();
            const joinedDate = new Date(customer.joined).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric'
            });
            const lastOrderDate = customer.lastOrder
                ? new Date(customer.lastOrder).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : 'No orders';

            const statusBadges = [];
            if (customer.status === 'vip') statusBadges.push('<span class="customer-badge vip">VIP</span>');
            if (customer.status === 'new') statusBadges.push('<span class="customer-badge new">New</span>');
            if (customer.status === 'active') statusBadges.push('<span class="customer-badge active">Active</span>');

            return `
            <div class="customer-card" onclick="viewCustomerDetails('${customer.id}')">
                <div class="customer-card-header">
                    <div class="customer-avatar ${customer.status}">${initials}</div>
                    <div class="customer-info">
                        <div class="customer-name">${customer.firstName || ''} ${customer.lastName || ''}</div>
                        <div class="customer-email">${customer.email}</div>
                    </div>
                </div>
                
                <div class="customer-badges">
                    ${statusBadges.join('')}
                </div>
                
                <div class="customer-stats">
                    <div class="customer-stat">
                        <div class="customer-stat-value">${customer.orders}</div>
                        <div class="customer-stat-label">Orders</div>
                    </div>
                    <div class="customer-stat">
                        <div class="customer-stat-value">£${(customer.totalSpent || 0).toFixed(0)}</div>
                        <div class="customer-stat-label">Spent</div>
                    </div>
                    <div class="customer-stat">
                        <div class="customer-stat-value">£${(customer.orders > 0 ? (customer.totalSpent || 0) / customer.orders : 0).toFixed(0)}</div>
                        <div class="customer-stat-label">AOV</div>
                    </div>
                </div>
                
                <div class="customer-footer">
                    <div class="customer-last-order">Last order: ${lastOrderDate}</div>
                    <div class="customer-actions" onclick="event.stopPropagation()">
                        <button class="customer-action-btn view" onclick="viewCustomerDetails('${customer.id}')" title="View Details">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                        <button class="customer-action-btn email" onclick="emailCustomer('${customer.id}')" title="Send Email">
                            <i data-lucide="mail" class="w-4 h-4"></i>
                        </button>
                        <button class="customer-action-btn delete" onclick="deleteCustomer('${customer.id}')" title="Delete">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        })
        .join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Search functionality
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('customer-search');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                customerSearchTerm = this.value.trim();
                customerCurrentPage = 1;
                renderCustomers();
            }, 300);
        });
    }
});

function filterCustomers() {
    customerFilterStatus = document.getElementById('customer-filter-status').value;
    customerCurrentPage = 1;
    renderCustomers();
}

function changePage(direction) {
    const filtered = getFilteredCustomers();
    const totalPages = Math.ceil(filtered.length / customerPageSize);

    customerCurrentPage += direction;
    if (customerCurrentPage < 1) customerCurrentPage = 1;
    if (customerCurrentPage > totalPages) customerCurrentPage = totalPages;

    renderCustomers();
}

function viewCustomerDetails(customerId) {
    const customer = allCustomers.find((c) => c.id === customerId);
    if (!customer) return;

    const initials = `${customer.firstName?.[0] || '?'}${customer.lastName?.[0] || '?'}`.toUpperCase();
    const joinedDate = new Date(customer.joined).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
    });
    const aov = (customer.orders > 0 ? customer.totalSpent / customer.orders : 0).toFixed(2);

    document.getElementById('customer-modal-avatar').textContent = initials;
    document.getElementById('customer-modal-avatar').className = `customer-detail-avatar ${customer.status}`;
    document.getElementById('customer-modal-name').textContent = `${customer.firstName} ${customer.lastName}`;
    document.getElementById('customer-modal-email').textContent = customer.email;
    document.getElementById('customer-modal-status').textContent =
        customer.status.charAt(0).toUpperCase() + customer.status.slice(1);
    document.getElementById('customer-modal-joined').textContent = joinedDate;
    document.getElementById('customer-modal-orders').textContent = customer.orders;
    document.getElementById('customer-modal-spent').textContent = `£${customer.totalSpent.toFixed(2)}`;
    document.getElementById('customer-modal-aov').textContent = `£${aov}`;
    document.getElementById('customer-modal-notes').value = customer.notes || '';

    // Store current customer ID for save
    document.getElementById('customer-modal').dataset.customerId = customerId;

    // Get actual orders for this customer
    const ordersList = document.getElementById('customer-modal-orders-list');
    const allOrders = AdminData.getOrders();
    const customerOrders = allOrders
        .filter((o) => o.email === customer.email || o.customer === `${customer.firstName} ${customer.lastName}`)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (customerOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 2rem;">No orders yet</p>';
    } else {
        ordersList.innerHTML = customerOrders
            .map(
                (order) => `
            <div class="customer-order-item">
                <div class="customer-order-info">
                    <span class="customer-order-number">${order.id}</span>
                    <span class="customer-order-date">${new Date(order.date).toLocaleDateString('en-GB')}</span>
                </div>
                <span class="customer-order-total">£${order.total.toFixed(2)}</span>
            </div>
        `
            )
            .join('');
    }

    document.getElementById('customer-modal').classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCustomerModal() {
    document.getElementById('customer-modal').classList.remove('active');
}

function saveCustomerNotes() {
    const customerId = document.getElementById('customer-modal').dataset.customerId;
    const notes = document.getElementById('customer-modal-notes').value;

    const customer = allCustomers.find((c) => c.id === customerId);
    if (customer) {
        customer.notes = notes;
        AdminData.saveCustomers(allCustomers);
        showToast('Notes saved successfully');
    }
}

function openAddCustomerModal() {
    document.getElementById('add-customer-modal').classList.add('active');
}

function closeAddCustomerModal() {
    document.getElementById('add-customer-modal').classList.remove('active');
    document.getElementById('add-customer-form').reset();
}

function saveNewCustomer(event) {
    event.preventDefault();

    const firstName = document.getElementById('new-customer-firstname').value;
    const lastName = document.getElementById('new-customer-lastname').value;
    const email = document.getElementById('new-customer-email').value;
    const phone = document.getElementById('new-customer-phone').value;

    const newCustomer = {
        id: `cust_${Date.now()}`,
        firstName,
        lastName,
        email,
        phone,
        orders: 0,
        totalSpent: 0,
        joined: new Date().toISOString(),
        status: 'new',
        lastOrder: null,
        notes: ''
    };

    allCustomers.push(newCustomer);
    AdminData.saveCustomers(allCustomers);

    closeAddCustomerModal();
    updateCustomerStats();
    renderCustomers();
    showToast('Customer added successfully');
}

function emailCustomer(customerId) {
    const customer = allCustomers.find((c) => c.id === customerId);
    if (customer) {
        window.location.href = `mailto:${customer.email}`;
    }
}

function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    allCustomers = allCustomers.filter((c) => c.id !== customerId);
    AdminData.saveCustomers(allCustomers);

    updateCustomerStats();
    renderCustomers();
    showToast('Customer deleted');
}

function exportCustomers() {
    const csv = [
        ['First Name', 'Last Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Status', 'Joined'].join(','),
        ...allCustomers.map((c) =>
            [
                c.firstName,
                c.lastName,
                c.email,
                c.phone || '',
                c.orders,
                c.totalSpent.toFixed(2),
                c.status,
                new Date(c.joined).toISOString().split('T')[0]
            ].join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Customers exported to CSV');
}

// Email Templates Data
const defaultEmailTemplates = {
    'order-confirmation': {
        subject: 'Thank you for your order! 🎉',
        body: "Hi {{firstName}},\n\nWe've received your order and are preparing it for shipment.\n\nOrder: {{orderNumber}}\nTotal: {{total}}\n\nWe'll send you another email when your order ships.\n\nThanks for shopping with us!"
    },
    'shipping-confirmation': {
        subject: 'Your order is on its way! 🚚',
        body: 'Hi {{firstName}},\n\nGreat news! Your order has been shipped and is on its way to you.\n\nOrder: {{orderNumber}}\n\nYou can track your package using the tracking number in your account.\n\nThanks for your patience!'
    },
    'abandoned-cart': {
        subject: 'You left something behind...',
        body: "Hi {{firstName}},\n\nLooks like you left some items in your cart. Complete your order now and don't miss out!\n\nYour cart is waiting for you.\n\nComplete your order →"
    },
    welcome: {
        subject: 'Welcome to 1 HUNDRED! 👋',
        body: "Hi {{firstName}},\n\nWelcome to the 1 HUNDRED family! We're excited to have you on board.\n\nStart exploring our latest collection and find your new favorite pieces.\n\nShop now →"
    }
};

function getEmailTemplates() {
    const stored = localStorage.getItem('1hundred_email_templates');
    return stored ? JSON.parse(stored) : { ...defaultEmailTemplates };
}

function saveEmailTemplates(templates) {
    localStorage.setItem('1hundred_email_templates', JSON.stringify(templates));
}

// Email Automation
function initEmailToggles() {
    updateEmailStats();
    updateEmailActivityStats();

    const settings = AdminData.getEmailSettings();

    // Set initial toggle states
    document.querySelectorAll('.toggle-switch[data-email]').forEach((toggle) => {
        const emailType = toggle.dataset.email;
        toggle.classList.toggle('active', settings[emailType]);
    });
}

function updateEmailStats() {
    const settings = AdminData.getEmailSettings();
    const activeCount = Object.values(settings).filter((v) => v).length;
    document.getElementById('email-active-count').textContent = activeCount;
}

function updateEmailActivityStats() {
    const activity = JSON.parse(localStorage.getItem('1hundred_email_activity') || '{}');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sentCount = Object.values(activity).reduce((sum, logs) => {
        return sum + (logs || []).filter((log) => new Date(log.date) > thirtyDaysAgo).length;
    }, 0);

    const totalOpens = Object.values(activity).reduce((sum, logs) => {
        return sum + (logs || []).filter((log) => log.opened && new Date(log.date) > thirtyDaysAgo).length;
    }, 0);

    const totalClicks = Object.values(activity).reduce((sum, logs) => {
        return sum + (logs || []).filter((log) => log.clicked && new Date(log.date) > thirtyDaysAgo).length;
    }, 0);

    const openRate = sentCount > 0 ? Math.round((totalOpens / sentCount) * 100) : 0;
    const clickRate = sentCount > 0 ? Math.round((totalClicks / sentCount) * 100) : 0;

    document.getElementById('email-sent-count').textContent = sentCount || '0';
    document.getElementById('email-open-rate').textContent = `${openRate}%`;
    document.getElementById('email-click-rate').textContent = `${clickRate}%`;

    // Update recovery rate for abandoned cart
    const recoveryRateElement = document.getElementById('email-recovery-rate');
    if (recoveryRateElement) {
        const abandonedLogs = activity['abandoned-cart'] || [];
        const recoveredCount = abandonedLogs.filter((log) => log.recovered).length;
        const recoveryRate = abandonedLogs.length > 0 ? Math.round((recoveredCount / abandonedLogs.length) * 100) : 0;
        recoveryRateElement.textContent = `${recoveryRate}%`;
    }

    updateLastSentTimes(activity);
}

function updateLastSentTimes(activity) {
    const emailTypes = ['order-confirmation', 'shipping-confirmation', 'welcome'];

    emailTypes.forEach((type) => {
        const element = document.getElementById(`email-last-sent-${type}`);
        if (element) {
            const logs = activity[type] || [];
            const lastLog = logs[logs.length - 1];
            if (lastLog) {
                element.textContent = formatTimeAgo(new Date(lastLog.date));
            } else {
                element.textContent = 'Never';
            }
        }
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-GB');
}

function toggleEmail(emailType, element) {
    element.classList.toggle('active');
    const isActive = element.classList.contains('active');

    const settings = AdminData.getEmailSettings();
    settings[emailType] = isActive;
    AdminData.saveEmailSettings(settings);

    const card = element.closest('.email-automation-card') || element.parentElement.parentElement;
    if (card) {
        const footer = card.querySelector('div:last-child');
        if (footer) {
            const statusSpan = footer.querySelector('span:last-child');
            if (statusSpan) {
                statusSpan.textContent = isActive ? '● Active' : '● Disabled';
                statusSpan.style.color = isActive ? '#10b981' : '#9ca3af';
            }
        }
    }

    updateEmailStats();
    showToast(`${emailType.replace(/-/g, ' ')} emails ${isActive ? 'enabled' : 'disabled'}`);
}

let currentEditingEmailType = null;

function editEmailTemplate(emailType) {
    currentEditingEmailType = emailType;
    const templates = getEmailTemplates();
    const template = templates[emailType] || defaultEmailTemplates[emailType];

    document.getElementById('email-template-type').value = emailType;
    document.getElementById('email-template-modal-title').textContent = `Edit ${emailType.replace(/-/g, ' ')} Template`;
    document.getElementById('email-template-subject').value = template.subject;
    document.getElementById('email-template-body').value = template.body;

    document.getElementById('email-template-modal').classList.add('active');
}

function closeEmailTemplateModal() {
    document.getElementById('email-template-modal').classList.remove('active');
    currentEditingEmailType = null;
}

function saveEmailTemplate() {
    if (!currentEditingEmailType) return;

    const templates = getEmailTemplates();
    templates[currentEditingEmailType] = {
        subject: document.getElementById('email-template-subject').value,
        body: document.getElementById('email-template-body').value
    };

    saveEmailTemplates(templates);
    closeEmailTemplateModal();
    showToast('Email template saved successfully');
}

let currentPreviewEmailType = null;

function previewEmail(emailType) {
    currentPreviewEmailType = emailType;
    const templates = getEmailTemplates();
    const template = templates[emailType] || defaultEmailTemplates[emailType];

    const sampleData = {
        firstName: 'Alex',
        orderNumber: '#ORD12345',
        total: '£89.99'
    };

    // Sanitize function (same as in main.js)
    const sanitizeHTML = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    let previewHtml = template.body
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
        .replace(/{{firstName}}/g, sampleData.firstName)
        .replace(/{{orderNumber}}/g, sampleData.orderNumber)
        .replace(/{{total}}/g, sampleData.total);

    const subjectLine = `<div style="background: #f3f4f6; padding: 0.75rem 1rem; margin: -2rem -2rem 1.5rem -2rem; font-size: 0.875rem; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong> ${sanitizeHTML(template.subject)}</div>`;

    const modalTitle = document.getElementById('email-preview-modal-title');
    const previewContent = document.getElementById('email-preview-content');
    const modal = document.getElementById('email-preview-modal');

    if (modalTitle) modalTitle.textContent = `${emailType.replace(/-/g, ' ')} Preview`;
    if (previewContent) previewContent.innerHTML = subjectLine + previewHtml;
    if (modal) modal.classList.add('active');
}

function closeEmailPreviewModal() {
    document.getElementById('email-preview-modal').classList.remove('active');
    currentPreviewEmailType = null;
}

async function sendTestEmail() {
    if (!currentPreviewEmailType) return;

    // Get current admin user
    const adminUser = JSON.parse(sessionStorage.getItem('1hundred_admin_session') || '{}');
    const email = adminUser.email || 'admin@1hundredornothing.co.uk';

    showToast('Sending test email...');

    try {
        let result;
        switch (currentPreviewEmailType) {
            case 'order-confirmation':
                result = await EmailService.sendOrderConfirmation(email, {
                    firstName: adminUser.name?.split(' ')[0] || 'Test',
                    orderNumber: 'TEST-001',
                    total: '99.99',
                    items: [{ name: 'Test Product', price: '99.99', quantity: 1 }]
                });
                break;
            case 'shipping-confirmation':
                result = await EmailService.sendShippingNotification(email, {
                    firstName: adminUser.name?.split(' ')[0] || 'Test',
                    orderNumber: 'TEST-001',
                    trackingNumber: 'TRK123456789',
                    carrier: 'Royal Mail'
                });
                break;
            case 'welcome':
                result = await EmailService.sendWelcomeEmail(email, {
                    firstName: adminUser.name?.split(' ')[0] || 'Test'
                });
                break;
            case 'abandoned-cart':
                result = await EmailService.sendAbandonedCartEmail(email, {
                    firstName: adminUser.name?.split(' ')[0] || 'Test',
                    total: '99.99',
                    items: [{ name: 'Test Product', price: '99.99' }]
                });
                break;
            default:
                showToast('Unknown email type');
                return;
        }

        if (result.success) {
            showToast('Test email sent successfully!');
        } else {
            showToast('Failed to send test email: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Test email error:', error);
        showToast('Error sending test email');
    }
}

// Content Management / Settings
function switchSettingsTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab').forEach((btn) => {
        btn.classList.remove('active');
        btn.style.color = '#6b7280';
        btn.style.borderBottomColor = 'transparent';
    });

    const activeBtn = document.querySelector(`.settings-tab[data-tab="${tab}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.color = '#111';
        activeBtn.style.borderBottomColor = '#111';
    }

    // Update panels
    document.querySelectorAll('.settings-panel').forEach((panel) => {
        panel.classList.remove('active');
        panel.style.display = 'none';
    });

    const activePanel = document.getElementById(`settings-${tab}`);
    if (activePanel) {
        activePanel.classList.add('active');
        activePanel.style.display = 'block';
    }
}

function saveContent() {
    const content = {
        storeName: document.getElementById('store-name')?.value || '',
        heroTitle: document.getElementById('hero-title')?.value || '',
        heroDescription: document.getElementById('hero-description')?.value || '',
        heroButtonText: document.getElementById('hero-button-text')?.value || '',
        currencySymbol: document.getElementById('currency-symbol')?.value || '£',
        storeEmail: document.getElementById('store-email')?.value || '',
        storePhone: document.getElementById('store-phone')?.value || '',
        socialInstagram: document.getElementById('social-instagram')?.value || '',
        socialTwitter: document.getElementById('social-twitter')?.value || '',
        socialFacebook: document.getElementById('social-facebook')?.value || '',
        socialTiktok: document.getElementById('social-tiktok')?.value || ''
    };

    localStorage.setItem('1hundred_store_content', JSON.stringify(content));
    showToast('Settings saved successfully');
}

function loadContent() {
    const stored = localStorage.getItem('1hundred_store_content');
    if (stored) {
        const content = JSON.parse(stored);
        if (document.getElementById('store-name'))
            document.getElementById('store-name').value = content.storeName || '';
        if (document.getElementById('hero-title'))
            document.getElementById('hero-title').value = content.heroTitle || '';
        if (document.getElementById('hero-description'))
            document.getElementById('hero-description').value = content.heroDescription || '';
        if (document.getElementById('hero-button-text'))
            document.getElementById('hero-button-text').value = content.heroButtonText || 'Shop Now';
        if (document.getElementById('currency-symbol'))
            document.getElementById('currency-symbol').value = content.currencySymbol || '£';
        if (document.getElementById('store-email'))
            document.getElementById('store-email').value = content.storeEmail || '';
        if (document.getElementById('store-phone'))
            document.getElementById('store-phone').value = content.storePhone || '';
        if (document.getElementById('social-instagram'))
            document.getElementById('social-instagram').value = content.socialInstagram || '';
        if (document.getElementById('social-twitter'))
            document.getElementById('social-twitter').value = content.socialTwitter || '';
        if (document.getElementById('social-facebook'))
            document.getElementById('social-facebook').value = content.socialFacebook || '';
        if (document.getElementById('social-tiktok'))
            document.getElementById('social-tiktok').value = content.socialTiktok || '';
    }
}

// Data Export/Import
function exportData() {
    const data = {
        products: AdminData.getProducts(),
        orders: AdminData.getOrders(),
        customers: AdminData.getCustomers(),
        emailSettings: AdminData.getEmailSettings(),
        content: JSON.parse(localStorage.getItem('1hundred_store_content') || '{}'),
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `1hundred-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data exported successfully');
}

function importData() {
    document.getElementById('import-file').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.products) await AdminData.saveProducts(data.products);
            if (data.orders) AdminData.saveOrders(data.orders);
            if (data.customers) AdminData.saveCustomers(data.customers);
            if (data.emailSettings) AdminData.saveEmailSettings(data.emailSettings);
            if (data.content) localStorage.setItem('1hundred_store_content', JSON.stringify(data.content));

            showToast('Data imported successfully');
            loadDashboard();
        } catch (err) {
            alert('Invalid file format');
        }
    };
    reader.readAsText(file);
}

// Clear All Data
function clearAllData() {
    if (
        !confirm(
            'Are you sure you want to clear ALL data?\n\nThis will delete:\n- All products\n- All orders\n- All customers\n- All email settings\n- All store settings\n\nThis action cannot be undone!'
        )
    ) {
        return;
    }

    // Clear all localStorage items
    localStorage.removeItem('1hundred_products');
    localStorage.removeItem('1hundred_orders');
    localStorage.removeItem('1hundred_customers');
    localStorage.removeItem('1hundred_email_settings');
    localStorage.removeItem('1hundred_email_templates');
    localStorage.removeItem('1hundred_email_activity');
    localStorage.removeItem('1hundred_store_content');

    showToast('All data cleared successfully');

    // Reload the current section to show empty state
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Logout
function logoutAdmin() {
    sessionStorage.removeItem('1hundred_admin_session');
    window.location.href = '/admin-login';
}

// Mobile Menu Functions
function toggleMobileMenu() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

function closeMobileMenu() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

// ========================================
// Media Gallery Management
// ========================================
const MediaAdmin = {
    async load() {
        const grid = document.getElementById('admin-media-grid');
        if (!grid) return;

        if (typeof MediaAPI === 'undefined') {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem 0; color: #ef4444;">Supabase not loaded — cannot manage media.</div>';
            return;
        }

        const { data, error } = await MediaAPI.getAll();
        if (error) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem 0; color: #ef4444;">Error loading media: ${escapeHtml(error.message || 'unknown')}</div>`;
            return;
        }
        if (!data || data.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: #9ca3af; font-size: 0.875rem;">No media yet — click Upload to add photos or videos.</div>';
            return;
        }

        grid.innerHTML = data
            .map(
                (item) => `
            <div style="position: relative; aspect-ratio: 1/1; background: #f3f4f6; overflow: hidden; border: 1px solid #e5e7eb;">
                ${
                    item.type === 'video'
                        ? `<video src="${escapeHtml(item.url)}" muted playsinline style="width:100%;height:100%;object-fit:cover;display:block;"></video>
                           <div style="position:absolute;top:8px;left:8px;background:rgba(0,0,0,0.7);color:#fff;padding:2px 6px;font-size:10px;border-radius:3px;text-transform:uppercase;letter-spacing:0.05em;">Video</div>`
                        : `<img src="${escapeHtml(item.url)}" alt="${escapeHtml(item.title || '')}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
                }
                <button onclick="MediaAdmin.remove(${item.id})" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.75);color:#fff;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;" title="Delete">
                    <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                </button>
            </div>`
            )
            .join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async upload(files) {
        if (!files || files.length === 0) return;
        const statusEl = document.getElementById('media-upload-status');
        if (typeof StorageAPI === 'undefined' || typeof MediaAPI === 'undefined') {
            showToast('Supabase not available', 'error');
            return;
        }

        statusEl.style.display = '';
        let done = 0;
        const total = files.length;

        for (const file of Array.from(files)) {
            const isVideo = file.type.startsWith('video/');
            const isImage = file.type.startsWith('image/');
            if (!isVideo && !isImage) continue;

            statusEl.textContent = `Uploading ${file.name} (${done + 1}/${total})…`;

            const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
            const path = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const { data: uploadData, error: uploadErr } = await StorageAPI.uploadFile('media', path, file, {
                contentType: file.type,
                cacheControl: '3600'
            });

            if (uploadErr || !uploadData?.publicUrl) {
                showToast(`Upload failed: ${uploadErr?.message || 'unknown'}`, 'error');
                continue;
            }

            const { error: createErr } = await MediaAPI.create({
                type: isVideo ? 'video' : 'image',
                url: uploadData.publicUrl,
                title: file.name.replace(/\.[^.]+$/, ''),
                position: done
            });

            if (createErr) {
                showToast(`Save failed: ${createErr.message || 'unknown'}`, 'error');
                continue;
            }
            done++;
        }

        statusEl.style.display = 'none';
        statusEl.textContent = '';
        showToast(`Uploaded ${done}/${total} item${done === 1 ? '' : 's'}`, 'success');
        await this.load();
    },

    async remove(id) {
        if (!confirm('Remove this media item?')) return;
        if (typeof MediaAPI === 'undefined') return;
        const { error } = await MediaAPI.delete(id);
        if (error) {
            showToast(`Delete failed: ${error.message}`, 'error');
            return;
        }
        showToast('Media removed', 'success');
        await this.load();
    },

    async initNavToggle() {
        const el = document.getElementById('media-nav-toggle');
        if (!el || typeof SettingsAPI === 'undefined') return;
        const value = await SettingsAPI.get('media_nav_visible', false);
        el.classList.toggle('active', value === true);
    }
};

async function toggleMediaNavVisibility(el) {
    if (typeof SettingsAPI === 'undefined') {
        showToast('Settings API not available', 'error');
        return;
    }
    const newValue = !el.classList.contains('active');
    el.classList.toggle('active', newValue);
    const { error } = await SettingsAPI.set('media_nav_visible', newValue);
    if (error) {
        showToast(`Failed to save: ${error.message}`, 'error');
        el.classList.toggle('active', !newValue);
        return;
    }
    showToast(newValue ? 'Media link visible on site' : 'Media link hidden', 'success');
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    initAdminSupabase();
    loadDashboard();
    loadContent();

    // Media upload handler
    const mediaInput = document.getElementById('media-upload-input');
    if (mediaInput) {
        mediaInput.addEventListener('change', (e) => {
            MediaAdmin.upload(e.target.files);
            e.target.value = '';
        });
    }

    // Close modal on overlay click
    const productModal = document.getElementById('product-modal');
    if (productModal) {
        productModal.addEventListener('click', function (e) {
            if (e.target === this) closeProductModal();
        });
    }

    // Close customer modal on overlay click
    const customerModal = document.getElementById('customer-modal');
    if (customerModal) {
        customerModal.addEventListener('click', function (e) {
            if (e.target === this) closeCustomerModal();
        });
    }

    // Close add customer modal on overlay click
    const addCustomerModal = document.getElementById('add-customer-modal');
    if (addCustomerModal) {
        addCustomerModal.addEventListener('click', function (e) {
            if (e.target === this) closeAddCustomerModal();
        });
    }

    // Close email template modal on overlay click
    const emailTemplateModal = document.getElementById('email-template-modal');
    if (emailTemplateModal) {
        emailTemplateModal.addEventListener('click', function (e) {
            if (e.target === this) closeEmailTemplateModal();
        });
    }

    // Close email preview modal on overlay click
    const emailPreviewModal = document.getElementById('email-preview-modal');
    if (emailPreviewModal) {
        emailPreviewModal.addEventListener('click', function (e) {
            if (e.target === this) closeEmailPreviewModal();
        });
    }

    // Close mobile menu when clicking nav items
    document.querySelectorAll('.admin-nav-item[data-section]').forEach((item) => {
        item.addEventListener('click', closeMobileMenu);
    });
});
