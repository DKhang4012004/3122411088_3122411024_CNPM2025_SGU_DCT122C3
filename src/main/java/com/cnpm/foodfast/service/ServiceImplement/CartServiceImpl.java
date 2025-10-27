package com.cnpm.foodfast.service.ServiceImplement;

import com.cnpm.foodfast.dto.request.cart.AddToCartRequest;
import com.cnpm.foodfast.dto.request.cart.UpdateCartItemRequest;
import com.cnpm.foodfast.dto.response.cart.CartResponse;
import com.cnpm.foodfast.dto.response.cart.CartItemResponse;
import com.cnpm.foodfast.entity.Cart;
import com.cnpm.foodfast.entity.CartItem;
import com.cnpm.foodfast.entity.Product;
import com.cnpm.foodfast.enums.CartStatus;
import com.cnpm.foodfast.exception.NotFoundException;
import com.cnpm.foodfast.exception.BadRequestException;
import com.cnpm.foodfast.repository.CartRepository;
import com.cnpm.foodfast.repository.CartItemRepository;
import com.cnpm.foodfast.repository.ProductRepository;
import com.cnpm.foodfast.service.ServiceInterface.CartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    private static final int MAX_WEIGHT_GRAM = 600; // 600g weight limit for drone delivery

    @Override
    @Transactional
    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        log.info("Adding product {} to cart for user {}", request.getProductId(), userId);

        // Validate product exists and available
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        // Check stock availability
        if (product.getQuantityAvailable() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + product.getQuantityAvailable());
        }

        // Get or create active cart
        Cart cart = getOrCreateActiveCart(userId);

        // Check if product already in cart
        CartItem existingCartItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), request.getProductId())
                .orElse(null);

        if (existingCartItem != null) {
            // Update existing cart item
            int newQuantity = existingCartItem.getQuantity() + request.getQuantity();

            // Check stock for new quantity
            if (product.getQuantityAvailable() < newQuantity) {
                throw new BadRequestException("Insufficient stock for total quantity. Available: " + product.getQuantityAvailable());
            }

            existingCartItem.setQuantity(newQuantity);
            existingCartItem.setTotalPrice(product.getBasePrice().multiply(BigDecimal.valueOf(newQuantity)));
            cartItemRepository.save(existingCartItem);
        } else {
            // Create new cart item
            CartItem cartItem = CartItem.builder()
                    .cartId(cart.getId())
                    .productId(product.getId())
                    .quantity(request.getQuantity())
                    .unitPriceSnapshot(product.getBasePrice())
                    .totalPrice(product.getBasePrice().multiply(BigDecimal.valueOf(request.getQuantity())))
                    .build();
            cartItemRepository.save(cartItem);
        }

        // Update cart timestamp
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getActiveCart(Long userId) {
        Cart cart = cartRepository.findActiveCartWithItemsByUserId(userId)
                .orElse(null);

        if (cart == null) {
            // Return empty cart response
            return CartResponse.builder()
                    .userId(userId)
                    .status(CartStatus.ACTIVE)
                    .items(List.of())
                    .totalItems(0)
                    .totalAmount(BigDecimal.ZERO)
                    .totalWeightGram(0)
                    .isOverWeightLimit(false)
                    .build();
        }

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new NotFoundException("Cart item not found"));

        // Verify cart belongs to user
        Cart cart = cartRepository.findById(cartItem.getCartId())
                .orElseThrow(() -> new NotFoundException("Cart not found"));

        if (!cart.getUserId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        // Validate product stock
        Product product = productRepository.findById(cartItem.getProductId())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        if (product.getQuantityAvailable() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + product.getQuantityAvailable());
        }

        // Update cart item
        cartItem.setQuantity(request.getQuantity());
        cartItem.setTotalPrice(cartItem.getUnitPriceSnapshot().multiply(BigDecimal.valueOf(request.getQuantity())));
        cartItemRepository.save(cartItem);

        // Update cart timestamp
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeCartItem(Long userId, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new NotFoundException("Cart item not found"));

        // Verify cart belongs to user
        Cart cart = cartRepository.findById(cartItem.getCartId())
                .orElseThrow(() -> new NotFoundException("Cart not found"));

        if (!cart.getUserId().equals(userId)) {
            throw new BadRequestException("Cart item does not belong to user");
        }

        cartItemRepository.delete(cartItem);

        // Update cart timestamp
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElse(null);

        if (cart != null) {
            cartItemRepository.deleteAll(cart.getCartItems());
            cart.setUpdatedAt(LocalDateTime.now());
            cartRepository.save(cart);
        }
    }

    private Cart getOrCreateActiveCart(Long userId) {
        return cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .orElseGet(() -> {
                    Cart newCart = Cart.builder()
                            .userId(userId)
                            .status(CartStatus.ACTIVE)
                            .build();
                    return cartRepository.save(newCart);
                });
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItem> cartItems = cartItemRepository.findByCartIdWithProduct(cart.getId());

        List<CartItemResponse> itemResponses = cartItems.stream()
                .map(this::mapToCartItemResponse)
                .collect(Collectors.toList());

        BigDecimal totalAmount = cartItems.stream()
                .map(CartItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = cartItems.stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        Integer totalWeight = cartItemRepository.calculateTotalWeightByCartId(cart.getId());
        totalWeight = totalWeight != null ? totalWeight : 0;

        boolean isOverWeightLimit = totalWeight > MAX_WEIGHT_GRAM;
        String weightWarningMessage = null;

        if (isOverWeightLimit) {
            weightWarningMessage = String.format(
                "Tổng trọng lượng (%dg) vượt quá giới hạn drone (%dg). Vui lòng tách đơn hàng để tiếp tục.",
                totalWeight, MAX_WEIGHT_GRAM
            );
        }

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .status(cart.getStatus())
                .items(itemResponses)
                .totalItems(totalItems)
                .totalAmount(totalAmount)
                .totalWeightGram(totalWeight)
                .isOverWeightLimit(isOverWeightLimit)
                .weightWarningMessage(weightWarningMessage)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    private CartItemResponse mapToCartItemResponse(CartItem cartItem) {
        Product product = cartItem.getProduct();

        return CartItemResponse.builder()
                .id(cartItem.getId())
                .productId(product.getId())
                .productName(product.getName())
                .productSku(product.getSku())
                .productImageUrl(product.getMediaPrimaryUrl())
                .weightGram(product.getWeightGram())
                .quantity(cartItem.getQuantity())
                .unitPrice(cartItem.getUnitPriceSnapshot())
                .totalPrice(cartItem.getTotalPrice())
                .createdAt(cartItem.getCreatedAt())
                .build();
    }
}
