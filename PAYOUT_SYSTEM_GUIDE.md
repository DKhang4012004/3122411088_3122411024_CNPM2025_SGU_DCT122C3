
**Table: `payout_batch`**
```sql
SELECT * FROM payout_batch WHERE id = 1;
```

| id | status | transaction_code | processed_at |
|----|--------|------------------|--------------|
| 1 | PAID | BANK_TXN_20251102001 | 2025-11-02 12:05:30 |

**Table: `store_ledger`**
```sql
SELECT id, order_id, status, payout_batch_id 
FROM store_ledger WHERE payout_batch_id = 1;
```

| id | order_id | status | payout_batch_id |
|----|----------|--------|-----------------|
| 1 | 10 | PAID | 1 |
| 2 | 11 | PAID | 1 |
| 3 | 12 | PAID | 1 |

**Changes:**
- ✅ payout_batch: PROCESSING → PAID
- ✅ Lưu transaction_code
- ✅ Lưu processed_at timestamp
- ✅ Tất cả store_ledger: PROCESSING → PAID

---

### DEMO 5: Xem danh sách Payout Batches của Store

#### Request:
```http
GET http://localhost:8080/home/api/v1/payouts/stores/1/batches
```

#### Response:
```json
{
  "code": 200,
  "message": "Payout batches retrieved successfully",
  "result": [
    {
      "id": 1,
      "storeId": 1,
      "storeName": "Quán Cơm Tấm Sài Gòn",
      "totalPayoutAmount": 391050.00,
      "status": "PAID",
      "transactionCode": "BANK_TXN_20251102001",
      "notes": "Thanh toán kỳ tuần 1 tháng 11/2025",
      "createdAt": "2025-11-02T12:00:00",
      "processedAt": "2025-11-02T12:05:30",
      "ledgerCount": 3
    }
  ]
}
```

---

### DEMO 6: Xử lý trường hợp thanh toán thất bại

#### Giả sử batch 2 thất bại do lỗi chuyển khoản

#### Request:
```http
POST http://localhost:8080/home/api/v1/payouts/batches/2/mark-failed?reason=Insufficient+bank+balance
```

#### Response:
```json
{
  "code": 200,
  "message": "Payout batch marked as FAILED",
  "result": {
    "id": 2,
    "storeId": 1,
    "totalPayoutAmount": 200000.00,
    "status": "FAILED",
    "notes": "Thanh toán kỳ 2 | Failed: Insufficient bank balance",
    "processedAt": "2025-11-02T13:00:00"
  }
}
```

#### Database Changes:

**Table: `payout_batch`**
| id | status | notes |
|----|--------|-------|
| 2 | FAILED | Thanh toán kỳ 2 \| Failed: Insufficient bank balance |

**Table: `store_ledger`**
- ✅ Tất cả ledgers được revert về status = UNPAID
- ✅ payout_batch_id được set về NULL
- ✅ Có thể tạo batch mới để thử lại

#### Retry:
```http
POST http://localhost:8080/home/api/v1/payouts/batches/2/retry
```

**Result:**
- ✅ Batch status: FAILED → PENDING
- ✅ Ledgers status: UNPAID → PROCESSING
- ✅ Có thể process lại

---

