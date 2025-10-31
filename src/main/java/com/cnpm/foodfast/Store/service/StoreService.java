package com.cnpm.foodfast.Store.service;

import com.cnpm.foodfast.dto.response.store.StoreWithProductsResponse;

public interface StoreService {

    /**
     * Get store information with all products by store ID
     */
    StoreWithProductsResponse getStoreWithProducts(Long storeId);

    /**
     * Get store information with products by product ID
     * (Find store that sells the given product)
     */
    StoreWithProductsResponse getStoreWithProductsByProductId(Long productId);
}

