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
            // Check which stores are within flight corridor
            await checkStoresInFlightCorridor(orders);
            
            // Fetch delivery status for orders in delivery (before display)
            await fetchDeliveryStatusForOrders(orders);
            
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

// Check which stores are within flight corridor
async function checkStoresInFlightCorridor(orders) {
    const locationStr = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
    if (!locationStr) {
        console.log('No user location found - marking all stores as out of corridor');
        // If no location, mark all as out of corridor
        orders.forEach(order => {
            order.isStoreInCorridor = false;
        });
        return;
    }

    try {
        const location = JSON.parse(locationStr);
        console.log('📍 Parsed location object:', location);
        console.log('📍 location.lat:', location.lat, 'location.lng:', location.lng);
        console.log('📍 location.latitude:', location.latitude, 'location.longitude:', location.longitude);
        
        // Try to get lat/lng from different possible field names
        const lat = location.lat || location.latitude;
        const lng = location.lng || location.longitude;
        
        console.log('📍 Using lat:', lat, 'lng:', lng);
        
        if (!lat || !lng) {
            console.error('❌ No valid coordinates found in location object');
            orders.forEach(order => {
                order.isStoreInCorridor = false;
            });
            return;
        }
        
        // Get stores within flight corridor
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STORES_WITHIN_FLIGHT_CORRIDOR}?latitude=${lat}&longitude=${lng}&radiusKm=10`,
            {
                headers: {
                    'Authorization': `Bearer ${auth.token}`
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            const storesInCorridor = data.result || [];
            
            // Create Set with both string and number versions of IDs for comparison
            const storeIds = new Set();
            storesInCorridor.forEach(s => {
                storeIds.add(s.id);
                storeIds.add(String(s.id));
                storeIds.add(Number(s.id));
            });
            
            console.log('Stores in flight corridor (raw):', storesInCorridor.map(s => ({ id: s.id, name: s.name })));
            console.log('Store IDs Set:', Array.from(storeIds));
            console.log('Checking orders:', orders.map(o => ({ 
                id: o.id, 
                storeId: o.storeId, 
                storeIdType: typeof o.storeId,
                storeName: o.storeName 
            })));
            
            // Mark ALL orders - explicitly set true or false
            orders.forEach(order => {
                // Check with multiple type conversions
                const inCorridor = storeIds.has(order.storeId) || 
                                  storeIds.has(String(order.storeId)) || 
                                  storeIds.has(Number(order.storeId));
                order.isStoreInCorridor = inCorridor;
                console.log(`Order ${order.orderCode}: Store ${order.storeId} (${order.storeName}) - In corridor: ${inCorridor}`);
            });
        } else {
            console.error('Failed to check flight corridor, marking all as out of corridor');
            console.error('Response status:', response.status, 'Response text:', await response.text());
            orders.forEach(order => {
                order.isStoreInCorridor = false;
            });
        }
    } catch (error) {
        console.error('Error checking flight corridor:', error);
        // On error, mark all as out of corridor for safety
        orders.forEach(order => {
            order.isStoreInCorridor = false;
        });
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

    // DEBUG: Log delivery time data for each order
    orders.forEach(order => {
        console.log(`Order ${order.orderCode}:`, {
            status: order.status,
            estimatedArrivalTime: order.estimatedArrivalTime,
            estimatedDepartureTime: order.estimatedDepartureTime,
            estimatedFlightTimeMinutes: order.estimatedFlightTimeMinutes,
            distanceKm: order.distanceKm
        });
    });

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
        
        // NEW: Check if store is within flight corridor
        const isStoreInCorridor = order.isStoreInCorridor === true; // Must be explicitly true
        
        console.log(`Order ${order.orderCode}: isStoreInCorridor = ${order.isStoreInCorridor}, canPay check...`);
        
        // FIX: Allow payment for orders that were already created (PENDING_PAYMENT status)
        // Only check corridor for initial order creation, not for retry payment
        // Rationale: If order was created, it was within corridor at creation time
        const canPay = (isPendingPayment || isFailedPayment) && !isOrderFinalized && !isAlreadyPaid;
        // Old logic that blocked payment: const canPay = ... && isStoreInCorridor;
        
        // Check if order can be cancelled/deleted
        // UPDATED: Không cho hủy khi:
        // - Đang giao (IN_DELIVERY) hoặc đã giao (DELIVERED)
        // - Đã được chấp nhận (ACCEPT)
        // - Đang chuẩn bị (PREPARING)
        // Chỉ cho phép hủy: CREATED, PENDING, PENDING_PAYMENT, READY, CANCELLED, FAILED
        const canCancel = order.status !== 'IN_DELIVERY' && 
                         order.status !== 'DELIVERED' &&
                         order.status !== 'ACCEPT' &&
                         order.status !== 'PREPARING';
        
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
                
                <!-- 🚁 ARRIVING Alert - Drone sắp đến! -->
                ${order.deliveryStatus === 'ARRIVING' ? `
                <div style="
                    background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
                    animation: pulse-alert 1.5s ease-in-out infinite alternate;
                ">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-drone" style="animation: bounce 1s infinite;"></i>
                    </div>
                    <h3 style="margin: 0.5rem 0; font-weight: bold; font-size: 1.3rem;">
                        🚁 DRONE SẮP ĐẾN!
                    </h3>
                    <p style="margin: 0.5rem 0; font-size: 1rem; opacity: 0.95;">
                        Vui lòng chuẩn bị nhận hàng
                    </p>
                    <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
                        Dự kiến: ${order.estimatedArrivalTime ? formatTime(order.estimatedArrivalTime) : 'Vài phút nữa'}
                    </p>
                </div>
                <style>
                    @keyframes pulse-alert {
                        0% { transform: scale(1); box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4); }
                        100% { transform: scale(1.02); box-shadow: 0 6px 20px rgba(255, 152, 0, 0.6); }
                    }
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                </style>
                ` : ''}
                
                <!-- ✅ DELIVERED Alert - Drone đã đến! -->
                ${(order.status === 'IN_DELIVERY' && order.deliveryStatus === 'COMPLETED') || order.status === 'DELIVERED' ? `
                <div style="
                    background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
                    color: white;
                    padding: 1rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    text-align: center;
                    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
                    animation: pulse-success 1.5s ease-in-out 3;
                ">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">
                        <i class="fas fa-check-circle" style="animation: scale-check 0.6s ease-out;"></i>
                    </div>
                    <h3 style="margin: 0.5rem 0; font-weight: bold; font-size: 1.3rem;">
                        ✅ DRONE ĐÃ ĐẾN!
                    </h3>
                    <p style="margin: 0.5rem 0; font-size: 1rem; opacity: 0.95;">
                        Hàng của bạn đã được giao thành công
                    </p>
                    <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">
                        Thời gian: ${order.actualArrivalTime ? formatTime(order.actualArrivalTime) : 'Vừa xong'}
                    </p>
                </div>
                <style>
                    @keyframes pulse-success {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    @keyframes scale-check {
                        0% { transform: scale(0); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); }
                    }
                </style>
                ` : ''}
                
                <!-- Delivery Time Estimate -->
                ${(order.status === 'PAID' || order.status === 'ACCEPT' || order.status === 'IN_DELIVERY' || order.status === 'DELIVERED') && order.estimatedArrivalTime ? renderDeliveryTimeEstimate(order) : ''}
                
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
                        ${['ACCEPT', 'CONFIRMED', 'IN_DELIVERY', 'PAID'].includes(order.status) ? `
                            <button class="btn btn-primary btn-sm" onclick="trackDelivery(${order.id})">
                                <i class="fas fa-drone"></i> Theo dõi
                            </button>
                        ` : ''}
                        ${order.status === 'IN_DELIVERY' ? `
                            <button class="btn btn-success btn-sm" onclick="confirmReceived(${order.id})">
                                <i class="fas fa-check-circle"></i> Đã nhận hàng
                            </button>
                        ` : ''}
                        ${canCancel ? `
                            <button class="btn btn-danger btn-sm" onclick="cancelOrder(${order.id})">
                                <i class="fas fa-times-circle"></i> Hủy đơn
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

