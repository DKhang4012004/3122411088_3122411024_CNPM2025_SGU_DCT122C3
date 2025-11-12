// Admin Panel JavaScript
const API_BASE_URL = 'http://localhost:8080/home';

// Current user info
let currentUser = null;

// Role-based access control
const PERMISSIONS = {
    dashboard: ['ADMIN', 'STORE_OWNER'],
    users: ['ADMIN'],
    products: ['ADMIN', 'STORE_OWNER'],
    categories: ['ADMIN'],
    stores: ['ADMIN'],
    drones: ['ADMIN'],
    orders: ['ADMIN', 'STORE_OWNER'],
    ledger: ['ADMIN', 'STORE_OWNER']
};

document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const token = localStorage.getItem('foodfast_token');
    const user = JSON.parse(localStorage.getItem('foodfast_user') || '{}');
    
    if (!token || !user.roles) {
        alert('Vui lòng đăng nhập để tiếp tục');
        window.location.href = 'login-admin.html';
        return;
    }

    // Check if user has admin or store owner role
    const hasAccess = user.roles.some(role => ['ADMIN', 'STORE_OWNER'].includes(role));
    if (!hasAccess) {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;

    // Set user name
    document.getElementById('adminUserName').textContent = user.fullName || user.username || 'Admin';

    // Init sidebar with permissions
    initSidebar();

    // Load dashboard
    loadDashboard();

    // Logout button
    document.getElementById('adminLogout').addEventListener('click', logout);
});

// Check if user has permission to access a section
function hasPermission(section) {
    if (!currentUser || !currentUser.roles) return false;
    
    const allowedRoles = PERMISSIONS[section];
    if (!allowedRoles) return false;
    
    return currentUser.roles.some(role => allowedRoles.includes(role));
}

// Check if user is admin
function isAdmin() {
    return currentUser && currentUser.roles && currentUser.roles.includes('ADMIN');
}

// Check if user is store owner
function isStoreOwner() {
    return currentUser && currentUser.roles && currentUser.roles.includes('STORE_OWNER');
}

// Check if user can perform admin-only actions (edit/delete users, categories, stores, drones)
function canPerformAdminAction(action) {
    if (action === 'manageUsers' || action === 'manageCategories' || 
        action === 'manageStores' || action === 'manageDrones') {
        return isAdmin();
    }
    return true; // Other actions allowed
}

function initSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');

    sidebarLinks.forEach(link => {
        const section = link.dataset.section;
        
        // Skip links without data-section (external links)
        if (!section) {
            return;
        }
        
        // Check permission and hide/disable if no access
        if (!hasPermission(section)) {
            link.style.opacity = '0.4';
            link.style.pointerEvents = 'none';
            link.style.cursor = 'not-allowed';
            link.title = 'Bạn không có quyền truy cập';
            return;
        }

        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Double check permission before showing
            if (!hasPermission(section)) {
                alert('Bạn không có quyền truy cập chức năng này');
                return;
            }

            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show section
            showSection(section);

            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
}

function showSection(sectionName) {
    // Check permission
    if (!hasPermission(sectionName)) {
        alert('Bạn không có quyền truy cập chức năng này');
        return;
    }

    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Load data for section
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
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
        case 'drones':
            loadDrones();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'ledger':
            loadLedger();
            break;
    }
}

async function apiRequest(url, options = {}) {
    const token = localStorage.getItem('foodfast_token');
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            alert('Phiên đăng nhập hết hạn');
            logout();
            throw new Error('Unauthorized');
        }
        // Get error details
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    return response.json();
}

