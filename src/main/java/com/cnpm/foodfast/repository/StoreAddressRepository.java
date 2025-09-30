package com.cnpm.foodfast.repository;

import com.cnpm.foodfast.entity.StoreAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;

@Repository
public interface StoreAddressRepository extends JpaRepository<StoreAddress,Long> {


    List<StoreAddress> findByStore_Id(Long storeId);
}