## 📊 API Endpoints Summary

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/v1/payouts/stores/{storeId}/summary` | Xem tổng hợp payout của store |
| POST | `/api/v1/payouts/batches` | Tạo payout batch mới |
| POST | `/api/v1/payouts/batches/{id}/process` | Xử lý thanh toán |
| POST | `/api/v1/payouts/batches/{id}/mark-paid` | Đánh dấu đã thanh toán |
| POST | `/api/v1/payouts/batches/{id}/mark-failed` | Đánh dấu thất bại |
| POST | `/api/v1/payouts/batches/{id}/retry` | Thử lại batch thất bại |
| GET | `/api/v1/payouts/batches/{id}` | Chi tiết payout batch |
| GET | `/api/v1/payouts/stores/{storeId}/batches` | Danh sách batch của store |
| GET | `/api/v1/payouts/batches?status=PENDING` | Lọc theo status |
| GET | `/api/v1/payouts/batches/date-range` | Lọc theo thời gian |

---

## 🧪 Test Cases

### Test Case 1: Tạo Payout Batch thành công
**Preconditions:**
- Store có ít nhất 1 ledger với status = UNPAID

**Steps:**
1. Call GET `/stores/1/summary` → Verify `availableForPayout > 0`
2. Call POST `/batches` với storeId = 1
3. Verify response có `ledgerCount > 0`

**Expected:**
- ✅ Payout batch created với status = PENDING
- ✅ Ledgers chuyển sang PROCESSING
- ✅ totalPayoutAmount = sum(net_amount_owed)

---

### Test Case 2: Không thể tạo batch khi không có ledger UNPAID
**Preconditions:**
- Store không có ledger UNPAID

**Steps:**
1. Call POST `/batches` với storeId không có unpaid ledgers

**Expected:**
- ❌ Error: "No unpaid ledgers found for store"

---

### Test Case 3: Thanh toán thành công end-to-end
**Steps:**
1. Tạo batch → status = PENDING
2. Process batch → status = PROCESSING
3. Mark as paid → status = PAID

**Verify:**
- ✅ Batch có transaction_code
- ✅ Batch có processed_at
- ✅ Tất cả ledgers = PAID

---

### Test Case 4: Xử lý thanh toán thất bại và retry
**Steps:**
1. Tạo batch → status = PENDING
2. Process batch → status = PROCESSING
3. Mark as failed → status = FAILED, ledgers → UNPAID
4. Retry batch → status = PENDING, ledgers → PROCESSING
5. Process lại → Thành công

**Verify:**
- ✅ Ledgers được revert về UNPAID khi failed
- ✅ Có thể retry batch
- ✅ Retry thành công

---

## 📈 Metrics & Reports

### Tổng tiền đã chi trả cho store
```sql
SELECT 
    s.id,
    s.name,
    COUNT(pb.id) as total_batches,
    SUM(CASE WHEN pb.status = 'PAID' THEN pb.total_payout_amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN pb.status = 'PENDING' THEN pb.total_payout_amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN pb.status = 'FAILED' THEN pb.total_payout_amount ELSE 0 END) as failed_amount
FROM store s
LEFT JOIN payout_batch pb ON s.id = pb.store_id
GROUP BY s.id, s.name;
```

### Lịch sử chi trả theo tháng
```sql
SELECT 
    DATE_FORMAT(processed_at, '%Y-%m') as month,
    COUNT(*) as batch_count,
    SUM(total_payout_amount) as total_amount
