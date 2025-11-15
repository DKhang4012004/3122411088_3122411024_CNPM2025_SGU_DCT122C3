package com.cnpm.foodfast.dto.response.delivery;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Position {
    private BigDecimal latitude;
    private BigDecimal longitude;
    
    public Position(Double lat, Double lng) {
        this.latitude = BigDecimal.valueOf(lat);
        this.longitude = BigDecimal.valueOf(lng);
    }
}
