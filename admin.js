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
function loadProducts() {
    const products = AdminData.getProducts();
    const tbody = document.getElementById('products-table-body');

    tbody.innerHTML = products
        .map(
            (product) => `
        <tr>
            <td><img src="${product.image}" alt="${product.title}"></td>
            <td>
                <p class="font-medium">${product.title}</p>
                <p class="text-xs text-gray-500">${product.description?.substring(0, 50) || ''}...</p>
            </td>
            <td>${product.category}</td>
            <td>£${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-badge ${product.stock < 10 ? 'low-stock' : 'in-stock'}">
                    ${product.stock < 10 ? 'Low Stock' : 'In Stock'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm btn-icon" onclick="editProduct(${product.id})">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                <button class="btn btn-secondary btn-sm btn-icon" onclick="deleteProduct(${product.id})">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `
        )
        .join('');

    lucide.createIcons();
}

function openProductModal(productId = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('product-form');

    if (productId) {
        const products = AdminData.getProducts();
        const product = products.find((p) => p.id === productId);

        title.textContent = 'Edit Product';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-title').value = product.title;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-stock').value = product.stock;
        document.getElementById('product-description').value = product.description || '';
    } else {
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('product-id').value = '';
    }

    modal.classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
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
        image: document.getElementById('product-image').value || 'product-1.png',
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
function loadOrders(filter = 'all') {
    const orders = AdminData.getOrders();
    const tbody = document.getElementById('orders-table-body');

    const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

    tbody.innerHTML = filteredOrders
        .map(
            (order) => `
        <tr>
            <td class="font-medium">${order.id}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>${order.customer}</td>
            <td>${order.items} items</td>
            <td>£${order.total.toFixed(2)}</td>
            <td>
                <select class="form-input text-xs" style="width: auto; padding: 0.25rem 0.5rem; height: auto;" 
                        onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                </select>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="viewOrder('${order.id}')">View</button>
            </td>
        </tr>
    `
        )
        .join('');
}

function filterOrders() {
    const filter = document.getElementById('order-filter').value;
    loadOrders(filter);
}

function updateOrderStatus(orderId, status) {
    const orders = AdminData.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
        order.status = status;
        AdminData.saveOrders(orders);
        showToast(`Order ${orderId} updated to ${status}`);
    }
}

function viewOrder(orderId) {
    const orders = AdminData.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (order) {
        alert(
            `Order Details:\n\nID: ${order.id}\nCustomer: ${order.customer}\nEmail: ${order.email}\nTotal: £${order.total.toFixed(2)}\nStatus: ${order.status}\n\nItems:\n${order.itemsList?.join('\n') || 'N/A'}`
        );
    }
}

// Customers Management
function loadCustomers() {
    const customers = AdminData.getCustomers();
    const tbody = document.getElementById('customers-table-body');

    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-500">No customers yet</td></tr>';
        return;
    }

    tbody.innerHTML = customers
        .map(
            (customer) => `
        <tr>
            <td>${customer.firstName} ${customer.lastName}</td>
            <td>${customer.email}</td>
            <td>${customer.orders || 0}</td>
            <td>£${(customer.totalSpent || 0).toFixed(2)}</td>
            <td>${new Date(customer.joined).toLocaleDateString()}</td>
        </tr>
    `
        )
        .join('');
}

// Email Automation
function initEmailToggles() {
    const settings = AdminData.getEmailSettings();

    document.querySelectorAll('.toggle-switch[data-email]').forEach((toggle) => {
        const emailType = toggle.dataset.email;
        toggle.classList.toggle('active', settings[emailType]);

        toggle.addEventListener('click', function () {
            this.classList.toggle('active');
            settings[emailType] = this.classList.contains('active');
            AdminData.saveEmailSettings(settings);
            showToast(`${emailType.replace('-', ' ')} emails ${settings[emailType] ? 'enabled' : 'disabled'}`);
        });
    });
}

// Content Management
function saveContent() {
    const content = {
        storeName: document.getElementById('store-name').value,
        heroTitle: document.getElementById('hero-title').value,
        heroDescription: document.getElementById('hero-description').value,
        currencySymbol: document.getElementById('currency-symbol').value
    };

    localStorage.setItem('1hundred_store_content', JSON.stringify(content));
    showToast('Content saved successfully');
}

function loadContent() {
    const stored = localStorage.getItem('1hundred_store_content');
    if (stored) {
        const content = JSON.parse(stored);
        document.getElementById('store-name').value = content.storeName || '1 HUNDRED';
        document.getElementById('hero-title').value = content.heroTitle || 'THE NEW WAVE';
        document.getElementById('hero-description').value = content.heroDescription || '';
        document.getElementById('currency-symbol').value = content.currencySymbol || '£';
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

    // Close mobile menu when clicking nav items
    document.querySelectorAll('.admin-nav-item[data-section]').forEach((item) => {
        item.addEventListener('click', closeMobileMenu);
    });
});
