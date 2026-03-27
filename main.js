// ========================================
// 1 HUNDRED - Main JavaScript
// ========================================

// --- STATE ---
const state = {
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
    user: JSON.parse(localStorage.getItem('user')) || null,
    isMenuOpen: false,
    isCartOpen: false,
    isSearchOpen: false
};

// --- PRODUCT DATA ---
// Fallback products (used when Supabase is not available)
const FALLBACK_PRODUCTS = [
    {
        id: 3,
        title: '1H Star Cap',
        price: 30,
        category: 'Hats',
        images: ['product-3.png'],
        sizes: ['One Size'],
        colors: ['White/Black']
    },
    {
        id: 4,
        title: 'The No Half Measures Hoodie',
        price: 85,
        category: 'Hoodies',
        images: ['product-4.jpeg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black']
    },
    {
        id: 5,
        title: 'Endless Possibilities Hoodie',
        price: 85,
        category: 'Hoodies',
        images: ['product-5.jpeg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Blue']
    },
    {
        id: 6,
        title: '1H Multi Colour Cap',
        price: 30,
        category: 'Hats',
        images: ['product-6.jpeg'],
        sizes: ['One Size'],
        colors: ['White/Black']
    },
    {
        id: 7,
        title: 'Relentless Trophy Tee',
        price: 40,
        category: 'Tops',
        images: ['product-relentless-front.png', 'product-relentless-back.png'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Grey']
    }
];

// Active products (will be populated from Supabase or fallback)
let products = [...FALLBACK_PRODUCTS];

// Initialize Supabase and load products
async function initProducts() {
    // Initialize Supabase client
    if (typeof initSupabase === 'function') {
        initSupabase();
    }

    // Try to load from Supabase
    if (typeof ProductAPI !== 'undefined') {
        try {
            const { data, error } = await ProductAPI.getAll();
            if (data && data.length > 0) {
                products = data.map((p) => ({
                    id: p.id,
                    title: p.title,
                    price: p.price,
                    category: p.category,
                    images: p.images || [p.image],
                    sizes: p.sizes || ['S', 'M', 'L', 'XL'],
                    colors: p.colors || ['Default']
                }));
                // Products loaded from Supabase
            } else {
                // No products in Supabase, using fallback data
            }
        } catch (err) {
            // Could not load from Supabase, using fallback data
        }
    }

    // Update categories based on products
    updateCategories();

    // Dispatch event to notify that products are ready
    window.dispatchEvent(new CustomEvent('productsReady', { detail: products }));
}

// Update categories from products
function updateCategories() {
    const categoryCounts = {};
    products.forEach((p) => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    // Update categories array
    categories.length = 0;
    Object.entries(categoryCounts).forEach(([name, count]) => {
        categories.push({
            name,
            slug: name.toLowerCase(),
            count
        });
    });
}

let categories = [
    { name: 'Tops', slug: 'tops', count: 1 },
    { name: 'Hoodies', slug: 'hoodies', count: 2 },
    { name: 'Hats', slug: 'hats', count: 2 }
];

// ========================================
// HEADER & NAVIGATION
// ========================================

function initHeader() {
    // Header scroll effect
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const menuToggleClose = document.getElementById('menu-toggle-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            state.isMenuOpen = !state.isMenuOpen;
            menuToggle.classList.toggle('active', state.isMenuOpen);
            mobileMenu.classList.toggle('active', state.isMenuOpen);
            if (menuOverlay) menuOverlay.classList.toggle('active', state.isMenuOpen);
            document.body.style.overflow = state.isMenuOpen ? 'hidden' : '';
        });
    }

    if (menuToggleClose) {
        menuToggleClose.addEventListener('click', closeMobileMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMobileMenu);
    }

    // Mobile submenu toggles
    document.querySelectorAll('.mobile-nav-link[data-submenu]').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const submenuId = link.dataset.submenu;
            const submenu = document.getElementById(submenuId);
            const icon = link.querySelector('.submenu-icon');

            if (submenu) {
                submenu.classList.toggle('open');
                if (icon) icon.style.transform = submenu.classList.contains('open') ? 'rotate(180deg)' : '';
            }
        });
    });

    // Cart drawer
    const cartTrigger = document.getElementById('cart-trigger');
    const cartTriggerMobile = document.getElementById('cart-trigger-mobile');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');

    if (cartTrigger && cartDrawer) {
        cartTrigger.addEventListener('click', () => toggleCart(true));
    }

    if (cartTriggerMobile && cartDrawer) {
        cartTriggerMobile.addEventListener('click', () => toggleCart(true));
    }

    if (closeCart) {
        closeCart.addEventListener('click', () => toggleCart(false));
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', () => toggleCart(false));
    }

    // Update badge counts
    updateBadges();
}

function closeMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    state.isMenuOpen = false;
    if (menuToggle) menuToggle.classList.remove('active');
    if (mobileMenu) mobileMenu.classList.remove('active');
    if (menuOverlay) menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleCart(open) {
    state.isCartOpen = open;
    const cartDrawer = document.getElementById('cart-drawer');
    const cartOverlay = document.getElementById('cart-overlay');

    if (cartDrawer) {
        cartDrawer.classList.toggle('translate-x-full', !open);
    }
    if (cartOverlay) {
        cartOverlay.classList.toggle('active', open);
    }
    document.body.style.overflow = open ? 'hidden' : '';

    if (open) renderMiniCart();
}

// ========================================
// CART FUNCTIONS
// ========================================

function addToCart(productId, size, color, quantity = 1) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = state.cart.find((item) => item.id === productId && item.size === size && item.color === color);

    // Get primary image (support local files and Supabase Storage)
    let primaryImage = 'product-1.png';
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        primaryImage =
            typeof getProductImageUrl !== 'undefined' ? getProductImageUrl(product.images[0]) : product.images[0];
    } else if (product.image) {
        primaryImage = typeof getProductImageUrl !== 'undefined' ? getProductImageUrl(product.image) : product.image;
    }

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        state.cart.push({
            id: productId,
            title: product.title,
            price: product.price,
            image: primaryImage,
            size,
            color,
            quantity
        });
    }

    saveCart();
    updateBadges();
    showToast('Added to bag');
}

function removeFromCart(productId, size, color) {
    state.cart = state.cart.filter((item) => !(item.id === productId && item.size === size && item.color === color));
    saveCart();
    updateBadges();
    renderMiniCart();

    // If on cart page, re-render
    if (document.getElementById('cart-items-container')) {
        renderCartPage();
    }
}

function updateCartQuantity(productId, size, color, quantity) {
    const item = state.cart.find((item) => item.id === productId && item.size === size && item.color === color);

    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId, size, color);
        } else {
            item.quantity = quantity;
            saveCart();
            updateBadges();
            renderMiniCart();

            if (document.getElementById('cart-items-container')) {
                renderCartPage();
            }
        }
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(state.cart));
}

