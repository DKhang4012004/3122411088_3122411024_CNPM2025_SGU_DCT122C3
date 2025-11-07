// Orders.js - Orders Page Logic (Clean Version)

let selectedOrder = null;
let deliveryInfo = null;

// Handle VNPay return - redirect from ngrok to localhost to preserve localStorage
function handleVNPayReturn() {
    const urlParams = new URLSearchParams(window.location.search);
    const isVNPayReturn = urlParams.has('vnp_TxnRef') || urlParams.has('vnp_ResponseCode');

    // If this is VNPay return and we're on ngrok domain
    if (isVNPayReturn && window.location.hostname.includes('ngrok')) {
        console.log('VNPay return detected on ngrok - redirecting to localhost...');

        // Redirect to localhost with same query params
        const localhostUrl = `http://localhost:8080/home/orders.html${window.location.search}`;
        window.location.href = localhostUrl;
        return true; // Stop further execution
    }

    // If this is VNPay return on localhost, show payment result
    if (isVNPayReturn && window.location.hostname === 'localhost') {
        const responseCode = urlParams.get('vnp_ResponseCode');

        if (responseCode === '00') {
            Toast.success('Thanh toán thành công! Đang tải đơn hàng...');
            console.log('✅ Payment successful');
        } else {
            Toast.error('Thanh toán thất bại! Mã lỗi: ' + responseCode);
            console.log('❌ Payment failed:', responseCode);
        }

        // Clear URL params after showing message
        setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 2000);
    }

    return false;
}

// Ensure user object has proper structure
function ensureUserIdField() {
    const userStr = localStorage.getItem('foodfast_user');
    if (!userStr) return;

    const user = JSON.parse(userStr);

    // If user doesn't have 'id' but has 'userId', fix it
    if (!user.id && user.userId) {
        user.id = user.userId;
        localStorage.setItem('foodfast_user', JSON.stringify(user));
        console.log('Fixed user object - added id field:', user);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANT: Handle VNPay return FIRST before anything else
    if (handleVNPayReturn()) {
        return; // Stop if redirecting
    }

    ensureUserIdField(); // Fix user object if needed
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
        console.log('Current user from localStorage:', user);

        if (!user) {
            console.error('No user found in localStorage');
            Toast.error('Vui lòng đăng nhập');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return;
        }

        // Check for userId field
        const userId = user.id || user.userId;
        console.log('User object:', user);
        console.log('Loading orders for userId:', userId);

        if (!userId) {
            console.error('User missing ID:', user);
            Toast.error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại');
            setTimeout(() => {
                AuthHelper.logout();
            }, 2000);
            return;
        }


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

    container.innerHTML = orders.map(order => {
        const paymentStatus = order.paymentStatus || 'PENDING';
        // Check if payment is pending (handle both PENDING and PENDING_PAYMENT)
        const isPendingPayment = paymentStatus === 'PENDING' || 
                                 paymentStatus === 'PENDING_PAYMENT' ||
                                 paymentStatus === 'UNPAID';
        const isFailedPayment = paymentStatus === 'FAILED';
        
        // Allow payment for ANY order that hasn't been paid yet (regardless of order status)
        // Only exclude if: already PAID, or order is DELIVERED/CANCELLED
        const isOrderFinalized = order.status === 'DELIVERED' || 
                                order.status === 'CANCELLED' ||
                                order.status === 'COMPLETED';
        const isAlreadyPaid = paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
        
        const canPay = (isPendingPayment || isFailedPayment) && !isOrderFinalized && !isAlreadyPaid;
        
        return `
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
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                        <span class="${getOrderStatusClass(order.status)}">${getOrderStatusText(order.status)}</span>
                        <span class="${getPaymentStatusClass(paymentStatus)}">${getPaymentStatusText(paymentStatus)}</span>
                    </div>
                </div>
                
                <div style="border-top: 1px solid var(--light); padding-top: 1rem; margin-top: 1rem;">
                    ${order.items && order.items.length > 0 ? order.items.map(item => {
                        const unitPrice = item.unitPrice || item.price || 0;
                        const subtotal = item.totalPrice || (unitPrice * item.quantity);
                        return `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span>${item.productName || 'Sản phẩm'} x ${item.quantity || 1}</span>
                            <span class="text-gray">${FormatHelper.currency(subtotal)}</span>
                        </div>
                    `}).join('') : '<p class="text-gray">Không có sản phẩm</p>'}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--light);">
                    <span style="font-size: 1.2rem; font-weight: bold;">
                        Tổng: <span class="text-primary">${FormatHelper.currency(order.totalPayable || order.totalAmount)}</span>
                    </span>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${canPay ? `
                            <button class="btn btn-success btn-sm" onclick="payOrder(${order.id})">
                                <i class="fas fa-credit-card"></i> Thanh toán
                            </button>
                        ` : ''}
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
    `}).join('');
}

// Pay for a specific order
async function payOrder(orderId) {
    if (!confirm('Xác nhận thanh toán đơn hàng này?')) {
        return;
    }

    try {
        Loading.show();
        
        // Use current origin for returnUrl
        const returnUrl = window.location.origin + '/home/orders.html';
        console.log('Payment returnUrl:', returnUrl);

        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.PAYMENT_INIT, {
            orderId: orderId,
            provider: 'VNPAY',
            method: 'QR',
            returnUrl: returnUrl
        });
        
        if (response.result && response.result.paymentUrl) {
            Toast.success('Chuyển đến trang thanh toán...');
            setTimeout(() => {
                window.location.href = response.result.paymentUrl;
            }, 1000);
        } else {
            Toast.error('Không thể khởi tạo thanh toán');
        }
        
    } catch (error) {
        console.error('Error initiating payment:', error);
        Toast.error('Lỗi khi thanh toán: ' + error.message);
    } finally {
        Loading.hide();
    }
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
    try {
        Loading.show();
        
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.ORDER_BY_ID(orderId));
        const order = response.result;
        
        if (!order) {
            Toast.error('Không tìm thấy đơn hàng');
            return;
        }
        
        selectedOrder = order;
        displayOrderDetail(order);
        
        // Show modal
        document.getElementById('orderDetailModal').classList.add('show');
        
    } catch (error) {
        console.error('Error loading order detail:', error);
        Toast.error('Không thể tải chi tiết đơn hàng');
    } finally {
        Loading.hide();
    }
}

