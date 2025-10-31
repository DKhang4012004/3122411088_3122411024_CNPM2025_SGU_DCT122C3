package com.cnpm.foodfast.Store.controller;

import com.cnpm.foodfast.dto.response.store.StoreWithProductsResponse;
import com.cnpm.foodfast.Store.service.StoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StoreController {

    private final StoreService storeService;

    /**
     * Get store information with all products by store ID
     * Endpoint: GET /api/stores/{storeId}/products
     */
    @GetMapping("/{storeId}/products")
    public ResponseEntity<StoreWithProductsResponse> getStoreWithProducts(@PathVariable Long storeId) {
        log.info("REST request to get store with products: {}", storeId);
        StoreWithProductsResponse response = storeService.getStoreWithProducts(storeId);
        return ResponseEntity.ok(response);
    }

    /**
     * Get store information with all products by product ID
     * Endpoint: GET /api/stores/by-product/{productId}
     * Use case: User clicks on a product, see the store and all products from that store
     */
    @GetMapping("/by-product/{productId}")
    public ResponseEntity<StoreWithProductsResponse> getStoreByProductId(@PathVariable Long productId) {
        log.info("REST request to get store with products by product ID: {}", productId);
        StoreWithProductsResponse response = storeService.getStoreWithProductsByProductId(productId);
        return ResponseEntity.ok(response);
    }
}
