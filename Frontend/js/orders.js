// Orders.js - Orders Page Logic (Clean Version)

let selectedOrder = null;
let deliveryInfo = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadOrders();
    checkAuthStatus();
    updateCartBadge();
});

// Check auth and redirect if not logged in
function checkAuthAndLoadOrders() {
    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập để xem đơn hàng');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    loadOrders();
}

// Check authentication status
function checkAuthStatus() {
    const isLoggedIn = AuthHelper.isLoggedIn();
    const guestMenu = document.getElementById('guestMenu');
    const userDropdown = document.getElementById('userDropdown');

    if (isLoggedIn) {
        const user = AuthHelper.getUser();
        if (guestMenu) guestMenu.style.display = 'none';
        if (userDropdown) userDropdown.style.display = 'block';
        const userName = document.getElementById('userName');
        if (userName) userName.textContent = user.username || user.fullName || 'User';
    }
}

// Load orders
async function loadOrders() {
    try {
        Loading.show();

        const user = AuthHelper.getUser();
        if (!user || !user.id) {
            console.error('User missing ID:', user);
            Toast.error('Vui lòng đăng nhập lại để cập nhật thông tin');

            // Force logout and redirect to login
            setTimeout(() => {
                AuthHelper.logout();
            }, 2000);
            return;
        }

        const userId = user.id;
        console.log('Loading orders for userId:', userId);

        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.USER_ORDERS(userId));
        console.log('Orders response:', response);

        const orders = response.result || [];

        if (orders.length === 0) {
            showEmptyOrders();
        } else {
            displayOrders(orders);
        }

    } catch (error) {
        console.error('Error loading orders:', error);
        Toast.error('Không thể tải danh sách đơn hàng: ' + error.message);
        showEmptyOrders();
    } finally {
        Loading.hide();
    }
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('ordersContainer');
    const emptyOrders = document.getElementById('emptyOrders');

    if (!container) {
        console.error('ordersContainer not found');
        return;
    }

    container.style.display = 'block';
    if (emptyOrders) emptyOrders.style.display = 'none';

    container.innerHTML = orders.map(order => `
        <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0;">${order.orderCode || 'ORD' + order.id}</h3>
                        <p style="color: var(--gray); margin: 0.25rem 0;">
                            <i class="fas fa-store"></i> ${order.storeName || 'Cửa hàng'}
                        </p>
                        <p style="color: var(--gray); margin: 0.25rem 0; font-size: 0.9rem;">
                            <i class="fas fa-calendar"></i> ${FormatHelper.date(order.createdAt)}
                        </p>
                    </div>
                    <span class="${getOrderStatusClass(order.status)}">${getOrderStatusText(order.status)}</span>
                </div>
                
                <div style="border-top: 1px solid var(--light); padding-top: 1rem; margin-top: 1rem;">
                    ${order.items && order.items.length > 0 ? order.items.map(item => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${item.productName || 'Sản phẩm'} x ${item.quantity || 1}</span>
                            <span class="text-gray">${FormatHelper.currency(item.price * item.quantity)}</span>
                        </div>
                    `).join('') : '<p class="text-gray">Không có sản phẩm</p>'}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--light);">
                    <span style="font-size: 1.2rem; font-weight: bold;">
                        Tổng: <span class="text-primary">${FormatHelper.currency(order.totalPayable || order.totalAmount)}</span>
                    </span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-outline btn-sm" onclick="viewOrderDetail(${order.id})">
                            <i class="fas fa-eye"></i> Chi tiết
                        </button>
                        ${order.status === 'IN_DELIVERY' || order.status === 'PAID' ? `
                            <button class="btn btn-primary btn-sm" onclick="trackDelivery(${order.id})">
                                <i class="fas fa-drone"></i> Theo dõi
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Show empty orders
function showEmptyOrders() {
    const container = document.getElementById('ordersContainer');
    const emptyOrders = document.getElementById('emptyOrders');

    if (container) container.style.display = 'none';
    if (emptyOrders) emptyOrders.style.display = 'block';
}

// View order detail
async function viewOrderDetail(orderId) {
    console.log('Viewing order detail:', orderId);
    Toast.info('Chi tiết đơn hàng #' + orderId);
    // TODO: Implement order detail modal
}

// Track delivery
async function trackDelivery(orderId) {
    console.log('Tracking delivery for order:', orderId);
    Toast.info('Theo dõi giao hàng #' + orderId);
    // TODO: Implement tracking modal
}

// Get order status class
function getOrderStatusClass(status) {
    const classMap = {
        'PENDING': 'badge badge-warning',
        'CONFIRMED': 'badge badge-info',
        'PREPARING': 'badge badge-info',
        'READY': 'badge badge-primary',
        'PICKED_UP': 'badge badge-primary',
        'IN_DELIVERY': 'badge badge-primary',
        'DELIVERED': 'badge badge-success',
        'CANCELLED': 'badge badge-danger',
        'PAID': 'badge badge-success'
    };
    return classMap[status] || 'badge';
}

// Get order status text
function getOrderStatusText(status) {
    const textMap = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng',
        'PICKED_UP': 'Đã lấy hàng',
        'IN_DELIVERY': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy',
        'PAID': 'Đã thanh toán'
    };
    return textMap[status] || status;
}

// Update cart badge
async function updateCartBadge() {
    if (!AuthHelper.isLoggedIn()) {
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = '0';
        return;
    }

    try {
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.CART_COUNT);
        const count = response || 0;
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = count;
    } catch (error) {
        console.error('Error updating cart badge:', error);
    }
}

// Toggle dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) dropdown.classList.toggle('show');
}

// Logout
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        AuthHelper.logout();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdownMenu');
    const avatar = document.getElementById('userAvatar');
    if (dropdown && avatar && !avatar.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// Toast and Loading are already defined in config.js

console.log('Orders.js loaded successfully');

