package com.cnpm.foodfast.dto.request.order;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateOrderRequest {

    Long deliveryAddressId;
    String deliveryNote;
    String voucherCode;
    String deliveryAddressSnapshot; // JSON string: {"address":"...", "lat":10.772, "lng":106.660}
}
