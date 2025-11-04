package com.cnpm.foodfast.Products.service;


import com.cnpm.foodfast.dto.request.product.ProductRequest;
import com.cnpm.foodfast.dto.response.product.ProductResponse;
import com.cnpm.foodfast.entity.Product;
import com.cnpm.foodfast.entity.ProductCategory;
import com.cnpm.foodfast.entity.Store;
import com.cnpm.foodfast.enums.ProductStatus;
import com.cnpm.foodfast.exception.AppException;
import com.cnpm.foodfast.exception.ErrorCode;
import com.cnpm.foodfast.mapper.ProductMapper;
import com.cnpm.foodfast.Products.repository.ProductCategoryRepository;
import com.cnpm.foodfast.Products.repository.ProductRepository;
import com.cnpm.foodfast.Store.repository.StoreRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductServiceImpl  implements ProductService {

    ProductRepository productRepository;
    ProductCategoryRepository categoryRepository;
    StoreRepository storeRepository;
    ProductMapper productMapper;

    @Override
    @Transactional
    public ProductResponse create(ProductRequest request) {
        // Validate Store exists
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_EXISTED));
        
        // Validate Category exists
        ProductCategory category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
        
        Product product = productMapper.toProduct(request);
        product.setStatus(ProductStatus.ACTIVE);
        product.setStore(store);
        product.setCategory(category);
        
        product = productRepository.save(product);
        return productMapper.toProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse update(Long productId, ProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        
        // Validate Store exists if changed
        if (request.getStoreId() != null && !request.getStoreId().equals(product.getStore().getId())) {
            Store store = storeRepository.findById(request.getStoreId())
                    .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_EXISTED));
            product.setStore(store);
        }
        
        // Validate Category exists if changed
        if (request.getCategoryId() != null && !request.getCategoryId().equals(product.getCategory().getId())) {
            ProductCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
            product.setCategory(category);
        }
        
        productMapper.updateProduct(request, product);
        product = productRepository.save(product);
        return productMapper.toProductResponse(product);
    }

    @Override
    @Transactional
    public void delete(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        productRepository.delete(product);
    }

    @Override
    public ProductResponse getById(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        return productMapper.toProductResponse(product);
    }

    @Override
    public List<ProductResponse> getByCategory(Long categoryId) {
        // Validate category exists
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
        
        List<Product> products = productRepository.findByCategoryId(categoryId);
        return productMapper.toProductResponse(products);
    }

    @Override
    public List<ProductResponse> getByStore(Long storeId) {
        // Validate store exists
        storeRepository.findById(storeId)
                .orElseThrow(() -> new AppException(ErrorCode.STORE_NOT_EXISTED));
        
        List<Product> products = productRepository.findByStoreId(storeId);
        return productMapper.toProductResponse(products);
    }

    @Override
    public List<ProductResponse> getAll() {
        List<Product> products = productRepository.findAll();
        return productMapper.toProductResponse(products);
    }

    @Override
    public List<ProductResponse> searchProducts(String keyword) {
        List<Product> products = productRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(keyword, keyword);
        return productMapper.toProductResponse(products);
    }

    @Override
    @Transactional
    public ProductResponse updateStatus(Long productId, ProductStatus status) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        
        product.setStatus(status);
        productRepository.save(product);
        
        return productMapper.toProductResponse(product);
    }
}
