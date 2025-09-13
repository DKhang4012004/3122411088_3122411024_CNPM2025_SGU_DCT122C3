package com.cnpm.foodfast.repository;

import com.cnpm.foodfast.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
interface UserRepository  extends JpaRepository<User,String> {
}
