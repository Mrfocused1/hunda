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
// HARDCODED PRODUCTS - To be replaced with Supabase in future
const products = [
    {
        id: 1,
        title: 'Racer Trophy Tee',
        price: 45,
        category: 'Tops',
        images: ['product-1.png'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Grey']
    },
    {
        id: 3,
        title: '1H Vintage Trucker Hat',
        price: 35,
        category: 'Hats',
        images: ['product-3.png'],
        sizes: ['One Size'],
        colors: ['White/Black']
    },
    {
        id: 4,
        title: 'Silence Expression Hoodie',
        price: 65,
        category: 'Hoodies',
        images: ['product-4.jpeg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Black']
    },
    {
        id: 5,
        title: 'Endless Possibilities Hoodie',
        price: 65,
        category: 'Hoodies',
        images: ['product-5.jpeg'],
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Blue']
    },
    {
        id: 6,
        title: '1H Colorway Trucker Hat',
        price: 35,
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

const categories = [
    { name: 'Tops', slug: 'tops', count: 2 },
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

    // Get primary image (support both old single image and new images array)
    let primaryImage = 'product-1.png';
    if (product.images && Array.isArray(product.images)) {
        primaryImage = product.images[0];
    } else if (product.image) {
        primaryImage = product.image;
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
    if (sizeContainer) {
        sizeContainer.innerHTML = product.sizes
            .map(
                (size) => `
            <button class="size-option" data-size="${size}" onclick="selectQVSize('${size}')">${size}</button>
        `
            )
            .join('');
    }

    // Store current product
    modal.dataset.productId = productId;
    modal.dataset.selectedSize = '';

    // Show modal
    overlay.classList.remove('invisible', 'opacity-0');
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');
    document.body.style.overflow = 'hidden';
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

function addToCartFromQV() {
    const modal = document.getElementById('quick-view-modal');
    if (!modal) return;

    const productId = parseInt(modal.dataset.productId);
    const size = modal.dataset.selectedSize;

    if (!size) {
        showToast('Please select a size');
        return;
    }

    addToCart(productId, size, 'Black', 1);
    closeQuickView();
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
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initLoader();
    updateBadges();
    updateWishlistButtons();

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
