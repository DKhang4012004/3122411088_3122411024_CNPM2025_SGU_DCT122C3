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
public class DroneStatusUpdateRequest {
    
    private DroneStatus status;
}
