package com.cnpm.foodfast.Cart.service;

import com.cnpm.foodfast.dto.request.AddToCartRequest;
import com.cnpm.foodfast.dto.request.UpdateCartItemRequest;
import com.cnpm.foodfast.dto.response.CartResponse;

public interface CartService {

    /**
     * Add item to cart
     */
    CartResponse addToCart(Long userId, AddToCartRequest request);

    /**
     * Get user's active cart
     */
    CartResponse getActiveCart(Long userId);

    /**
     * Update cart item quantity by product ID
     */
    CartResponse updateCartItemByProductId(Long userId, Long productId, UpdateCartItemRequest request);

    /**
     * Remove item from cart by product ID
     */
    CartResponse removeCartItemByProductId(Long userId, Long productId);

    /**
     * Clear all items from cart
     */
    void clearCart(Long userId);

    /**
     * Get cart item count for user
     */
    int getCartItemCount(Long userId);
}
