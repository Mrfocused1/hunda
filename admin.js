/**
 * Admin Dashboard JavaScript
 *
 * Features:
 * - Product CRUD with localStorage persistence
 * - Order management
 * - Customer management
 * - Email automation settings
 * - Data export/import
 */

// Check admin authentication
(function checkAuth() {
    const adminSession = sessionStorage.getItem('1hundred_admin_session');
    if (!adminSession && !window.location.href.includes('admin-login')) {
        window.location.href = '/admin-login';
    }
})();

// Admin Data Management
const AdminData = {
    // Get products from localStorage or use defaults
    getProducts: function () {
        const stored = localStorage.getItem('1hundred_products');
        if (stored) {
            return JSON.parse(stored);
        }
        // Default products
        const defaults = [
            {
                id: 1,
                title: 'Racer Trophy Tee',
                price: 45,
                image: 'product-1.png',
                category: 'Tops',
                stock: 25,
                description: 'Premium cotton tee with racing-inspired graphics.'
            },
            {
                id: 2,
                title: 'Champions Engineered Tee',
                price: 45,
                image: 'product-2.png',
                category: 'Tops',
                stock: 18,
                description: 'Championship-inspired design on premium fabric.'
            },
            {
                id: 3,
                title: '1H Vintage Trucker Hat',
                price: 35,
                image: 'product-3.png',
                category: 'Hats',
                stock: 12,
                description: 'Vintage style trucker hat with embroidered logo.'
            },
            {
                id: 4,
                title: 'Silence Expression Hoodie',
                price: 65,
                image: 'product-4.jpeg',
                category: 'Hoodies',
                stock: 8,
                description: 'Premium hoodie with unique graphic design.'
            },
            {
                id: 5,
                title: 'Endless Possibilities Hoodie',
                price: 65,
                image: 'product-5.jpeg',
                category: 'Hoodies',
                stock: 15,
                description: 'Comfortable hoodie with motivational graphics.'
            },
            {
                id: 6,
                title: '1H Colorway Trucker Hat',
                price: 35,
                image: 'product-6.jpeg',
                category: 'Hats',
                stock: 20,
                description: 'Colorful trucker hat with 1H branding.'
            }
        ];
        this.saveProducts(defaults);
        return defaults;
    },

    saveProducts: function (products) {
        localStorage.setItem('1hundred_products', JSON.stringify(products));
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
                  'abandoned-cart': false,
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
        content: 'Store Content'
    };
    document.getElementById('page-title').textContent = titles[section];

    // Refresh data
    if (section === 'dashboard') loadDashboard();
    if (section === 'products') loadProducts();
    if (section === 'orders') loadOrders();
    if (section === 'customers') loadCustomers();
    if (section === 'emails') initEmailToggles();
}

