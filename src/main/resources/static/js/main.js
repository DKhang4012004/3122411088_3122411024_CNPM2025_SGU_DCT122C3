// Main.js - Homepage Logic

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    loadFeaturedProducts(); // Changed from loadFeaturedStores
    updateCartBadge();
    
    // Use auth manager from auth.js
    if (typeof auth !== 'undefined') {
        auth.updateUI();
    } else {
        checkAuthStatus(); // Fallback to old method
    }
});

// Initialize page
function initializePage() {
    // Setup event listeners
    setupEventListeners();

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('dropdownMenu');
        const avatar = document.getElementById('userAvatar');
        if (dropdown && !avatar.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchStores();
            }
        });
    }
}

// Check authentication status (DEPRECATED - use auth.updateUI() instead)
function checkAuthStatus() {
    // This function is no longer used
    // auth.updateUI() from auth.js handles all authentication UI updates
    console.warn('checkAuthStatus() is deprecated. Use auth.updateUI() instead.');
}

// Load featured products
async function loadFeaturedProducts() {
    try {
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.PRODUCTS);
        const products = response.result || [];

        displayProducts(products.slice(0, 8)); // Show first 8 products
    } catch (error) {
        console.error('Error loading products:', error);
        displayEmptyState('Không thể tải danh sách món ăn');
    }
}

// Display products
function displayProducts(products) {
    const container = document.getElementById('featuredProducts');

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <h3>Chưa có món ăn</h3>
                <p>Hãy quay lại sau nhé!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const imageUrl = product.mediaPrimaryUrl || `https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}`;
        const price = FormatHelper.currency(product.basePrice || 0);
        const storeName = product.storeName || 'Cửa hàng';
        
        return `
            <div class="card product-card" onclick="viewProductStore(${product.storeId})">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="card-img"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Món+Ăn'">
                <div class="card-body">
                    <h3 class="card-title">${product.name}</h3>
                    <p class="card-text text-gray" style="font-size: 0.9rem;">
                        <i class="fas fa-store text-primary"></i>
                        ${storeName}
                    </p>
                    <div class="d-flex align-center justify-between mt-2">
                        <span class="text-primary" style="font-size: 1.2rem; font-weight: bold;">
                            ${price}
                        </span>
                        <span class="text-gray">
                            <i class="fas fa-star text-warning"></i> 4.5
                        </span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewProductStore(${product.storeId})">
                        <i class="fas fa-store"></i> Xem cửa hàng
                    </button>
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// View product's store (navigate to store detail page)
function viewProductStore(storeId) {
    if (!storeId) {
        Toast.error('Không tìm thấy thông tin cửa hàng');
        return;
    }
    window.location.href = `stores.html?id=${storeId}`;
}

// Add to cart from homepage
async function addToCart(productId) {
    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
        showLoginModal();
        return;
    }

    try {
        Loading.show();
        
        await APIHelper.post(API_CONFIG.ENDPOINTS.CART_ADD, {
            productId: productId,
            quantity: 1
        });

        Toast.success('Đã thêm vào giỏ hàng!');
        updateCartBadge();
    } catch (error) {
        console.error('Error adding to cart:', error);
        Toast.error(error.message || 'Không thể thêm vào giỏ hàng');
    } finally {
        Loading.hide();
    }
}

// Display empty state
function displayEmptyState(message) {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-circle"></i>
            <h3>${message}</h3>
        </div>
    `;
}

// View store details (kept for backward compatibility)
function viewStore(storeId) {
    window.location.href = `stores.html?id=${storeId}`;
}

// Search stores
function searchStores() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query) {
        window.location.href = `stores.html?search=${encodeURIComponent(query)}`;
    } else {
        window.location.href = 'stores.html';
    }
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        Loading.show();

        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.LOGIN, data);

        if (response.result && response.result.token) {
            // Save auth data
            AuthHelper.login(response.result.token, {
                username: data.username,
                ...response.result
            });

            Toast.success('Đăng nhập thành công!');
            closeModal('loginModal');
            checkAuthStatus();

            // Reload cart if needed
            updateCartBadge();
        } else {
            Toast.error('Đăng nhập thất bại!');
        }
    } catch (error) {
        console.error('Login error:', error);
        Toast.error(error.message || 'Đăng nhập thất bại!');
    } finally {
        Loading.hide();
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        fullName: formData.get('fullName'),
        phone: formData.get('phone')
    };

    try {
        Loading.show();

        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.REGISTER, data);

        if (response.code === 200) {
            Toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            closeModal('registerModal');
            showLoginModal();
        } else {
            Toast.error(response.message || 'Đăng ký thất bại!');
        }
    } catch (error) {
        console.error('Register error:', error);
        Toast.error(error.message || 'Đăng ký thất bại!');
    } finally {
        Loading.hide();
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

// Toggle dropdown menu
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

// Show modal
function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.add('show');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

