package com.cnpm.foodfast.dto.response.delivery;

import com.cnpm.foodfast.enums.DeliveryStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryTrackingResponse {
    private Long deliveryId;
    private Long orderId;
    private String orderCode;
    private DeliveryStatus status;
    
    // Positions
    private Position dronePosition;
    private Position storePosition;
    private Position customerPosition;
    
    // Progress info
    private Integer progress; // 0-100%
    private Double distanceKm;
    private LocalDateTime estimatedArrival;
    private LocalDateTime actualDeparture;
    
    // Drone info
    private Long droneId;
    private String droneModel;
    private Integer batteryPercent;
}
