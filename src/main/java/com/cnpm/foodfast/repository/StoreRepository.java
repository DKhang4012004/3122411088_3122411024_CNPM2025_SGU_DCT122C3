package com.cnpm.foodfast.repository;

import com.cnpm.foodfast.dto.response.store.StoreResponse;
import com.cnpm.foodfast.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreRepository extends JpaRepository<Store,Long> {

}
