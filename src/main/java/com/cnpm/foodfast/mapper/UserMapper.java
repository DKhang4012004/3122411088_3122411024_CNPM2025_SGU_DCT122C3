package com.cnpm.foodfast.mapper;

import com.cnpm.foodfast.dto.request.UserCreationRequest;
import com.cnpm.foodfast.dto.response.UserResponse;
import com.cnpm.foodfast.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    User toUser(UserCreationRequest request);
    UserResponse toResponse(User user);

}
