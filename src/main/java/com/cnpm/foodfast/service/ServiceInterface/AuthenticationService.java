package com.cnpm.foodfast.service.ServiceInterface;

import com.cnpm.foodfast.dto.request.Auth.LoginRequest;
import com.cnpm.foodfast.dto.request.Auth.SignUpRequest;
import com.cnpm.foodfast.dto.response.Auth.AuthenticationResponse;
import com.cnpm.foodfast.dto.response.User.UserResponse;

public interface AuthenticationService {
    AuthenticationResponse authenticate(LoginRequest request);
    void logout(String token);
    boolean validateToken(String token);
    String refreshToken(String refreshToken);
    UserResponse signUp(SignUpRequest request);
}
