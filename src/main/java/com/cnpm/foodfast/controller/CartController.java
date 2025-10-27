package com.cnpm.foodfast.controller;

import com.cnpm.foodfast.dto.request.cart.AddToCartRequest;
import com.cnpm.foodfast.dto.request.cart.UpdateCartItemRequest;
import com.cnpm.foodfast.dto.response.cart.CartResponse;
import com.cnpm.foodfast.service.ServiceInterface.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    @PostMapping("/add")
    public ResponseEntity<CartResponse> addToCart(
            Authentication authentication,
            @Valid @RequestBody AddToCartRequest request) {
        Long userId = Long.valueOf(authentication.getName()); // Assuming JWT contains user ID
        CartResponse response = cartService.addToCart(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<CartResponse> getActiveCart(Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        CartResponse response = cartService.getActiveCart(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> updateCartItem(
            Authentication authentication,
            @PathVariable Long cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        Long userId = Long.valueOf(authentication.getName());
        CartResponse response = cartService.updateCartItem(userId, cartItemId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartResponse> removeCartItem(
            Authentication authentication,
            @PathVariable Long cartItemId) {
        Long userId = Long.valueOf(authentication.getName());
        CartResponse response = cartService.removeCartItem(userId, cartItemId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        Long userId = Long.valueOf(authentication.getName());
        cartService.clearCart(userId);
        return ResponseEntity.ok().build();
    }
}
