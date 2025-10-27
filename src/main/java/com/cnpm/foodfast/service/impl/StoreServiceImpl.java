package com.cnpm.foodfast.service.impl;

import com.cnpm.foodfast.dto.request.store.StoreRequest;
import com.cnpm.foodfast.dto.response.store.StoreResponse;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.entity.StoreAddress;
import com.cnpm.foodfast.entity.UserAddress;
import com.cnpm.foodfast.enums.StoreStatus;
import com.cnpm.foodfast.exception.AppException;
import com.cnpm.foodfast.exception.ErrorCode;
import com.cnpm.foodfast.mapper.StoreMapper;
import com.cnpm.foodfast.repository.StoreRepository;
import com.cnpm.foodfast.repository.StoreAddressRepository;
import com.cnpm.foodfast.repository.UserAddressRepository;
import com.cnpm.foodfast.service.ServiceInterface.StoreService;
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
    StoreAddressRepository storeAddressRepository;
    UserAddressRepository userAddressRepository;

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
        Store store= storeRepository.findById(storeId).orElseThrow(()-> new AppException(ErrorCode.STORE_NOT_EXISTED));
        storeMapper.updateStore(store,request);
        return storeMapper.toStoreResponse(store);

    }

    @Override
    public StoreResponse deleteStore(Long storeId) {
        Store store= storeRepository.findById(storeId).orElseThrow(()->  new AppException(ErrorCode.STORE_NOT_EXISTED));
        StoreResponse storeResponse = storeMapper.toStoreResponse(store);
        storeRepository.delete(store);
        return storeResponse;
    }


    @Override
    public StoreResponse changeStatus(Long storeId, StoreStatus status) {
        Store store= storeRepository.findById(storeId).orElseThrow(() ->  new AppException(ErrorCode.STORE_NOT_EXISTED));
        store.setStoreStatus(status);
        store=storeRepository.save(store);
        return storeMapper.toStoreResponse(store);
    }

    @Override
    public StoreResponse getStoreById(Long storeId) {
        Store store= storeRepository.findById(storeId).orElseThrow(() ->  new AppException(ErrorCode.STORE_NOT_EXISTED));
        return storeMapper.toStoreResponse(store);
    }

    @Override
    public List<StoreResponse> getAllStores() {
        List<Store> stores= storeRepository.findAll();
        return storeMapper.toStoreResponseList(stores);
    }

    @Override
    public List<StoreResponse> getSuggestedStoresForUser(Long userId) {
        // Lấy địa chỉ mặc định của khách hàng (isDefault = true)
        UserAddress defaultAddress = userAddressRepository.findByUserIdAndIsDefaultTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_DEFAULT_ADDRESS_NOT_FOUND));

        // Tìm các cửa hàng trong phạm vi bay an toàn dựa trên tọa độ địa chỉ mặc định
        List<StoreAddress> storeAddresses = storeAddressRepository.findStoresWithinFlightCorridor(
                defaultAddress.getLatitude().doubleValue(),
                defaultAddress.getLongitude().doubleValue()
        );

        // Chuyển đổi StoreAddress thành StoreResponse
        List<Store> suggestedStores = storeAddresses.stream()
                .map(StoreAddress::getStore)
                .filter(store -> store.getStoreStatus() == StoreStatus.ACTIVE)
                .toList();

        return storeMapper.toStoreResponseList(suggestedStores);
    }
}
