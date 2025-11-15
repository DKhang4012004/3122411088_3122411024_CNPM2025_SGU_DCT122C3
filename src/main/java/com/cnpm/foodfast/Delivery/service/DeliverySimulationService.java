package com.cnpm.foodfast.Delivery.service;

import com.cnpm.foodfast.Delivery.repository.DeliveryRepository;
import com.cnpm.foodfast.Drone.repository.DroneRepository;
import com.cnpm.foodfast.Order.repository.OrderRepository;
import com.cnpm.foodfast.Store.repository.StoreRepository;
import com.cnpm.foodfast.entity.Delivery;
import com.cnpm.foodfast.entity.Drone;
import com.cnpm.foodfast.entity.Order;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.entity.StoreAddress;
import com.cnpm.foodfast.enums.DeliveryStatus;
import com.cnpm.foodfast.enums.DroneStatus;
import com.cnpm.foodfast.enums.OrderStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliverySimulationService {

    private final DeliveryRepository deliveryRepository;
    private final DroneRepository droneRepository;
    private final OrderRepository orderRepository;
    private final StoreRepository storeRepository;
    private final ObjectMapper objectMapper;

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);

    @Value("${app.delivery.simulation.enabled:true}")
    private boolean simulationEnabled;

    @Value("${app.delivery.simulation.prep-time-minutes:5}")
    private double prepTimeMinutes;

    @Value("${app.delivery.simulation.update-interval-seconds:10}")
    private int updateIntervalSeconds;

    /**
     * Bắt đầu simulation giao hàng tự động
     */
    public void startSimulation(Long deliveryId) {
        if (!simulationEnabled) {
            log.info("Delivery simulation is disabled");
            return;
        }

        try {
            Delivery delivery = deliveryRepository.findById(deliveryId)
                    .orElseThrow(() -> new RuntimeException("Delivery not found: " + deliveryId));

            if (delivery.getCurrentStatus() != DeliveryStatus.ASSIGNED) {
                log.warn("Cannot start simulation for delivery {} - status is not ASSIGNED", deliveryId);
                return;
            }

            log.info("🚁 Starting delivery simulation for delivery ID: {}", deliveryId);

            // Lấy tọa độ store và customer
            Coordinates storeCoords = getStoreCoordinates(delivery.getPickupStoreId());
            Coordinates customerCoords = getCustomerCoordinates(delivery.getDropoffAddressSnapshot());

            int totalMinutes = delivery.getEstimatedFlightTimeMinutes();
            if (totalMinutes <= 0) {
                totalMinutes = 1; // Default 1 minute for quick demo
            }

            // BƯỚC 1: Sau prepTime (0.5 phút = 30 giây) → LAUNCHED
            int launchDelaySeconds = (int) (prepTimeMinutes * 60);
            scheduler.schedule(() -> {
                launchDelivery(deliveryId);
            }, launchDelaySeconds, TimeUnit.SECONDS);

            // BƯỚC 2: Cập nhật vị trí drone liên tục (từ launch đến arriving)
            // totalMinutes là thời gian bay THỰC TẾ (2 phút), chứ không phải tổng thời gian từ đầu
            int flightTimeSeconds = totalMinutes * 60; // 2 phút = 120 giây
            int arrivingThresholdSeconds = (int) (flightTimeSeconds * 0.8); // 80% = 96 giây
            int totalUpdates = arrivingThresholdSeconds / updateIntervalSeconds; // 96/5 = 19 updates
            
            log.info("📊 Flight simulation: {} seconds, {} updates every {} seconds", 
                     flightTimeSeconds, totalUpdates, updateIntervalSeconds);
            
            for (int i = 1; i <= totalUpdates; i++) {
                final int step = i;
                long delaySeconds = launchDelaySeconds + (step * updateIntervalSeconds);

                scheduler.schedule(() -> {
                    updateDronePosition(deliveryId, storeCoords, customerCoords, step, totalUpdates);
                }, delaySeconds, TimeUnit.SECONDS);
            }

            // BƯỚC 3: Đến 80% thời gian bay → ARRIVING
            long arrivingDelaySeconds = launchDelaySeconds + arrivingThresholdSeconds;
            scheduler.schedule(() -> {
                updateToArriving(deliveryId);
            }, arrivingDelaySeconds, TimeUnit.SECONDS);

            // ⚠️ KHÔNG TỰ ĐỘNG COMPLETE - Khách hàng phải xác nhận "Đã nhận hàng"
            // BƯỚC 4 đã bị TẮT: Customer phải click "Đã nhận hàng" để complete
            log.info("✅ Simulation scheduled for delivery {}. Will reach ARRIVING in {} seconds. Customer must confirm receipt.", 
                     deliveryId, arrivingDelaySeconds);

        } catch (Exception e) {
            log.error("Error starting simulation for delivery {}: {}", deliveryId, e.getMessage(), e);
        }
    }

    /**
     * Drone cất cánh
     */
    @Transactional
    protected void launchDelivery(Long deliveryId) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery == null || delivery.getCurrentStatus() != DeliveryStatus.ASSIGNED) {
                return;
            }

            delivery.setCurrentStatus(DeliveryStatus.LAUNCHED);
            delivery.setActualDepartureTime(LocalDateTime.now());
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryRepository.save(delivery);

            // Update order status
            Order order = orderRepository.findById(delivery.getOrderId()).orElse(null);
            if (order != null) {
                order.setStatus(OrderStatus.IN_DELIVERY);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
            }

            // ⭐ SET DRONE POSITION TO STORE (starting point)
            if (delivery.getDroneId() != null) {
                Drone drone = droneRepository.findById(delivery.getDroneId()).orElse(null);
                if (drone != null) {
                    Coordinates storeCoords = getStoreCoordinates(delivery.getPickupStoreId());
                    drone.setLastLatitude(storeCoords.latitude);
                    drone.setLastLongitude(storeCoords.longitude);
                    drone.setLastTelemetryAt(LocalDateTime.now());
                    droneRepository.save(drone);
                    log.info("✈️ Drone {} positioned at store: {}, {}", 
                             drone.getId(), storeCoords.latitude, storeCoords.longitude);
                }
            }

            log.info("🚁 Delivery {} LAUNCHED - Drone is taking off", deliveryId);

        } catch (Exception e) {
            log.error("Error launching delivery {}: {}", deliveryId, e.getMessage());
        }
    }

    /**
     * Cập nhật vị trí drone (interpolation giữa store và customer)
     */
    @Transactional
    protected void updateDronePosition(Long deliveryId, Coordinates start, Coordinates end, 
                                       int currentStep, int totalSteps) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery == null || delivery.getDroneId() == null) {
                return;
            }

            Drone drone = droneRepository.findById(delivery.getDroneId()).orElse(null);
            if (drone == null) {
                return;
            }

            // Tính vị trí hiện tại theo % quãng đường
            double progress = (double) currentStep / totalSteps;
            BigDecimal currentLat = interpolate(start.latitude, end.latitude, progress);
            BigDecimal currentLng = interpolate(start.longitude, end.longitude, progress);

            // Update drone position
            drone.setLastLatitude(currentLat);
            drone.setLastLongitude(currentLng);
            drone.setLastTelemetryAt(LocalDateTime.now());
            
            // Simulate battery drain (giảm 1% mỗi update)
            if (drone.getCurrentBatteryPercent() != null && drone.getCurrentBatteryPercent() > 20) {
                drone.setCurrentBatteryPercent(drone.getCurrentBatteryPercent() - 1);
            }
            
            droneRepository.save(drone);

            log.debug("📍 Drone {} position updated: {}, {} ({}%)", 
                     drone.getId(), currentLat, currentLng, (int)(progress * 100));

        } catch (Exception e) {
            log.error("Error updating drone position: {}", e.getMessage());
        }
    }

    /**
     * Drone đang đến gần
     */
    @Transactional
    protected void updateToArriving(Long deliveryId) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery == null || delivery.getCurrentStatus() != DeliveryStatus.LAUNCHED) {
                return;
            }

            delivery.setCurrentStatus(DeliveryStatus.ARRIVING);
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryRepository.save(delivery);

            log.info("🚁 Delivery {} ARRIVING - Drone is near destination", deliveryId);

        } catch (Exception e) {
            log.error("Error updating delivery to ARRIVING: {}", e.getMessage());
        }
    }

    /**
     * Hoàn thành giao hàng
     */
    @Transactional
    protected void completeDelivery(Long deliveryId, Coordinates customerCoords) {
        try {
            Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
            if (delivery == null) {
                return;
            }

            delivery.setCurrentStatus(DeliveryStatus.COMPLETED);
            delivery.setActualArrivalTime(LocalDateTime.now());
            delivery.setUpdatedAt(LocalDateTime.now());
            deliveryRepository.save(delivery);

            // Update order status
            Order order = orderRepository.findById(delivery.getOrderId()).orElse(null);
            if (order != null) {
                order.setStatus(OrderStatus.DELIVERED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
            }

            // Drone về trạng thái AVAILABLE và vị trí customer
            if (delivery.getDroneId() != null) {
                Drone drone = droneRepository.findById(delivery.getDroneId()).orElse(null);
                if (drone != null) {
                    drone.setStatus(DroneStatus.AVAILABLE);
                    drone.setLastLatitude(customerCoords.latitude);
                    drone.setLastLongitude(customerCoords.longitude);
                    drone.setLastTelemetryAt(LocalDateTime.now());
                    droneRepository.save(drone);
                }
            }

            log.info("✅ Delivery {} COMPLETED - Order delivered successfully", deliveryId);

        } catch (Exception e) {
            log.error("Error completing delivery {}: {}", deliveryId, e.getMessage());
        }
    }

    /**
     * Linear interpolation giữa 2 giá trị
     */
    private BigDecimal interpolate(BigDecimal start, BigDecimal end, double progress) {
        double startVal = start.doubleValue();
        double endVal = end.doubleValue();
        double result = startVal + (endVal - startVal) * progress;
        return BigDecimal.valueOf(result);
    }

    /**
     * Lấy tọa độ store từ address
     */
    private Coordinates getStoreCoordinates(Long storeId) {
        try {
            Store store = storeRepository.findById(storeId)
                    .orElseThrow(() -> new RuntimeException("Store not found"));

            if (store.getAddresses() != null && !store.getAddresses().isEmpty()) {
                StoreAddress address = store.getAddresses().get(0);
                if (address.getLatitude() != null && address.getLongitude() != null) {
                    return new Coordinates(
                            BigDecimal.valueOf(address.getLatitude().doubleValue()), 
                            BigDecimal.valueOf(address.getLongitude().doubleValue())
                    );
                }
            }

            // Default coordinates (HCMC center)
            log.warn("Store {} has no coordinates, using default", storeId);
            return new Coordinates(
                    BigDecimal.valueOf(10.762622), 
                    BigDecimal.valueOf(106.660172)
            );

        } catch (Exception e) {
            log.error("Error getting store coordinates: {}", e.getMessage());
            return new Coordinates(
                    BigDecimal.valueOf(10.762622), 
                    BigDecimal.valueOf(106.660172)
            );
        }
    }

    /**
     * Parse tọa độ customer từ JSON address snapshot
     */
    private Coordinates getCustomerCoordinates(String addressSnapshot) {
        try {
            if (addressSnapshot != null && !addressSnapshot.isEmpty()) {
                JsonNode node = objectMapper.readTree(addressSnapshot);
                
                if (node.has("latitude") && node.has("longitude")) {
                    return new Coordinates(
                            BigDecimal.valueOf(node.get("latitude").asDouble()),
                            BigDecimal.valueOf(node.get("longitude").asDouble())
                    );
                }
            }

            // Default: Random location gần store (khoảng 0.01 degree ~ 1km)
            log.warn("No customer coordinates in address snapshot, using random nearby location");
            return new Coordinates(
                    BigDecimal.valueOf(10.762622 + (Math.random() * 0.02 - 0.01)),
                    BigDecimal.valueOf(106.660172 + (Math.random() * 0.02 - 0.01))
            );

        } catch (Exception e) {
            log.error("Error parsing customer coordinates: {}", e.getMessage());
            return new Coordinates(
                    BigDecimal.valueOf(10.772622),
                    BigDecimal.valueOf(106.670172)
            );
        }
    }

    /**
     * Helper class cho coordinates
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class Coordinates {
        private BigDecimal latitude;
        private BigDecimal longitude;
    }
}
