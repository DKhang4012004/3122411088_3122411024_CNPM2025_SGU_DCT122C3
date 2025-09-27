package com.cnpm.foodfast.service;

import com.cnpm.foodfast.dto.request.User.UserAddressCreationRequest;
import com.cnpm.foodfast.dto.request.User.UserCreationRequest;
import com.cnpm.foodfast.dto.response.User.UserAddressResponse;
import com.cnpm.foodfast.dto.response.User.UserResponse;
import com.cnpm.foodfast.entity.Roles;
import com.cnpm.foodfast.entity.User;
import com.cnpm.foodfast.entity.UserAddress;
import com.cnpm.foodfast.enums.UserStatus;
import com.cnpm.foodfast.mapper.UserMapper;
import com.cnpm.foodfast.repository.RoleRepository;
import com.cnpm.foodfast.repository.UserAddressRepository;
import com.cnpm.foodfast.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    UserAddressRepository userAddressRepository;
    UserMapper mapper;
    PasswordEncoder passwordEncoder;

    @Override
    public UserResponse createUser(UserCreationRequest request) {
        User user = mapper.toUser(request);

        // Encode password
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Status mặc định
        user.setStatus(UserStatus.ACTIVE);

        // Gán roles cho user
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            Set<Roles> roles = new HashSet<>();
            for (Long roleId : request.getRoleIds()) {
                Roles role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
                roles.add(role);
            }
            user.setRoles(roles);
        }

        User savedUser = userRepository.save(user);
        return mapper.toResponse(savedUser);
    }

    @Override
    public UserResponse updateUser(UserCreationRequest request, String userId) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update các field cơ bản
        mapper.updateUser(user, request);

        // Encode password nếu request có gửi
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        // Update roles nếu có roleIds trong request
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            Set<Roles> roles = new HashSet<>();
            for (Long roleId : request.getRoleIds()) {
                Roles role = roleRepository.findById(roleId)
                        .orElseThrow(() -> new RuntimeException("Role not found with id: " + roleId));
                roles.add(role);
            }
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        return mapper.toResponse(updatedUser);
    }

    @Override
    public UserResponse getUserById(String userId) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapper.toResponse(user);
    }

    @Override
    public String deleteUser(String userId) {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        userRepository.delete(user);
        return "User deleted successfully";
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList(); // Java 16+ (thay vì Collectors.toList())
    }


    // User Address methods
    @Override
    @Transactional
    public UserAddressResponse addAddress(Long userId, UserAddressCreationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserAddress userAddress = mapper.toUserAddress(request);
        userAddress.setUser(user);

        if (request.getIsDefault() == null) {
            request.setIsDefault(false);
        }

        if (request.getIsDefault() || userAddressRepository.countByUserId(userId) == 0) {
            // Clear existing default address if setting new default
            if (request.getIsDefault()) {
                userAddressRepository.clearDefaultAddressForUser(userId);
            }
            userAddress.setIsDefault(true);
        }

        UserAddress savedAddress = userAddressRepository.save(userAddress);
        return mapper.toUserAddressResponse(savedAddress);
    }

    @Override
    public List<UserAddressResponse> getUserAddresses(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        List<UserAddress> addresses = userAddressRepository.findByUserId(userId);
        return addresses.stream()
                .map(mapper::toUserAddressResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserAddressResponse updateAddress(Long userId, Long addressId, UserAddressCreationRequest request) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserAddress userAddress = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        // Verify that the address belongs to the user
        if (!userAddress.getUser().getId().equals(userId)) {
            throw new RuntimeException("Address does not belong to the specified user");
        }

        // Update the address fields
        mapper.updateUserAddress(userAddress, request);

        // Handle default address logic
        if (request.getIsDefault() != null && request.getIsDefault()) {
            userAddressRepository.clearDefaultAddressForUser(userId);
            userAddress.setIsDefault(true);
        }

        UserAddress updatedAddress = userAddressRepository.save(userAddress);
        return mapper.toUserAddressResponse(updatedAddress);
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserAddress userAddress = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        // Verify that the address belongs to the user
        if (!userAddress.getUser().getId().equals(userId)) {
            throw new RuntimeException("Address does not belong to the specified user");
        }

        boolean wasDefault = userAddress.getIsDefault();
        userAddressRepository.delete(userAddress);

        // If we deleted the default address, set another address as default if available
        if (wasDefault) {
            List<UserAddress> remainingAddresses = userAddressRepository.findByUserId(userId);
            if (!remainingAddresses.isEmpty()) {
                UserAddress firstAddress = remainingAddresses.get(0);
                firstAddress.setIsDefault(true);
                userAddressRepository.save(firstAddress);
            }
        }
    }

    @Override
    @Transactional
    public UserAddressResponse setDefaultAddress(Long userId, Long addressId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserAddress userAddress = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        // Verify that the address belongs to the user
        if (!userAddress.getUser().getId().equals(userId)) {
            throw new RuntimeException("Address does not belong to the specified user");
        }

        // Clear existing default and set new default
        userAddressRepository.clearDefaultAddressForUser(userId);
        userAddress.setIsDefault(true);

        UserAddress updatedAddress = userAddressRepository.save(userAddress);
        return mapper.toUserAddressResponse(updatedAddress);
    }

    @Override
    public UserAddressResponse getDefaultAddress(Long userId) {
        // Verify user exists
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        UserAddress defaultAddress = userAddressRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new RuntimeException("No default address found for user"));

        return mapper.toUserAddressResponse(defaultAddress);
    }
}
