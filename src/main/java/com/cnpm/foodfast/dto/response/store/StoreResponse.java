package com.cnpm.foodfast.dto.response.store;

import com.cnpm.foodfast.enums.StoreStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreResponse {
    Long id;
    Long ownerUserId;

    String name;
    String description;

    String bankAccountName;
    String bankAccountNumber;
    String bankName;
    String bankBranch;
    String payoutEmail;

    StoreStatus storeStatus;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