// Cancel/delete an order
async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
        return;
    }

    try {
        Loading.show();
        
        // ✅ Gọi đúng API POST cancel thay vì DELETE (với context path /home)
        const token = localStorage.getItem('foodfast_token');
        const response = await fetch(`/home/api/v1/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể hủy đơn hàng');
        }
        
        Toast.success('Đơn hàng đã được hủy thành công');
        
        // Reload orders list
        setTimeout(() => {
            loadOrders();
        }, 1000);
        
    } catch (error) {
        console.error('Error cancelling order:', error);
        Toast.error('Không thể hủy đơn hàng: ' + error.message);
    } finally {
        Loading.hide();
    }
}

// Confirm received order (customer confirms delivery)
async function confirmReceived(orderId) {
    if (!confirm('Xác nhận bạn đã nhận được hàng?')) {
        return;
    }

    try {
        Loading.show();
        
        const response = await APIHelper.post(`/api/v1/orders/${orderId}/mark-delivered`);
        
        Toast.success('✅ Đã xác nhận nhận hàng thành công!');
        
        // Reload orders list
        setTimeout(() => {
            loadOrders();
        }, 1000);
        
    } catch (error) {
        console.error('Error confirming delivery:', error);
        Toast.error('Không thể xác nhận: ' + error.message);
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
        
        // Check if this order's store is in flight corridor
        await checkStoresInFlightCorridor([order]);
        
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
async function displayOrderDetail(order) {
    const content = document.getElementById('orderDetailContent');
    
    // Load user location from localStorage
    let deliveryAddress = order.deliveryAddressSnapshot || 'N/A';
    
    // Get user location that was set at homepage
    if (!order.deliveryAddressSnapshot || order.deliveryAddressSnapshot === 'N/A') {
        const locationStr = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
        if (locationStr) {
            try {
                const location = JSON.parse(locationStr);
                deliveryAddress = `📍 ${location.address || 'Địa chỉ đã chọn'}\n`;
                deliveryAddress += `🗺️ Tọa độ: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            } catch (error) {
                console.log('Could not parse user location:', error);
            }
        }
    }
    
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
    
    // Check if store is within flight corridor
    const isStoreInCorridor = order.isStoreInCorridor === true; // Must be explicitly true
    
    console.log(`Order detail ${order.orderCode}: isStoreInCorridor = ${order.isStoreInCorridor}`);
    
    // FIX: Allow payment retry for orders that were already created
    // Only check corridor for initial order creation, not for retry payment
    const canRetryPayment = (isPendingPayment || isFailedPayment) && !isOrderFinalized && !isAlreadyPaid;
    // Old logic that blocked payment: const canRetryPayment = ... && isStoreInCorridor;
    
    // Check if order can be cancelled
    // UPDATED: Không cho hủy khi:
    // - Đang giao (IN_DELIVERY) hoặc đã giao (DELIVERED)
    // - Đã được chấp nhận (ACCEPT)
    // - Đang chuẩn bị (PREPARING)
    // Chỉ cho phép hủy: CREATED, PENDING, PENDING_PAYMENT, READY, CANCELLED, FAILED
    const canCancel = order.status !== 'IN_DELIVERY' && 
                     order.status !== 'DELIVERED' &&
                     order.status !== 'ACCEPT' &&
                     order.status !== 'PREPARING';
    
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
                    <p style="margin: 0; white-space: pre-line;">${deliveryAddress}</p>
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
                        ${canCancel ? `
                        <button class="btn btn-danger btn-block" style="margin-top: 0.5rem;" onclick="cancelOrderFromDetail(${order.id})">
                            <i class="fas fa-times-circle"></i> Hủy đơn hàng
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

// Cancel order from detail modal
async function cancelOrderFromDetail(orderId) {
    // Close modal first
    closeOrderModal();
    
    // Call the main cancel function
    await cancelOrder(orderId);
}

// Track delivery
async function trackDelivery(orderId) {
    try {
        Loading.show();
        
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.DELIVERY_BY_ORDER(orderId));
        const delivery = response.result;
        
        if (!delivery) {
            Toast.warning('Chưa có thông tin giao hàng');
            Loading.hide();
            return;
        }
        
        // Redirect to dedicated tracking page with map visualization
        window.location.href = `/home/delivery-tracking.html?deliveryId=${delivery.id}`;
        
    } catch (error) {
        console.error('Error loading delivery:', error);
        Toast.error('Không thể tải thông tin giao hàng');
        Loading.hide();
    }
}

// Display delivery tracking
async function displayDeliveryTracking(delivery) {
    const content = document.getElementById('trackingContent');
    
    // Load user location from localStorage for dropoff address
    let dropoffAddress = delivery.dropoffAddressSnapshot || 'N/A';
    
    if (!delivery.dropoffAddressSnapshot || delivery.dropoffAddressSnapshot === 'N/A') {
        const locationStr = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
        if (locationStr) {
            try {
                const location = JSON.parse(locationStr);
                dropoffAddress = `📍 ${location.address || 'Địa chỉ đã chọn'}\n`;
                dropoffAddress += `🗺️ Tọa độ: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            } catch (error) {
                console.log('Could not parse user location:', error);
            }
        }
    }
    
    const statusInfo = getDeliveryStatusInfo(delivery.currentStatus);
    
    content.innerHTML = `
        <!-- ARRIVING Alert -->
        ${delivery.currentStatus === 'ARRIVING' ? `
        <div style="background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); 
                    color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem;
                    text-align: center; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
                    animation: arrivinAlert 1s ease-in-out infinite alternate;">
            <i class="fas fa-helicopter" style="font-size: 3rem; margin-bottom: 0.5rem; animation: bounce 1s infinite;"></i>
            <h2 style="margin: 0.5rem 0; font-weight: bold;">🚁 DRONE SẮP ĐẾN!</h2>
            <p style="font-size: 1.1rem; margin: 0;">Vui lòng chuẩn bị nhận hàng</p>
            <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0; opacity: 0.9;">
                Dự kiến: ${delivery.estimatedArrivalTime ? FormatHelper.date(delivery.estimatedArrivalTime) : 'Vài phút nữa'}
            </p>
        </div>
        <style>
            @keyframes arrivinAlert {
                0% { transform: scale(1); }
                100% { transform: scale(1.02); }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        </style>
        ` : ''}
        
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
                <h4><i class="fas fa-list"></i> Trạng thái giao hàng</h4>
                <div style="position: relative; padding-left: 2rem;">
                    
                    <!-- Step 1: ASSIGNED -->
                    ${delivery.currentStatus !== 'QUEUED' ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--success-color); border-radius: 50%; top: 5px;"></div>
                        <div style="position: absolute; left: -1.44rem; width: 2px; height: 100%; background: var(--light); top: 17px;"></div>
                        <strong>✅ Đã phân công drone</strong>
                        <p style="margin: 0.25rem 0; color: var(--gray); font-size: 0.9rem;">
                            ${delivery.droneCode ? 'Drone: ' + delivery.droneCode : 'Đang chuẩn bị'}
                        </p>
                    </div>
                    ` : `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--warning-color); border-radius: 50%; top: 5px;"></div>
                        <strong>⏳ Đang chờ phân công drone...</strong>
                    </div>
                    `}
                    
                    <!-- Step 2: LAUNCHED -->
                    ${delivery.actualDepartureTime ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--success-color); border-radius: 50%; top: 5px;"></div>
                        <div style="position: absolute; left: -1.44rem; width: 2px; height: 100%; background: var(--light); top: 17px;"></div>
                        <strong>🚀 Drone đã khởi hành</strong>
                        <p style="margin: 0.25rem 0; color: var(--gray); font-size: 0.9rem;">
                            ${FormatHelper.date(delivery.actualDepartureTime)}
                        </p>
                    </div>
                    ` : (delivery.currentStatus === 'ASSIGNED' ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--light); border: 2px solid var(--gray); border-radius: 50%; top: 5px;"></div>
                        <strong style="color: var(--gray);">🚀 Chờ khởi hành...</strong>
                    </div>
                    ` : '')}
                    
                    <!-- Step 3: ARRIVING -->
                    ${delivery.currentStatus === 'ARRIVING' ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--warning-color); border-radius: 50%; top: 5px; animation: pulse 1.5s infinite;"></div>
                        <div style="position: absolute; left: -1.44rem; width: 2px; height: 100%; background: var(--light); top: 17px;"></div>
                        <strong style="color: var(--warning-color);">🚁 Drone sắp đến! Chuẩn bị nhận hàng</strong>
                        <p style="margin: 0.25rem 0; color: var(--warning-color); font-size: 0.9rem; font-weight: bold;">
                            Dự kiến: ${delivery.estimatedArrivalTime ? FormatHelper.date(delivery.estimatedArrivalTime) : 'Vài phút nữa'}
                        </p>
                    </div>
                    ` : (delivery.currentStatus === 'LAUNCHED' ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--light); border: 2px solid var(--gray); border-radius: 50%; top: 5px;"></div>
                        <strong style="color: var(--gray);">🚁 Đang trên đường...</strong>
                    </div>
                    ` : '')}
                    
                    <!-- Step 4: COMPLETED -->
                    ${delivery.actualArrivalTime ? `
                    <div style="margin: 1rem 0; position: relative;">
                        <div style="position: absolute; left: -2rem; width: 12px; height: 12px; background: var(--success-color); border-radius: 50%; top: 5px;"></div>
                        <strong style="color: var(--success-color);">✅ Đã giao hàng thành công!</strong>
                        <p style="margin: 0.25rem 0; color: var(--gray); font-size: 0.9rem;">
                            ${FormatHelper.date(delivery.actualArrivalTime)}
                        </p>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Add pulse animation for ARRIVING status -->
                <style>
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                    }
                </style>
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
                    <p style="margin: 0.5rem 0; font-size: 0.9rem; white-space: pre-line;">${dropoffAddress}</p>
                </div>
            </div>
        </div>
        
        <!-- Customer Actions -->
        ${delivery.currentStatus === 'ARRIVING' ? `
        <div style="margin-top: 1.5rem; text-align: center;">
            <button onclick="confirmDeliveryReceived(${delivery.id})" 
                    style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                           color: white; border: none; padding: 1rem 2rem; 
                           border-radius: 12px; font-size: 1.1rem; font-weight: bold;
                           cursor: pointer; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                           transition: all 0.3s ease;">
                <i class="fas fa-check-circle"></i> Xác nhận đã nhận hàng
            </button>
            <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--gray);">
                ⚠️ Chỉ nhấn khi bạn đã nhận được hàng từ drone
            </p>
        </div>
        ` : ''}
    `;
}

