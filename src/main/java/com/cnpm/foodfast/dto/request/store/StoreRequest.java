package com.cnpm.foodfast.dto.request.store;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StoreRequest {

    Long ownerUserId;


    String name;


    String description;


    String bankAccountName;


    String bankAccountNumber;


    String bankName;


    String bankBranch;


    String payoutEmail;
}
