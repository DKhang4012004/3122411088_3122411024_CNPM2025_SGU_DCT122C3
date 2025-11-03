"status": "ACTIVE",
    "items": [
      {
        "cartItemId": 10,
        "productId": 1,
        "productName": "Cơm gà",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000
      }
    ],
    "totalAmount": 100000
  }
}
```

---

### **BƯỚC 7: Tạo đơn hàng từ giỏ hàng**

**Endpoint:** `POST /home/api/v1/orders`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "deliveryNote": "Giao trước 12h",
  "voucherCode": null
}
```

**Lưu ý:** 
- ✅ Không cần truyền `userId` nữa - hệ thống tự động lấy từ JWT token
- ✅ Chỉ cần đăng nhập và có giỏ hàng ACTIVE là có thể tạo đơn

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order created successfully",
  "result": {
    "id": 30,
    "orderCode": "ORD1762060123456ABCD1234",
    "userId": 23,
    "storeId": 1,
    "storeName": "Nhà hàng ABC",
    "status": "CREATED",
    "paymentStatus": "PENDING",
    "totalItemAmount": 100000,
    "shippingFee": 20000,
    "totalPayable": 120000,
    "items": [
      {
        "productId": 1,
        "productName": "Cơm gà",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000
      }
    ],
    "createdAt": "2025-11-02T20:00:00"
  }
}
```

**Database Check:**
- Bảng `orders`: 
  - `id = 30`, `order_code = 'ORD...'`
  - `user_id = 23` (lấy từ token)
  - `status = 'CREATED'`
  - `payment_status = 'PENDING'`
  - `total_payable = 120000`
  
- Bảng `order_item`:
  - `order_id = 30`, `product_id = 1`, `quantity = 2`

- Bảng `product`:
  - `quantity_available` giảm đi 2
  - `reserved_quantity` tăng lên 2

- Bảng `cart`:
  - `status = 'CHECKED_OUT'`
  
- Bảng `cart_item`:
  - ✅ **Các items đã bị XÓA hoàn toàn** (không còn record nào)

**Action:**
- Lưu lại `orderId = 30` và `orderCode`

---

### **BƯỚC 8: Khởi tạo thanh toán VNPay**

**Endpoint:** `POST /home/api/v1/payments/init`

**Request Body:**
```json
{
  "orderId": 30,
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
    "id": 15,
    "orderId": 30,
    "provider": "VNPAY",
    "amount": 120000,
    "currency": "VND",
    "status": "INIT",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=12000000&vnp_Command=pay&...",
    "createdAt": "2025-11-02T20:01:00"
  }
}
```

**Database Check:**
- Bảng `payment_transaction`:
  - `id = 15`
  - `order_id = 30`
  - `status = 'INIT'`
  - `amount = 120000`
  - `provider = 'VNPAY'`

**Action:**
- Copy URL từ `paymentUrl`
- Mở trên browser để thanh toán

---

### **BƯỚC 9: Thực hiện thanh toán trên VNPay Sandbox**

**URL:** (từ response trên)

**Trên trang VNPay Sandbox:**
1. Chọn Ngân hàng: **NCB**
2. Nhập thông tin:
   - Số thẻ: `9704198526191432198`
   - Tên chủ thẻ: `NGUYEN VAN A`
   - Ngày phát hành: `07/15`
   - Mật khẩu OTP: `123456`

3. Click **Thanh toán**

**Sau khi thanh toán thành công:**
- VNPay sẽ redirect về: 
  ```
  https://{ngrok-url}/home/api/v1/payments/vnpay-return?vnp_ResponseCode=00&...
    "items": [
      {
        "cartItemId": 10,
        "productId": 1,
        "productName": "Cơm gà",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000
      }
    ],
    "totalAmount": 100000
  }
}
```

---

### **BƯỚC 7: Tạo đơn hàng từ giỏ hàng**

**Endpoint:** `POST /home/api/v1/orders`

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "deliveryNote": "Giao trước 12h",
  "voucherCode": null
}
```

