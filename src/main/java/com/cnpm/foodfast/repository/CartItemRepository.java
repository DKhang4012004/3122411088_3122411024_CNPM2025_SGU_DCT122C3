package com.cnpm.foodfast.repository;

import com.cnpm.foodfast.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @Query("SELECT ci FROM CartItem ci WHERE ci.cartId = :cartId AND ci.productId = :productId")
    Optional<CartItem> findByCartIdAndProductId(@Param("cartId") Long cartId, @Param("productId") Long productId);

    @Query("SELECT ci FROM CartItem ci JOIN FETCH ci.product p WHERE ci.cartId = :cartId")
    List<CartItem> findByCartIdWithProduct(@Param("cartId") Long cartId);

    @Query("SELECT SUM(ci.quantity * p.weightGram) FROM CartItem ci JOIN ci.product p WHERE ci.cartId = :cartId")
    Integer calculateTotalWeightByCartId(@Param("cartId") Long cartId);
}
