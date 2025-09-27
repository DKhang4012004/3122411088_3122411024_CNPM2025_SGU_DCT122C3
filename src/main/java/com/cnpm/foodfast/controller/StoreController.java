package com.cnpm.foodfast.controller;

import com.cnpm.foodfast.dto.request.store.StoreRequest;
import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.dto.response.store.StoreResponse;
import com.cnpm.foodfast.service.StoreServiceImpl;
import com.cnpm.foodfast.service.impl.StoreService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/stores")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoreController {
    StoreServiceImpl storeService;

    @PostMapping
    public APIResponse<StoreResponse> createStore(@RequestBody StoreRequest request) throws  Exception{
        return APIResponse.<StoreResponse>builder()
                .result(storeService.createStore(request))
                .build();
    }

    @PutMapping("/{storeId}")
    public APIResponse<StoreResponse> updateStore(@RequestBody StoreRequest request, @PathVariable Long storeId) throws  Exception{
        return APIResponse.<StoreResponse>builder()
                .result(storeService.updateStore(storeId, request))
                .build();
    }

    @GetMapping("/{storeId}")
    public APIResponse<StoreResponse> getStoreById(@PathVariable Long storeId) throws  Exception {
        return APIResponse.<StoreResponse>builder()
                .result(storeService.getStoreById(storeId))
                .build();
    }

    @DeleteMapping("/{storeId}")
    public APIResponse<StoreResponse> deleteStore(@PathVariable Long storeId) throws  Exception {
        return APIResponse.<StoreResponse>builder()
                .result(storeService.deleteStore(storeId))
                .message("Store with id: " + storeId + " has been deleted")
                .build();
    }

    @GetMapping
    public APIResponse<List<StoreResponse>> getAllStores(){
        return APIResponse.<List<StoreResponse>>builder()
                .result(storeService.getAllStores())
                .build();
    }
}
