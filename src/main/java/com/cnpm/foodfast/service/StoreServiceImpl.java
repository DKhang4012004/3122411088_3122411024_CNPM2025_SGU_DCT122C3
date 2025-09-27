package com.cnpm.foodfast.service;

import com.cnpm.foodfast.dto.request.store.StoreRequest;
import com.cnpm.foodfast.dto.response.store.StoreResponse;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.enums.StoreStatus;
import com.cnpm.foodfast.mapper.StoreMapper;
import com.cnpm.foodfast.repository.StoreRepository;
import com.cnpm.foodfast.service.impl.StoreService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreServiceImpl implements StoreService {

    StoreMapper storeMapper;
    StoreRepository storeRepository;

    @Override
    @Transactional
    public StoreResponse createStore(StoreRequest request) {
        Store store = storeMapper.toStore(request);

        store.setStoreStatus(StoreStatus.ACTIVE);
        store=storeRepository.save(store);

        return storeMapper.toStoreResponse(store);
    }

    @Override
    public StoreResponse updateStore(Long storeId, StoreRequest request) {
        Store store= storeRepository.findById(storeId).orElseThrow(()-> new RuntimeException("store Id not found"));
        storeMapper.updateStore(store,request);
        return storeMapper.toStoreResponse(store);

    }

    @Override
    public StoreResponse deleteStore(Long storeId) {
        Store store= storeRepository.findById(storeId).orElseThrow(()-> new RuntimeException("store Id not found"));
        StoreResponse storeResponse = storeMapper.toStoreResponse(store);
        storeRepository.delete(store);
        return storeResponse;
    }


    @Override
    public StoreResponse changeStatus(Long storeId, StoreStatus status) {
        Store store= storeRepository.findById(storeId).orElseThrow(() -> new RuntimeException("store Id not found"));
        store.setStoreStatus(status);
        store=storeRepository.save(store);
        return storeMapper.toStoreResponse(store);
    }

    @Override
    public StoreResponse getStoreById(Long storeId) {
        Store store= storeRepository.findById(storeId).orElseThrow(() -> new RuntimeException("store Id not found"));
        return storeMapper.toStoreResponse(store);
    }

    @Override
    public List<StoreResponse> getAllStores() {
        List<Store> stores= storeRepository.findAll();
        return storeMapper.toStoreResponseList(stores);
    }
}
