package com.cnpm.foodfast.Store.controller;

import com.cnpm.foodfast.dto.request.store.StoreRequest;
import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.dto.response.store.StoreResponse;
import com.cnpm.foodfast.dto.response.store.StoreWithProductsResponse;
import com.cnpm.foodfast.enums.StoreStatus;
import com.cnpm.foodfast.Store.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class StoreController {

    private final StoreService storeService;

    /**
     * Create new store
     */
    @PostMapping
    public APIResponse<StoreResponse> createStore(@Valid @RequestBody StoreRequest request) {
        log.info("REST request to create store: {}", request.getName());
        return APIResponse.<StoreResponse>builder()
                .result(storeService.createStore(request))
                .build();
    }

    /**
     * Update store
     */
    @PutMapping("/{storeId}")
    public APIResponse<StoreResponse> updateStore(@PathVariable Long storeId,
                                                   @Valid @RequestBody StoreRequest request) {
        log.info("REST request to update store: {}", storeId);
        return APIResponse.<StoreResponse>builder()
                .result(storeService.updateStore(storeId, request))
                .build();
    }

    /**
     * Delete store (soft delete)
     */
    @DeleteMapping("/{storeId}")
    public APIResponse<Void> deleteStore(@PathVariable Long storeId) {
        log.info("REST request to delete store: {}", storeId);
        storeService.deleteStore(storeId);
        return APIResponse.<Void>builder()
                .message("Store deleted successfully")
                .build();
    }

    /**
     * Get store by ID
     */
    @GetMapping("/{storeId}")
    public APIResponse<StoreResponse> getStore(@PathVariable Long storeId) {
        log.info("REST request to get store: {}", storeId);
        return APIResponse.<StoreResponse>builder()
                .result(storeService.getStoreById(storeId))
                .build();
    }

    /**
     * Get all stores
     */
    @GetMapping
    public APIResponse<List<StoreResponse>> getAllStores() {
        log.info("REST request to get all stores");
        return APIResponse.<List<StoreResponse>>builder()
                .result(storeService.getAllStores())
                .build();
    }

    /**
     * Get stores by owner
     */
    @GetMapping("/owner/{ownerUserId}")
    public APIResponse<List<StoreResponse>> getStoresByOwner(@PathVariable Long ownerUserId) {
        log.info("REST request to get stores by owner: {}", ownerUserId);
        return APIResponse.<List<StoreResponse>>builder()
                .result(storeService.getStoresByOwner(ownerUserId))
                .build();
    }

    /**
     * Change store status
     */
    @PatchMapping("/{storeId}/status")
    public APIResponse<StoreResponse> changeStoreStatus(@PathVariable Long storeId,
                                                         @RequestParam StoreStatus status) {
        log.info("REST request to change store {} status to {}", storeId, status);
        return APIResponse.<StoreResponse>builder()
                .result(storeService.changeStoreStatus(storeId, status))
                .build();
    }

    /**
     * Search stores
     */
    @GetMapping("/search")
    public APIResponse<List<StoreResponse>> searchStores(@RequestParam String keyword) {
        log.info("REST request to search stores with keyword: {}", keyword);
        return APIResponse.<List<StoreResponse>>builder()
                .result(storeService.searchStores(keyword))
                .build();
    }

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

    /**
     * Create product for a specific store
     * Endpoint: POST /api/stores/{storeId}/products
     * Use case: Store owner creates new product for their store
     */
    @PostMapping("/{storeId}/products")
    public APIResponse<com.cnpm.foodfast.dto.response.product.ProductResponse> createProductForStore(
            @PathVariable Long storeId,
            @Valid @RequestBody com.cnpm.foodfast.dto.request.product.StoreProductRequest storeProductRequest) {
        log.info("REST request to create product for store: {}", storeId);

        // Convert StoreProductRequest to ProductRequest and set storeId
        com.cnpm.foodfast.dto.request.product.ProductRequest request = com.cnpm.foodfast.dto.request.product.ProductRequest.builder()
                .categoryId(storeProductRequest.getCategoryId())
                .storeId(storeId)  // Set from path parameter
                .sku(storeProductRequest.getSku())
                .name(storeProductRequest.getName())
                .description(storeProductRequest.getDescription())
                .basePrice(storeProductRequest.getBasePrice())
                .currency(storeProductRequest.getCurrency())
                .mediaPrimaryUrl(storeProductRequest.getMediaPrimaryUrl())
                .safetyStock(storeProductRequest.getSafetyStock())
                .quantityAvailable(storeProductRequest.getQuantityAvailable())
                .reservedQuantity(storeProductRequest.getReservedQuantity())
                .extraJson(storeProductRequest.getExtraJson())
                .weightGram(storeProductRequest.getWeightGram())
                .lengthCm(storeProductRequest.getLengthCm())
                .widthCm(storeProductRequest.getWidthCm())
                .heightCm(storeProductRequest.getHeightCm())
                .build();

        return APIResponse.<com.cnpm.foodfast.dto.response.product.ProductResponse>builder()
                .result(storeService.createProductForStore(storeId, request))
                .build();
    }

    /**
     * Update product of a specific store
     * Endpoint: PUT /api/stores/{storeId}/products/{productId}
     */
    @PutMapping("/{storeId}/products/{productId}")
    public APIResponse<com.cnpm.foodfast.dto.response.product.ProductResponse> updateProductForStore(
            @PathVariable Long storeId,
            @PathVariable Long productId,
            @Valid @RequestBody com.cnpm.foodfast.dto.request.product.StoreProductRequest storeProductRequest) {
        log.info("REST request to update product {} for store: {}", productId, storeId);

        // Convert StoreProductRequest to ProductRequest and set storeId
        com.cnpm.foodfast.dto.request.product.ProductRequest request = com.cnpm.foodfast.dto.request.product.ProductRequest.builder()
                .categoryId(storeProductRequest.getCategoryId())
                .storeId(storeId)
                .sku(storeProductRequest.getSku())
                .name(storeProductRequest.getName())
                .description(storeProductRequest.getDescription())
                .basePrice(storeProductRequest.getBasePrice())
                .currency(storeProductRequest.getCurrency())
                .mediaPrimaryUrl(storeProductRequest.getMediaPrimaryUrl())
                .safetyStock(storeProductRequest.getSafetyStock())
                .quantityAvailable(storeProductRequest.getQuantityAvailable())
                .reservedQuantity(storeProductRequest.getReservedQuantity())
                .extraJson(storeProductRequest.getExtraJson())
                .weightGram(storeProductRequest.getWeightGram())
                .lengthCm(storeProductRequest.getLengthCm())
                .widthCm(storeProductRequest.getWidthCm())
                .heightCm(storeProductRequest.getHeightCm())
                .build();

        return APIResponse.<com.cnpm.foodfast.dto.response.product.ProductResponse>builder()
                .result(storeService.updateProductForStore(storeId, productId, request))
                .build();
    }

    /**
     * Delete product of a specific store
     * Endpoint: DELETE /api/stores/{storeId}/products/{productId}
     */
    @DeleteMapping("/{storeId}/products/{productId}")
    public APIResponse<Void> deleteProductForStore(
            @PathVariable Long storeId,
            @PathVariable Long productId) {
        log.info("REST request to delete product {} for store: {}", productId, storeId);

        storeService.deleteProductForStore(storeId, productId);

        return APIResponse.<Void>builder()
                .message("Product deleted successfully")
                .build();
    }
}
