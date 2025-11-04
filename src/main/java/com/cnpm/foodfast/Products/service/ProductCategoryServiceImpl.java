package com.cnpm.foodfast.Products.service;


import com.cnpm.foodfast.dto.request.category.ProductCategoryRequest;
import com.cnpm.foodfast.dto.response.category.ProductCategoryResponse;
import com.cnpm.foodfast.entity.ProductCategory;
import com.cnpm.foodfast.enums.CategoryStatus;
import com.cnpm.foodfast.exception.AppException;
import com.cnpm.foodfast.exception.ErrorCode;
import com.cnpm.foodfast.mapper.ProductCategoryMapper;
import com.cnpm.foodfast.Products.repository.ProductCategoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductCategoryServiceImpl implements ProductCategoryService {
    ProductCategoryRepository productCategoryRepository;
    ProductCategoryMapper productCategoryMapper;

    // Helper method to generate slug from name
    private String generateSlug(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "";
        }
        // Convert to lowercase and replace spaces with hyphens
        String slug = name.toLowerCase()
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "")
                .replaceAll("-+", "-");
        
        // Make unique if already exists
        String baseSlug = slug;
        int counter = 1;
        while (productCategoryRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        
        return slug;
    }

    @Override
    public ProductCategoryResponse createCategory(ProductCategoryRequest request) {
        // Generate slug if not provided
        if (request.getSlug() == null || request.getSlug().trim().isEmpty()) {
            request.setSlug(generateSlug(request.getName()));
        } else {
            // Kiểm tra slug đã tồn tại chưa
            if (productCategoryRepository.existsBySlug(request.getSlug())) {
                throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
            }
        }

        ProductCategory productCategory = productCategoryMapper.toProductCategory(request);
        
        // Set status from request or default to ACTIVE
        if (request.getStatus() != null) {
            productCategory.setStatus(CategoryStatus.valueOf(request.getStatus()));
        } else {
            productCategory.setStatus(CategoryStatus.ACTIVE);
        }

        ProductCategory saved = productCategoryRepository.save(productCategory);
        return productCategoryMapper.toProductCategoryResponse(saved);
    }

    @Override
    public ProductCategoryResponse updateCategory(Long id, ProductCategoryRequest request) {
        ProductCategory productCategory = productCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        // Generate slug if not provided and name changed
        if (request.getSlug() == null || request.getSlug().trim().isEmpty()) {
            if (request.getName() != null && !request.getName().equals(productCategory.getName())) {
                request.setSlug(generateSlug(request.getName()));
            }
        } else {
            // Kiểm tra slug mới có bị trùng không (trừ chính nó)
            if (!request.getSlug().equals(productCategory.getSlug())) {
                if (productCategoryRepository.existsBySlug(request.getSlug())) {
                    throw new AppException(ErrorCode.CATEGORY_SLUG_EXISTED);
                }
            }
        }

        productCategoryMapper.updateProductCategory(productCategory, request);
        
        // Update status if provided
        if (request.getStatus() != null) {
            productCategory.setStatus(CategoryStatus.valueOf(request.getStatus()));
        }
        
        ProductCategory saved = productCategoryRepository.save(productCategory);

        return productCategoryMapper.toProductCategoryResponse(saved);
    }

    @Override
    public void deleteCategory(Long id) {
        ProductCategory productCategory = productCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        productCategoryRepository.delete(productCategory);
    }

    @Override
    public ProductCategoryResponse getCategoryById(Long id) {
        ProductCategory category = productCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));
        return productCategoryMapper.toProductCategoryResponse(category);
    }

    public List<ProductCategoryResponse> getAllCategories() {
        List<ProductCategory> categories = productCategoryRepository.findAll();
        return productCategoryMapper.toProductCategoryResponse(categories);
    }
}