// Dashboard
function loadDashboard() {
    const products = AdminData.getProducts();
    const orders = AdminData.getOrders();
    const customers = AdminData.getCustomers();

    // Calculate stats
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

    document.getElementById('stat-sales').textContent = `£${totalSales.toFixed(2)}`;
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-products').textContent = products.length;
    document.getElementById('stat-customers').textContent = customers.length;

    // Recent orders
    const recentOrdersEl = document.getElementById('recent-orders-list');
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
    const lowStock = products.filter((p) => p.stock < 10);

    if (lowStock.length === 0) {
        lowStockEl.innerHTML = '<p class="text-gray-500 text-sm">No low stock items</p>';
    } else {
        lowStockEl.innerHTML = lowStock
            .map(
                (product) => `
            <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div class="flex items-center gap-3">
                    <img src="${product.image}" alt="${product.title}" class="w-10 h-10 object-cover">
                    <div>
                        <p class="font-medium text-sm">${product.title}</p>
                        <p class="text-xs text-gray-500">${product.category}</p>
                    </div>
                </div>
                <span class="status-badge low-stock">${product.stock} left</span>
            </div>
        `
            )
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
    const inStock = products.filter((p) => p.stock > 10).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
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
            if (productFilterStock === 'instock') return p.stock > 10;
            if (productFilterStock === 'low') return p.stock > 0 && p.stock <= 10;
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

            return `
            <div class="product-card">
                <div class="product-card-image">
                    <img src="${product.image}" alt="${product.title}" loading="lazy">
                    <span class="product-card-stock-badge ${stockStatus}">${stockLabel}</span>
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

    lucide.createIcons();
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

let currentProductImage = null;

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    // Reset image upload state
    currentProductImage = null;
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

        // Set current image
        if (product.image) {
            currentProductImage = product.image;
            showImagePreview(product.image);
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
    currentProductImage = null;
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

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

function handleImageSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        processImageFile(files[0]);
    }
}

function processImageFile(file) {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('Please upload a valid image file (PNG, JPG, or WEBP)');
        return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('Image file is too large. Maximum size is 5MB.');
        return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = function (e) {
        currentProductImage = e.target.result;
        showImagePreview(currentProductImage);
    };
    reader.readAsDataURL(file);
}

function showImagePreview(imageSrc) {
    const previewContainer = document.getElementById('image-preview-container');
    const preview = document.getElementById('image-preview');
    const uploadArea = document.getElementById('image-upload-area');
    const removeBtn = document.getElementById('remove-image-btn');

    preview.src = imageSrc;
    previewContainer.style.display = 'block';
    uploadArea.style.display = 'none';
    removeBtn.style.display = 'inline-block';

    // Store in hidden input
    document.getElementById('product-image').value = imageSrc;
}

function removeProductImage() {
    currentProductImage = null;
    resetImageUpload();
}

function resetImageUpload() {
    const previewContainer = document.getElementById('image-preview-container');
    const preview = document.getElementById('image-preview');
    const uploadArea = document.getElementById('image-upload-area');
    const removeBtn = document.getElementById('remove-image-btn');
    const fileInput = document.getElementById('product-image-file');
    const hiddenInput = document.getElementById('product-image');

    preview.src = '';
    previewContainer.style.display = 'none';
    uploadArea.style.display = 'block';
    uploadArea.classList.remove('has-image');
    removeBtn.style.display = 'none';
    fileInput.value = '';
    hiddenInput.value = '';
}

function saveProduct(event) {
    event.preventDefault();

    const id = document.getElementById('product-id').value;
    const products = AdminData.getProducts();

    const productData = {
        id: id ? parseInt(id) : Date.now(),
        title: document.getElementById('product-title').value,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        image: currentProductImage || 'product-1.png',
        stock: parseInt(document.getElementById('product-stock').value) || 0,
        description: document.getElementById('product-description').value
    };

    if (id) {
        // Update existing
        const index = products.findIndex((p) => p.id === parseInt(id));
        if (index !== -1) {
            products[index] = productData;
        }
    } else {
        // Add new
        products.push(productData);
    }

    AdminData.saveProducts(products);
    closeProductModal();
    loadProducts();
    showToast('Product saved successfully');
}

function editProduct(id) {
    openProductModal(id);
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const products = AdminData.getProducts().filter((p) => p.id !== id);
    AdminData.saveProducts(products);
    loadProducts();
    showToast('Product deleted');
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

    // Generate sample orders if none exist
    if (orders.length === 0) {
        orders = generateSampleOrders();
        AdminData.saveOrders(orders);
    }

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

function generateSampleOrders() {
    const sampleOrders = [];
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const customers = [
        { name: 'James Wilson', email: 'james@email.com' },
        { name: 'Sarah Anderson', email: 'sarah@email.com' },
        { name: 'Michael Brown', email: 'michael@email.com' },
        { name: 'Emma Davis', email: 'emma@email.com' }
    ];

    for (let i = 0; i < 12; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        sampleOrders.push({
            id: `#ORD${String(10000 + i).slice(-5)}`,
            customer: customer.name,
            email: customer.email,
            date: date.toISOString(),
            total: 25 + Math.floor(Math.random() * 200),
            items: Math.floor(Math.random() * 4) + 1,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            itemsList: ['Racer Trophy Tee', 'Champions Engineered Tee', '1H Vintage Trucker Hat']
        });
    }

    return sampleOrders;
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
            const initials = order.customer
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();
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
                        <div class="order-card-customer-email">${order.email || order.customer.toLowerCase().replace(' ', '.') + '@email.com'}</div>
                    </div>
                </div>
                
                <div class="order-card-footer">
                    <span class="order-card-total">£${order.total.toFixed(2)}</span>
                    <span style="font-size: 0.8125rem; color: #6b7280;">${order.items} items</span>
                </div>
            </div>
        `;
        })
        .join('');

    lucide.createIcons();
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

function updateOrderStatus(orderId, status) {
    const orders = AdminData.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
        order.status = status;
        AdminData.saveOrders(orders);
        showToast(`Order ${orderId} updated to ${status}`);
        updateOrderStats();
    }
}

function viewOrder(orderId) {
    const orders = AdminData.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
        alert(
            `Order Details:\n\nID: ${order.id}\nCustomer: ${order.customer}\nEmail: ${order.email || 'N/A'}\nTotal: £${order.total.toFixed(2)}\nStatus: ${order.status}\n\nItems:\n${order.itemsList?.join('\n') || 'N/A'}`
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
                o.customer,
                o.email || '',
                new Date(o.date).toISOString().split('T')[0],
                o.total.toFixed(2),
                o.items,
                o.status
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

    // Generate sample customers if none exist
    if (allCustomers.length === 0) {
        allCustomers = generateSampleCustomers();
        AdminData.saveCustomers(allCustomers);
    }

    updateCustomerStats();
    renderCustomers();
}

function generateSampleCustomers() {
    const sampleNames = [
        ['James', 'Wilson'],
        ['Sarah', 'Anderson'],
        ['Michael', 'Brown'],
        ['Emma', 'Davis'],
        ['William', 'Taylor'],
        ['Olivia', 'Thomas'],
        ['Alexander', 'Jackson'],
        ['Sophie', 'White'],
        ['Daniel', 'Harris'],
        ['Chloe', 'Martin'],
        ['Matthew', 'Thompson'],
        ['Lucy', 'Garcia'],
        ['Ryan', 'Martinez'],
        ['Grace', 'Robinson'],
        ['Benjamin', 'Clark'],
        ['Zoe', 'Rodriguez']
    ];

    return sampleNames.map((name, index) => {
        const orderCount = Math.floor(Math.random() * 8) + 1;
        const totalSpent = orderCount * (25 + Math.floor(Math.random() * 100));
        const daysAgo = Math.floor(Math.random() * 365);
        const joinedDate = new Date();
        joinedDate.setDate(joinedDate.getDate() - daysAgo);

        // Determine customer status
        let status = 'active';
        if (totalSpent > 300) status = 'vip';
        else if (daysAgo < 30) status = 'new';
        else if (daysAgo > 180) status = 'inactive';

        return {
            id: `cust_${Date.now()}_${index}`,
            firstName: name[0],
            lastName: name[1],
            email: `${name[0].toLowerCase()}.${name[1].toLowerCase()}@email.com`,
            phone: `+44 7${Math.floor(Math.random() * 900000000 + 100000000)}`,
            orders: orderCount,
            totalSpent: totalSpent,
            joined: joinedDate.toISOString(),
            status: status,
            lastOrder: new Date(
                joinedDate.getTime() + Math.random() * (Date.now() - joinedDate.getTime())
            ).toISOString(),
            notes: ''
        };
    });
}

function updateCustomerStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalCustomers = allCustomers.length;
    const newThisMonth = allCustomers.filter((c) => new Date(c.joined) > thirtyDaysAgo).length;
    const vipCustomers = allCustomers.filter((c) => c.status === 'vip').length;
    const avgOrderValue =
        allCustomers.length > 0
            ? allCustomers.reduce((sum, c) => sum + c.totalSpent / c.orders, 0) / allCustomers.length
            : 0;

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
                c.firstName.toLowerCase().includes(term) ||
                c.lastName.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term)
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
            const initials = `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
            const joinedDate = new Date(customer.joined).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric'
            });
            const lastOrderDate = new Date(customer.lastOrder).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short'
            });

            const statusBadges = [];
            if (customer.status === 'vip') statusBadges.push('<span class="customer-badge vip">VIP</span>');
            if (customer.status === 'new') statusBadges.push('<span class="customer-badge new">New</span>');
            if (customer.status === 'active') statusBadges.push('<span class="customer-badge active">Active</span>');

            return `
            <div class="customer-card" onclick="viewCustomerDetails('${customer.id}')">
                <div class="customer-card-header">
                    <div class="customer-avatar ${customer.status}">${initials}</div>
                    <div class="customer-info">
                        <div class="customer-name">${customer.firstName} ${customer.lastName}</div>
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
                        <div class="customer-stat-value">£${customer.totalSpent.toFixed(0)}</div>
                        <div class="customer-stat-label">Spent</div>
                    </div>
                    <div class="customer-stat">
                        <div class="customer-stat-value">£${(customer.totalSpent / customer.orders).toFixed(0)}</div>
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

    lucide.createIcons();
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

    const initials = `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase();
    const joinedDate = new Date(customer.joined).toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
    });
    const aov = (customer.totalSpent / customer.orders).toFixed(2);

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

    // Generate mock orders for this customer
    const ordersList = document.getElementById('customer-modal-orders-list');
    const mockOrders = generateMockOrdersForCustomer(customer);

    if (mockOrders.length === 0) {
        ordersList.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 2rem;">No orders yet</p>';
    } else {
        ordersList.innerHTML = mockOrders
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
    lucide.createIcons();
}

