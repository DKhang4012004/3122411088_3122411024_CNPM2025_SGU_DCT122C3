package com.cnpm.foodfast.dto.request.payment;

import com.cnpm.foodfast.enums.PaymentMethod;
import com.cnpm.foodfast.enums.PaymentProvider;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentInitRequest {

    @NotNull(message = "Order ID is required")
    Long orderId;

    @NotNull(message = "Payment provider is required")
    PaymentProvider provider;

    @NotNull(message = "Payment method is required")
    PaymentMethod method;

    String returnUrl;
    String cancelUrl;
}

