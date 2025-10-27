package com.cnpm.foodfast.repository;

import com.cnpm.foodfast.entity.Cart;
import com.cnpm.foodfast.enums.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {

    @Query("SELECT c FROM Cart c WHERE c.userId = :userId AND c.status = :status")
    Optional<Cart> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") CartStatus status);

    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.cartItems ci LEFT JOIN FETCH ci.product p " +
           "WHERE c.userId = :userId AND c.status = 'ACTIVE'")
    Optional<Cart> findActiveCartWithItemsByUserId(@Param("userId") Long userId);
}
