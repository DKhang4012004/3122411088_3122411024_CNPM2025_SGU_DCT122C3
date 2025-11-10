/**
 * Delivery Time Display Helper
 * Hiển thị thời gian dự kiến giao hàng trong UI
 */

/**
 * Format LocalDateTime to Vietnamese time string
 * @param {string} dateTimeStr - ISO datetime string
 * @returns {string} Formatted time (HH:mm)
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
 * Format distance to Vietnamese format
 * @param {number} distanceKm - Distance in kilometers
 * @returns {string} Formatted distance
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
 * @param {string} estimatedArrivalTime - ISO datetime string
 * @returns {object} { minutes, isLate, text }
 */
function calculateRemainingTime(estimatedArrivalTime) {
    if (!estimatedArrivalTime) return null;
    
    const now = new Date();
    const arrival = new Date(estimatedArrivalTime);
    const diffMs = arrival - now;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    return {
        minutes: Math.abs(diffMinutes),
        isLate: diffMinutes < 0,
        text: diffMinutes < 0 
            ? `Trễ ${Math.abs(diffMinutes)} phút` 
            : `Còn ${diffMinutes} phút`
    };
}

/**
 * Render delivery time estimate HTML
 * @param {object} order - Order object with delivery info
 * @returns {string} HTML string
 */
function renderDeliveryTimeEstimate(order) {
    if (!order.estimatedArrivalTime) {
        return `
            <div class="delivery-estimate pending">
                <i class="fas fa-clock"></i>
                <span>Đang xác nhận thời gian giao hàng...</span>
            </div>
        `;
    }
    
    const arrivalTime = formatTime(order.estimatedArrivalTime);
    const departureTime = formatTime(order.estimatedDepartureTime);
    const distance = formatDistance(order.distanceKm);
    const remaining = calculateRemainingTime(order.estimatedArrivalTime);
    
    let statusClass = 'on-time';
    let statusIcon = 'fa-clock';
    
    if (order.status === 'DELIVERED') {
        statusClass = 'completed';
        statusIcon = 'fa-check-circle';
    } else if (remaining && remaining.isLate) {
        statusClass = 'delayed';
        statusIcon = 'fa-exclamation-circle';
    }
    
    return `
        <div class="delivery-estimate ${statusClass}">
            <div class="estimate-header">
                <i class="fas ${statusIcon}"></i>
                <span class="estimate-title">
                    ${order.status === 'DELIVERED' ? 'Đã giao' : 'Dự kiến giao'}
                </span>
            </div>
            
            <div class="estimate-details">
                <div class="time-info">
                    <strong>${arrivalTime}</strong>
                    ${remaining ? `<span class="remaining">(${remaining.text})</span>` : ''}
                </div>
                
                <div class="flight-info">
                    <span><i class="fas fa-plane-departure"></i> ${departureTime}</span>
                    <span><i class="fas fa-route"></i> ${order.estimatedFlightTimeMinutes} phút</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${distance}</span>
                </div>
            </div>
            
            ${renderProgressBar(order)}
        </div>
    `;
}

/**
 * Render progress bar based on order status
 * @param {object} order - Order object
 * @returns {string} HTML string
 */
function renderProgressBar(order) {
    const statusSteps = {
        'CREATED': { step: 1, text: 'Đã đặt hàng' },
        'PENDING_PAYMENT': { step: 1, text: 'Chờ thanh toán' },
        'PAID': { step: 2, text: 'Đã thanh toán' },
        'ACCEPT': { step: 3, text: 'CH xác nhận' },
        'IN_DELIVERY': { step: 4, text: 'Đang giao' },
        'DELIVERED': { step: 5, text: 'Đã giao' }
    };
    
    const current = statusSteps[order.status] || statusSteps['CREATED'];
    const progress = (current.step / 5) * 100;
    
    return `
        <div class="delivery-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${current.text}</div>
        </div>
    `;
}

/**
 * Update delivery time display in real-time
 * Call this function every minute to update remaining time
 */
function updateDeliveryTimeDisplays() {
    document.querySelectorAll('.delivery-estimate').forEach(element => {
        const orderId = element.dataset.orderId;
        if (!orderId) return;
        
        // Skip update for completed/delivered orders
        if (element.classList.contains('completed') || element.classList.contains('delivered')) {
            return; // ✅ KHÔNG CẬP NHẬT cho đơn đã giao
        }
        
        // Fetch fresh order data
        fetchOrderDetails(orderId).then(order => {
            // Double check status - don't update if delivered
            if (order && (order.status === 'DELIVERED' || order.status === 'COMPLETED')) {
                return; // ✅ DỪNG cập nhật khi đã giao
            }
            
            const parent = element.parentElement;
            element.outerHTML = renderDeliveryTimeEstimate(order);
            
            // Re-attach event listeners if needed
            initDeliveryEstimateListeners();
        });
    });
}

