package com.cnpm.foodfast.entity;

import com.cnpm.foodfast.enums.StoreStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;


import java.math.BigInteger;
import java.time.LocalDateTime;

@Entity
@Table(name = "store")
@Builder
@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @Column(name = "owner_user_id", nullable = false)
    Long ownerUserId;

    @Column(name = "name", nullable = false, length = 200)
    String name;

    @Column(name = "description", columnDefinition = "TEXT")
    String description;

    @Column(name = "phone_number", length = 20)
    String phoneNumber;

    @Column(name = "email", length = 100)
    String email;

    @Column(name = "logo_url", length = 500)
    String logoUrl;

    @Column(name = "rating")
    Double rating;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    StoreStatus storeStatus;

    @Column(name = "created_at", updatable = false, insertable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false)
    LocalDateTime updatedAt;
}