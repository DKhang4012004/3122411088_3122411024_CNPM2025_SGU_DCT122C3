# Kiến Trúc Hệ Thống FoodFast

## 📋 Tổng Quan

FoodFast là hệ thống giao đồ ăn bằng drone với các tính năng:
- Đặt hàng và quản lý giỏ hàng
- Thanh toán trực tuyến qua VNPay
- Giao hàng bằng drone tự động
- Hệ thống kế toán và chi trả

## 🏗️ Kiến Trúc Tổng Thể

```
┌─────────────┐
│   Frontend  │  (HTML/CSS/JS)
└──────┬──────┘
       │ HTTP/REST API
┌──────▼──────────────────────┐
│   Spring Boot Backend       │
│  ┌──────────────────────┐  │
│  │  Controllers         │  │
│  │  - Auth              │  │
│  │  - Order             │  │
│  │  - Payment           │  │
│  │  - Drone             │  │
│  │  - Cart              │  │
│  └────────┬─────────────┘  │
│           │                 │
│  ┌────────▼─────────────┐  │
│  │  Services            │  │
│  │  - OrderService      │  │
│  │  - PaymentService    │  │
│  │  - DroneService      │  │
│  └────────┬─────────────┘  │
│           │                 │
│  ┌────────▼─────────────┐  │
│  │  Repositories        │  │
│  │  (Spring Data JPA)   │  │
│  └────────┬─────────────┘  │
└───────────┼─────────────────┘
            │
     ┌──────▼──────┐
     │    MySQL    │
     │   Database  │
     └─────────────┘
```

## 📦 Module Chính

### 1. **Authentication Module**
- **Controller:** `AuthenticationController`
- **Chức năng:**
  - Đăng ký người dùng mới
  - Đăng nhập (JWT token)
  - Quản lý phiên đăng nhập
- **Endpoint:**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`

### 2. **User Module**
- **Controller:** `UserController`
- **Chức năng:**
  - Quản lý thông tin người dùng
  - Cập nhật profile
  - Phân quyền (Customer, Store Owner, Admin)
- **Endpoint:**
  - `GET /api/v1/users/{id}`
  - `PUT /api/v1/users/{id}`

### 3. **Store Module**
- **Controller:** `StoreController`, `StoreAddressController`
- **Chức năng:**
  - Quản lý cửa hàng
  - Địa chỉ và vị trí GPS
  - Giờ mở cửa
- **Endpoint:**
  - `GET /api/v1/stores`
  - `GET /api/v1/stores/{id}`
  - `POST /api/v1/stores` (Admin)

### 4. **Product Module**
- **Controller:** `ProductController`, `ProductCategoryController`
- **Chức năng:**
  - Quản lý sản phẩm
  - Danh mục sản phẩm
  - Giá và hình ảnh
- **Endpoint:**
  - `GET /api/v1/products/store/{storeId}`
  - `POST /api/v1/products` (Store Owner)
  - `PUT /api/v1/products/{id}`

### 5. **Cart Module**
- **Controller:** `CartController`
- **Chức năng:**
  - Thêm sản phẩm vào giỏ
  - Cập nhật số lượng
  - Xóa sản phẩm
  - Tính tổng tiền
- **Endpoint:**
  - `POST /api/cart/add`
  - `GET /api/cart`
  - `PUT /api/cart/products/{productId}`
  - `DELETE /api/cart/products/{productId}`

### 6. **Order Module**
- **Controller:** `OrderController`
- **Chức năng:**
  - Tạo đơn hàng từ giỏ hàng
  - Theo dõi trạng thái đơn hàng
  - Lịch sử đơn hàng
- **Endpoint:**
  - `POST /api/v1/orders` - Tạo đơn từ giỏ hàng
  - `GET /api/v1/orders/{orderId}`
  - `POST /api/v1/orders/{orderId}/accept` - Store chấp nhận
  - `POST /api/v1/orders/{orderId}/reject` - Store từ chối
  - `POST /api/v1/orders/{orderId}/mark-in-delivery`
  - `POST /api/v1/orders/{orderId}/mark-delivered`

### 7. **Payment Module**
- **Controller:** `PaymentController`
- **Chức năng:**
  - Tích hợp VNPay
  - Xử lý IPN (Instant Payment Notification)
  - Xử lý Return URL
  - Lịch sử thanh toán
- **Endpoint:**
  - `POST /api/v1/payments/init`
  - `GET /api/v1/payments/vnpay-ipn` (Webhook)
  - `GET /api/v1/payments/vnpay-return`

### 8. **Drone Module**
- **Controller:** `DroneController`
- **Chức năng:**
  - Quản lý đội drone
  - GPS tracking
  - Tìm drone khả dụng
  - Giám sát pin và trạng thái
- **Endpoint:**
  - `POST /drones/register`
  - `GET /drones`
  - `GET /drones/{code}`
  - `POST /drones/{code}/location`
  - `POST /drones/{code}/status`
  - `GET /drones/find-available`
  - `GET /drones/nearby`

### 9. **Ledger Module** (Kế toán)
- **Controller:** `LedgerController`
- **Chức năng:**
  - Ghi sổ các giao dịch
  - Tính hoa hồng
  - Báo cáo doanh thu
- **Endpoint:**
  - `GET /api/v1/ledger/store/{storeId}`
  - `GET /api/v1/ledger/order/{orderId}`

### 10. **Payout Module** (Chi trả)
- **Controller:** `PayoutController`
- **Chức năng:**
  - Tạo batch chi trả
  - Xử lý thanh toán cho store
  - Lịch sử chi trả
- **Endpoint:**
  - `POST /api/v1/payouts/batch`
  - `GET /api/v1/payouts/store/{storeId}`

### 11. **Location Module**
- **Controller:** `LocationController`
- **Chức năng:**
  - Tính khoảng cách GPS
  - Geocoding
  - Tìm cửa hàng gần nhất
- **Endpoint:**
  - `GET /api/v1/location/distance`
  - `GET /api/v1/location/nearest-stores`

## 🔄 Luồng Hoạt Động Chi Tiết

### 📱 1. Luồng Đặt Hàng

```
Customer
   │
   ├─► [1] Đăng nhập (JWT Token)
   │   POST /api/v1/auth/login
   │
   ├─► [2] Xem cửa hàng và sản phẩm
   │   GET /api/v1/stores
   │   GET /api/v1/products/store/{storeId}
   │
   ├─► [3] Thêm vào giỏ hàng
   │   POST /api/cart/add
   │
   ├─► [4] Tạo đơn hàng
   │   POST /api/v1/orders
   │   (Tự động tạo từ giỏ hàng)
   │
   └─► [5] Thanh toán VNPay
       POST /api/v1/payments/init
       → Redirect to VNPay
       → VNPay callback IPN
       → Order status: PENDING → PAID
