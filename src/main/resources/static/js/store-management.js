// Store Management JavaScript
console.log('=== Store Management Script Loaded ===');

// API Base URL from config.js
const API_BASE_URL = API_CONFIG.BASE_URL;
console.log('API_BASE_URL:', API_BASE_URL);
console.log('API_CONFIG:', API_CONFIG);

let currentStoreId = null;
let currentUserId = null;

// Note: We use direct string literals instead of STORAGE_KEYS to avoid duplicate declaration
// Storage key constants: 'foodfast_token' and 'foodfast_user'

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('=== Store Management Initialization ===');
        console.log('DOM fully loaded at:', new Date().toISOString());

        // Verify critical elements exist
        const userName = document.getElementById('userName');
        const storeSelect = document.getElementById('storeSelect');
        const storeContent = document.getElementById('storeContent');

        console.log('Critical elements check:');
        console.log('- userName element:', userName ? 'Found' : 'NOT FOUND');
        console.log('- storeSelect element:', storeSelect ? 'Found' : 'NOT FOUND');
        console.log('- storeContent element:', storeContent ? 'Found' : 'NOT FOUND');

        // Check authentication first
        const isAuthenticated = checkAuth();
        console.log('Authentication result:', isAuthenticated);

        if (isAuthenticated) {
            console.log('User authenticated, loading data...');
            // Only load data if authenticated
            loadUserStores().catch(err => {
                console.error('Error loading stores:', err);
            });
            loadCategories().catch(err => {
                console.error('Error loading categories:', err);
            });
        } else {
            console.error('Authentication failed, user should be redirected');
        }

        // Setup drag and drop for image upload
        setupDragAndDrop();

        console.log('=== Initialization Complete ===');

        // Final UI check after a short delay to handle any race conditions
        setTimeout(() => {
            try {
                const userName = document.getElementById('userName');
                if (userName && userName.textContent === 'Loading...') {
                    console.warn('⚠️ userName still showing "Loading...", forcing update');
                    const userData = localStorage.getItem('foodfast_user');
                    if (userData) {
                        try {
                            const user = JSON.parse(userData);
                            if (user && typeof user === 'object' && user.id) {
                                const displayName = user.username || user.email || user.fullName || `User #${user.id}`;
                                userName.textContent = displayName;
                                console.log('✅ Forced update: userName set to', displayName);
                            } else {
                                console.error('Invalid user object in forced update');
                                userName.textContent = 'User';
                            }
                        } catch (e) {
                            console.error('Error parsing user data in forced update:', e);
                            userName.textContent = 'User';
                        }
                    } else {
                        console.warn('No user data in localStorage during forced update');
                        userName.textContent = 'User';
                    }
                }
            } catch (error) {
                console.error('Error in delayed UI check:', error);
            }
        }, 500);
    } catch (error) {
        console.error('Critical error during initialization:', error);
        console.error('Error stack:', error.stack);
        alert('Có lỗi nghiêm trọng khi khởi tạo trang. Vui lòng tải lại trang.');
    }
});

// Check authentication
function checkAuth() {
    try {
        const token = localStorage.getItem('foodfast_token');
        const userData = localStorage.getItem('foodfast_user');

        console.log('=== Auth Check Start ===');
        console.log('Auth Check - Token:', token ? 'Present (length: ' + token.length + ')' : 'Missing');
        console.log('Auth Check - User Data:', userData ? 'Present' : 'Missing');

        if (!token) {
            console.warn('No token found, redirecting to login');
            alert('Vui lòng đăng nhập để truy cập trang này');
            window.location.href = 'index.html';
            return false;
        }

        // Try to get user data
        let user = null;
        if (!userData) {
            console.error('User data missing from localStorage');
            alert('Thông tin người dùng không tồn tại. Vui lòng đăng nhập lại.');
            window.location.href = 'index.html';
            return false;
        }

        try {
            user = JSON.parse(userData);
            console.log('User data parsed successfully:', {
                id: user?.id,
                username: user?.username,
                email: user?.email,
                hasAllProperties: !!(user && typeof user === 'object')
            });
        } catch (e) {
            console.error('Error parsing user data:', e);
            console.error('Raw user data:', userData);
            alert('Dữ liệu người dùng không hợp lệ. Vui lòng đăng nhập lại.');
            window.location.href = 'index.html';
            return false;
        }

        // Validate user object
        if (!user || typeof user !== 'object') {
            console.error('User is not a valid object:', user);
            alert('Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.');
            window.location.href = 'index.html';
            return false;
        }

        // Set currentUserId
        if (user.id) {
            currentUserId = user.id;
            console.log('✅ Current User ID set to:', currentUserId);
        } else {
            console.error('User ID missing from user object:', user);
            alert('Không thể xác định ID người dùng. Vui lòng đăng nhập lại.');
            window.location.href = 'index.html';
            return false;
        }

        // Update UI - with retry logic to handle race conditions
        const displayName = user.username || user.email || user.fullName || `User #${currentUserId}`;
        console.log('Display name determined:', displayName);

        function updateUserName() {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = displayName;
                console.log('✅ User display name set to:', displayName);
                return true;
            } else {
                console.warn('⚠️ userName element not found in DOM');
                return false;
            }
        }

        // Try immediately
        if (!updateUserName()) {
            // If failed, try again after a short delay
            console.log('Retrying userName update after delay...');
            setTimeout(updateUserName, 100);
        }

        console.log('✅ Auth Check - Success, User ID:', currentUserId);
        console.log('=== Auth Check Complete ===');
        return true;
    } catch (error) {
        console.error('Unexpected error in checkAuth:', error);
        console.error('Error stack:', error.stack);
        alert('Có lỗi xảy ra khi kiểm tra xác thực. Vui lòng đăng nhập lại.');
        window.location.href = 'index.html';
        return false;
    }
}