// Display order detail in modal
function displayOrderDetail(order) {
    const content = document.getElementById('orderDetailContent');
    
    const paymentStatus = order.paymentStatus || 'PENDING';
    // Check if payment is pending (handle both PENDING and PENDING_PAYMENT)
    const isPendingPayment = paymentStatus === 'PENDING' || 
                             paymentStatus === 'PENDING_PAYMENT' ||
                             paymentStatus === 'UNPAID';
    const isFailedPayment = paymentStatus === 'FAILED';
    
    // Allow retry payment for ANY order that hasn't been paid yet
    const isOrderFinalized = order.status === 'DELIVERED' || 
                            order.status === 'CANCELLED' ||
                            order.status === 'COMPLETED';
    const isAlreadyPaid = paymentStatus === 'PAID' || paymentStatus === 'COMPLETED';
    
    const canRetryPayment = (isPendingPayment || isFailedPayment) && !isOrderFinalized && !isAlreadyPaid;
    
    content.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <h2 style="margin: 0;">#${order.orderCode || order.id}</h2>
                    <p style="color: var(--gray); margin: 0.25rem 0;">
                        <i class="fas fa-calendar"></i> ${FormatHelper.date(order.createdAt)}
                    </p>
                </div>
                <span class="${getOrderStatusClass(order.status)}">${getOrderStatusText(order.status)}</span>
            </div>
            
            <!-- Store Info -->
            <div class="card" style="margin-bottom: 1rem;">
                <div class="card-body">
                    <h4><i class="fas fa-store"></i> Cửa hàng</h4>
                    <p style="margin: 0.5rem 0;">${order.storeName || 'N/A'}</p>
                </div>
            </div>
            
            <!-- Delivery Address -->
            <div class="card" style="margin-bottom: 1rem;">
                <div class="card-body">
                    <h4><i class="fas fa-home"></i> Địa chỉ giao hàng</h4>
                    <p style="margin: 0;">${order.deliveryAddressSnapshot || 'N/A'}</p>
                </div>
            </div>
            
            <!-- Order Items -->
            <div class="card" style="margin-bottom: 1rem;">
                <div class="card-body">
                    <h4><i class="fas fa-shopping-bag"></i> Sản phẩm</h4>
                    ${order.items && order.items.length > 0 ? order.items.map(item => {
                        const unitPrice = item.unitPrice || item.price || 0;
                        const subtotal = item.totalPrice || (unitPrice * item.quantity);
                        return `
                        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--light);">
                            <div style="flex: 1;">
                                <p style="margin: 0; font-weight: 600;">${item.productName || 'Sản phẩm'}</p>
                                <p style="margin: 0.25rem 0; color: var(--gray); font-size: 0.9rem;">
                                    ${FormatHelper.currency(unitPrice)} x ${item.quantity}
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0; font-weight: 600;">${FormatHelper.currency(subtotal)}</p>
                            </div>
                        </div>
                    `}).join('') : '<p class="text-gray">Không có sản phẩm</p>'}
                </div>
            </div>
            
            <!-- Payment Summary -->
            <div class="card">
                <div class="card-body">
                    <h4><i class="fas fa-receipt"></i> Thanh toán</h4>
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                        <span>Tạm tính:</span>
                        <span>${FormatHelper.currency(order.totalItemAmount || 0)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                        <span>Phí giao hàng:</span>
                        <span>${FormatHelper.currency(order.shippingFee || 0)}</span>
                    </div>
                    ${order.discountAmount && order.discountAmount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0; color: var(--success-color);">
                        <span>Giảm giá:</span>
                        <span>-${FormatHelper.currency(order.discountAmount)}</span>
                    </div>
                    ` : ''}
                    ${order.taxAmount && order.taxAmount > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin: 0.5rem 0;">
                        <span>Thuế:</span>
                        <span>${FormatHelper.currency(order.taxAmount)}</span>
                    </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--light); font-size: 1.3rem; font-weight: bold;">
                        <span>Tổng cộng:</span>
                        <span class="text-primary">${FormatHelper.currency(order.totalPayable || order.totalAmount)}</span>
                    </div>
                    
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--light);">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Trạng thái thanh toán:</span>
                            <span class="${getPaymentStatusClass(paymentStatus)}">
                                ${getPaymentStatusText(paymentStatus)}
                            </span>
                        </div>
                        ${canRetryPayment ? `
                        <button class="btn btn-primary btn-block" style="margin-top: 1rem;" onclick="retryPayment(${order.id})">
                            <i class="fas fa-credit-card"></i> Thanh toán lại
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Retry payment for pending orders
async function retryPayment(orderId) {
    try {
        Loading.show();
        
        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.PAYMENT_INIT, {
            orderId: orderId
        });
        
        if (response.result && response.result.paymentUrl) {
            Toast.success('Chuyển đến trang thanh toán...');
            setTimeout(() => {
                window.location.href = response.result.paymentUrl;
            }, 1000);
        } else {
            Toast.error('Không thể khởi tạo thanh toán');
        }
        
    } catch (error) {
        console.error('Error retrying payment:', error);
        Toast.error('Lỗi khi thanh toán: ' + error.message);
    } finally {
        Loading.hide();
    }
}

// Get payment status class
function getPaymentStatusClass(status) {
    const classMap = {
        'PENDING': 'badge badge-warning',
        'PENDING_PAYMENT': 'badge badge-warning',
        'UNPAID': 'badge badge-warning',
        'PAID': 'badge badge-success',
        'FAILED': 'badge badge-danger',
        'REFUNDED': 'badge badge-info'
    };
    return classMap[status] || 'badge badge-warning';
}

// Get payment status text
function getPaymentStatusText(status) {
    const textMap = {
        'PENDING': 'Chờ thanh toán',
        'PENDING_PAYMENT': 'Chờ thanh toán',
        'UNPAID': 'Chưa thanh toán',
        'PAID': 'Đã thanh toán',
        'FAILED': 'Thanh toán thất bại',
        'REFUNDED': 'Đã hoàn tiền'
    };
    return textMap[status] || 'Chưa thanh toán';
}

// Close order modal
function closeOrderModal() {
    document.getElementById('orderDetailModal').classList.remove('show');
}

// Track delivery
async function trackDelivery(orderId) {
    try {
        Loading.show();
        
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.DELIVERY_BY_ORDER(orderId));
        const delivery = response.result;
        
        if (!delivery) {
            Toast.warning('Chưa có thông tin giao hàng');
            return;
        }
        
        deliveryInfo = delivery;
        displayDeliveryTracking(delivery);
        
        // Show modal
        document.getElementById('trackingModal').classList.add('show');
        
    } catch (error) {
        console.error('Error loading delivery:', error);
        Toast.error('Không thể tải thông tin giao hàng');
    } finally {
        Loading.hide();
    }
}

// Display delivery tracking
function displayDeliveryTracking(delivery) {
    const content = document.getElementById('trackingContent');
    
    const statusInfo = getDeliveryStatusInfo(delivery.currentStatus);
    
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <i class="fas fa-drone" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
            <h3 style="margin: 0;">${statusInfo.text}</h3>
            <p style="color: var(--gray); margin: 0.5rem 0;">Mã giao hàng: ${delivery.orderCode || delivery.id}</p>
        </div>
        
        <!-- Drone Info -->
        ${delivery.droneCode ? `
        <div class="card" style="margin-bottom: 1rem;">
            <div class="card-body">
                <h4><i class="fas fa-helicopter"></i> Thông tin Drone</h4>
                <p style="margin: 0.5rem 0;"><strong>Mã drone:</strong> ${delivery.droneCode}</p>
                <p style="margin: 0.5rem 0;"><strong>Khoảng cách:</strong> ${delivery.distanceKm ? delivery.distanceKm.toFixed(2) + ' km' : 'N/A'}</p>
                <p style="margin: 0.5rem 0;"><strong>Thời gian bay:</strong> ${delivery.estimatedFlightTimeMinutes ? delivery.estimatedFlightTimeMinutes + ' phút' : 'N/A'}</p>
            </div>
        </div>
        ` : ''}
        
        <!-- Timeline -->
        <div class="card">
            <div class="card-body">
                <h4><i class="fas fa-list"></i> Lịch sử giao hàng</h4>
                <div style="position: relative; padding-left: 2rem;">
                    ${delivery.actualDepartureTime ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--success-color); border-radius: 50%; top: 5px;"></div>
                        <div style="position: absolute; left: -1.44rem; width: 2px; height: 100%; background: var(--light); top: 17px;"></div>
                        <strong>Đã lấy hàng</strong>
                        <p style="margin: 0.25rem 0; color: var(--gray); font-size: 0.9rem;">
                            ${FormatHelper.date(delivery.actualDepartureTime)}
                        </p>
                    </div>
                    ` : ''}
                    
                    ${delivery.actualArrivalTime ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--success-color); border-radius: 50%; top: 5px;"></div>
                        <strong>Đã giao hàng</strong>
                        <p style="margin: 0.25rem 0; color: var(--gray); font-size: 0.9rem;">
                            ${FormatHelper.date(delivery.actualArrivalTime)}
                        </p>
                    </div>
                    ` : `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--warning-color); border-radius: 50%; top: 5px;"></div>
                        <strong>Đang giao hàng</strong>
                        <p style="margin: 0.25rem 0; color: var(--gray); font-size: 0.9rem;">
                            Dự kiến: ${delivery.estimatedArrivalTime ? FormatHelper.date(delivery.estimatedArrivalTime) : '15-30 phút'}
                        </p>
                    </div>
                    `}
                </div>
            </div>
        </div>
        
        <!-- Addresses -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
            <div class="card">
                <div class="card-body">
                    <h5><i class="fas fa-store"></i> Điểm lấy</h5>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem;">${delivery.pickupStoreName || 'Cửa hàng'}</p>
                </div>
            </div>
            <div class="card">
                <div class="card-body">
                    <h5><i class="fas fa-home"></i> Điểm giao</h5>
                    <p style="margin: 0.5rem 0; font-size: 0.9rem;">${delivery.dropoffAddressSnapshot || 'N/A'}</p>
                </div>
            </div>
        </div>
    `;
}

// Get delivery status info
function getDeliveryStatusInfo(status) {
    const statusMap = {
        'PENDING': { text: 'Chờ lấy hàng', icon: 'clock', color: 'warning' },
        'ASSIGNED': { text: 'Đã phân công drone', icon: 'check-circle', color: 'info' },
        'PICKED_UP': { text: 'Đang giao hàng', icon: 'drone', color: 'primary' },
        'IN_TRANSIT': { text: 'Đang trên đường', icon: 'shipping-fast', color: 'primary' },
        'DELIVERED': { text: 'Đã giao thành công', icon: 'check-double', color: 'success' },
        'FAILED': { text: 'Giao hàng thất bại', icon: 'times-circle', color: 'danger' }
    };
    return statusMap[status] || { text: 'Đang xử lý', icon: 'spinner', color: 'info' };
}

// Close tracking modal
function closeTrackingModal() {
    document.getElementById('trackingModal').classList.remove('show');
}

// Get order status class
function getOrderStatusClass(status) {
    const classMap = {
        'CREATED': 'badge badge-info',
        'PENDING': 'badge badge-warning',
        'CONFIRMED': 'badge badge-info',
        'ACCEPT': 'badge badge-info',
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
        'CREATED': 'Đã tạo',
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'ACCEPT': 'Đã chấp nhận',
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

