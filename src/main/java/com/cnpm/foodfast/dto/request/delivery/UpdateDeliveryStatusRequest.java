package com.cnpm.foodfast.dto.request.delivery;

import com.cnpm.foodfast.enums.DeliveryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateDeliveryStatusRequest {

    @NotNull(message = "Status is required")
    DeliveryStatus status;

    String notes;
}

