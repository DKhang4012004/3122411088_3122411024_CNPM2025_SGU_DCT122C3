package com.cnpm.foodfast.service.ServiceInterface;

import com.cnpm.foodfast.dto.request.cart.AddToCartRequest;
import com.cnpm.foodfast.dto.request.cart.UpdateCartItemRequest;
import com.cnpm.foodfast.dto.response.cart.CartResponse;

public interface CartService {

    CartResponse addToCart(Long userId, AddToCartRequest request);

    CartResponse getActiveCart(Long userId);

    CartResponse updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequest request);

    CartResponse removeCartItem(Long userId, Long cartItemId);

    void clearCart(Long userId);
}
