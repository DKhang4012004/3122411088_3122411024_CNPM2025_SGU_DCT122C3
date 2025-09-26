package com.cnpm.foodfast.controller;

import com.cnpm.foodfast.dto.request.User.UserCreationRequest;
import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.dto.response.User.UserResponse;
import com.cnpm.foodfast.service.UserService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @PostMapping({"/userCreated"})
    public APIResponse<UserResponse> createUser(@RequestBody UserCreationRequest request) {
        APIResponse<UserResponse> response = new APIResponse<>();
        response.setResult(userService.createUser(request));
        return response;
    }

    @PutMapping({"/{userId}"})
    public APIResponse<UserResponse> updateUser(@RequestBody UserCreationRequest request, @PathVariable String userId) {
        APIResponse<UserResponse> response = new APIResponse<>();
        response.setResult(userService.updateUser(request, userId));
        return response;
    }

    @GetMapping({"/{userId}"})
    public APIResponse<UserResponse> getUserById(@PathVariable String userId) {
        APIResponse<UserResponse> response = new APIResponse<>();
        response.setResult(userService.getUserById(userId));
        return response;
    }

    @DeleteMapping({"/{userId}"})
    public APIResponse<String> deleteUser(@PathVariable String userId) {
        APIResponse<String> response = new APIResponse<>();
        response.setResult(userService.deleteUser(userId));
        return response;
    }
}
