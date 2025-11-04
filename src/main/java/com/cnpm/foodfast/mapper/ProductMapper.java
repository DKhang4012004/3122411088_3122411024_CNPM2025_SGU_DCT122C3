package com.cnpm.foodfast.mapper;

import com.cnpm.foodfast.dto.request.product.ProductRequest;
import com.cnpm.foodfast.dto.response.product.ProductResponse;
import com.cnpm.foodfast.entity.Product;
import com.cnpm.foodfast.entity.ProductCategory;
import com.cnpm.foodfast.entity.Store;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductMapper {
    @Mapping(source = "storeId", target = "store")
    @Mapping(source = "categoryId", target = "category")
    Product toProduct(ProductRequest request);

    @Mapping(target = "storeId", expression = "java(product.getStore() != null ? product.getStore().getId() : null)")
    @Mapping(target = "storeName", expression = "java(product.getStore() != null ? product.getStore().getName() : null)")
    @Mapping(target = "categoryId", expression = "java(product.getCategory() != null ? product.getCategory().getId() : null)")
    @Mapping(target = "categoryName", expression = "java(product.getCategory() != null ? product.getCategory().getName() : null)")
    ProductResponse toProductResponse(Product product);

    List<ProductResponse> toProductResponse(List<Product> products);

    @Mapping(source = "storeId", target = "store")
    @Mapping(source = "categoryId", target = "category")
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateProduct(ProductRequest request, @MappingTarget Product product);


    default Store mapStore(Long storeId) {
        if (storeId == null) return null;
        Store store = new Store();
        store.setId(storeId);
        return store;
    }

    default ProductCategory mapCategory(Long categoryId) {
        if (categoryId == null) return null;
        ProductCategory category = new ProductCategory();
        category.setId(categoryId);
        return category;
    }

}