// Get delivery status info
function getDeliveryStatusInfo(status) {
    const statusMap = {
        // Backend delivery statuses
        'QUEUED': { text: 'Chờ xử lý', icon: 'clock', color: 'warning' },
        'ASSIGNED': { text: 'Đã phân công drone', icon: 'check-circle', color: 'info' },
        'LAUNCHED': { text: 'Drone đã khởi hành', icon: 'rocket', color: 'primary' },
        'ARRIVING': { text: '🚁 Drone sắp đến!', icon: 'shipping-fast', color: 'warning' },
        'COMPLETED': { text: 'Đã giao thành công', icon: 'check-double', color: 'success' },
        'FAILED': { text: 'Giao hàng thất bại', icon: 'times-circle', color: 'danger' },
        
        // Legacy statuses (backward compatibility)
        'PENDING': { text: 'Chờ lấy hàng', icon: 'clock', color: 'warning' },
        'PICKED_UP': { text: 'Đang giao hàng', icon: 'drone', color: 'primary' },
        'IN_TRANSIT': { text: 'Đang trên đường', icon: 'shipping-fast', color: 'primary' },
        'DELIVERED': { text: 'Đã giao thành công', icon: 'check-double', color: 'success' }
    };
    return statusMap[status] || { text: 'Đang xử lý', icon: 'spinner', color: 'info' };
}

