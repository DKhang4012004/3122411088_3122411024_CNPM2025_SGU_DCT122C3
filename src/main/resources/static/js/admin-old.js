// Admin JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is admin
    if (!auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize admin UI
    initAdminUI();
    loadDashboardStats();

    // Set admin user name
    const adminUserName = document.getElementById('adminUserName');
    if (adminUserName) {
        adminUserName.textContent = auth.getUser()?.username || 'Admin';
    }
});

// Initialize Admin UI
function initAdminUI() {
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });

    // Sidebar toggle (mobile)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Logout
    const adminLogout = document.getElementById('adminLogout');
    if (adminLogout) {
        adminLogout.addEventListener('click', () => {
            auth.logout();
        });
    }

    // Modal handlers
    setupModals();

    // Button handlers
    setupButtons();
}

// Switch section
function switchSection(sectionName) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');

    // Update section visibility
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section-${sectionName}`)?.classList.add('active');

    // Load section data
    loadSectionData(sectionName);
}

// Load section data
function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'products':
            loadProducts();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'stores':
            loadStores();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'users':
            loadUsers();
            break;
        case 'payments':
            loadPayments();
            break;
        case 'ledger':
            loadLedger();
            break;
    }
}

// Load Dashboard Stats
async function loadDashboardStats() {
    try {
        // Load products count
        const productsRes = await api.getProducts();
        document.getElementById('totalProducts').textContent = productsRes.result?.length || 0;

        // Load orders (mock data - adjust based on your API)
        // const ordersRes = await api.get('/api/v1/orders');
        document.getElementById('totalOrders').textContent = '0';

        // Mock stores and revenue
        document.getElementById('totalStores').textContent = '0';
        document.getElementById('totalRevenue').textContent = formatPrice(0);

        // Load recent orders
        loadRecentOrders();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Load recent orders
async function loadRecentOrders() {
    const container = document.getElementById('recentOrdersTable');
    container.innerHTML = '<p class="text-center">Không có dữ liệu đơn hàng</p>';
}

// Load Products
async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');

    try {
        const response = await api.getProducts();
        const products = response.result || [];

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Không có sản phẩm</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td>${product.sku || 'N/A'}</td>
                <td>${product.name}</td>
                <td>${product.categoryName || 'N/A'}</td>
                <td>${formatPrice(product.basePrice)}</td>
                <td>${product.quantityAvailable || 0}</td>
                <td><span class="status-badge ${product.status.toLowerCase()}">${getStatusText(product.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Lỗi tải dữ liệu</td></tr>';
    }
}

// Load Categories
async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');

    try {
        const response = await api.getCategories();
        const categories = response.result || [];

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không có danh mục</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(category => `
            <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.slug}</td>
                <td><span class="status-badge ${category.status.toLowerCase()}">${getStatusText(category.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editCategory(${category.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteCategory(${category.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Lỗi tải dữ liệu</td></tr>';
    }
}

// Load Stores
async function loadStores() {
    const tbody = document.getElementById('storesTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chức năng đang phát triển</td></tr>';
}

// Load Orders
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chức năng đang phát triển</td></tr>';
}

// Load Users
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chức năng đang phát triển</td></tr>';
}

// Load Payments
async function loadPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chức năng đang phát triển</td></tr>';
}

// Load Ledger
async function loadLedger() {
    const tbody = document.getElementById('ledgerTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chức năng đang phát triển</td></tr>';
}

// Setup Modals
function setupModals() {
    // Product Modal
    const productModal = document.getElementById('productModal');
    const closeProductModal = document.getElementById('closeProductModal');
    const productForm = document.getElementById('productForm');

    closeProductModal?.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    productForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProduct();
    });

    // Category Modal
    const categoryModal = document.getElementById('categoryModal');
    const closeCategoryModal = document.getElementById('closeCategoryModal');
    const categoryForm = document.getElementById('categoryForm');

    closeCategoryModal?.addEventListener('click', () => {
        categoryModal.style.display = 'none';
    });

    categoryForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveCategory();
    });
}

// Setup Buttons
function setupButtons() {
    // Add Product
    const addProductBtn = document.getElementById('addProductBtn');
    addProductBtn?.addEventListener('click', async () => {
        document.getElementById('productModalTitle').textContent = 'Thêm sản phẩm';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';

        // Load categories and stores for dropdowns
        await loadCategoriesForDropdown();
        await loadStoresForDropdown();

        document.getElementById('productModal').style.display = 'block';
    });

    // Add Category
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    addCategoryBtn?.addEventListener('click', () => {
        document.getElementById('categoryModalTitle').textContent = 'Thêm danh mục';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryModal').style.display = 'block';
    });
}

