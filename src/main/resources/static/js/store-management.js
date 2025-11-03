// Store Management JavaScript

let currentStore = null;
let ordersData = [];
let refreshInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;

    // Load store info first, then orders
    await loadStoreInfo();
    await loadOrders();

    // Auto refresh every 30 seconds
    refreshInterval = setInterval(loadOrders, 30000);
});

// Check authentication
function checkAuth() {
    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return false;
    }
    return true;
}

// Load store info
async function loadStoreInfo() {
    try {
        Loading.show();
        console.log('Loading store info...');

        const user = AuthHelper.getUser();
        console.log('User:', user);

        // For demo, use first store or create one
        // In real app, get store by user/owner
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.STORES);
        console.log('Stores response:', response);

        const stores = response.result || response || [];
        console.log('Stores:', stores);

        if (stores.length > 0) {
            currentStore = stores[0];
            console.log('Selected store:', currentStore);

            document.getElementById('storeName').textContent = currentStore.name || 'Cửa hàng';
            document.getElementById('storeAddress').textContent = currentStore.address || '-';

            Toast.success('Đã tải thông tin cửa hàng');
        } else {
            Toast.warning('Chưa có cửa hàng. Vui lòng tạo cửa hàng trước.');
            console.warn('No stores found in database');
        }
    } catch (error) {
        console.error('Error loading store:', error);
        Toast.error('Không thể tải thông tin cửa hàng: ' + error.message);
    } finally {
        Loading.hide();
    }
}

// Load orders
async function loadOrders() {
    if (!currentStore) {
        console.log('⚠️ Waiting for store info...');
        Toast.warning('Đang tải thông tin cửa hàng...');
        return;
    }

    try {
        Loading.show();
        console.log('📦 Loading orders for store:', currentStore.id);

        const endpoint = API_CONFIG.ENDPOINTS.ORDER_BY_STORE(currentStore.id);
        console.log('📡 API endpoint:', API_CONFIG.BASE_URL + endpoint);

        const response = await APIHelper.get(endpoint);
        console.log('📦 Orders response:', response);

        ordersData = response.result || [];
        console.log(`✅ Loaded ${ordersData.length} orders`);

        // Update statistics
        updateStatistics();

        // Display orders by status
        displayOrdersByStatus();

        if (ordersData.length === 0) {
            Toast.info('Chưa có đơn hàng nào');
        }

    } catch (error) {
        console.error('❌ Error loading orders:', error);
        Toast.error('Không thể tải đơn hàng: ' + error.message);

        // Show empty state
        displayOrdersByStatus();
    } finally {
        Loading.hide();
    }
}

// Update statistics
function updateStatistics() {
    const stats = {
        PENDING: 0,
        PENDING_PAYMENT: 0,
        PAID: 0,
        CONFIRMED: 0,
        IN_DELIVERY: 0,
        DELIVERED: 0
    };

    ordersData.forEach(order => {
        const status = order.status;

        // Group PENDING_PAYMENT and PAID into PENDING for display
        if (status === 'PENDING_PAYMENT' || status === 'PAID') {
            stats.PENDING++;
        }
        // Group ACCEPT into CONFIRMED
        else if (status === 'ACCEPT') {
            stats.CONFIRMED++;
        }
        else if (stats[status] !== undefined) {
            stats[status]++;
        }
    });

    document.getElementById('statPending').textContent = stats.PENDING;
    document.getElementById('statConfirmed').textContent = stats.CONFIRMED;
    document.getElementById('statDelivering').textContent = stats.IN_DELIVERY;
    document.getElementById('statDelivered').textContent = stats.DELIVERED;

    document.getElementById('badgePending').textContent = stats.PENDING;
}

