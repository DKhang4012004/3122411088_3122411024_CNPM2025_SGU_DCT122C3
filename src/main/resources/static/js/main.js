// Main.js - Homepage Logic with Location-based Filtering

// Pagination state
let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let allProductsCache = [];
let allStoresCache = [];
let originalProductsCache = []; // Store original products before search
let isSearchMode = false; // Track if we're in search mode
let currentModalProduct = null; // Current product in modal
let modalQuantity = 1; // Quantity in modal

// === LOCATION STORAGE FUNCTIONS ===

// Save user location to localStorage
function saveUserLocation(location) {
    localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(location));
}

// Get user location from localStorage
function getUserLocation() {
    const locationStr = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
    return locationStr ? JSON.parse(locationStr) : null;
}

// Clear user location
function clearUserLocation() {
    localStorage.removeItem(STORAGE_KEYS.USER_LOCATION);
}

// Get product image URL (handle both relative and absolute URLs)
function getProductImageUrl(product) {
    if (!product || !product.mediaPrimaryUrl) {
        // Use data URI for placeholder image instead of external service
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
                <rect width="300" height="200" fill="#f0f0f0"/>
                <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#999">
                    ${product?.name || 'Món Ăn'}
                </text>
                <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="40" fill="#ddd">
                    🍽️
                </text>
            </svg>
        `)}`;
    }
    
    return FormatHelper.getImageUrl(product.mediaPrimaryUrl);
}