**Lưu ý:** 
- ✅ Không cần truyền `userId` nữa - hệ thống tự động lấy từ JWT token
- ✅ Chỉ cần đăng nhập và có giỏ hàng ACTIVE là có thể tạo đơn

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order created successfully",
  "result": {
    "id": 30,
    "orderCode": "ORD1762060123456ABCD1234",
    "userId": 23,
    "storeId": 1,
    "storeName": "Nhà hàng ABC",
    "status": "CREATED",
    "paymentStatus": "PENDING",
    "totalItemAmount": 100000,
    "shippingFee": 20000,
    "totalPayable": 120000,
    "items": [
      {
        "productId": 1,
        "productName": "Cơm gà",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000
      }
    ],
    "createdAt": "2025-11-02T20:00:00"
  }
}
```

**Database Check:**
- Bảng `orders`: 
  - `id = 30`, `order_code = 'ORD...'`
  - `user_id = 23` (lấy từ token)
  - `status = 'CREATED'`
  - `payment_status = 'PENDING'`
  - `total_payable = 120000`
  
- Bảng `order_item`:
  - `order_id = 30`, `product_id = 1`, `quantity = 2`

- Bảng `product`:
  - `quantity_available` giảm đi 2
  - `reserved_quantity` tăng lên 2

- Bảng `cart`:
  - `status = 'CHECKED_OUT'`
  
- Bảng `cart_item`:
  - ✅ **Các items đã bị XÓA hoàn toàn** (không còn record nào)

**Action:**
- Lưu lại `orderId = 30` và `orderCode`

---

### **BƯỚC 8: Khởi tạo thanh toán VNPay**

**Endpoint:** `POST /home/api/v1/payments/init`

**Request Body:**
```json
{
  "orderId": 30,
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
    "id": 15,
    "orderId": 30,
    "provider": "VNPAY",
    "amount": 120000,
    "currency": "VND",
    "status": "INIT",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=12000000&vnp_Command=pay&...",
    "createdAt": "2025-11-02T20:01:00"
  }
}
```

**Database Check:**
- Bảng `payment_transaction`:
  - `id = 15`
  - `order_id = 30`
  - `status = 'INIT'`
  - `amount = 120000`
  - `provider = 'VNPAY'`

**Action:**
- Copy URL từ `paymentUrl`
- Mở trên browser để thanh toán

---

### **BƯỚC 9: Thực hiện thanh toán trên VNPay Sandbox**

**URL:** (từ response trên)

**Trên trang VNPay Sandbox:**
1. Chọn Ngân hàng: **NCB**
2. Nhập thông tin:
   - Số thẻ: `9704198526191432198`
   - Tên chủ thẻ: `NGUYEN VAN A`
   - Ngày phát hành: `07/15`
   - Mật khẩu OTP: `123456`

3. Click **Thanh toán**

**Sau khi thanh toán thành công:**
- VNPay sẽ redirect về: 
  ```
  https://{ngrok-url}/home/api/v1/payments/vnpay-return?vnp_ResponseCode=00&...
  ```

**Expected Redirect Page:**
```
Thanh toán thành công!
Mã đơn hàng: ORD1762060123456ABCD1234
Số tiền: 120,000 VNĐ
Mã giao dịch: 15234567
Thời gian: 02/11/2025 20:05:30

[Xem đơn hàng]
```

**Database Check sau khi thanh toán:**

**Bảng `payment_transaction`:**
- `id = 15`
- `status = 'SUCCESS'` (đã cập nhật từ INIT)
- `provider_transaction_id = '15234567'`
- `completed_at = NOW()`

**Bảng `orders`:**
- `id = 30`
- `payment_status = 'PAID'` (đã cập nhật từ PENDING)
- `status = 'PAID'` (đã cập nhật từ CREATED)

---

### **BƯỚC 10: Kiểm tra chi tiết đơn hàng sau thanh toán**

**Endpoint:** `GET /home/api/v1/orders/30`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order retrieved successfully",
  "result": {
    "id": 30,
    "orderCode": "ORD1762060123456ABCD1234",
    "status": "PAID",
    "paymentStatus": "PAID",
    "totalPayable": 120000,
    "items": [...],
    "createdAt": "2025-11-02T20:00:00",
    "updatedAt": "2025-11-02T20:05:30"
  }
}
```

---

