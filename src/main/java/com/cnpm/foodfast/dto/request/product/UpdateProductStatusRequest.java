package com.cnpm.foodfast.dto.request.product;

import com.cnpm.foodfast.enums.ProductStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProductStatusRequest {
    ProductStatus status;
}
