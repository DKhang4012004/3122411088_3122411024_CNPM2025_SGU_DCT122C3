// Store Management JavaScript
let currentStoreId = null;
let currentUserId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Store Management page loaded');

    // Check authentication first
    const isAuthenticated = checkAuth();

    if (isAuthenticated) {
        // Only load data if authenticated
        loadUserStores();
        loadCategories();
    }
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userId = localStorage.getItem('userId');

    console.log('Auth Check - Token:', token ? 'Present' : 'Missing');
    console.log('Auth Check - User Data:', userData ? 'Present' : 'Missing');
    console.log('Auth Check - User ID:', userId);

    if (!token) {
        console.warn('No token found, redirecting to login');
        alert('Vui lòng đăng nhập để truy cập trang này');
        window.location.href = 'index.html';
        return false;
    }

    // Try to get user data
    let user = null;
    if (userData) {
        try {
            user = JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }

    // Set currentUserId from multiple sources
    if (user && user.id) {
        currentUserId = user.id;
    } else if (userId) {
        currentUserId = parseInt(userId);
    } else {
        console.error('Cannot determine user ID');
        alert('Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.');
        window.location.href = 'index.html';
        return false;
    }

    // Update UI
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        if (user) {
            userNameElement.textContent = user.username || user.email || 'User';
        } else {
            userNameElement.textContent = 'User #' + currentUserId;
        }
    }

    console.log('Auth Check - Success, User ID:', currentUserId);
    return true;
}

// Toggle dropdown
function toggleDropdown() {
    const menu = document.getElementById('dropdownMenu');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    window.location.href = 'index.html';
}

