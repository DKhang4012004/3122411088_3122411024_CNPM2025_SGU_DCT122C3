// Cart.js - Shopping Cart Logic

let cartData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadCart();
    checkAuthStatus();
});

// Check auth and redirect if not logged in
function checkAuthAndLoadCart() {
    if (!AuthHelper.isLoggedIn()) {
        Toast.warning('Vui lòng đăng nhập để xem giỏ hàng');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    loadCart();
}

// Check authentication status
function checkAuthStatus() {
    const isLoggedIn = AuthHelper.isLoggedIn();
    const guestMenu = document.getElementById('guestMenu');
    const userDropdown = document.getElementById('userDropdown');

    if (isLoggedIn) {
        const user = AuthHelper.getUser();
        guestMenu.style.display = 'none';
        userDropdown.style.display = 'block';
        document.getElementById('userName').textContent = user.username || user.fullName || 'User';
    }
}

// Load cart
async function loadCart() {
    try {
        Loading.show();

        const response = await APIHelper.get(API_CONFIG.ENDPOINTS.CART);
        cartData = response;

        console.log('Cart data:', cartData); // Debug log

        // Backend returns cartItems, not items
        const items = cartData.cartItems || cartData.items || [];

        if (items.length === 0) {
            showEmptyCart();
        } else {
            displayCartItems(items);
            updateSummary(cartData);
        }

    } catch (error) {
        console.error('Error loading cart:', error);
        Toast.error('Không thể tải giỏ hàng');
        showEmptyCart();
    } finally {
        Loading.hide();
    }
}

// Helper function to convert image URL
function getFullImageUrl(imageUrl) {
    if (!imageUrl) return 'https://via.placeholder.com/100?text=No+Image';
    
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    
    if (imageUrl.startsWith('/uploads')) {
        return `${window.location.origin}/home${imageUrl}`;
    }
    
    return 'https://via.placeholder.com/100?text=Food';
}

// Display cart items grouped by store
function displayCartItems(items) {
    const container = document.getElementById('cartItems');
    const emptyCart = document.getElementById('emptyCart');
    const cartLayout = document.getElementById('cartLayout');

    cartLayout.style.display = 'grid';
    emptyCart.style.display = 'none';

    // Group items by store
    const itemsByStore = items.reduce((groups, item) => {
        const storeId = item.storeId || 'unknown';
        if (!groups[storeId]) {
            groups[storeId] = {
                storeId: storeId,
                storeName: item.storeName || 'Cửa hàng',
                items: []
            };
        }
        groups[storeId].items.push(item);
        return groups;
    }, {});

    // Display each store group
    container.innerHTML = Object.values(itemsByStore).map(store => {
        const storeTotal = store.items.reduce((sum, item) => {
            const subtotal = item.totalPrice || item.subtotal || ((item.unitPrice || item.price || 0) * item.quantity);
            return sum + subtotal;
        }, 0);

        return `
        <div class="card" style="margin-bottom: 1.5rem; border: 2px solid var(--light);">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid var(--light);">
                    <h3 style="margin: 0; color: var(--primary-color);">
                        <i class="fas fa-store"></i> ${store.storeName}
                    </h3>
                    <span class="text-gray">${store.items.length} món</span>
                </div>
                
                ${store.items.map(item => {
                    const imageUrl = getFullImageUrl(item.productImageUrl || item.imageUrl || '');
                    const unitPrice = item.unitPrice || item.price || 0;
                    const subtotal = item.totalPrice || item.subtotal || (unitPrice * item.quantity);
                    
                    return `
                    <div class="cart-item" id="cartItem${item.productId}" style="border-bottom: 1px solid var(--light); padding: 1rem 0;">
                        <img src="${imageUrl}" 
                             alt="${item.productName}" 
                             class="cart-item-img"
                             onerror="this.src='https://via.placeholder.com/100?text=Food'">
                        <div class="cart-item-info">
                            <h4 class="cart-item-title">${item.productName}</h4>
                            <div class="cart-item-price">${FormatHelper.currency(unitPrice)}</div>
                            <div class="quantity-control">
                                <button onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;">
                            <button class="btn btn-sm" style="background: none; color: var(--danger-color);" 
                                    onclick="removeFromCart(${item.productId})">
                                <i class="fas fa-trash"></i>
                            </button>
                            <div style="font-size: 1.2rem; font-weight: bold; color: var(--primary-color);">
                                ${FormatHelper.currency(subtotal)}
                            </div>
                        </div>
                    </div>
                `}).join('')}
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--light);">
                    <span style="font-weight: bold; font-size: 1.1rem;">Tổng cửa hàng:</span>
                    <span style="font-weight: bold; font-size: 1.2rem; color: var(--primary-color);">
                        ${FormatHelper.currency(storeTotal)}
                    </span>
                </div>
            </div>
        </div>
    `}).join('');

    // Update cart badge
    updateCartBadge(items.length);
}

// Update cart summary
function updateSummary(cart) {
    const items = cart.cartItems || cart.items || [];
    
    // Group by store to count stores
    const storeCount = new Set(items.map(item => item.storeId)).size;
    
    const subtotal = cart.totalAmount || 0;
    const shippingFee = storeCount * 20000; // 20k per store
    const total = subtotal + shippingFee;

    document.getElementById('subtotal').textContent = FormatHelper.currency(subtotal);
    
    // Update shipping fee display
    const shippingFeeElement = document.getElementById('shippingFee');
    if (storeCount > 0) {
        shippingFeeElement.innerHTML = `${FormatHelper.currency(shippingFee)} <small class="text-gray">(${storeCount} cửa hàng × 20.000đ)</small>`;
    } else {
        shippingFeeElement.textContent = 'Miễn phí';
    }
    
    document.getElementById('total').textContent = FormatHelper.currency(total);

    // Show/hide multi-store info box
    const multiStoreInfo = document.getElementById('multiStoreInfo');
    if (storeCount > 1) {
        multiStoreInfo.style.display = 'block';
        document.getElementById('storeCountInfo').textContent = storeCount;
        document.getElementById('orderCountInfo').textContent = `${storeCount} đơn hàng riêng biệt`;
    } else {
        multiStoreInfo.style.display = 'none';
    }

    // Enable create order button if cart has items
    const createOrderBtn = document.getElementById('createOrderBtn');
    if (items.length > 0) {
        createOrderBtn.disabled = false;
    } else {
        createOrderBtn.disabled = true;
    }
}

// Show empty cart
function showEmptyCart() {
    document.getElementById('cartLayout').style.display = 'none';
    document.getElementById('emptyCart').style.display = 'block';
    updateCartBadge(0);
}

// Update quantity
async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        if (confirm('Bạn muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            removeFromCart(productId);
        }
        return;
    }

    if (newQuantity > 99) {
        Toast.warning('Số lượng tối đa là 99');
        return;
    }

    try {
        Loading.show();

        await APIHelper.put(API_CONFIG.ENDPOINTS.CART_UPDATE(productId), {
            quantity: newQuantity
        });

        // Reload cart
        await loadCart();

    } catch (error) {
        console.error('Error updating quantity:', error);
        Toast.error('Không thể cập nhật số lượng');
    } finally {
        Loading.hide();
    }
}

