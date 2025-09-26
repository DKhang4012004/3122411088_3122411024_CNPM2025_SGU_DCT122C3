package com.cnpm.foodfast.service;

import com.cnpm.foodfast.dto.request.User.UserCreationRequest;
import com.cnpm.foodfast.dto.response.User.UserResponse;
import com.cnpm.foodfast.entity.Roles;
import com.cnpm.foodfast.entity.User;
import com.cnpm.foodfast.enums.UserStatus;
import com.cnpm.foodfast.mapper.UserMapper;
import com.cnpm.foodfast.repository.RoleRepository;
import com.cnpm.foodfast.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    UserRepository userRepository;
    RoleRepository roleRepository;
    UserMapper mapper;
    PasswordEncoder passwordEncoder;

    @Override
    public UserResponse createUser(UserCreationRequest request) {
        User user = mapper.toUser(request);

        // Encode password
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Status mặc định
        user.setStatus(UserStatus.PENDING);

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
}
