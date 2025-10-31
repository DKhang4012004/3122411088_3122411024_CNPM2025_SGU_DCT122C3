package com.cnpm.foodfast.dto.response.store;

import com.cnpm.foodfast.dto.response.product.ProductResponse;
import com.cnpm.foodfast.enums.StoreStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreWithProductsResponse {
    Long id;
    Long ownerUserId;
    String name;
    String description;
    String phoneNumber;
    String email;
    String logoUrl;
    Double rating;
    StoreStatus storeStatus;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Danh sách sản phẩm của cửa hàng
    List<ProductResponse> products;

    // Thống kê
    Integer totalProducts;
    Integer availableProducts;
}