// Remove from cart
async function removeFromCart(productId) {
    try {
        Loading.show();

        await APIHelper.delete(API_CONFIG.ENDPOINTS.CART_REMOVE(productId));

        Toast.success('Đã xóa sản phẩm khỏi giỏ hàng');

        // Reload cart
        await loadCart();

    } catch (error) {
        console.error('Error removing from cart:', error);
        Toast.error('Không thể xóa sản phẩm');
    } finally {
        Loading.hide();
    }
}

// Update cart badge
function updateCartBadge(count) {
    document.getElementById('cartBadge').textContent = count || 0;
}

// Create orders from cart (without immediate payment)
async function createOrders() {
    if (!cartData || !cartData.cartItems || cartData.cartItems.length === 0) {
        Toast.warning('Giỏ hàng trống!');
        return;
    }

    // Count stores
    const items = cartData.cartItems || [];
    const storeCount = new Set(items.map(item => item.storeId)).size;
    
    const message = storeCount > 1 
        ? `Giỏ hàng có sản phẩm từ ${storeCount} cửa hàng khác nhau.\n\nHệ thống sẽ tạo ${storeCount} đơn hàng riêng biệt.\n\nXác nhận đặt đơn?`
        : 'Xác nhận đặt đơn hàng?';
    
    if (!confirm(message)) {
        return;
    }

    try {
        Loading.show();

        // Create order from cart (without payment)
        const response = await APIHelper.post(API_CONFIG.ENDPOINTS.ORDERS);

        if (response.result && response.result.length > 0) {
            const orders = response.result;
            const orderCount = orders.length;
            
            Toast.success(`Đã tạo ${orderCount} đơn hàng thành công!`);

            // Redirect to orders page after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        } else {
            Toast.error('Không thể tạo đơn hàng');
        }

    } catch (error) {
        console.error('Error creating order:', error);
        Toast.error(error.message || 'Không thể tạo đơn hàng');
    } finally {
        Loading.hide();
    }
}

// OLD FUNCTION - Keep for backward compatibility but not used
// Proceed to checkout
async function proceedToCheckout() {
    // This function is deprecated - use createOrders() instead
    await createOrders();
}

// Clear cart
async function clearCart() {
    if (!confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
        return;
    }

    try {
        Loading.show();

        await APIHelper.delete(API_CONFIG.ENDPOINTS.CART_CLEAR);

        Toast.success('Đã xóa toàn bộ giỏ hàng');
        showEmptyCart();

    } catch (error) {
        console.error('Error clearing cart:', error);
        Toast.error('Không thể xóa giỏ hàng');
    } finally {
        Loading.hide();
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

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdownMenu');
    const avatar = document.getElementById('userAvatar');
    if (dropdown && avatar && !avatar.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

