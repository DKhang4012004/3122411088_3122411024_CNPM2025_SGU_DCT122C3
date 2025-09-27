package com.cnpm.foodfast.repository;

import com.cnpm.foodfast.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.query.Procedure;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    List<UserAddress> findByUserId(Long userId);

    Optional<UserAddress> findByUserIdAndIsDefaultTrue(Long userId);

    @Procedure(procedureName = "clear_default_address_for_user")
    void clearDefaultAddressForUser(@Param("p_user_id") Long userId);

    @Query(value = "SELECT count_user_addresses(:userId)", nativeQuery = true)
    long countByUserId(@Param("userId") Long userId);
}
