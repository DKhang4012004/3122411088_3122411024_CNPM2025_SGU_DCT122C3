package com.cnpm.foodfast.mapper;

import com.cnpm.foodfast.dto.request.UserCreationRequest;
import com.cnpm.foodfast.dto.response.UserResponse;
import com.cnpm.foodfast.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    User toUser(UserCreationRequest request);
    UserResponse toResponse(User user);
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)

    void updateUser(@MappingTarget User user, UserCreationRequest request);

}

