# Hướng Dẫn Test API - Luồng Đặt Hàng Đến Nhận Hàng

## 🚀 1. Khởi động hệ thống

```bash
# 1. Khởi động MySQL (port 3306)
# 2. Chạy insert test data
insert-test-data.bat

# 3. Khởi động server
start-server.bat
```

Server: `http://localhost:8080`

## 📦 2. Postman Collections

Import các collection sau vào Postman:
- **Complete_Order_Flow_Test.postman_collection.json** - Test luồng đặt hàng đầy đủ
- **Drone_Complete_APIs.postman_collection.json** - Test API drone delivery
- **Payment_System_Demo.postman_collection.json** - Test thanh toán VNPay
- **Payout_System_API.postman_collection.json** - Test hệ thống chi trả

## 🔄 3. Luồng Test Đầy Đủ: Từ Đặt Hàng Đến Nhận Hàng

### **BƯỚC 1: Đăng ký & Đăng nhập**

#### 1.1. Đăng ký tài khoản mới
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "customer01",
  "email": "customer01@example.com",
  "password": "password123",
  "fullName": "Nguyen Van A",
  "phone": "0901234567"
}
```

#### 1.2. Đăng nhập
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "customer01",
  "password": "password123"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 1,
    "username": "customer01"
  }
}
```

**⚠️ LƯU Ý:** Copy `token` và thêm vào header cho tất cả các request tiếp theo:
```
Authorization: Bearer <your_token>
```

---

### **BƯỚC 2: Xem Cửa Hàng & Sản Phẩm**

#### 2.1. Lấy danh sách cửa hàng
```http
GET /api/v1/stores
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "code": 200,
  "result": [
    {
      "id": 1,
      "name": "Quán Cơm Tấm Sườn",
      "address": "123 Nguyen Hue, Q1",
      "latitude": 10.762622,
      "longitude": 106.660172
    }
  ]
}
```

#### 2.2. Xem sản phẩm của cửa hàng
```http
GET /api/v1/products/store/1
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "code": 200,
  "result": [
    {
      "id": 1,
      "name": "Cơm Tấm Sườn",
      "price": 45000,
      "description": "Cơm tấm sườn nướng đặc biệt",
      "imageUrl": "/images/com-tam-suon.jpg",
      "storeId": 1
    }
  ]
}
```

---

### **BƯỚC 3: Thêm Sản Phẩm Vào Giỏ Hàng**

#### 3.1. Thêm sản phẩm vào giỏ
```http
POST /api/cart/add
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

#### 3.2. Xem giỏ hàng
```http
GET /api/cart
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "cartId": 1,
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "productName": "Cơm Tấm Sườn",
      "quantity": 2,
      "price": 45000,
      "subtotal": 90000
    }
  ],
  "totalAmount": 90000
}
```

---

### **BƯỚC 4: Tạo Đơn Hàng Từ Giỏ Hàng**

```http
POST /api/v1/orders
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "code": 200,
  "message": "Orders created successfully from cart",
  "result": [
    {
      "orderId": 1,
      "orderCode": "ORD20250103001",
      "storeId": 1,
      "storeName": "Quán Cơm Tấm Sườn",
      "totalAmount": 90000,
      "status": "PENDING",
      "items": [...]
    }
  ]
}
```

**⚠️ LƯU Ý:** Copy `orderId` (ví dụ: 1) để dùng cho các bước tiếp theo.

---

### **BƯỚC 5: Thanh Toán Đơn Hàng**

#### 5.1. Khởi tạo thanh toán VNPay
```http
POST /api/v1/payments/init
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "orderId": 1,
  "paymentMethod": "VNPAY",
  "returnUrl": "http://localhost:8080/payment-result.html"
}
```

**Response:**
```json
{
  "code": 200,
  "message": "Payment initialized successfully",
  "result": {
    "paymentId": 1,
    "orderId": 1,
    "amount": 90000,
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
    "status": "PENDING"
  }
}
```

#### 5.2. Mở URL thanh toán
- Copy `paymentUrl` và mở trong browser
- Sử dụng thông tin test của VNPay Sandbox:
  - **Ngân hàng:** NCB
  - **Số thẻ:** 9704198526191432198
  - **Tên:** NGUYEN VAN A
  - **Ngày phát hành:** 07/15
  - **Mật khẩu OTP:** 123456

#### 5.3. Sau khi thanh toán thành công, kiểm tra trạng thái
```http
GET /api/v1/orders/1
Authorization: Bearer <your_token>
```

**Trạng thái đơn hàng sẽ chuyển sang:** `PAID` (Đã thanh toán)

---

### **BƯỚC 6: Cửa Hàng Chấp Nhận Đơn Hàng**

```http
POST /api/v1/orders/1/accept
Authorization: Bearer <store_owner_token>
```

**Response:**
```json
{
  "code": 200,
  "message": "Order accepted successfully and ledger entry created",
  "result": {
    "orderId": 1,
    "status": "CONFIRMED",
    "confirmedAt": "2025-01-03T10:30:00"
  }
}
```

**Trạng thái:** `PAID` → `CONFIRMED`

---

### **BƯỚC 7: Gán Drone Giao Hàng**

#### 7.1. Tìm drone khả dụng
```http
GET /drones/find-available?weightGram=500&fromLat=10.762622&fromLng=106.660172&toLat=10.772622&toLng=106.670172
```

**Response:**
```json
{
  "code": 1000,
  "message": "Available drone found",
  "result": {
    "droneId": 1,
    "code": "DRONE001",
    "status": "AVAILABLE",
    "batteryPercent": 85,
    "currentLat": 10.762622,
    "currentLng": 106.660172
  }
}
```

#### 7.2. Gán drone cho đơn hàng (cần tự implement API này hoặc update status)
```http
POST /api/v1/orders/1/mark-in-delivery
Authorization: Bearer <store_owner_token>
```

**Trạng thái:** `CONFIRMED` → `IN_DELIVERY`

---

### **BƯỚC 8: Cập Nhật Trạng Thái Giao Hàng**

#### 8.1. Cập nhật trạng thái drone (từ drone simulator)
```http
POST /drones/DRONE001/status
Content-Type: application/json

