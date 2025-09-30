package com.cnpm.foodfast.service;

import com.cnpm.foodfast.config.JwtAuthenticationFilter;
import com.cnpm.foodfast.dto.request.Auth.LoginRequest;
import com.cnpm.foodfast.dto.response.Auth.AuthenticationResponse;
import com.cnpm.foodfast.entity.Roles;
import com.cnpm.foodfast.entity.User;
import com.cnpm.foodfast.enums.UserStatus;
import com.cnpm.foodfast.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {

    UserRepository userRepository;
    JwtService jwtService;
    PasswordEncoder passwordEncoder;

    @Override
    public AuthenticationResponse authenticate(LoginRequest request) {
        // Find user by username
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        // Check if user is active
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("User account is not active");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Extract roles
        Set<String> roles = user.getRoles().stream()
                .map(Roles::getName)
                .collect(Collectors.toSet());

        // Generate tokens
        String token = jwtService.generateToken(user.getUsername(), roles);
        String refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return AuthenticationResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .authenticated(true)
                .build();
    }

    @Override
    public void logout(String token) {
        if (token != null && jwtService.isTokenValid(token)) {
            JwtAuthenticationFilter.blacklistToken(token);
            log.info("Token has been blacklisted successfully");
        }
    }

    @Override
    public boolean validateToken(String token) {
        return jwtService.isTokenValid(token) && !jwtService.isTokenExpired(token);
    }

    @Override
    public String refreshToken(String refreshToken) {
        if (!jwtService.isTokenValid(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Set<String> roles = user.getRoles().stream()
                .map(Roles::getName)
                .collect(Collectors.toSet());

        return jwtService.generateToken(username, roles);
    }
}