// Load products from stores within flight corridor based on user location
async function loadFeaturedProductsByLocation(location) {
    try {
        const container = document.getElementById('featuredProducts');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h3>Đang tải món ăn gần bạn...</h3>
            </div>
        `;

        // Get stores within flight corridor
        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.STORES_WITHIN_FLIGHT_CORRIDOR, {
            latitude: location.latitude,
            longitude: location.longitude
        });

        const stores = response || [];

        if (stores.length === 0) {
            displayEmptyState('Không có cửa hàng nào trong hành lang bay an toàn của drone. Vui lòng thử vị trí khác.');
            return;
        }

        // Get store IDs
        const storeIds = stores.map(store => store.storeId);

        // Load all products from these stores
        const allProducts = [];
        for (const storeId of storeIds) {
            try {
                const storeResponse = await APIHelper.get(API_CONFIG.ENDPOINTS.PRODUCTS_BY_STORE(storeId));
                
                // Extract products array from StoreWithProductsResponse
                const products = storeResponse.products || [];
                const storeName = storeResponse.name || 'Cửa hàng';

                // Add store info to each product
                const storeInfo = stores.find(s => s.storeId === storeId);
                products.forEach(product => {
                    product.storeDistance = storeInfo?.Distanct || 0;
                    product.storeName = storeName;
                    product.storeId = storeId;
                });

                allProducts.push(...products);
            } catch (error) {
                console.error(`Error loading products for store ${storeId}:`, error);
            }
        }

        // Sort by store distance (closest first)
        allProducts.sort((a, b) => (a.storeDistance || 0) - (b.storeDistance || 0));

        // Check if we have products
        if (allProducts.length === 0) {
            displayEmptyState('Không tìm thấy món ăn nào trong khu vực của bạn. Vui lòng thử vị trí khác.');
            return;
        }

        // Cache products and stores for pagination and search
        allProductsCache = allProducts;
        originalProductsCache = [...allProducts]; // Keep a copy of original products
        allStoresCache = stores;
        currentPage = 1;
        isSearchMode = false;

        // Display products with pagination
        displayProductsWithPagination(allProducts, stores);

        // Update section title with location info
        updateSectionTitle(stores.length, location);

    } catch (error) {
        console.error('Error loading products by location:', error);
        displayEmptyState('Không thể tải danh sách món ăn. Vui lòng thử lại.');
    }
}

// Display products with distance information
function displayProductsWithDistance(products, stores) {
    const container = document.getElementById('featuredProducts');

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <h3>Chưa có món ăn</h3>
                <p>Không tìm thấy món ăn nào trong khu vực của bạn</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const imageUrl = getProductImageUrl(product);
        const price = FormatHelper.currency(product.basePrice || 0);
        const storeName = product.storeName || 'Cửa hàng';
        const distance = FormatHelper.distance(product.storeDistance || 0);

        return `
            <div class="card product-card" onclick="showProductDetail(${product.id})">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="card-img"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect width=%22300%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23ddd%22%3E🍽️%3C/text%3E%3C/svg%3E'">
                <div class="card-body">
                    <h3 class="card-title">${product.name}</h3>
                    <p class="card-text text-gray" style="font-size: 0.9rem;">
                        <i class="fas fa-store text-primary"></i>
                        ${storeName}
                    </p>
                    <p class="card-text" style="font-size: 0.85rem; color: #28a745;">
                        <i class="fas fa-drone"></i>
                        Cách ${distance} - Giao bằng drone
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
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); quickAddToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Display products with pagination (12 items per page, 4 columns)
function displayProductsWithPagination(products, stores) {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentProducts = products.slice(startIndex, endIndex);

    // Display current page products
    displayProductsWithDistance(currentProducts, stores);

    // Update pagination controls
    const pagination = document.getElementById('productsPagination');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');

    if (products.length > ITEMS_PER_PAGE) {
        pagination.style.display = 'block';
        pageInfo.textContent = `Trang ${currentPage} / ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    } else {
        pagination.style.display = 'none';
    }
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(allProductsCache.length / ITEMS_PER_PAGE);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayProductsWithPagination(allProductsCache, allStoresCache);
        
        // Scroll to top of products section
        document.getElementById('featuredProducts').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Update section title with location info
// Update section title with location info
function updateSectionTitle(storeCount, location) {
    const subtitleElement = document.getElementById('productsSectionSubtitle');
    const changeLocationBtn = document.getElementById('changeLocationBtn');

    if (subtitleElement) {
        const methodText = location.method === 'gps' ? '(GPS)' : '(Thủ công)';
        subtitleElement.innerHTML = `Tìm thấy ${storeCount} cửa hàng trong hành lang bay an toàn ${methodText}`;
    }

    // Show change location button when logged in and location is set
    if (changeLocationBtn && AuthHelper.isLoggedIn()) {
        changeLocationBtn.style.display = 'block';
    }

    // Update location display at bottom-left corner
    updateLocationDisplay(location);
}

// Update location display at bottom-left corner
function updateLocationDisplay(location) {
    const locationDisplay = document.getElementById('currentLocationDisplay');
    const latLngElement = document.getElementById('currentLatLng');
    const methodElement = document.getElementById('currentMethod');

    if (!locationDisplay || !location) return;

    // Show the location display when user is logged in and has location
    if (AuthHelper.isLoggedIn()) {
        locationDisplay.style.display = 'block';
        
        if (latLngElement) {
            latLngElement.textContent = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        }
        
        if (methodElement) {
            const methodText = location.method === 'gps' ? 'Định vị GPS tự động' : 'Nhập tọa độ thủ công';
            methodElement.innerHTML = `<span style="color: ${location.method === 'gps' ? '#28a745' : '#007bff'};">${methodText}</span>`;
        }
    } else {
        locationDisplay.style.display = 'none';
    }
}

// Hide location display
function hideLocationDisplay() {
    const locationDisplay = document.getElementById('currentLocationDisplay');
    if (locationDisplay) {
        locationDisplay.style.display = 'none';
    }
}

// Main.js - Homepage Logic

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Page loaded, initializing ===');
    
    initializePage();
    updateCartBadge();
    
    // Use auth manager from auth.js
    if (typeof auth !== 'undefined') {
        console.log('Auth manager found, updating UI');
        auth.updateUI();
    } else {
        console.error('Auth manager not found!');
    }

    // Check if user is logged in
    const isLoggedIn = AuthHelper.isLoggedIn();
    console.log('User logged in:', isLoggedIn);
    
    if (isLoggedIn) {
        // Logged in: Check if location is set, if not show modal
        checkAndShowLocationModal();
    } else {
        // Not logged in: Load all products without location filter
        console.log('Loading products for non-logged-in user...');
        loadFeaturedProducts();
        // Hide location display
        hideLocationDisplay();
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

// === LOCATION SELECTION FUNCTIONS ===

// Check if user has set location, if not show modal
function checkAndShowLocationModal() {
    const savedLocation = getUserLocation();

    if (!savedLocation) {
        // Show location modal on first visit
        showLocationModal();
    } else {
        // Load products based on saved location
        loadFeaturedProductsByLocation(savedLocation);
        // Update location display
        updateLocationDisplay(savedLocation);
        // Show change location button
        const changeLocationBtn = document.getElementById('changeLocationBtn');
        if (changeLocationBtn) {
            changeLocationBtn.style.display = 'block';
        }
    }
}

// Show location selection modal
function showLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Hide location modal
function hideLocationModal() {
    const modal = document.getElementById('locationModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Hide manual location form if it's showing
    hideManualLocationInput();
}

// Use current GPS location
async function useCurrentLocation() {
    if (!navigator.geolocation) {
        Toast.error('Trình duyệt không hỗ trợ định vị GPS');
        return;
    }

    Loading.show();

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                method: 'gps'
            };

            saveUserLocation(location);
            Toast.success(`Đã lấy vị trí: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
            hideLocationModal();

            // Reload products with new location
            await loadFeaturedProductsByLocation(location);
            Loading.hide();
        },
        (error) => {
            Loading.hide();
            console.error('GPS Error:', error);

            let errorMessage = 'Không thể lấy vị trí GPS';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Vui lòng cho phép truy cập vị trí trong trình duyệt';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Thông tin vị trí không khả dụng';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Yêu cầu lấy vị trí hết thời gian';
                    break;
            }

            Toast.error(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Show manual location input form
function showManualLocationInput() {
    const form = document.getElementById('manualLocationForm');
    if (form) {
        form.style.display = 'block';
        // Hide the option cards
        document.querySelectorAll('.location-option').forEach(el => {
            el.style.display = 'none';
        });
    }
}

// Hide manual location input form
function hideManualLocationInput() {
    const form = document.getElementById('manualLocationForm');
    if (form) {
        form.style.display = 'none';
        // Show the option cards again
        document.querySelectorAll('.location-option').forEach(el => {
            el.style.display = 'block';
        });
        // Reset form
        form.querySelector('form').reset();
    }
}

// Set manual location
async function setManualLocation(event) {
    event.preventDefault();

    const latitude = parseFloat(document.getElementById('manualLatitude').value);
    const longitude = parseFloat(document.getElementById('manualLongitude').value);

    if (isNaN(latitude) || isNaN(longitude)) {
        Toast.error('Vui lòng nhập tọa độ hợp lệ');
        return;
    }

    Loading.show();

    const location = {
        latitude: latitude,
        longitude: longitude,
        method: 'manual'
    };

    saveUserLocation(location);
    Toast.success(`Đã lưu vị trí: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    hideLocationModal();

    // Reload products with new location
    await loadFeaturedProductsByLocation(location);
    Loading.hide();
}

// Load featured products without location filter (for non-logged-in users)
async function loadFeaturedProducts() {
    try {
        console.log('Loading featured products for non-logged-in user...');
        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.PRODUCTS);
        console.log('Products response:', response);
        const products = response.result || response || [];

        // Cache products
        allProductsCache = products;
        originalProductsCache = [...products]; // Keep a copy of original products
        allStoresCache = [];
        currentPage = 1;
        isSearchMode = false;

        // Display with pagination (first 12 products)
        displayProducts(products.slice(0, ITEMS_PER_PAGE));
        
        // Show pagination if more than 12 products
        if (products.length > ITEMS_PER_PAGE) {
            const pagination = document.getElementById('productsPagination');
            const pageInfo = document.getElementById('pageInfo');
            const prevBtn = document.getElementById('prevPageBtn');
            const nextBtn = document.getElementById('nextPageBtn');
            const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
            
            pagination.style.display = 'block';
            pageInfo.textContent = `Trang 1 / ${totalPages}`;
            prevBtn.disabled = true;
            nextBtn.disabled = totalPages === 1;
        }
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
        const imageUrl = getProductImageUrl(product);
        const price = FormatHelper.currency(product.basePrice || 0);
        const storeName = product.storeName || 'Cửa hàng';
        
        return `
            <div class="card product-card" onclick="showProductDetail(${product.id})">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="card-img"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect width=%22300%22 height=%22200%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%23ddd%22%3E🍽️%3C/text%3E%3C/svg%3E'">
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
                    <button class="btn btn-success btn-sm" onclick="event.stopPropagation(); quickAddToCart(${product.id})">
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

// Perform search for products
async function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        Toast.warning('Vui lòng nhập từ khóa tìm kiếm');
        return;
    }

    Loading.show();

    try {
        // If user is logged in and has location, search only within safe stores
        if (AuthHelper.isLoggedIn() && originalProductsCache.length > 0) {
            // Search in original cached products (not filtered ones)
            // Only search in product name and description, NOT in store name
            const filteredProducts = originalProductsCache.filter(product => {
                const productName = (product.name || '').toLowerCase();
                const description = (product.description || '').toLowerCase();
                return productName.includes(query) || description.includes(query);
            });

            if (filteredProducts.length > 0) {
                currentPage = 1;
                isSearchMode = true;
                allProductsCache = filteredProducts; // Update display cache with filtered results
                displayProductsWithPagination(filteredProducts, allStoresCache);
                Toast.success(`Tìm thấy ${filteredProducts.length} sản phẩm`);
                
                // Update section title
                const subtitleElement = document.getElementById('productsSectionSubtitle');
                if (subtitleElement) {
                    subtitleElement.innerHTML = `Kết quả tìm kiếm cho "<strong>${query}</strong>"`;
                }
            } else {
                displayEmptyState(`Không tìm thấy sản phẩm nào cho "${query}" trong khu vực của bạn`);
                Toast.info('Không tìm thấy kết quả');
            }
        } else {
            // For non-logged-in users, search all products
            try {
                const response = await APIHelper.get(API_CONFIG.ENDPOINTS.PRODUCTS);
                const allProducts = response.result || response || [];
                
                // Filter products by search query
                // Only search in product name and description, NOT in store name
                const filteredProducts = allProducts.filter(product => {
                    const productName = (product.name || '').toLowerCase();
                    const description = (product.description || '').toLowerCase();
                    return productName.includes(query) || description.includes(query);
                });
                
                if (filteredProducts.length > 0) {
                    currentPage = 1;
                    isSearchMode = true;
                    allProductsCache = filteredProducts;
                    
                    // Display first page
                    displayProducts(filteredProducts.slice(0, ITEMS_PER_PAGE));
                    Toast.success(`Tìm thấy ${filteredProducts.length} sản phẩm`);
                    
                    // Update section title
                    const subtitleElement = document.getElementById('productsSectionSubtitle');
                    if (subtitleElement) {
                        subtitleElement.innerHTML = `Kết quả tìm kiếm cho "<strong>${query}</strong>"`;
                    }
                    
                    // Show pagination if needed
                    if (filteredProducts.length > ITEMS_PER_PAGE) {
                        const pagination = document.getElementById('productsPagination');
                        const pageInfo = document.getElementById('pageInfo');
                        const prevBtn = document.getElementById('prevPageBtn');
                        const nextBtn = document.getElementById('nextPageBtn');
                        const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
                        
                        pagination.style.display = 'block';
                        pageInfo.textContent = `Trang 1 / ${totalPages}`;
                        prevBtn.disabled = true;
                        nextBtn.disabled = totalPages === 1;
                    }
                } else {
                    displayEmptyState(`Không tìm thấy sản phẩm nào cho "${query}"`);
                    Toast.info('Không tìm thấy kết quả');
                }
            } catch (error) {
                console.error('Error searching products:', error);
                Toast.error('Lỗi khi tìm kiếm sản phẩm');
            }
        }
    } catch (error) {
        console.error('Error searching:', error);
        Toast.error('Lỗi khi tìm kiếm');
    } finally {
        Loading.hide();
    }
}

// Search stores (old function, redirect to performSearch)
function searchStores() {
    performSearch();
}

// Clear search and reload all products
function clearSearch() {
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset section title
    const subtitleElement = document.getElementById('productsSectionSubtitle');
    if (subtitleElement) {
        subtitleElement.innerHTML = 'Những món ăn được yêu thích nhất';
    }
    
    // Reset to original products from cache
    if (originalProductsCache.length > 0) {
        isSearchMode = false;
        allProductsCache = [...originalProductsCache]; // Restore original cache
        currentPage = 1;
        
        if (AuthHelper.isLoggedIn()) {
            // For logged-in users with location
            displayProductsWithPagination(allProductsCache, allStoresCache);
        } else {
            // For non-logged-in users
            displayProducts(allProductsCache.slice(0, ITEMS_PER_PAGE));
            
            // Update pagination
            if (allProductsCache.length > ITEMS_PER_PAGE) {
                const pagination = document.getElementById('productsPagination');
                const pageInfo = document.getElementById('pageInfo');
                const prevBtn = document.getElementById('prevPageBtn');
                const nextBtn = document.getElementById('nextPageBtn');
                const totalPages = Math.ceil(allProductsCache.length / ITEMS_PER_PAGE);
                
                pagination.style.display = 'block';
                pageInfo.textContent = `Trang 1 / ${totalPages}`;
                prevBtn.disabled = true;
                nextBtn.disabled = totalPages === 1;
            }
        }
        
        Toast.info('Đã xóa tìm kiếm');
    } else {
        // If no cache, reload from server
        if (AuthHelper.isLoggedIn()) {
            const location = getUserLocation();
            if (location) {
                loadFeaturedProductsByLocation(location);
            } else {
                loadFeaturedProducts();
            }
        } else {
            loadFeaturedProducts();
        }
        
        Toast.info('Đã xóa tìm kiếm');
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

// ============ PRODUCT MODAL FUNCTIONS ============

// Show product detail modal
function showProductDetail(productId) {
    // Find product from cache
    const product = allProductsCache.find(p => p.id === productId);
    
    if (!product) {
        Toast.error('Không tìm thấy sản phẩm');
        return;
    }
    
    currentModalProduct = product;
    modalQuantity = 1;
    
    // Fill modal with product data
    document.getElementById('productModalTitle').textContent = product.name;
    document.getElementById('productModalDescription').textContent = product.description || 'Món ăn ngon';
    document.getElementById('productModalPrice').textContent = FormatHelper.currency(product.basePrice || 0);
    document.getElementById('productModalImage').src = getProductImageUrl(product);
    document.getElementById('modalQuantity').textContent = modalQuantity;
    
    // Show modal
    document.getElementById('productModal').classList.add('show');
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    currentModalProduct = null;
    modalQuantity = 1;
}

// Increase quantity in modal
function increaseModalQuantity() {
    modalQuantity++;
    document.getElementById('modalQuantity').textContent = modalQuantity;
}

// Decrease quantity in modal
function decreaseModalQuantity() {
    if (modalQuantity > 1) {
        modalQuantity--;
        document.getElementById('modalQuantity').textContent = modalQuantity;
    }
}

// Add to cart from modal
async function addToCartFromModal() {
    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
        closeProductModal();
        showLoginModal();
        return;
    }
    
    if (!currentModalProduct) {
        Toast.error('Không tìm thấy sản phẩm');
        return;
    }
    
    // Check if user has set location (for logged-in users)
    const userLocation = getUserLocation();
    if (!userLocation) {
        Toast.warning('Vui lòng chọn vị trí giao hàng trước khi đặt món');
        closeProductModal();
        showLocationModal();
        return;
    }
    
    try {
        Loading.show();
        
        await APIHelper.post(API_CONFIG.ENDPOINTS.CART_ADD, {
            productId: currentModalProduct.id,
            quantity: modalQuantity
        });
        
        Toast.success(`Đã thêm ${modalQuantity} ${currentModalProduct.name} vào giỏ hàng!`);
        updateCartBadge();
        closeProductModal();
    } catch (error) {
        console.error('Error adding to cart:', error);
        Toast.error(error.message || 'Không thể thêm vào giỏ hàng');
    } finally {
        Loading.hide();
    }
}

// View store from modal
function viewProductStoreFromModal() {
    if (currentModalProduct && currentModalProduct.storeId) {
        window.location.href = `stores.html?id=${currentModalProduct.storeId}`;
    }
}

// Quick add to cart (1 item) from product card
async function quickAddToCart(productId) {
    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
        showLoginModal();
        return;
    }
    
    // Check if user has set location (for logged-in users)
    const userLocation = getUserLocation();
    if (!userLocation) {
        Toast.warning('Vui lòng chọn vị trí giao hàng trước khi đặt món');
        showLocationModal();
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

