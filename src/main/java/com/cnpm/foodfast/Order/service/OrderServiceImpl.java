package com.cnpm.foodfast.Order.service;

import com.cnpm.foodfast.dto.request.order.CreateOrderRequest;
import com.cnpm.foodfast.dto.request.order.OrderItemRequest;
import com.cnpm.foodfast.dto.request.order.UpdateOrderStatusRequest;
import com.cnpm.foodfast.dto.response.order.OrderItemResponse;
import com.cnpm.foodfast.dto.response.order.OrderResponse;
import com.cnpm.foodfast.entity.*;
import com.cnpm.foodfast.enums.CartStatus;
import com.cnpm.foodfast.enums.OrderStatus;
import com.cnpm.foodfast.enums.PaymentStatus;
import com.cnpm.foodfast.enums.DroneStatus;
import com.cnpm.foodfast.exception.ResourceNotFoundException;
import com.cnpm.foodfast.exception.BadRequestException;
import com.cnpm.foodfast.Products.repository.ProductRepository;
import com.cnpm.foodfast.Order.repository.OrderItemRepository;
import com.cnpm.foodfast.Order.repository.OrderRepository;
import com.cnpm.foodfast.Store.repository.StoreRepository;
import com.cnpm.foodfast.Cart.repository.CartRepository;
import com.cnpm.foodfast.Cart.repository.CartItemRepository;
import com.cnpm.foodfast.User.repository.UserRepository;
import com.cnpm.foodfast.Payment.service.LedgerService;
import com.cnpm.foodfast.Drone.repository.DroneRepository;
import com.cnpm.foodfast.Delivery.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final DroneRepository droneRepository;
    private final DeliveryRepository deliveryRepository;
    private final com.cnpm.foodfast.Delivery.service.DeliveryService deliveryService;

    @Override
    @Transactional
    public List<OrderResponse> createOrdersFromCart(String username, com.cnpm.foodfast.dto.request.order.CreateOrderRequest request) {
        log.info("Creating orders from cart for authenticated user: {} with address: {}", 
                 username, request != null ? request.getDeliveryAddressSnapshot() : "N/A");

        try {
            // 1. Lấy userId từ username
            Long userId = userRepository.findIdByUsername(username);
            if (userId == null) {
                throw new ResourceNotFoundException("User not found: " + username);
            }

            log.info("Found user with ID: {}", userId);

            // 2. Lấy giỏ hàng ACTIVE của user
            Cart cart = cartRepository.findByUserIdAndStatusWithItems(userId, CartStatus.ACTIVE)
                    .orElseThrow(() -> new BadRequestException("No active cart found for user: " + username));

            // 3. Lấy tất cả cart items
            List<CartItem> cartItems = cartItemRepository.findByCartIdWithProduct(cart.getId());
            if (cartItems.isEmpty()) {
                throw new BadRequestException("Cart is empty. Cannot create orders.");
            }

            // 4. GOM CÁC CART ITEMS THEO STORE_ID
            Map<Long, List<CartItem>> itemsByStore = cartItems.stream()
                    .collect(Collectors.groupingBy(item -> item.getProduct().getStoreId()));

            log.info("Found {} items grouped into {} stores", cartItems.size(), itemsByStore.size());

            // 5. TẠO MỘT ĐỜN HÀNG CHO MỖI CỬA HÀNG
            List<OrderResponse> createdOrders = new ArrayList<>();

            for (Map.Entry<Long, List<CartItem>> entry : itemsByStore.entrySet()) {
                Long storeId = entry.getKey();
                List<CartItem> storeItems = entry.getValue();

                log.info("Creating order for store {} with {} items", storeId, storeItems.size());

                // Verify store exists
                Store store = storeRepository.findById(storeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Store not found: " + storeId));

                // Tạo order code
                String orderCode = generateOrderCode();
                BigDecimal totalItemAmount = BigDecimal.ZERO;

                // Tạo Order entity
                Order order = Order.builder()
                        .userId(userId)
                        .storeId(storeId)
                        .orderCode(orderCode)
                        .status(OrderStatus.CREATED)
                        .paymentStatus(PaymentStatus.PENDING)
                        .totalItemAmount(BigDecimal.ZERO)
                        .discountAmount(BigDecimal.ZERO)
                        .shippingFee(BigDecimal.ZERO)
                        .taxAmount(BigDecimal.ZERO)
                        .totalPayable(BigDecimal.ZERO)
                        .deliveryAddressSnapshot(request != null ? request.getDeliveryAddressSnapshot() : null)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                order = orderRepository.save(order);

                // Tạo order items
                for (CartItem cartItem : storeItems) {
                    Product product = cartItem.getProduct();

                    // Kiểm tra tồn kho
                    if (product.getQuantityAvailable() < cartItem.getQuantity()) {
                        throw new BadRequestException("Insufficient stock for product: " + product.getName() +
                                ". Available: " + product.getQuantityAvailable() + ", Requested: " + cartItem.getQuantity());
                    }

                    // Tính tổng tiền item
                    BigDecimal itemTotal = product.getBasePrice().multiply(new BigDecimal(cartItem.getQuantity()));
                    totalItemAmount = totalItemAmount.add(itemTotal);

                    // Tạo OrderItem
                    OrderItem orderItem = OrderItem.builder()
                            .orderId(order.getId())
                            .productId(product.getId())
                            .productNameSnapshot(product.getName())
                            .unitPriceSnapshot(product.getBasePrice())
                            .quantity(cartItem.getQuantity())
                            .totalPrice(itemTotal)
                            .build();

                    orderItemRepository.save(orderItem);

                    // Cập nhật tồn kho
                    product.setReservedQuantity(product.getReservedQuantity() + cartItem.getQuantity());
                    product.setQuantityAvailable(product.getQuantityAvailable() - cartItem.getQuantity());
                    productRepository.save(product);
                }

                // Tính phí ship và tổng tiền
                BigDecimal shippingFee = new BigDecimal("20000");
                order.setTotalItemAmount(totalItemAmount);
                order.setShippingFee(shippingFee);
                order.setTotalPayable(totalItemAmount.add(shippingFee));
                order = orderRepository.save(order);

                log.info("Order created successfully: {} for store: {}", orderCode, storeId);
                createdOrders.add(buildOrderResponse(order));
            }

            // 6. Xóa cart items và cart sau khi tạo orders
            cartItemRepository.deleteByCartId(cart.getId());
            cartItemRepository.flush();
            cartRepository.delete(cart);
            cartRepository.flush();

            log.info("Created {} orders from cart. Cart deleted.", createdOrders.size());

            return createdOrders;

        } catch (BadRequestException | ResourceNotFoundException e) {
            log.error("Error creating orders: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error creating orders: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create orders from cart", e);
        }
    }

    @Override
    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return buildOrderResponse(order);
    }

    @Override
    public OrderResponse getOrderByCode(String orderCode) {
        Order order = orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with code: " + orderCode));
        return buildOrderResponse(order);
    }

    @Override
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        List<Order> orders = orderRepository.findByUserId(userId);
        return orders.stream()
                .map(this::buildOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderResponse> getOrdersByStoreId(Long storeId) {
        List<Order> orders = orderRepository.findByStoreId(storeId);
        return orders.stream()
                .map(this::buildOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void cancelOrder(Long orderId) {
        log.info("Cancelling order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new IllegalStateException("Cannot cancel paid order");
        }

        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            if (product != null) {
                product.setReservedQuantity(product.getReservedQuantity() - item.getQuantity());
                product.setQuantityAvailable(product.getQuantityAvailable() + item.getQuantity());
                productRepository.save(product);
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        log.info("Order cancelled successfully: {}", orderId);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        log.info("Updating order {} status to: {}", orderId, request.getStatus());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        // Kiểm tra: chỉ orders đã thanh toán mới được cập nhật trạng thái
        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Only paid orders can be updated. Current payment status: " + order.getPaymentStatus());
        }

        // Validate luồng trạng thái hợp lệ
        validateStatusTransition(order.getStatus(), request.getStatus());

        order.setStatus(request.getStatus());
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        log.info("Order {} status updated to: {}", orderId, request.getStatus());
        return buildOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse acceptOrder(Long orderId) {
        log.info("Store accepting order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        // Kiểm tra: chỉ orders đã thanh toán mới được chấp nhận
        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Only paid orders can be accepted. Payment status: " + order.getPaymentStatus());
        }

        // Kiểm tra trạng thái hiện tại - phải là PAID
        if (order.getStatus() != OrderStatus.PAID) {
            throw new BadRequestException("Order must be in PAID status to be accepted. Current status: " + order.getStatus());
        }

        // ⭐ KIỂM TRA CÓ DRONE AVAILABLE KHÔNG - QUAN TRỌNG! ⭐
        boolean hasAvailableDrone = droneRepository.existsByStatus(DroneStatus.AVAILABLE);
        if (!hasAvailableDrone) {
            long totalDrones = droneRepository.count();
            log.error("Cannot accept order {} - No available drones. Total drones: {}", orderId, totalDrones);
            throw new BadRequestException(
                "Không thể chấp nhận đơn hàng! Hiện tại không có drone nào đang rảnh để giao hàng. " +
                "Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ."
            );
        }

        long availableDroneCount = droneRepository.countAvailableDrones();
        log.info("Order {} can be accepted. Available drones: {}", orderId, availableDroneCount);

        // Cập nhật trạng thái đơn hàng sang ACCEPT
        order.setStatus(OrderStatus.ACCEPT);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        // Tự động tạo StoreLedger entry khi đơn hàng được ACCEPT
        try {
            ledgerService.createLedgerEntryForOrder(order);
            log.info("StoreLedger created for accepted order: {}", orderId);
        } catch (Exception e) {
            log.error("Failed to create ledger entry for order {}: {}", orderId, e.getMessage());
            throw new RuntimeException("Failed to create ledger entry", e);
        }

        // ⭐ GÁN DRONE VÀ TÍNH THỜI GIAN THỰC TẾ KHI ACCEPT ⭐
        try {
            // Tìm delivery của order này
            Delivery delivery = deliveryRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new ResourceNotFoundException("Delivery not found for order: " + orderId));
            
            // Tìm drone available đầu tiên
            Drone availableDrone = droneRepository.findFirstByStatus(DroneStatus.AVAILABLE)
                    .orElseThrow(() -> new BadRequestException("No available drone found"));
            
            // Gán drone cho delivery → Tự động tính actual time
            deliveryService.assignDrone(delivery.getId(), availableDrone.getId());
            log.info("✓ Drone {} assigned to delivery {} for order {}", 
                     availableDrone.getModel(), delivery.getId(), orderId);
        } catch (Exception e) {
            log.error("Failed to assign drone for order {}: {}", orderId, e.getMessage());
            // Không fail accept order nếu gán drone lỗi
        }

        log.info("Order {} accepted (status = ACCEPT) with {} available drones and ledger created successfully",
                 orderId, availableDroneCount);
        return buildOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse rejectOrder(Long orderId, String reason) {
        log.info("Store rejecting order: {} with reason: {}", orderId, reason);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        // Kiểm tra trạng thái
        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Only paid orders can be rejected");
        }

        if (order.getStatus() != OrderStatus.PAID) {
            throw new BadRequestException("Order must be in PAID status to be rejected");
        }

        // Cập nhật trạng thái sang CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        // TODO: Có thể cần xử lý hoàn tiền ở đây
        log.info("Order {} rejected by store. Reason: {}", orderId, reason);

        return buildOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse markAsInDelivery(Long orderId) {
        log.info("Marking order {} as IN_DELIVERY", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        // Kiểm tra payment status
        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Only paid orders can be marked as in delivery");
        }

        // Kiểm tra trạng thái hiện tại
        if (order.getStatus() != OrderStatus.PAID) {
            throw new BadRequestException("Order must be in PAID status. Current: " + order.getStatus());
        }

        order.setStatus(OrderStatus.IN_DELIVERY);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        log.info("Order {} marked as IN_DELIVERY", orderId);
        return buildOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse markAsDelivered(Long orderId) {
        log.info("Marking order {} as DELIVERED", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        // Kiểm tra payment status
        if (order.getPaymentStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Only paid orders can be marked as delivered");
        }

        // Kiểm tra trạng thái hiện tại
        if (order.getStatus() != OrderStatus.IN_DELIVERY) {
            throw new BadRequestException("Order must be in IN_DELIVERY status. Current: " + order.getStatus());
        }

        order.setStatus(OrderStatus.DELIVERED);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        log.info("Order {} marked as DELIVERED", orderId);
        return buildOrderResponse(order);
    }

    /**
     * Validate status transition logic
     */
    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        // ✅ CHO PHÉP CHUYỂN TỪ CANCELLED → REFUNDED (Admin hoàn tiền)
        if (currentStatus == OrderStatus.CANCELLED && newStatus == OrderStatus.REFUNDED) {
            return; // Valid transition for refund
        }
        
        // Không cho phép chuyển từ DELIVERED, CANCELLED hoặc REFUNDED
        if (currentStatus == OrderStatus.DELIVERED || 
            currentStatus == OrderStatus.CANCELLED || 
            currentStatus == OrderStatus.REFUNDED) {
            throw new BadRequestException("Cannot change status of " + currentStatus + " order");
        }

        // Logic chuyển đổi hợp lệ
        switch (currentStatus) {
            case PAID:
                // PAID can move to ACCEPT (store confirms) or CANCELLED
                if (newStatus != OrderStatus.ACCEPT && newStatus != OrderStatus.CANCELLED) {
                    throw new BadRequestException("PAID order can only be moved to ACCEPT or CANCELLED");
                }
                break;
            case ACCEPT:
                // ACCEPT can move to IN_DELIVERY (ready for delivery) or CANCELLED
                if (newStatus != OrderStatus.IN_DELIVERY && newStatus != OrderStatus.CANCELLED) {
                    throw new BadRequestException("ACCEPT order can only be moved to IN_DELIVERY or CANCELLED");
                }
                break;
            case IN_DELIVERY:
                // IN_DELIVERY can move to DELIVERED (completed) or CANCELLED
                if (newStatus != OrderStatus.DELIVERED && newStatus != OrderStatus.CANCELLED) {
                    throw new BadRequestException("IN_DELIVERY order can only be moved to DELIVERED or CANCELLED");
                }
                break;
            default:
                break;
        }
    }

    private OrderResponse buildOrderResponse(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProductId())
                        .productName(item.getProductNameSnapshot())
                        .unitPrice(item.getUnitPriceSnapshot())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .toList();

        // Get store name
        String storeName = null;
        if (order.getStoreId() != null) {
            storeName = storeRepository.findById(order.getStoreId())
                    .map(Store::getName)
                    .orElse(null);
        }

        // Get delivery time estimation if delivery exists
        LocalDateTime estimatedDepartureTime = null;
        LocalDateTime estimatedArrivalTime = null;
        LocalDateTime actualDepartureTime = null; // ✅ Thời gian khởi hành thực tế
        LocalDateTime actualArrivalTime = null;   // ✅ Thời gian đến thực tế
        Integer estimatedFlightTimeMinutes = null;
        Double distanceKm = null;

        try {
            Optional<Delivery> deliveryOpt = deliveryRepository.findByOrderId(order.getId());
            if (deliveryOpt.isPresent()) {
                Delivery delivery = deliveryOpt.get();
                estimatedDepartureTime = delivery.getEstimatedDepartureTime();
                estimatedArrivalTime = delivery.getEstimatedArrivalTime();
                estimatedFlightTimeMinutes = delivery.getEstimatedFlightTimeMinutes();
                distanceKm = delivery.getDistanceKm();
                // ✅ Load actual times từ database
                actualDepartureTime = delivery.getActualDepartureTime();
                actualArrivalTime = delivery.getActualArrivalTime();
            }
        } catch (Exception e) {
            log.warn("Failed to get delivery info for order {}: {}", order.getId(), e.getMessage());
        }

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUserId())
                .storeId(order.getStoreId())
                .storeName(storeName)
                .orderCode(order.getOrderCode())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .totalItemAmount(order.getTotalItemAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .taxAmount(order.getTaxAmount())
                .totalPayable(order.getTotalPayable())
                .estimatedDepartureTime(estimatedDepartureTime)
                .estimatedArrivalTime(estimatedArrivalTime)
                .estimatedFlightTimeMinutes(estimatedFlightTimeMinutes)
                .distanceKm(distanceKm)
                .actualDepartureTime(actualDepartureTime)   // ✅ Trả về actual times
                .actualArrivalTime(actualArrivalTime)       // ✅ Trả về actual times
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public OrderResponse updateOrderItemQuantity(Long orderId, Long productId, Integer quantity) {
        log.info("Updating order item quantity - orderId: {}, productId: {}, newQuantity: {}",
                 orderId, productId, quantity);

        // 1. Lấy order và kiểm tra trạng thái
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        // Chỉ cho phép chỉnh sửa khi đơn hàng chưa thanh toán hoặc đang chờ thanh toán
        if (order.getStatus() != OrderStatus.CREATED && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Cannot modify order in status: " + order.getStatus() +
                                        ". Only CREATED or PENDING_PAYMENT orders can be modified.");
        }

        // 2. Tìm order item theo productId
        OrderItem orderItem = orderItemRepository.findByOrderIdAndProductId(orderId, productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Product " + productId + " not found in order " + orderId));

        // 3. Kiểm tra tồn kho của sản phẩm
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        if (product.getQuantityAvailable() < quantity) {
            throw new BadRequestException("Not enough stock. Available: " + product.getQuantityAvailable() +
                                        ", Requested: " + quantity);
        }

        // 4. Cập nhật số lượng và tổng tiền
        orderItem.setQuantity(quantity);
        orderItem.setTotalPrice(orderItem.getUnitPriceSnapshot().multiply(BigDecimal.valueOf(quantity)));
        orderItemRepository.save(orderItem);

        // 5. Tính lại tổng tiền của đơn hàng
        recalculateOrderTotal(order);

        log.info("Updated order item quantity successfully for order: {}", orderId);
        return buildOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse removeOrderItem(Long orderId, Long productId) {
        log.info("Removing order item - orderId: {}, productId: {}", orderId, productId);

        // 1. Lấy order và kiểm tra trạng thái
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.CREATED && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Cannot modify order in status: " + order.getStatus());
        }

        // 2. Kiểm tra số lượng món trong đơn hàng
        List<OrderItem> currentItems = orderItemRepository.findByOrderId(orderId);
        if (currentItems.size() <= 1) {
            throw new BadRequestException("Cannot remove the last item. Cancel the order instead.");
        }

        // 3. Tìm và xóa order item
        OrderItem orderItem = orderItemRepository.findByOrderIdAndProductId(orderId, productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Product " + productId + " not found in order " + orderId));

        orderItemRepository.delete(orderItem);

        // 4. Tính lại tổng tiền của đơn hàng
        recalculateOrderTotal(order);

        log.info("Removed order item successfully from order: {}", orderId);
        return buildOrderResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse addOrderItem(Long orderId, Long productId, Integer quantity) {
        log.info("Adding order item - orderId: {}, productId: {}, quantity: {}",
                 orderId, productId, quantity);

        // 1. Lấy order và kiểm tra trạng thái
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.CREATED && order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Cannot modify order in status: " + order.getStatus());
        }

        // 2. Lấy thông tin sản phẩm
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));

        // 3. Kiểm tra sản phẩm có thuộc cùng cửa hàng không
        if (!product.getStoreId().equals(order.getStoreId())) {
            throw new BadRequestException("Product does not belong to the same store as the order");
        }

        // 4. Kiểm tra tồn kho
        if (product.getQuantityAvailable() < quantity) {
            throw new BadRequestException("Not enough stock. Available: " + product.getQuantityAvailable() +
                                        ", Requested: " + quantity);
        }

        // 5. Kiểm tra xem sản phẩm đã có trong đơn hàng chưa
        Optional<OrderItem> existingItem = orderItemRepository.findByOrderIdAndProductId(orderId, productId);

        if (existingItem.isPresent()) {
            // Nếu đã có, cập nhật số lượng
            OrderItem orderItem = existingItem.get();
            int newQuantity = orderItem.getQuantity() + quantity;

            if (product.getQuantityAvailable() < newQuantity) {
                throw new BadRequestException("Not enough stock. Available: " + product.getQuantityAvailable() +
                                            ", Total requested: " + newQuantity);
            }

            orderItem.setQuantity(newQuantity);
            orderItem.setTotalPrice(orderItem.getUnitPriceSnapshot().multiply(BigDecimal.valueOf(newQuantity)));
            orderItemRepository.save(orderItem);

            log.info("Updated existing item quantity in order: {}", orderId);
        } else {
            // Nếu chưa có, tạo mới
            OrderItem newOrderItem = OrderItem.builder()
                    .orderId(orderId)
                    .productId(productId)
                    .productNameSnapshot(product.getName())
                    .unitPriceSnapshot(product.getBasePrice())
                    .quantity(quantity)
                    .totalPrice(product.getBasePrice().multiply(BigDecimal.valueOf(quantity)))
                    .build();

            orderItemRepository.save(newOrderItem);
            log.info("Added new item to order: {}", orderId);
        }

        // 6. Tính lại tổng tiền của đơn hàng
        recalculateOrderTotal(order);

        log.info("Added order item successfully to order: {}", orderId);
        return buildOrderResponse(order);
    }

    /**
     * Tính lại tổng tiền của đơn hàng sau khi thay đổi món ăn
     */
    private void recalculateOrderTotal(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

        // Tính tổng tiền các món
        BigDecimal totalItemAmount = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setTotalItemAmount(totalItemAmount);

        // Tính tổng cần thanh toán = tổng món + phí ship + thuế - giảm giá
        BigDecimal totalPayable = totalItemAmount
                .add(order.getShippingFee())
                .add(order.getTaxAmount())
                .subtract(order.getDiscountAmount());

        order.setTotalPayable(totalPayable);
        order.setUpdatedAt(LocalDateTime.now());

        orderRepository.save(order);

        log.info("Recalculated order total - orderId: {}, newTotal: {}", order.getId(), totalPayable);
    }

    private String generateOrderCode() {
        return "ORD" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Override
    @Transactional
    public void deleteOrder(Long orderId, String username) {
        log.info("Deleting order {} by user: {}", orderId, username);

        // 1. Lấy thông tin order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        // 2. Lấy userId từ username
        Long userId = userRepository.findIdByUsername(username);
        if (userId == null) {
            throw new ResourceNotFoundException("User not found: " + username);
        }

        // 3. Kiểm tra quyền: chỉ customer chủ của đơn hàng mới được xóa
        if (!order.getUserId().equals(userId)) {
            throw new BadRequestException("You do not have permission to delete this order. This order belongs to another user.");
        }

        // 4. Kiểm tra trạng thái đơn hàng - chỉ cho phép xóa khi chưa thanh toán hoặc đã hủy
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Cannot delete paid orders. Payment status: " + order.getPaymentStatus());
        }

        // Không cho phép xóa đơn hàng đang giao hoặc đã giao
        if (order.getStatus() == OrderStatus.IN_DELIVERY ||
            order.getStatus() == OrderStatus.DELIVERED ||
            order.getStatus() == OrderStatus.ACCEPT) {
            throw new BadRequestException("Cannot delete order in status: " + order.getStatus() +
                                        ". Only CREATED, PENDING_PAYMENT or CANCELLED orders can be deleted.");
        }

        // 5. Hoàn lại tồn kho nếu đơn hàng chưa hủy
        if (order.getStatus() != OrderStatus.CANCELLED) {
            List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
            for (OrderItem item : items) {
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product != null) {
                    // Hoàn lại số lượng đã reserve
                    product.setReservedQuantity(product.getReservedQuantity() - item.getQuantity());
                    product.setQuantityAvailable(product.getQuantityAvailable() + item.getQuantity());
                    productRepository.save(product);
                    log.info("Restored {} units of product {} to stock", item.getQuantity(), product.getId());
                }
            }
        }

        // 6. Xóa order items trước
        orderItemRepository.deleteByOrderId(orderId);
        orderItemRepository.flush();

        // 7. Xóa order
        orderRepository.delete(order);
        orderRepository.flush();

        log.info("Order {} deleted successfully by user: {}", orderId, username);
    }
}
