// Orders page JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    await loadOrders();
    await updateCartBadge();
});

// Load orders
async function loadOrders() {
    const ordersContainer = document.getElementById('ordersContainer');
    const emptyOrders = document.getElementById('emptyOrders');

    try {
        const userId = auth.getUser()?.id || 1;
        const response = await api.getUserOrders(userId);
        const orders = response.result || [];

        ordersContainer.innerHTML = '';

        if (orders.length === 0) {
            ordersContainer.style.display = 'none';
            emptyOrders.style.display = 'block';
            return;
        }

        ordersContainer.style.display = 'block';
        emptyOrders.style.display = 'none';

        orders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersContainer.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = '<p>Không thể tải đơn hàng</p>';
    }
}

// Create order card
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';

    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">Đơn hàng #${order.id}</div>
            <span class="order-status ${getStatusClass(order.status)}">
                ${getStatusText(order.status)}
            </span>
        </div>
        <div class="order-items">
            ${order.items?.map(item => `
                <div class="order-item">
                    <span>${item.productName} x ${item.quantity}</span>
                    <span>${formatPrice(item.totalPrice)}</span>
                </div>
            `).join('') || '<p>Không có sản phẩm</p>'}
        </div>
        <div class="order-footer">
            <div>
                <small>Đặt lúc: ${formatDate(order.createdAt)}</small>
            </div>
            <div class="order-total">
                Tổng: ${formatPrice(order.totalAmount)}
            </div>
        </div>
        <div style="margin-top: 1rem;">
            <button class="btn btn-outline" onclick="viewOrderDetail(${order.id})">
                Xem chi tiết
            </button>
            ${order.status === 'PENDING' ? `
                <button class="btn btn-primary" onclick="payOrder(${order.id})">
                    Thanh toán
                </button>
            ` : ''}
        </div>
    `;

    return card;
}

// View order detail
async function viewOrderDetail(orderId) {
    try {
        const response = await api.getOrderById(orderId);
        const order = response.result;

        const modal = document.getElementById('orderDetailModal');
        const content = document.getElementById('orderDetailContent');

        content.innerHTML = `
            <div class="order-detail">
                <div class="detail-section">
                    <h3>Thông tin đơn hàng</h3>
                    <p><strong>Mã đơn:</strong> #${order.id}</p>
                    <p><strong>Trạng thái:</strong> <span class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</span></p>
                    <p><strong>Ngày đặt:</strong> ${formatDate(order.createdAt)}</p>
                </div>
                
                <div class="detail-section">
                    <h3>Địa chỉ giao hàng</h3>
                    <p>${order.deliveryAddress || 'Không có thông tin'}</p>
                    <p>${order.deliveryDistrict}, ${order.deliveryCity}</p>
                    <p><strong>SĐT:</strong> ${order.deliveryPhone}</p>
                </div>

                <div class="detail-section">
                    <h3>Sản phẩm</h3>
                    ${order.items?.map(item => `
                        <div class="order-item">
                            <span>${item.productName} x ${item.quantity}</span>
                            <span>${formatPrice(item.totalPrice)}</span>
                        </div>
                    `).join('') || '<p>Không có sản phẩm</p>'}
                </div>

                <div class="detail-section">
                    <div class="summary-row">
                        <span>Tạm tính:</span>
                        <span>${formatPrice(order.totalAmount - 15000)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Phí giao hàng:</span>
                        <span>${formatPrice(15000)}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Tổng cộng:</span>
                        <span>${formatPrice(order.totalAmount)}</span>
                    </div>
                </div>

                ${order.notes ? `
                    <div class="detail-section">
                        <h3>Ghi chú</h3>
                        <p>${order.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading order detail:', error);
        showNotification('Không thể tải chi tiết đơn hàng', 'error');
    }
}

// Pay order
async function payOrder(orderId) {
    try {
        const paymentResponse = await api.initPayment(orderId, 'VNPAY', 'QR');
        const payment = paymentResponse.result;

        if (payment && payment.paymentUrl) {
            window.location.href = payment.paymentUrl;
        } else {
            throw new Error('Invalid payment URL');
        }
    } catch (error) {
        console.error('Error initiating payment:', error);
        showNotification('Không thể thanh toán: ' + error.message, 'error');
    }
}

// Get status class
function getStatusClass(status) {
    const statusMap = {
        'PENDING': 'pending',
        'CONFIRMED': 'confirmed',
        'PREPARING': 'confirmed',
        'DELIVERING': 'confirmed',
        'DELIVERED': 'delivered',
        'CANCELLED': 'cancelled'
    };
    return statusMap[status] || 'pending';
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'PENDING': 'Chờ xác nhận',
        'CONFIRMED': 'Đã xác nhận',
        'PREPARING': 'Đang chuẩn bị',
        'DELIVERING': 'Đang giao',
        'DELIVERED': 'Đã giao',
        'CANCELLED': 'Đã hủy'
    };
    return statusMap[status] || status;
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
}

// Update cart badge
async function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (!cartBadge) return;

    try {
        const response = await api.getCart();
        const cart = response.items || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    } catch (error) {
        cartBadge.textContent = '0';
    }
}

// Show notification
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

// Modal handlers
document.addEventListener('DOMContentLoaded', () => {
    const closeOrderModal = document.getElementById('closeOrderModal');
    const orderDetailModal = document.getElementById('orderDetailModal');

    if (closeOrderModal) {
        closeOrderModal.addEventListener('click', () => {
            orderDetailModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === orderDetailModal) {
            orderDetailModal.style.display = 'none';
        }
    });
});
        z-index: 10000;
        animation: slideInRight 0.3s;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
// Main page JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    // Load categories
    await loadCategories();
    
    // Load products
    await loadProducts();
    
    // Update cart badge
    await updateCartBadge();
    
    // Search functionality
    setupSearch();
});

// Load categories
async function loadCategories() {
    const categoryGrid = document.getElementById('categoryGrid');
    if (!categoryGrid) return;

    try {
        const response = await api.getCategories();
        const categories = response.result || [];

        if (categories.length === 0) {
            categoryGrid.innerHTML = '<p>Không có danh mục nào</p>';
            return;
        }

        categoryGrid.innerHTML = categories.map(category => `
            <div class="category-card" onclick="filterByCategory(${category.id})">
                <i class="fas fa-utensils"></i>
                <h3>${category.name}</h3>
                <p>${category.description || ''}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
        categoryGrid.innerHTML = '<p>Không thể tải danh mục</p>';
    }
}