// Customer confirms delivery received
async function confirmDeliveryReceived(deliveryId) {
    if (!confirm('⚠️ Xác nhận bạn đã nhận được hàng từ drone?\n\nLưu ý: Hành động này không thể hoàn tác!')) {
        return;
    }

    try {
        Loading.show();
        
        const response = await APIHelper.post(`/api/v1/deliveries/${deliveryId}/confirm-received`);
        
        if (response.code === 200) {
            Toast.success('✅ Cảm ơn bạn! Đơn hàng đã được xác nhận giao thành công');
            
            // Close modal and reload
            closeTrackingModal();
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            Toast.error(response.message || 'Không thể xác nhận đơn hàng');
        }
    } catch (error) {
        console.error('Error confirming delivery:', error);
        Toast.error('Có lỗi xảy ra khi xác nhận đơn hàng');
    } finally {
        Loading.hide();
    }
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

// ===== DELIVERY TIME ESTIMATION =====

/**
 * Format time to HH:mm Vietnamese format
 */
function formatTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format distance
 */
function formatDistance(distanceKm) {
    if (!distanceKm) return '';
    
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
}

/**
 * Calculate remaining time until arrival
 * ✅ CHỈ TÍNH CHO ĐƠN ĐANG GIAO - LOAD TỪ DATABASE CHO ĐƠN ĐÃ GIAO
 */
function calculateRemainingTime(estimatedArrivalTime, orderStatus, actualArrivalTime) {
    if (!estimatedArrivalTime) return null;
    
    // ✅ KHÔNG TÍNH REAL-TIME CHO ĐƠN ĐÃ GIAO - SỬ DỤNG actualArrivalTime TỪ DATABASE
    if (orderStatus === 'DELIVERED' || orderStatus === 'COMPLETED') {
        if (actualArrivalTime) {
            // Tính thời gian trễ DỰA TRÊN DATABASE (cố định)
            const estimated = new Date(estimatedArrivalTime);
            const actual = new Date(actualArrivalTime);
            const diffMs = actual - estimated;
            const diffMinutes = Math.floor(diffMs / 60000);
            
            if (diffMinutes > 0) {
                return {
                    minutes: diffMinutes,
                    isLate: true,
                    text: `Đã giao trễ ${diffMinutes} phút`,
                    isFixed: true // ✅ Đánh dấu là thời gian cố định từ DB
                };
            }
        }
        return null; // Không hiển thị nếu giao đúng giờ hoặc sớm
    }
    
    // ✅ CHỈ TÍNH REAL-TIME CHO ĐƠN ĐANG GIAO
    const now = new Date();
    const arrival = new Date(estimatedArrivalTime);
    const diffMs = arrival - now;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 0) {
        return {
            minutes: Math.abs(diffMinutes),
            isLate: true,
            text: `Trễ ${Math.abs(diffMinutes)} phút`
        };
    } else if (diffMinutes === 0) {
        return {
            minutes: 0,
            isLate: false,
            text: 'Sắp đến'
        };
    } else {
        return {
            minutes: diffMinutes,
            isLate: false,
            text: `Còn ${diffMinutes} phút`
        };
    }
}

