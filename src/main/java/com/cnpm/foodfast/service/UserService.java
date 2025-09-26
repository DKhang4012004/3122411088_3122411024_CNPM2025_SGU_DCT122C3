package com.cnpm.foodfast.service;

import com.cnpm.foodfast.dto.request.User.UserCreationRequest;
import com.cnpm.foodfast.dto.response.User.UserResponse;

public interface UserService {
    UserResponse createUser(UserCreationRequest request);
    UserResponse updateUser(UserCreationRequest request, String userid);
    UserResponse getUserById(String userId);
    String deleteUser(String userId);
}
