**Endpoint:** `GET /home/api/v1/cart`

**Request:**
```http
GET http://localhost:8080/home/api/v1/cart
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Cart retrieved successfully",
  "result": {
    "id": 1,
    "userId": 1,
    "status": "ACTIVE",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Cơm tấm sườn bì chả",
        "quantity": 3,
        "unitPrice": 50000.00,
        "totalPrice": 150000.00
      },
      {
        "id": 2,
        "productId": 2,
        "productName": "Cơm tấm sườn nướng",
        "quantity": 1,
        "unitPrice": 60000.00,
        "totalPrice": 60000.00
      }
    ],
    "totalAmount": 210000.00,
    "totalItems": 2
  }
}
```

---

## 📦 PHẦN 4: TẠO ĐƠN HÀNG

### Test 4.1: Tạo đơn hàng từ giỏ

**Endpoint:** `POST /home/api/v1/orders`

**Request:**
```json
{
  "userId": 1,
  "deliveryNote": "Giao trước 6PM"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order created successfully",
  "result": {
    "id": 1,
    "orderCode": "ORD1730634567ABC123",
    "userId": 1,
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "status": "CREATED",
    "paymentStatus": "PENDING",
    "totalItemAmount": 210000.00,
    "shippingFee": 20000.00,
    "totalPayable": 230000.00,
    "items": [
      {
        "productId": 1,
        "productName": "Cơm tấm sườn bì chả",
        "quantity": 3,
        "unitPrice": 50000.00,
        "totalPrice": 150000.00
      },
      {
        "productId": 2,
        "productName": "Cơm tấm sườn nướng",
        "quantity": 1,
        "unitPrice": 60000.00,
        "totalPrice": 60000.00
      }
    ],
    "createdAt": "2025-11-02T10:00:00"
  }
}
```

**Verify Database:**

```sql
-- Order created
SELECT * FROM orders WHERE id = 1;
```

**Expected:**
| id | order_code | user_id | store_id | status | payment_status | total_payable |
|----|------------|---------|----------|--------|----------------|---------------|
| 1 | ORD... | 1 | 1 | CREATED | PENDING | 230000.00 |

```sql
-- Order items created
SELECT * FROM order_item WHERE order_id = 1;
```

**Expected:**
| id | order_id | product_id | quantity | unit_price_snapshot | total_price |
|----|----------|------------|----------|---------------------|-------------|
| 1 | 1 | 1 | 3 | 50000.00 | 150000.00 |
| 2 | 1 | 2 | 1 | 60000.00 | 60000.00 |

```sql
-- Cart cleared
SELECT * FROM cart WHERE user_id = 1;
```

**Expected:**
| id | user_id | status |
|----|---------|--------|
| 1 | 1 | CHECKED_OUT |

```sql
SELECT COUNT(*) FROM cart_item WHERE cart_id = 1;
-- Expected: 0 (empty)
```

---

## 💳 PHẦN 5: THANH TOÁN

### Test 5.1: Khởi tạo thanh toán VNPay

**Endpoint:** `POST /home/api/v1/payments/init`

**Request:**
```json
{
  "orderId": 1,
  "provider": "VNPAY",
  "method": "QR"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Payment initialized successfully",
  "result": {
    "id": 1,
    "orderId": 1,
    "provider": "VNPAY",
    "amount": 230000.00,
    "currency": "VND",
    "status": "INIT",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=23000000&vnp_Command=pay&...",
    "createdAt": "2025-11-02T10:05:00"
  }
}
```

**Verify Database:**
```sql
SELECT * FROM payment_transaction WHERE order_id = 1;
```

**Expected:**
| id | order_id | provider | amount | status | created_at |
|----|----------|----------|--------|--------|------------|
| 1 | 1 | VNPAY | 230000.00 | INIT | 2025-11-02 10:05:00 |

```sql
SELECT status, payment_status FROM orders WHERE id = 1;
```

**Expected:**
| status | payment_status |
|--------|----------------|
| PENDING_PAYMENT | PENDING |

---

### Test 5.2: Mô phỏng thanh toán thành công VNPay

**Cách test:**

1. **Mở paymentUrl trong browser:**
```
https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=23000000&...
```

2. **Nhập thông tin thẻ test VNPay:**
```
Card Number: 9704198526191432198
Card Holder: NGUYEN VAN A
Issue Date: 07/15
OTP: 123456
```

