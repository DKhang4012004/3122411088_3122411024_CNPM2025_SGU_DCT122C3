package com.cnpm.foodfast.Store.service;

import com.cnpm.foodfast.dto.request.store.StoreRequest;
import com.cnpm.foodfast.dto.response.store.StoreResponse;
import com.cnpm.foodfast.enums.StoreStatus;

import java.util.List;

public interface StoreService {
    StoreResponse createStore(StoreRequest request);
    StoreResponse updateStore(Long storeId, StoreRequest request);

    StoreResponse deleteStore(Long storeId);

    StoreResponse changeStatus(Long storeId, StoreStatus status);
    StoreResponse getStoreById(Long storeId);
    List<StoreResponse> getAllStores(); // filter theo status
}