FROM payout_batch
WHERE status = 'PAID'
GROUP BY DATE_FORMAT(processed_at, '%Y-%m')
ORDER BY month DESC;
```

---

## 🎯 Điểm nhấn Demo

1. **Tính minh bạch:**
   - ✅ Store thấy rõ: doanh thu, hoa hồng, phí, tiền nhận
   - ✅ Tracking đầy đủ qua store_ledger

2. **Quản lý rủi ro:**
   - ✅ Status PROCESSING ngăn duplicate payout
   - ✅ Có thể mark failed và retry
   - ✅ Transaction code để đối chiếu

3. **Tự động hóa:**
   - ✅ Tự động tính toán tiền chi trả
   - ✅ Tự động cập nhật ledgers
   - ✅ Sẵn sàng tích hợp bank API

4. **Báo cáo:**
   - ✅ Summary cho store owner
   - ✅ Lịch sử chi trả đầy đủ
   - ✅ Metrics theo thời gian

---

**Created:** November 2, 2025
**Version:** 1.0
**Author:** FoodFast Development Team
# 💰 HƯỚNG DẪN DEMO HỆ THỐNG PAYOUT BATCH - CHI TRẢ CHO CỬA HÀNG

## 📋 Mục lục
1. [Tổng quan hệ thống](#tổng-quan-hệ-thống)
2. [Luồng hoạt động](#luồng-hoạt-động)
3. [Chuẩn bị Demo](#chuẩn-bị-demo)
4. [Kịch bản Demo chi tiết](#kịch-bản-demo-chi-tiết)
5. [API Endpoints](#api-endpoints)
6. [Test Cases](#test-cases)
7. [Database Changes](#database-changes)

---

## 🎯 Tổng quan hệ thống

### Mục đích
Hệ thống Payout Batch quản lý việc **chi trả tiền từ platform → cửa hàng** sau khi:
- Khách hàng đã thanh toán thành công
- Hệ thống đã trừ hoa hồng app (20%)
- Hệ thống đã trừ phí payment gateway (1%)

### Các bảng liên quan

#### 1. `store_ledger` - Sổ cái của cửa hàng
```sql
CREATE TABLE store_ledger (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    total_order_amount DECIMAL(15,2),      -- Tổng tiền đơn hàng
    app_commission_amount DECIMAL(15,2),   -- Hoa hồng app (20%)
    payment_gateway_fee DECIMAL(15,2),     -- Phí gateway (1%)
    net_amount_owed DECIMAL(15,2),         -- Tiền store nhận
    status ENUM('UNPAID','PROCESSING','PAID'),
    payout_batch_id BIGINT,
    created_at DATETIME
);
```

**Ví dụ:**
```
Order 1: 120,000 VNĐ
├─ total_order_amount: 120,000
├─ app_commission (20%): 24,000
├─ gateway_fee (1%): 1,200
└─ net_amount_owed: 94,800 (store nhận)
```

#### 2. `payout_batch` - Đợt chi trả
```sql
CREATE TABLE payout_batch (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    store_id BIGINT NOT NULL,
    total_payout_amount DECIMAL(15,2),     -- Tổng tiền chi trả
    status ENUM('PENDING','PROCESSING','PAID','FAILED'),
    transaction_code VARCHAR(100),
    notes VARCHAR(255),
    created_at DATETIME,
    processed_at DATETIME
);
```

---

## 🔄 Luồng hoạt động

```
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 1: Khách hàng thanh toán đơn hàng                      │
│ → Order status = PAID                                        │
│ → Payment Transaction status = SUCCESS                       │
│ → Tạo StoreLedger entry với status = UNPAID                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 2: Admin/System tổng hợp các đơn cần chi trả          │
│ → Lấy tất cả StoreLedger với status = UNPAID               │
│ → Tính tổng net_amount_owed                                 │
│ → Tạo PayoutBatch mới                                       │
│ → Cập nhật StoreLedger: UNPAID → PROCESSING                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 3: Xử lý thanh toán                                    │
│ → PayoutBatch status: PENDING → PROCESSING                  │
│ → Thực hiện chuyển tiền (bank transfer, VNPay, ...)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ BƯỚC 4: Hoàn tất thanh toán                                 │
│ → PayoutBatch status: PROCESSING → PAID                     │
│ → StoreLedger status: PROCESSING → PAID                     │
│ → Lưu transaction_code và processed_at                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Chuẩn bị Demo

### 1. Tạo dữ liệu mẫu

#### Bước 1.1: Đảm bảo có Store với thông tin ngân hàng
```sql
-- Cập nhật thông tin ngân hàng cho store
UPDATE store 
SET 
    bank_account_name = 'NGUYEN VAN A',
    bank_account_number = '1234567890',
    bank_name = 'Vietcombank',
    bank_branch = 'CN TP.HCM',
    payout_email = 'owner@store.com'
WHERE id = 1;

SELECT * FROM store WHERE id = 1;
```

