package com.cnpm.foodfast.Products.service;

import com.cnpm.foodfast.dto.request.product.ProductRequest;
import com.cnpm.foodfast.dto.response.product.ProductResponse;
import com.cnpm.foodfast.enums.ProductStatus;

import java.util.List;

public interface ProductService {
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long productId, ProductRequest request);
    void delete(Long productId);
    ProductResponse getById(Long productId);
    List<ProductResponse> getByCategory(Long categoryId);
    List<ProductResponse> getByStore(Long storeId);
    List<ProductResponse> getAll();
    List<ProductResponse> searchProducts(String keyword);
    ProductResponse updateStatus(Long productId, ProductStatus status);
}
