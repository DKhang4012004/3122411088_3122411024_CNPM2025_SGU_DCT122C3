package com.cnpm.foodfast.dto.request.store;

import com.cnpm.foodfast.entity.Store;
import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreAddressRequest {

    String addressLine;


    String city;


    String district;


    String ward;


    String country;

    Double latitude;

    Double longitude;
}