#### Bước 1.2: Tạo các đơn hàng đã thanh toán
```sql
-- Tạo 3 đơn hàng mẫu
INSERT INTO `order` (user_id, store_id, order_code, subtotal, delivery_fee, total_payable, status, payment_status, created_at, updated_at)
VALUES 
(1, 1, CONCAT('ORD', UNIX_TIMESTAMP(), 'A'), 90000, 30000, 120000, 'PAID', 'PAID', NOW(), NOW()),
(1, 1, CONCAT('ORD', UNIX_TIMESTAMP(), 'B'), 135000, 30000, 165000, 'PAID', 'PAID', NOW(), NOW()),
(1, 1, CONCAT('ORD', UNIX_TIMESTAMP(), 'C'), 180000, 30000, 210000, 'PAID', 'PAID', NOW(), NOW());

-- Lấy order IDs
SELECT id, order_code, total_payable FROM `order` WHERE store_id = 1 ORDER BY id DESC LIMIT 3;
```

#### Bước 1.3: Tạo Store Ledger entries (UNPAID)
```sql
-- Tạo ledger cho từng order
INSERT INTO store_ledger (
    store_id, 
    order_id, 
    total_order_amount, 
    app_commission_amount, 
    payment_gateway_fee, 
    net_amount_owed, 
    status, 
    created_at
)
SELECT 
    o.store_id,
    o.id,
    o.total_payable,
    o.total_payable * 0.20,      -- 20% hoa hồng
    o.total_payable * 0.01,      -- 1% phí gateway
    o.total_payable * 0.79,      -- 79% store nhận
    'UNPAID',
    NOW()
FROM `order` o
WHERE o.store_id = 1 
  AND o.status = 'PAID'
  AND NOT EXISTS (
      SELECT 1 FROM store_ledger sl WHERE sl.order_id = o.id
  );

-- Verify
SELECT * FROM store_ledger WHERE store_id = 1 AND status = 'UNPAID';
```

**Expected Result:**
| id | store_id | order_id | total_order_amount | app_commission | gateway_fee | net_amount_owed | status |
|----|----------|----------|-------------------|----------------|-------------|----------------|--------|
| 1 | 1 | 10 | 120000.00 | 24000.00 | 1200.00 | 94800.00 | UNPAID |
| 2 | 1 | 11 | 165000.00 | 33000.00 | 1650.00 | 130350.00 | UNPAID |
| 3 | 1 | 12 | 210000.00 | 42000.00 | 2100.00 | 165900.00 | UNPAID |

**Tổng tiền cần chi trả:** 94,800 + 130,350 + 165,900 = **391,050 VNĐ**

---

## 🎬 Kịch bản Demo chi tiết

### DEMO 1: Xem tổng hợp thông tin Payout của Store

#### Request:
```http
GET http://localhost:8080/home/api/v1/payouts/stores/1/summary
```

#### Response mong đợi:
```json
{
  "code": 200,
  "message": "Payout summary retrieved successfully",
  "result": {
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "totalRevenue": 495000.00,
    "totalCommission": 99000.00,
    "totalGatewayFee": 4950.00,
    "totalNetAmount": 391050.00,
    "totalPaid": 0.00,
    "totalPending": 0.00,
    "availableForPayout": 391050.00,
    "unpaidLedgerCount": 3,
    "totalOrderCount": 3,
    "bankAccountName": "NGUYEN VAN A",
    "bankAccountNumber": "1234567890",
    "bankName": "Vietcombank",
    "bankBranch": "CN TP.HCM",
    "payoutEmail": "owner@store.com"
  }
}
```

#### Giải thích:
- ✅ `totalRevenue`: Tổng doanh thu = 120k + 165k + 210k = 495k
- ✅ `totalCommission`: Hoa hồng app (20%) = 99k
- ✅ `totalGatewayFee`: Phí gateway (1%) = 4.95k
- ✅ `totalNetAmount`: Tiền store nhận (79%) = 391.05k
- ✅ `availableForPayout`: Tiền có thể chi ngay = 391.05k
- ✅ `unpaidLedgerCount`: 3 đơn chưa thanh toán

