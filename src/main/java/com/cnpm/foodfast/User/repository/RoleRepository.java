package com.cnpm.foodfast.User.repository;

import com.cnpm.foodfast.entity.Roles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Roles, Long> {
    /**
     * Find role by name (CUSTOMER, STORE_OWNER, ADMIN)
     * @param name Role name
     * @return Optional of Role
     */
    Optional<Roles> findByName(String name);
}
