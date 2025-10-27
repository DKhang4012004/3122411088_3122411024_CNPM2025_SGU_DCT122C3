package com.cnpm.foodfast.service.ServiceInterface;

import com.cnpm.foodfast.dto.request.product.ProductRequest;
import com.cnpm.foodfast.dto.response.product.ProductResponse;

import java.util.List;

public interface ProductService {
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long productId, ProductRequest request);
    void delete(Long productId);
    ProductResponse getById(Long productId);
    List<ProductResponse> getByCategory(Long categoryId);
    List<ProductResponse> getAll();
}
