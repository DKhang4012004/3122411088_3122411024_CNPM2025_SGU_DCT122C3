package com.cnpm.foodfast.Products.controller;


import com.cnpm.foodfast.dto.request.category.ProductCategoryRequest;
import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.dto.response.category.ProductCategoryResponse;
import com.cnpm.foodfast.Products.service.ProductCategoryServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/category")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductCategoryController {
    ProductCategoryServiceImpl productCategoryService;

    @PostMapping
    public APIResponse<ProductCategoryResponse> createCategory(@RequestBody ProductCategoryRequest request) {
        return APIResponse.<ProductCategoryResponse>builder()
                .result(productCategoryService.createCategory(request))
                .build();
    }

    @PutMapping("/{id}")
    public APIResponse<ProductCategoryResponse> updateCategory(@PathVariable Long id, @RequestBody ProductCategoryRequest request) {
        return APIResponse.<ProductCategoryResponse>builder()
                .result(productCategoryService.updateCategory(id, request))
                .build();
    }

    @GetMapping
    public APIResponse<List<ProductCategoryResponse>> findAllCategory(){
        return APIResponse.<List<ProductCategoryResponse>>builder()
                .result(productCategoryService.getAllCategories())
                .build();
    }
}
