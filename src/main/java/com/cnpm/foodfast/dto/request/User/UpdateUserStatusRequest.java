package com.cnpm.foodfast.dto.request.User;

import com.cnpm.foodfast.enums.UserStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateUserStatusRequest {
    UserStatus status;
}