// Load categories for dropdown
async function loadCategoriesForDropdown() {
    try {
        const response = await api.getCategories();
        const categories = response.result || [];
        const select = document.getElementById('productCategoryId');

        select.innerHTML = '<option value="">Chọn danh mục</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load stores for dropdown
async function loadStoresForDropdown() {
    // Mock stores - adjust based on your API
    const select = document.getElementById('productStoreId');
    select.innerHTML = '<option value="">Chọn cửa hàng</option><option value="1">Cửa hàng mẫu</option>';
}

// Save Product
async function saveProduct() {
    const productData = {
        sku: document.getElementById('productSku').value,
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        categoryId: parseInt(document.getElementById('productCategoryId').value),
        storeId: parseInt(document.getElementById('productStoreId').value),
        basePrice: parseFloat(document.getElementById('productBasePrice').value),
        quantityAvailable: parseInt(document.getElementById('productQuantity').value),
        weightGram: parseInt(document.getElementById('productWeight').value) || null,
        status: document.getElementById('productStatus').value
    };

    try {
        const productId = document.getElementById('productId').value;

        if (productId) {
            // Update
            await api.put(API_CONFIG.ENDPOINTS.PRODUCT_BY_ID, productData, { id: productId });
            showNotification('Cập nhật sản phẩm thành công!', 'success');
        } else {
            // Create
            await api.post(API_CONFIG.ENDPOINTS.PRODUCTS, productData);
            showNotification('Thêm sản phẩm thành công!', 'success');
        }

        document.getElementById('productModal').style.display = 'none';
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Lỗi: ' + error.message, 'error');
    }
}

// Edit Product
async function editProduct(id) {
    try {
        const response = await api.getProductById(id);
        const product = response.result;

        document.getElementById('productModalTitle').textContent = 'Sửa sản phẩm';
        document.getElementById('productId').value = product.id;
        document.getElementById('productSku').value = product.sku;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productBasePrice').value = product.basePrice;
        document.getElementById('productQuantity').value = product.quantityAvailable;
        document.getElementById('productWeight').value = product.weightGram || '';
        document.getElementById('productStatus').value = product.status;

        await loadCategoriesForDropdown();
        await loadStoresForDropdown();

        document.getElementById('productCategoryId').value = product.categoryId;
        document.getElementById('productStoreId').value = product.storeId;

        document.getElementById('productModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Không thể tải sản phẩm', 'error');
    }
}

// Delete Product
async function deleteProduct(id) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
        await api.delete(API_CONFIG.ENDPOINTS.PRODUCT_BY_ID, { id });
        showNotification('Xóa sản phẩm thành công!', 'success');
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Không thể xóa sản phẩm', 'error');
    }
}

// Save Category
async function saveCategory() {
    const categoryData = {
        name: document.getElementById('categoryName').value,
        slug: document.getElementById('categorySlug').value,
        description: document.getElementById('categoryDescription').value,
        status: document.getElementById('categoryStatus').value
    };

    try {
        const categoryId = document.getElementById('categoryId').value;

        if (categoryId) {
            // Update
            await api.put(API_CONFIG.ENDPOINTS.CATEGORY_BY_ID, categoryData, { id: categoryId });
            showNotification('Cập nhật danh mục thành công!', 'success');
        } else {
            // Create
            await api.post(API_CONFIG.ENDPOINTS.CATEGORIES, categoryData);
            showNotification('Thêm danh mục thành công!', 'success');
        }

        document.getElementById('categoryModal').style.display = 'none';
        loadCategories();
    } catch (error) {
        console.error('Error saving category:', error);
        showNotification('Lỗi: ' + error.message, 'error');
    }
}

// Edit Category
async function editCategory(id) {
    try {
        const response = await api.get(API_CONFIG.ENDPOINTS.CATEGORY_BY_ID, { id });
        const category = response.result;

        document.getElementById('categoryModalTitle').textContent = 'Sửa danh mục';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categorySlug').value = category.slug;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryStatus').value = category.status;

        document.getElementById('categoryModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading category:', error);
        showNotification('Không thể tải danh mục', 'error');
    }
}

