package com.cnpm.foodfast.Delivery.service;

import com.cnpm.foodfast.Delivery.repository.DeliveryRepository;
import com.cnpm.foodfast.Drone.repository.DroneRepository;
import com.cnpm.foodfast.Drone.service.DroneService;
import com.cnpm.foodfast.Order.repository.OrderRepository;
import com.cnpm.foodfast.Store.repository.StoreRepository;
import com.cnpm.foodfast.dto.request.delivery.AssignDroneRequest;
import com.cnpm.foodfast.dto.request.delivery.CreateDeliveryRequest;
import com.cnpm.foodfast.dto.request.delivery.UpdateDeliveryStatusRequest;
import com.cnpm.foodfast.dto.response.delivery.DeliveryResponse;
import com.cnpm.foodfast.entity.Delivery;
import com.cnpm.foodfast.entity.Drone;
import com.cnpm.foodfast.entity.Order;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.enums.DeliveryStatus;
import com.cnpm.foodfast.enums.DroneStatus;
import com.cnpm.foodfast.enums.OrderStatus;
import com.cnpm.foodfast.exception.AppException;
import com.cnpm.foodfast.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final DroneRepository droneRepository;
    private final StoreRepository storeRepository;
    private final DroneService droneService;

    /**
     * Tạo delivery mới khi order được thanh toán thành công
     */
    @Transactional
    public DeliveryResponse createDelivery(CreateDeliveryRequest request) {
        log.info("Creating delivery for order: {}", request.getOrderId());

        // Kiểm tra order tồn tại và đã thanh toán
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        if (order.getStatus() != OrderStatus.PAID) {
            throw new AppException(ErrorCode.ORDER_NOT_PAID);
        }

        // Kiểm tra đã có delivery chưa
        if (deliveryRepository.existsByOrderId(request.getOrderId())) {
            throw new AppException(ErrorCode.DELIVERY_ALREADY_EXISTS);
        }

        // Lấy tọa độ store và customer để tính toán
        Store store = storeRepository.findById(request.getPickupStoreId())
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_EXISTED));
        
        // Parse customer coordinates from dropoffAddressSnapshot
        AddressCoordinates customerCoords = parseAddressCoordinates(request.getDropoffAddressSnapshot());
        AddressCoordinates storeCoords = getStoreCoordinates(store);
        
        // Tính khoảng cách và thời gian
        double distanceKm = droneService.calculateFlightDistance(
            storeCoords.getLatitude(), storeCoords.getLongitude(),
            customerCoords.getLatitude(), customerCoords.getLongitude()
        );
        
        // ⚡ FORCE 0.5 PHÚT (30 GIÂY) CHO DEMO - Tổng 1 phút
        int flightTimeMinutes = 1; // Fixed 30 seconds for quick demo (stored as 1 min, actual = 30s)
        
        // Ước tính thời gian (giả sử cửa hàng chuẩn bị 15 phút)
        int prepTimeMinutes = 15;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime estimatedDeparture = now.plusMinutes(prepTimeMinutes);
        LocalDateTime estimatedArrival = estimatedDeparture.plusMinutes(flightTimeMinutes);

        // Tạo delivery với status QUEUED (đang chờ xử lý)
        Delivery delivery = Delivery.builder()
                .orderId(request.getOrderId())
                .pickupStoreId(request.getPickupStoreId())
                .dropoffAddressSnapshot(request.getDropoffAddressSnapshot())
                .currentStatus(DeliveryStatus.QUEUED)
                .estimatedDepartureTime(estimatedDeparture)
                .estimatedArrivalTime(estimatedArrival)
                .estimatedFlightTimeMinutes(flightTimeMinutes)
                .distanceKm(distanceKm)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        delivery = deliveryRepository.save(delivery);
        log.info("Delivery created with ID: {} - Distance: {}km, Est. arrival: {}", 
                 delivery.getId(), distanceKm, estimatedArrival);

        return toDeliveryResponse(delivery);
    }

    /**
     * Gán drone cho delivery (tự động hoặc manual)
     */
    @Transactional
    public DeliveryResponse assignDrone(Long deliveryId, Long droneId) {
        log.info("Assigning drone {} to delivery {}", droneId, deliveryId);

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERY_NOT_FOUND));

        Drone drone = droneRepository.findById(droneId)
                .orElseThrow(() -> new AppException(ErrorCode.DRONE_NOT_FOUND));

        // Kiểm tra drone có sẵn sàng không
        if (drone.getStatus() != DroneStatus.AVAILABLE) {
            throw new AppException(ErrorCode.DRONE_NOT_AVAILABLE);
        }

        // Kiểm tra delivery có đang ở trạng thái QUEUED không
        if (delivery.getCurrentStatus() != DeliveryStatus.QUEUED) {
            throw new AppException(ErrorCode.DELIVERY_ALREADY_ASSIGNED);
        }

        // Gán drone
        delivery.setDroneId(droneId);
        delivery.setCurrentStatus(DeliveryStatus.ASSIGNED);
        delivery.setUpdatedAt(LocalDateTime.now());
        
        // ⭐ TÍNH THỜI GIAN THỰC TẾ KHI GÁN DRONE ⭐
        // Thời gian khởi hành thực tế = bây giờ + 30 giây (chuẩn bị)
        LocalDateTime actualDeparture = LocalDateTime.now().plusSeconds(30);
        
        // ⚡ FORCE 30 GIÂY CHO DEMO - Tổng 1 phút
        int flightTimeSeconds = 30; // Fixed 30 seconds regardless of distance
        LocalDateTime actualArrival = actualDeparture.plusSeconds(flightTimeSeconds);
        
        delivery.setActualDepartureTime(actualDeparture);
        delivery.setActualArrivalTime(actualArrival);
        
        log.info("✓ Actual times calculated - Departure: {}, Arrival: {}", 
                 actualDeparture, actualArrival);

        // Cập nhật trạng thái drone
        drone.setStatus(DroneStatus.IN_FLIGHT);
        droneRepository.save(drone);

        delivery = deliveryRepository.save(delivery);
        log.info("Drone {} assigned to delivery {} successfully", droneId, deliveryId);

        return toDeliveryResponse(delivery);
    }

    /**
     * Tự động tìm và gán drone phù hợp
     */
    @Transactional
    public DeliveryResponse autoAssignDrone(Long deliveryId) {
        log.info("Auto-assigning drone for delivery {}", deliveryId);

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERY_NOT_FOUND));

        Order order = orderRepository.findById(delivery.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        Store store = storeRepository.findById(delivery.getPickupStoreId())
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_EXISTED));

        // Parse delivery address để lấy tọa độ
        // TODO: Implement proper address parsing
        // Giả định có lat/lng trong deliveryAddressSnapshot
        Double storeLat = 10.762622; // TODO: Get from store
        Double storeLng = 106.660172;
        Double customerLat = 10.772622; // TODO: Parse from delivery address
        Double customerLng = 106.670172;

        // Tìm drone phù hợp (giả định trọng lượng 500g)
        var droneResponse = droneService.findAvailableDroneForDelivery(
                500, // TODO: Calculate actual weight from order items
                storeLat, storeLng,
                customerLat, customerLng
        );

        // Gán drone tìm được
        return assignDrone(deliveryId, droneResponse.getId());
    }

    /**
     * Cập nhật trạng thái delivery
     */
    @Transactional
    public DeliveryResponse updateDeliveryStatus(Long deliveryId, UpdateDeliveryStatusRequest request) {
        log.info("Updating delivery {} status to {}", deliveryId, request.getStatus());

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERY_NOT_FOUND));

        Order order = orderRepository.findById(delivery.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        DeliveryStatus oldStatus = delivery.getCurrentStatus();
        DeliveryStatus newStatus = request.getStatus();

        // Validate status transition
        validateStatusTransition(oldStatus, newStatus);

        // Update delivery status
        delivery.setCurrentStatus(newStatus);
        delivery.setUpdatedAt(LocalDateTime.now());

        // Handle specific status changes
        switch (newStatus) {
            case LAUNCHED:
                // Drone đã cất cánh
                delivery.setActualDepartureTime(LocalDateTime.now());
                order.setStatus(OrderStatus.IN_DELIVERY);
                break;

            case ARRIVING:
                // Drone đang đến gần điểm giao
                // No additional action needed
                break;

            case COMPLETED:
                // Giao hàng thành công
                delivery.setActualArrivalTime(LocalDateTime.now());
                order.setStatus(OrderStatus.DELIVERED);

                // Cập nhật drone về trạng thái AVAILABLE
                if (delivery.getDroneId() != null) {
                    Drone drone = droneRepository.findById(delivery.getDroneId())
                            .orElse(null);
                    if (drone != null) {
                        drone.setStatus(DroneStatus.AVAILABLE);
                        droneRepository.save(drone);
                    }
                }
                break;

            case FAILED:
                // Giao hàng thất bại
                order.setStatus(OrderStatus.CANCELLED);

                // Cập nhật drone về trạng thái AVAILABLE
                if (delivery.getDroneId() != null) {
                    Drone drone = droneRepository.findById(delivery.getDroneId())
                            .orElse(null);
                    if (drone != null) {
                        drone.setStatus(DroneStatus.AVAILABLE);
                        droneRepository.save(drone);
                    }
                }
                break;

            case RETURNED:
                // Drone quay về vì lý do nào đó
                order.setStatus(OrderStatus.CANCELLED);

                if (delivery.getDroneId() != null) {
                    Drone drone = droneRepository.findById(delivery.getDroneId())
                            .orElse(null);
                    if (drone != null) {
                        drone.setStatus(DroneStatus.AVAILABLE);
                        droneRepository.save(drone);
                    }
                }
                break;
        }

        orderRepository.save(order);
        delivery = deliveryRepository.save(delivery);

        log.info("Delivery {} status updated from {} to {}", deliveryId, oldStatus, newStatus);

        return toDeliveryResponse(delivery);
    }

    /**
     * Lấy thông tin delivery theo order ID
     */
    public DeliveryResponse getDeliveryByOrderId(Long orderId) {
        Delivery delivery = deliveryRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERY_NOT_FOUND));

        return toDeliveryResponse(delivery);
    }

    /**
     * Lấy thông tin delivery theo ID
     */
    public DeliveryResponse getDeliveryById(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERY_NOT_FOUND));

        return toDeliveryResponse(delivery);
    }

    /**
     * Lấy danh sách delivery đang chờ (QUEUED)
     */
    public List<DeliveryResponse> getQueuedDeliveries() {
        return deliveryRepository.findQueuedDeliveries().stream()
                .map(this::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách delivery theo drone
     */
    public List<DeliveryResponse> getDeliveriesByDrone(Long droneId) {
        return deliveryRepository.findByDroneId(droneId).stream()
                .map(this::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách delivery đang chờ xử lý cho admin (ASSIGNED, LAUNCHED, ARRIVING)
     */
    public List<DeliveryResponse> getPendingDeliveriesForAdmin() {
        List<Delivery> pendingDeliveries = deliveryRepository.findAll().stream()
                .filter(d -> d.getCurrentStatus() == DeliveryStatus.ASSIGNED 
                          || d.getCurrentStatus() == DeliveryStatus.LAUNCHED 
                          || d.getCurrentStatus() == DeliveryStatus.ARRIVING)
                .collect(Collectors.toList());
        
        return pendingDeliveries.stream()
                .map(this::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách delivery theo store (cho nhà hàng chuẩn bị món)
     */
    public List<DeliveryResponse> getDeliveriesByStore(Long storeId) {
        return deliveryRepository.findByPickupStoreId(storeId).stream()
                .filter(d -> d.getCurrentStatus() != DeliveryStatus.COMPLETED 
                          && d.getCurrentStatus() != DeliveryStatus.FAILED)
                .map(this::toDeliveryResponse)
                .collect(Collectors.toList());
    }

    /**
     * Validate status transition
     */
    private void validateStatusTransition(DeliveryStatus from, DeliveryStatus to) {
        // Define valid transitions
        boolean isValid = switch (from) {
            case QUEUED -> to == DeliveryStatus.ASSIGNED;
            case ASSIGNED -> to == DeliveryStatus.LAUNCHED || to == DeliveryStatus.FAILED;
            case LAUNCHED -> to == DeliveryStatus.ARRIVING || to == DeliveryStatus.FAILED || to == DeliveryStatus.RETURNED;
            case ARRIVING -> to == DeliveryStatus.COMPLETED || to == DeliveryStatus.FAILED || to == DeliveryStatus.RETURNED;
            case COMPLETED, FAILED, RETURNED -> false; // Terminal states
        };

        if (!isValid) {
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
    }

    /**
     * Convert Delivery entity to DeliveryResponse
     */
    private DeliveryResponse toDeliveryResponse(Delivery delivery) {
        DeliveryResponse.DeliveryResponseBuilder builder = DeliveryResponse.builder()
                .id(delivery.getId())
                .orderId(delivery.getOrderId())
                .droneId(delivery.getDroneId())
                .currentStatus(delivery.getCurrentStatus())
                .pickupStoreId(delivery.getPickupStoreId())
                .dropoffAddressSnapshot(delivery.getDropoffAddressSnapshot())
                .actualDepartureTime(delivery.getActualDepartureTime())
                .actualArrivalTime(delivery.getActualArrivalTime())
                .estimatedDepartureTime(delivery.getEstimatedDepartureTime())
                .estimatedArrivalTime(delivery.getEstimatedArrivalTime())
                .estimatedFlightTimeMinutes(delivery.getEstimatedFlightTimeMinutes())
                .distanceKm(delivery.getDistanceKm())
                .confirmationMethod(delivery.getConfirmationMethod())
                .createdAt(delivery.getCreatedAt())
                .updatedAt(delivery.getUpdatedAt());

        // Add order code if order exists
        if (delivery.getOrder() != null) {
            builder.orderCode(delivery.getOrder().getOrderCode());
        }

        // Add drone code if drone exists
        if (delivery.getDrone() != null) {
            builder.droneCode(delivery.getDrone().getCode());
        }

        // Add store name if store exists
        if (delivery.getPickupStore() != null) {
            builder.pickupStoreName(delivery.getPickupStore().getName());
        }

        return builder.build();
    }

    /**
     * Parse address coordinates from JSON snapshot
     */
    private AddressCoordinates parseAddressCoordinates(String addressSnapshot) {
        try {
            // Giả sử addressSnapshot có format JSON với latitude/longitude
            // Ví dụ: {"address":"...","latitude":10.772,"longitude":106.660}
            if (addressSnapshot != null && addressSnapshot.contains("latitude")) {
                String latStr = addressSnapshot.split("\"latitude\":")[1].split(",")[0];
                String lngStr = addressSnapshot.split("\"longitude\":")[1].split("}")[0];
                return new AddressCoordinates(Double.parseDouble(latStr), Double.parseDouble(lngStr));
            }
        } catch (Exception e) {
            log.warn("Failed to parse coordinates from address snapshot, using default", e);
        }
        // Default coordinates (Sài Gòn center) nếu parse fail
        return new AddressCoordinates(10.772622, 106.660172);
    }

    /**
     * Get store coordinates from StoreAddress
     */
    private AddressCoordinates getStoreCoordinates(Store store) {
        // Lấy địa chỉ đầu tiên của store
        if (store.getAddresses() != null && !store.getAddresses().isEmpty()) {
            var storeAddress = store.getAddresses().get(0);
            if (storeAddress.getLatitude() != null && storeAddress.getLongitude() != null) {
                return new AddressCoordinates(storeAddress.getLatitude(), storeAddress.getLongitude());
            }
        }
        // Default coordinates nếu không có
        log.warn("Store {} has no coordinates, using default", store.getId());
        return new AddressCoordinates(10.762622, 106.660172);
    }

    /**
     * Inner class for coordinates
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class AddressCoordinates {
        private double latitude;
        private double longitude;
    }

    /**
     * Get tracking information for delivery (used by map visualization)
     */
    public com.cnpm.foodfast.dto.response.delivery.DeliveryTrackingResponse getTrackingInfo(Long deliveryId) {
        log.info("Getting tracking info for delivery: {}", deliveryId);

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new AppException(ErrorCode.DELIVERY_NOT_FOUND));

        Order order = orderRepository.findById(delivery.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_EXISTED));

        Store store = storeRepository.findById(delivery.getPickupStoreId())
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_EXISTED));

        // Get drone if assigned
        com.cnpm.foodfast.dto.response.delivery.Position dronePosition = null;
        String droneModel = null;
        Integer batteryPercent = null;

        if (delivery.getDroneId() != null) {
            Drone drone = droneRepository.findById(delivery.getDroneId()).orElse(null);
            if (drone != null) {
                dronePosition = new com.cnpm.foodfast.dto.response.delivery.Position(
                        drone.getLastLatitude() != null ? drone.getLastLatitude() : java.math.BigDecimal.ZERO,
                        drone.getLastLongitude() != null ? drone.getLastLongitude() : java.math.BigDecimal.ZERO
                );
                droneModel = drone.getModel();
                batteryPercent = drone.getCurrentBatteryPercent();
            }
        }

        // Get store position
        AddressCoordinates storeCoords = getStoreCoordinates(store);
        com.cnpm.foodfast.dto.response.delivery.Position storePosition = 
                new com.cnpm.foodfast.dto.response.delivery.Position(
                        storeCoords.getLatitude(), storeCoords.getLongitude()
                );

        // Get customer position
        AddressCoordinates customerCoords = parseAddressCoordinates(delivery.getDropoffAddressSnapshot());
        com.cnpm.foodfast.dto.response.delivery.Position customerPosition = 
                new com.cnpm.foodfast.dto.response.delivery.Position(
                        customerCoords.getLatitude(), customerCoords.getLongitude()
                );

        // Calculate progress
        int progress = calculateProgress(delivery);

        return com.cnpm.foodfast.dto.response.delivery.DeliveryTrackingResponse.builder()
                .deliveryId(delivery.getId())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .status(delivery.getCurrentStatus())
                .dronePosition(dronePosition)
                .storePosition(storePosition)
                .customerPosition(customerPosition)
                .progress(progress)
                .distanceKm(delivery.getDistanceKm())
                .estimatedArrival(delivery.getActualArrivalTime())
                .actualDeparture(delivery.getActualDepartureTime())
                .droneId(delivery.getDroneId())
                .droneModel(droneModel)
                .batteryPercent(batteryPercent)
                .build();
    }

    /**
     * Calculate delivery progress (0-100%)
     */
    private int calculateProgress(Delivery delivery) {
        if (delivery.getCurrentStatus() == DeliveryStatus.QUEUED || 
            delivery.getCurrentStatus() == DeliveryStatus.ASSIGNED) {
            return 0;
        }

        if (delivery.getCurrentStatus() == DeliveryStatus.COMPLETED) {
            return 100;
        }

        // Calculate based on time elapsed
        if (delivery.getActualDepartureTime() != null && delivery.getActualArrivalTime() != null) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime start = delivery.getActualDepartureTime();
            java.time.LocalDateTime end = delivery.getActualArrivalTime();

            long totalSeconds = java.time.Duration.between(start, end).getSeconds();
            long elapsedSeconds = java.time.Duration.between(start, now).getSeconds();

            if (totalSeconds > 0) {
                // ⚠️ FIX: Nếu đã quá giờ arrival nhưng status không phải COMPLETED
                // → Cap ở 99% thay vì 100% để tránh hiển thị sai
                if (elapsedSeconds >= totalSeconds && delivery.getCurrentStatus() != DeliveryStatus.COMPLETED) {
                    log.warn("Delivery {} exceeded estimated arrival time but not completed yet. " +
                             "Status: {}, Expected: {}, Now: {}", 
                             delivery.getId(), delivery.getCurrentStatus(), end, now);
                    return 99; // Cap at 99% until actually completed
                }
                
                int progress = (int) Math.min(100, (elapsedSeconds * 100) / totalSeconds);
                return Math.max(0, progress);
            }
        }

        // Default based on status
        if (delivery.getCurrentStatus() == DeliveryStatus.LAUNCHED) {
            return 30;
        } else if (delivery.getCurrentStatus() == DeliveryStatus.ARRIVING) {
            return 80;
        }

        return 0;
    }
}