/**
 * Render delivery time estimate HTML
 */
function renderDeliveryTimeEstimate(order) {
    if (!order.estimatedArrivalTime) {
        return `
            <div class="delivery-estimate pending">
                <div class="estimate-header">
                    <i class="fas fa-clock"></i>
                    <span>Đang xác nhận thời gian giao hàng...</span>
                </div>
            </div>
        `;
    }
    
    // Ưu tiên hiển thị actual time nếu đã có (sau khi accept), không thì dùng estimated
    const hasActualTime = order.actualArrivalTime && (order.status === 'ACCEPT' || order.status === 'IN_DELIVERY' || order.status === 'DELIVERED');
    const arrivalTime = formatTime(hasActualTime ? order.actualArrivalTime : order.estimatedArrivalTime);
    const departureTime = formatTime(hasActualTime ? order.actualDepartureTime : order.estimatedDepartureTime);
    const timeToUse = hasActualTime ? order.actualArrivalTime : order.estimatedArrivalTime;
    const distance = formatDistance(order.distanceKm);
    
    // ✅ Truyền thêm actualArrivalTime để tính thời gian cố định từ DB cho đơn đã giao
    const remaining = calculateRemainingTime(
        order.estimatedArrivalTime, 
        order.status, 
        order.actualArrivalTime
    );
    
    let statusClass = 'on-time';
    let statusIcon = 'fa-clock';
    let statusText = hasActualTime ? 'Thời gian giao hàng' : 'Dự kiến giao';
    
    if (order.status === 'DELIVERED') {
        statusClass = 'completed delivered'; // ✅ Thêm class để dừng update
        statusIcon = 'fa-check-circle';
        statusText = 'Đã giao lúc'; // ✅ Rõ ràng hơn
    } else if (remaining && remaining.isLate) {
        statusClass = 'delayed';
        statusIcon = 'fa-exclamation-circle';
        statusText = 'Chậm trễ';
    } else if (order.status === 'IN_DELIVERY') {
        statusIcon = 'fa-drone';
        statusText = 'Đang giao';
    } else if (order.status === 'ACCEPT') {
        statusIcon = 'fa-check-square';
        statusText = 'Đã xác nhận - Chuẩn bị giao';
    }
    
    return `
        <div class="delivery-estimate ${statusClass}" data-order-id="${order.id || order.orderId || ''}">
            <div class="estimate-header">
                <i class="fas ${statusIcon}"></i>
                <span>${statusText}</span>
            </div>
            
            <div class="time-info">
                <i class="fas fa-clock"></i>
                <strong>${arrivalTime}</strong>
                ${remaining ? `<span class="remaining">(${remaining.text})</span>` : ''}
            </div>
            
            <div class="flight-info">
                <span><i class="fas fa-plane-departure"></i> ${departureTime || 'Chưa khởi hành'}</span>
                <span><i class="fas fa-route"></i> ${order.estimatedFlightTimeMinutes || 0} phút</span>
                <span><i class="fas fa-map-marker-alt"></i> ${distance || 'N/A'}</span>
            </div>
            
            ${renderProgressBar(order)}
        </div>
    `;
}

