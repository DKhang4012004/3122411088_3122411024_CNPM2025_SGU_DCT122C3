package com.cnpm.foodfast.dto.request.product;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductRequest {
    private Long categoryId;
    private Long storeId;
    private String sku;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private String currency;
    private String mediaPrimaryUrl;
    private Integer safetyStock;
    private Integer quantityAvailable;
    private Integer reservedQuantity;
    private String extraJson;
    private Integer weightGram;
    private BigDecimal lengthCm;
    private BigDecimal widthCm;
    private BigDecimal heightCm;
}
