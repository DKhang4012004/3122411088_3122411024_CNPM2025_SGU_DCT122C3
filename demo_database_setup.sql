-- =====================================================
-- DEMO DATABASE SETUP SCRIPT
-- Drone Delivery Payment System
-- Created: 2025-10-31
-- =====================================================

-- 1. CLEAN UP (Optional - chỉ dùng nếu muốn reset)
-- DELETE FROM payout_batch;
-- DELETE FROM store_ledger;
-- DELETE FROM payment_transaction;
-- DELETE FROM order_item;
-- DELETE FROM orders;
-- DELETE FROM product;
-- DELETE FROM product_category;
-- DELETE FROM store;
-- DELETE FROM users WHERE id IN (1, 2, 3);

-- =====================================================
-- 2. CREATE DEMO DATA
-- =====================================================

-- 2.1 Users (Khách hàng và Owner)
INSERT INTO users (id, username, email, password, full_name, phone_number, status, created_at)
VALUES
(1, 'customer1', 'customer1@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn A', '0901234567', 'ACTIVE', NOW()),
(2, 'store_owner1', 'owner1@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị B (Chủ quán)', '0907654321', 'ACTIVE', NOW()),
(3, 'customer2', 'customer2@demo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Văn C', '0903456789', 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE username=username;

-- 2.2 Store (Cửa hàng)
INSERT INTO store (id, owner_user_id, name, description, bank_account_name, bank_account_number, bank_name, bank_branch, payout_email, status, created_at)
VALUES
(1, 2, 'Nhà hàng Phở Hà Nội', 'Chuyên các món ăn Việt Nam truyền thống', 'TRAN THI B', '1234567890', 'Vietcombank', 'Chi nhánh Tân Bình', 'owner1@demo.com', 'ACTIVE', NOW()),
(2, 2, 'Quán Cơm Tấm Sài Gòn', 'Cơm tấm đặc sản miền Nam', 'TRAN THI B', '0987654321', 'Techcombank', 'Chi nhánh Quận 1', 'owner1@demo.com', 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE name=name;

-- 2.3 Product Categories
INSERT INTO product_category (id, name, slug, status, description, created_at)
VALUES
(1, 'Món chính', 'mon-chinh', 'ACTIVE', 'Các món ăn chính', NOW()),
(2, 'Đồ uống', 'do-uong', 'ACTIVE', 'Nước giải khát', NOW()),
(3, 'Tráng miệng', 'trang-mieng', 'ACTIVE', 'Món tráng miệng', NOW())
ON DUPLICATE KEY UPDATE name=name;

-- 2.4 Products (Sản phẩm của cửa hàng)
INSERT INTO product (id, category_id, store_id, sku, name, description, base_price, currency, quantity_available, reserved_quantity, safety_stock, status, weight_gram, created_at)
VALUES
-- Store 1: Phở Hà Nội
(1, 1, 1, 'PHO-BO-TAI', 'Phở bò tái', 'Phở bò tái đặc biệt với thịt bò tươi', 50000, 'VND', 100, 0, 10, 'ACTIVE', 800, NOW()),
(2, 1, 1, 'BUN-CHA', 'Bún chả Hà Nội', 'Bún chả truyền thống với chả nướng', 45000, 'VND', 100, 0, 10, 'ACTIVE', 700, NOW()),
(3, 1, 1, 'NEM-RAN', 'Nem rán', 'Nem rán giòn tan (5 miếng)', 30000, 'VND', 100, 0, 10, 'ACTIVE', 300, NOW()),
(4, 2, 1, 'TRA-DA', 'Trà đá', 'Trà đá truyền thống', 5000, 'VND', 200, 0, 20, 'ACTIVE', 200, NOW()),

-- Store 2: Cơm Tấm
(5, 1, 2, 'COM-TAM-SUON', 'Cơm tấm sườn nướng', 'Cơm tấm với sườn nướng thơm ngon', 40000, 'VND', 100, 0, 10, 'ACTIVE', 600, NOW()),
(6, 1, 2, 'COM-TAM-BI', 'Cơm tấm bì', 'Cơm tấm với bì heo giòn', 35000, 'VND', 100, 0, 10, 'ACTIVE', 550, NOW()),
(7, 2, 2, 'NUOC-NGOT', 'Nước ngọt', 'Pepsi/Coca cola', 10000, 'VND', 200, 0, 20, 'ACTIVE', 330, NOW())
ON DUPLICATE KEY UPDATE name=name;

-- =====================================================
-- 3. DEMO QUERIES
-- =====================================================

-- 3.1 Verify data
SELECT 'Users' as Table_Name, COUNT(*) as Count FROM users WHERE id IN (1,2,3)
UNION ALL
SELECT 'Stores', COUNT(*) FROM store WHERE id IN (1,2)
UNION ALL
SELECT 'Categories', COUNT(*) FROM product_category WHERE id IN (1,2,3)
UNION ALL
SELECT 'Products', COUNT(*) FROM product WHERE id IN (1,2,3,4,5,6,7);

-- 3.2 View products by store
SELECT
    s.id as store_id,
    s.name as store_name,
    p.id as product_id,
    p.name as product_name,
    p.base_price,
    p.quantity_available
FROM store s
JOIN product p ON p.store_id = s.id
ORDER BY s.id, p.id;

-- =====================================================
-- 4. USEFUL QUERIES DURING DEMO
-- =====================================================

-- 4.1 View all orders with payment status
SELECT
    o.id,
    o.order_code,
    o.user_id,
    u.full_name as customer_name,
    o.store_id,
    s.name as store_name,
    o.status as order_status,
    o.payment_status,
    o.total_payable,
    o.created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN store s ON o.store_id = s.id
ORDER BY o.created_at DESC;

-- 4.2 View payment transactions
SELECT
    pt.id,
    pt.order_id,
    o.order_code,
    pt.provider,
    pt.amount,
    pt.status as payment_status,
    pt.provider_transaction_id,
    pt.created_at,
    pt.completed_at
FROM payment_transaction pt
JOIN orders o ON pt.order_id = o.id
ORDER BY pt.created_at DESC;

-- 4.3 View store ledger (Công nợ)
SELECT
    sl.id,
    sl.store_id,
    s.name as store_name,
    sl.order_id,
    o.order_code,
    sl.total_order_amount,
    sl.app_commission_amount,
    sl.payment_gateway_fee,
    sl.net_amount_owed,
    sl.status as ledger_status,
    sl.payout_batch_id,
    sl.created_at
FROM store_ledger sl
JOIN store s ON sl.store_id = s.id
JOIN orders o ON sl.order_id = o.id
ORDER BY sl.created_at DESC;

-- 4.4 View payout batches
SELECT
    pb.id,
    pb.store_id,
    s.name as store_name,
    pb.total_payout_amount,
    pb.status as payout_status,
    pb.transaction_code,
    pb.notes,
    pb.created_at,
    pb.processed_at
FROM payout_batch pb
JOIN store s ON pb.store_id = s.id
ORDER BY pb.created_at DESC;

-- 4.5 Summary statistics
SELECT
    'Total Orders' as Metric,
    COUNT(*) as Value,
    CONCAT(FORMAT(SUM(total_payable), 0), ' VND') as Amount
FROM orders
WHERE payment_status = 'PAID'
UNION ALL
SELECT
    'Total Commission',
    COUNT(*),
    CONCAT(FORMAT(SUM(app_commission_amount), 0), ' VND')
FROM store_ledger
UNION ALL
SELECT
    'Unpaid to Stores',
    COUNT(*),
    CONCAT(FORMAT(SUM(net_amount_owed), 0), ' VND')
FROM store_ledger
WHERE status = 'UNPAID'
UNION ALL
SELECT
    'Paid to Stores',
    COUNT(DISTINCT payout_batch_id),
    CONCAT(FORMAT(SUM(total_payout_amount), 0), ' VND')
FROM payout_batch
WHERE status = 'PAID';

-- =====================================================
-- 5. RESET DATA (Use when needed to restart demo)
-- =====================================================

-- Clean transaction tables only (keep master data)
-- DELETE FROM payout_batch;
-- DELETE FROM store_ledger;
-- DELETE FROM payment_transaction;
-- DELETE FROM order_item;
-- DELETE FROM orders;
-- UPDATE product SET quantity_available = 100, reserved_quantity = 0 WHERE id <= 7;

-- =====================================================
-- 6. FEE CALCULATION EXAMPLE
-- =====================================================

/*
Example: Order with total 165,000 VND

1. Customer pays:        165,000 VND (100%)
2. App receives:         165,000 VND (via VNPay)
3. Breakdown:
   - Commission (20%):    33,000 VND (app keeps)
   - Gateway fee (1%):     1,650 VND (VNPay fee)
   - Net to store:       130,350 VND (79%)

4. Store receives:       130,350 VND

Formula:
net_amount_owed = total_order_amount - (total_order_amount * 0.20) - (total_order_amount * 0.01)
                = total_order_amount * 0.79
*/

-- Test calculation
SELECT
    165000 as total_order,
    165000 * 0.20 as commission_20_percent,
    165000 * 0.01 as gateway_fee_1_percent,
    165000 - (165000 * 0.20) - (165000 * 0.01) as net_to_store,
    ROUND((165000 - (165000 * 0.20) - (165000 * 0.01)) / 165000 * 100, 2) as store_percentage;

-- =====================================================
-- DEMO COMPLETE! 🎉
-- =====================================================
---

### **PHẦN 3: DEMO QUẢN LÝ CÔNG NỢ & THANH TOÁN CHO CỬA HÀNG (10 phút)**

#### Bước 4: Tạo thêm vài đơn hàng để có data
Lặp lại Bước 1-3 để tạo thêm 2-3 đơn hàng nữa (có thể dùng data khác)

#### Bước 5: Xem tổng công nợ chưa thanh toán
**Endpoint**: `GET /home/api/v1/ledger/store/1/unpaid-amount`

**Expected Response**:
```json
{
  "code": 200,
  "message": "Unpaid amount retrieved successfully",
  "result": 456230.50
}
```

**Giải thích**:
- Tổng số tiền cửa hàng chưa được thanh toán từ tất cả đơn hàng
- Đây là số tiền app nợ cửa hàng

---

#### Bước 6: Tạo lô thanh toán (Payout Batch)
**Endpoint**: `POST /home/api/v1/ledger/store/1/payout`

**Expected Response**:
```json
{
  "code": 200,
  "message": "Payout batch created successfully",
  "result": {
    "id": 1,
    "storeId": 1,
    "totalPayoutAmount": 456230.50,
    "status": "PENDING",
    "notes": "Payout for 4 orders",
    "createdAt": "2025-10-31T14:45:00"
  }
}
```

**Giải thích**:
- Hệ thống gộp tất cả đơn hàng UNPAID thành 1 lô thanh toán
- Tất cả StoreLedger chuyển từ `UNPAID` → `PROCESSING`
- Tạo PayoutBatch với status `PENDING`

**Demo Database**:
```sql
-- Xem PayoutBatch
SELECT * FROM payout_batch WHERE store_id = 1;

-- Xem StoreLedger đã chuyển status
SELECT id, order_id, net_amount_owed, status, payout_batch_id
FROM store_ledger
WHERE store_id = 1;
```

---

#### Bước 7: Đánh dấu đã thanh toán
**Endpoint**: `POST /home/api/v1/ledger/payout/1/mark-paid?transactionCode=BANK20251031001`

**Expected Response**:
```json
{
  "code": 200,
  "message": "Payout batch marked as paid successfully"
}
```

**Giải thích**:
- Admin/Kế toán đã chuyển tiền thực tế cho cửa hàng qua ngân hàng
- PayoutBatch chuyển sang `PAID`
- Tất cả StoreLedger trong batch chuyển sang `PAID`
- Ghi nhận mã giao dịch ngân hàng

**Demo Database**:
```sql
SELECT * FROM payout_batch WHERE id = 1;
-- status = 'PAID', transaction_code = 'BANK20251031001', processed_at = now()

SELECT status, payout_batch_id FROM store_ledger WHERE store_id = 1;
-- Tất cả đều status = 'PAID'
```

---

#### Bước 8: Xem lịch sử thanh toán
**Endpoint**: `GET /home/api/v1/ledger/store/1/payouts`

**Expected Response**:
```json
{
  "code": 200,
  "message": "Payout batches retrieved successfully",
  "result": [
    {
      "id": 1,
      "storeId": 1,
      "totalPayoutAmount": 456230.50,
      "status": "PAID",
      "transactionCode": "BANK20251031001",
      "notes": "Payout for 4 orders",
      "createdAt": "2025-10-31T14:45:00",
      "processedAt": "2025-10-31T14:50:00"
    }
  ]
}
```

---

### **PHẦN 4: DEMO TÍNH NĂNG BỔ SUNG (5 phút)**

#### 4.1 Xem chi tiết đơn hàng
**Endpoint**: `GET /home/api/v1/orders/{orderId}`

#### 4.2 Xem lịch sử đơn hàng của user
**Endpoint**: `GET /home/api/v1/orders/user/1`

#### 4.3 Xem đơn hàng của cửa hàng
**Endpoint**: `GET /home/api/v1/orders/store/1`

#### 4.4 Xem thông tin thanh toán của đơn hàng
**Endpoint**: `GET /home/api/v1/payments/order/1`

#### 4.5 Hủy đơn hàng (nếu chưa thanh toán)
**Endpoint**: `POST /home/api/v1/orders/{orderId}/cancel`

---

### **PHẦN 5: Q&A VÀ TỔNG KẾT (5 phút)**

#### Câu hỏi dự kiến:

**Q1: Làm sao đảm bảo webhook từ VNPay là hợp lệ?**
A: Sử dụng HMAC SHA512 signature verification. Mọi webhook đều được verify chữ ký trước khi xử lý.

**Q2: Nếu webhook bị miss (network error) thì sao?**
A: Có thể implement:
- Retry mechanism từ VNPay
- Reconciliation job chạy định kỳ để đối soát với VNPay

**Q3: Tại sao phải có StoreLedger? Không thanh toán trực tiếp cho cửa hàng?**
A: Vì:
- Cần ghi nhận từng giao dịch để đối soát
- Cần tính phí hoa hồng và phí gateway riêng biệt
- Cần gộp nhiều đơn thành 1 lô để giảm phí chuyển khoản
- Cần audit trail để kiểm toán

**Q4: Cửa hàng có thể xem công nợ của mình không?**
A: Có thể mở rộng:
- Tạo Store Portal
- API cho cửa hàng xem: unpaid amount, payout history
- Dashboard theo dõi doanh thu

---

## 📊 METRICS & KẾT QUẢ DEMO

### Metrics cần show:
```sql
-- Tổng số đơn hàng
SELECT COUNT(*) FROM orders WHERE payment_status = 'PAID';

-- Tổng doanh thu
SELECT SUM(total_payable) FROM orders WHERE payment_status = 'PAID';

-- Tổng hoa hồng app thu được
SELECT SUM(app_commission_amount) FROM store_ledger;

-- Tổng tiền đã thanh toán cho cửa hàng
SELECT SUM(total_payout_amount) FROM payout_batch WHERE status = 'PAID';

-- Tổng công nợ chưa thanh toán
SELECT SUM(net_amount_owed) FROM store_ledger WHERE status = 'UNPAID';
```

---

## 🎬 CHECKLIST TRƯỚC KHI DEMO

### Technical Checklist:
- [ ] Database đã có dữ liệu mẫu (users, stores, products)
- [ ] Application đang chạy (port 8080)
- [ ] Postman collection đã import và test thử
- [ ] Logs console mở sẵn để show real-time
- [ ] MySQL Workbench mở sẵn để show database changes

### Presentation Checklist:
- [ ] Slide giới thiệu mô hình Marketplace
- [ ] Diagram luồng thanh toán
- [ ] Code highlights (PaymentService, LedgerService)
- [ ] Database schema diagram

### Demo Flow Checklist:
- [ ] Scenario đã được rehearse
- [ ] Backup plan nếu API fail (screenshot responses)
- [ ] Q&A preparation

---

## 🎯 KEY TAKEAWAYS

### Điểm mạnh của hệ thống:
1. ✅ **Tự động hóa hoàn toàn**: Từ thanh toán đến ghi nhận công nợ
2. ✅ **Minh bạch**: Mọi giao dịch đều có audit trail
3. ✅ **Chính xác**: Tính toán phí tự động, không sai sót
4. ✅ **Scalable**: Có thể mở rộng cho nhiều cửa hàng
5. ✅ **Secure**: HMAC signature, webhook verification

### Công nghệ sử dụng:
- Spring Boot 3.x
- Spring Security
- JPA/Hibernate
- MySQL
- VNPay Payment Gateway
- RESTful API

---

## 📝 NOTES CHO PRESENTER

### Tips khi demo:
1. **Slow down**: Giải thích rõ từng bước, đừng vội
2. **Show code**: Highlight các đoạn code quan trọng (webhook handler, ledger creation)
3. **Show database**: Để audience thấy data thay đổi real-time
4. **Explain why**: Giải thích tại sao cần từng bước, không chỉ show "how"
5. **Interactive**: Hỏi audience xem họ có câu hỏi không sau mỗi phần

### Câu nói quan trọng:
- "Đây là điểm đặc biệt của Marketplace model..."
- "Webhook này rất quan trọng vì nó tự động hóa toàn bộ quy trình..."
- "StoreLedger giúp chúng ta ghi nhận chính xác từng giao dịch..."
- "Payout Batch giúp tối ưu chi phí chuyển khoản ngân hàng..."

---

## 🚀 READY TO DEMO!

Chúc bạn demo thành công! 🎉
# KẾ HOẠCH DEMO CHỨC NĂNG THANH TOÁN
## DRONE DELIVERY - MARKETPLACE PAYMENT SYSTEM

**Ngày demo**: 31/10/2025
**Thời gian**: 30-45 phút
**Mục tiêu**: Trình bày đầy đủ luồng thanh toán từ đặt hàng đến thanh toán cho cửa hàng

---

## 📋 CHUẨN BỊ TRƯỚC DEMO

### 1. Chuẩn bị Database
```sql
-- Tạo dữ liệu mẫu cho demo
-- User (Khách hàng)
INSERT INTO users (id, username, email, password, full_name, phone_number, status)
VALUES (1, 'customer1', 'customer@demo.com', '$2a$10$hashed', 'Nguyễn Văn A', '0901234567', 'ACTIVE');

-- Store (Cửa hàng)
INSERT INTO store (id, owner_user_id, name, description, status)
VALUES (1, 2, 'Nhà hàng Phở Hà Nội', 'Chuyên các món Việt Nam', 'ACTIVE');

-- Product Category
INSERT INTO product_category (id, name, slug, status)
VALUES (1, 'Món chính', 'mon-chinh', 'ACTIVE');

-- Products
INSERT INTO product (id, category_id, store_id, sku, name, description, base_price, currency, quantity_available, status)
VALUES
(1, 1, 1, 'PHO-BO', 'Phở bò tái', 'Phở bò tái đặc biệt', 50000, 'VND', 100, 'ACTIVE'),
(2, 1, 1, 'BUN-CHA', 'Bún chả Hà Nội', 'Bún chả truyền thống', 45000, 'VND', 100, 'ACTIVE'),
(3, 1, 1, 'COM-TAM', 'Cơm tấm sườn', 'Cơm tấm sườn nướng', 40000, 'VND', 100, 'ACTIVE');
```

### 2. Cấu hình VNPay (Sandbox)
```yaml
vnpay:
  tmn-code: "DEMO"
  hash-secret: "DEMO_SECRET"
  url: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
  return-url: "http://localhost:8080/home/api/v1/payments/vnpay-return"
```

### 3. Khởi động ứng dụng
```bash
cd C:\Users\admin\Desktop\CNPM\3122411088_3122411024_CNPM2025_SGU_DCT122C3
mvnw.cmd spring-boot:run
```

### 4. Tools cần thiết
- ✅ Postman hoặc Thunder Client
- ✅ Browser để test payment URL
- ✅ MySQL Workbench để xem database
- ✅ Logs console để theo dõi

---

## 🎯 KỊch BẢN DEMO (30 PHÚT)

### **PHẦN 1: GIỚI THIỆU HỆ THỐNG (5 phút)**

#### 1.1 Giới thiệu mô hình Marketplace
```
┌─────────────────────────────────────────────────────┐
│          LUỒNG THANH TOÁN MARKETPLACE               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Khách hàng  ──► App (Merchant) ──► Cửa hàng      │
│      │              │                    ▲         │
│      │              │                    │         │
│   Thanh toán    Thu tiền 100%      Nhận 79%       │
│   100,000đ      qua VNPay         (sau trừ phí)   │
│                                                     │
│   Phí hoa hồng: 20% (20,000đ)                     │
│   Phí VNPay:     1%  (1,000đ)                     │
│   ════════════════════════════════                 │
│   Cửa hàng nhận: 79,000đ                          │
└─────────────────────────────────────────────────────┘
```

#### 1.2 Giới thiệu các thành phần
- **Entities**: Order, PaymentTransaction, StoreLedger, PayoutBatch
- **Services**: OrderService, PaymentService, LedgerService
- **Controllers**: OrderController, PaymentController, LedgerController

---

### **PHẦN 2: DEMO LUỒNG ĐẶT HÀNG & THANH TOÁN (10 phút)**

#### Bước 1: Tạo đơn hàng
**Endpoint**: `POST /home/api/v1/orders`

```json
{
  "userId": 1,
  "storeId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 1
    }
  ]
}
```

**Expected Response**:
```json
{
  "code": 200,
  "message": "Order created successfully",
  "result": {
    "id": 1,
    "orderCode": "ORD1730361234567ABC12345",
    "userId": 1,
    "storeId": 1,
    "storeName": "Nhà hàng Phở Hà Nội",
    "status": "CREATED",
    "paymentStatus": "PENDING",
    "totalItemAmount": 145000,
    "shippingFee": 20000,
    "totalPayable": 165000,
    "items": [
      {
        "productId": 1,
        "productName": "Phở bò tái",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000
      },
      {
        "productId": 2,
        "productName": "Bún chả Hà Nội",
        "quantity": 1,
        "unitPrice": 45000,
        "totalPrice": 45000
      }
    ]
  }
}
```

**Giải thích**:
- ✅ Đơn hàng được tạo với trạng thái `CREATED`
- ✅ Tồn kho sản phẩm được `reserve` (giữ hàng)
- ✅ Tính toán tự động: Tổng tiền món + Phí ship = 165,000đ

---

#### Bước 2: Khởi tạo thanh toán
**Endpoint**: `POST /home/api/v1/payments/init`

```json
{
  "orderId": 1,
  "provider": "VNPAY",
  "method": "QR"
}
```

**Expected Response**:
```json
{
  "code": 200,
  "message": "Payment initialized successfully",
  "result": {
    "id": 1,
    "orderId": 1,
    "provider": "VNPAY",
    "amount": 165000,
    "currency": "VND",
    "status": "INIT",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=16500000&vnp_Command=pay&...",
    "createdAt": "2025-10-31T14:30:00"
  }
}
```

**Demo actions**:
1. Copy `paymentUrl` từ response
2. Mở browser và paste URL
3. Hiển thị màn hình thanh toán VNPay (Sandbox)

**Giải thích**:
- ✅ Tạo bản ghi `PaymentTransaction` với status `INIT`
- ✅ Generate payment URL với HMAC SHA512 signature
- ✅ Đơn hàng chuyển sang trạng thái `PENDING_PAYMENT`

---

#### Bước 3: Mô phỏng thanh toán thành công
**Endpoint**: `POST /home/api/v1/payments/vnpay-webhook` (VNPay sẽ tự động gọi)

```json
{
  "vnp_TmnCode": "DEMO",
  "vnp_Amount": "16500000",
  "vnp_BankCode": "NCB",
  "vnp_BankTranNo": "VNP123456789",
  "vnp_CardType": "ATM",
  "vnp_PayDate": "20251031143000",
  "vnp_OrderInfo": "Payment for order ORD1730361234567ABC12345",
  "vnp_TransactionNo": "14012345",
  "vnp_ResponseCode": "00",
  "vnp_TransactionStatus": "00",
  "vnp_TxnRef": "ORD1730361234567ABC12345",
  "vnp_SecureHash": "generated_hash_here"
}
```

**Expected Response**: `"Webhook processed successfully"`

**Giải thích - Điểm QUAN TRỌNG nhất**:
```java
// Khi webhook success, hệ thống tự động:
1. Xác thực chữ ký HMAC SHA512 ✅
2. Cập nhật PaymentTransaction → SUCCESS ✅
3. Cập nhật Order → PAID ✅
4. *** GHI NHẬN CÔNG NỢ CHO CỬA HÀNG *** ✅
   - Tạo StoreLedger entry
   - Tính toán:
     * Total: 165,000đ
     * Commission (20%): 33,000đ
     * Gateway fee (1%): 1,650đ
     * Net owed: 130,350đ (Cửa hàng sẽ nhận)
```

**Demo Database - Show table `store_ledger`**:
```sql
SELECT * FROM store_ledger WHERE order_id = 1;

-- Kết quả:
| id | store_id | order_id | total_order_amount | app_commission_amount | payment_gateway_fee | net_amount_owed | status |
|----|----------|----------|--------------------|-----------------------|---------------------|-----------------|--------|
| 1  | 1        | 1        | 165000.00          | 33000.00              | 1650.00             | 130350.00       | UNPAID |
```