3. **VNPay callback về hệ thống:**
```
https://your-ngrok-url/home/api/v1/payments/vnpay-return?vnp_ResponseCode=00&...
```

**Hoặc test trực tiếp bằng cách gọi IPN endpoint:**

**Endpoint:** `GET /home/api/v1/payments/vnpay-return`

**Query Parameters:**
```
vnp_Amount=23000000
vnp_BankCode=NCB
vnp_BankTranNo=VNP14226112
vnp_CardType=ATM
vnp_PayDate=20251102100530
vnp_OrderInfo=Thanh toan don hang ORD1730634567ABC123
vnp_ResponseCode=00
vnp_TmnCode=D1GOXCFX
vnp_TransactionNo=14226112
vnp_TransactionStatus=00
vnp_TxnRef=ORD1730634567ABC123
vnp_SecureHash=<calculated_hash>
```

---

### Test 5.3: Verify thanh toán thành công

**Check Response:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Thanh toán thành công</title>
</head>
<body>
    <h1>✅ Thanh toán thành công!</h1>
    <p>Mã đơn hàng: ORD1730634567ABC123</p>
    <p>Số tiền: 230,000 VNĐ</p>
    <p>Mã giao dịch: 14226112</p>
    <a href="/orders/1">Xem đơn hàng</a>