### **BƯỚC 11: Cửa hàng chấp nhận đơn hàng**

**Endpoint:** `PUT /home/api/v1/orders/30/accept`

**Headers:**
```
Authorization: Bearer {store_owner_token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order accepted successfully",
  "result": {
    "id": 30,
    "orderCode": "ORD1762060123456ABCD1234",
    "status": "ACCEPT",
    "paymentStatus": "PAID",
    "totalPayable": 120000
  }
}
```

**Database Check sau khi Accept:**

**Bảng `orders`:**
- `id = 30`
- `status = 'ACCEPT'` (đã cập nhật từ PAID)

**Bảng `store_ledger` (TỰ ĐỘNG TẠO):**
```sql
SELECT * FROM store_ledger WHERE order_id = 30;
```
Expected result:
- `store_id = 1`
- `order_id = 30`
- `total_order_amount = 120000`
- `app_commission_amount = 12000` (10%)
- `payment_gateway_fee = 2400` (2%)
- `net_amount_owed = 105600` (120000 - 12000 - 2400)
- `status = 'UNPAID'`
- `payout_batch_id = NULL`

---

### **BƯỚC 12: Cập nhật trạng thái giao hàng**

#### **12.1 Đang giao hàng**

**Endpoint:** `PUT /home/api/v1/orders/30/in-delivery`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order status updated",
  "result": {
    "id": 30,
    "status": "IN_DELIVERY",
    "paymentStatus": "PAID"
  }
}
```

**Database:**
- `orders.status = 'IN_DELIVERY'`

---

#### **12.2 Đã giao hàng**

**Endpoint:** `PUT /home/api/v1/orders/30/delivered`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order delivered successfully",
  "result": {
    "id": 30,
    "status": "DELIVERED",
    "paymentStatus": "PAID"
  }
}
```

**Database:**
- `orders.status = 'DELIVERED'`

---

## 🔍 Checklist tổng hợp sau khi hoàn tất

### ✅ Database State cuối cùng:

**Bảng `users`:**
- User mới đã được tạo (id = 23)

**Bảng `cart`:**
- `status = 'CHECKED_OUT'`

**Bảng `cart_item`:**
- Đã bị xóa (không còn items)

**Bảng `orders`:**
- `status = 'DELIVERED'`
- `payment_status = 'PAID'`

**Bảng `order_item`:**
- Có các sản phẩm đã đặt

**Bảng `payment_transaction`:**
- `status = 'SUCCESS'`
- `completed_at != NULL`

**Bảng `product`:**
- `quantity_available` đã giảm
- `reserved_quantity` đã tăng

**Bảng `store_ledger`:**
- Đã có 1 entry với `order_id = 30`
- `status = 'UNPAID'`
- `net_amount_owed` đã được tính

---

## 🧪 Test Cases cần kiểm tra

### Test Case 1: Thêm sản phẩm từ 2 cửa hàng khác nhau
**Expected:** Báo lỗi khi tạo đơn hàng

### Test Case 2: Thanh toán thất bại (RspCode != 00)
**Expected:** 
- `payment_transaction.status = 'FAILED'`
- `orders.payment_status = 'PENDING'`
- `orders.status = 'CREATED'`

### Test Case 3: Cửa hàng từ chối đơn hàng đã thanh toán
**Endpoint:** `PUT /home/api/v1/orders/30/reject`
**Expected:**
- `orders.status = 'CANCELLED'`
- Cần xử lý hoàn tiền (TODO)

### Test Case 4: Hủy đơn hàng chưa thanh toán
**Expected:**
- `orders.status = 'CANCELLED'`
- Hoàn lại tồn kho

---

## 📊 Postman Collection

Import file: `Payment_System_Demo.postman_collection.json`

**Thứ tự chạy trong Postman:**
1. Auth → Register
2. Auth → Login (Save token)
3. Store → Get All Stores
4. Store → Get Store Products
5. Cart → Add to Cart
6. Cart → View Cart
7. Order → Create Order (Save orderId)
8. Payment → Init Payment (Copy paymentUrl)
9. (Thực hiện thanh toán trên VNPay sandbox)
10. Order → Get Order Detail (kiểm tra status = PAID)
11. Order → Accept Order (Store owner)
12. Ledger → Get Store Ledger (kiểm tra đã tạo)