/**
 * Render progress bar based on order status
 */
function renderProgressBar(order) {
    const statusSteps = {
        'CREATED': { step: 1, text: 'Đã đặt hàng', icon: 'fa-file-alt' },
        'PENDING_PAYMENT': { step: 1, text: 'Chờ thanh toán', icon: 'fa-clock' },
        'PAID': { step: 2, text: 'Đã thanh toán', icon: 'fa-check' },
        'ACCEPT': { step: 3, text: 'Cửa hàng xác nhận', icon: 'fa-store' },
        'IN_DELIVERY': { step: 4, text: 'Đang giao hàng', icon: 'fa-drone' },
        'DELIVERED': { step: 5, text: 'Đã giao hàng', icon: 'fa-check-circle' }
    };
    
    const current = statusSteps[order.status] || statusSteps['CREATED'];
    const progress = (current.step / 5) * 100;
    
    return `
        <div class="delivery-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">
                <i class="fas ${current.icon}"></i>
                <span>${current.text}</span>
            </div>
        </div>
    `;
}

/**
 * Fetch delivery status for orders in delivery
 * Note: This modifies the orders array in-place, adding deliveryStatus property
 */
async function fetchDeliveryStatusForOrders(orders) {
    const inDeliveryOrders = orders.filter(order => 
        order.status === 'IN_DELIVERY' || order.status === 'ACCEPT'
    );
    
    if (inDeliveryOrders.length === 0) return;
    
    // Fetch delivery status for each order (parallel for speed)
    await Promise.all(inDeliveryOrders.map(async (order) => {
        try {
            const response = await APIHelper.get(`/api/v1/deliveries/order/${order.id}`);
            if (response && response.result) {
                order.deliveryStatus = response.result.currentStatus;
                console.log(`✓ Order ${order.orderCode} - Delivery: ${order.deliveryStatus}`);
            }
        } catch (error) {
            // Silently ignore - order doesn't have delivery yet (expected for old orders)
            order.deliveryStatus = null;
        }
    }));
}

console.log('Orders.js loaded successfully');

