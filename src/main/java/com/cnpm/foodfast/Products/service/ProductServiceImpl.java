package com.cnpm.foodfast.Products.service;


import com.cnpm.foodfast.dto.request.product.ProductRequest;
import com.cnpm.foodfast.dto.response.product.ProductResponse;
import com.cnpm.foodfast.entity.Product;
import com.cnpm.foodfast.entity.ProductCategory;
import com.cnpm.foodfast.enums.ProductStatus;
import com.cnpm.foodfast.exception.AppException;
import com.cnpm.foodfast.exception.ErrorCode;
import com.cnpm.foodfast.mapper.ProductMapper;
import com.cnpm.foodfast.Products.repository.ProductRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProductServiceImpl  implements ProductService {

    ProductRepository productRepository;
    ProductMapper productMapper;

    @Override
    public ProductResponse create(ProductRequest request) {
        Product product = productMapper.toProduct(request);
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);
        return productMapper.toProductResponse(product);
    }

    @Override
    public ProductResponse update(Long productId, ProductRequest request) {
        Product product= productRepository.findById(productId).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        productMapper.updateProduct(request,product);

        if (request.getCategoryId() != null) {
            ProductCategory category = new ProductCategory();
            category.setId(request.getCategoryId());
            product.setCategory(category);

        }

        product= productRepository.save(product);
        return productMapper.toProductResponse(product);

    }

    @Override
    public void delete(Long productId) {
        Product product= productRepository.findById(productId).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        productRepository.delete(product);

    }

    @Override
    public ProductResponse getById(Long productId) {
        Product product= productRepository.findById(productId).orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_EXISTED));
        return productMapper.toProductResponse(product);

    }

    @Override
    public List<ProductResponse> getByCategory(Long categoryId) {
        List<Product> products = productRepository.findByCategoryId(categoryId);

        return productMapper.toProductResponse(products);
    }

    @Override
    public List<ProductResponse> getAll() {
        List<Product> product =productRepository.findAll();
        return productMapper.toProductResponse(product);
    }
}