---
  ```
## ⚠️ Lưu ý quan trọng

1. **Ngrok phải đang chạy:** `http://localhost:4040` để lấy public URL
2. **VNPay returnUrl** phải dùng ngrok URL: `https://{ngrok-url}/home/api/v1/payments/vnpay-return`
3. **Test trên sandbox:** Dùng thẻ test của VNPay
4. **Database:** Kiểm tra sau mỗi bước để đảm bảo data đúng
5. **Cascade delete:** Khi xóa user/store, các bản ghi liên quan cũng bị xóa

---

## 🎉 Kết luận

Sau khi test xong toàn bộ flow, hệ thống đã:
- ✅ Tạo tài khoản và đăng nhập
- ✅ Thêm sản phẩm vào giỏ hàng
- ✅ Tạo đơn hàng từ giỏ hàng
- ✅ Thanh toán qua VNPay sandbox
- ✅ Cập nhật trạng thái thanh toán tự động
- ✅ Cửa hàng chấp nhận đơn và tạo ledger
- ✅ Giao hàng thành công

**Next steps:**
- Tích hợp payout cho cửa hàng
- Xử lý hoàn tiền khi hủy/từ chối đơn
- Notifications cho user/store
**Expected Redirect Page:**
```
Thanh toán thành công!
Mã đơn hàng: ORD1762060123456ABCD1234
Số tiền: 120,000 VNĐ
Mã giao dịch: 15234567
Thời gian: 02/11/2025 20:05:30

[Xem đơn hàng]
```

**Database Check sau khi thanh toán:**

**Bảng `payment_transaction`:**
- `id = 15`
- `status = 'SUCCESS'` (đã cập nhật từ INIT)
- `provider_transaction_id = '15234567'`
- `completed_at = NOW()`

**Bảng `orders`:**
- `id = 30`
- `payment_status = 'PAID'` (đã cập nhật từ PENDING)
- `status = 'PAID'` (đã cập nhật từ CREATED)

---

### **BƯỚC 10: Kiểm tra chi tiết đơn hàng sau thanh toán**

**Endpoint:** `GET /home/api/v1/orders/30`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order retrieved successfully",
  "result": {
    "id": 30,
    "orderCode": "ORD1762060123456ABCD1234",
    "status": "PAID",
    "paymentStatus": "PAID",
    "totalPayable": 120000,
    "items": [...],
    "createdAt": "2025-11-02T20:00:00",
    "updatedAt": "2025-11-02T20:05:30"
  }
}
```

---

### **BƯỚC 11: Cửa hàng chấp nhận đơn hàng**

**Endpoint:** `PUT /home/api/v1/orders/30/accept`

**Headers:**
```
Authorization: Bearer {store_owner_token}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order accepted successfully",
  "result": {
    "id": 30,
    "orderCode": "ORD1762060123456ABCD1234",
    "status": "ACCEPT",
    "paymentStatus": "PAID",
    "totalPayable": 120000
  }
}
```

**Database Check sau khi Accept:**

**Bảng `orders`:**
- `id = 30`
- `status = 'ACCEPT'` (đã cập nhật từ PAID)

**Bảng `store_ledger` (TỰ ĐỘNG TẠO):**
```sql
SELECT * FROM store_ledger WHERE order_id = 30;
```
Expected result:
- `store_id = 1`
- `order_id = 30`
- `total_order_amount = 120000`
- `app_commission_amount = 12000` (10%)
- `payment_gateway_fee = 2400` (2%)
- `net_amount_owed = 105600` (120000 - 12000 - 2400)
- `status = 'UNPAID'`
- `payout_batch_id = NULL`

---

### **BƯỚC 12: Cập nhật trạng thái giao hàng**

#### **12.1 Đang giao hàng**

**Endpoint:** `PUT /home/api/v1/orders/30/in-delivery`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order status updated",
  "result": {
    "id": 30,
    "status": "IN_DELIVERY",
    "paymentStatus": "PAID"
  }
}
```

**Database:**
- `orders.status = 'IN_DELIVERY'`

---

#### **12.2 Đã giao hàng**

