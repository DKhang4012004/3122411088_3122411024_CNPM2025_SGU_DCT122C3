package com.cnpm.foodfast.service;


import com.cnpm.foodfast.dto.request.UserCreationRequest;
import com.cnpm.foodfast.dto.response.UserResponse;
import com.cnpm.foodfast.entity.User;
import com.cnpm.foodfast.mapper.UserMapper;
import com.cnpm.foodfast.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@RequiredArgsConstructor()
public class UserService {
     UserRepository userRepository;
     UserMapper mapper;

    public UserResponse createUser(UserCreationRequest request){
        User user = mapper.toUser(request);
        User savedUser = userRepository.save(user);
        return mapper.toResponse(savedUser);

    }

}
