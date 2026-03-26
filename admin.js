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
            <td>
                <p class="font-medium line-clamp-2">${product.title}</p>
                <p class="text-xs text-gray-500 hidden sm:block">${product.description?.substring(0, 40) || ''}...</p>
            </td>
            <td><img src="${product.image}" alt="${product.title}" loading="lazy"></td>
            <td><span class="capitalize">${product.category}</span></td>
            <td class="font-medium">£${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-badge ${product.stock < 10 ? 'low-stock' : 'in-stock'}">
                    ${product.stock < 10 ? 'Low' : 'In Stock'}
                </span>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm btn-icon" onclick="editProduct(${product.id})" aria-label="Edit">
                    <i data-lucide="edit" class="w-4 h-4"></i>
                </button>
                <button class="btn btn-secondary btn-sm btn-icon" onclick="deleteProduct(${product.id})" aria-label="Delete">
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
            <td>${new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
            <td>
                <p class="font-medium">${order.customer}</p>
                <p class="text-xs text-gray-500 sm:hidden">${order.items} items · £${order.total.toFixed(2)}</p>
            </td>
            <td class="hidden sm:table-cell">${order.items}</td>
            <td class="hidden sm:table-cell font-medium">£${order.total.toFixed(2)}</td>
            <td>
                <select class="form-input status-select" 
                        onchange="updateOrderStatus('${order.id}', this.value)"
                        aria-label="Order status">
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
