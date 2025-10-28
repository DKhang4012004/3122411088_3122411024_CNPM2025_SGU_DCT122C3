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

    @Override
    public ProductCategoryResponse createCategory(ProductCategoryRequest request) {
        ProductCategory productCategory = productCategoryMapper.toProductCategory(request);

        if (request.getParentId() != null) {
            ProductCategory parent = productCategoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new AppException(ErrorCode.PARENT_CATEGORY_NOT_EXISTED));
            productCategory.setParent(parent);

            productCategory.setLevel((byte) (parent.getLevel() + 1));
            productCategory.setPath(parent.getPath() + "/" + parent.getId());
        }
        else {
            //root
            productCategory.setParent(null);
            productCategory.setLevel((byte) 0);
            productCategory.setPath("");

        }
        productCategory.setStatus(CategoryStatus.ACTIVE);

        ProductCategory saved = productCategoryRepository.save(productCategory);

        // Nếu là root category, path ban đầu rỗng
        if (saved.getPath() == null || saved.getPath().isEmpty()) {
            saved.setPath(String.valueOf(saved.getId())); // path = chính id của nó
            saved = productCategoryRepository.save(saved);       // update lại path
        }
        return productCategoryMapper.toProductCategoryResponse(saved);

    }

    @Override
    public ProductCategoryResponse updateCategory(Long id, ProductCategoryRequest request) {
        ProductCategory productCategory = productCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_EXISTED));

        productCategoryMapper.updateProductCategory(productCategory, request);

        if (request.getParentId() != null) {
            ProductCategory parent = productCategoryRepository.findById(request.getParentId())
                    .orElseThrow(() ->new AppException(ErrorCode.PARENT_CATEGORY_NOT_EXISTED));
            productCategory.setParent(parent);

            productCategory.setLevel((byte) (parent.getLevel() + 1));
            productCategory.setPath(parent.getPath() + "/" + parent.getId());
        }
        else  {
            //root
            productCategory.setParent(null);
            productCategory.setLevel((byte) 0);
            productCategory.setPath("");

        }
        ProductCategory saved = productCategoryRepository.save(productCategory);

        if(saved.getParent()== null){
            saved.setPath(String.valueOf(saved.getId()));
        }
        else {
            saved.setPath(saved.getPath() + "/" + saved.getId());
        }
        saved= productCategoryRepository.save(saved);
        return productCategoryMapper.toProductCategoryResponse(saved);
    }


    @Override
    public void deleteCategory(Long id) {

    }

    @Override
    public List<ProductCategoryResponse> getAllCategories() {
        List<ProductCategory> categories = productCategoryRepository.findAll();
        return productCategoryMapper.toProductCategoryResponse(categories);

    }


}
