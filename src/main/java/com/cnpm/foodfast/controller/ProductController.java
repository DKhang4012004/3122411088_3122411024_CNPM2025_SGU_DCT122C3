package com.cnpm.foodfast.controller;


import com.cnpm.foodfast.dto.request.product.ProductRequest;
import com.cnpm.foodfast.dto.response.API.APIResponse;
import com.cnpm.foodfast.dto.response.product.ProductResponse;
import com.cnpm.foodfast.service.impl.ProductServiceImpl;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductController {
    ProductServiceImpl productService;

    @PostMapping
    public APIResponse<ProductResponse> createProduct(@RequestBody ProductRequest request){
        return APIResponse.<ProductResponse>builder()
                .result(productService.create(request))
                .build();
    }

    @PutMapping("/{id}")
    public APIResponse<ProductResponse> updateProduct(@RequestBody ProductRequest request, @PathVariable Long id) {
        return APIResponse.<ProductResponse>builder()
                .result(productService.update(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    public APIResponse<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return APIResponse.<Void>builder()
                .message("Product deleted")
                .build();
    }

    @GetMapping("/{id}")
    public APIResponse<ProductResponse> getProduct(@PathVariable Long id) {
        return APIResponse.<ProductResponse>builder()
                .result(productService.getById(id))
                .build();
    }

    @GetMapping
    public APIResponse<List<ProductResponse>> getAllProducts() {
        return APIResponse.<List<ProductResponse>>builder()
                .result(productService.getAll())
                .build();
    }

    @GetMapping("/category/{categoryId}")
    public APIResponse<List<ProductResponse>> getProductsByCategory(@PathVariable Long categoryId) {
        return APIResponse.<List<ProductResponse>>builder()
                .result(productService.getByCategory(categoryId))
                .build();
    }



}