function getCartTotal() {
    return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getCartCount() {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
}

function updateBadges() {
    const cartCount = getCartCount();
    const cartBadge = document.getElementById('cart-count');
    const cartBadgeMobile = document.getElementById('cart-count-mobile');

    [cartBadge, cartBadgeMobile].forEach((badge) => {
        if (badge) {
            badge.textContent = cartCount;
            badge.classList.toggle('hidden', cartCount === 0);
        }
    });

    const wishlistCount = state.wishlist.length;
    const wishlistBadge = document.getElementById('wishlist-count');

    if (wishlistBadge) {
        wishlistBadge.textContent = wishlistCount;
        wishlistBadge.classList.toggle('hidden', wishlistCount === 0);
    }
}

function renderMiniCart() {
    const container = document.getElementById('mini-cart-items');
    const subtotalEl = document.getElementById('mini-cart-subtotal');
    const countEl = document.getElementById('mini-cart-count');

    if (!container) return;

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 3rem 1rem;">
                <i data-lucide="shopping-bag" class="empty-state-icon"></i>
                <p class="empty-state-text">Your bag is empty</p>
                <a href="/shop" class="btn btn-primary btn-sm">Continue Shopping</a>
            </div>
        `;
    } else {
        container.innerHTML = state.cart
            .map(
                (item) => `
            <div class="flex gap-4 mb-4">
                <div class="w-20 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start gap-2">
                        <h4 class="font-bold text-sm uppercase truncate">${item.title}</h4>
                        <span class="font-bold text-sm">£${item.price.toFixed(2)}</span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">${item.color} | ${item.size}</p>
                    <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center border border-gray-200 rounded">
                            <button onclick="updateCartQuantity(${item.id}, '${item.size}', '${item.color}', ${item.quantity - 1})" class="px-2 py-1 text-xs hover:bg-gray-100">-</button>
                            <span class="px-2 text-xs font-bold">${item.quantity}</span>
                            <button onclick="updateCartQuantity(${item.id}, '${item.size}', '${item.color}', ${item.quantity + 1})" class="px-2 py-1 text-xs hover:bg-gray-100">+</button>
                        </div>
                        <button onclick="removeFromCart(${item.id}, '${item.size}', '${item.color}')" class="text-xs text-gray-400 underline hover:text-red-500">Remove</button>
                    </div>
                </div>
            </div>
        `
            )
            .join('');
    }

    if (subtotalEl) subtotalEl.textContent = `£${getCartTotal().toFixed(2)}`;
    if (countEl) countEl.textContent = state.cart.length;

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ========================================
// WISHLIST FUNCTIONS
// ========================================

function toggleWishlist(productId) {
    const index = state.wishlist.indexOf(productId);

    if (index > -1) {
        state.wishlist.splice(index, 1);
        showToast('Removed from wishlist');
    } else {
        state.wishlist.push(productId);
        showToast('Added to wishlist');
    }

    localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
    updateBadges();
    updateWishlistButtons();
}

function isInWishlist(productId) {
    return state.wishlist.includes(productId);
}

function updateWishlistButtons() {
    document.querySelectorAll('.wishlist-btn').forEach((btn) => {
        const productId = parseInt(btn.dataset.productId);
        const isActive = isInWishlist(productId);
        btn.classList.toggle('active', isActive);

        const icon = btn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isActive ? 'heart' : 'heart');
            icon.style.fill = isActive ? 'currentColor' : 'none';
        }
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ========================================
// UI HELPERS
// ========================================

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    if (toast && toastMsg) {
        toastMsg.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
}

function formatPrice(price) {
    return `£${price.toFixed(2)}`;
}

// ========================================
// QUICK VIEW MODAL
// ========================================

function openQuickView(productId) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('quick-view-modal');
    const overlay = document.getElementById('quick-view-overlay');

    if (!modal || !overlay) return;

    // Get primary image (support both old single image and new images array)
    let primaryImage = 'product-1.png';
    if (product.images && Array.isArray(product.images)) {
        primaryImage = product.images[0];
    } else if (product.image) {
        primaryImage = product.image;
    }

    // Populate modal
    document.getElementById('qv-image').src = primaryImage;
    document.getElementById('qv-title').textContent = product.title;
    document.getElementById('qv-price').textContent = formatPrice(product.price);
    document.getElementById('qv-category').textContent = product.category;

    // Render sizes
    const sizeContainer = document.getElementById('qv-sizes');
    const sizeLabel = document.querySelector('#qv-sizes')?.previousElementSibling;

    if (sizeContainer) {
        // Check if only one size (auto-select it)
        if (product.sizes.length === 1) {
            const size = product.sizes[0];
            sizeContainer.innerHTML = `
                <div class="size-option active" data-size="${size}" style="cursor: default; opacity: 0.7;">${size}</div>
            `;
            modal.dataset.selectedSize = size;
            // Hide the "Select Size" label or change it
            if (sizeLabel) sizeLabel.innerHTML = '<span>Size</span>';
        } else {
            // Multiple sizes - render clickable buttons
            sizeContainer.innerHTML = product.sizes
                .map(
                    (size) => `
                <button class="size-option" data-size="${size}">${size}</button>
            `
                )
                .join('');
            modal.dataset.selectedSize = '';
            if (sizeLabel) {
                sizeLabel.innerHTML = `
                    <span style="color: #dc2626; font-weight: 700; font-size: 0.875rem;">
                        SELECT A SIZE
                    </span>
                    <span style="background: #dc2626; color: white; font-size: 0.625rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 8px; text-transform: uppercase;">
                        Required
                    </span>
                `;
            }
        }
    }

    // Store current product
    modal.dataset.productId = productId;

    // Show modal
    overlay.classList.remove('invisible', 'opacity-0');
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');
    document.body.style.overflow = 'hidden';

    // Attach CSP-compatible event listeners to size buttons (for multiple sizes)
    if (sizeContainer && product.sizes.length > 1) {
        sizeContainer.querySelectorAll('.size-option').forEach((btn) => {
            btn.addEventListener('click', function () {
                const size = this.dataset.size;
                modal.dataset.selectedSize = size;

                // Update visual state
                sizeContainer.querySelectorAll('.size-option').forEach((b) => {
                    b.classList.toggle('active', b.dataset.size === size);
                });

                // Clear any error state
                sizeContainer.classList.remove('size-error');
            });
        });
    }
}

function closeQuickView() {
    const modal = document.getElementById('quick-view-modal');
    const overlay = document.getElementById('quick-view-overlay');

    if (modal && overlay) {
        overlay.classList.add('invisible', 'opacity-0');
        modal.classList.add('scale-95', 'opacity-0');
        modal.classList.remove('scale-100', 'opacity-100');
        document.body.style.overflow = '';
    }
}

function selectQVSize(size) {
    const modal = document.getElementById('quick-view-modal');
    if (modal) modal.dataset.selectedSize = size;

    document.querySelectorAll('#qv-sizes .size-option').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.size === size);
    });
}

function addToCartFromQV(btn) {
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;

    const productId = parseInt(modal.dataset.productId);
    const size = modal.dataset.selectedSize;
    const sizeContainer = document.getElementById('qv-sizes');

    if (!size) {
        // Show visual red error on size selector
        if (sizeContainer) {
            sizeContainer.classList.add('size-error');
            // Add shake animation
            sizeContainer.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => {
                sizeContainer.style.animation = '';
            }, 300);
        }
        showToast('Please select a size', 'warning');
        return;
    } else {
        // Clear error state
        if (sizeContainer) sizeContainer.classList.remove('size-error');
    }

    // Show loading state
    const originalText = btn ? btn.textContent : 'Add to Bag';
    if (btn) {
        btn.textContent = 'Adding...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    }

    // Get product info for toast
    const product = products.find((p) => p.id === productId);
    const productTitle = product ? product.title : 'Item';

    // Add to cart
    addToCart(productId, size, 'Black', 1);

    // Close quick view and open cart drawer
    closeQuickView();

    // Show success toast and open cart
    setTimeout(() => {
        showToast(`${productTitle} added to bag`, 'success');
        toggleCart(true); // Open cart drawer

        // Reset button state
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }, 100);
}

// ========================================
// PAGE LOADER
// ========================================

function initLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 500);
        });
    }
}

// ========================================
// LOADING & ERROR STATES
// ========================================

// Show loading spinner
function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
                <p class="mt-4 text-gray-600">${message}</p>
            </div>
        `;
    }
}

