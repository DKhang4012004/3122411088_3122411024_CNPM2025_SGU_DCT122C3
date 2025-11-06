package com.cnpm.foodfast.dto.request.Auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
    private String username;
    private String password;
    private String email;
    private String fullName;
    private String phone;
    private String dateOfBirth; // Format: yyyy-MM-dd
    private String gender; // MALE, FEMALE, OTHER
    private Set<String> roles; // Set of role names: CUSTOMER, STORE_OWNER, ADMIN
}