// Load products
async function loadProducts() {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    try {
        const response = await api.getProducts();
        const products = response.result || [];

        if (products.length === 0) {
            productGrid.innerHTML = '<p>Không có sản phẩm nào</p>';
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card" onclick="viewProductStore(${product.id})">
                <div class="product-image">
                    ${product.mediaPrimaryUrl ? 
                        `<img src="${product.mediaPrimaryUrl}" alt="${product.name}">` : 
                        '<i class="fas fa-utensils"></i>'}
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description || 'Món ăn ngon'}</p>
                    <div class="product-price">${formatPrice(product.basePrice)}</div>
                    <div class="product-footer">
                        <span class="product-stock ${product.quantityAvailable > 0 ? '' : 'out-of-stock'}">
                            ${product.quantityAvailable > 0 ? 
                                `Còn ${product.quantityAvailable}` : 
                                'Hết hàng'}
                        </span>
                        <button class="btn btn-primary" onclick="quickAddToCart(event, ${product.id}, ${product.storeId})" 
                                ${product.quantityAvailable === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        productGrid.innerHTML = '<p>Không thể tải sản phẩm</p>';
    }
}

// View product store
async function viewProductStore(productId) {
    window.location.href = `stores.html?productId=${productId}`;
}

// Quick add to cart
async function quickAddToCart(event, productId, storeId) {
    event.stopPropagation();
    
    if (!auth.isAuthenticated()) {
        showLoginModal();
        return;
    }

    try {
        await api.addToCart(productId, 1, storeId);
        await updateCartBadge();
        showNotification('Đã thêm vào giỏ hàng!', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Không thể thêm vào giỏ hàng', 'error');
    }
}

// Update cart badge
async function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (!cartBadge || !auth.isAuthenticated()) return;

    try {
        const response = await api.getCart();
        const cart = response.items || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    } catch (error) {
        console.error('Error updating cart badge:', error);
        cartBadge.textContent = '0';
    }
}

// Filter by category
function filterByCategory(categoryId) {
    // Implement category filtering
    console.log('Filter by category:', categoryId);
}

// Setup search
function setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// Perform search
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value.trim();
    
    if (query) {
        console.log('Search for:', query);
        // Implement search functionality
    }
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00b894' : type === 'error' ? '#d63031' : '#0984e3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);