**Endpoint:** `PUT /home/api/v1/orders/30/delivered`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Order delivered successfully",
  "result": {
    "id": 30,
    "status": "DELIVERED",
    "paymentStatus": "PAID"
  }
}
```

**Database:**
- `orders.status = 'DELIVERED'`

---

## 🔍 Checklist tổng hợp sau khi hoàn tất

### ✅ Database State cuối cùng:

**Bảng `users`:**
- User mới đã được tạo (id = 23)

**Bảng `cart`:**
- `status = 'CHECKED_OUT'`

**Bảng `cart_item`:**
- Đã bị xóa (không còn items)

**Bảng `orders`:**
- `status = 'DELIVERED'`
- `payment_status = 'PAID'`

**Bảng `order_item`:**
- Có các sản phẩm đã đặt

**Bảng `payment_transaction`:**
- `status = 'SUCCESS'`
- `completed_at != NULL`

**Bảng `product`:**
- `quantity_available` đã giảm
- `reserved_quantity` đã tăng

**Bảng `store_ledger`:**
- Đã có 1 entry với `order_id = 30`
- `status = 'UNPAID'`
- `net_amount_owed` đã được tính

---

## 🧪 Test Cases cần kiểm tra

### Test Case 1: Thêm sản phẩm từ 2 cửa hàng khác nhau
**Expected:** Báo lỗi khi tạo đơn hàng

### Test Case 2: Thanh toán thất bại (RspCode != 00)
**Expected:** 
- `payment_transaction.status = 'FAILED'`
- `orders.payment_status = 'PENDING'`
- `orders.status = 'CREATED'`

### Test Case 3: Cửa hàng từ chối đơn hàng đã thanh toán
**Endpoint:** `PUT /home/api/v1/orders/30/reject`
**Expected:**
- `orders.status = 'CANCELLED'`
- Cần xử lý hoàn tiền (TODO)

### Test Case 4: Hủy đơn hàng chưa thanh toán
**Expected:**
- `orders.status = 'CANCELLED'`
- Hoàn lại tồn kho

---

## 📊 Postman Collection

Import file: `Payment_System_Demo.postman_collection.json`

**Thứ tự chạy trong Postman:**
1. Auth → Register
2. Auth → Login (Save token)
3. Store → Get All Stores
4. Store → Get Store Products
5. Cart → Add to Cart
6. Cart → View Cart
7. Order → Create Order (Save orderId)
8. Payment → Init Payment (Copy paymentUrl)
9. (Thực hiện thanh toán trên VNPay sandbox)
10. Order → Get Order Detail (kiểm tra status = PAID)
11. Order → Accept Order (Store owner)
12. Ledger → Get Store Ledger (kiểm tra đã tạo)

---

## ⚠️ Lưu ý quan trọng

1. **Ngrok phải đang chạy:** `http://localhost:4040` để lấy public URL
2. **VNPay returnUrl** phải dùng ngrok URL: `https://{ngrok-url}/home/api/v1/payments/vnpay-return`
3. **Test trên sandbox:** Dùng thẻ test của VNPay
4. **Database:** Kiểm tra sau mỗi bước để đảm bảo data đúng
5. **Cascade delete:** Khi xóa user/store, các bản ghi liên quan cũng bị xóa

---

## 🎉 Kết luận

Sau khi test xong toàn bộ flow, hệ thống đã:
- ✅ Tạo tài khoản và đăng nhập
- ✅ Thêm sản phẩm vào giỏ hàng
- ✅ Tạo đơn hàng từ giỏ hàng
- ✅ Thanh toán qua VNPay sandbox
- ✅ Cập nhật trạng thái thanh toán tự động
- ✅ Cửa hàng chấp nhận đơn và tạo ledger
- ✅ Giao hàng thành công

**Next steps:**
- Tích hợp payout cho cửa hàng
- Xử lý hoàn tiền khi hủy/từ chối đơn
- Notifications cho user/store
# 📋 Kế hoạch Test Toàn bộ User Journey - Food Delivery App

**Ngày tạo:** 02/11/2025  
**Mục đích:** Test đầy đủ quy trình từ đăng nhập → chọn sản phẩm → tạo đơn hàng → thanh toán → cửa hàng xác nhận

