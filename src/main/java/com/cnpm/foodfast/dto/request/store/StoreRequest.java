package com.cnpm.foodfast.dto.request.store;

import jakarta.validation.constraints.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreRequest {

    @NotNull(message = "Owner user ID is required")
    Long ownerUserId;

    @NotBlank(message = "Store name is required")
    @Size(max = 200, message = "Store name must not exceed 200 characters")
    String name;

    String description;

    @Pattern(regexp = "^[0-9+\\-\\s()]*$", message = "Invalid phone number format")
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    String phoneNumber;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    String email;

    String logoUrl;
}
