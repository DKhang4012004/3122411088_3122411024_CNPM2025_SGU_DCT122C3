# 📦 HƯỚNG DẪN DEMO - CẬP NHẬT TRẠNG THÁI ĐỢN HÀNG & TẠO LEDGER

## 🎯 Tổng quan

Hệ thống quản lý trạng thái đơn hàng với các quy tắc:
- ✅ **Chỉ đơn hàng đã thanh toán** (`payment_status = PAID`) mới được cập nhật trạng thái
- ✅ **Khi nhà hàng chấp nhận đơn**, tự động tạo `store_ledger` entry
- ✅ **Luồng trạng thái** được kiểm soát chặt chẽ

---

## 🔄 Luồng trạng thái đơn hàng

```
┌──────────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Khách hàng tạo đơn hàng                                  │
│ → Order status = CREATED                                         │
│ → Payment status = PENDING                                       │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Khách hàng thanh toán                                    │
│ → Order status = PAID                                            │
│ → Payment status = PAID                                          │
│ → PaymentTransaction status = SUCCESS                            │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ BƯỚC 3: Nhà hàng chấp nhận đơn (ACCEPT ORDER)                   │
│ → Order status = PAID (giữ nguyên)                              │
│ → TỰ ĐỘNG tạo StoreLedger entry:                                │
│   • store_id                                                     │
│   • order_id                                                     │
│   • total_order_amount                                           │
│   • app_commission_amount (20%)                                  │
│   • payment_gateway_fee (1%)                                     │
│   • net_amount_owed (79%)                                        │
│   • status = UNPAID                                              │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Bắt đầu giao hàng                                        │
│ → Order status = IN_DELIVERY                                     │
└──────────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────────┐
│ BƯỚC 5: Hoàn tất giao hàng                                       │
│ → Order status = DELIVERED                                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Chuẩn bị Demo

### 1. Tạo đơn hàng mẫu đã thanh toán

```sql
-- Tạo đơn hàng
INSERT INTO orders (
    user_id, 
    store_id, 
    order_code, 
    status, 
    payment_status,
    total_item_amount,
    shipping_fee,
    total_payable,
    created_at,
    updated_at
) VALUES (
    1,
    1,
    CONCAT('ORD', UNIX_TIMESTAMP(), 'DEMO'),
    'PAID',
    'PAID',
    100000,
    20000,
    120000,
    NOW(),
    NOW()
);

-- Lấy order ID vừa tạo
SET @order_id = LAST_INSERT_ID();

-- Tạo order items
INSERT INTO order_item (
    order_id,
    product_id,
    product_name_snapshot,
    quantity,
    unit_price_snapshot,
    total_price
) VALUES 
(@order_id, 1, 'Cơm tấm sườn bì chả', 2, 50000, 100000);

