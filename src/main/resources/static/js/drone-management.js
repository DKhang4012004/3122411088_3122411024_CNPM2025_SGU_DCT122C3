// Drone Management JavaScript

let dronesData = [];
let selectedDrone = null;
let currentOrder = null;
let currentDelivery = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Check if orderId in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    if (orderId) {
        loadOrderInfo(orderId);
    }

    loadDrones();
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

// Load order info
async function loadOrderInfo(orderId) {
    try {
        Loading.show();

        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.ORDER_BY_ID(orderId));
        currentOrder = response.result;

        console.log('Order loaded:', currentOrder);

        // Display order info
        displayOrderInfo();

        // Check if delivery exists
        await checkExistingDelivery(orderId);

    } catch (error) {
        console.error('Error loading order:', error);
        Toast.error('Không thể tải thông tin đơn hàng');
    } finally {
        Loading.hide();
    }
}

// Display order info
function displayOrderInfo() {
    const orderInfoSection = document.getElementById('orderInfoSection');
    const orderInfoDiv = document.getElementById('orderInfo');

    orderInfoSection.style.display = 'block';

    orderInfoDiv.innerHTML = `
        <div class="info-row">
            <span class="info-label">Mã đơn hàng:</span>
            <span class="info-value">#${currentOrder.orderCode || currentOrder.id}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Khách hàng:</span>
            <span class="info-value">${currentOrder.customerName || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Cửa hàng:</span>
            <span class="info-value">${currentOrder.storeName || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Trạng thái:</span>
            <span class="info-value">${getStatusText(currentOrder.status)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Tổng tiền:</span>
            <span class="info-value" style="color: var(--primary-color);">${FormatHelper.currency(currentOrder.totalPayable || currentOrder.totalAmount)}</span>
        </div>
    `;
}

// Check existing delivery
async function checkExistingDelivery(orderId) {
    try {
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.DELIVERY_BY_ORDER(orderId));
        currentDelivery = response.result;

        if (currentDelivery) {
            console.log('Existing delivery found:', currentDelivery);
            displayDeliveryStatus();
        } else {
            console.log('No delivery yet');
        }
    } catch (error) {
        console.log('No existing delivery:', error.message);
        // No delivery yet, that's ok
    }
}

// Load drones
async function loadDrones() {
    try {
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.DRONES);
        dronesData = response.result || response || [];

        console.log('Drones loaded:', dronesData);

        displayDrones();

    } catch (error) {
        console.error('Error loading drones:', error);
        Toast.error('Không thể tải danh sách drone');
    }
}

