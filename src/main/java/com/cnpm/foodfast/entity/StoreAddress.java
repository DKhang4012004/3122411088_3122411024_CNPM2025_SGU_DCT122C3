package com.cnpm.foodfast.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "store_address")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreAddress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    Store store;

    @Column(name = "address_line", nullable = false)
    String addressLine;

    @Column(name = "city")
    String city;

    @Column(name = "district")
    String district;

    @Column(name = "ward")
    String ward;

    @Column(name = "country")
    String country;

    @Column(name = "latitude")
    Double latitude;

    @Column(name = "longitude")
    Double longitude;


}