-- Verify order
SELECT id, order_code, status, payment_status, total_payable 
FROM orders 
WHERE id = @order_id;
```

**Expected Result:**
| id | order_code | status | payment_status | total_payable |
|----|------------|--------|----------------|---------------|
| X | ORD... | PAID | PAID | 120000.00 |

---

## 🎬 Kịch bản Demo

### DEMO 1: Nhà hàng chấp nhận đơn hàng (Tạo ledger tự động)

**Mục đích:** Khi nhà hàng chấp nhận đơn, hệ thống tự động tạo store_ledger entry để theo dõi tiền cần chi trả.

#### Request:
```http
POST http://localhost:8080/home/api/v1/orders/2/accept
```

#### Response:
```json
{
  "code": 200,
  "message": "Order accepted successfully and ledger entry created",
  "result": {
    "id": 2,
    "orderCode": "ORD1730545678DEMO",
    "userId": 1,
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "status": "PAID",
    "paymentStatus": "PAID",
    "totalItemAmount": 100000.00,
    "shippingFee": 20000.00,
    "totalPayable": 120000.00,
    "createdAt": "2025-11-02T14:00:00",
    "updatedAt": "2025-11-02T14:05:30"
  }
}
```

#### Database Changes:

**Table: `store_ledger`**
```sql
SELECT * FROM store_ledger WHERE order_id = 2;
```

| id | store_id | order_id | total_order_amount | app_commission_amount | payment_gateway_fee | net_amount_owed | status | created_at |
|----|----------|----------|-------------------|-----------------------|---------------------|-----------------|--------|------------|
| 1 | 1 | 2 | 120000.00 | 24000.00 | 1200.00 | 94800.00 | UNPAID | 2025-11-02 14:05:30 |

**Giải thích:**
- ✅ `total_order_amount`: 120,000 VNĐ (tổng đơn hàng)
- ✅ `app_commission_amount`: 24,000 VNĐ (20% hoa hồng)
- ✅ `payment_gateway_fee`: 1,200 VNĐ (1% phí gateway)
- ✅ `net_amount_owed`: 94,800 VNĐ (79% - tiền nhà hàng nhận)
- ✅ `status`: UNPAID (chờ chi trả)

**Log:**
```
2025-11-02T14:05:30 INFO  Store accepting order: 2
2025-11-02T14:05:30 INFO  Creating ledger entry for order: ORD1730545678DEMO
2025-11-02T14:05:30 INFO  StoreLedger created for accepted order: 2
2025-11-02T14:05:30 INFO  Order 2 accepted and ledger created successfully
```

---

### DEMO 2: Nhà hàng từ chối đơn hàng

**Precondition:** Đơn hàng phải có `payment_status = PAID` và `status = PAID`

#### Request:
```http
POST http://localhost:8080/home/api/v1/orders/3/reject?reason=Out+of+stock
```

#### Response:
```json
{
  "code": 200,
  "message": "Order rejected successfully",
  "result": {
    "id": 3,
    "orderCode": "ORD1730545999DEMO",
    "status": "CANCELLED",
    "paymentStatus": "PAID",
    "totalPayable": 150000.00
  }
}
```

#### Database Changes:
```sql
SELECT id, order_code, status, payment_status 
FROM orders 
WHERE id = 3;
```

| id | order_code | status | payment_status |
|----|------------|--------|----------------|
| 3 | ORD... | CANCELLED | PAID |

**Note:** Đơn hàng bị từ chối, có thể cần xử lý hoàn tiền.

---

### DEMO 3: Chuyển đơn hàng sang trạng thái đang giao

**Precondition:** 
- `payment_status = PAID`
- `status = PAID` (đơn đã được chấp nhận)

#### Request:
```http
POST http://localhost:8080/home/api/v1/orders/2/mark-in-delivery
```

#### Response:
```json
{
  "code": 200,
  "message": "Order marked as in delivery",
  "result": {
    "id": 2,
    "orderCode": "ORD1730545678DEMO",
    "status": "IN_DELIVERY",
    "paymentStatus": "PAID",
    "totalPayable": 120000.00
  }
}
```

#### Database Changes:
```sql
SELECT id, order_code, status, updated_at 
FROM orders 
WHERE id = 2;
```

| id | status | updated_at |
|----|--------|------------|
| 2 | IN_DELIVERY | 2025-11-02 14:10:00 |

---

### DEMO 4: Hoàn tất giao hàng

**Precondition:** 
- `payment_status = PAID`
- `status = IN_DELIVERY`

#### Request:
```http
POST http://localhost:8080/home/api/v1/orders/2/mark-delivered
```

#### Response:
```json
{
  "code": 200,
  "message": "Order marked as delivered",
  "result": {
    "id": 2,
    "orderCode": "ORD1730545678DEMO",
    "status": "DELIVERED",
    "paymentStatus": "PAID",
    "totalPayable": 120000.00
  }
}
```

#### Database Changes:
```sql
SELECT id, order_code, status, updated_at 
FROM orders 
WHERE id = 2;
```

| id | status | updated_at |
|----|--------|------------|
| 2 | DELIVERED | 2025-11-02 14:15:00 |

---

### DEMO 5: Cập nhật trạng thái tùy chỉnh

**Precondition:** `payment_status = PAID`

#### Request:
```http
PUT http://localhost:8080/home/api/v1/orders/4/status
Content-Type: application/json

{
  "status": "IN_DELIVERY",
  "reason": "Driver picked up the order"
}
```

#### Response:
```json
{
  "code": 200,
  "message": "Order status updated successfully",
  "result": {
    "id": 4,
    "status": "IN_DELIVERY",
    "paymentStatus": "PAID"
  }
}
```

---

## ❌ Test Cases - Các trường hợp lỗi

### Test Case 1: Không thể cập nhật trạng thái đơn hàng chưa thanh toán

#### Request:
```http
POST http://localhost:8080/home/api/v1/orders/5/accept
```
(Order 5 có `payment_status = PENDING`)

#### Response:
```json
{
  "code": 400,
  "message": "Only paid orders can be accepted. Payment status: PENDING"
}
```

---

### Test Case 2: Không thể chuyển trạng thái không hợp lệ

#### Request:
```http
PUT http://localhost:8080/home/api/v1/orders/2/status
Content-Type: application/json

{
  "status": "DELIVERED"
}
```
(Order 2 đang có `status = PAID`, không thể nhảy thẳng sang DELIVERED)

#### Response:
```json
{
  "code": 400,
  "message": "PAID order can only be moved to IN_DELIVERY or CANCELLED"
}
```

---

### Test Case 3: Không thể cập nhật đơn hàng đã hoàn tất

#### Request:
```http
PUT http://localhost:8080/home/api/v1/orders/2/status
Content-Type: application/json

