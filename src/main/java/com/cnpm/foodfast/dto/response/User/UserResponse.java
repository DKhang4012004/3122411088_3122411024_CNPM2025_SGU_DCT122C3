package com.cnpm.foodfast.dto.response.User;

import com.cnpm.foodfast.enums.Gender;
import com.cnpm.foodfast.enums.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {

    Long id;
    String username;
    String fullName;
    String email;
    String phone;

    UserStatus status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDate dateOfBirth;
    Gender gender;
}