</body>
</html>
```

**Verify Database:**

```sql
-- Payment transaction updated
SELECT * FROM payment_transaction WHERE order_id = 1;
```

**Expected:**
| id | order_id | status | provider_transaction_id | completed_at |
|----|----------|--------|------------------------|--------------|
| 1 | 1 | SUCCESS | 14226112 | 2025-11-02 10:06:00 |

```sql
-- Order status updated
SELECT status, payment_status FROM orders WHERE id = 1;
```

**Expected:**
| status | payment_status |
|--------|----------------|
| PAID | PAID |

```sql
-- Store ledger NOT created yet (will be created when store accepts)
SELECT COUNT(*) FROM store_ledger WHERE order_id = 1;
-- Expected: 0
```

---

## 🏪 PHẦN 6: NHÀ HÀNG XỬ LÝ ĐƠN

### Test 6.1: Nhà hàng xem đơn hàng mới

**Endpoint:** `GET /home/api/v1/orders/store/1`

**Request:**
```http
GET http://localhost:8080/home/api/v1/orders/store/1
Authorization: Bearer {store_owner_token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Orders retrieved successfully",
  "result": [
    {
      "id": 1,
      "orderCode": "ORD1730634567ABC123",
      "status": "PAID",
      "paymentStatus": "PAID",
      "totalPayable": 230000.00,
      "createdAt": "2025-11-02T10:00:00",
      "items": [
        {
          "productName": "Cơm tấm sườn bì chả",
          "quantity": 3
        },
        {
          "productName": "Cơm tấm sườn nướng",
          "quantity": 1
        }
      ]
    }
  ]
}
```

---

### Test 6.2: Nhà hàng chấp nhận đơn hàng (TẠO LEDGER)

**Endpoint:** `POST /home/api/v1/orders/1/accept`

**Request:**
```http
POST http://localhost:8080/home/api/v1/orders/1/accept
Authorization: Bearer {store_owner_token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order accepted successfully and ledger entry created",
  "result": {
    "id": 1,
    "orderCode": "ORD1730634567ABC123",
    "status": "ACCEPT",
    "paymentStatus": "PAID",
    "totalPayable": 230000.00
  }
}
```

**Verify Database:**

```sql
-- Order status updated to ACCEPT
SELECT status FROM orders WHERE id = 1;
```

**Expected:** `ACCEPT`

```sql
-- Store ledger created automatically
SELECT * FROM store_ledger WHERE order_id = 1;
```

**Expected:**
| id | store_id | order_id | total_order_amount | app_commission_amount | payment_gateway_fee | net_amount_owed | status |
|----|----------|----------|-------------------|-----------------------|---------------------|-----------------|--------|
| 1 | 1 | 1 | 230000.00 | 46000.00 | 2300.00 | 181700.00 | UNPAID |

**Calculation:**
- Total order amount: 230,000 VNĐ
- App commission (20%): 46,000 VNĐ
- Payment gateway fee (1%): 2,300 VNĐ
- Net amount owed to store (79%): 181,700 VNĐ

---

### Test 6.3: Nhà hàng bắt đầu giao hàng

**Endpoint:** `POST /home/api/v1/orders/1/mark-in-delivery`

**Request:**
```http
POST http://localhost:8080/home/api/v1/orders/1/mark-in-delivery
Authorization: Bearer {store_owner_token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order marked as in delivery",
  "result": {
    "id": 1,
    "status": "IN_DELIVERY",
    "updatedAt": "2025-11-02T10:30:00"
  }
}
```

---

### Test 6.4: Hoàn tất giao hàng

**Endpoint:** `POST /home/api/v1/orders/1/mark-delivered`

**Request:**
```http
POST http://localhost:8080/home/api/v1/orders/1/mark-delivered
Authorization: Bearer {store_owner_token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order marked as delivered",
  "result": {
    "id": 1,
    "status": "DELIVERED",
    "updatedAt": "2025-11-02T11:00:00"
  }
}
```

**Verify Database:**
```sql
SELECT status FROM orders WHERE id = 1;
```

**Expected:** `DELIVERED`

---

## 💰 PHẦN 7: CHI TRẢ CHO CỬA HÀNG (PAYOUT)

### Test 7.1: Xem tổng quan chi trả của cửa hàng

**Endpoint:** `GET /home/api/v1/payouts/summary/1`

**Request:**
```http
GET http://localhost:8080/home/api/v1/payouts/summary/1
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Payout summary retrieved successfully",
  "result": {
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "totalRevenue": 230000.00,
    "totalCommission": 46000.00,
    "totalGatewayFee": 2300.00,
    "totalNetAmount": 181700.00,
    "totalPaid": 0.00,
    "totalPending": 0.00,
    "availableForPayout": 181700.00,
    "unpaidLedgerCount": 1,
    "totalOrderCount": 1,
    "bankAccountName": "NGUYEN VAN A",
    "bankAccountNumber": "0123456789",
    "bankName": "Vietcombank"
  }
}
```

---

### Test 7.2: Tạo Payout Batch (tổng hợp chi trả)

**Endpoint:** `POST /home/api/v1/payouts/batches`

**Request:**
```json
{
  "storeId": 1,
  "notes": "Chi trả tuần đầu tháng 11/2025"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Payout batch created successfully",
  "result": {
    "id": 1,
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "totalPayoutAmount": 181700.00,
    "status": "PENDING",
    "ledgerCount": 1,
    "bankAccountName": "NGUYEN VAN A",
    "bankAccountNumber": "0123456789",
    "bankName": "Vietcombank",
    "notes": "Chi trả tuần đầu tháng 11/2025",
    "createdAt": "2025-11-02T15:00:00"
  }
}
```

**Verify Database:**

```sql
-- Payout batch created
SELECT * FROM payout_batch WHERE id = 1;
```

**Expected:**
| id | store_id | total_payout_amount | status | created_at |
|----|----------|---------------------|--------|------------|
| 1 | 1 | 181700.00 | PENDING | 2025-11-02 15:00:00 |

```sql
-- Store ledger updated to PROCESSING
SELECT status, payout_batch_id FROM store_ledger WHERE order_id = 1;
```

**Expected:**
| status | payout_batch_id |
|--------|-----------------|
| PROCESSING | 1 |

---

### Test 7.3: Admin đánh dấu đã chuyển tiền

**Endpoint:** `POST /home/api/v1/payouts/batches/1/mark-paid`

**Request:**
```json
{
  "transactionCode": "BANK_TXN_20251102_001"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Payout batch marked as paid",
  "result": {
    "id": 1,
    "status": "PAID",
    "transactionCode": "BANK_TXN_20251102_001",
    "totalPayoutAmount": 181700.00,
    "processedAt": "2025-11-02T15:30:00"
  }
}
```

**Verify Database:**

```sql
-- Payout batch marked as PAID
SELECT status, transaction_code, processed_at 
FROM payout_batch WHERE id = 1;
```

**Expected:**
| status | transaction_code | processed_at |
|--------|------------------|--------------|
| PAID | BANK_TXN_20251102_001 | 2025-11-02 15:30:00 |

```sql
-- Store ledger marked as PAID
SELECT status FROM store_ledger WHERE order_id = 1;
```

**Expected:** `PAID`

---

## 📊 PHẦN 8: VERIFY TOÀN BỘ LUỒNG

### Test 8.1: Query tổng hợp

```sql
SELECT 
    o.id AS order_id,
    o.order_code,
    o.status AS order_status,
    o.payment_status,
    o.total_payable,
    pt.provider,
    pt.status AS payment_status,
    pt.provider_transaction_id,
    sl.net_amount_owed,
    sl.status AS ledger_status,
    pb.total_payout_amount,
    pb.status AS payout_status,
    pb.transaction_code
