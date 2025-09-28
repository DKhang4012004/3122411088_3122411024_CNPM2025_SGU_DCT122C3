package com.cnpm.foodfast.service.impl;

import com.cnpm.foodfast.dto.request.category.ProductCategoryRequest;
import com.cnpm.foodfast.dto.response.category.ProductCategoryResponse;
import com.cnpm.foodfast.entity.ProductCategory;

import java.util.List;

public interface ProductCategoryService {
    ProductCategoryResponse createCategory(ProductCategoryRequest category);
    ProductCategoryResponse updateCategory(Long id, ProductCategoryRequest category);
    void deleteCategory(Long id);
    List<ProductCategoryResponse> getAllCategories();
//    List<ProductCategory> getRootCategories();
}