```

### 🏪 2. Luồng Xử Lý Đơn (Store)

```
Store Owner
   │
   ├─► [1] Nhận thông báo đơn hàng mới
   │   (Order status: PAID)
   │
   ├─► [2] Xác nhận đơn hàng
   │   POST /api/v1/orders/{orderId}/accept
   │   → Order status: PAID → CONFIRMED
   │   → Tự động tạo Ledger Entry
   │
   ├─► [3] Chuẩn bị món
   │   ...
   │
   └─► [4] Sẵn sàng giao hàng
       POST /api/v1/orders/{orderId}/mark-in-delivery
       → Order status: CONFIRMED → IN_DELIVERY
```

### 🚁 3. Luồng Giao Hàng (Drone)

```
System
   │
   ├─► [1] Tìm drone khả dụng
   │   GET /drones/find-available
   │   (Tính toán: khoảng cách, pin, tải trọng)
   │
   ├─► [2] Gán drone
   │   POST /drones/{code}/status
   │   → Drone status: AVAILABLE → ASSIGNED
   │
   ├─► [3] Drone bay đến cửa hàng
   │   POST /drones/{code}/location (GPS updates)
   │   → Drone status: ASSIGNED → PICKING_UP
   │
   ├─► [4] Lấy hàng và bay đến khách
   │   POST /drones/{code}/location (GPS updates)
   │   → Drone status: PICKING_UP → DELIVERING
   │
   ├─► [5] Giao hàng thành công
   │   POST /api/v1/orders/{orderId}/mark-delivered
   │   → Order status: IN_DELIVERY → DELIVERED
   │   → Drone status: DELIVERING → AVAILABLE
   │
   └─► [6] Giám sát an toàn
       - Battery monitoring (< 20% → return to base)
       - Safety mode (bad weather, emergency)
