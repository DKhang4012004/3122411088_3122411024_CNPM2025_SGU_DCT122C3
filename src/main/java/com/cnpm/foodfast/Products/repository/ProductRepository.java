package com.cnpm.foodfast.Products.repository;


import com.cnpm.foodfast.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product,Long> {

    List<Product> findByCategoryId(Long categoryId);
    
    List<Product> findByStoreId(Long storeId);
    
    List<Product> findByStoreIdAndStatus(Long storeId, com.cnpm.foodfast.enums.ProductStatus status);

    List<Product> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String name, String description);
    
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.storeId = :storeId")
    List<Product> findByStoreIdWithCategory(@org.springframework.data.repository.query.Param("storeId") Long storeId);
}
