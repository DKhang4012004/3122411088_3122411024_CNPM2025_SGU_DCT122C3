package com.cnpm.foodfast.Location.service;

import com.cnpm.foodfast.dto.request.location.LocationRequest;
import com.cnpm.foodfast.dto.response.store.StoreAddressResponse;

import java.util.List;

public interface LocationService {
    /**
     * Tìm các cửa hàng trong phạm vi hành lang bay an toàn
     * @param locationRequest Vị trí của người dùng
     * @return Danh sách các cửa hàng trong phạm vi hành lang bay
     */
    List<StoreAddressResponse> findStoresWithinFlightCorridor(LocationRequest locationRequest);
}