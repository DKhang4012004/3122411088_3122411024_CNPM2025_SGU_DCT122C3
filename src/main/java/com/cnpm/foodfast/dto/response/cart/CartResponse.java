package com.cnpm.foodfast.dto.response.cart;

import com.cnpm.foodfast.enums.CartStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {

    private Long id;
    private Long userId;
    private CartStatus status;
    private List<CartItemResponse> items;
    private Integer totalItems;
    private BigDecimal totalAmount;
    private Integer totalWeightGram;
    private Boolean isOverWeightLimit;
    private String weightWarningMessage;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