```

### 💰 4. Luồng Thanh Toán & Kế Toán

```
Payment Flow
   │
   ├─► [1] Customer thanh toán
   │   POST /api/v1/payments/init
   │   → Payment status: PENDING
   │
   ├─► [2] VNPay xử lý
   │   → Customer nhập thông tin thẻ
   │   → VNPay gọi IPN webhook
   │
   ├─► [3] System nhận IPN
   │   GET /api/v1/payments/vnpay-ipn
   │   → Verify signature
   │   → Update Payment status: PENDING → SUCCESS
   │   → Update Order status: PENDING → PAID
   │
   ├─► [4] Tạo Ledger Entry (khi store accept)
   │   POST /api/v1/orders/{orderId}/accept
   │   → Ghi sổ: 
   │     - Tổng tiền: 90,000 VND
   │     - Hoa hồng platform (5%): 4,500 VND
   │     - Tiền store nhận: 85,500 VND
   │
   └─► [5] Chi trả định kỳ
       POST /api/v1/payouts/batch
       → Tạo batch payout cho stores
       → Chuyển tiền vào tài khoản store
```

## 🔐 Security

### JWT Authentication
- Token expires: 24 giờ
- Refresh token: Chưa implement
- Role-based access:
  - `CUSTOMER` - Đặt hàng, thanh toán
  - `STORE_OWNER` - Quản lý đơn hàng
  - `ADMIN` - Quản lý toàn hệ thống

### API Authorization
```java
@PreAuthorize("hasRole('CUSTOMER')")
@PreAuthorize("hasRole('STORE_OWNER')")
@PreAuthorize("hasRole('ADMIN')")
```

### VNPay Security
- HMAC SHA512 signature
- IP whitelist
- IPN verification

## 📊 Database Schema

### Core Tables
- `users` - Người dùng
- `stores` - Cửa hàng
- `products` - Sản phẩm
- `carts` - Giỏ hàng
- `cart_items` - Chi tiết giỏ hàng
- `orders` - Đơn hàng
- `order_items` - Chi tiết đơn hàng
- `payments` - Thanh toán
- `drones` - Drone
- `ledger_entries` - Sổ kế toán
- `payout_batches` - Lô chi trả
- `payout_transactions` - Giao dịch chi trả

## 🔧 Configuration

### application.yaml
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/foodfast_db
    username: root
    password: your_password

jwt:
  secret: your-jwt-secret-key
  expiration: 86400000 # 24 hours

vnpay:
  tmnCode: YOUR_TMN_CODE
  hashSecret: YOUR_HASH_SECRET
  apiUrl: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

commission:
  platformRate: 0.05 # 5%
```

## 🚀 Deployment

### Development
```bash
mvn spring-boot:run
```

### Production (Docker)
```bash
docker-compose up -d
```

### Database Migration
```bash
mysql -u root -p < demo_database_setup.sql
insert-test-data.bat
```

## 📈 Performance Optimization

### Caching
- Spring Cache cho product list
- Redis cho session (optional)

### Database Indexing
- Index trên `orders.order_code`
- Index trên `users.username`
- Index trên `drones.code`

### API Rate Limiting
- Chưa implement
- Nên có rate limit cho payment APIs

## 🧪 Testing

### Unit Tests
```bash
mvn test
```

### Integration Tests
- Postman collections
- Test scripts (*.bat)

### Load Testing
- Apache JMeter (recommended)
- K6 (recommended)

## 📝 API Documentation

### Swagger UI (nếu có)
```
http://localhost:8080/swagger-ui.html
```

### Postman Documentation
Import các collection trong thư mục root.

## 🔍 Monitoring & Logging

### Logging
- SLF4J + Logback
- Log levels: INFO, DEBUG, ERROR
- Log files: `logs/application.log`

### Health Check
```
GET /actuator/health
```

## 🛠️ Future Improvements

1. **Real-time Updates**
   - WebSocket cho order status
   - Live drone tracking

2. **Advanced Features**
   - Đánh giá & review
   - Khuyến mãi & coupon
   - Loyalty program

3. **AI & ML**
   - Dự đoán thời gian giao hàng
   - Tối ưu route drone
   - Gợi ý sản phẩm

4. **Mobile App**
   - React Native / Flutter
   - Push notifications

5. **Admin Dashboard**
   - Analytics & reports
   - Real-time monitoring
   - User management

---

**Version:** 1.0.0  
**Last Updated:** January 3, 2025