// Delete Category
async function deleteCategory(id) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;

    try {
        await api.delete(API_CONFIG.ENDPOINTS.CATEGORY_BY_ID, { id });
        showNotification('Xóa danh mục thành công!', 'success');
        loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Không thể xóa danh mục', 'error');
    }
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'ACTIVE': 'Hoạt động',
        'INACTIVE': 'Vô hiệu',
        'OUT_OF_STOCK': 'Hết hàng',
        'DISABLED': 'Tắt',
        'PENDING': 'Chờ',
        'CONFIRMED': 'Đã xác nhận',
        'DELIVERED': 'Đã giao'
    };
    return statusMap[status] || status;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00b894' : type === 'error' ? '#d63031' : '#0984e3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}
/* Admin Styles */
.admin-body {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #f5f6fa;
}

/* Sidebar */
.admin-sidebar {
    width: 260px;
    background: var(--dark-color);
    color: white;
    display: flex;
    flex-direction: column;
    transition: all 0.3s;
}

.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar-header .logo {
    color: white;
}

.sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
}

.sidebar-link {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: all 0.3s;
}

.sidebar-link:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}

.sidebar-link.active {
    background: var(--primary-color);
    color: white;
}

.sidebar-link i {
    font-size: 1.2rem;
    width: 24px;
}

.sidebar-footer {
    padding: 1rem;
    border-top: 1px solid rgba(255,255,255,0.1);
}

/* Main Content */
.admin-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Top Bar */
.admin-topbar {
    background: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    z-index: 10;
}

.sidebar-toggle {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-color);
    display: none;
}

.topbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.admin-user {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.admin-user i {
    font-size: 2rem;
    color: var(--primary-color);
}

/* Sections */
.admin-section {
    display: none;
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
}

.admin-section.active {
    display: block;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.section-header h1 {
    font-size: 2rem;
    color: var(--text-color);
    margin: 0;
}

.section-header p {
    color: #666;
    margin: 0.5rem 0 0 0;
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    color: white;
}

.stat-info h3 {
    font-size: 1.8rem;
    margin: 0;
    color: var(--text-color);
}

.stat-info p {
    color: #666;
    margin: 0.25rem 0 0 0;
}

/* Dashboard Charts */
.dashboard-charts {
    display: grid;
    gap: 1.5rem;
}

.chart-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chart-card h3 {
    margin: 0 0 1rem 0;
    color: var(--text-color);
}

/* Table */
.table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
}

.admin-table {
    width: 100%;
    border-collapse: collapse;
}

.admin-table thead {
    background: var(--light-color);
}

.admin-table th {
    padding: 1rem;
    text-align: left;
    font-weight: 600;
    color: var(--text-color);
    border-bottom: 2px solid var(--border-color);
}

.admin-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.admin-table tbody tr:hover {
    background: var(--light-color);
}

/* Status Badges */
.status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-badge.active {
    background: rgba(0, 184, 148, 0.1);
    color: var(--success-color);
}

.status-badge.inactive {
    background: rgba(214, 48, 49, 0.1);
    color: var(--danger-color);
}

.status-badge.pending {
    background: rgba(253, 203, 110, 0.1);
    color: var(--warning-color);
}

.status-badge.out-of-stock {
    background: rgba(214, 48, 49, 0.1);
    color: var(--danger-color);
}

.status-badge.disabled {
    background: rgba(99, 110, 114, 0.1);
    color: #636e72;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    padding: 0.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 0.9rem;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-btn.edit {
    background: rgba(0, 123, 255, 0.1);
    color: #007bff;
}

.action-btn.edit:hover {
    background: #007bff;
    color: white;
}

.action-btn.delete {
    background: rgba(214, 48, 49, 0.1);
    color: var(--danger-color);
}

.action-btn.delete:hover {
    background: var(--danger-color);
    color: white;
}

.action-btn.view {
    background: rgba(0, 184, 148, 0.1);
    color: var(--success-color);
}

.action-btn.view:hover {
    background: var(--success-color);
    color: white;
}

/* Responsive */
@media (max-width: 768px) {
    .admin-sidebar {
        position: fixed;
        left: -260px;
        height: 100vh;
        z-index: 1000;
    }

    .admin-sidebar.active {
        left: 0;
    }

    .sidebar-toggle {
        display: block;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .admin-table {
        font-size: 0.85rem;
    }

    .admin-table th,
    .admin-table td {
        padding: 0.75rem 0.5rem;
    }
}

/* Loading State */
.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(0,0,0,0.1);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Empty State */
.empty-state-admin {
    text-align: center;
    padding: 3rem;
    color: #999;
}

.empty-state-admin i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #ddd;
}

/* Form in Modal */
.modal-large .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

@media (max-width: 768px) {
    .modal-large .form-row {
        grid-template-columns: 1fr;
    }
}

