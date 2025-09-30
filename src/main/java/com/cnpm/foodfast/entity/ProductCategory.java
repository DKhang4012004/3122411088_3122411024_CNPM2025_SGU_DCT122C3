package com.cnpm.foodfast.entity;

import com.cnpm.foodfast.enums.CategoryStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_category")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    ProductCategory parent;

    @Column(name = "name", length = 120, nullable = false)
    String name;

    @Column(name = "slug", length = 150, nullable = false, unique = true)
    String slug;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    CategoryStatus status ;

    @Column(name = "path", length = 500)
    String path;

    @Column(name = "level")
    Byte level;

    @Column(name = "description")
    String description;


    @Column(name = "created_at",  updatable = false, insertable = false)
    LocalDateTime createdAt;


    @Column(name = "updated_at", updatable = false, insertable = false)
    LocalDateTime updatedAt;


}