package com.cnpm.foodfast.dto.response.store;

import com.cnpm.foodfast.enums.StoreStatus;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
    String phoneNumber;
    String email;
    String logoUrl;
    Double rating;
    StoreStatus storeStatus;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
