// Store page JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');
    const storeId = urlParams.get('storeId');

    if (productId) {
        await loadStoreByProduct(productId);
    } else if (storeId) {
        await loadStoreById(storeId);
    } else {
        // No params, redirect to home
        window.location.href = 'index.html';
    }

    await updateCartBadge();
});

let currentStore = null;

// Load store by product ID
async function loadStoreByProduct(productId) {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/stores/by-product/${productId}`, {
            headers: {
                'Authorization': `Bearer ${auth.getAuthToken()}`
            }
        });
        
        const data = await response.json();
        currentStore = data;
        renderStoreInfo();
        renderProducts();
    } catch (error) {
        console.error('Error loading store:', error);
        showNotification('Không thể tải thông tin cửa hàng', 'error');
    }
}

// Load store by ID
async function loadStoreById(storeId) {
    try {
        const response = await api.getStoreWithProducts(storeId);
        currentStore = response;
        renderStoreInfo();
        renderProducts();
    } catch (error) {
        console.error('Error loading store:', error);
        showNotification('Không thể tải thông tin cửa hàng', 'error');
    }
}

// Render store info
function renderStoreInfo() {
    const storeHeader = document.getElementById('storeHeader');
    if (!storeHeader || !currentStore) return;

    storeHeader.innerHTML = `
        <h1>${currentStore.storeName || 'Cửa hàng'}</h1>
        <p>${currentStore.storeDescription || ''}</p>
        <div class="store-info">
            <span>
                <i class="fas fa-map-marker-alt"></i>
                ${currentStore.storeAddress || 'Địa chỉ không có'}
            </span>
            <span>
                <i class="fas fa-box"></i>
                ${currentStore.products?.length || 0} món
            </span>
            <span class="store-status ${currentStore.storeStatus === 'ACTIVE' ? 'active' : 'inactive'}">
                <i class="fas fa-circle"></i>
                ${currentStore.storeStatus === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'}
            </span>
        </div>
    `;
}

// Render products
function renderProducts() {
    const productsGrid = document.getElementById('storeProducts');
    if (!productsGrid || !currentStore?.products) return;

    if (currentStore.products.length === 0) {
        productsGrid.innerHTML = '<p>Cửa hàng chưa có món nào</p>';
        return;
    }

    productsGrid.innerHTML = currentStore.products.map(product => `
        <div class="product-card">
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
                    <button class="btn btn-primary" 
                            onclick="addToCart(${product.id}, ${currentStore.storeId})"
                            ${product.quantityAvailable === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Thêm
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add to cart
async function addToCart(productId, storeId) {
    if (!auth.isAuthenticated()) {
        showNotification('Vui lòng đăng nhập để thêm vào giỏ hàng', 'error');
        window.location.href = 'index.html';
        return;
    }

    try {
        await api.addToCart(productId, 1, storeId);
        await updateCartBadge();
        showNotification('Đã thêm vào giỏ hàng!', 'success');
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Không thể thêm vào giỏ hàng: ' + error.message, 'error');
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
        cartBadge.textContent = '0';
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