---

### DEMO 2: Tạo Payout Batch

#### Request:
```http
POST http://localhost:8080/home/api/v1/payouts/batches
Content-Type: application/json

{
  "storeId": 1,
  "notes": "Thanh toán kỳ tuần 1 tháng 11/2025"
}
```

#### Response:
```json
{
  "code": 200,
  "message": "Payout batch created successfully",
  "result": {
    "id": 1,
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "totalPayoutAmount": 391050.00,
    "status": "PENDING",
    "transactionCode": null,
    "notes": "Thanh toán kỳ tuần 1 tháng 11/2025",
    "createdAt": "2025-11-02T12:00:00",
    "processedAt": null,
    "ledgerCount": 3,
    "bankAccountName": "NGUYEN VAN A",
    "bankAccountNumber": "1234567890",
    "bankName": "Vietcombank"
  }
}
```

#### Database Changes:

**Table: `payout_batch`**
```sql
SELECT * FROM payout_batch WHERE id = 1;
```

| id | store_id | total_payout_amount | status | notes | created_at |
|----|----------|-------------------|--------|-------|------------|
| 1 | 1 | 391050.00 | PENDING | Thanh toán kỳ tuần 1... | 2025-11-02 12:00:00 |

**Table: `store_ledger`**
```sql
SELECT id, order_id, net_amount_owed, status, payout_batch_id 
FROM store_ledger WHERE store_id = 1;
```

| id | order_id | net_amount_owed | status | payout_batch_id |
|----|----------|----------------|--------|-----------------|
| 1 | 10 | 94800.00 | PROCESSING | 1 |
| 2 | 11 | 130350.00 | PROCESSING | 1 |
| 3 | 12 | 165900.00 | PROCESSING | 1 |

**Changes:**
- ✅ Tạo payout_batch mới với status = PENDING
- ✅ Cập nhật store_ledger: UNPAID → PROCESSING
- ✅ Link ledgers với payout_batch_id

---

### DEMO 3: Xử lý thanh toán (Process Payout)

#### Request:
```http
POST http://localhost:8080/home/api/v1/payouts/batches/1/process
```

#### Response:
```json
{
  "code": 200,
  "message": "Payout batch processing initiated",
  "result": {
    "id": 1,
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "totalPayoutAmount": 391050.00,
    "status": "PROCESSING",
    "transactionCode": null,
    "notes": "Thanh toán kỳ tuần 1 tháng 11/2025",
    "createdAt": "2025-11-02T12:00:00",
    "processedAt": null,
    "ledgerCount": 3
  }
}
```

#### Database Changes:

**Table: `payout_batch`**
```sql
SELECT * FROM payout_batch WHERE id = 1;
```

| id | status | created_at | processed_at |
|----|--------|------------|--------------|
| 1 | PROCESSING | 2025-11-02 12:00:00 | NULL |

**Changes:**
- ✅ Status: PENDING → PROCESSING
- ⏳ Tại đây, hệ thống thực sẽ gọi API bank transfer hoặc VNPay transfer

---

### DEMO 4: Đánh dấu thanh toán thành công

#### Request:
```http
POST http://localhost:8080/home/api/v1/payouts/batches/1/mark-paid?transactionCode=BANK_TXN_20251102001
```

#### Response:
```json
{
  "code": 200,
  "message": "Payout batch marked as PAID successfully",
  "result": {
    "id": 1,
    "storeId": 1,
    "storeName": "Quán Cơm Tấm Sài Gòn",
    "totalPayoutAmount": 391050.00,
    "status": "PAID",
    "transactionCode": "BANK_TXN_20251102001",
    "notes": "Thanh toán kỳ tuần 1 tháng 11/2025",
    "createdAt": "2025-11-02T12:00:00",
    "processedAt": "2025-11-02T12:05:30",
    "ledgerCount": 3
  }
}
```

#### Database Changes:

