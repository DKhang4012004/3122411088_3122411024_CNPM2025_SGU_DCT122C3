// Cart page JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    if (!auth.isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    await loadCart();
    setupCheckout();
});

let currentCart = null;

// Load cart
async function loadCart() {
    const cartContainer = document.getElementById('cartContainer');
    const emptyCart = document.getElementById('emptyCart');
    const cartContent = document.getElementById('cartContent');
    const cartItems = document.getElementById('cartItems');

    try {
        const response = await api.getCart();
        currentCart = response;
        
        if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
            emptyCart.style.display = 'block';
            cartContent.style.display = 'none';
            return;
        }

        emptyCart.style.display = 'none';
        cartContent.style.display = 'grid';

        // Render cart items
        cartItems.innerHTML = currentCart.items.map(item => `
            <div class="cart-item" data-product-id="${item.productId}">
                <div class="cart-item-image">
                    <i class="fas fa-utensils"></i>
                </div>
                <div class="cart-item-info">
                    <h3>${item.productName}</h3>
                    <div class="cart-item-price">${formatPrice(item.unitPriceSnapshot)}</div>
                    <div class="cart-item-actions">
                        <div class="quantity-control">
                            <button onclick="updateQuantity(${item.productId}, ${item.quantity - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${item.productId}, ${item.quantity + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="remove-btn" onclick="removeItem(${item.productId})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                    <div style="margin-top: 0.5rem; font-weight: bold;">
                        Tổng: ${formatPrice(item.totalPrice)}
                    </div>
                </div>
            </div>
        `).join('');

        // Update summary
        updateCartSummary();
    } catch (error) {
        console.error('Error loading cart:', error);
        emptyCart.style.display = 'block';
        cartContent.style.display = 'none';
    }
}

// Update cart summary
function updateCartSummary() {
    if (!currentCart || !currentCart.items) return;

    const subtotal = currentCart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const shippingFee = 15000; // Fixed shipping fee
    const total = subtotal + shippingFee;

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shippingFee').textContent = formatPrice(shippingFee);
    document.getElementById('total').textContent = formatPrice(total);
}

// Update quantity
async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        return;
    }

    try {
        await api.updateCartItem(productId, newQuantity);
        await loadCart();
        await updateCartBadge();
        showNotification('Đã cập nhật giỏ hàng', 'success');
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('Không thể cập nhật số lượng', 'error');
    }
}

// Remove item
async function removeItem(productId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        return;
    }

    try {
        await api.removeCartItem(productId);
        await loadCart();
        await updateCartBadge();
        showNotification('Đã xóa sản phẩm', 'success');
    } catch (error) {
        console.error('Error removing item:', error);
        showNotification('Không thể xóa sản phẩm', 'error');
    }
}

// Setup checkout
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckoutModal = document.getElementById('closeCheckoutModal');
    const checkoutForm = document.getElementById('checkoutForm');

    checkoutBtn?.addEventListener('click', () => {
        if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
            showNotification('Giỏ hàng trống', 'error');
            return;
        }
        checkoutModal.style.display = 'block';
    });

    closeCheckoutModal?.addEventListener('click', () => {
        checkoutModal.style.display = 'none';
    });

    checkoutForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await processCheckout();
    });
}

// Process checkout
async function processCheckout() {
    const userId = auth.getUser()?.id || 1; // Default to 1 if no user ID
    
    const orderData = {
        userId: userId,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        deliveryCity: document.getElementById('deliveryCity').value,
        deliveryDistrict: document.getElementById('deliveryDistrict').value,
        deliveryPhone: document.getElementById('deliveryPhone').value,
        notes: document.getElementById('orderNotes').value
    };

    try {
        // Create order
        const orderResponse = await api.createOrder(orderData);
        const order = orderResponse.result;

        if (!order || !order.id) {
            throw new Error('Invalid order response');
        }

        // Get selected payment method
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        if (paymentMethod === 'VNPAY') {
            // Initialize payment
            const paymentResponse = await api.initPayment(order.id, 'VNPAY', 'QR');
            const payment = paymentResponse.result;

            if (payment && payment.paymentUrl) {
                // Redirect to payment URL
                window.location.href = payment.paymentUrl;
            } else {
                throw new Error('Invalid payment URL');
            }
        } else {
            // COD - redirect to orders page
            showNotification('Đặt hàng thành công!', 'success');
            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 1500);
        }
    } catch (error) {
        console.error('Error processing checkout:', error);
        showNotification('Không thể đặt hàng: ' + error.message, 'error');
    }
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
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
        z-index: 10000;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

