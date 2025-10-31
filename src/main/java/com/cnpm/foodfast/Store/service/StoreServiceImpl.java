package com.cnpm.foodfast.Store.service;

import com.cnpm.foodfast.dto.response.product.ProductResponse;
import com.cnpm.foodfast.dto.response.store.StoreWithProductsResponse;
import com.cnpm.foodfast.entity.Product;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.enums.ProductStatus;
import com.cnpm.foodfast.exception.ResourceNotFoundException;
import com.cnpm.foodfast.Products.repository.ProductRepository;
import com.cnpm.foodfast.Store.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StoreServiceImpl implements StoreService {

    private final StoreRepository storeRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional(readOnly = true)
    public StoreWithProductsResponse getStoreWithProducts(Long storeId) {
        log.info("Getting store with products for store ID: {}", storeId);

        // Get store information
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + storeId));

        // Get all products of this store
        List<Product> products = productRepository.findByStoreId(storeId);

        return buildStoreWithProductsResponse(store, products);
    }

    @Override
    @Transactional(readOnly = true)
    public StoreWithProductsResponse getStoreWithProductsByProductId(Long productId) {
        log.info("Getting store with products for product ID: {}", productId);

        // Get product to find store
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        // Get store information
        Store store = storeRepository.findById(product.getStore().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + product.getStore().getId()));

        // Get all products of this store
        List<Product> products = productRepository.findByStoreId(store.getId());

        return buildStoreWithProductsResponse(store, products);
    }

    private StoreWithProductsResponse buildStoreWithProductsResponse(Store store, List<Product> products) {
        // Convert products to ProductResponse
        List<ProductResponse> productResponses = products.stream()
                .map(this::convertToProductResponse)
                .collect(Collectors.toList());

        // Count available products
        long availableCount = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE && p.getQuantityAvailable() > 0)
                .count();

        return StoreWithProductsResponse.builder()
                .id(store.getId())
                .ownerUserId(store.getOwnerUserId())
                .name(store.getName())
                .description(store.getDescription())
                .storeStatus(store.getStoreStatus())
                .createdAt(store.getCreatedAt())
                .products(productResponses)
                .totalProducts(products.size())
                .availableProducts((int) availableCount)
                .build();
    }

    private ProductResponse convertToProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .storeId(product.getStore().getId())
                .categoryId(product.getCategory().getId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .basePrice(product.getBasePrice())
                .currency(product.getCurrency())
                .mediaPrimaryUrl(product.getMediaPrimaryUrl())
                .quantityAvailable(product.getQuantityAvailable())
                .reservedQuantity(product.getReservedQuantity())
                .safetyStock(product.getSafetyStock())
                .status(product.getStatus())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}