/**
 * Initialize event listeners for delivery estimates
 */
function initDeliveryEstimateListeners() {
    document.querySelectorAll('.delivery-estimate').forEach(element => {
        element.addEventListener('click', function() {
            const orderId = this.dataset.orderId;
            if (orderId) {
                showDeliveryDetails(orderId);
            }
        });
    });
}

/**
 * Fetch order details from API
 * @param {number} orderId - Order ID
 * @returns {Promise<object>} Order object
 */
async function fetchOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/v1/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch order details');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching order:', error);
        return null;
    }
}

/**
 * Show detailed delivery tracking modal
 * @param {number} orderId - Order ID
 */
async function showDeliveryDetails(orderId) {
    const order = await fetchOrderDetails(orderId);
    if (!order) return;
    
    const delivery = order.delivery || {};
    
    const modalContent = `
        <div class="delivery-details-modal">
            <h3><i class="fas fa-drone"></i> Chi Tiết Giao Hàng</h3>
            
            <div class="detail-section">
                <h4>Thông tin đơn hàng</h4>
                <p>Mã đơn: <strong>${order.orderCode}</strong></p>
                <p>Cửa hàng: <strong>${order.storeName}</strong></p>
                <p>Trạng thái: <strong>${order.status}</strong></p>
            </div>
            
            <div class="detail-section">
                <h4>Thời gian dự kiến</h4>
                <div class="time-details">
                    <div class="time-item">
                        <i class="fas fa-clock"></i>
                        <span>Khởi hành:</span>
                        <strong>${formatTime(order.estimatedDepartureTime)}</strong>
                    </div>
                    <div class="time-item">
                        <i class="fas fa-plane-arrival"></i>
                        <span>Đến nơi:</span>
                        <strong>${formatTime(order.estimatedArrivalTime)}</strong>
                    </div>
                    <div class="time-item">
                        <i class="fas fa-hourglass-half"></i>
                        <span>Thời gian bay:</span>
                        <strong>${order.estimatedFlightTimeMinutes} phút</strong>
                    </div>
                    <div class="time-item">
                        <i class="fas fa-route"></i>
                        <span>Khoảng cách:</span>
                        <strong>${formatDistance(order.distanceKm)}</strong>
                    </div>
                </div>
            </div>
            
            ${delivery.droneCode ? `
                <div class="detail-section">
                    <h4>Thông tin drone</h4>
                    <p>Mã drone: <strong>${delivery.droneCode}</strong></p>
                    <p>Trạng thái: <strong>${delivery.currentStatus}</strong></p>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h4>Lộ trình giao hàng</h4>
                ${renderProgressBar(order)}
            </div>
        </div>
    `;
    
    // Show modal (implement your modal system)
    showModal(modalContent);
}

/**
 * CSS styles for delivery time display
 * Add this to your stylesheet
 */
const deliveryTimeStyles = `
<style>
.delivery-estimate {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem;
    border-radius: 10px;
    margin: 1rem 0;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.delivery-estimate.completed {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.delivery-estimate.delayed {
    background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
}

.estimate-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.estimate-header i {
    font-size: 1.5rem;
}

.estimate-title {
    font-size: 0.9rem;
    opacity: 0.9;
}

.time-info {
    font-size: 2rem;
    font-weight: bold;
    margin: 0.5rem 0;
}

.time-info .remaining {
    font-size: 1rem;
    font-weight: normal;
    opacity: 0.8;
    margin-left: 0.5rem;
}

.flight-info {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
    opacity: 0.9;
    flex-wrap: wrap;
}

.flight-info span {
    display: flex;
    align-items: center;
    gap: 0.3rem;
}

.delivery-progress {
    margin-top: 1rem;
}

.progress-bar {
    height: 6px;
    background: rgba(255,255,255,0.3);
    border-radius: 3px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: white;
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 0.8rem;
    margin-top: 0.3rem;
    opacity: 0.9;
}
</style>
`;

// Auto-refresh every minute
setInterval(updateDeliveryTimeDisplays, 60000);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initDeliveryEstimateListeners();
});