{
  "status": "IN_DELIVERY",
  "batteryPercent": 80
}
```

#### 8.2. Cập nhật vị trí drone (GPS tracking)
```http
POST /drones/DRONE001/location
Content-Type: application/json

{
  "latitude": 10.765622,
  "longitude": 106.665172,
  "altitude": 50,
  "speed": 15
}
```

---

### **BƯỚC 9: Xác Nhận Đã Giao Hàng**

```http
POST /api/v1/orders/1/mark-delivered
Authorization: Bearer <store_owner_token>
```

**Response:**
```json
{
  "code": 200,
  "message": "Order marked as delivered",
  "result": {
    "orderId": 1,
    "status": "DELIVERED",
    "deliveredAt": "2025-01-03T11:00:00"
  }
}
```

**Trạng thái:** `IN_DELIVERY` → `DELIVERED`

---

### **BƯỚC 10: Kiểm Tra Kết Quả**

#### 10.1. Xem chi tiết đơn hàng
```http
GET /api/v1/orders/1
Authorization: Bearer <your_token>
```

#### 10.2. Xem lịch sử thanh toán
```http
GET /api/v1/payments/order/1
Authorization: Bearer <your_token>
```

#### 10.3. Xem ledger entry (ghi sổ kế toán)
```http
GET /api/v1/ledger/order/1
Authorization: Bearer <store_owner_token>
```

---

## 📊 4. Các Trạng Thái Đơn Hàng

| Trạng Thái | Mô Tả | Bước Tiếp Theo |
|------------|-------|----------------|
| `PENDING` | Đơn hàng vừa tạo | Thanh toán |
| `PAID` | Đã thanh toán | Cửa hàng xác nhận |
| `CONFIRMED` | Cửa hàng chấp nhận | Chuẩn bị giao hàng |
| `IN_DELIVERY` | Đang giao hàng | Chờ giao thành công |
| `DELIVERED` | Đã giao hàng | Hoàn tất |
| `CANCELLED` | Đã hủy | - |
| `REJECTED` | Cửa hàng từ chối | - |

---

## 🧪 5. Test Scripts Nhanh

### Test luồng đầy đủ
```bash
test-order-flow.bat
```

### Test drone delivery
```bash
test-drone-flow.bat
```

### Test store & products
```bash
test-store-products.bat
```

---

## ⚙️ 6. Cấu Hình

### Base URL
```
http://localhost:8080
```

### VNPay Sandbox
- URL: https://sandbox.vnpayment.vn
- TMN Code: (xem trong application.yaml)
- Hash Secret: (xem trong application.yaml)

### Authentication Header
```
Authorization: Bearer <your_jwt_token>
```

---

## 🐛 7. Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra token có hợp lệ không
- Token có thể hết hạn, cần login lại

### Lỗi 404 Not Found
- Kiểm tra endpoint có đúng không
- Kiểm tra server đã khởi động chưa

### Thanh toán không thành công
- Kiểm tra VNPay credentials trong application.yaml
- Kiểm tra ngrok đã chạy chưa (nếu test từ sandbox)

### Drone không khả dụng
- Chạy `insert-test-data.bat` để thêm drone test
- Kiểm tra trạng thái drone: `GET /drones`

---

## 📚 8. Tham Khảo

- [Payment System Guide](PAYMENT_SYSTEM_GUIDE.md)
- [Payout System Guide](PAYOUT_SYSTEM_GUIDE.md)
- [VNPay Integration](VNPAY_INTEGRATION_GUIDE.md)

