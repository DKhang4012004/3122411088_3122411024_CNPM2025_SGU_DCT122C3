package com.cnpm.foodfast.service;

import com.cnpm.foodfast.dto.request.store.StoreAddressRequest;
import com.cnpm.foodfast.dto.response.store.StoreAddressResponse;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.entity.StoreAddress;
import com.cnpm.foodfast.exception.AppException;
import com.cnpm.foodfast.exception.ErrorCode;
import com.cnpm.foodfast.mapper.StoreMapper;
import com.cnpm.foodfast.repository.StoreAddressRepository;
import com.cnpm.foodfast.repository.StoreRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreAddressImpl extends StoreAddress {
    StoreMapper storeMapper;
    StoreRepository storeRepository;
    StoreAddressRepository storeAddressRepository;

    public StoreAddressResponse createAddress(Long storeId, StoreAddressRequest request){
        Store store= storeRepository.findById(storeId).orElseThrow(() ->   new AppException(ErrorCode.STORE_NOT_EXISTED));

        StoreAddress storeAddress= storeMapper.toStoreAddress(request);
        storeAddress.setStore(store);
        storeAddressRepository.save(storeAddress);
        return storeMapper.toStoreAddressResponse(storeAddress);
    }

    public StoreAddressResponse updateAddress(Long addressId, StoreAddressRequest request){
        StoreAddress storeAddress= storeAddressRepository.findById(addressId).orElseThrow(() ->  new AppException(ErrorCode.ADDREESS_NOT_EXISTED));
        storeMapper.updateStoreAddress(storeAddress,request);
        storeAddressRepository.save(storeAddress);
        return storeMapper.toStoreAddressResponse(storeAddress);
    }

    public List<StoreAddressResponse> getAddressesByStore(Long storeId){
        return storeAddressRepository.findByStore_Id(storeId)
                .stream()
                .map(storeMapper::toStoreAddressResponse)
                .toList();
    }

    public void deleteAddress(Long addressId){
        StoreAddress storeAddress= storeAddressRepository.findById(addressId).orElseThrow(() -> new AppException(ErrorCode.ADDREESS_NOT_EXISTED));
        storeAddressRepository.delete(storeAddress);
    }

}
