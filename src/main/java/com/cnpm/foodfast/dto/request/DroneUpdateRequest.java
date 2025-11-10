package com.cnpm.foodfast.dto.request;

import com.cnpm.foodfast.enums.DroneStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DroneUpdateRequest {
    
    private String name;
    private String code;
    private String model;
    private String serialNumber;
    private Double maxPayload;
    private Double maxRange;
    private Integer batteryLevel;
    private DroneStatus status;
    private Double currentLatitude;
    private Double currentLongitude;
}