{
  "status": "CANCELLED"
}
```
(Order 2 đã có `status = DELIVERED`)

#### Response:
```json
{
  "code": 400,
  "message": "Cannot change status of DELIVERED order"
}
```

---

### Test Case 4: Không thể tạo ledger trùng lặp

#### Request:
```http
POST http://localhost:8080/home/api/v1/orders/2/accept
```
(Order 2 đã có ledger entry)

#### Response:
```json
{
  "code": 200,
  "message": "Order accepted successfully and ledger entry created",
  "result": {...}
}
```

**Log:**
```
2025-11-02T14:20:00 WARN  Ledger entry already exists for order: 2
```

**Note:** Hệ thống không tạo ledger trùng lặp, chỉ log warning.

---

## 📊 API Endpoints Summary

| Method | Endpoint | Mô tả | Điều kiện |
|--------|----------|-------|-----------|
| POST | `/api/v1/orders/{id}/accept` | Nhà hàng chấp nhận đơn, tạo ledger | `payment_status = PAID`, `status = PAID` |
| POST | `/api/v1/orders/{id}/reject` | Nhà hàng từ chối đơn | `payment_status = PAID`, `status = PAID` |
| POST | `/api/v1/orders/{id}/mark-in-delivery` | Chuyển sang đang giao | `payment_status = PAID`, `status = PAID` |
| POST | `/api/v1/orders/{id}/mark-delivered` | Hoàn tất giao hàng | `payment_status = PAID`, `status = IN_DELIVERY` |
| PUT | `/api/v1/orders/{id}/status` | Cập nhật trạng thái tùy chỉnh | `payment_status = PAID` |
| GET | `/api/v1/orders/{id}` | Xem chi tiết đơn hàng | - |
| GET | `/api/v1/orders/store/{storeId}` | Danh sách đơn của nhà hàng | - |

---

## 🔗 Tích hợp với Payout System

### Luồng hoàn chỉnh từ đơn hàng → Chi trả

```
1. Khách đặt hàng → Order (CREATED, PENDING)
                    ↓
2. Khách thanh toán → Order (PAID, PAID)
                      PaymentTransaction (SUCCESS)
                    ↓
3. Nhà hàng chấp nhận → StoreLedger (UNPAID) ✅ TỰ ĐỘNG TẠO
                    ↓
4. Giao hàng → Order (IN_DELIVERY)
                    ↓
5. Hoàn tất → Order (DELIVERED)
                    ↓
6. Tổng hợp chi trả → PayoutBatch (PENDING)
                      StoreLedger (PROCESSING)
                    ↓
7. Thanh toán → PayoutBatch (PAID)
                StoreLedger (PAID)
```

### Query kiểm tra toàn bộ luồng

```sql
-- Xem tất cả thông tin liên quan đến 1 đơn hàng
SELECT 
    o.id AS order_id,
    o.order_code,
    o.status AS order_status,
    o.payment_status,
    o.total_payable,
    sl.id AS ledger_id,
    sl.net_amount_owed,
    sl.status AS ledger_status,
    sl.payout_batch_id,
    pb.status AS payout_status,
    pb.transaction_code
FROM orders o
LEFT JOIN store_ledger sl ON o.id = sl.order_id
LEFT JOIN payout_batch pb ON sl.payout_batch_id = pb.id
WHERE o.id = 2;
```

**Expected Result:**
| order_id | order_code | order_status | payment_status | total_payable | ledger_id | net_amount_owed | ledger_status | payout_batch_id | payout_status | transaction_code |
|----------|------------|--------------|----------------|---------------|-----------|-----------------|---------------|-----------------|---------------|------------------|
| 2 | ORD... | DELIVERED | PAID | 120000.00 | 1 | 94800.00 | PAID | 1 | PAID | BANK_TXN_001 |

---

## 🎯 Điểm nhấn Demo

### 1. Bảo mật & Kiểm soát
- ✅ Chỉ đơn đã thanh toán mới được xử lý
- ✅ Luồng trạng thái được kiểm soát chặt chẽ
- ✅ Không thể chuyển trạng thái không hợp lệ

### 2. Tự động hóa
- ✅ Tự động tạo ledger khi nhà hàng chấp nhận đơn
- ✅ Tự động tính toán hoa hồng, phí gateway
- ✅ Ngăn chặn ledger trùng lặp

### 3. Minh bạch
- ✅ Tracking đầy đủ qua database
- ✅ Log chi tiết tất cả hành động
- ✅ Timestamp cho mọi thay đổi

### 4. Khả năng mở rộng
- ✅ Dễ dàng thêm trạng thái mới
- ✅ Có thể tích hợp webhook/notification
- ✅ Sẵn sàng cho automation

---

## 📈 Metrics & Reports

### Thống kê đơn hàng theo trạng thái
```sql
SELECT 
    status,
    COUNT(*) as order_count,
    SUM(total_payable) as total_amount
FROM orders
WHERE payment_status = 'PAID'
GROUP BY status;
```

### Thống kê ledger chưa thanh toán theo cửa hàng
```sql
SELECT 
    s.id,
    s.name,
    COUNT(sl.id) as unpaid_ledger_count,
    SUM(sl.net_amount_owed) as total_unpaid_amount
FROM store s
LEFT JOIN store_ledger sl ON s.id = sl.store_id
WHERE sl.status = 'UNPAID'
GROUP BY s.id, s.name;
```

---

**Created:** November 2, 2025  
**Version:** 1.0  
**Author:** FoodFast Development Team

