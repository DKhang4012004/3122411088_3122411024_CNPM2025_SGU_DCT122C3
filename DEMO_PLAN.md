# 🎬 KẾ HOẠCH DEMO CHỨC NĂNG THANH TOÁN - FOODFAST PAYMENT SYSTEM

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Chuẩn bị trước Demo](#chuẩn-bị-trước-demo)
3. [Kịch bản Demo chi tiết](#kịch-bản-demo-chi-tiết)
4. [Database Changes Tracking](#database-changes-tracking)
5. [Test Cases](#test-cases)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

### Mục tiêu Demo
Trình diễn **toàn bộ luồng thanh toán** từ khởi tạo đến hoàn tất, bao gồm:
- ✅ Khởi tạo thanh toán qua VNPay
- ✅ Xử lý callback từ VNPay (IPN)
- ✅ Hiển thị kết quả thanh toán
- ✅ Cập nhật database theo từng bước
- ✅ Tạo ledger entry cho store

### Công nghệ sử dụng
- **Backend**: Spring Boot + VNPay API
- **Payment Gateway**: VNPay Sandbox
- **Database**: MySQL (drone_delivery)
- **Tunneling**: Ngrok (cho IPN callback)
- **Testing**: Postman + Browser

---

## 🛠️ Chuẩn bị trước Demo

### 1. Khởi động các service

#### Bước 1.1: Khởi động MySQL
```bash
# Kiểm tra MySQL đang chạy
mysql -u root -p
# Password: khang141204

# Chọn database
USE drone_delivery;
```

#### Bước 1.2: Khởi động Spring Boot Application
```bash
cd C:\Users\admin\Desktop\CNPM\3122411088_3122411024_CNPM2025_SGU_DCT122C3
mvn clean spring-boot:run
```

**Verify:**
```bash
# Kiểm tra app đã chạy
curl http://localhost:8080/home/actuator/health
```

#### Bước 1.3: Khởi động Ngrok
```bash
ngrok http 8080
```

**Verify:**
```bash
GET http://localhost:8080/home/api/v1/ngrok/status
```

Expected response:
```json
{
  "code": 200,
  "message": "Ngrok is running",
  "result": {
    "currentUrl": "https://shieldless-pamula-adhesively.ngrok-free.dev",
    "ngrokWebInterface": "http://localhost:4040",
    "isNgrokRunning": true
  }
}
```

### 2. Chuẩn bị dữ liệu test

#### Bước 2.1: Tạo User (nếu chưa có)
```sql
-- Kiểm tra user
SELECT * FROM users WHERE id = 1;

-- Nếu chưa có, insert user mẫu
INSERT INTO users (email, password, full_name, phone, role, created_at, updated_at)
VALUES ('customer@test.com', '$2a$10$encoded_password', 'Nguyen Van A', '0123456789', 'CUSTOMER', NOW(), NOW());
```

#### Bước 2.2: Tạo Store
```sql
-- Kiểm tra store
SELECT * FROM store WHERE id = 1;

-- Nếu chưa có, insert store mẫu
INSERT INTO store (owner_user_id, name, description, bank_account_name, bank_account_number, bank_name, status, created_at, updated_at)
VALUES (1, 'Quán Cơm Tấm Sài Gòn', 'Chuyên các món cơm tấm ngon', 'NGUYEN VAN A', '1234567890', 'Vietcombank', 'ACTIVE', NOW(), NOW());
```

#### Bước 2.3: Tạo Product
```sql
-- Insert product category
INSERT INTO product_category (name, slug, status, created_at, updated_at)
VALUES ('Cơm', 'com', 'ACTIVE', NOW(), NOW());

-- Insert product
INSERT INTO product (category_id, store_id, sku, name, description, base_price, status, quantity_available, weight_gram, created_at, updated_at)
VALUES (1, 1, 'COM-TAM-01', 'Cơm Tấm Sườn Bì Chả', 'Cơm tấm truyền thống với sườn nướng, bì và chả', 45000.00, 'ACTIVE', 100, 500, NOW(), NOW());
```

#### Bước 2.4: Tạo Order (CREATED status)
```sql
-- Insert order
INSERT INTO `order` (user_id, store_id, order_code, subtotal, delivery_fee, total_payable, status, payment_status, created_at, updated_at)
VALUES (
  1, 
  1, 
  CONCAT('ORD', UNIX_TIMESTAMP(), SUBSTRING(MD5(RAND()), 1, 8)),
  90000.00,
  30000.00,
  120000.00,
  'CREATED',
  'PENDING',
  NOW(),
  NOW()
);

-- Lấy order_id vừa tạo
SET @order_id = LAST_INSERT_ID();
SELECT @order_id as new_order_id;

-- Insert order items
INSERT INTO order_item (order_id, product_id, quantity, unit_price, total_price, created_at)
VALUES (@order_id, 1, 2, 45000.00, 90000.00, NOW());
```

### 3. Cấu hình VNPay
Verify cấu hình trong `application.yaml`:
```yaml
vnpay:
  tmn-code: "D1GOXCFX"
  hash-secret: "FMX97DS9752G5SWI40ZPBO3R2EQMQ9H5"
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  return-url: "https://shieldless-pamula-adhesively.ngrok-free.dev/home/api/v1/payments/vnpay-return"
```

---

## 🎬 Kịch bản Demo chi tiết

### BƯỚC 1: Khởi tạo thanh toán (Payment Init)

#### 1.1. Gọi API Init Payment

**Request:**
```http
POST http://localhost:8080/home/api/v1/payments/init
Content-Type: application/json

{
  "orderId": 1,
  "provider": "VNPAY",
  "method": "QR"
}
```

**Response mong đợi:**
```json
{
  "code": 200,
  "message": "Payment initialized successfully",
  "result": {
    "id": 1,
    "orderId": 1,
    "provider": "VNPAY",
    "amount": 120000.00,
    "currency": "VND",
    "status": "INIT",
    "providerTransactionId": null,
    "createdAt": "2025-11-01T10:00:00",
    "completedAt": null,
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=12000000&vnp_Command=pay&..."
  }
}
```

#### 1.2. Database Changes - Payment Init

**Table: `payment_transaction`**
```sql
-- INSERT mới payment transaction
SELECT * FROM payment_transaction WHERE order_id = 1;
```

| id | order_id | provider | method | amount | currency | status | provider_transaction_id | created_at | completed_at |
|----|----------|----------|--------|--------|----------|--------|------------------------|------------|--------------|
| 1 | 1 | VNPAY | QR | 120000.00 | VND | INIT | NULL | 2025-11-01 10:00:00 | NULL |

**Table: `order`**
```sql
-- UPDATE order status
SELECT id, order_code, status, payment_status FROM `order` WHERE id = 1;
```

| id | order_code | status | payment_status |
|----|------------|--------|----------------|
| 1 | ORD1730448000ABC123 | PENDING_PAYMENT | PENDING |

**Giải thích:**
- ✅ Payment transaction được tạo với status = `INIT`
- ✅ Order status chuyển từ `CREATED` → `PENDING_PAYMENT`
- ✅ Payment status vẫn là `PENDING`
- ✅ `paymentUrl` được generate với VNPay parameters + checksum

---

### BƯỚC 2: Mở trang thanh toán VNPay

#### 2.1. Copy Payment URL
Từ response trên, copy `paymentUrl` và mở trong browser:
```
https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=12000000&vnp_Command=pay&...
```

#### 2.2. Thực hiện thanh toán
**Tại trang VNPay Sandbox:**

1. Chọn ngân hàng: **NCB (Ngân hàng Quốc Dân)**
2. Nhập thông tin thẻ test:
   - Số thẻ: `9704198526191432198`
   - Tên chủ thẻ: `NGUYEN VAN A`
   - Ngày phát hành: `07/15`
   - Mật khẩu OTP: `123456`

3. Confirm thanh toán

#### 2.3. VNPay xử lý
- VNPay xác thực thông tin
- VNPay tạo transaction
- VNPay gọi 2 callback:
  - **IPN URL** (server-to-server) → Cập nhật database
  - **Return URL** (browser redirect) → Hiển thị kết quả

---

### BƯỚC 3: VNPay gọi IPN URL (Server-to-Server Callback)

#### 3.1. VNPay Request to IPN

**VNPay sẽ gọi:**
```http
GET https://shieldless-pamula-adhesively.ngrok-free.dev/home/api/v1/payments/vnpay-ipn?
  vnp_TmnCode=D1GOXCFX&
  vnp_Amount=12000000&
  vnp_BankCode=NCB&
  vnp_BankTranNo=VNP14226112&
  vnp_CardType=ATM&
  vnp_PayDate=20251101100530&
  vnp_OrderInfo=Payment+for+order+ORD1730448000ABC123&
  vnp_TransactionNo=14226112&
  vnp_ResponseCode=00&
  vnp_TransactionStatus=00&
  vnp_TxnRef=ORD1730448000ABC123&
  vnp_SecureHash=abc123...
```

#### 3.2. Backend xử lý IPN

**Các bước xử lý:**

1. **Verify Checksum** ✅
   - Tạo lại checksum từ parameters
   - So sánh với `vnp_SecureHash`
   - Nếu không khớp → Return `{"RspCode": "97", "Message": "Invalid Checksum"}`

2. **Tìm Order** ✅
   ```sql
   SELECT * FROM `order` WHERE order_code = 'ORD1730448000ABC123';
   ```

3. **Kiểm tra trạng thái Order** ✅
   ```sql
   SELECT status, payment_status FROM payment_transaction WHERE order_id = 1;
   ```
   - Nếu đã `SUCCESS` → Return `{"RspCode": "02", "Message": "Order already confirmed"}`

4. **Kiểm tra số tiền** ✅
   ```sql
   SELECT total_payable FROM `order` WHERE id = 1;
   -- Expected: 120000.00
   -- VNPay amount: 12000000 (x100) = 120000.00
   ```

5. **Cập nhật Database** ✅ (Xem BƯỚC 3.3)

6. **Return Response to VNPay**
   ```json
   {
     "RspCode": "00",
     "Message": "Confirm Success"
   }
   ```

#### 3.3. Database Changes - IPN Processing

**Table: `payment_transaction`**
```sql
-- UPDATE payment transaction
SELECT * FROM payment_transaction WHERE order_id = 1;
```

| id | order_id | provider | amount | status | provider_transaction_id | completed_at | response_payload |
|----|----------|----------|--------|--------|------------------------|--------------|------------------|
| 1 | 1 | VNPAY | 120000.00 | SUCCESS | 14226112 | 2025-11-01 10:05:35 | {"vnp_ResponseCode":"00",...} |

**Changes:**
- ✅ `status`: `INIT` → `SUCCESS`
- ✅ `provider_transaction_id`: NULL → `14226112`
- ✅ `completed_at`: NULL → `2025-11-01 10:05:35`
- ✅ `response_payload`: NULL → JSON chứa toàn bộ response từ VNPay

**Table: `order`**
```sql
SELECT id, order_code, status, payment_status, updated_at FROM `order` WHERE id = 1;
```

| id | order_code | status | payment_status | updated_at |
|----|------------|--------|----------------|------------|
| 1 | ORD1730448000ABC123 | PAID | PAID | 2025-11-01 10:05:35 |

**Changes:**
- ✅ `status`: `PENDING_PAYMENT` → `PAID`
- ✅ `payment_status`: `PENDING` → `PAID`
- ✅ `updated_at`: Updated to current timestamp

**Table: `store_ledger` (MỚI - Tạo ledger entry)**
```sql
-- INSERT store ledger entry
SELECT * FROM store_ledger WHERE order_id = 1;
```

| id | store_id | order_id | total_order_amount | app_commission_amount | payment_gateway_fee | net_amount_owed | status | created_at |
|----|----------|----------|-------------------|----------------------|---------------------|----------------|--------|------------|
| 1 | 1 | 1 | 120000.00 | 24000.00 | 1200.00 | 94800.00 | UNPAID | 2025-11-01 10:05:35 |

**Công thức tính toán:**
```
total_order_amount = 120000.00 (từ order.total_payable)
app_commission_amount = 120000.00 * 0.20 = 24000.00 (20% hoa hồng app)
payment_gateway_fee = 120000.00 * 0.01 = 1200.00 (1% phí VNPay)
net_amount_owed = 120000.00 - 24000.00 - 1200.00 = 94800.00 (tiền store nhận)
```

**Changes:**
- ✅ Tạo mới ledger entry
- ✅ `status`: `UNPAID` (chờ thanh toán cho store)
- ✅ Tracking chi tiết hoa hồng và phí

---

### BƯỚC 4: VNPay redirect về Return URL (Browser)

#### 4.1. VNPay redirect browser

**VNPay sẽ redirect browser đến:**
```http
GET https://shieldless-pamula-adhesively.ngrok-free.dev/home/api/v1/payments/vnpay-return?
  vnp_TmnCode=D1GOXCFX&
  vnp_Amount=12000000&
  vnp_BankCode=NCB&
  vnp_ResponseCode=00&
  vnp_TransactionStatus=00&
  vnp_TxnRef=ORD1730448000ABC123&
  vnp_TransactionNo=14226112&
  vnp_PayDate=20251101100530&
  vnp_SecureHash=abc123...
```

#### 4.2. Backend xử lý Return URL

**⚠️ QUAN TRỌNG - ĐÃ CẬP NHẬT:**
Do VNPay Sandbox **KHÔNG tự động gọi IPN URL** trong môi trường test, Return URL đã được sửa để **VỪA cập nhật database VỪA hiển thị HTML**.

**Các bước xử lý:**

1. **Verify Checksum** ✅
2. **Gọi processVnPayIPN() để cập nhật Database** ✅ (MỚI)
   - Cập nhật payment_transaction status → SUCCESS
   - Cập nhật order status → PAID
   - Tạo store_ledger entry
3. **Build HTML Response** ✅

**Response HTML (Success):**
```html
<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <title>Thanh toán thành công</title>
</head>
<body>
    <h1>Thanh toán thành công!</h1>
    <p>Mã đơn hàng: ORD1730448000ABC123</p>
    <p>Số tiền: 120,000 VNĐ</p>
    <p>Mã giao dịch: 14226112</p>
    <p>Thời gian: 01/11/2025 10:05:30</p>
    <a href='/home/orders.html'>Xem đơn hàng</a>
</body>
</html>
```

#### 4.3. Database Changes - Return URL Processing

**⚠️ ĐÃ THAY ĐỔI - Return URL giờ CẬP NHẬT DATABASE**

**Table: `payment_transaction`**
```sql
SELECT * FROM payment_transaction WHERE order_id = 1;
```

| id | order_id | provider | amount | status | provider_transaction_id | completed_at |
|----|----------|----------|--------|--------|------------------------|--------------|
| 1 | 1 | VNPAY | 120000.00 | SUCCESS | 14226112 | 2025-11-01 10:05:36 |

**Changes:**
- ✅ `status`: `INIT` → `SUCCESS`
- ✅ `provider_transaction_id`: NULL → `14226112`
- ✅ `completed_at`: NULL → `2025-11-01 10:05:36`

**Table: `order`**
```sql
SELECT id, order_code, status, payment_status FROM `order` WHERE id = 1;
```

| id | order_code | status | payment_status |
|----|------------|--------|----------------|
| 1 | ORD1730448000ABC123 | PAID | PAID |

**Changes:**
- ✅ `status`: `PENDING_PAYMENT` → `PAID`
- ✅ `payment_status`: `PENDING` → `PAID`

**Table: `store_ledger`**
```sql
SELECT * FROM store_ledger WHERE order_id = 1;
```

| id | store_id | order_id | total_order_amount | app_commission_amount | payment_gateway_fee | net_amount_owed | status |
|----|----------|----------|-------------------|----------------------|---------------------|----------------|--------|
| 1 | 1 | 1 | 120000.00 | 24000.00 | 1200.00 | 94800.00 | UNPAID |

**Changes:**
- ✅ Tạo mới ledger entry

**Lưu ý:**
- ✅ Return URL giờ có khả năng idempotency - nếu gọi lại sẽ trả về code "02" (already confirmed)
- ✅ Nếu IPN URL được gọi SAU Return URL, sẽ không có duplicate updates

---

### BƯỚC 5: Verify kết quả cuối cùng

#### 5.1. Kiểm tra Payment Transaction

```sql
SELECT 
    pt.id,
    pt.order_id,
    pt.provider,
    pt.amount,
    pt.status,
    pt.provider_transaction_id,
    pt.created_at,
    pt.completed_at,
    TIMESTAMPDIFF(SECOND, pt.created_at, pt.completed_at) as processing_time_seconds
FROM payment_transaction pt
WHERE pt.order_id = 1;
```

**Expected Result:**
| id | order_id | provider | amount | status | provider_transaction_id | created_at | completed_at | processing_time_seconds |
|----|----------|----------|--------|--------|------------------------|------------|--------------|------------------------|
| 1 | 1 | VNPAY | 120000.00 | SUCCESS | 14226112 | 2025-11-01 10:00:00 | 2025-11-01 10:05:35 | 335 |

#### 5.2. Kiểm tra Order

```sql
SELECT 
    o.id,
    o.order_code,
    o.user_id,
    o.store_id,
    o.subtotal,
    o.delivery_fee,
    o.total_payable,
    o.status,
    o.payment_status,
    o.created_at,
    o.updated_at
FROM `order` o
WHERE o.id = 1;
```

**Expected Result:**
| id | order_code | user_id | store_id | subtotal | delivery_fee | total_payable | status | payment_status | created_at | updated_at |
|----|------------|---------|----------|----------|--------------|---------------|--------|----------------|------------|------------|
| 1 | ORD1730448000ABC123 | 1 | 1 | 90000.00 | 30000.00 | 120000.00 | PAID | PAID | 2025-11-01 09:55:00 | 2025-11-01 10:05:35 |

#### 5.3. Kiểm tra Store Ledger

```sql
SELECT 
    sl.id,
    sl.store_id,
    sl.order_id,
    sl.total_order_amount,
    sl.app_commission_amount,
    sl.payment_gateway_fee,
    sl.net_amount_owed,
    sl.status,
    sl.payout_batch_id,
    sl.created_at,
    s.name as store_name
FROM store_ledger sl
JOIN store s ON sl.store_id = s.id
WHERE sl.order_id = 1;
```

**Expected Result:**
| id | store_id | order_id | total_order_amount | app_commission_amount | payment_gateway_fee | net_amount_owed | status | payout_batch_id | created_at | store_name |
|----|----------|----------|-------------------|----------------------|---------------------|----------------|--------|-----------------|------------|------------|
| 1 | 1 | 1 | 120000.00 | 24000.00 | 1200.00 | 94800.00 | UNPAID | NULL | 2025-11-01 10:05:35 | Quán Cơm Tấm Sài Gòn |

#### 5.4. Kiểm tra Order Items

```sql
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    p.name as product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM order_item oi
JOIN product p ON oi.product_id = p.id
WHERE oi.order_id = 1;
```

**Expected Result:**
| id | order_id | product_id | product_name | quantity | unit_price | total_price |
|----|----------|------------|--------------|----------|------------|-------------|
| 1 | 1 | 1 | Cơm Tấm Sườn Bì Chả | 2 | 45000.00 | 90000.00 |

---

## 📊 Database Changes Tracking - Summary

### Timeline của các thay đổi Database

```
T0: 09:55:00 - Order được tạo (CREATED)
├─ INSERT INTO order (status=CREATED, payment_status=PENDING)
├─ INSERT INTO order_item
│
T1: 10:00:00 - Khởi tạo thanh toán (Init Payment)
├─ INSERT INTO payment_transaction (status=INIT)
├─ UPDATE order SET status=PENDING_PAYMENT
│
T2: 10:05:30 - Khách hàng thanh toán tại VNPay
│   (Không có thay đổi trong DB của chúng ta)
│
T3: 10:05:35 - VNPay gọi IPN URL (Server callback)
├─ UPDATE payment_transaction SET status=SUCCESS, provider_transaction_id=..., completed_at=...
├─ UPDATE order SET status=PAID, payment_status=PAID, updated_at=...
├─ INSERT INTO store_ledger (calculate commissions & fees)
│
T4: 10:05:36 - VNPay redirect Return URL (Browser)
└─ UPDATE payment_transaction SET status=SUCCESS, provider_transaction_id=..., completed_at=...
   UPDATE order SET status=PAID, payment_status=PAID
   INSERT INTO store_ledger (nếu chưa có)
```

### Tổng hợp thay đổi theo Table

#### Table: `order`
| Thời điểm | status | payment_status | updated_at | Trigger |
|-----------|--------|----------------|------------|---------|
| T0 (09:55:00) | CREATED | PENDING | 2025-11-01 09:55:00 | Tạo order |
| T1 (10:00:00) | PENDING_PAYMENT | PENDING | 2025-11-01 10:00:00 | Init payment |
| T3 (10:05:35) | PAID | PAID | 2025-11-01 10:05:35 | IPN callback |
| T4 (10:05:36) | PAID | PAID | 2025-11-01 10:05:36 | Return URL |

#### Table: `payment_transaction`
| Thời điểm | status | provider_transaction_id | completed_at | Trigger |
|-----------|--------|------------------------|--------------|---------|
| T1 (10:00:00) | INIT | NULL | NULL | Init payment |
| T3 (10:05:35) | SUCCESS | 14226112 | 2025-11-01 10:05:35 | IPN callback |
| T4 (10:05:36) | SUCCESS | 14226112 | 2025-11-01 10:05:36 | Return URL |

#### Table: `store_ledger`
| Thời điểm | Action | status | net_amount_owed | Trigger |
|-----------|--------|--------|----------------|---------|
| T3 (10:05:35) | INSERT | UNPAID | 94800.00 | IPN callback (payment success) |
| T4 (10:05:36) | INSERT (nếu chưa có) | UNPAID | 94800.00 | Return URL |

---

## 🧪 Test Cases

### Test Case 1: Thanh toán thành công (Happy Path)
**Preconditions:**
- Order với status = `CREATED`, payment_status = `PENDING`
- Total amount = 120,000 VNĐ

**Steps:**
1. Call `/api/v1/payments/init`
2. Open payment URL in browser
3. Complete payment với test credentials
4. Wait for IPN callback

**Expected Results:**
- ✅ Payment transaction status = `SUCCESS`
- ✅ Order status = `PAID`
- ✅ Store ledger created với đúng calculations
- ✅ Return URL hiển thị success page

**Database Assertions:**
```sql
-- Payment transaction
SELECT status FROM payment_transaction WHERE order_id = 1;
-- Expected: SUCCESS

-- Order
SELECT status, payment_status FROM `order` WHERE id = 1;
-- Expected: PAID, PAID

-- Store ledger
SELECT COUNT(*) FROM store_ledger WHERE order_id = 1;
-- Expected: 1
```

---

### Test Case 2: Order đã thanh toán (Idempotency)
**Preconditions:**
- Order đã có payment transaction với status = `SUCCESS`

**Steps:**
1. VNPay gọi IPN URL lần 2 (retry hoặc duplicate)

**Expected Results:**
- ✅ IPN trả về `{"RspCode": "02", "Message": "Order already confirmed"}`
- ✅ KHÔNG có thay đổi trong database
- ✅ VNPay dừng retry (do nhận code 02)

**Database Assertions:**
```sql
-- Không có INSERT hoặc UPDATE mới
SELECT updated_at FROM `order` WHERE id = 1;
-- Updated_at không thay đổi

SELECT COUNT(*) FROM store_ledger WHERE order_id = 1;
-- Expected: 1 (không duplicate)
```

---

### Test Case 3: Invalid Checksum
**Preconditions:**
- VNPay gọi IPN với checksum sai hoặc bị modify

**Steps:**
1. Mock IPN request với vnp_SecureHash sai

**Expected Results:**
- ✅ IPN trả về `{"RspCode": "97", "Message": "Invalid Checksum"}`
- ✅ KHÔNG có thay đổi trong database
- ✅ VNPay retry (do nhận code 97)

---

### Test Case 4: Invalid Amount
**Preconditions:**
- Order total = 120,000 VNĐ
- VNPay gọi IPN với amount = 100,000 VNĐ (sai)

**Steps:**
1. Mock IPN request với vnp_Amount không khớp

**Expected Results:**
- ✅ IPN trả về `{"RspCode": "04", "Message": "Invalid Amount"}`
- ✅ KHÔNG có thay đổi trong database
- ✅ Payment transaction status vẫn là `INIT`

---

### Test Case 5: Khách hàng hủy thanh toán
**Preconditions:**
- Order với payment transaction status = `INIT`

**Steps:**
1. Open payment URL
2. Click "Hủy giao dịch" tại VNPay

**Expected Results:**
- ✅ VNPay gọi IPN với vnp_ResponseCode = `24`
- ✅ Payment transaction status = `FAILED`
- ✅ Order status quay về `CREATED`
- ✅ Payment status = `FAILED`
- ✅ KHÔNG tạo store ledger

**Database Assertions:**
```sql
SELECT status FROM payment_transaction WHERE order_id = 1;
-- Expected: FAILED

SELECT status, payment_status FROM `order` WHERE id = 1;
-- Expected: CREATED, FAILED

SELECT COUNT(*) FROM store_ledger WHERE order_id = 1;
-- Expected: 0
```

---

## 🛠️ Troubleshooting

### Vấn đề 1: IPN không được gọi

**Triệu chứng:**
- Payment transaction vẫn ở status `INIT` sau khi thanh toán
- Order status vẫn là `PENDING_PAYMENT`

**Nguyên nhân:**
- Ngrok không chạy hoặc URL đã expired
- Return URL trong config sai

**Giải pháp:**
```bash
# 1. Kiểm tra Ngrok
GET http://localhost:8080/home/api/v1/ngrok/status

# 2. Kiểm tra Ngrok web interface
Open http://localhost:4040/inspect/http

# 3. Restart Ngrok nếu cần
ngrok http 8080

# 4. Update return-url trong application.yaml
vnpay:
  return-url: "https://{NEW_NGROK_URL}/home/api/v1/payments/vnpay-return"

# 5. Restart Spring Boot app
```

---

### Vấn đề 2: Invalid Checksum

**Triệu chứng:**
- IPN trả về RspCode = `97`
- Log: "Invalid checksum for transaction"

**Nguyên nhân:**
- Hash secret không đúng
- Parameters không được sort đúng
- Encoding issues

**Giải pháp:**
```java
// 1. Verify hash secret
vnpay:
  hash-secret: "FMX97DS9752G5SWI40ZPBO3R2EQMQ9H5"

// 2. Debug - In ra hashData trước khi hash
log.info("Hash data before signing: {}", hashData.toString());

// 3. So sánh với VNPay documentation
```

---

### Vấn đề 3: Store Ledger không được tạo

**Triệu chứng:**
- Payment thành công nhưng không có entry trong store_ledger

**Nguyên nhân:**
- Exception trong ledgerService.createLedgerEntryForOrder()
- Transaction rollback

**Giải pháp:**
```sql
-- 1. Kiểm tra logs
tail -f logs/application.log | grep "ledger"

-- 2. Kiểm tra store tồn tại
SELECT * FROM store WHERE id = 1;

-- 3. Manual insert nếu cần (tạm thời)
INSERT INTO store_ledger (store_id, order_id, total_order_amount, app_commission_amount, payment_gateway_fee, net_amount_owed, status, created_at)
SELECT 
    o.store_id,
    o.id,
    o.total_payable,
    o.total_payable * 0.20,
    o.total_payable * 0.01,
    o.total_payable - (o.total_payable * 0.20) - (o.total_payable * 0.01),
    'UNPAID',
    NOW()
FROM `order` o
WHERE o.id = 1;
```

---

### Vấn đề 4: Amount mismatch

**Triệu chứng:**
- IPN trả về RspCode = `04`
- Log: "Amount mismatch. Expected: X, Received: Y"

**Nguyên nhân:**
- Order amount đã thay đổi sau khi init payment
- Rounding issues

**Giải pháp:**
```sql
-- 1. Verify order amount
SELECT total_payable FROM `order` WHERE id = 1;

-- 2. Check payment transaction
SELECT amount FROM payment_transaction WHERE order_id = 1;

-- 3. Compare
-- VNPay amount (x100): 12000000 = 120000.00 VNĐ
-- Order amount: 120000.00 VNĐ
-- Should match!
```

---

## 📈 Metrics to Track

### Performance Metrics
```sql
-- Average payment processing time
SELECT 
    AVG(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as avg_seconds,
    MIN(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as min_seconds,
    MAX(TIMESTAMPDIFF(SECOND, created_at, completed_at)) as max_seconds
FROM payment_transaction
WHERE status = 'SUCCESS'
  AND completed_at IS NOT NULL;
```

### Success Rate
```sql
-- Payment success rate
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM payment_transaction), 2) as percentage
FROM payment_transaction
GROUP BY status;
```

### Revenue Tracking
```sql
-- Total revenue by store
SELECT 
    s.id,
    s.name,
    COUNT(sl.id) as total_orders,
    SUM(sl.total_order_amount) as total_revenue,
    SUM(sl.app_commission_amount) as total_commission,
    SUM(sl.net_amount_owed) as net_to_store
FROM store s
LEFT JOIN store_ledger sl ON s.id = sl.store_id
GROUP BY s.id, s.name;
```

---

## 📋 Demo Checklist

### Pre-Demo
- [ ] MySQL running
- [ ] Spring Boot app running
- [ ] Ngrok running and URL verified
- [ ] Test data prepared (user, store, product, order)
- [ ] Postman collection imported
- [ ] Browser ready for VNPay page

### During Demo
- [ ] Show initial database state
- [ ] Call init payment API
- [ ] Show database changes after init
- [ ] Open payment URL in browser
- [ ] Complete payment with test card
- [ ] Show IPN callback in Ngrok logs
- [ ] Show database changes after IPN
- [ ] Show return URL success page
- [ ] Verify final database state

### Post-Demo
- [ ] Show all database tables
- [ ] Explain ledger calculations
- [ ] Demonstrate idempotency (retry IPN)
- [ ] Show error handling (invalid checksum)
- [ ] Q&A

---

## 🎯 Key Points to Emphasize

1. **Security**
   - ✅ Checksum verification prevents tampering
   - ✅ HTTPS required for production
   - ✅ Idempotency prevents duplicate charges

2. **Reliability**
   - ✅ Transaction management ensures data consistency
   - ✅ IPN retry mechanism handles network failures
   - ✅ Comprehensive error handling

3. **Transparency**
   - ✅ Store ledger tracks all financial flows
   - ✅ Detailed logging for audit trail
   - ✅ Clear status tracking

4. **User Experience**
   - ✅ Beautiful success/failure pages
   - ✅ Clear error messages
   - ✅ Smooth redirect flow

---

**Last Updated:** November 1, 2025
**Demo Duration:** 15-20 minutes
**Audience:** Technical stakeholders, Product team