// Display drones
function displayDrones() {
    const container = document.getElementById('droneList');

    if (dronesData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-drone"></i>
                <p>Chưa có drone</p>
            </div>
        `;
        return;
    }

    container.innerHTML = dronesData.map(drone => `
        <div class="drone-item ${drone.status.toLowerCase()} ${selectedDrone?.droneCode === drone.droneCode ? 'selected' : ''}" 
             onclick="selectDrone('${drone.droneCode}')">
            <div class="drone-header-info">
                <span class="drone-code">
                    <i class="fas fa-drone"></i> ${drone.droneCode}
                </span>
                <span class="drone-status status-${drone.status.toLowerCase()}">
                    ${getStatusTextDrone(drone.status)}
                </span>
            </div>
            <div class="drone-specs">
                <div><i class="fas fa-weight-hanging"></i> ${drone.maxWeight}kg</div>
                <div><i class="fas fa-battery-full"></i> ${drone.batteryLevel}%</div>
                <div><i class="fas fa-map-marker-alt"></i> Lat: ${drone.currentLatitude?.toFixed(4) || 'N/A'}</div>
                <div><i class="fas fa-map-marker-alt"></i> Lng: ${drone.currentLongitude?.toFixed(4) || 'N/A'}</div>
            </div>
        </div>
    `).join('');
}

// Select drone
function selectDrone(droneCode) {
    selectedDrone = dronesData.find(d => d.droneCode === droneCode);

    if (!selectedDrone) return;

    console.log('Selected drone:', selectedDrone);

    // Update UI
    displayDrones(); // Re-render to show selection

    // Show delivery form if order is loaded and drone is available
    if (currentOrder && selectedDrone.status === 'AVAILABLE') {
        showDeliveryForm();
    } else if (selectedDrone.status !== 'AVAILABLE') {
        Toast.warning('Drone này không khả dụng');
    } else {
        Toast.warning('Vui lòng chọn đơn hàng trước');
    }
}

// Show delivery form
function showDeliveryForm() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('deliveryFormSection').style.display = 'block';
    document.getElementById('deliveryStatusSection').style.display = 'none';

    document.getElementById('selectedDroneCode').value = selectedDrone.droneCode;
}

// Create delivery
async function createDelivery(event) {
    event.preventDefault();

    if (!currentOrder || !selectedDrone) {
        Toast.error('Vui lòng chọn đơn hàng và drone');
        return;
    }

    const estimatedTime = document.getElementById('estimatedTime').value;
    const deliveryNote = document.getElementById('deliveryNote').value;

    try {
        Loading.show();

        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.DELIVERIES, {
            orderId: currentOrder.id,
            droneCode: selectedDrone.droneCode,
            estimatedDeliveryTime: parseInt(estimatedTime),
            note: deliveryNote
        });

        currentDelivery = response.result;

        Toast.success('Tạo giao hàng thành công!');
        console.log('Delivery created:', currentDelivery);

        // Show delivery status
        displayDeliveryStatus();

        // Reload drones to update status
        await loadDrones();

    } catch (error) {
        console.error('Error creating delivery:', error);
        Toast.error('Không thể tạo giao hàng: ' + error.message);
    } finally {
        Loading.hide();
    }
}

// Display delivery status
function displayDeliveryStatus() {
    document.getElementById('emptyState').style.display = 'none';
    document.getElementById('deliveryFormSection').style.display = 'none';
    document.getElementById('deliveryStatusSection').style.display = 'block';

    renderDeliveryTimeline();
}

// Render delivery timeline
function renderDeliveryTimeline() {
    const timeline = document.getElementById('deliveryTimeline');

    const steps = [
        { status: 'ASSIGNED', label: 'Đã gán drone', icon: 'check-circle' },
        { status: 'PICKING_UP', label: 'Đang đến lấy hàng', icon: 'route' },
        { status: 'PICKED_UP', label: 'Đã lấy hàng', icon: 'box' },
        { status: 'IN_TRANSIT', label: 'Đang giao hàng', icon: 'shipping-fast' },
        { status: 'DELIVERED', label: 'Đã giao thành công', icon: 'flag-checkered' }
    ];

    const currentIndex = steps.findIndex(s => s.status === currentDelivery.status);

    timeline.innerHTML = steps.map((step, index) => {
        let className = 'status-step';
        if (index < currentIndex) className += ' completed';
        if (index === currentIndex) className += ' active';

        return `
            <div class="${className}">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">
                    <i class="fas fa-${step.icon}"></i> ${step.label}
                </div>
                ${index === currentIndex ? `<div style="color: var(--primary-color); font-size: 0.9rem;">Hiện tại</div>` : ''}
            </div>
        `;
    }).join('');

    // Add delivery info
    timeline.innerHTML += `
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid var(--light);">
            <div class="info-row">
                <span class="info-label">Mã giao hàng:</span>
                <span class="info-value">#${currentDelivery.id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Drone:</span>
                <span class="info-value">${currentDelivery.droneCode}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Thời gian dự kiến:</span>
                <span class="info-value">${currentDelivery.estimatedDeliveryTime || 20} phút</span>
            </div>
            <div class="info-row">
                <span class="info-label">Trạng thái:</span>
                <span class="info-value">${getDeliveryStatusText(currentDelivery.status)}</span>
            </div>
        </div>
    `;
}

// Refresh delivery status
async function refreshDeliveryStatus() {
    if (!currentDelivery) return;

    try {
        Toast.info('Đang làm mới...');

        const response = await APIHelper.get(`${API_CONFIG.ENDPOINTS.DELIVERIES}/${currentDelivery.id}`);
        currentDelivery = response.result;

        console.log('Delivery refreshed:', currentDelivery);

        renderDeliveryTimeline();

    } catch (error) {
        console.error('Error refreshing delivery:', error);
        Toast.error('Không thể làm mới trạng thái');
    }
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xác nhận',
        'PAID': 'Đã thanh toán',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'READY': 'Sẵn sàng',
        'IN_DELIVERY': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
}

// Get drone status text
function getStatusTextDrone(status) {
    const statusMap = {
        'AVAILABLE': 'Sẵn sàng',
        'BUSY': 'Đang bận',
        'MAINTENANCE': 'Bảo trì',
        'CHARGING': 'Đang sạc',
        'OFFLINE': 'Ngoại tuyến'
    };
    return statusMap[status] || status;
}

// Get delivery status text
function getDeliveryStatusText(status) {
    const statusMap = {
        'ASSIGNED': 'Đã gán',
        'PICKING_UP': 'Đang đến lấy',
        'PICKED_UP': 'Đã lấy hàng',
        'IN_TRANSIT': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'FAILED': 'Thất bại',
        'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
}

// Logout
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        AuthHelper.logout();
    }
}

console.log('Drone Management loaded');

