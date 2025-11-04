package com.cnpm.foodfast.Products.service;

import com.cnpm.foodfast.dto.request.category.ProductCategoryRequest;
import com.cnpm.foodfast.dto.response.category.ProductCategoryResponse;

import java.util.List;

public interface ProductCategoryService {
    ProductCategoryResponse createCategory(ProductCategoryRequest category);
    ProductCategoryResponse updateCategory(Long id, ProductCategoryRequest category);
    void deleteCategory(Long id);
    ProductCategoryResponse getCategoryById(Long id);
    List<ProductCategoryResponse> getAllCategories();
//    List<ProductCategory> getRootCategories();
}