// Load user's stores
async function loadUserStores() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/owner/${currentUserId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const stores = data.result || [];

            const select = document.getElementById('storeSelect');
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
            }
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
    const token = localStorage.getItem('token');

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
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/store-address/store/${currentStoreId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const address = data.result;

            if (address) {
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

// Load store products
async function loadStoreProducts() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('productsTableBody');

    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải...</td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/stores/${currentStoreId}/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const products = data.products || [];

            if (products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Chưa có sản phẩm nào</td></tr>';
                return;
            }

            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>
                        <img src="${product.imageUrl || 'https://via.placeholder.com/60'}" 
                             alt="${product.name}" class="product-image">
                    </td>
                    <td>${product.name}</td>
                    <td>${formatPrice(product.price)}</td>
                    <td>${product.categoryName || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${product.status === 'AVAILABLE' ? 'status-active' : 'status-inactive'}">
                            ${product.status === 'AVAILABLE' ? 'Có sẵn' : 'Hết hàng'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="editProduct(${product.id})" title="Sửa">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="deleteProduct(${product.id})" title="Xóa" style="color: #dc3545;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

            // Update product count
            document.getElementById('totalProducts').textContent = products.length;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: red;">Lỗi khi tải sản phẩm</td></tr>';
    }
}

// Load store stats (mock data for now)
async function loadStoreStats() {
    // TODO: Implement real stats from backend
    document.getElementById('totalOrders').textContent = '0';
    document.getElementById('pendingOrders').textContent = '0';
    document.getElementById('totalRevenue').textContent = '0đ';
}

// Update store info
async function updateStoreInfo(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
        const getResponse = await fetch(`${API_BASE_URL}/api/store-address/store/${currentStoreId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        let method = 'POST';
        let url = `${API_BASE_URL}/api/store-address`;

        if (getResponse.ok) {
            const data = await getResponse.json();
            if (data.result && data.result.id) {
                method = 'PUT';
                url = `${API_BASE_URL}/api/store-address/${data.result.id}`;
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
    const token = localStorage.getItem('token');
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
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.closest('.tab').classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}Tab`).classList.add('active');
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
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const categories = data.result || [];

            const select = document.getElementById('productCategory');
            select.innerHTML = '<option value="">-- Chọn danh mục --</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Show add product modal
function showAddProductModal() {
    document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-box"></i> Thêm Sản Phẩm';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').classList.add('active');
}

// Close product modal
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

// Edit product
async function editProduct(productId) {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const product = data.result;

            document.getElementById('productModalTitle').innerHTML = '<i class="fas fa-edit"></i> Sửa Sản Phẩm';
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.categoryId;
            document.getElementById('productImageUrl').value = product.imageUrl || '';

            document.getElementById('productModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Không thể tải thông tin sản phẩm', 'error');
    }
}

// Save product (create or update)
async function saveProduct(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const form = event.target;
    const productId = form.productId.value;

    const productData = {
        name: form.name.value,
        description: form.description.value,
        price: parseFloat(form.price.value),
        categoryId: parseInt(form.categoryId.value),
        imageUrl: form.imageUrl.value || null,
        storeId: currentStoreId
    };

    try {
        let response;

        if (productId) {
            // Update existing product
            response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
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

        if (response.ok) {
            showNotification(productId ? 'Cập nhật sản phẩm thành công!' : 'Thêm sản phẩm thành công!', 'success');
            closeProductModal();
            loadStoreProducts();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Thao tác thất bại', 'error');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showNotification('Có lỗi xảy ra', 'error');
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Xóa sản phẩm thành công!', 'success');
            loadStoreProducts();
        } else {
            const error = await response.json();
            showNotification(error.message || 'Xóa sản phẩm thất bại', 'error');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Có lỗi xảy ra khi xóa sản phẩm', 'error');
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

    if (!avatar.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });
});
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản Lý Cửa Hàng - FoodFast</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .management-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        .management-header {
            background: linear-gradient(135deg, var(--primary), #e67e22);
            color: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            margin-bottom: 2rem;
        }
        .tabs {
            display: flex;
            gap: 1rem;
            border-bottom: 2px solid #eee;
            margin-bottom: 2rem;
        }
        .tab {
            padding: 1rem 2rem;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            color: var(--gray);
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
        }
        .tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .info-card {
            background: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            margin-bottom: 2rem;
        }
        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .form-group {
            display: flex;
            flex-direction: column;
        }
        .form-group label {
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--dark);
        }
        .form-group input,
        .form-group textarea,
        .form-group select {
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: var(--border-radius);
            font-size: 1rem;
        }
        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }
        .status-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        .status-active {
            background: #d4edda;
            color: #155724;
        }
        .status-inactive {
            background: #f8d7da;
            color: #721c24;
        }
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            text-align: center;
        }
        .stat-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--primary);
            margin-bottom: 0.5rem;
        }
        .stat-label {
            color: var(--gray);
        }
        .products-table {
            width: 100%;
            background: white;
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
        }
        .products-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .products-table th {
            background: var(--light);
            padding: 1rem;
            text-align: left;
            font-weight: 600;
        }
        .products-table td {
            padding: 1rem;
            border-bottom: 1px solid #eee;
        }
        .products-table tr:hover {
            background: var(--light);
        }
        .product-image {
            width: 60px;
            height: 60px;
            border-radius: var(--border-radius);
            object-fit: cover;
        }
        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        .modal.active {
            display: flex;
        }
        .modal-content {
            background: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--gray);
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <div class="header-content">
                <a href="index.html" class="logo">
                    <i class="fas fa-utensils"></i>
                    <span>FoodFast</span>
                </a>
                <nav class="nav">
                    <a href="index.html" class="nav-link">Trang chủ</a>
                    <a href="stores.html" class="nav-link">Cửa hàng</a>
                    <a href="store-management.html" class="nav-link active">Quản lý</a>
                    <a href="store-orders.html" class="nav-link">Đơn hàng</a>
                </nav>
                <div class="header-actions">
                    <div class="user-menu" id="userMenu">
                        <div class="user-dropdown" id="userDropdown">
                            <button class="user-avatar" onclick="toggleDropdown()">
                                <i class="fas fa-user-circle"></i>
                                <span id="userName"></span>
                            </button>
                            <div class="dropdown-menu" id="dropdownMenu">
                                <a href="orders.html"><i class="fas fa-box"></i> Đơn hàng của tôi</a>
                                <a href="store-management.html"><i class="fas fa-store"></i> Quản lý cửa hàng</a>
                                <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <div class="management-container">
        <!-- Management Header -->
        <div class="management-header">
            <h1><i class="fas fa-store"></i> Quản Lý Cửa Hàng</h1>
            <p>Quản lý thông tin, sản phẩm và hoạt động kinh doanh của bạn</p>
        </div>

        <!-- Store Selector (if multiple stores) -->
        <div class="info-card" id="storeSelectorCard">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <label for="storeSelect" style="margin-bottom: 0.5rem; display: block;">Chọn cửa hàng:</label>
                    <select id="storeSelect" class="form-control" onchange="loadStoreData()" style="width: 300px;">
                        <option value="">-- Chọn cửa hàng --</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="showCreateStoreModal()">
                    <i class="fas fa-plus"></i> Tạo cửa hàng mới
                </button>
            </div>
        </div>

        <!-- Store Content (hidden until store selected) -->
        <div id="storeContent" style="display: none;">
            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon" style="color: var(--primary);">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="stat-value" id="totalProducts">0</div>
                    <div class="stat-label">Sản phẩm</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: #28a745;">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="stat-value" id="totalOrders">0</div>
                    <div class="stat-label">Đơn hàng</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: #ffc107;">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-value" id="pendingOrders">0</div>
                    <div class="stat-label">Chờ xác nhận</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="color: #17a2b8;">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="stat-value" id="totalRevenue">0</div>
                    <div class="stat-label">Doanh thu</div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
                <button class="tab active" onclick="switchTab('info')">
                    <i class="fas fa-info-circle"></i> Thông tin cửa hàng
                </button>
                <button class="tab" onclick="switchTab('products')">
                    <i class="fas fa-box"></i> Sản phẩm
                </button>
                <button class="tab" onclick="switchTab('bank')">
                    <i class="fas fa-university"></i> Thông tin thanh toán
                </button>
            </div>

            <!-- Tab Content: Store Info -->
            <div id="infoTab" class="tab-content active">
                <div class="info-card">
                    <h2><i class="fas fa-store"></i> Thông Tin Cửa Hàng</h2>
                    <form id="storeInfoForm" onsubmit="updateStoreInfo(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tên cửa hàng *</label>
                                <input type="text" id="storeName" name="name" required>
                            </div>
                            <div class="form-group">
                                <label>Trạng thái</label>
                                <select id="storeStatus" name="status">
                                    <option value="ACTIVE">Đang hoạt động</option>
                                    <option value="INACTIVE">Tạm ngừng</option>
                                    <option value="PENDING">Chờ duyệt</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Mô tả</label>
                            <textarea id="storeDescription" name="description"></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Email liên hệ</label>
                                <input type="email" id="storeEmail" name="payoutEmail">
                            </div>
                            <div class="form-group">
                                <label>Ngày tạo</label>
                                <input type="text" id="storeCreatedAt" readonly style="background: #f5f5f5;">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Lưu thay đổi
                        </button>
                    </form>
                </div>

                <!-- Store Address -->
                <div class="info-card">
                    <h2><i class="fas fa-map-marker-alt"></i> Địa Chỉ Cửa Hàng</h2>
                    <form id="storeAddressForm" onsubmit="updateStoreAddress(event)">
                        <div class="form-group">
                            <label>Địa chỉ chi tiết *</label>
                            <input type="text" id="addressDetail" name="addressDetail" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tỉnh/Thành phố *</label>
                                <input type="text" id="addressProvince" name="province" required>
                            </div>
                            <div class="form-group">
                                <label>Quận/Huyện *</label>
                                <input type="text" id="addressDistrict" name="district" required>
                            </div>
                            <div class="form-group">
                                <label>Phường/Xã *</label>
                                <input type="text" id="addressWard" name="ward" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Vĩ độ (Latitude)</label>
                                <input type="number" step="any" id="addressLat" name="latitude">
                            </div>
                            <div class="form-group">
                                <label>Kinh độ (Longitude)</label>
                                <input type="number" step="any" id="addressLng" name="longitude">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Cập nhật địa chỉ
                        </button>
                    </form>
                </div>
            </div>

            <!-- Tab Content: Products -->
            <div id="productsTab" class="tab-content">
                <div class="info-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2><i class="fas fa-box"></i> Danh Sách Sản Phẩm</h2>
                        <button class="btn btn-primary" onclick="showAddProductModal()">
                            <i class="fas fa-plus"></i> Thêm sản phẩm
                        </button>
                    </div>

                    <div class="products-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Hình ảnh</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Giá</th>
                                    <th>Danh mục</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="productsTableBody">
                                <tr>
                                    <td colspan="6" style="text-align: center; padding: 2rem;">
                                        <i class="fas fa-spinner fa-spin"></i> Đang tải...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Tab Content: Bank Info -->
            <div id="bankTab" class="tab-content">
                <div class="info-card">
                    <h2><i class="fas fa-university"></i> Thông Tin Thanh Toán</h2>
                    <p style="color: var(--gray); margin-bottom: 1.5rem;">
                        Cập nhật thông tin tài khoản ngân hàng để nhận thanh toán từ hệ thống
                    </p>
                    <form id="bankInfoForm" onsubmit="updateBankInfo(event)">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tên chủ tài khoản *</label>
                                <input type="text" id="bankAccountName" name="bankAccountName" required>
                            </div>
                            <div class="form-group">
                                <label>Số tài khoản *</label>
                                <input type="text" id="bankAccountNumber" name="bankAccountNumber" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Tên ngân hàng *</label>
                                <input type="text" id="bankName" name="bankName" required placeholder="VD: Vietcombank, Techcombank...">
                            </div>
                            <div class="form-group">
                                <label>Chi nhánh</label>
                                <input type="text" id="bankBranch" name="bankBranch" placeholder="VD: Chi nhánh Hà Nội">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Cập nhật thông tin
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal: Create Store -->
    <div id="createStoreModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-store"></i> Tạo Cửa Hàng Mới</h2>
                <button class="modal-close" onclick="closeCreateStoreModal()">&times;</button>
            </div>
            <form id="createStoreForm" onsubmit="createStore(event)">
                <div class="form-group">
                    <label>Tên cửa hàng *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Mô tả</label>
                    <textarea name="description"></textarea>
                </div>
                <div class="form-group">
                    <label>Email liên hệ</label>
                    <input type="email" name="payoutEmail">
                </div>
                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-plus"></i> Tạo cửa hàng
                </button>
            </form>
        </div>
    </div>

    <!-- Modal: Add/Edit Product -->
    <div id="productModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="productModalTitle"><i class="fas fa-box"></i> Thêm Sản Phẩm</h2>
                <button class="modal-close" onclick="closeProductModal()">&times;</button>
            </div>
            <form id="productForm" onsubmit="saveProduct(event)">
                <input type="hidden" id="productId" name="productId">
                <div class="form-group">
                    <label>Tên sản phẩm *</label>
                    <input type="text" id="productName" name="name" required>
                </div>
                <div class="form-group">
                    <label>Mô tả</label>
                    <textarea id="productDescription" name="description"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Giá *</label>
                        <input type="number" id="productPrice" name="price" min="0" step="1000" required>
                    </div>
                    <div class="form-group">
                        <label>Danh mục *</label>
                        <select id="productCategory" name="categoryId" required>
                            <option value="">-- Chọn danh mục --</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>URL hình ảnh</label>
                    <input type="url" id="productImageUrl" name="imageUrl" placeholder="https://example.com/image.jpg">
                </div>
                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-save"></i> Lưu sản phẩm
                </button>
            </form>
        </div>
    </div>

    <script src="js/config.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/store-management.js"></script>
</body>
</html>

