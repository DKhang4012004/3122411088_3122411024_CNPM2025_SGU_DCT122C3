package com.cnpm.foodfast.mapper;

import com.cnpm.foodfast.dto.response.DroneResponse;
import com.cnpm.foodfast.entity.Drone;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface DroneMapper {

    DroneResponse toDroneResponse(Drone drone);
}