FROM orders o
LEFT JOIN payment_transaction pt ON o.id = pt.order_id
LEFT JOIN store_ledger sl ON o.id = sl.order_id
LEFT JOIN payout_batch pb ON sl.payout_batch_id = pb.id
WHERE o.id = 1;
```

**Expected Result:**
| order_id | order_code | order_status | payment_status | total_payable | provider | payment_status | provider_transaction_id | net_amount_owed | ledger_status | total_payout_amount | payout_status | transaction_code |
|----------|------------|--------------|----------------|---------------|----------|----------------|------------------------|-----------------|---------------|---------------------|---------------|------------------|
| 1 | ORD... | DELIVERED | PAID | 230000.00 | VNPAY | SUCCESS | 14226112 | 181700.00 | PAID | 181700.00 | PAID | BANK_TXN_20251102_001 |

---

### Test 8.2: Timeline của order

```sql
SELECT 
    'Order Created' AS event,
    created_at AS timestamp
FROM orders WHERE id = 1

UNION ALL

SELECT 
    'Payment Completed' AS event,
    completed_at AS timestamp
FROM payment_transaction WHERE order_id = 1

UNION ALL

SELECT 
    'Ledger Created' AS event,
    created_at AS timestamp
FROM store_ledger WHERE order_id = 1

UNION ALL

SELECT 
    'Payout Batch Created' AS event,
    created_at AS timestamp
FROM payout_batch WHERE id = 1

UNION ALL

SELECT 
    'Payout Completed' AS event,
    processed_at AS timestamp
FROM payout_batch WHERE id = 1