async function loadDashboard() {
    try {
        // Load users
        const usersRes = await apiRequest('/users/getAllUser');
        const users = usersRes.result || [];
        document.getElementById('totalUsers').textContent = users.length;

        // Load products (admin sees all status)
        const productsRes = await apiRequest('/products/all-status');
        const products = productsRes.result || [];
        document.getElementById('totalProducts').textContent = products.length;

        // Load stores
        const storesRes = await apiRequest('/api/stores');
        const stores = storesRes.result || [];
        document.getElementById('totalStores').textContent = stores.length;

        // Load categories
        const categoriesRes = await apiRequest('/categories');
        const categories = categoriesRes.result || [];
        document.getElementById('totalCategories').textContent = categories.length;

    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Đang tải...</td></tr>';

    try {
        const response = await apiRequest('/users/getAllUser');
        const users = response.result || [];
        
        // Get current admin user
        const currentUser = JSON.parse(localStorage.getItem('foodfast_user') || '{}');
        const currentUserId = currentUser.id;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-users"></i><br>Không có người dùng</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const isCurrentUser = user.id === currentUserId;
            const rolesDisplay = user.roles ? user.roles.map(role => 
                `<span class="status-badge active">${role}</span>`
            ).join(' ') : 'N/A';
            
            // Status badge styling
            const statusClass = user.status === 'ACTIVE' ? 'active' : 
                               user.status === 'LOCKED' ? 'inactive' : 'pending';
            const statusText = user.status === 'ACTIVE' ? 'Hoạt động' :
                              user.status === 'LOCKED' ? 'Khóa' : 'Chờ duyệt';
            
            return `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.fullName || 'N/A'}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${rolesDisplay}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewUser(${user.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${!isCurrentUser && isAdmin() ? `
                        <button class="action-btn edit" onclick="editUserRole(${user.id}, '${user.username}', ${JSON.stringify(user.roles || []).replace(/"/g, '&quot;')})" title="Sửa vai trò" style="background: #3b82f6;">
                            <i class="fas fa-user-tag"></i>
                        </button>
                        <button class="action-btn edit" onclick="editUserStatus(${user.id}, '${user.username}', '${user.status || 'ACTIVE'}')" title="Sửa trạng thái" style="background: #10b981;">
                            <i class="fas fa-toggle-on"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteUser(${user.id}, '${user.username}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                        ` : isCurrentUser ? `
                        <span class="text-muted" style="font-size: 0.85rem; font-style: italic;">Bạn đang đăng nhập</span>
                        ` : `
                        <span class="text-muted" style="font-size: 0.85rem; font-style: italic;">Chỉ Admin có quyền</span>
                        `}
                    </div>
                </td>
            </tr>
        `}).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Đang tải...</td></tr>';

    try {
        let products = [];
        
        if (isStoreOwner() && !isAdmin()) {
            // Store owner only sees their store's products
            try {
                const storeResponse = await apiRequest(`/api/stores/owner/${currentUser.id}`);
                const stores = storeResponse.result || [];
                
                if (stores.length > 0) {
                    const storeId = stores[0].id;
                    const response = await apiRequest(`/products/store/${storeId}`);
                    products = response.result || [];
                } else {
                    tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-store-slash"></i><br>Bạn chưa có cửa hàng nào</td></tr>';
                    return;
                }
            } catch (error) {
                console.error('Error loading store products:', error);
                tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color:red">Lỗi tải sản phẩm cửa hàng</td></tr>';
                return;
            }
        } else {
            // Admin sees all products (including DISABLED)
            const response = await apiRequest('/products/all-status');
            products = response.result || [];
        }

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-box"></i><br>Không có sản phẩm</td></tr>';
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
                        <button class="action-btn view" onclick="viewProduct(${product.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

async function loadCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Đang tải...</td></tr>';

    try {
        const response = await apiRequest('/categories');
        const categories = response.result || [];

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-tags"></i><br>Không có danh mục</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(category => `
            <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description || 'N/A'}</td>
                <td><span class="status-badge ${category.status.toLowerCase()}">${getStatusText(category.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewCategory(${category.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editCategory(${category.id})" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

async function loadStores() {
    const tbody = document.getElementById('storesTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Đang tải...</td></tr>';

    try {
        // ✅ ADMIN: GỌI ENDPOINT MỚI ĐỂ LẤY TẤT CẢ CỬA HÀNG (BAO GỒM INACTIVE, PENDING)
        const response = await apiRequest('/api/stores/admin/all');
        const stores = response.result || [];

        if (stores.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-store"></i><br>Không có cửa hàng</td></tr>';
            return;
        }

        tbody.innerHTML = stores.map(store => `
            <tr>
                <td>${store.id}</td>
                <td>${store.name}</td>
                <td>${store.ownerUserId ? 'User ID: ' + store.ownerUserId : 'N/A'}</td>
                <td><span class="status-badge ${store.storeStatus?.toLowerCase() || 'active'}">${getStatusText(store.storeStatus)}</span></td>
                <td>${store.createdAt ? new Date(store.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewStore(${store.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editStoreStatus(${store.id}, '${store.name.replace(/'/g, "\\'")}', '${store.storeStatus}')" title="Cập nhật trạng thái">
                            <i class="fas fa-toggle-on"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading stores:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

async function loadDrones() {
    const tbody = document.getElementById('dronesTableBody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Đang tải...</td></tr>';

    try {
        const response = await apiRequest('/drones');
        const drones = response.result || [];

        if (drones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-drone"></i><br>Không có drone nào. Nhấn "Thêm Drone" để bắt đầu.</td></tr>';
            return;
        }

        tbody.innerHTML = drones.map(drone => `
            <tr>
                <td>${drone.id}</td>
                <td><strong>${drone.code}</strong></td>
                <td><code style="background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 4px;">${drone.model || 'N/A'}</code></td>
                <td>
                    <span style="color: ${drone.currentBatteryPercent > 50 ? '#10b981' : drone.currentBatteryPercent > 20 ? '#f59e0b' : '#ef4444'};">
                        <i class="fas fa-battery-${drone.currentBatteryPercent > 75 ? 'full' : drone.currentBatteryPercent > 50 ? 'three-quarters' : drone.currentBatteryPercent > 25 ? 'half' : 'quarter'}"></i>
                        ${drone.currentBatteryPercent || 0}%
                    </span>
                </td>
                <td>${drone.maxPayloadGram ? (drone.maxPayloadGram / 1000).toFixed(1) + ' kg' : 'N/A'}</td>
                <td><span class="status-badge ${drone.status.toLowerCase()}">${formatDroneStatus(drone.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn view" onclick="viewDrone(${drone.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editDroneById(${drone.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading drones:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red">Lỗi tải dữ liệu: ' + error.message + '</td></tr>';
    }
}

async function editDroneById(droneId) {
    try {
        const response = await apiRequest(`/drones/id/${droneId}`);
        const drone = response.result;
        
        // Open edit modal with data
        document.getElementById('droneModalTitle').textContent = 'Chỉnh Sửa Drone';
        document.getElementById('droneId').value = drone.id;
        document.getElementById('droneCode').value = drone.code || '';
        document.getElementById('droneModel').value = drone.model || '';
        document.getElementById('droneMaxPayload').value = drone.maxPayloadGram ? (drone.maxPayloadGram / 1000).toFixed(1) : '';
        document.getElementById('droneBatteryLevel').value = drone.currentBatteryPercent || 100;
        document.getElementById('droneStatus').value = drone.status || 'AVAILABLE';
        document.getElementById('droneLatitude').value = drone.lastLatitude || '';
        document.getElementById('droneLongitude').value = drone.lastLongitude || '';
        
        document.getElementById('droneModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading drone for edit:', error);
        alert('Lỗi khi tải thông tin drone');
    }
}

async function loadOrders() {
    // Load stores for filter dropdown
    await loadStoreFilter();
    
    // Load all orders initially (will be filtered by role)
    await loadOrdersByStore();
}

async function loadStoreFilter() {
    try {
        let stores = [];
        
        if (isStoreOwner() && !isAdmin()) {
            // Store owner only sees their store
            const response = await fetch(`${API_BASE_URL}/api/stores/owner/${currentUser.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                stores = data.result || [];
            }
        } else {
            // Admin sees all stores
            const response = await fetch(`${API_BASE_URL}/api/stores`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                stores = data.result || [];
            }
        }
        
        const select = document.getElementById('storeFilter');
        if (select) {
            if (isAdmin()) {
                // Admin can see all stores option
                select.innerHTML = '<option value="">Tất cả cửa hàng</option>';
            } else {
                // Store owner doesn't have "all stores" option
                select.innerHTML = '';
            }
            
            // Add store options
            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = store.name;
                select.appendChild(option);
            });
            
            // Auto-select first store for store owner
            if (isStoreOwner() && !isAdmin() && stores.length > 0) {
                select.value = stores[0].id;
            }
        }
    } catch (error) {
        console.error('Error loading stores for filter:', error);
    }
}

async function loadOrdersByStore() {
    const tbody = document.getElementById('ordersTableBody');
    const storeSelect = document.getElementById('storeFilter');
    const storeId = storeSelect?.value || '';
    
    tbody.innerHTML = '<tr><td colspan="7" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Đang tải...</td></tr>';

    try {
        let orders = [];
        
        if (storeId) {
            // Load orders for specific store
            const response = await fetch(`${API_BASE_URL}/api/v1/orders/store/${storeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            orders = data.result || [];
        } else {
            // Load orders from all stores
            const storesResponse = await fetch(`${API_BASE_URL}/api/stores`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (storesResponse.ok) {
                const storesData = await storesResponse.json();
                const stores = storesData.result || [];
                
                // Load orders for each store
                const orderPromises = stores.map(store => 
                    fetch(`${API_BASE_URL}/api/v1/orders/store/${store.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(res => res.ok ? res.json() : { result: [] })
                    .then(data => data.result || [])
                    .catch(() => [])
                );
                
                const ordersArrays = await Promise.all(orderPromises);
                orders = ordersArrays.flat();
            }
        }

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-shopping-bag"></i><br>Không có đơn hàng</td></tr>';
            return;
        }

        // Group orders by store
        const ordersByStore = {};
        orders.forEach(order => {
            const storeName = order.storeName || 'Chưa có cửa hàng';
            if (!ordersByStore[storeName]) {
                ordersByStore[storeName] = [];
            }
            ordersByStore[storeName].push(order);
        });

        // Render orders grouped by store
        let html = '';
        Object.keys(ordersByStore).sort().forEach(storeName => {
            const storeOrders = ordersByStore[storeName];
            
            // Store header row
            html += `
                <tr style="background: #f8fafc;">
                    <td colspan="7" style="font-weight: 600; padding: 1rem; color: #1e293b;">
                        <i class="fas fa-store"></i> ${storeName} 
                        <span style="color: #64748b; font-weight: 400;">(${storeOrders.length} đơn hàng)</span>
                    </td>
                </tr>
            `;
            
            // Store orders
            storeOrders.forEach(order => {
                const statusClass = getOrderStatusClass(order.status);
                const statusText = getOrderStatusText(order.status);
                
                html += `
                    <tr>
                        <td>${order.orderCode || order.id}</td>
                        <td>User ID: ${order.userId || 'N/A'}</td>
                        <td>${order.storeName || 'N/A'}</td>
                        <td>${formatPrice(order.totalPayable || 0)}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn view" onclick="viewOrder('${order.orderCode}')" title="Xem chi tiết">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${order.status === 'CANCELLED' ? `
                                    <button class="action-btn refund" onclick="refundOrder(${order.id}, '${order.orderCode}')" 
                                            title="Hoàn tiền">
                                        <i class="fas fa-undo"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            });
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

function getOrderStatusClass(status) {
    const statusMap = {
        'CREATED': 'pending',
        'PENDING_PAYMENT': 'pending',
        'PENDING': 'pending',
        'ACCEPT': 'active',
        'CONFIRMED': 'active',
        'PREPARING': 'in_use',
        'READY': 'available',
        'SHIPPING': 'in_use',
        'DELIVERED': 'active',
        'CANCELLED': 'inactive',
        'REFUNDED': 'active',
        'COMPLETED': 'active'
    };
    return statusMap[status] || 'pending';
}

function getOrderStatusText(status) {
    const statusMap = {
        'CREATED': 'Đã tạo',
        'PENDING_PAYMENT': 'Chờ thanh toán',
        'PENDING': 'Chờ xác nhận',
        'ACCEPT': 'Đã chấp nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng',
        'SHIPPING': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy',
        'REFUNDED': 'Đã hoàn tiền',
        'COMPLETED': 'Hoàn thành'
    };
    return statusMap[status] || status;
}

function viewOrder(orderCode) {
    alert(`Xem chi tiết đơn hàng ${orderCode} (Chức năng đang phát triển)`);
}

// ✅ Hoàn tiền cho đơn hàng đã hủy
async function refundOrder(orderId, orderCode) {
    if (!confirm(`Xác nhận hoàn tiền cho đơn hàng ${orderCode}?\n\nĐơn hàng sẽ chuyển sang trạng thái "Đã hoàn tiền".`)) {
        return;
    }

    try {
        const token = localStorage.getItem('foodfast_token');
        if (!token) {
            alert('⚠️ Vui lòng đăng nhập lại');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'REFUNDED'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        alert('✅ Đã hoàn tiền thành công cho đơn hàng ' + orderCode);
        loadOrders(); // Reload orders list
    } catch (error) {
        console.error('Error refunding order:', error);
        alert(`❌ Lỗi hoàn tiền: ${error.message}`);
    }
}

async function loadLedger() {
    // Load stores for filter dropdown
    await loadLedgerStoreFilter();
}

async function loadLedgerStoreFilter() {
    try {
        let stores = [];
        
        if (isStoreOwner() && !isAdmin()) {
            // Store owner only sees their store
            const response = await fetch(`${API_BASE_URL}/api/stores/owner/${currentUser.id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                stores = data.result || [];
            }
        } else {
            // Admin sees all stores
            const response = await fetch(`${API_BASE_URL}/api/stores`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                stores = data.result || [];
            }
        }
        
        const select = document.getElementById('ledgerStoreFilter');
        if (select) {
            select.innerHTML = '<option value="">-- Chọn cửa hàng --</option>';
            
            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = store.name;
                select.appendChild(option);
            });
            
            // Auto-select first store for store owner
            if (isStoreOwner() && !isAdmin() && stores.length > 0) {
                select.value = stores[0].id;
                // Auto load ledger for store owner's store
                setTimeout(() => loadLedgerByStore(), 500);
            }
        }
    } catch (error) {
        console.error('Error loading stores for ledger filter:', error);
    }
}

let currentLedgerStoreId = null;
let currentBatchId = null;
let unpaidEntriesCount = 0;

async function loadLedgerByStore() {
    const tbody = document.getElementById('ledgerTableBody');
    const select = document.getElementById('ledgerStoreFilter');
    const storeId = select?.value;
    
    if (!storeId) {
        alert('Vui lòng chọn cửa hàng');
        return;
    }
    
    currentLedgerStoreId = storeId;
    
    tbody.innerHTML = '<tr><td colspan="7" class="loading"><i class="fas fa-spinner fa-spin"></i><br>Đang tải...</td></tr>';
    
    // Hide summary initially
    const summaryDiv = document.getElementById('ledgerSummary');
    const payoutMgmt = document.getElementById('payoutManagement');
    if (summaryDiv) {
        summaryDiv.style.display = 'none';
    }
    if (payoutMgmt) {
        payoutMgmt.style.display = 'none';
    }

    try {
        // Load both entries and payout batches
        await Promise.all([
            loadLedgerEntries(storeId),
            loadUnpaidAmount(storeId),
            loadPayoutBatches(storeId)
        ]);
        
        if (summaryDiv) {
            summaryDiv.style.display = 'grid';
        }
        if (payoutMgmt) {
            payoutMgmt.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading ledger:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

async function loadLedgerEntries(storeId) {
    const tbody = document.getElementById('ledgerTableBody');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ledger/store/${storeId}/entries`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const entries = data.result || [];

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-book"></i><br>Chưa có giao dịch nào</td></tr>';
            return;
        }

        // Count unpaid entries
        unpaidEntriesCount = entries.filter(e => e.status === 'UNPAID').length;

        // Calculate summary
        let totalRevenue = 0;
        let totalServiceFee = 0;
        let netRevenue = 0;

        entries.forEach(entry => {
            totalRevenue += parseFloat(entry.totalOrderAmount || 0);
            totalServiceFee += parseFloat(entry.appCommissionAmount || 0) + parseFloat(entry.paymentGatewayFee || 0);
            netRevenue += parseFloat(entry.netAmountOwed || 0);
        });

        // Update summary cards
        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
        document.getElementById('totalServiceFee').textContent = formatPrice(totalServiceFee);
        document.getElementById('netRevenue').textContent = formatPrice(netRevenue);

        // Render table
        let html = '';
        entries.forEach(entry => {
            const status = entry.status || 'N/A';
            const statusText = getLedgerStatusText(status);
            const statusClass = getLedgerStatusClass(status);
            
            html += `
                <tr>
                    <td>${entry.id}</td>
                    <td>#${entry.orderId || 'N/A'}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${formatPrice(entry.totalOrderAmount || 0)}</td>
                    <td>${formatPrice((entry.appCommissionAmount || 0) + (entry.paymentGatewayFee || 0))}</td>
                    <td><strong>${formatPrice(entry.netAmountOwed || 0)}</strong></td>
                    <td>${entry.createdAt ? new Date(entry.createdAt).toLocaleString('vi-VN') : 'N/A'}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading ledger entries:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color:red">Lỗi tải dữ liệu</td></tr>';
    }
}

async function loadUnpaidAmount(storeId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ledger/store/${storeId}/unpaid-amount`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const unpaidAmount = data.result || 0;
        
        document.getElementById('unpaidAmount').textContent = formatPrice(unpaidAmount);
    } catch (error) {
        console.error('Error loading unpaid amount:', error);
        document.getElementById('unpaidAmount').textContent = '0₫';
    }
}

async function loadPayoutBatches(storeId) {
    const container = document.getElementById('payoutBatchesList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ledger/store/${storeId}/payouts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const batches = data.result || [];

        if (batches.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #94a3b8;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>Chưa có lô thanh toán nào</p>
                </div>
            `;
            return;
        }

        // Render payout batches
        container.innerHTML = batches.map(batch => {
            const statusClass = getPayoutStatusClass(batch.status);
            const statusText = getPayoutStatusText(batch.status);
            
            return `
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas fa-file-invoice-dollar" style="color: #f59e0b; font-size: 1.25rem;"></i>
                            <span style="font-weight: 600; color: #1e293b;">Batch #${batch.id}</span>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Số tiền</div>
                            <div style="font-size: 1.25rem; font-weight: 700; color: #f59e0b;">${formatPrice(batch.totalPayoutAmount)}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Ngày tạo</div>
                            <div style="font-weight: 500;">${new Date(batch.createdAt).toLocaleDateString('vi-VN')}</div>
                        </div>
                        ${batch.processedAt ? `
                        <div>
                            <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Ngày thanh toán</div>
                            <div style="font-weight: 500;">${new Date(batch.processedAt).toLocaleDateString('vi-VN')}</div>
                        </div>
                        ` : ''}
                        ${batch.transactionCode ? `
                        <div>
                            <div style="font-size: 0.875rem; color: #64748b; margin-bottom: 0.25rem;">Mã giao dịch</div>
                            <div style="font-weight: 500; color: #10b981;">${batch.transactionCode}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${(batch.status === 'PROCESSING' || batch.status === 'PENDING') ? `
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                            <button onclick="showMarkPaidModal(${batch.id}, ${batch.totalPayoutAmount})" class="btn-action btn-success">
                                <i class="fas fa-check"></i> Đánh dấu đã thanh toán
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading payout batches:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #dc2626;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Lỗi tải danh sách lô thanh toán</p>
            </div>
        `;
    }
}

function getPayoutStatusClass(status) {
    const statusMap = {
        'PENDING': 'pending',
        'PROCESSING': 'in_use',
        'PAID': 'active',
        'FAILED': 'inactive'
    };
    return statusMap[status] || 'pending';
}

function getPayoutStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xử lý',
        'PROCESSING': 'Đang xử lý',
        'PAID': 'Đã thanh toán',
        'FAILED': 'Thất bại'
    };
    return statusMap[status] || status;
}

// Modal functions
function showCreatePayoutModal() {
    if (!currentLedgerStoreId) {
        alert('Vui lòng chọn cửa hàng trước');
        return;
    }
    
    // Get store name
    const select = document.getElementById('ledgerStoreFilter');
    const storeName = select.options[select.selectedIndex]?.text || 'Cửa hàng';
    
    // Get unpaid amount
    const unpaidAmountText = document.getElementById('unpaidAmount').textContent;
    
    // Check if there's any unpaid amount
    if ((unpaidAmountText === '0₫' || unpaidAmountText === '0') && unpaidEntriesCount === 0) {
        alert(`Không có đơn hàng chưa thanh toán nào cho ${storeName}`);
        return;
    }
    
    // Show modal
    document.getElementById('createPayoutStoreName').textContent = storeName;
    document.getElementById('createPayoutCount').textContent = unpaidEntriesCount;
    document.getElementById('createPayoutAmount').textContent = unpaidAmountText;
    document.getElementById('createPayoutModal').style.display = 'flex';
}

function closeCreatePayoutModal() {
    document.getElementById('createPayoutModal').style.display = 'none';
}

async function confirmCreatePayout() {
    closeCreatePayoutModal();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = '<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;"><div style="background: white; padding: 2rem; border-radius: 12px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #f59e0b;"></i></div></div>';
    document.body.appendChild(loadingDiv);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ledger/store/${currentLedgerStoreId}/payout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const payoutBatch = data.result;
        
        alert(`Tạo lô thanh toán thành công!\nBatch #${payoutBatch.id}\nSố tiền: ${formatPrice(payoutBatch.totalPayoutAmount)}\nTrạng thái: Đang xử lý`);
        
        // Reload data
        await loadLedgerByStore();
    } catch (error) {
        console.error('Error creating payout:', error);
        alert('Không thể tạo lô thanh toán: ' + error.message);
    } finally {
        document.body.removeChild(loadingDiv);
    }
}

function showMarkPaidModal(batchId, amount) {
    if (!batchId) {
        alert('Không tìm thấy ID lô thanh toán');
        return;
    }
    
    currentBatchId = batchId;
    document.getElementById('modalAmount').textContent = formatPrice(amount);
    document.getElementById('modalBatchId').textContent = batchId;
    document.getElementById('transactionCode').value = '';
    document.getElementById('markPaidModal').style.display = 'flex';
}

function closeMarkPaidModal() {
    document.getElementById('markPaidModal').style.display = 'none';
    currentBatchId = null;
}

async function confirmMarkPaid() {
    const transactionCode = document.getElementById('transactionCode').value.trim();
    
    if (!transactionCode) {
        alert('Vui lòng nhập mã giao dịch');
        return;
    }
    
    if (!currentBatchId) {
        alert('Không tìm thấy thông tin lô thanh toán');
        closeMarkPaidModal();
        return;
    }
    
    const batchId = currentBatchId;
    closeMarkPaidModal();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = '<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;"><div style="background: white; padding: 2rem; border-radius: 12px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #10b981;"></i></div></div>';
    document.body.appendChild(loadingDiv);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ledger/payout/${batchId}/mark-paid?transactionCode=${encodeURIComponent(transactionCode)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        alert('Đã xác nhận thanh toán thành công!');
        
        // Reload data
        await loadLedgerByStore();
    } catch (error) {
        console.error('Error marking as paid:', error);
        alert('Không thể xác nhận thanh toán: ' + error.message);
    } finally {
        document.body.removeChild(loadingDiv);
    }
}

function getLedgerStatusClass(status) {
    const statusMap = {
        'UNPAID': 'pending',
        'PAID': 'active',
        'PROCESSING': 'in_use'
    };
    return statusMap[status] || 'inactive';
}

function getLedgerStatusText(status) {
    const statusMap = {
        'UNPAID': 'Chưa thanh toán',
        'PAID': 'Đã thanh toán',
        'PROCESSING': 'Đang xử lý'
    };
    return statusMap[status] || status;
}

async function deleteUser(userId, username) {
    if (!isAdmin()) {
        alert('Chỉ Admin mới có quyền xóa người dùng');
        return;
    }

    if (!confirm(`Bạn có chắc muốn xóa người dùng "${username}"?`)) {
        return;
    }

    try {
        await apiRequest(`/users/deleteUser/${userId}`, {
            method: 'DELETE'
        });
        alert('Xóa người dùng thành công!');
        loadUsers();
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Lỗi xóa người dùng');
    }
}

function viewUser(userId) {
    alert(`Xem chi tiết user #${userId} (Chức năng đang phát triển)`);
}

async function viewProduct(productId) {
    try {
        // Fetch product details
        const response = await apiRequest(`/products/${productId}`);
        const product = response.result;

        // Create product detail HTML
        const productHTML = `
            <div style="text-align: left;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <p style="margin: 0.5rem 0;"><strong>Tên sản phẩm:</strong></p>
                        <p style="margin: 0.25rem 0; color: #64748b;">${product.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0.5rem 0;"><strong>SKU:</strong></p>
                        <p style="margin: 0.25rem 0; color: #64748b;">${product.sku || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0.5rem 0;"><strong>Danh mục:</strong></p>
                        <p style="margin: 0.25rem 0; color: #64748b;">${product.categoryName || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0.5rem 0;"><strong>Cửa hàng:</strong></p>
                        <p style="margin: 0.25rem 0; color: #64748b;">${product.storeName || 'N/A'}</p>
                    </div>
                    <div>
                        <p style="margin: 0.5rem 0;"><strong>Giá:</strong></p>
                        <p style="margin: 0.25rem 0; color: #64748b;">${formatPrice(product.basePrice)}</p>
                    </div>
                    <div>
                        <p style="margin: 0.5rem 0;"><strong>Số lượng:</strong></p>
                        <p style="margin: 0.25rem 0; color: #64748b;">${product.quantityAvailable || 0}</p>
                    </div>
                    <div>
                        <p style="margin: 0.5rem 0;"><strong>Trạng thái hiện tại:</strong></p>
                        <p style="margin: 0.25rem 0;"><span class="status-badge ${product.status.toLowerCase()}">${getStatusText(product.status)}</span></p>
                    </div>
                </div>
                ${product.mediaPrimaryUrl ? `
                <div style="margin: 1rem 0;">
                    <p style="margin: 0.5rem 0;"><strong>Hình ảnh:</strong></p>
                    <img src="${product.mediaPrimaryUrl}" alt="${product.name}" 
                         style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid #ddd;"
                         onerror="this.style.display='none'">
                </div>
                ` : ''}
                <div style="margin: 1rem 0;">
                    <p style="margin: 0.5rem 0;"><strong>Mô tả:</strong></p>
                    <p style="margin: 0.25rem 0; color: #64748b; max-height: 100px; overflow-y: auto;">${product.description || 'Không có mô tả'}</p>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                    <button id="updateStatusBtn" 
                            style="padding: 0.625rem 1.5rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 500;">
                        <i class="fas fa-edit"></i> Cập nhật trạng thái
                    </button>
                </div>
            </div>
        `;

        // Create custom dialog with event handling
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white; padding: 2rem; border-radius: 12px;
            max-width: 600px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            max-height: 80vh; overflow-y: auto;
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 1.5rem 0; color: #1e293b;">Chi tiết sản phẩm</h3>
            ${productHTML}
            <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
                <button id="closeDialogBtn" style="padding: 0.625rem 1.25rem; border: none; background: #f59e0b; color: white; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 500;">OK</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Add event listener for update status button
        const updateBtn = document.getElementById('updateStatusBtn');
        if (updateBtn) {
            updateBtn.onclick = async () => {
                // Close current dialog
                document.body.removeChild(overlay);
                // Show status update dialog
                await editProductStatus(product.id, product.name, product.status);
            };
        }

        // Add event listener for close button
        const closeBtn = document.getElementById('closeDialogBtn');
        if (closeBtn) {
            closeBtn.onclick = () => {
                document.body.removeChild(overlay);
            };
        }

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };
    } catch (error) {
        console.error('Error viewing product:', error);
        alert('❌ Không thể tải thông tin sản phẩm');
    }
}

// Edit product status
async function editProductStatus(productId, productName, currentStatus) {
    const availableStatuses = [
        { value: 'ACTIVE', label: 'Hoạt động', color: '#10b981' },
        { value: 'DISABLED', label: 'Vô hiệu hóa', color: '#6b7280' }
    ];
    
    // Create dropdown options
    const statusOptions = availableStatuses.map(status => {
        const selected = currentStatus === status.value ? 'selected' : '';
        return `<option value="${status.value}" ${selected}>${status.label}</option>`;
    }).join('');
    
    // Show dialog
    const result = await showCustomDialogWithValue(
        'Cập nhật trạng thái sản phẩm',
        `<div style="text-align: left;">
            <p style="margin-bottom: 1rem;"><strong>Sản phẩm:</strong> ${productName}</p>
            <p style="margin-bottom: 0.5rem;"><strong>Chọn trạng thái:</strong></p>
            <select id="statusSelect" style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; background: white;">
                ${statusOptions}
            </select>
            <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #64748b;">
                <strong>Lưu ý:</strong><br>
                • <strong>Hoạt động:</strong> Sản phẩm hiển thị và có thể đặt hàng<br>
                • <strong>Vô hiệu hóa:</strong> Sản phẩm bị ẩn khỏi danh sách<br>
                <br>
                <span style="color: #f59e0b;">⚠️ Trạng thái "Hết hàng" được hệ thống tự động cập nhật dựa trên số lượng tồn kho</span>
            </p>
        </div>`,
        () => document.getElementById('statusSelect')?.value
    );
    
    if (result.confirmed && result.value) {
        const selectedStatus = result.value;
        
        try {
            // Call API to update status
            await apiRequest(`/products/${productId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: selectedStatus })
            });
            
            alert(`✅ Cập nhật trạng thái sản phẩm "${productName}" thành công!`);
            loadProducts();
        } catch (error) {
            console.error('Error updating product status:', error);
            alert(`❌ Lỗi cập nhật trạng thái: ${error.message || 'Không xác định'}`);
        }
    }
}

async function viewCategory(categoryId) {
    try {
        const response = await apiRequest(`/categories/${categoryId}`);
        const category = response.result;

        const categoryHTML = `
            <div style="text-align: left;">
                <div style="margin-bottom: 1rem;">
                    <p style="margin: 0.5rem 0;"><strong>Tên danh mục:</strong></p>
                    <p style="margin: 0.25rem 0; color: #64748b;">${category.name}</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <p style="margin: 0.5rem 0;"><strong>Mô tả:</strong></p>
                    <p style="margin: 0.25rem 0; color: #64748b;">${category.description || 'Không có mô tả'}</p>
                </div>
                <div style="margin-bottom: 1rem;">
                    <p style="margin: 0.5rem 0;"><strong>Trạng thái:</strong></p>
                    <p style="margin: 0.25rem 0;"><span class="status-badge ${category.status.toLowerCase()}">${getStatusText(category.status)}</span></p>
                </div>
            </div>
        `;

        await showCustomDialog('Chi tiết danh mục', categoryHTML, false);
    } catch (error) {
        console.error('Error viewing category:', error);
        alert('❌ Không thể tải thông tin danh mục');
    }
}

// Show add category modal
function showAddCategoryModal() {
    const modalHTML = `
        <div style="text-align: left;">
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Tên danh mục: <span style="color: red;">*</span></label>
                <input type="text" id="categoryName" placeholder="Nhập tên danh mục" 
                       style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Mô tả:</label>
                <textarea id="categoryDescription" placeholder="Nhập mô tả (tùy chọn)" rows="3"
                          style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; resize: vertical;"></textarea>
            </div>
            <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Trạng thái:</label>
                <select id="categoryStatus" style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                </select>
            </div>
        </div>
    `;

    showCustomDialogWithValue(
        'Thêm danh mục mới',
        modalHTML,
        () => {
            const name = document.getElementById('categoryName')?.value?.trim();
            const description = document.getElementById('categoryDescription')?.value?.trim();
            const status = document.getElementById('categoryStatus')?.value;
            return { name, description, status };
        }
    ).then(result => {
        if (result.confirmed && result.value) {
            createCategory(result.value);
        }
    });
}

// Create category
async function createCategory(categoryData) {
    if (!categoryData.name) {
        alert('❌ Vui lòng nhập tên danh mục!');
        return;
    }

    try {
        await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify({
                name: categoryData.name,
                description: categoryData.description || null,
                status: categoryData.status
            })
        });

        alert('✅ Thêm danh mục thành công!');
        loadCategories();
    } catch (error) {
        console.error('Error creating category:', error);
        alert(`❌ Lỗi thêm danh mục: ${error.message || 'Không xác định'}`);
    }
}

// Edit category
async function editCategory(categoryId) {
    if (!isAdmin()) {
        alert('Chỉ Admin mới có quyền chỉnh sửa danh mục');
        return;
    }

    try {
        // Fetch current category data
        const response = await apiRequest(`/categories/${categoryId}`);
        const category = response.result;

        const modalHTML = `
            <div style="text-align: left;">
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Tên danh mục: <span style="color: red;">*</span></label>
                    <input type="text" id="categoryName" value="${category.name}" placeholder="Nhập tên danh mục" 
                           style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Mô tả:</label>
                    <textarea id="categoryDescription" placeholder="Nhập mô tả (tùy chọn)" rows="3"
                              style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; resize: vertical;">${category.description || ''}</textarea>
                </div>
                <div style="margin-bottom: 1rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Trạng thái:</label>
                    <select id="categoryStatus" style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem;">
                        <option value="ACTIVE" ${category.status === 'ACTIVE' ? 'selected' : ''}>Hoạt động</option>
                        <option value="INACTIVE" ${category.status === 'INACTIVE' ? 'selected' : ''}>Không hoạt động</option>
                    </select>
                </div>
            </div>
        `;

        const result = await showCustomDialogWithValue(
            'Sửa danh mục',
            modalHTML,
            () => {
                const name = document.getElementById('categoryName')?.value?.trim();
                const description = document.getElementById('categoryDescription')?.value?.trim();
                const status = document.getElementById('categoryStatus')?.value;
                return { name, description, status };
            }
        );

        if (result.confirmed && result.value) {
            await updateCategory(categoryId, result.value);
        }
    } catch (error) {
        console.error('Error loading category for edit:', error);
        alert('❌ Không thể tải thông tin danh mục');
    }
}

// Update category
async function updateCategory(categoryId, categoryData) {
    if (!categoryData.name) {
        alert('❌ Vui lòng nhập tên danh mục!');
        return;
    }

    try {
        await apiRequest(`/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: categoryData.name,
                description: categoryData.description || null,
                status: categoryData.status
            })
        });

        alert('✅ Cập nhật danh mục thành công!');
        loadCategories();
    } catch (error) {
        console.error('Error updating category:', error);
        alert(`❌ Lỗi cập nhật danh mục: ${error.message || 'Không xác định'}`);
    }
}

function viewStore(storeId) {
    alert(`Xem chi tiết cửa hàng #${storeId} (Chức năng đang phát triển)`);
}

async function editStoreStatus(storeId, storeName, currentStatus) {
    if (!isAdmin()) {
        alert('Chỉ Admin mới có quyền thay đổi trạng thái cửa hàng');
        return;
    }

    const statusOptions = `
        <option value="ACTIVE" ${currentStatus === 'ACTIVE' ? 'selected' : ''}>Hoạt động</option>
        <option value="INACTIVE" ${currentStatus === 'INACTIVE' ? 'selected' : ''}>Không hoạt động</option>
    `;

    const content = `
        <div style="padding: 1rem;">
            <p style="margin-bottom: 1rem;"><strong>Cửa hàng:</strong> ${storeName}</p>
            <p style="margin-bottom: 1rem;"><strong>Trạng thái hiện tại:</strong> <span class="status-badge ${currentStatus.toLowerCase()}">${getStatusText(currentStatus)}</span></p>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Chọn trạng thái mới:</label>
            <select id="storeStatusSelect" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                ${statusOptions}
            </select>
        </div>
    `;

    const result = await showCustomDialogWithValue(
        'Cập nhật trạng thái cửa hàng',
        content,
        () => document.getElementById('storeStatusSelect')?.value
    );

    if (result.confirmed && result.value) {
        const newStatus = result.value;
        
        if (newStatus === currentStatus) {
            alert('ℹ️ Trạng thái không thay đổi');
            return;
        }

        try {
            console.log('Updating store status:', storeId, newStatus);
            
            // ✅ GỬI TOKEN ĐỂ XÁC THỰC ADMIN
            const token = localStorage.getItem('foodfast_token');
            if (!token) {
                throw new Error('Vui lòng đăng nhập lại');
            }
            
            const response = await fetch(`${API_BASE_URL}/api/stores/${storeId}/status?status=${newStatus}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Update response:', data);
            alert('✅ Cập nhật trạng thái cửa hàng thành công!');
            loadStores();
        } catch (error) {
            console.error('Error updating store status:', error);
            console.error('Error details:', error.stack);
            alert(`❌ Lỗi cập nhật trạng thái: ${error.message || 'Không xác định'}`);
        }
    }
}

function viewDrone(droneId) {
    alert(`Xem chi tiết drone #${droneId} (Chức năng đang phát triển)`);
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function getStatusText(status) {
    const statusMap = {
        'ACTIVE': 'Hoạt động',
        'INACTIVE': 'Không hoạt động',
        'OUT_OF_STOCK': 'Hết hàng',
        'DISABLED': 'Vô hiệu hóa',
        'OPEN': 'Mở cửa',
        'CLOSED': 'Đóng cửa',
        'PENDING': 'Chờ xử lý',
        'AVAILABLE': 'Sẵn sàng',
        'IN_USE': 'Đang dùng',
        'MAINTENANCE': 'Bảo trì'
    };
    return statusMap[status] || status;
}

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        localStorage.removeItem('foodfast_token');
        localStorage.removeItem('foodfast_user');
        window.location.href = 'login-admin.html';
    }
}

// Edit user role
async function editUserRole(userId, username, currentRoles) {
    if (!isAdmin()) {
        alert('Chỉ Admin mới có quyền thay đổi vai trò người dùng');
        return;
    }

    const availableRoles = ['ADMIN', 'STORE_OWNER', 'CUSTOMER'];
    
    // Get first role or default to CUSTOMER
    const currentRole = Array.isArray(currentRoles) && currentRoles.length > 0 ? currentRoles[0] : 'CUSTOMER';
    
    // Create dropdown options
    const roleOptions = availableRoles.map(role => {
        const selected = currentRole === role ? 'selected' : '';
        return `<option value="${role}" ${selected}>${role}</option>`;
    }).join('');
    
    // Show dialog with callback to get value before closing
    const result = await showCustomDialogWithValue(
        'Chỉnh sửa vai trò',
        `<div style="text-align: left;">
            <p style="margin-bottom: 1rem;"><strong>User:</strong> ${username}</p>
            <p style="margin-bottom: 0.5rem;"><strong>Chọn vai trò:</strong></p>
            <select id="roleSelect" style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; background: white;">
                ${roleOptions}
            </select>
        </div>`,
        () => document.getElementById('roleSelect')?.value
    );
    
    if (result.confirmed && result.value) {
        const selectedRole = result.value;
        
        try {
            // Call API to update roles (send as array with single role)
            await apiRequest(`/users/${userId}/roles`, {
                method: 'PUT',
                body: JSON.stringify({ roles: [selectedRole] })
            });
            
            alert(`✅ Cập nhật vai trò cho ${username} thành công!`);
            loadUsers();
        } catch (error) {
            console.error('Error updating roles:', error);
            alert(`❌ Lỗi cập nhật vai trò: ${error.message || 'Không xác định'}`);
        }
    }
}

// Edit user status
async function editUserStatus(userId, username, currentStatus) {
    if (!isAdmin()) {
        alert('Chỉ Admin mới có quyền thay đổi trạng thái người dùng');
        return;
    }

    const availableStatuses = [
        { value: 'ACTIVE', label: 'Hoạt động', color: '#10b981' },
        { value: 'LOCKED', label: 'Khóa', color: '#ef4444' },
        { value: 'PENDING', label: 'Chờ duyệt', color: '#f59e0b' }
    ];
    
    // Create dropdown options
    const statusOptions = availableStatuses.map(status => {
        const selected = currentStatus === status.value ? 'selected' : '';
        return `<option value="${status.value}" ${selected}>${status.label}</option>`;
    }).join('');
    
    // Show dialog with callback to get value before closing
    const result = await showCustomDialogWithValue(
        'Chỉnh sửa trạng thái',
        `<div style="text-align: left;">
            <p style="margin-bottom: 1rem;"><strong>User:</strong> ${username}</p>
            <p style="margin-bottom: 0.5rem;"><strong>Chọn trạng thái:</strong></p>
            <select id="statusSelect" style="width: 100%; padding: 0.625rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; background: white;">
                ${statusOptions}
            </select>
            <p style="margin-top: 0.75rem; font-size: 0.875rem; color: #64748b;">
                <strong>Lưu ý:</strong><br>
                • <strong>Hoạt động:</strong> User có thể đăng nhập và sử dụng hệ thống<br>
                • <strong>Khóa:</strong> User không thể đăng nhập<br>
                • <strong>Chờ duyệt:</strong> User đang chờ admin xét duyệt
            </p>
        </div>`,
        () => document.getElementById('statusSelect')?.value
    );
    
    if (result.confirmed && result.value) {
        const selectedStatus = result.value;
        
        try {
            // Call API to update status
            await apiRequest(`/users/${userId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: selectedStatus })
            });
            
            alert(`✅ Cập nhật trạng thái cho ${username} thành công!`);
            loadUsers();
        } catch (error) {
            console.error('Error updating status:', error);
            alert(`❌ Lỗi cập nhật trạng thái: ${error.message || 'Không xác định'}`);
        }
    }
}

// Custom dialog helper
function showCustomDialog(title, content, showCancel = false) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white; padding: 2rem; border-radius: 12px;
            max-width: 500px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 1.5rem 0; color: #1e293b;">${title}</h3>
            <div style="margin-bottom: 1.5rem;">${content}</div>
            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                ${showCancel ? '<button id="dialogCancel" style="padding: 0.625rem 1.25rem; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 0.95rem;">Hủy</button>' : ''}
                <button id="dialogOK" style="padding: 0.625rem 1.25rem; border: none; background: #f59e0b; color: white; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 500;">OK</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Event handlers
        const okBtn = dialog.querySelector('#dialogOK');
        const cancelBtn = dialog.querySelector('#dialogCancel');
        
        okBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                document.body.removeChild(overlay);
                resolve(false);
            };
        }
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve(false);
            }
        };
    });
}

// Custom dialog with value callback
function showCustomDialogWithValue(title, content, getValueCallback) {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white; padding: 2rem; border-radius: 12px;
            max-width: 500px; width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        `;
        
        dialog.innerHTML = `
            <h3 style="margin: 0 0 1.5rem 0; color: #1e293b;">${title}</h3>
            <div style="margin-bottom: 1.5rem;">${content}</div>
            <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                <button id="dialogCancel" style="padding: 0.625rem 1.25rem; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-size: 0.95rem;">Hủy</button>
                <button id="dialogOK" style="padding: 0.625rem 1.25rem; border: none; background: #f59e0b; color: white; border-radius: 6px; cursor: pointer; font-size: 0.95rem; font-weight: 500;">OK</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Event handlers
        const okBtn = dialog.querySelector('#dialogOK');
        const cancelBtn = dialog.querySelector('#dialogCancel');
        
        okBtn.onclick = () => {
            const value = getValueCallback ? getValueCallback() : null;
            document.body.removeChild(overlay);
            resolve({ confirmed: true, value: value });
        };
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                document.body.removeChild(overlay);
                resolve({ confirmed: false, value: null });
            };
        }
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
                resolve({ confirmed: false, value: null });
            }
        };
    });
}

// ==================== DRONE MANAGEMENT ====================

function openAddDroneModal() {
    document.getElementById('droneModalTitle').textContent = 'Thêm Drone';
    document.getElementById('droneForm').reset();
    document.getElementById('droneId').value = '';
    document.getElementById('droneModal').style.display = 'flex';
}

function closeDroneModal() {
    document.getElementById('droneModal').style.display = 'none';
}

async function saveDrone() {
    const id = document.getElementById('droneId').value;
    const code = document.getElementById('droneCode').value;
    const model = document.getElementById('droneModel').value;
    const maxPayload = parseFloat(document.getElementById('droneMaxPayload').value) || null;
    const batteryLevel = parseInt(document.getElementById('droneBatteryLevel').value) || 100;
    const status = document.getElementById('droneStatus').value;
    const latitude = parseFloat(document.getElementById('droneLatitude').value) || null;
    const longitude = parseFloat(document.getElementById('droneLongitude').value) || null;

    // Validation
    if (!code || !model) {
        alert('Vui lòng nhập code và model cho drone!');
        return;
    }

    try {
        if (id) {
            // Update existing drone
            const data = {
                code: code,
                model: model,
                maxPayload: maxPayload,
                batteryLevel: batteryLevel,
                status: status,
                currentLatitude: latitude,
                currentLongitude: longitude
            };
            await apiRequest(`/drones/id/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            alert('Cập nhật drone thành công!');
        } else {
            // Create new drone
            const data = {
                code: code,
                model: model,
                maxPayloadGram: maxPayload ? Math.round(maxPayload * 1000) : null,
                latitude: latitude,
                longitude: longitude
            };
            await apiRequest('/drones/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            alert('Thêm drone thành công!');
        }
        
        closeDroneModal();
        loadDrones();
    } catch (error) {
        console.error('Error saving drone:', error);
        alert('Lỗi khi lưu drone: ' + error.message);
    }
}

async function viewDrone(droneId) {
    document.getElementById('viewDroneModal').style.display = 'flex';
    const content = document.getElementById('droneDetailsContent');
    content.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        const response = await apiRequest(`/drones/id/${droneId}`);
        const drone = response.result;

        content.innerHTML = `
            <div style="display: grid; gap: 1.5rem;">
                <!-- Basic Info -->
                <div class="info-card">
                    <h3 style="margin: 0 0 1rem 0; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-info-circle"></i> Thông Tin Cơ Bản
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">ID:</span>
                            <span class="info-value">${drone.id}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Code:</span>
                            <span class="info-value"><code>${drone.code}</code></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Model:</span>
                            <span class="info-value">${drone.model || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Trạng thái:</span>
                            <span class="status-badge ${drone.status.toLowerCase()}">${formatDroneStatus(drone.status)}</span>
                        </div>
                    </div>
                </div>

                <!-- Technical Specs -->
                <div class="info-card">
                    <h3 style="margin: 0 0 1rem 0; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-cog"></i> Thông Số Kỹ Thuật
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Tải trọng tối đa:</span>
                            <span class="info-value">${drone.maxPayloadGram ? (drone.maxPayloadGram / 1000).toFixed(1) : 0} kg</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mức pin:</span>
                            <span class="info-value">
                                <span style="color: ${drone.currentBatteryPercent > 50 ? '#10b981' : drone.currentBatteryPercent > 20 ? '#f59e0b' : '#ef4444'};">
                                    <i class="fas fa-battery-${drone.currentBatteryPercent > 75 ? 'full' : drone.currentBatteryPercent > 50 ? 'three-quarters' : drone.currentBatteryPercent > 25 ? 'half' : 'quarter'}"></i>
                                    ${drone.currentBatteryPercent || 0}%
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Location -->
                <div class="info-card">
                    <h3 style="margin: 0 0 1rem 0; color: var(--primary); display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt"></i> Vị Trí Hiện Tại
                    </h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Latitude:</span>
                            <span class="info-value">${drone.lastLatitude || 'N/A'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Longitude:</span>
                            <span class="info-value">${drone.lastLongitude || 'N/A'}</span>
                        </div>
                        ${drone.lastTelemetryAt ? `
                        <div class="info-item">
                            <span class="info-label">Cập nhật vị trí:</span>
                            <span class="info-value">${formatDateTime(drone.lastTelemetryAt)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Store drone data for editing
        window.currentViewingDrone = drone;
    } catch (error) {
        console.error('Error loading drone details:', error);
        content.innerHTML = '<div style="color: red; text-align: center;">Lỗi tải thông tin drone</div>';
    }
}

function closeViewDroneModal() {
    document.getElementById('viewDroneModal').style.display = 'none';
    window.currentViewingDrone = null;
}

function editDroneFromView() {
    if (!window.currentViewingDrone) return;
    
    const drone = window.currentViewingDrone;
    
    // Close view modal
    closeViewDroneModal();
    
    // Open edit modal with data
    document.getElementById('droneModalTitle').textContent = 'Chỉnh Sửa Drone';
    document.getElementById('droneId').value = drone.id;
    document.getElementById('droneName').value = drone.name || '';
    document.getElementById('droneCode').value = drone.code || '';
    document.getElementById('droneModel').value = drone.model || '';
    document.getElementById('droneSerialNumber').value = drone.serialNumber || '';
    document.getElementById('droneMaxPayload').value = drone.maxPayload || '';
    document.getElementById('droneMaxRange').value = drone.maxRange || '';
    document.getElementById('droneBatteryLevel').value = drone.batteryLevel || 100;
    document.getElementById('droneStatus').value = drone.status || 'AVAILABLE';
    document.getElementById('droneLatitude').value = drone.currentLatitude || '';
    document.getElementById('droneLongitude').value = drone.currentLongitude || '';
    
    document.getElementById('droneModal').style.display = 'flex';
}

async function deleteDrone(droneId) {
    if (!confirm('Bạn có chắc muốn xóa drone này?')) {
        return;
    }

    try {
        await apiRequest(`/drones/id/${droneId}`, {
            method: 'DELETE'
        });
        alert('Xóa drone thành công!');
        loadDrones();
    } catch (error) {
        console.error('Error deleting drone:', error);
        alert('Lỗi khi xóa drone: ' + error.message);
    }
}

function formatDroneStatus(status) {
    const statusMap = {
        'AVAILABLE': 'Sẵn sàng',
        'IN_FLIGHT': 'Đang bay',
        'CHARGING': 'Đang sạc',
        'MAINTENANCE': 'Bảo trì'
    };
    return statusMap[status] || status;
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
