// Admin Drone Control System
let selectedDroneId = null;
let currentFilter = 'ASSIGNED';
let drones = [];
let deliveries = [];

// Navigation functions
function goBack() {
    // Try to go back in history
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Fallback to admin dashboard
        window.location.href = '/home/admin.html';
    }
}

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        // Clear stored tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Show notification
        showNotification('Đã đăng xuất thành công!', 'success');
        
        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = '/home/login.html';
        }, 1000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Drone Control initialized');
    
    // Setup filter tabs
    setupFilterTabs();
    
    // Load initial data
    loadDrones();
    loadDeliveries();
    
    // Auto refresh every 15 seconds
    setInterval(() => {
        loadDrones();
        loadDeliveries();
    }, 15000);
});

// Setup filter tabs
function setupFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.status;
            renderDeliveries();
        });
    });
}

// Load drones from API
async function loadDrones() {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Only add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/drones/all`, {
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            drones = data.result || [];
            console.log('Drones loaded:', drones);
            renderDrones();
            updateDroneStats();
        } else {
            console.error('Failed to load drones:', response.status, response.statusText);
            drones = [];
            renderDrones();
        }
    } catch (error) {
        console.error('Error loading drones:', error);
        drones = [];
        renderDrones();
    }
}

// Load deliveries from API
async function loadDeliveries() {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Only add Authorization header if token exists
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/v1/deliveries/pending`, {
            headers: headers
        });

        if (response.ok) {
            const data = await response.json();
            deliveries = data.result || [];
            console.log('Deliveries loaded:', deliveries);
            renderDeliveries();
        } else {
            console.error('Failed to load deliveries:', response.status, response.statusText);
            deliveries = [];
            renderDeliveries();
        }
    } catch (error) {
        console.error('Error loading deliveries:', error);
        deliveries = [];
        renderDeliveries();
    }
}

