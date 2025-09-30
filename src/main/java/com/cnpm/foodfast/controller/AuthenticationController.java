package com.cnpm.foodfast.controller;

import com.cnpm.foodfast.dto.request.Auth.LoginRequest;
import com.cnpm.foodfast.dto.request.Auth.LogoutRequest;
import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.dto.response.Auth.AuthenticationResponse;
import com.cnpm.foodfast.service.AuthenticationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {

    AuthenticationService authenticationService;

    @PostMapping("/login")
    public APIResponse<AuthenticationResponse> login(@RequestBody LoginRequest request) {
        APIResponse<AuthenticationResponse> response = new APIResponse<>();
        try {
            AuthenticationResponse authResponse = authenticationService.authenticate(request);
            response.setResult(authResponse);
            response.setMessage("Login successful");
        } catch (Exception e) {
            response.setMessage(e.getMessage());
            response.setCode(401);
        }
        return response;
    }

    @PostMapping("/logout")
    public APIResponse<String> logout(@RequestBody LogoutRequest request) {
        APIResponse<String> response = new APIResponse<>();
        try {
            authenticationService.logout(request.getToken());
            response.setResult("Logout successful");
            response.setMessage("User logged out successfully");
        } catch (Exception e) {
            response.setMessage(e.getMessage());
            response.setCode(400);
        }
        return response;
    }

    @PostMapping("/validate")
    public APIResponse<Boolean> validateToken(@RequestParam String token) {
        APIResponse<Boolean> response = new APIResponse<>();
        try {
            boolean isValid = authenticationService.validateToken(token);
            response.setResult(isValid);
            response.setMessage(isValid ? "Token is valid" : "Token is invalid");
        } catch (Exception e) {
            response.setResult(false);
            response.setMessage(e.getMessage());
            response.setCode(400);
        }
        return response;
    }

    @PostMapping("/refresh")
    public APIResponse<String> refreshToken(@RequestParam String refreshToken) {
        APIResponse<String> response = new APIResponse<>();
        try {
            String newToken = authenticationService.refreshToken(refreshToken);
            response.setResult(newToken);
            response.setMessage("Token refreshed successfully");
        } catch (Exception e) {
            response.setMessage(e.getMessage());
            response.setCode(400);
        }
        return response;
    }
}