function generateMockOrdersForCustomer(customer) {
    const orders = [];
    const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'processing'];

    for (let i = 0; i < Math.min(customer.orders, 5); i++) {
        const date = new Date(customer.lastOrder);
        date.setDate(date.getDate() - i * 15 - Math.floor(Math.random() * 10));

        orders.push({
            id: `#ORD${String(10000 + Math.floor(Math.random() * 90000)).slice(-5)}`,
            date: date.toISOString(),
            total: 25 + Math.floor(Math.random() * 150),
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }

    return orders;
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

// Email Automation
function initEmailToggles() {
    updateEmailStats();

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

    // Mock stats for demo
    document.getElementById('email-active-count').textContent = activeCount;
    document.getElementById('email-sent-count').textContent = '1,247';
    document.getElementById('email-open-rate').textContent = '42%';
    document.getElementById('email-click-rate').textContent = '18%';
}

function toggleEmail(emailType, element) {
    element.classList.toggle('active');
    const isActive = element.classList.contains('active');

    const settings = AdminData.getEmailSettings();
    settings[emailType] = isActive;
    AdminData.saveEmailSettings(settings);

    // Update the status text in the footer
    const card = element.closest('.email-automation-card');
    const statusSpan = card.querySelector('.email-automation-card > div:last-child span:last-child');
    if (statusSpan) {
        statusSpan.textContent = isActive ? '● Active' : '● Disabled';
        statusSpan.style.color = isActive ? '#10b981' : '#9ca3af';
    }

    updateEmailStats();
    showToast(`${emailType.replace('-', ' ')} emails ${isActive ? 'enabled' : 'disabled'}`);
}

function editEmailTemplate(emailType) {
    showToast(`Edit template for ${emailType.replace('-', ' ')} - Coming soon`);
}

function previewEmail(emailType) {
    showToast(`Preview ${emailType.replace('-', ' ')} email - Coming soon`);
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
        storeName: document.getElementById('store-name').value,
        heroTitle: document.getElementById('hero-title').value,
        heroDescription: document.getElementById('hero-description').value,
        heroButtonText: document.getElementById('hero-button-text')?.value || 'Shop Now',
        currencySymbol: document.getElementById('currency-symbol').value,
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
            document.getElementById('store-name').value = content.storeName || '1 HUNDRED';
        if (document.getElementById('hero-title'))
            document.getElementById('hero-title').value = content.heroTitle || 'THE NEW WAVE';
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
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (data.products) AdminData.saveProducts(data.products);
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

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    initNavigation();
    loadDashboard();
    loadContent();

    // Close modal on overlay click
    document.getElementById('product-modal').addEventListener('click', function (e) {
        if (e.target === this) closeProductModal();
    });

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

    // Close mobile menu when clicking nav items
    document.querySelectorAll('.admin-nav-item[data-section]').forEach((item) => {
        item.addEventListener('click', closeMobileMenu);
    });
});