ORDER BY timestamp;
```

**Expected Result:**
| event | timestamp |
|-------|-----------|
| Order Created | 2025-11-02 10:00:00 |
| Payment Completed | 2025-11-02 10:06:00 |
| Ledger Created | 2025-11-02 10:15:00 |
| Payout Batch Created | 2025-11-02 15:00:00 |
| Payout Completed | 2025-11-02 15:30:00 |

---

## 🎯 POSTMAN COLLECTION

### Import Collection

Tạo file `Complete_User_Journey.postman_collection.json`:

```json
{
  "info": {
    "name": "Complete User Journey - FoodFast",
    "description": "Test đầy đủ từ đăng nhập đến thanh toán",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Authentication",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"testuser@example.com\",\n  \"password\": \"password123\",\n  \"fullName\": \"Nguyen Van Test\",\n  \"phoneNumber\": \"0901234567\"\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/auth/register",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.environment.set(\"auth_token\", jsonData.result.token);",
                  "pm.environment.set(\"user_id\", jsonData.result.userId);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "2. Browse Products",
      "item": [
        {
          "name": "Get Stores",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/home/api/v1/stores",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "stores"]
            }
          }
        },
        {
          "name": "Get Store Products",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/home/api/v1/stores/1/products",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "stores", "1", "products"]
            }
          }
        }
      ]
    },
    {
      "name": "3. Cart Management",
      "item": [
        {
          "name": "Add Product 1 to Cart",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"productId\": 1,\n  \"quantity\": 2\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/cart/items",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "cart", "items"]
            }
          }
        },
        {
          "name": "Add Product 2 to Cart",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"productId\": 2,\n  \"quantity\": 1\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/cart/items",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "cart", "items"]
            }
          }
        },
        {
          "name": "View Cart",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/home/api/v1/cart",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "cart"]
            }
          }
        }
      ]
    },
    {
      "name": "4. Order Creation",
      "item": [
        {
          "name": "Create Order from Cart",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.environment.set(\"order_id\", jsonData.result.id);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"userId\": {{user_id}},\n  \"deliveryNote\": \"Giao trước 6PM\"\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/orders",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "orders"]
            }
          }
        }
      ]
    },
    {
      "name": "5. Payment",
      "item": [
        {
          "name": "Initialize Payment",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"orderId\": {{order_id}},\n  \"provider\": \"VNPAY\",\n  \"method\": \"QR\"\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/payments/init",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "payments", "init"]
            }
          }
        }
      ]
    },
    {
      "name": "6. Store Processing",
      "item": [
        {
          "name": "Accept Order",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/home/api/v1/orders/{{order_id}}/accept",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "orders", "{{order_id}}", "accept"]
            }
          }
        },
        {
          "name": "Mark In Delivery",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/home/api/v1/orders/{{order_id}}/mark-in-delivery",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "orders", "{{order_id}}", "mark-in-delivery"]
            }
          }
        },
        {
          "name": "Mark Delivered",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/home/api/v1/orders/{{order_id}}/mark-delivered",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "orders", "{{order_id}}", "mark-delivered"]
            }
          }
        }
      ]
    },
    {
      "name": "7. Payout",
      "item": [
        {
          "name": "Get Payout Summary",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ],
            "url": {
              "raw": "http://localhost:8080/home/api/v1/payouts/summary/1",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "payouts", "summary", "1"]
            }
          }
        },
        {
          "name": "Create Payout Batch",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "pm.environment.set(\"payout_batch_id\", jsonData.result.id);"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"storeId\": 1,\n  \"notes\": \"Chi trả tuần đầu tháng 11/2025\"\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/payouts/batches",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "payouts", "batches"]
            }
          }
        },
        {
          "name": "Mark Payout as Paid",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"transactionCode\": \"BANK_TXN_20251102_001\"\n}"
            },
            "url": {
              "raw": "http://localhost:8080/home/api/v1/payouts/batches/{{payout_batch_id}}/mark-paid",
              "protocol": "http",
              "host": ["localhost"],
              "port": "8080",
              "path": ["home", "api", "v1", "payouts", "batches", "{{payout_batch_id}}", "mark-paid"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 📝 CHECKLIST HOÀN THÀNH

### ✅ Đăng nhập
- [ ] Đăng ký tài khoản thành công
- [ ] Đăng nhập và nhận token
- [ ] Token được lưu và sử dụng cho các request tiếp theo

### ✅ Xem sản phẩm
- [ ] Lấy được danh sách cửa hàng
- [ ] Xem được sản phẩm của cửa hàng

### ✅ Giỏ hàng
- [ ] Thêm sản phẩm vào giỏ thành công
- [ ] Cập nhật số lượng sản phẩm
- [ ] Xem giỏ hàng với tổng tiền chính xác

### ✅ Đơn hàng
- [ ] Tạo đơn hàng từ giỏ thành công
- [ ] Giỏ hàng bị xóa sau khi tạo đơn
- [ ] Order items được tạo đúng
- [ ] Tồn kho sản phẩm được cập nhật

### ✅ Thanh toán
- [ ] Khởi tạo thanh toán VNPay thành công
- [ ] Nhận được payment URL
- [ ] Thanh toán thành công trên VNPay
- [ ] Order chuyển sang PAID
- [ ] Payment transaction = SUCCESS

### ✅ Nhà hàng xử lý
- [ ] Nhà hàng chấp nhận đơn
- [ ] Store ledger được tạo tự động
- [ ] Tính toán hoa hồng chính xác
- [ ] Đơn hàng chuyển sang IN_DELIVERY
- [ ] Đơn hàng hoàn tất (DELIVERED)

### ✅ Chi trả
- [ ] Xem summary chi trả của cửa hàng
- [ ] Tạo payout batch thành công
- [ ] Ledger chuyển sang PROCESSING
- [ ] Đánh dấu đã thanh toán
- [ ] Ledger và batch chuyển sang PAID

---

**Created:** November 2, 2025  
**Version:** 1.0  
**Author:** FoodFast Development Team  
**Purpose:** Complete User Journey Test Plan
# 🎯 KẾ HOẠCH TEST - HÀNH TRÌNH NGƯỜI DÙNG ĐẦY ĐỦ

## 📋 Tổng quan hành trình

```
ĐĂNG NHẬP → XEM SẢN PHẨM → THÊM GIỎ HÀNG → TẠO ĐỢN HÀNG → THANH TOÁN 
→ NHÀ HÀNG CHẤP NHẬN → GIAO HÀNG → HOÀN TẤT
```

---

## 🔐 PHẦN 1: ĐĂNG KÝ & ĐĂNG NHẬP

### Test 1.1: Đăng ký tài khoản mới

**Endpoint:** `POST /home/api/v1/auth/register`

**Request:**
```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password123",
  "fullName": "Nguyen Van Test",
  "phoneNumber": "0901234567"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "User registered successfully",
  "result": {
    "id": 1,
    "username": "testuser",
    "email": "testuser@example.com",
    "fullName": "Nguyen Van Test",
    "phoneNumber": "0901234567"
  }
}
```

**Verify Database:**
```sql
SELECT id, username, email, full_name, phone_number 
FROM users 
WHERE username = 'testuser';
```

---

### Test 1.2: Đăng nhập

**Endpoint:** `POST /home/api/v1/auth/login`

**Request:**
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 1,
    "username": "testuser",
    "roles": ["USER"]
  }
}
```

**Lưu token để dùng cho các request tiếp theo:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🏪 PHẦN 2: XEM CỬA HÀNG & SẢN PHẨM

### Test 2.1: Lấy danh sách cửa hàng

**Endpoint:** `GET /home/api/v1/stores`

**Request:**
```http
GET http://localhost:8080/home/api/v1/stores
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Stores retrieved successfully",
  "result": [
    {
      "id": 1,
      "name": "Quán Cơm Tấm Sài Gòn",
      "description": "Cơm tấm ngon nhất khu vực",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "name": "Quán Phở Hà Nội",
      "description": "Phở bò truyền thống",
      "status": "ACTIVE"
    }
  ]
}
```

---

### Test 2.2: Xem chi tiết cửa hàng & sản phẩm

**Endpoint:** `GET /home/api/v1/stores/{storeId}/products`

**Request:**
```http
GET http://localhost:8080/home/api/v1/stores/1/products
Authorization: Bearer {token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Products retrieved successfully",
  "result": {
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "products": [
      {
        "id": 1,
        "name": "Cơm tấm sườn bì chả",
        "description": "Cơm tấm truyền thống",
        "basePrice": 50000.00,
        "status": "ACTIVE",
        "quantityAvailable": 100
      },
      {
        "id": 2,
        "name": "Cơm tấm sườn nướng",
        "description": "Sườn nướng thơm ngon",
        "basePrice": 60000.00,
        "status": "ACTIVE",
        "quantityAvailable": 80
      }
    ]
  }
}
```

---

## 🛒 PHẦN 3: THÊM VÀO GIỎ HÀNG

### Test 3.1: Thêm sản phẩm đầu tiên vào giỏ

**Endpoint:** `POST /home/api/v1/cart/items`

**Request:**
```json
{
  "productId": 1,
  "quantity": 2
}
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Product added to cart successfully",
  "result": {
    "id": 1,
    "userId": 1,
    "status": "ACTIVE",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Cơm tấm sườn bì chả",
        "quantity": 2,
        "unitPrice": 50000.00,
        "totalPrice": 100000.00
      }
    ],
    "totalAmount": 100000.00
  }
}
```

**Verify Database:**
```sql
-- Cart được tạo tự động
SELECT * FROM cart WHERE user_id = 1 AND status = 'ACTIVE';

