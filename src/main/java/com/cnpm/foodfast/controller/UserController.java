package com.cnpm.foodfast.controller;

import com.cnpm.foodfast.dto.request.UserCreationRequest;
import com.cnpm.foodfast.dto.response.APIResponse;
import com.cnpm.foodfast.dto.response.UserResponse;
import com.cnpm.foodfast.mapper.UserMapper;
import com.cnpm.foodfast.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor

@RequestMapping("/users")
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class UserController {
    UserService userService;
    UserMapper userMapper;

    @PostMapping
    public APIResponse<UserResponse> createUser(@RequestBody UserCreationRequest request) {
        APIResponse<UserResponse> response = new APIResponse<>();
        response.setResult(userService.createUser(request));
        return response;
    }
}