// Toggle dropdown
function toggleDropdown() {
    const menu = document.getElementById('dropdownMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Logout
function logout() {
    localStorage.removeItem('foodfast_token');
    localStorage.removeItem('foodfast_user');
    window.location.href = 'index.html';
}

// Load user's stores
async function loadUserStores() {
    const token = localStorage.getItem('foodfast_token');

    console.log('Loading stores for user:', currentUserId);
    console.log('API URL:', `${API_BASE_URL}/api/stores/owner/${currentUserId}`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/owner/${currentUserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Stores API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Stores data:', data);
            const stores = data.result || [];

            console.log('Number of stores:', stores.length);

            const select = document.getElementById('storeSelect');
            if (!select) {
                console.error('Store select element not found!');
                return;
            }

            select.innerHTML = '<option value="">-- Chọn cửa hàng --</option>';

            stores.forEach(store => {
                const option = document.createElement('option');
                option.value = store.id;
                option.textContent = store.name;
                select.appendChild(option);
            });

            // Auto-select if only one store
            if (stores.length === 1) {
                select.value = stores[0].id;
                loadStoreData();
            } else if (stores.length === 0) {
                showNotification('Bạn chưa có cửa hàng nào. Hãy tạo cửa hàng mới!', 'info');
            }
        } else {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            showNotification(`Lỗi: ${errorData.message || 'Không thể tải cửa hàng'}`, 'error');
        }
    } catch (error) {
        console.error('Error loading stores:', error);
        showNotification('Không thể tải danh sách cửa hàng', 'error');
    }
}

// Load store data
async function loadStoreData() {
    const storeId = document.getElementById('storeSelect').value;

    if (!storeId) {
        document.getElementById('storeContent').style.display = 'none';
        return;
    }

    currentStoreId = storeId;
    document.getElementById('storeContent').style.display = 'block';

    await Promise.all([
        loadStoreInfo(),
        loadStoreAddress(),
        loadStoreProducts(),
        loadStoreStats()
    ]);
}

// Load store information
async function loadStoreInfo() {
    const token = localStorage.getItem('foodfast_token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const store = data.result;

            document.getElementById('storeName').value = store.name || '';
            document.getElementById('storeDescription').value = store.description || '';
            document.getElementById('storeStatus').value = store.storeStatus || 'PENDING';
            document.getElementById('storeEmail').value = store.payoutEmail || '';
            document.getElementById('storeCreatedAt').value = store.createdAt ?
                new Date(store.createdAt).toLocaleString('vi-VN') : '';

            // Bank info
            document.getElementById('bankAccountName').value = store.bankAccountName || '';
            document.getElementById('bankAccountNumber').value = store.bankAccountNumber || '';
            document.getElementById('bankName').value = store.bankName || '';
            document.getElementById('bankBranch').value = store.bankBranch || '';
        }
    } catch (error) {
        console.error('Error loading store info:', error);
        showNotification('Không thể tải thông tin cửa hàng', 'error');
    }
}

// Load store address
async function loadStoreAddress() {
    console.log('loadStoreAddress() called, currentStoreId:', currentStoreId);
    const token = localStorage.getItem('foodfast_token');

    try {
        const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.STORE_ADDRESS_BY_STORE(currentStoreId)}`;
        console.log('Loading store address from:', url);
        console.log('Token:', token ? 'exists' : 'missing');
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const addresses = data.result; // API returns List<StoreAddressResponse>

            if (addresses && addresses.length > 0) {
                const address = addresses[0]; // Take first address
                document.getElementById('addressDetail').value = address.addressDetail || '';
                document.getElementById('addressProvince').value = address.province || '';
                document.getElementById('addressDistrict').value = address.district || '';
                document.getElementById('addressWard').value = address.ward || '';
                document.getElementById('addressLat').value = address.latitude || '';
                document.getElementById('addressLng').value = address.longitude || '';
            }
        }
    } catch (error) {
        console.error('Error loading store address:', error);
    }
}

// Helper function to convert image URL to absolute path
function getFullImageUrl(imageUrl) {
    if (!imageUrl) return 'https://via.placeholder.com/60?text=No+Image';
    
    // If already absolute URL (starts with http/https), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    // If relative path starting with /uploads, add context path
    if (imageUrl.startsWith('/uploads')) {
        return `${window.location.origin}/home${imageUrl}`;
    }
    
    // If relative path not starting with /, add it
    if (!imageUrl.startsWith('/')) {
        return `${window.location.origin}/home/uploads/${imageUrl}`;
    }
    
    // Default: add context path
    return `${window.location.origin}/home${imageUrl}`;
}

// Load store products
async function loadStoreProducts() {
    const token = localStorage.getItem('foodfast_token');
    const tbody = document.getElementById('productsTableBody');

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Load products response:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Products data:', data);
            
            // Backend returns products array directly in the response
            const products = data.products || data.result?.products || [];

            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Chưa có sản phẩm nào. Hãy thêm sản phẩm mới!</td></tr>';
                document.getElementById('totalProducts').textContent = '0';
                return;
            }

            tbody.innerHTML = products.map(product => {
                // Handle different response formats
                const rawImageUrl = product.mediaPrimaryUrl || product.imageUrl || '';
                const imageUrl = getFullImageUrl(rawImageUrl);
                const price = product.basePrice || product.price || 0;
                const categoryName = product.categoryName || product.category?.name || 'N/A';
                const status = product.status || 'ACTIVE';
                const isActive = status === 'ACTIVE';
                
                return `
                    <tr style="${!isActive ? 'opacity: 0.6;' : ''}">
                        <td>
                            <img src="${imageUrl}" 
                                 alt="${product.name}" 
                                 class="product-image"
                                 onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Crect fill=%22%23ddd%22 width=%2260%22 height=%2260%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E';">
                        </td>
                        <td>${product.name}</td>
                        <td>${formatPrice(price)}</td>
                        <td>${categoryName}</td>
                        <td>
                            <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                                ${isActive ? 'Có sẵn' : 'Hết hàng'}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-outline" onclick="editProduct(${product.id})" title="Sửa">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline" onclick="toggleProductStatus(${product.id})" 
                                        title="${isActive ? 'Đánh dấu hết hàng' : 'Đánh dấu có hàng'}" 
                                        style="color: ${isActive ? '#dc3545' : '#28a745'};">
                                    <i class="fas fa-${isActive ? 'toggle-off' : 'toggle-on'}"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            // Update product count
            document.getElementById('totalProducts').textContent = products.length;
            console.log(`✅ Loaded ${products.length} products`);
        } else {
            const error = await response.json();
            console.error('Error loading products:', error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: red;">Lỗi khi tải sản phẩm: ' + (error.message || 'Unknown error') + '</td></tr>';
        }
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: red;">Lỗi khi tải sản phẩm: ' + error.message + '</td></tr>';
    }
}