// Render drones list
function renderDrones() {
    const dronesList = document.getElementById('dronesList');
    
    if (!dronesList) {
        console.error('dronesList element not found');
        return;
    }
    
    if (drones.length === 0) {
        dronesList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">Không có drone nào</p>';
        return;
    }

    dronesList.innerHTML = drones.map(drone => `
        <div class="drone-list-item ${selectedDroneId === drone.id ? 'active' : ''}" onclick="selectDrone(${drone.id})">
            <div class="drone-name">
                <i class="fas fa-helicopter"></i>
                <span>${drone.code} - ${drone.model || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <span class="drone-status-badge status-${drone.status.toLowerCase()}">${formatDroneStatus(drone.status)}</span>
                <span style="font-size: 0.85rem; color: #999;">
                    <i class="fas fa-battery-${getBatteryIcon(drone.currentBatteryPercent || 0)}"></i> ${drone.currentBatteryPercent || 0}%
                </span>
            </div>
            ${drone.currentDeliveryId ? `
                <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #667eea;">
                    <i class="fas fa-box"></i> Đơn #${drone.currentDeliveryId}
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Render deliveries grid
function renderDeliveries() {
    const deliveriesGrid = document.getElementById('deliveriesGrid');
    const emptyState = document.getElementById('emptyState');
    
    let filtered = deliveries;
    
    // Apply filter - use currentStatus from backend
    if (currentFilter !== 'ALL') {
        filtered = deliveries.filter(d => d.currentStatus === currentFilter);
    }
    
    if (filtered.length === 0) {
        deliveriesGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    deliveriesGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    deliveriesGrid.innerHTML = filtered.map(delivery => `
        <div class="delivery-card">
            <div class="delivery-card-header">
                <div class="order-info">
                    <h3><i class="fas fa-receipt"></i> Đơn hàng #${delivery.orderId}</h3>
                    <div class="order-meta">
                        <span><i class="fas fa-user"></i> ${delivery.customerName || 'Khách hàng'}</span>
                        <span><i class="fas fa-store"></i> ${delivery.pickupStoreName || 'Nhà hàng'}</span>
                    </div>
                </div>
                <span class="delivery-status-badge" style="background: ${getStatusColor(delivery.currentStatus)};">
                    ${formatDeliveryStatus(delivery.currentStatus)}
                </span>
            </div>

            <div class="delivery-body">
                <!-- Time Info -->
                <div class="info-section">
                    <h4><i class="fas fa-clock"></i> Thời Gian</h4>
                    <div class="info-row">
                        <span class="info-label">Khởi hành dự kiến:</span>
                        <span class="info-value">${formatTime(delivery.estimatedDepartureTime)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Đến nơi dự kiến:</span>
                        <span class="info-value">${formatTime(delivery.estimatedArrivalTime)}</span>
                    </div>
                    ${delivery.actualDepartureTime ? `
                        <div class="info-row">
                            <span class="info-label">Thực tế khởi hành:</span>
                            <span class="info-value">${formatTime(delivery.actualDepartureTime)}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Drone Info -->
                <div class="info-section">
                    <h4><i class="fas fa-helicopter"></i> Drone</h4>
                    ${delivery.droneId ? `
                        <div class="info-row">
                            <span class="info-label">Drone:</span>
                            <span class="info-value">${delivery.droneCode || getDroneName(delivery.droneId)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Khoảng cách:</span>
                            <span class="info-value">${delivery.distanceKm ? delivery.distanceKm.toFixed(1) : '0'} km</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Thời gian bay:</span>
                            <span class="info-value">${delivery.estimatedFlightTimeMinutes || '0'} phút</span>
                        </div>
                    ` : `
                        <p style="color: var(--gray); font-size: 0.9rem; margin: 0;">Chưa gán drone</p>
                    `}
                </div>
            </div>

            <!-- Delivery Address -->
            <div class="info-section" style="margin-top: 1rem;">
                <h4><i class="fas fa-map-marker-alt"></i> Địa Chỉ Giao Hàng</h4>
                ${(() => {
                    console.log('Delivery ID:', delivery.id, 'Address:', delivery.dropoffAddressSnapshot);
                    return formatDeliveryAddress(delivery.dropoffAddressSnapshot);
                })()}
            </div>

            <!-- Actions -->
            <div class="delivery-actions">
                ${renderDeliveryActions(delivery)}
            </div>
        </div>
    `).join('');
}

// Render delivery action buttons based on status
function renderDeliveryActions(delivery) {
    switch(delivery.currentStatus) {
        case 'ASSIGNED':
            return `
                <button class="action-btn btn-launch" onclick="launchDrone(${delivery.id})">
                    <i class="fas fa-rocket"></i> Khởi động drone
                </button>
                <button class="action-btn btn-view-map" onclick="viewMap(${delivery.id})">
                    <i class="fas fa-map"></i> Xem bản đồ
                </button>
            `;
        
        case 'LAUNCHED':
            return `
                <button class="action-btn btn-arriving" onclick="markArriving(${delivery.id})">
                    <i class="fas fa-map-pin"></i> Đánh dấu sắp đến
                </button>
                <button class="action-btn btn-view-map" onclick="viewMap(${delivery.id})">
                    <i class="fas fa-map"></i> Theo dõi
                </button>
            `;
        
        case 'ARRIVING':
            return `
                <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #856404; font-weight: bold;">
                        <i class="fas fa-info-circle"></i> Chờ khách hàng xác nhận đã nhận hàng
                    </p>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: #856404;">
                        Khách hàng sẽ tự xác nhận khi nhận được hàng
                    </p>
                </div>
                <button class="action-btn btn-view-map" onclick="viewMap(${delivery.id})" style="margin-top: 0.5rem;">
                    <i class="fas fa-map"></i> Xem vị trí
                </button>
            `;
        
        default:
            return `<button class="action-btn" disabled>Không có hành động</button>`;
    }
}

// Update drone statistics
function updateDroneStats() {
    document.getElementById('totalDrones').textContent = drones.length;
    document.getElementById('availableDrones').textContent = drones.filter(d => d.status === 'AVAILABLE').length;
    document.getElementById('inFlightDrones').textContent = drones.filter(d => d.status === 'IN_FLIGHT').length;
    document.getElementById('activeDeliveries').textContent = deliveries.filter(d => ['ASSIGNED', 'LAUNCHED', 'ARRIVING'].includes(d.status)).length;
}

// Launch drone
async function launchDrone(deliveryId) {
    if (!confirm('Bạn có chắc muốn khởi động drone cho giao hàng này?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/deliveries/${deliveryId}/launch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Drone đã khởi động!', 'success');
            loadDeliveries();
            loadDrones();
        } else {
            const error = await response.text();
            showNotification(`Không thể khởi động drone: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error launching drone:', error);
        showNotification('Lỗi khi khởi động drone', 'error');
    }
}

// Mark delivery as arriving
async function markArriving(deliveryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/deliveries/${deliveryId}/arriving`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showNotification('Đã đánh dấu sắp đến!', 'success');
            loadDeliveries();
        } else {
            const error = await response.text();
            showNotification(`Không thể cập nhật: ${error}`, 'error');
        }
    } catch (error) {
        console.error('Error marking arriving:', error);
        showNotification('Lỗi khi cập nhật trạng thái', 'error');
    }
}

// Note: completeDelivery() removed - customers now confirm delivery themselves via orders.js
// Admin can only mark as ARRIVING, then customer confirms when received

// Select drone
function selectDrone(droneId) {
    selectedDroneId = droneId;
    renderDrones();
    // Could filter deliveries by selected drone
}

// View map (placeholder)
function viewMap(deliveryId) {
    showNotification('Tính năng bản đồ đang được phát triển', 'info');
    // TODO: Implement map view
}

// Refresh drones
function refreshDrones() {
    loadDrones();
    loadDeliveries();
    showNotification('Đã làm mới dữ liệu', 'info');
}

// Helper functions
function formatDroneStatus(status) {
    const statusMap = {
        'AVAILABLE': 'Sẵn sàng',
        'IN_FLIGHT': 'Đang bay',
        'CHARGING': 'Đang sạc',
        'MAINTENANCE': 'Bảo trì'
    };
    return statusMap[status] || status;
}

function formatDeliveryStatus(status) {
    const statusMap = {
        'ASSIGNED': 'Sẵn sàng',
        'LAUNCHED': 'Đang bay',
        'ARRIVING': 'Sắp đến',
        'COMPLETED': 'Hoàn thành',
        'FAILED': 'Thất bại'
    };
    return statusMap[status] || status;
}

function getStatusColor(status) {
    const colors = {
        'ASSIGNED': '#ffc107',
        'LAUNCHED': '#2196F3',
        'ARRIVING': '#ff9800',
        'COMPLETED': '#4caf50',
        'FAILED': '#f44336'
    };
    return colors[status] || '#999';
}

function getBatteryIcon(level) {
    if (level > 75) return 'full';
    if (level > 50) return 'three-quarters';
    if (level > 25) return 'half';
    if (level > 10) return 'quarter';
    return 'empty';
}

function getDroneName(droneId) {
    const drone = drones.find(d => d.id === droneId);
    return drone ? `${drone.code} - ${drone.model || 'N/A'}` : `Drone #${droneId}`;
}

function formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
    });
}

