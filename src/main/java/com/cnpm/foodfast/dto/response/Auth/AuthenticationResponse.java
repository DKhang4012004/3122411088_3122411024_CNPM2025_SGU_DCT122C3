package com.cnpm.foodfast.dto.response.Auth;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationResponse {
    String token;
    String refreshToken;
    String username;
    String email;
    String fullName;
    Set<String> roles;
    boolean authenticated;
}