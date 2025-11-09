// Store.js - Stores & Products Page Logic

let currentStore = null;
let currentProduct = null;
let modalQuantity = 1;
let allStoresCache = []; // Cache all stores for search

// Helper function to convert image URL to absolute path
function getFullImageUrl(imageUrl) {
    if (!imageUrl) {
        // Use SVG data URI for placeholder
        return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect width=%22400%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23ddd%22%3E🍽️%3C/text%3E%3C/svg%3E';
    }
    
    // If already absolute URL (starts with http/https), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // If relative path starting with /uploads, add context path
    if (imageUrl.startsWith('/uploads')) {
        return `${window.location.origin}/home${imageUrl}`;
    }
    
    // Default: return placeholder
    return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect width=%22400%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23ddd%22%3E🍽️%3C/text%3E%3C/svg%3E';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeStorePage();
    checkAuthStatus();
    updateCartBadge();

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const storeId = urlParams.get('id');
    const searchQuery = urlParams.get('search');

    if (storeId) {
        loadStoreDetails(storeId);
    } else if (searchQuery) {
        searchStores(searchQuery);
    } else {
        loadAllStores();
    }
});

// Initialize page
function initializeStorePage() {
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('dropdownMenu');
        const avatar = document.getElementById('userAvatar');
        if (dropdown && !avatar?.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// Show warning banner
function showWarningBanner(message) {
    // Check if banner already exists
    let banner = document.getElementById('warningBanner');
    
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'warningBanner';
        banner.style.cssText = `
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff9800;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 9999;
            max-width: 90%;
            text-align: center;
            font-weight: 500;
            animation: slideDown 0.3s ease-out;
        `;
        document.body.appendChild(banner);
        
        // Add animation style
        if (!document.getElementById('warningBannerStyle')) {
            const style = document.createElement('style');
            style.id = 'warningBannerStyle';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        top: -100px;
                        opacity: 0;
                    }
                    to {
                        top: 70px;
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    banner.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i> ${message}
        <button onclick="document.getElementById('warningBanner').remove()" 
                style="background: none; border: none; color: white; margin-left: 12px; cursor: pointer; font-size: 1.2rem;">
            <i class="fas fa-times"></i>
        </button>
    `;
}

// Check authentication status
function checkAuthStatus() {
    // DEPRECATED: Use auth.updateUI() from auth.js instead
    if (typeof auth !== 'undefined') {
        auth.updateUI();
    }
}

// Load all stores
async function loadAllStores() {
    try {
        Loading.show();

        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.STORES);
        const stores = response.result || [];
        
        // Cache stores for search
        allStoresCache = stores;

        displayStoresList(stores);

        // Show stores list view
        document.getElementById('storesListView').style.display = 'block';
        document.getElementById('storeView').style.display = 'none';

    } catch (error) {
        console.error('Error loading stores:', error);
        Toast.error('Không thể tải danh sách cửa hàng');
        displayStoresEmptyState('Không thể tải danh sách cửa hàng');
    } finally {
        Loading.hide();
    }
}

// Display stores list
function displayStoresList(stores) {
    const container = document.getElementById('storesGrid');

    if (!stores || stores.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-store-slash"></i>
                <h3>Không tìm thấy cửa hàng</h3>
                <p>Hãy thử lại sau nhé!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = stores.map(store => `
        <div class="card">
            <img src="https://via.placeholder.com/400x200?text=${encodeURIComponent(store.name)}" 
                 alt="${store.name}" 
                 class="card-img"
                 onerror="this.src='https://via.placeholder.com/400x200?text=Store'">
            <div class="card-body">
                <h3 class="card-title">${store.name}</h3>
                <p class="card-text">
                    <i class="fas fa-map-marker-alt text-primary"></i>
                    ${store.description || 'Cửa hàng đồ ăn ngon'}
                </p>
                <div class="d-flex align-center justify-between mt-2">
                    <span class="text-gray">
                        <i class="fas fa-star text-warning"></i> 4.5
                    </span>
                    <span class="text-gray">
                        <i class="fas fa-clock"></i> 15-30 phút
                    </span>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-sm" onclick="loadStoreDetails(${store.id})">
                    <i class="fas fa-eye"></i> Xem menu
                </button>
                <span class="text-success">
                    <i class="fas fa-check-circle"></i> Mở cửa
                </span>
            </div>
        </div>
    `).join('');
}

// Load store details and products
async function loadStoreDetails(storeId) {
    try {
        Loading.show();

        // Load store info
        const storeResponse = await APIHelper.get(API_CONFIG.ENDPOINTS.STORE_BY_ID(storeId));
        currentStore = storeResponse.result;

        // Check if user is logged in and has location
        if (AuthHelper.isLoggedIn()) {
            const userLocation = localStorage.getItem('foodfast_user_location');
            
            if (userLocation) {
                // Validate that store is within safe flight corridor
                try {
                    const location = JSON.parse(userLocation);
                    const response = await APIHelper.post(API_CONFIG.ENDPOINTS.STORES_WITHIN_FLIGHT_CORRIDOR, {
                        latitude: location.latitude,
                        longitude: location.longitude
                    });

                    const safeStores = response || [];
                    const isStoreSafe = safeStores.some(store => store.storeId === parseInt(storeId));

                    if (!isStoreSafe) {
                        // Show warning banner
                        showWarningBanner('⚠️ Cửa hàng này nằm ngoài hành lang bay an toàn của drone. Bạn không thể đặt hàng từ cửa hàng này.');
                    }
                } catch (error) {
                    console.error('Error checking flight corridor:', error);
                }
            } else {
                // Show info banner
                showWarningBanner('📍 Vui lòng chọn vị trí giao hàng trên trang chủ để kiểm tra khả năng giao hàng.');
            }
        }

        // Load products
        const productsResponse = await APIHelper.get(API_CONFIG.ENDPOINTS.PRODUCTS_BY_STORE(storeId));
        const allProducts = productsResponse.products || productsResponse.result?.products || [];
        
        // Filter only ACTIVE products for customers
        const products = allProducts.filter(p => p.status === 'ACTIVE');

        // Display store details
        displayStoreDetails(currentStore, products);

        // Show store view
        document.getElementById('storesListView').style.display = 'none';
        document.getElementById('storeView').style.display = 'block';

        // Update breadcrumb
        document.getElementById('breadcrumb').textContent = currentStore.name;

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('id', storeId);
        window.history.pushState({}, '', url);

    } catch (error) {
        console.error('Error loading store details:', error);
        Toast.error('Không thể tải thông tin cửa hàng');
    } finally {
        Loading.hide();
    }
}

// Display store details
function displayStoreDetails(store, products) {
    // Store info
    document.getElementById('storeName').textContent = store.name;
    document.getElementById('storeDescription').textContent = store.description || 'Cửa hàng đồ ăn ngon';
    document.getElementById('storeImage').src = `https://via.placeholder.com/150?text=${encodeURIComponent(store.name)}`;
    document.getElementById('storeImage').alt = store.name;

    // Products grid
    displayProducts(products);
}

// Display products
function displayProducts(products) {
    const container = document.getElementById('productsGrid');

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <h3>Chưa có món ăn</h3>
                <p>Cửa hàng chưa có sản phẩm</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const rawImageUrl = product.mediaPrimaryUrl || product.imageUrl || '';
        const imageUrl = getFullImageUrl(rawImageUrl);
        const price = product.basePrice || product.price || 0;
        const category = product.categoryName || '';
        
        return `
        <div class="card product-card">
            ${product.discount ? `<span class="product-badge">-${product.discount}%</span>` : ''}
            <img src="${imageUrl}" 
                 alt="${product.name}" 
                 class="card-img"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect width=%22400%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23ddd%22%3E�️%3C/text%3E%3C/svg%3E'">
            <div class="card-body">
                ${category ? `<span class="text-gray" style="font-size: 0.85rem; display: block; margin-bottom: 0.5rem;"><i class="fas fa-tag"></i> ${category}</span>` : ''}
                <h3 class="card-title">${product.name}</h3>
                <p class="card-text">${product.description || 'Món ăn ngon'}</p>
                <div class="d-flex align-center justify-between mt-2">
                    <span class="product-price">${FormatHelper.currency(price)}</span>
                    <button class="btn btn-primary btn-sm" onclick="showProductDetail(${product.id})">
                        <i class="fas fa-plus"></i> Thêm
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

// Show product detail modal
async function showProductDetail(productId) {
    try {
        // Find product from current store products
        const productsResponse = await APIHelper.get(API_CONFIG.ENDPOINTS.PRODUCTS_BY_STORE(currentStore.id));
        const allProducts = productsResponse.products || productsResponse.result?.products || [];
        
        // Filter only ACTIVE products
        const activeProducts = allProducts.filter(p => p.status === 'ACTIVE');
        currentProduct = activeProducts.find(p => p.id === productId);

        if (!currentProduct) {
            Toast.error('Sản phẩm không khả dụng');
            return;
        }

        // Reset quantity
        modalQuantity = 1;

        // Fill modal
        const rawImageUrl = currentProduct.mediaPrimaryUrl || currentProduct.imageUrl || '';
        const imageUrl = getFullImageUrl(rawImageUrl);
        const price = currentProduct.basePrice || currentProduct.price || 0;
        
        document.getElementById('productModalTitle').textContent = currentProduct.name;
        document.getElementById('productModalDescription').textContent = currentProduct.description || 'Món ăn ngon';
        document.getElementById('productModalPrice').textContent = FormatHelper.currency(price);
        document.getElementById('productModalImage').src = imageUrl;
        document.getElementById('modalQuantity').textContent = modalQuantity;

        // Show modal
        document.getElementById('productModal').classList.add('show');

    } catch (error) {
        console.error('Error loading product:', error);
        Toast.error('Không thể tải thông tin sản phẩm');
    }
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    currentProduct = null;
    modalQuantity = 1;
}

// Increase quantity
function increaseQuantity() {
    if (modalQuantity < 99) {
        modalQuantity++;
        document.getElementById('modalQuantity').textContent = modalQuantity;
    }
}

// Decrease quantity
function decreaseQuantity() {
    if (modalQuantity > 1) {
        modalQuantity--;
        document.getElementById('modalQuantity').textContent = modalQuantity;
    }
}

// Add to cart from modal
async function addToCartFromModal() {
    if (!currentProduct) {
        Toast.error('Vui lòng chọn sản phẩm');
        return;
    }

    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    // STEP 1: Kiểm tra trạng thái sản phẩm trước
    try {
        const productResponse = await APIHelper.get(`/products/${currentProduct.id}`);
        const product = productResponse.result;
        
        if (product.status === 'DISABLED') {
            Toast.error('Sản phẩm này đã bị vô hiệu hóa và không thể đặt hàng');
            closeProductModal();
            return;
        }
        
        if (product.status === 'OUT_OF_STOCK') {
            Toast.error('Sản phẩm này đã hết hàng');
            closeProductModal();
            return;
        }
        
        if (product.status !== 'ACTIVE') {
            Toast.error('Sản phẩm này hiện không khả dụng');
            closeProductModal();
            return;
        }
    } catch (error) {
        console.error('Error checking product status:', error);
        Toast.error('Không thể kiểm tra trạng thái sản phẩm');
        return;
    }

    // Check if user has set location
    const userLocation = localStorage.getItem('foodfast_user_location');
    if (!userLocation) {
        Toast.error('Vui lòng chọn vị trí giao hàng trên trang chủ trước khi đặt món');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Validate that current store is within safe flight corridor
    try {
        const location = JSON.parse(userLocation);
        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.STORES_WITHIN_FLIGHT_CORRIDOR, {
            latitude: location.latitude,
            longitude: location.longitude
        });

        const safeStores = response || [];
        const isStoreSafe = safeStores.some(store => store.storeId === currentStore.id);

        if (!isStoreSafe) {
            Toast.error('Cửa hàng này nằm ngoài hành lang bay an toàn của drone. Vui lòng chọn cửa hàng khác gần bạn hơn.');
            closeProductModal();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
    } catch (error) {
        console.error('Error checking flight corridor:', error);
        Toast.error('Không thể xác minh phạm vi giao hàng. Vui lòng thử lại.');
        return;
    }

    try {
        Loading.show();

        const data = {
            productId: currentProduct.id,
            quantity: modalQuantity
        };

        await APIHelper.post(API_CONFIG.ENDPOINTS.CART_ADD, data);

        Toast.success(`Đã thêm ${modalQuantity} ${currentProduct.name} vào giỏ hàng!`);
        closeProductModal();
        updateCartBadge();

    } catch (error) {
        console.error('Error adding to cart:', error);
        Toast.error(error.message || 'Không thể thêm vào giỏ hàng');
    } finally {
        Loading.hide();
    }
}

// Back to stores list
function backToStores() {
    window.location.href = 'stores.html';
}

// Search stores
function searchStores(query) {
    // For now, just load all stores and filter client-side
    // In production, this should be a server-side search
    loadAllStores();
    Toast.info(`Tìm kiếm: ${query}`);
}

// Perform store search
function performStoreSearch() {
    const searchInput = document.getElementById('storeSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (!query) {
        // If empty search, show all stores
        displayStoresList(allStoresCache);
        return;
    }

    // Filter stores by name or description
    const filteredStores = allStoresCache.filter(store => {
        const name = (store.name || '').toLowerCase();
        const description = (store.description || '').toLowerCase();
        return name.includes(query) || description.includes(query);
    });

    if (filteredStores.length > 0) {
        displayStoresList(filteredStores);
        Toast.success(`Tìm thấy ${filteredStores.length} cửa hàng`);
    } else {
        displayStoresEmptyState(`Không tìm thấy cửa hàng nào với từ khóa "${query}"`);
        Toast.info('Không tìm thấy kết quả');
    }
}

// Update cart badge
async function updateCartBadge() {
    if (!AuthHelper.isLoggedIn()) {
        document.getElementById('cartBadge').textContent = '0';
        return;
    }

    try {
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.CART_COUNT);
        const count = response || 0;
        document.getElementById('cartBadge').textContent = count;
    } catch (error) {
        console.error('Error updating cart badge:', error);
    }
}

// Toggle dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    dropdown.classList.toggle('show');
}

// Logout
function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        AuthHelper.logout();
    }
}

// Display empty state
function displayStoresEmptyState(message) {
    const container = document.getElementById('storesGrid');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <h3>${message}</h3>
        </div>
    `;
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