// Show error message
function showError(elementId, message = 'Something went wrong. Please try again.') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 text-center">
                <i data-lucide="alert-circle" class="w-12 h-12 text-red-500 mb-4"></i>
                <p class="text-gray-600 mb-4">${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Enhanced toast notification
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');

    if (!toast || !toastMsg) return;

    // Set icon based on type
    const iconMap = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    const iconName = iconMap[type] || 'check-circle';

    toast.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i><span id="toast-msg">${message}</span>`;
    toast.className = `toast ${type}`;
    toast.style.display = 'flex';

    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dropdown');

    if (!searchInput) return;

    // Handle search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/shop?q=${encodeURIComponent(query)}`;
            }
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            if (searchDropdown) searchDropdown.style.display = 'none';
        }
    });

    // Show dropdown on focus
    searchInput.addEventListener('focus', () => {
        if (searchDropdown) searchDropdown.style.display = 'block';
    });
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    initHeader();
    initLoader();
    updateBadges();
    updateWishlistButtons();

    // Initialize Supabase products with error handling
    try {
        await initProducts();
    } catch (err) {
        console.error('Failed to initialize products:', err);
        showToast('Using offline mode', 'warning');
    }

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Close modals on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeQuickView();
            toggleCart(false);
            closeMobileMenu();
        }
    });

    // Search functionality
    initSearch();
});

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('Something went wrong. Please refresh the page.', 'error', 5000);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('Network error. Please check your connection.', 'error', 5000);
});

// Expose functions globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.toggleWishlist = toggleWishlist;
window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView;
window.selectQVSize = selectQVSize;
window.addToCartFromQV = addToCartFromQV;
window.toggleCart = toggleCart;
window.showToast = showToast;
window.showLoading = showLoading;
window.showError = showError;
window.sanitizeHTML = function (str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};