// Display orders by status
function displayOrdersByStatus() {
    const containers = {
        'PENDING': 'ordersPending',
        'PENDING_PAYMENT': 'ordersPending',
        'PAID': 'ordersPending',
        'ACCEPT': 'ordersConfirmed',
        'CONFIRMED': 'ordersConfirmed',
        'IN_DELIVERY': 'ordersDelivering',
        'DELIVERED': 'ordersCompleted'
    };

    // Clear all containers
    const uniqueContainers = [...new Set(Object.values(containers))];
    uniqueContainers.forEach(id => {
        document.getElementById(id).innerHTML = '';
    });

    // Group orders by status for display
    const ordersByStatus = {};
    ordersData.forEach(order => {
        let status = order.status || 'PENDING';

        // Map statuses to display groups
        if (status === 'PENDING_PAYMENT' || status === 'PAID') {
            status = 'PENDING';
        } else if (status === 'ACCEPT') {
            status = 'CONFIRMED';
        }

        if (!ordersByStatus[status]) {
            ordersByStatus[status] = [];
        }
        ordersByStatus[status].push(order);
    });

    // Display orders
    Object.entries(ordersByStatus).forEach(([status, orders]) => {
        const containerId = containers[status];
        if (containerId) {
            const container = document.getElementById(containerId);
            if (orders.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>Không có đơn hàng</p>
                    </div>
                `;
            } else {
                container.innerHTML = orders.map(order => renderOrderCard(order)).join('');
            }
        }
    });
}

// Render order card
function renderOrderCard(order) {
    const statusClass = `status-${order.status.toLowerCase().replace('_', '-')}`;
    const statusText = getStatusText(order.status);

    return `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">#${order.orderCode || order.id}</div>
                    <p style="color: var(--gray); margin: 0.25rem 0;">
                        <i class="fas fa-user"></i> ${order.customerName || 'Khách hàng'}
                    </p>
                    <p style="color: var(--gray); margin: 0.25rem 0; font-size: 0.9rem;">
                        <i class="fas fa-calendar"></i> ${FormatHelper.date(order.createdAt)}
                    </p>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="order-items">
                ${(order.items || []).map(item => `
                    <div class="order-item">
                        <span>${item.productName} x ${item.quantity}</span>
                        <span>${FormatHelper.currency(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="order-total">
                Tổng: ${FormatHelper.currency(order.totalPayable || order.totalAmount)}
            </div>
            
            <div class="order-actions">
                ${getOrderActions(order)}
            </div>
        </div>
    `;
}

// Get order actions based on status
function getOrderActions(order) {
    const actions = [];

    switch (order.status) {
        case 'PENDING':
        case 'PENDING_PAYMENT':
            actions.push(`
                <span style="color: var(--warning-color);">
                    <i class="fas fa-clock"></i> Đang chờ thanh toán
                </span>
            `);
            break;

        case 'PAID':
            actions.push(`
                <button class="btn btn-primary" onclick="acceptOrder(${order.id})">
                    <i class="fas fa-check"></i> Chấp nhận & Chuẩn bị
                </button>
                <button class="btn btn-outline" onclick="rejectOrder(${order.id})">
                    <i class="fas fa-times"></i> Từ chối
                </button>
            `);
            break;

        case 'ACCEPT':
        case 'CONFIRMED':
            actions.push(`
                <span style="color: #17a2b8; margin-right: 0.5rem;">
                    <i class="fas fa-utensils"></i> Đang chuẩn bị món...
                </span>
                <button class="btn btn-primary" onclick="assignDrone(${order.id})">
                    <i class="fas fa-drone"></i> Giao cho drone
                </button>
            `);
            break;

        case 'IN_DELIVERY':
            actions.push(`
                <button class="btn btn-outline" onclick="trackDelivery(${order.id})">
                    <i class="fas fa-map-marked-alt"></i> Theo dõi
                </button>
            `);
            break;

        case 'DELIVERED':
            actions.push(`
                <span style="color: var(--success-color);">
                    <i class="fas fa-check-circle"></i> Đã giao thành công
                </span>
            `);
            break;
    }

    return actions.join('');
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xác nhận',
        'PENDING_PAYMENT': 'Chờ thanh toán',
        'PAID': 'Đã thanh toán',
        'ACCEPT': 'Đã chấp nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng',
        'PICKED_UP': 'Đã lấy hàng',
        'IN_DELIVERY': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
}

// Accept order
async function acceptOrder(orderId) {
    if (!confirm('Xác nhận chấp nhận đơn hàng này?')) return;

    try {
        Loading.show();

        await APIHelper.post(`${API_CONFIG.ENDPOINTS.ORDER_BY_ID(orderId)}/accept`, {
            estimatedPrepTime: 15 // minutes
        });

        Toast.success('Đã chấp nhận đơn hàng!');
        await loadOrders();

    } catch (error) {
        console.error('Error accepting order:', error);
        Toast.error('Không thể chấp nhận đơn hàng: ' + error.message);
    } finally {
        Loading.hide();
    }
}

// Reject order
async function rejectOrder(orderId) {
    const reason = prompt('Lý do từ chối:');
    if (!reason) return;

    try {
        Loading.show();

        await APIHelper.post(`${API_CONFIG.ENDPOINTS.ORDER_BY_ID(orderId)}/cancel`);

        Toast.success('Đã từ chối đơn hàng');
        await loadOrders();

    } catch (error) {
        console.error('Error rejecting order:', error);
        Toast.error('Không thể từ chối đơn hàng: ' + error.message);
    } finally {
        Loading.hide();
    }
}

// Note: startPreparing and markReady removed - simplified flow
// ACCEPT status means store is preparing, then directly assign drone

// Assign drone
async function assignDrone(orderId) {
    // Redirect to drone management page
    window.location.href = `drone-management.html?orderId=${orderId}`;
}

// Track delivery
function trackDelivery(orderId) {
    window.location.href = `drone-management.html?orderId=${orderId}`;
}

// Switch tab
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.tab').classList.add('active');

    // Update tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// Refresh orders
function refreshOrders() {
    Toast.info('Đang làm mới...');
    loadOrders();
}

// Logout
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        clearInterval(refreshInterval);
        AuthHelper.logout();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

console.log('Store Management loaded');