// Load store stats from ledger
async function loadStoreStats() {
    if (!currentStoreId) return;
    
    try {
        // Load revenue from ledger (paid amounts)
        const ledgerResponse = await APIHelper.get(`/api/v1/ledger/store/${currentStoreId}/entries`);
        const ledgerEntries = ledgerResponse.result || [];
        
        // Calculate total revenue from PAID entries
        const totalRevenue = ledgerEntries
            .filter(e => e.status === 'PAID')
            .reduce((sum, e) => sum + parseFloat(e.netAmountOwed || 0), 0);
        
        document.getElementById('totalRevenue').textContent = formatPrice(totalRevenue);
    } catch (error) {
        console.error('Error loading store stats:', error);
        document.getElementById('totalRevenue').textContent = '0đ';
    }
}

// Update store info
async function updateStoreInfo(event) {
    event.preventDefault();
    const token = localStorage.getItem('foodfast_token');
    const form = event.target;

    const formData = {
        name: form.name.value,
        description: form.description.value,
        payoutEmail: form.payoutEmail.value,
        ownerUserId: currentUserId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('Cập nhật thông tin cửa hàng thành công!', 'success');
            loadUserStores(); // Reload store list
        } else {
            const error = await response.json();
            showNotification(error.message || 'Cập nhật thất bại', 'error');
        }
    } catch (error) {
        console.error('Error updating store:', error);
        showNotification('Có lỗi xảy ra khi cập nhật', 'error');
    }
}

