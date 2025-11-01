package com.cnpm.foodfast.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DroneRegisterRequest {
    
    private String code;  // Unique drone ID (e.g., "DRONE001")
    
    private String model; // Phone model (e.g., "iPhone 13")
    
    private Integer maxPayloadGram; // Max payload (default 2000g)
    
    private BigDecimal latitude;  // Initial GPS location
    
    private BigDecimal longitude; // Initial GPS location
}
