package com.cnpm.foodfast.controller;

import com.cnpm.foodfast.dto.request.store.StoreAddressRequest;
import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.dto.response.store.StoreAddressResponse;
import com.cnpm.foodfast.service.StoreAddressImpl;
import com.cnpm.foodfast.service.impl.StoreAddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stores/{storeId}/addresses")
@RequiredArgsConstructor
public class StoreAddressController {

    private final StoreAddressImpl storeAddressService;

    @PostMapping
    public APIResponse<StoreAddressResponse> create(@PathVariable Long storeId, @RequestBody StoreAddressRequest request) {
        return APIResponse.<StoreAddressResponse>builder()
                .result(storeAddressService.createAddress(storeId, request))
                .build();

    }

    @PutMapping("/{addressId}")
    public APIResponse<StoreAddressResponse> update(@PathVariable Long storeId,
                                       @PathVariable Long addressId,
                                       @RequestBody StoreAddressRequest request) {
        // storeId để đảm bảo address này thuộc đúng store
        return APIResponse.<StoreAddressResponse>builder()
                .result(storeAddressService.updateAddress(addressId, request))
                .build();
    }

    @GetMapping
    public APIResponse<List<StoreAddressResponse>> getAddressByStore(@PathVariable Long storeId) {
        return APIResponse.<List<StoreAddressResponse>>builder()
                .result(storeAddressService.getAddressesByStore(storeId))
                .build();
    }

    @DeleteMapping("/{addressId}")
    public APIResponse<Void> deleteAddress(@PathVariable Long addressId, @PathVariable String storeId) {
        storeAddressService.deleteAddress(addressId);
        return APIResponse.<Void>builder()
                .message("Address deleted successfully")
                .build();
    }

}
