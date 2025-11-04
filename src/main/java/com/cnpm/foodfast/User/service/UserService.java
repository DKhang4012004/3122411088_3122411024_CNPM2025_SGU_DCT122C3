package com.cnpm.foodfast.User.service;

import com.cnpm.foodfast.dto.request.User.UserAddressCreationRequest;
import com.cnpm.foodfast.dto.request.User.UserCreationRequest;
import com.cnpm.foodfast.dto.response.User.UserAddressResponse;
import com.cnpm.foodfast.dto.response.User.UserResponse;

import java.util.List;

public interface UserService {

    // User methods
    UserResponse createUser(UserCreationRequest request);
    UserResponse updateUser(UserCreationRequest request, String userId);
    UserResponse getUserById(String userId);
    String deleteUser(String userId);
    List<UserResponse> getAllUsers();

    // Admin methods
    UserResponse updateUserStatus(Long userId, String status);
    UserResponse updateUserRoles(Long userId, List<String> roleNames);

    // User Address methods
    UserAddressResponse addAddress(Long userId, UserAddressCreationRequest request);
    List<UserAddressResponse> getUserAddresses(Long userId);
    UserAddressResponse updateAddress(Long userId, Long addressId, UserAddressCreationRequest request);
    void deleteAddress(Long userId, Long addressId);
    UserAddressResponse setDefaultAddress(Long userId, Long addressId);
    UserAddressResponse getDefaultAddress(Long userId);
}
