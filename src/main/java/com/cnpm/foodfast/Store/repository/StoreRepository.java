package com.cnpm.foodfast.Store.repository;

import com.cnpm.foodfast.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store,Long> {
    
    List<Store> findByOwnerUserId(Long ownerUserId);
    
    List<Store> findByNameContainingIgnoreCase(String name);
}