// Update store address
async function updateStoreAddress(event) {
    event.preventDefault();
    const token = localStorage.getItem('foodfast_token');
    const form = event.target;

    const addressData = {
        storeId: currentStoreId,
        addressDetail: form.addressDetail.value,
        province: form.province.value,
        district: form.district.value,
        ward: form.ward.value,
        latitude: form.latitude.value ? parseFloat(form.latitude.value) : null,
        longitude: form.longitude.value ? parseFloat(form.longitude.value) : null
    };

    try {
        // Try to get existing address first
        const getResponse = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.STORE_ADDRESS_BY_STORE(currentStoreId)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        let method = 'POST';
        let url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.STORE_ADDRESS_CREATE(currentStoreId)}`;

        if (getResponse.ok) {
            const data = await getResponse.json();
            if (data.result && data.result.length > 0 && data.result[0].id) {
                method = 'PUT';
                url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.STORE_ADDRESS_UPDATE(data.result[0].id)}`;
            }
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(addressData)
        });

        if (response.ok) {
            showNotification('Cập nhật địa chỉ thành công!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Cập nhật địa chỉ thất bại', 'error');
        }
    } catch (error) {
        console.error('Error updating address:', error);
        showNotification('Có lỗi xảy ra khi cập nhật địa chỉ', 'error');
    }
}

// Update bank info
async function updateBankInfo(event) {
    event.preventDefault();
    const token = localStorage.getItem('foodfast_token');
    const form = event.target;

    const formData = {
        name: document.getElementById('storeName').value,
        description: document.getElementById('storeDescription').value,
        payoutEmail: document.getElementById('storeEmail').value,
        bankAccountName: form.bankAccountName.value,
        bankAccountNumber: form.bankAccountNumber.value,
        bankName: form.bankName.value,
        bankBranch: form.bankBranch.value,
        ownerUserId: currentUserId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            showNotification('Cập nhật thông tin thanh toán thành công!', 'success');
        } else {
            const error = await response.json();
            showNotification(error.message || 'Cập nhật thất bại', 'error');
        }
    } catch (error) {
        console.error('Error updating bank info:', error);
        showNotification('Có lỗi xảy ra khi cập nhật', 'error');
    }
}

// Switch tabs
function switchTab(tab, element) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        // Fallback: find button by tab name
        const tabButtons = document.querySelectorAll('.tab');
        tabButtons.forEach(btn => {
            if (btn.textContent.includes(getTabLabel(tab))) {
                btn.classList.add('active');
            }
        });
    }

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');

    // Load data for specific tabs
    if (tab === 'orders' && currentStoreId) {
        loadStoreOrders();
    }
}

function getTabLabel(tab) {
    const labels = {
        'info': 'Thông tin cửa hàng',
        'products': 'Sản phẩm',
        'orders': 'Đơn hàng',
        'bank': 'Thông tin thanh toán'
    };
    return labels[tab] || '';
}

// Show create store modal
function showCreateStoreModal() {
    document.getElementById('createStoreModal').classList.add('active');
}

// Close create store modal
function closeCreateStoreModal() {
    document.getElementById('createStoreModal').classList.remove('active');
    document.getElementById('createStoreForm').reset();
}

// Create store
async function createStore(event) {
    event.preventDefault();
    const token = localStorage.getItem('foodfast_token');
    const form = event.target;

    const storeData = {
        name: form.name.value,
        description: form.description.value,
        payoutEmail: form.payoutEmail.value,
        ownerUserId: currentUserId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(storeData)
        });

        if (response.ok) {
            showNotification('Tạo cửa hàng thành công!', 'success');
            closeCreateStoreModal();
            loadUserStores();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Tạo cửa hàng thất bại', 'error');
        }
    } catch (error) {
        console.error('Error creating store:', error);
        showNotification('Có lỗi xảy ra khi tạo cửa hàng', 'error');
    }
}

// Load categories for product form
async function loadCategories() {
    const token = localStorage.getItem('foodfast_token');

    try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Categories API response:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Categories data:', data);
            const categories = data.result || [];

            const select = document.getElementById('productCategory');
            if (!select) {
                console.error('Product category select not found!');
                return;
            }

            select.innerHTML = '<option value="">-- Chọn danh mục --</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });

            console.log(`✅ Loaded ${categories.length} categories`);
        } else {
            const error = await response.json();
            console.error('Error loading categories:', error);
            showNotification('Không thể tải danh mục sản phẩm', 'error');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showNotification('Lỗi khi tải danh mục', 'error');
    }
}

