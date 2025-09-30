package com.cnpm.foodfast.dto.response.category;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCategoryResponse {
    Long id;
    String name;
    String slug;
    String description;
    String status;
    Long parentId;
    String path;
    Byte level;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