---

## 🎯 Tổng quan luồng test

```
1. Đăng nhập/Đăng ký
   ↓
2. Browse sản phẩm theo cửa hàng
   ↓
3. Thêm sản phẩm vào giỏ hàng
   ↓
4. Tạo đơn hàng từ giỏ hàng
   ↓
5. Khởi tạo thanh toán VNPay
   ↓
6. Hoàn tất thanh toán
   ↓
7. Cửa hàng chấp nhận đơn (Auto create StoreLedger)
   ↓
8. Giao hàng và hoàn tất
```

---

## 📝 Chi tiết các bước test

### **BƯỚC 1: Đăng ký tài khoản mới (nếu chưa có)**

**Endpoint:** `POST /home/api/v1/auth/register`

**Request Body:**
```json
{
  "username": "testuser01",
  "password": "Test@123",
  "email": "testuser01@example.com",
  "fullName": "Nguyen Van Test",
  "phoneNumber": "0901234567",
  "role": "CUSTOMER"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "User registered successfully",
  "result": {
    "id": 23,
    "username": "testuser01",
    "email": "testuser01@example.com",
    "fullName": "Nguyen Van Test",
    "role": "CUSTOMER"
  }
}
```

**Database Check:**
- Kiểm tra bảng `users` có user mới với `id = 23`

---

### **BƯỚC 2: Đăng nhập**

**Endpoint:** `POST /home/api/v1/auth/login`

**Request Body:**
```json
{
  "username": "testuser01",
  "password": "Test@123"
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 23,
    "username": "testuser01",
    "role": "CUSTOMER"
  }
}
```

**Action:**
- Lưu lại `token` để dùng cho các request tiếp theo
- Set vào Header: `Authorization: Bearer {token}`

---

### **BƯỚC 3: Xem danh sách cửa hàng**

**Endpoint:** `GET /home/api/v1/stores`

**Headers:**
```
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
      "name": "Nhà hàng ABC",
      "description": "Món ăn ngon",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "name": "Quán Cơm DEF",
      "status": "ACTIVE"
    }
  ]
}
```

**Action:**
- Chọn một cửa hàng, ví dụ `storeId = 1`

---

### **BƯỚC 4: Xem sản phẩm của cửa hàng**

**Endpoint:** `GET /home/api/v1/stores/1/products`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Success",
  "result": {
    "storeId": 1,
    "storeName": "Nhà hàng ABC",
    "products": [
      {
        "id": 1,
        "name": "Cơm gà",
        "basePrice": 50000,
        "status": "ACTIVE",
        "quantityAvailable": 100
      },
      {
        "id": 2,
        "name": "Phở bò",
        "basePrice": 60000,
        "status": "ACTIVE",
        "quantityAvailable": 50
      }
    ]
  }
}
```

**Action:**
- Chọn sản phẩm muốn mua, ví dụ `productId = 1` (Cơm gà)

---

### **BƯỚC 5: Thêm sản phẩm vào giỏ hàng**

**Endpoint:** `POST /home/api/v1/cart/add`

**Request Body:**
```json
{
  "userId": 23,
  "productId": 1,
  "quantity": 2
}
```

**Expected Response:**
```json
{
  "code": 200,
  "message": "Product added to cart successfully",
  "result": {
    "cartId": 5,
    "items": [
      {
        "cartItemId": 10,
        "productId": 1,
        "productName": "Cơm gà",
        "quantity": 2,
        "unitPrice": 50000,
        "totalPrice": 100000
      }
    ],
    "totalAmount": 100000
  }
}
```

**Database Check:**
- Bảng `cart`: có record với `user_id = 23`, `status = 'ACTIVE'`
- Bảng `cart_item`: có record với `cart_id = 5`, `product_id = 1`, `quantity = 2`

**Action:**
- Có thể thêm thêm sản phẩm khác (cùng cửa hàng)

---

### **BƯỚC 6: Xem giỏ hàng**

**Endpoint:** `GET /home/api/v1/cart/23`

**Expected Response:**
```json
{
  "code": 200,
  "message": "Cart retrieved successfully",
  "result": {
    "cartId": 5,
    "userId": 23,