// Format delivery address from JSON snapshot
function formatDeliveryAddress(addressSnapshot) {
    if (!addressSnapshot || addressSnapshot === 'N/A') {
        return '<p style="margin: 0; font-size: 0.9rem; color: #999;">Không có địa chỉ</p>';
    }
    
    try {
        // Try to parse as JSON
        const addressData = JSON.parse(addressSnapshot);
        
        let html = '';
        
        // If has readable address text
        if (addressData.address) {
            html += `<p style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">
                <i class="fas fa-map-marker-alt" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                ${addressData.address}
            </p>`;
        }
        
        // Show coordinates
        if (addressData.lat && addressData.lng) {
            html += `<p style="margin: 0; font-size: 0.85rem; color: #666;">
                <i class="fas fa-globe" style="margin-right: 0.5rem;"></i>
                ${addressData.lat.toFixed(6)}, ${addressData.lng.toFixed(6)}
            </p>`;
        } else if (addressData.latitude && addressData.longitude) {
            html += `<p style="margin: 0; font-size: 0.85rem; color: #666;">
                <i class="fas fa-globe" style="margin-right: 0.5rem;"></i>
                ${addressData.latitude.toFixed(6)}, ${addressData.longitude.toFixed(6)}
            </p>`;
        }
        
        return html || '<p style="margin: 0; font-size: 0.9rem; color: #999;">Chỉ có tọa độ</p>';
        
    } catch (error) {
        // If not JSON, display as is
        return `<p style="margin: 0; font-size: 0.9rem;">${addressSnapshot}</p>`;
    }
}

function showNotification(message, type = 'info') {
    // Simple notification (can be enhanced with a notification library)
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196F3'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