// Show add product modal
function showAddProductModal() {
    document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-box"></i> Thêm Sản Phẩm';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    
    // Reset image 
    removeProductImage();
    
    // Switch to upload tab by default
    switchImageTab('upload');
    
    document.getElementById('productModal').classList.add('active');
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

// Switch image tab (upload vs URL)
function switchImageTab(tab) {
    const uploadTab = document.getElementById('uploadTab');
    const urlTab = document.getElementById('urlTab');
    const uploadContent = document.getElementById('uploadTabContent');
    const urlContent = document.getElementById('urlTabContent');
    const removeBtn = document.getElementById('removeImageBtn');

    if (tab === 'upload') {
        uploadTab.classList.add('active');
        uploadTab.style.borderBottomColor = 'var(--primary)';
        uploadTab.style.color = 'var(--primary)';
        urlTab.classList.remove('active');
        urlTab.style.borderBottomColor = 'transparent';
        urlTab.style.color = 'var(--gray)';
        uploadContent.style.display = 'block';
        urlContent.style.display = 'none';
    } else {
        urlTab.classList.add('active');
        urlTab.style.borderBottomColor = 'var(--primary)';
        urlTab.style.color = 'var(--primary)';
        uploadTab.classList.remove('active');
        uploadTab.style.borderBottomColor = 'transparent';
        uploadTab.style.color = 'var(--gray)';
        urlContent.style.display = 'block';
        uploadContent.style.display = 'none';
    }
}

// Handle file select
function handleImageFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showNotification('Vui lòng chọn file ảnh (JPG, PNG, GIF)', 'error');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('Kích thước ảnh không được vượt quá 5MB', 'error');
        return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePreviewPlaceholder');
        const removeBtn = document.getElementById('removeImageBtn');
        
        preview.src = e.target.result;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadImageFile(file);
}

// Upload image file to server
async function uploadImageFile(file) {
    const token = localStorage.getItem('foodfast_token');
    const progressContainer = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const progressText = document.getElementById('uploadProgressText');
    const successMsg = document.getElementById('uploadSuccess');
    const errorMsg = document.getElementById('uploadError');
    const errorText = document.getElementById('uploadErrorText');

    // Reset UI
    progressContainer.style.display = 'block';
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    progressBar.style.width = '0%';

    try {
        const formData = new FormData();
        formData.append('file', file);

        // Simulate upload progress (since we can't track real progress with fetch)
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress >= 90) {
                clearInterval(progressInterval);
            }
            progressBar.style.width = progress + '%';
            progressText.textContent = `Đang upload... ${progress}%`;
        }, 200);

        const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        clearInterval(progressInterval);
        progressBar.style.width = '100%';

        if (response.ok) {
            const data = await response.json();
            console.log('Upload response:', data);
            
            // Extract image URL from response
            const imageUrl = data.result?.url || data.url || data.result;
            
            if (imageUrl) {
                // Set URL to both visible and hidden inputs
                document.getElementById('productImageUrl').value = imageUrl;
                document.getElementById('productImageUrlHidden').value = imageUrl;
                
                // Show success
                progressContainer.style.display = 'none';
                successMsg.style.display = 'block';
                
                setTimeout(() => {
                    successMsg.style.display = 'none';
                }, 3000);
                
                console.log('✅ Image uploaded:', imageUrl);
            } else {
                throw new Error('URL không hợp lệ trong response');
            }
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Upload thất bại');
        }
    } catch (error) {
        console.error('Upload error:', error);
        progressContainer.style.display = 'none';
        errorMsg.style.display = 'block';
        errorText.textContent = error.message || 'Có lỗi xảy ra khi upload';
        
        // Clear preview on error
        removeProductImage();
    }
}

// Remove product image
function removeProductImage() {
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePreviewPlaceholder');
    const removeBtn = document.getElementById('removeImageBtn');
    const fileInput = document.getElementById('productImageFile');
    const urlInput = document.getElementById('productImageUrl');
    const hiddenInput = document.getElementById('productImageUrlHidden');
    
    preview.src = '';
    preview.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.innerHTML = '<i class="fas fa-image" style="display: block; font-size: 2.5rem; margin-bottom: 0.5rem;"></i>Xem trước';
    removeBtn.style.display = 'none';
    
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (hiddenInput) hiddenInput.value = '';
    
    // Hide upload messages
    document.getElementById('uploadProgress').style.display = 'none';
    document.getElementById('uploadSuccess').style.display = 'none';
    document.getElementById('uploadError').style.display = 'none';
}

// Preview product image from URL
function previewProductImage(url) {
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePreviewPlaceholder');
    const removeBtn = document.getElementById('removeImageBtn');
    const hiddenInput = document.getElementById('productImageUrlHidden');
    
    if (url && url.trim() !== '') {
        // Convert to full URL if needed
        const fullUrl = getFullImageUrl(url);
        
        // Update hidden input with original URL (not converted)
        if (hiddenInput) hiddenInput.value = url;
        
        // Use full URL for preview
        preview.src = fullUrl;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'block';
        
        // Handle image load error
        preview.onerror = function() {
            preview.style.display = 'none';
            placeholder.style.display = 'block';
            removeBtn.style.display = 'none';
            placeholder.innerHTML = '<i class="fas fa-exclamation-triangle" style="color: #dc3545; display: block; font-size: 2rem; margin-bottom: 0.5rem;"></i><small>Lỗi tải ảnh</small>';
        };
    } else {
        removeProductImage();
    }
}

