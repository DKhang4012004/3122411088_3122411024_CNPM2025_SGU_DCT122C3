package com.cnpm.foodfast.Drone.repository;

import com.cnpm.foodfast.entity.Drone;
import com.cnpm.foodfast.enums.DroneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DroneRepository extends JpaRepository<Drone, Long> {
    
    Optional<Drone> findByCode(String code);
    
    boolean existsByCode(String code);

    /**
     * Kiểm tra có drone nào đang AVAILABLE không
     */
    boolean existsByStatus(DroneStatus status);

    /**
     * Đếm số lượng drone đang AVAILABLE
     */
    @Query("SELECT COUNT(d) FROM Drone d WHERE d.status = 'AVAILABLE'")
    long countAvailableDrones();
}
