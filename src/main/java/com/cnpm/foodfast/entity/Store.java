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
    Long Id;

    @Column(name = "owner_user_id")
    Long ownerUserId;

    @Column(name = "name")
    String name;

    @Column(name = "description")
    String description;

    @Enumerated(EnumType.STRING)
    @Column(name= "status")
    StoreStatus storeStatus;

    @Column(name = "created_at", updatable = false, insertable = false)
    LocalDateTime createdAt;
}