// Edit product
async function editProduct(productId) {
    const token = localStorage.getItem('foodfast_token');

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Edit product response:', response.status);

        if (response.ok) {
            const data = await response.json();
            const product = data.result;
            
            console.log('Product to edit:', product);

            document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-edit"></i> Sửa Sản Phẩm';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPrice').value = product.basePrice || product.price || 0;
            document.getElementById('productCategory').value = product.categoryId || '';
            document.getElementById('productQuantity').value = product.quantityAvailable || 100;
            document.getElementById('productWeight').value = product.weightGram || 500;
            
            const imageUrl = product.mediaPrimaryUrl || product.imageUrl || '';
            document.getElementById('productImageUrl').value = imageUrl;
            
            // Preview image
            if (imageUrl) {
                previewProductImage(imageUrl);
            }

            document.getElementById('productModal').classList.add('active');
        } else {
            const error = await response.json();
            console.error('Error response:', error);
            showNotification('Không thể tải thông tin sản phẩm', 'error');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Không thể tải thông tin sản phẩm: ' + error.message, 'error');
    }
}

// Save product (create or update)
async function saveProduct(event) {
    event.preventDefault();
    const token = localStorage.getItem('foodfast_token');
    const form = event.target;
    const productId = form.productId.value;

    // Validate required fields
    if (!form.name.value || !form.price.value || !form.categoryId.value) {
        showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
        return;
    }

    // Product data matching backend StoreProductRequest
    const productData = {
        categoryId: parseInt(form.categoryId.value),
        sku: `SKU-${Date.now()}`, // Auto generate SKU
        name: form.name.value,
        description: form.description.value || '',
        basePrice: parseFloat(form.price.value),
        currency: 'VND',
        mediaPrimaryUrl: form.imageUrl.value || 'https://via.placeholder.com/400x300?text=No+Image',
        safetyStock: 10,
        quantityAvailable: parseInt(form.quantity.value) || 100,
        reservedQuantity: 0,
        weightGram: parseFloat(form.weight.value) || 500,
        lengthCm: 20,
        widthCm: 20,
        heightCm: 10
    };

    console.log('Saving product:', productData);

    try {
        let response;

        if (productId) {
            // Update existing product
            response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Create new product
            response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}/products`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        }

        console.log('Save product response:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Product saved:', data);
            showNotification(productId ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!', 'success');
            closeProductModal();
            loadStoreProducts();
        } else {
            const error = await response.json();
            console.error('Error response:', error);
            showNotification(error.message || 'Thao tác thất bại', 'error');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Có lỗi xảy ra: ' + error.message, 'error');
    }
}

// Toggle product status (ACTIVE <-> INACTIVE)
async function toggleProductStatus(productId) {
    const token = localStorage.getItem('foodfast_token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}/products/${productId}/toggle-status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Cập nhật trạng thái sản phẩm thành công!', 'success');
            loadStoreProducts();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Cập nhật trạng thái thất bại', 'error');
        }
    } catch (error) {
        console.error('Error toggling product status:', error);
        showNotification('Có lỗi xảy ra khi cập nhật trạng thái', 'error');
    }
}

// Delete product (soft delete - change status to OUT_OF_STOCK)
async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn đánh dấu HẾT HÀNG sản phẩm này?\n\nSản phẩm sẽ không hiển thị ở trang mua hàng.')) {
        return;
    }

    const token = localStorage.getItem('foodfast_token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Đã đánh dấu hết hàng!', 'success');
            loadStoreProducts();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Cập nhật thất bại', 'error');
        }
    } catch (error) {
        console.error('Error updating product status:', error);
        showNotification('Có lỗi xảy ra khi cập nhật', 'error');
    }
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('dropdownMenu');
    const avatar = document.querySelector('.user-avatar');

    if (dropdown && avatar && !avatar.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// ===== ORDER MANAGEMENT FUNCTIONS =====

let allOrders = [];

// Load store orders
async function loadStoreOrders() {
    const token = localStorage.getItem('foodfast_token');
    const tbody = document.getElementById('ordersTableBody');

    if (!currentStoreId) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Vui lòng chọn cửa hàng</td></tr>';
        return;
    }

    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/orders/store/${currentStoreId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Orders API response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Orders data:', data);
            allOrders = data.result || [];

            // Update stats
            updateOrderStats(allOrders);
            
            // Load revenue from ledger
            loadStoreStats();

            // Display orders
            displayOrders(allOrders);
        } else {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: red;">Lỗi: ${errorData.message || 'Không thể tải đơn hàng'}</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: red;">Không thể tải danh sách đơn hàng</td></tr>';
    }
}

// Update order statistics
function updateOrderStats(orders) {
    const totalOrders = orders.length;
    // Count orders that need store action (PAID status means waiting for store to accept)
    const pendingOrders = orders.filter(o => o.status === 'PAID').length;

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    // Revenue is now loaded from ledger in loadStoreStats()
}

// Display orders in table
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');

    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Chưa có đơn hàng nào</td></tr>';
        return;
    }

    tbody.innerHTML = orders.map(order => {
        const itemCount = order.items ? order.items.length : (order.orderItems ? order.orderItems.length : 0);
        const itemsText = itemCount > 0 ? `${itemCount} món` : 'N/A';

        return `
        <tr>
            <td><strong>#${order.orderCode || order.id}</strong></td>
            <td>${order.customerName || order.customerPhone || 'N/A'}</td>
            <td>${itemsText}</td>
            <td><strong style="color: var(--primary-color);">${formatPrice(order.totalPayable || order.totalAmount || 0)}</strong></td>
            <td>${getOrderStatusBadge(order.status)}</td>
            <td>${formatDateTime(order.createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="viewOrderDetail(${order.id})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${getOrderActionButtons(order)}
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Get order status badge HTML
function getOrderStatusBadge(status) {
    const statusMap = {
        'CREATED': { text: 'Đã tạo', class: 'status-pending' },
        'PENDING_PAYMENT': { text: 'Chờ thanh toán', class: 'status-pending' },
        'PAID': { text: 'Đã thanh toán', class: 'status-confirmed' },
        'ACCEPT': { text: 'Đã xác nhận', class: 'status-confirmed' },
        'IN_DELIVERY': { text: 'Đang giao', class: 'status-in-delivery' },
        'DELIVERED': { text: 'Đã giao', class: 'status-delivered' },
        'CANCELLED': { text: 'Đã hủy', class: 'status-cancelled' },
        'REFUNDED': { text: 'Đã hoàn tiền', class: 'status-cancelled' }
    };

    const statusInfo = statusMap[status] || { text: status, class: 'status-pending' };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

// Get action buttons based on order status
function getOrderActionButtons(order) {
    const status = order.status;

    // PAID -> Can ACCEPT or CANCEL
    if (status === 'PAID') {
        return `
            <button class="btn btn-sm btn-outline" onclick="updateOrderStatus(${order.id}, 'ACCEPT')" title="Xác nhận đơn" style="color: #28a745;">
                <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-sm btn-outline" onclick="cancelOrder(${order.id})" title="Hủy đơn" style="color: #dc3545;">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    // ACCEPT -> Can move to IN_DELIVERY
    else if (status === 'ACCEPT') {
        return `
            <button class="btn btn-sm btn-outline" onclick="updateOrderStatus(${order.id}, 'IN_DELIVERY')" title="Bắt đầu giao hàng" style="color: #17a2b8;">
                <i class="fas fa-truck"></i>
            </button>
        `;
    }
    // IN_DELIVERY -> Can mark as DELIVERED
    else if (status === 'IN_DELIVERY') {
        return `
            <button class="btn btn-sm btn-outline" onclick="updateOrderStatus(${order.id}, 'DELIVERED')" title="Đã giao hàng" style="color: #28a745;">
                <i class="fas fa-check-circle"></i>
            </button>
        `;
    }

    return '';
}

// Filter orders by status
function filterOrders() {
    const filterValue = document.getElementById('orderStatusFilter').value;

    if (!filterValue) {
        displayOrders(allOrders);
    } else {
        const filteredOrders = allOrders.filter(o => o.status === filterValue);
        displayOrders(filteredOrders);
    }
}

// View order detail
async function viewOrderDetail(orderId) {
    const token = localStorage.getItem('foodfast_token');
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderDetailContent');

    modal.classList.add('active');
    content.innerHTML = '<div style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const order = data.result;
            displayOrderDetail(order);
        } else {
            content.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;">Không thể tải chi tiết đơn hàng</div>';
        }
    } catch (error) {
        console.error('Error loading order detail:', error);
        content.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;">Có lỗi xảy ra</div>';
    }
}

// Display order detail in modal
function displayOrderDetail(order) {
    const content = document.getElementById('orderDetailContent');
    const items = order.items || order.orderItems || [];

    content.innerHTML = `
        <div style="padding: 1rem;">
            <div class="form-row" style="margin-bottom: 1.5rem;">
                <div class="form-group">
                    <label>Mã đơn hàng:</label>
                    <p style="font-weight: 600;">#${order.orderCode || order.id}</p>
                </div>
                <div class="form-group">
                    <label>Trạng thái:</label>
                    <p>${getOrderStatusBadge(order.status)}</p>
                </div>
            </div>

            <div class="form-row" style="margin-bottom: 1.5rem;">
                <div class="form-group">
                    <label>Khách hàng:</label>
                    <p>${order.customerName || 'N/A'}</p>
                </div>
                <div class="form-group">
                    <label>Số điện thoại:</label>
                    <p>${order.customerPhone || 'N/A'}</p>
                </div>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label>Địa chỉ giao hàng:</label>
                <p>${order.deliveryAddress || 'N/A'}</p>
            </div>

            <div class="form-group" style="margin-bottom: 1.5rem;">
                <label>Ghi chú:</label>
                <p>${order.note || 'Không có ghi chú'}</p>
            </div>

            <h3 style="margin: 1.5rem 0 1rem 0; border-bottom: 2px solid #eee; padding-bottom: 0.5rem;">
                <i class="fas fa-list"></i> Danh sách sản phẩm
            </h3>

            <table style="width: 100%; margin-bottom: 1.5rem;">
                <thead>
                    <tr style="background: var(--light); text-align: left;">
                        <th style="padding: 0.75rem;">Sản phẩm</th>
                        <th style="padding: 0.75rem; text-align: center;">SL</th>
                        <th style="padding: 0.75rem; text-align: right;">Đơn giá</th>
                        <th style="padding: 0.75rem; text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 0.75rem;">${item.productName || item.product?.name || 'N/A'}</td>
                            <td style="padding: 0.75rem; text-align: center;">${item.quantity}</td>
                            <td style="padding: 0.75rem; text-align: right;">${formatPrice(item.price)}</td>
                            <td style="padding: 0.75rem; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="text-align: right; padding: 1rem; background: var(--light); border-radius: 8px;">
                <div style="margin-bottom: 0.5rem;">
                    <span>Tạm tính:</span>
                    <strong style="margin-left: 2rem;">${formatPrice(order.totalAmount || 0)}</strong>
                </div>
                <div style="margin-bottom: 0.5rem;">
                    <span>Phí giao hàng:</span>
                    <strong style="margin-left: 2rem;">${formatPrice(order.shippingFee || 0)}</strong>
                </div>
                <div style="font-size: 1.25rem; color: var(--primary-color); margin-top: 0.75rem; padding-top: 0.75rem; border-top: 2px solid #ddd;">
                    <span>Tổng cộng:</span>
                    <strong style="margin-left: 2rem;">${formatPrice(order.totalPayable || order.totalAmount || 0)}</strong>
                </div>
            </div>

            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                ${getOrderDetailActions(order)}
            </div>
        </div>
    `;
}

// Get action buttons for order detail modal
function getOrderDetailActions(order) {
    const status = order.status;

    // PAID -> Can ACCEPT or CANCEL
    if (status === 'PAID') {
        return `
            <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'ACCEPT'); closeOrderModal();">
                <i class="fas fa-check"></i> Xác nhận đơn
            </button>
            <button class="btn btn-outline" onclick="cancelOrder(${order.id}); closeOrderModal();" style="color: #dc3545;">
                <i class="fas fa-times"></i> Hủy đơn
            </button>
        `;
    }
    // ACCEPT -> Can move to IN_DELIVERY
    else if (status === 'ACCEPT') {
        return `
            <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'IN_DELIVERY'); closeOrderModal();">
                <i class="fas fa-truck"></i> Bắt đầu giao hàng
            </button>
        `;
    }
    // IN_DELIVERY -> Can mark as DELIVERED
    else if (status === 'IN_DELIVERY') {
        return `
            <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'DELIVERED'); closeOrderModal();">
                <i class="fas fa-check-circle"></i> Đã giao hàng
            </button>
        `;
    }

    return '<button class="btn btn-outline" onclick="closeOrderModal()">Đóng</button>';
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    if (!confirm(`Xác nhận chuyển trạng thái đơn hàng?`)) {
        return;
    }

    const token = localStorage.getItem('foodfast_token');

    try {
        let response;
        
        // Use special endpoint for ACCEPT status (PAID -> ACCEPTED)
        if (newStatus === 'ACCEPT') {
            response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            // Use normal status update for other statuses
            response = await fetch(`${API_BASE_URL}/api/v1/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
        }

        if (response.ok) {
            showNotification('Cập nhật trạng thái đơn hàng thành công!', 'success');
            loadStoreOrders(); // Reload orders
        } else {
            const error = await response.json();
            showNotification(error.message || 'Cập nhật thất bại', 'error');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Có lỗi xảy ra khi cập nhật', 'error');
    }
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
        return;
    }

    await updateOrderStatus(orderId, 'CANCELLED');
}

// Close order modal
function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Format date time
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

// Setup drag and drop for image upload
function setupDragAndDrop() {
    // Wait for modal to be available
    setTimeout(() => {
        const uploadArea = document.getElementById('uploadTabContent');
        if (!uploadArea) return;

        const dropZone = uploadArea.querySelector('div[style*="border: 2px dashed"]');
        if (!dropZone) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when dragging over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.style.borderColor = 'var(--primary)';
                dropZone.style.background = '#f0f8ff';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.style.borderColor = '#ddd';
                dropZone.style.background = '#f8f9fa';
            }, false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', handleDrop, false);

        console.log('✅ Drag and drop setup complete');
    }, 1000);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        const file = files[0];
        
        // Create a fake event to reuse existing handler
        const fakeEvent = {
            target: {
                files: [file]
            }
        };
        
        handleImageFileSelect(fakeEvent);
    }
}

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});

