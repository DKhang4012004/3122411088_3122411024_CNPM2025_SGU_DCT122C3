package com.cnpm.foodfast.Store.service;

import com.cnpm.foodfast.dto.request.store.StoreAddressRequest;
import com.cnpm.foodfast.entity.StoreAddress;

import java.util.List;

public interface StoreAddressService {
    StoreAddress createAddress(Long storeId, StoreAddressRequest request);
    List<StoreAddress> getAddressesByStore(Long storeId);
    void deleteAddress(Long addressId);
}
