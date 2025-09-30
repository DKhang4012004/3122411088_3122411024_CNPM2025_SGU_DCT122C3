package com.cnpm.foodfast.service;

import com.cnpm.foodfast.dto.request.Auth.LoginRequest;
import com.cnpm.foodfast.dto.response.Auth.AuthenticationResponse;

public interface AuthenticationService {
    AuthenticationResponse authenticate(LoginRequest request);
    void logout(String token);
    boolean validateToken(String token);
    String refreshToken(String refreshToken);
}