-- Cart item
SELECT * FROM cart_item WHERE cart_id = 1;
```

**Expected:**
| cart_id | product_id | quantity | unit_price_snapshot | total_price |
|---------|------------|----------|---------------------|-------------|
| 1 | 1 | 2 | 50000.00 | 100000.00 |

---

### Test 3.2: Thêm sản phẩm thứ hai

**Request:**
```json
{
  "productId": 2,
  "quantity": 1
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Product added to cart successfully",
  "result": {
    "id": 1,
    "userId": 1,
    "status": "ACTIVE",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Cơm tấm sườn bì chả",
        "quantity": 2,
        "unitPrice": 50000.00,
        "totalPrice": 100000.00
      },
      {
        "id": 2,
        "productId": 2,
        "productName": "Cơm tấm sườn nướng",
        "quantity": 1,
        "unitPrice": 60000.00,
        "totalPrice": 60000.00
      }
    ],
    "totalAmount": 160000.00
  }
}
```

---

### Test 3.3: Cập nhật số lượng sản phẩm trong giỏ

**Endpoint:** `PUT /home/api/v1/cart/items/product/{productId}`

**Request:**
```http
PUT http://localhost:8080/home/api/v1/cart/items/product/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Cart item updated successfully",
  "result": {
    "items": [
      {
        "productId": 1,
        "quantity": 3,
        "totalPrice": 150000.00
      },
      {
        "productId": 2,
        "quantity": 1,
        "totalPrice": 60000.00
      }
    ],
    "totalAmount": 210000.00
  }
}
```

---

### Test 3.4: Xem giỏ hàng hiện tại


