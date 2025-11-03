# 📖 MÔ TẢ LUỒNG HOẠT ĐỘNG HỆ THỐNG FOODFAST

## 🎯 TỔNG QUAN HỆ THỐNG

**FoodFast** là hệ thống giao đồ ăn sử dụng drone, được xây dựng bằng:
- **Backend:** Spring Boot 3.5.5 (Java 21)
- **Database:** MySQL (drone_delivery)
- **Authentication:** JWT (JSON Web Token)
- **Architecture:** RESTful API

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### 1. Cấu trúc Project
```
foodfast/
├── src/main/java/com/cnpm/foodfast/
│   ├── Authentications/          # Xác thực & bảo mật
│   │   ├── controller/           # AuthenticationController
│   │   ├── service/              # JWT, Login, Logout
│   │   └── config/               # SecurityConfig, JwtFilter, CORS
│   │
│   ├── User/                     # Quản lý người dùng
│   │   ├── controller/           # UserController
│   │   ├── service/              # User CRUD
│   │   └── repository/           # UserRepository
│   │
│   ├── Store/                    # Quản lý cửa hàng
│   │   ├── controller/           # StoreController
│   │   ├── service/              # Store operations
│   │   └── repository/           # StoreRepository
│   │
│   ├── Products/                 # Quản lý sản phẩm
│   │   ├── controller/           # ProductController, CategoryController
│   │   ├── service/              # Product & Category CRUD
│   │   └── repository/           # Product/Category repositories
│   │
│   ├── Cart/                     # Giỏ hàng
│   │   ├── controller/           # CartController
│   │   ├── service/              # Cart operations
│   │   └── repository/           # CartRepository
│   │
│   ├── Drone/                    # Quản lý drone (CORE FEATURE)
│   │   ├── controller/           # DroneController
│   │   ├── service/              # Drone logic, GPS, battery
│   │   └── repository/           # DroneRepository
│   │
│   ├── Location/                 # Quản lý địa chỉ
│   │   ├── controller/           # AddressController
│   │   ├── service/              # Address CRUD, distance calc
│   │   └── repository/           # AddressRepository
│   │
│   ├── entity/                   # Database Entities (JPA)
│   │   ├── User.java
│   │   ├── Store.java
│   │   ├── Product.java
│   │   ├── Cart.java
│   │   ├── Order.java
│   │   ├── Drone.java
│   │   ├── Delivery.java
│   │   ├── FlightPlan.java
│   │   └── ...
│   │
│   ├── dto/                      # Data Transfer Objects
│   │   ├── request/              # Request DTOs
│   │   └── response/             # Response DTOs
│   │
│   ├── enums/                    # Enums
│   │   ├── DroneStatus.java      # AVAILABLE, IN_FLIGHT, CHARGING...
│   │   ├── DeliveryStatus.java   # QUEUED, LAUNCHED, COMPLETED...
│   │   ├── OrderStatus.java      # CREATED, PAID, IN_DELIVERY...
│   │   └── ...
│   │
│   ├── mapper/                   # MapStruct mappers
│   ├── exception/                # Custom exceptions
│   └── FoodfastApplication.java  # Main application
│
└── src/main/resources/
    ├── application.yaml          # Configuration
    └── static/                   # HTML test pages
        ├── drone-simulator.html
        ├── drone-simulator-mock.html
        ├── test-drone-delivery-flow.html
        └── ...
```

---

## 🔐 1. LUỒNG XÁC THỰC (AUTHENTICATION FLOW)

### 1.1. Đăng ký tài khoản (Sign Up)
```
Client → POST /home/auth/signup
Request Body:
{
  "username": "user123",
  "email": "user@example.com",
  "password": "securePass123",
  "fullName": "Nguyễn Văn A",
  "phone": "0123456789"
}

↓ AuthenticationService.signUp()
├── Kiểm tra username/email đã tồn tại?
├── Hash password (BCrypt)
├── Tạo User entity với status = ACTIVE
├── Gán role mặc định (USER)
└── Lưu vào database

Response:
{
  "code": 1000,
  "message": "User registered successfully",
  "result": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "status": "ACTIVE"
  }
}
```

### 1.2. Đăng nhập (Login)
```
Client → POST /home/auth/login
Request Body:
{
  "username": "user123",
  "password": "securePass123"
}

↓ AuthenticationService.authenticate()
├── Tìm user theo username
├── Verify password với BCrypt
├── Generate JWT token (signerKey trong application.yaml)
│   ├── Payload: userId, username, roles
│   ├── Expiration: 1 hour (có thể config)
│   └── Sign với secret key
└── Return token + user info

Response:
{
  "code": 1000,
  "message": "Login successful",
  "result": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": 1,
      "username": "user123",
      "roles": ["USER"]
    }
  }
}
```

### 1.3. Xác thực request (JWT Authentication)
```
Client → GET/POST /home/api/... (với header Authorization: Bearer <token>)

↓ JwtAuthenticationFilter.doFilterInternal()
├── Extract token từ header
├── Validate token
│   ├── Kiểm tra signature
│   ├── Kiểm tra expiration
│   └── Kiểm tra token có bị revoke?
├── Extract user info từ token
├── Set SecurityContext với user authentication
└── Continue filter chain

→ Controller có thể access user info qua SecurityContextHolder
```

### 1.4. Đăng xuất (Logout)
```
Client → POST /home/auth/logout
Request Body:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

↓ AuthenticationService.logout()
├── Lưu token vào blacklist (invalidated tokens)
├── Token sẽ không còn valid cho requests sau
└── Client xóa token ở local storage

Response:
{
  "code": 1000,
  "message": "User logged out successfully",
  "result": "Logout successful"
}
```

---

## 🍕 2. LUỒNG ĐẶT HÀNG (ORDER FLOW)

### 2.1. Duyệt sản phẩm & Thêm vào giỏ hàng

#### Xem danh sách cửa hàng
```
Client → GET /home/stores

↓ StoreService.getAllStores()
└── Return danh sách stores với status = OPEN

Response:
{
  "code": 1000,
  "result": [
    {
      "id": 1,
      "name": "Cơm Tấm Sài Gòn",
      "status": "OPEN",
      "rating": 4.5,
      "phoneNumber": "0901234567"
    }
  ]
}
```

#### Xem sản phẩm của cửa hàng
```
Client → GET /home/products?storeId=1

↓ ProductService.getProductsByStore()
└── Return products có status = ACTIVE

Response:
{
  "code": 1000,
  "result": [
    {
      "id": 101,
      "name": "Cơm Tấm Sườn Bì Chả",
      "basePrice": 45000,
      "weightGram": 500,
      "quantityAvailable": 20
    }
  ]
}
```

#### Thêm sản phẩm vào giỏ
```
Client → POST /home/carts/items
Request Body:
{
  "productId": 101,
  "quantity": 2
}

↓ CartService.addItemToCart()
├── Lấy cart ACTIVE của user (hoặc tạo mới nếu chưa có)
├── Kiểm tra product còn hàng?
├── Tạo hoặc update CartItem
│   ├── Nếu product đã có → cộng dồn quantity
│   └── Nếu product mới → tạo CartItem mới
└── Update cart.updatedAt

Response:
{
  "code": 1000,
  "message": "Item added to cart",
  "result": {
    "cartId": 1,
    "items": [
      {
        "productId": 101,
        "productName": "Cơm Tấm Sườn Bì Chả",
        "quantity": 2,
        "unitPrice": 45000,
        "subtotal": 90000
      }
    ],
    "totalAmount": 90000
  }
}
```

### 2.2. Xem & Cập nhật giỏ hàng
```
Client → GET /home/carts/my-cart

↓ CartService.getMyCart()
├── Lấy cart ACTIVE của user
├── Join với CartItem và Product
└── Tính tổng tiền

Response:
{
  "code": 1000,
  "result": {
    "cartId": 1,
    "items": [...],
    "totalItems": 2,
    "totalAmount": 90000
  }
}

# Cập nhật số lượng
Client → PUT /home/carts/items/{itemId}
Request Body: { "quantity": 3 }

# Xóa item
Client → DELETE /home/carts/items/{itemId}

# Xóa toàn bộ giỏ
Client → DELETE /home/carts/clear
```

### 2.3. Đặt hàng (Checkout)
```
Client → POST /home/orders/checkout
Request Body:
{
  "cartId": 1,
  "deliveryAddressId": 5,
  "paymentMethod": "CASH_ON_DELIVERY",
  "note": "Giao trước 12h trưa"
}

↓ OrderService.createOrder()
├── Validate cart không rỗng
├── Validate address thuộc về user
├── Lấy tất cả items từ cart
├── Tính toán:
│   ├── totalItemAmount = sum(item.price * quantity)
│   ├── shippingFee = calculateShippingFee(distance)
│   ├── taxAmount = totalItemAmount * 0.1
│   └── totalPayable = totalItemAmount + shippingFee + taxAmount
│
├── Tạo Order entity
│   ├── orderCode = generate unique code
│   ├── status = CREATED
│   ├── paymentStatus = PENDING
│   └── deliveryAddressSnapshot = JSON serialize address
│
├── Tạo OrderItem cho mỗi product
├── Giảm quantityAvailable của products
├── Đổi cart status → CHECKED_OUT
└── Lưu order vào database

Response:
{
  "code": 1000,
  "message": "Order created successfully",
  "result": {
    "orderId": 1001,
    "orderCode": "ORD-2025-001",
    "status": "CREATED",
    "totalPayable": 102000,
    "createdAt": "2025-11-03T10:30:00"
  }
}
```

### 2.4. Thanh toán
```
Client → POST /home/payments/process
Request Body:
{
  "orderId": 1001,
  "paymentMethod": "CASH_ON_DELIVERY",
  "amount": 102000
}

↓ PaymentService.processPayment()
├── Validate order tồn tại
├── Tạo PaymentTransaction
│   ├── status = PENDING
│   ├── method = CASH_ON_DELIVERY
│   └── amount = 102000
│
├── Nếu payment thành công:
│   ├── Update order.paymentStatus = PAID
│   ├── Update order.status = PAID
│   └── Transaction.status = COMPLETED
│
└── Trigger delivery creation

Response:
{
  "code": 1000,
  "message": "Payment processed",
  "result": {
    "transactionId": "TXN-2025-001",
    "status": "COMPLETED"
  }
}
```

---

## 🚁 3. LUỒNG GIAO HÀNG BẰNG DRONE (DELIVERY FLOW) - CORE FEATURE

### 3.1. Khởi tạo Delivery
```
[Tự động trigger sau khi order PAID]

↓ DeliveryService.createDelivery()
├── Lấy thông tin order
├── Lấy tọa độ pickup (store address)
├── Lấy tọa độ dropoff (user delivery address)
├── Tính tổng weight từ order items
│
├── Tìm drone phù hợp:
│   └── DroneService.findAvailableDroneForDelivery()
│       ├── Filter: status = AVAILABLE
│       ├── Filter: maxPayloadGram >= totalWeight
│       ├── Filter: battery >= requiredBattery
│       └── Sort: closest to pickup point
│
├── Tạo Delivery entity
│   ├── orderId = 1001
│   ├── droneId = (drone được chọn)
│   ├── currentStatus = QUEUED
│   ├── pickupStoreId = store.id
│   └── dropoffAddressSnapshot = JSON address
│
├── Tạo FlightPlan
│   ├── Calculate flight path
│   ├── Tạo FlightPlanPoint cho từng waypoint
│   └── estimatedTime = calculateFlightTime(distance)
│
└── Lưu vào database

Created:
- Delivery (id=501, status=QUEUED)
- FlightPlan (id=601, status=PENDING)
- FlightPlanPoints [A → B → C → ...]
```

### 3.2. Phân công Drone
```
[Tự động hoặc manual assign]

↓ DeliveryService.assignDrone()
├── Update drone.status = IN_FLIGHT
├── Update delivery.currentStatus = ASSIGNED
├── Set actualDepartureTime = now
└── Notify drone simulator

Drone thay đổi:
- Status: AVAILABLE → IN_FLIGHT
- Receive delivery mission data
```

### 3.3. Drone bay đến điểm lấy hàng (Pickup)
```
[Drone Simulator gửi GPS updates]

Loop (mỗi 2-3 giây):
  Client → POST /home/drones/DRONE001/location
  Request Body:
  {
    "latitude": 10.764000,
    "longitude": 106.662000,
    "batteryPercent": 98
  }

  ↓ DroneService.updateLocation()
  ├── Update drone.lastLatitude
  ├── Update drone.lastLongitude
  ├── Update drone.currentBatteryPercent
  ├── Update drone.lastTelemetryAt
  │
  ├── Calculate distance to pickup point
  │
  └── If (distance < 50 meters):
      ├── Update delivery.status = LAUNCHED
      ├── Drone pickup package
      └── Start delivery to customer

Battery monitoring:
  ↓ DroneService.monitorBattery()
  ├── If battery < 10%: status = MAINTENANCE (emergency)
  ├── If battery < 20%: warning alert
  └── Else: continue
```

### 3.4. Drone giao hàng (Dropoff)
```
[Tiếp tục GPS updates]

Loop (mỗi 2-3 giây):
  Client → POST /home/drones/DRONE001/location
  Request Body:
  {
    "latitude": 10.770000,
    "longitude": 106.668000,
    "batteryPercent": 85
  }

  ↓ DroneService.updateLocation()
  ├── Update GPS coordinates
  ├── Calculate distance to dropoff point
  │
  └── If (distance < 20 meters):
      ├── Update delivery.status = ARRIVING
      ├── Notify customer
      └── Wait for confirmation

Confirmation methods:
1. GEOFENCE: Auto confirm khi drone trong bán kính
2. OTP: Customer nhập mã xác nhận
3. QR: Customer scan QR code
```

### 3.5. Hoàn thành giao hàng
```
Client → POST /home/deliveries/{deliveryId}/complete
Request Body:
{
  "confirmationMethod": "GEOFENCE",
  "otp": null
}

↓ DeliveryService.completeDelivery()
├── Validate confirmation method
├── Update delivery:
│   ├── currentStatus = COMPLETED
│   ├── actualArrivalTime = now
│   └── confirmationMethod = GEOFENCE
│
├── Update order.status = DELIVERED
├── Update drone.status = AVAILABLE
├── Update flightPlan.status = COMPLETED
└── Release drone cho delivery mới

Response:
{
  "code": 1000,
  "message": "Delivery completed successfully",
  "result": {
    "deliveryId": 501,
    "status": "COMPLETED",
    "actualDeliveryTime": "12 phút"
  }
}
```

### 3.6. Drone return về base
```
Client → POST /home/drones/DRONE001/status
Request Body:
{
  "status": "AVAILABLE"
}

↓ DroneService.updateStatus()
├── Update drone.status = AVAILABLE
├── Drone sẵn sàng nhận delivery mới
└── If battery < 50%: suggest charging
```

---

## 📱 4. LUỒNG DRONE SIMULATOR (TEST FLOW)

### 4.1. Khởi động Drone Simulator (Điện thoại hoặc PC)

#### Mock GPS Mode (Recommended for testing)
```
URL: http://192.168.1.86:8080/home/drone-simulator-mock.html

User actions:
1. Nhập API Server URL: http://192.168.1.86:8080/home
2. Nhập Drone Code: DRONE001
3. Nhập Phone Model: iPhone 13
4. Click "Register & Start"

↓ JavaScript code execution:
├── POST /home/drones/register
│   Request: { code, model, lat: 10.762622, lng: 106.660172 }
│   Response: { droneId, status: "AVAILABLE" }
│
├── Start GPS update loop (setInterval 2s)
│   └── POST /home/drones/{code}/location
│       └── Send mock GPS coordinates
│
└── Poll current delivery (setInterval 5s)
    └── GET /home/drones/{code}/current-delivery
        └── If has delivery → show delivery info
```

#### Real GPS Mode (Requires HTTPS or localhost)
```
URL: http://localhost:8080/home/drone-simulator.html

User actions:
1. Browser requests geolocation permission
2. User clicks "Allow"
3. Register drone with real GPS coordinates

↓ JavaScript code:
├── navigator.geolocation.getCurrentPosition()
├── POST /home/drones/register (with real lat/lng)
└── setInterval: send real GPS updates
```

### 4.2. Test Drone Delivery Flow (Automated)
```
URL: http://localhost:8080/home/test-drone-delivery-flow.html

User clicks "CHẠY TỰ ĐỘNG TOÀN BỘ":

Step 1: Register drone at Point A (10.762622, 106.660172)
  → POST /home/drones/register
  → Status: AVAILABLE

Step 2: Start delivery (IN_FLIGHT)
  → POST /home/drones/DRONE001/status
  → Body: { status: "IN_FLIGHT" }

Step 3: Fly from A to B (Auto movement)
  → Loop 21 times:
      currentLat += (targetLat - startLat) / 20
      currentLng += (targetLng - startLng) / 20
      POST /home/drones/DRONE001/location
      battery -= 1
      wait 200ms
  → Simulate realistic flight path

Step 4: Complete delivery (AVAILABLE)
  → POST /home/drones/DRONE001/status
  → Body: { status: "AVAILABLE" }
  → Battery: 79%

Log output:
[10:30:15] ✅ Drone registered at A
[10:30:16] ✈️ Started delivery
[10:30:17] 📍 Flying... (10.763, 106.661) Battery: 99%
[10:30:17] 📍 Flying... (10.764, 106.662) Battery: 98%
...
[10:30:21] 🎉 Arrived at B (10.773622, 106.670172)
[10:30:22] ✅ Delivery completed
```

---

## 🔧 5. LUỒNG QUẢN LÝ CỬA HÀNG & SẢN PHẨM

### 5.1. Đăng ký cửa hàng (Store Owner)
```
Client → POST /home/stores/create
Request Body:
{
  "name": "Cơm Tấm Sài Gòn",
  "description": "Cơm tấm truyền thống",
  "phoneNumber": "0901234567",
  "email": "comtam@example.com",
  "address": {
    "street": "123 Nguyễn Văn Linh",
    "district": "Quận 7",
    "city": "TP.HCM",
    "latitude": 10.762622,
    "longitude": 106.660172
  }
}

↓ StoreService.createStore()
├── Validate user có role STORE_OWNER?
├── Tạo Store entity
│   ├── ownerUserId = currentUser.id
│   ├── status = OPEN
│   └── rating = 0.0
├── Tạo StoreAddress entity
└── Lưu vào database

Response:
{
  "code": 1000,
  "result": { "storeId": 1, "status": "OPEN" }
}
```

### 5.2. Thêm sản phẩm
```
Client → POST /home/products/create
Request Body:
{
  "storeId": 1,
  "categoryId": 5,
  "sku": "CT-SUON-001",
  "name": "Cơm Tấm Sườn Bì Chả",
  "description": "Sườn nướng, bì, chả trứng",
  "basePrice": 45000,
  "weightGram": 500,
  "quantityAvailable": 20
}

↓ ProductService.createProduct()
├── Validate store thuộc về current user
├── Validate category tồn tại
├── Generate SKU nếu chưa có
├── Tạo Product entity
│   ├── status = ACTIVE
│   └── currency = "VND"
└── Lưu vào database

Response:
{
  "code": 1000,
  "result": { "productId": 101, "status": "ACTIVE" }
}
```

### 5.3. Cập nhật tồn kho
```
Client → PUT /home/products/{productId}/stock
Request Body:
{
  "quantityAvailable": 50
}

↓ ProductService.updateStock()
├── Validate product thuộc về store của user
├── Update product.quantityAvailable
└── Update product.updatedAt
```

---

## 🎯 6. CÁC TÍNH NĂNG BỔ SUNG

### 6.1. Tìm kiếm sản phẩm
```
Client → GET /home/products/search?keyword=com+tam&minPrice=30000&maxPrice=60000

↓ ProductService.searchProducts()
├── Query với LIKE %keyword%
├── Filter theo price range
├── Filter theo status = ACTIVE
└── Return matching products
```

### 6.2. Tính khoảng cách & phí ship
```
Client → GET /home/locations/calculate-distance
  ?fromLat=10.762622
  &fromLng=106.660172
  &toLat=10.773622
  &toLng=106.670172

↓ LocationService.calculateDistance()
├── Use Haversine formula
├── Calculate distance in km
└── estimatedFee = distance * 5000 (VND/km)

Response:
{
  "code": 1000,
  "result": {
    "distanceKm": 1.52,
    "estimatedShippingFee": 7600,
    "estimatedTimeMinutes": 3
  }
}
```

### 6.3. Tìm drone gần nhất
```
Client → GET /home/drones/find-available
  ?weightGram=800
  &fromLat=10.762622
  &fromLng=106.660172
  &toLat=10.773622
  &toLng=106.670172

↓ DroneService.findAvailableDroneForDelivery()
├── Filter drones:
│   ├── status = AVAILABLE
│   ├── maxPayloadGram >= weightGram
│   └── battery >= requiredBattery(distance)
│
├── Sort by:
│   ├── 1. Distance to pickup point (closest first)
│   └── 2. Battery level (higher first)
│
└── Return best drone

Response:
{
  "code": 1000,
  "result": {
    "droneId": 3,
    "code": "DRONE003",
    "distanceToPickup": 0.8,
    "battery": 95,
    "estimatedArrival": "5 phút"
  }
}
```

### 6.4. Kiểm tra sức khỏe drone
```
Client → GET /home/drones/DRONE001/health

↓ DroneService.checkDroneHealth()
├── Check battery level
│   ├── < 10%: CRITICAL
│   ├── < 20%: WARNING
│   ├── < 50%: FAIR
│   └── >= 50%: GOOD
│
├── Check telemetry
│   ├── lastUpdate > 5 mins: Connection POOR
│   └── Else: Connection GOOD
│
└── Overall health

Response:
{
  "code": 1000,
  "result": {
    "droneCode": "DRONE001",
    "batteryLevel": 85,
    "batteryHealth": "GOOD",
    "connectionHealth": "GOOD",
    "overallHealth": "HEALTHY",
    "issues": []
  }
}
```

---

## 📊 7. DATABASE SCHEMA OVERVIEW

### Core Tables:
```
users                    # Người dùng
├── id (PK)
├── username
├── email
├── password_hash
├── full_name
├── phone
└── status (ACTIVE, LOCKED, PENDING)

user_role               # Phân quyền
├── user_id (FK → users)
└── role_id (FK → roles)

roles                   # Vai trò
├── id (PK)
└── name (USER, STORE_OWNER, ADMIN, DRONE_OPERATOR)

store                   # Cửa hàng
├── id (PK)
├── owner_user_id (FK → users)
├── name
├── description
├── phone_number
├── email
├── rating
└── status (OPEN, CLOSED, TEMPORARILY_CLOSED)

store_address          # Địa chỉ cửa hàng
├── id (PK)
├── store_id (FK → store)
├── latitude
├── longitude
└── full_address

product                # Sản phẩm
├── id (PK)
├── store_id (FK → store)
├── category_id (FK → product_category)
├── sku
├── name
├── description
├── base_price
├── weight_gram
├── quantity_available
└── status (ACTIVE, INACTIVE, OUT_OF_STOCK)

cart                   # Giỏ hàng
├── id (PK)
├── user_id (FK → users)
├── status (ACTIVE, CHECKED_OUT, ABANDONED)
└── updated_at

cart_item              # Items trong giỏ
├── id (PK)
├── cart_id (FK → cart)
├── product_id (FK → product)
├── quantity
└── added_at

orders                 # Đơn hàng
├── id (PK)
├── user_id (FK → users)
├── store_id (FK → store)
├── order_code (unique)
├── status (CREATED, PAID, IN_DELIVERY, DELIVERED, CANCELLED)
├── payment_status (PENDING, PAID, FAILED, REFUNDED)
├── total_item_amount
├── shipping_fee
├── tax_amount
└── total_payable

order_item             # Items trong đơn hàng
├── id (PK)
├── order_id (FK → orders)
├── product_id (FK → product)
├── quantity
├── unit_price
└── subtotal

drone                  # Drone
├── id (PK)
├── code (unique)
├── model
├── max_payload_gram
├── status (AVAILABLE, IN_FLIGHT, CHARGING, MAINTENANCE, OFFLINE)
├── current_battery_percent
├── last_latitude
├── last_longitude
└── last_telemetry_at

delivery               # Giao hàng
├── id (PK)
├── order_id (FK → orders, unique)
├── drone_id (FK → drone)
├── current_status (QUEUED, ASSIGNED, LAUNCHED, ARRIVING, COMPLETED, FAILED)
├── pickup_store_id (FK → store)
├── dropoff_address_snapshot (JSON)
├── actual_departure_time
├── actual_arrival_time
└── confirmation_method (GEOFENCE, OTP, QR)

flight_plan            # Kế hoạch bay
├── id (PK)
├── delivery_id (FK → delivery)
├── drone_id (FK → drone)
├── status (PENDING, ACTIVE, COMPLETED, ABORTED)
├── estimated_distance_km
└── estimated_duration_min

flight_plan_point      # Các điểm trên đường bay
├── id (PK)
├── flight_plan_id (FK → flight_plan)
├── sequence_order
├── latitude
├── longitude
├── altitude_m
└── estimated_battery_at_point
```

---

## 🔄 8. STATUS TRANSITIONS (LUỒNG TRẠNG THÁI)

### Order Status Flow:
```
CREATED
  ↓ (payment processed)
PENDING_PAYMENT
  ↓ (payment confirmed)
PAID
  ↓ (drone assigned)
IN_DELIVERY
  ↓ (delivery completed)
DELIVERED

Alternative flows:
CREATED → CANCELLED (user cancels)
PAID → REFUNDED (failed delivery)
```

### Delivery Status Flow:
```
QUEUED
  ↓ (drone assigned)
ASSIGNED
  ↓ (drone picked up package)
LAUNCHED
  ↓ (near customer location)
ARRIVING
  ↓ (customer confirms)
COMPLETED

Alternative flow:
Any → FAILED (errors)
Any → RETURNED (cannot deliver)
```

### Drone Status Flow:
```
AVAILABLE
  ↓ (assigned to delivery)
IN_FLIGHT
  ↓ (delivery completed)
AVAILABLE

Maintenance flows:
AVAILABLE → CHARGING (battery < 20%)
IN_FLIGHT → MAINTENANCE (battery < 10% or error)
MAINTENANCE → AVAILABLE (fixed)
Any → OFFLINE (connection lost)
```

---

## 🛡️ 9. SECURITY & AUTHORIZATION

### JWT Configuration:
```yaml
# application.yaml
jwt:
  signerKey: "wXUQDod+4Vgzo8ZHaB..."  # Secret key
  expiration: 3600000                # 1 hour in ms
```

### Security Filter Chain:
```
Request → JwtAuthenticationFilter
  ├── Extract token from "Authorization: Bearer <token>"
  ├── Validate token
  ├── Load user details
  └── Set SecurityContext

→ Controller
  └── Access user via @AuthenticationPrincipal
      or SecurityContextHolder.getContext()
```

### Role-based Access:
```java
@PreAuthorize("hasRole('STORE_OWNER')")
public ResponseEntity createProduct(...) {
  // Only STORE_OWNER can create products
}

@PreAuthorize("hasAnyRole('ADMIN', 'DRONE_OPERATOR')")
public ResponseEntity assignDrone(...) {
  // Only ADMIN or DRONE_OPERATOR can assign drones
}
```

### CORS Configuration:
```java
// Cho phép frontend khác domain access API
@Configuration
public class CorsConfig {
  allowedOrigins: ["http://localhost:3000", "http://192.168.*.*"]
  allowedMethods: ["GET", "POST", "PUT", "DELETE"]
  allowedHeaders: ["Authorization", "Content-Type"]
}
```

---

## 📈 10. MONITORING & LOGGING

### Drone Telemetry Tracking:
```
Mỗi 2-3 giây:
  → Drone gửi GPS + battery status
  → Server update database
  → Check battery level
  → If low battery: trigger warning/emergency
```

### Delivery Status Tracking:
```
Real-time updates:
  → Delivery status changes
  → Customer receives notification
  → Store receives notification
  → Admin dashboard updates
```

### Performance Metrics:
```
- Average delivery time
- Drone battery consumption per km
- Success rate (COMPLETED vs FAILED)
- Customer satisfaction ratings
```

---

## 🧪 11. TESTING WORKFLOW

### Quick Start Test (wait-and-test.bat):
```batch
@echo off
# Wait for server to start
:wait_loop
curl -s http://localhost:8080/home/drones >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 3 /nobreak >nul
    goto wait_loop
)

# Open test page
start http://localhost:8080/home/test-drone-delivery-flow.html
```

### Manual Test Flow:
```
1. Start server: start-server.bat
2. Wait for server ready
3. Open drone simulator: drone-simulator-mock.html
4. Register drone
5. Create order via API or frontend
6. Watch delivery progress
7. Verify completion
```

### API Testing (Postman):
```
Collection: Drone_Complete_APIs.postman_collection.json

Tests include:
- Authentication (signup, login, logout)
- Store CRUD
- Product CRUD
- Cart operations
- Order creation
- Drone registration
- Drone location updates
- Delivery tracking
```

---

## 🎓 TỔNG KẾT

### Luồng hoạt động chính:
1. **User đăng ký/đăng nhập** → JWT token
2. **Duyệt sản phẩm** → Thêm vào giỏ hàng
3. **Checkout** → Tạo order
4. **Thanh toán** → Order PAID
5. **Tự động tạo delivery** → Tìm drone phù hợp
6. **Drone nhận nhiệm vụ** → Bay đến lấy hàng
7. **Drone giao hàng** → Customer xác nhận
8. **Hoàn thành** → Drone về base, order DELIVERED

### Core Technologies:
- **Spring Boot 3.5.5** - Backend framework
- **Spring Security + JWT** - Authentication
- **JPA/Hibernate** - ORM
- **MySQL** - Database
- **MapStruct** - DTO mapping
- **Lombok** - Reduce boilerplate
- **HTML/JS** - Test simulators

### Key Features:
- ✅ Complete authentication & authorization
- ✅ Full product & store management
- ✅ Cart & order processing
- ✅ **Real-time drone tracking with GPS**
- ✅ **Intelligent drone assignment algorithm**
- ✅ **Battery monitoring & safety features**
- ✅ Flight path planning
- ✅ Delivery status tracking
- ✅ Multiple confirmation methods

### Development Tools:
- **start-server.bat** - Start Spring Boot
- **wait-and-test.bat** - Auto test when ready
- **drone-simulator-mock.html** - Mock GPS testing
- **test-drone-delivery-flow.html** - Automated flow test
- **Postman collections** - API testing

---

## 📞 API ENDPOINT SUMMARY

### Base URL: `http://localhost:8080/home`

**Authentication:**
- POST `/auth/signup` - Đăng ký
- POST `/auth/login` - Đăng nhập
- POST `/auth/logout` - Đăng xuất
- POST `/auth/validate` - Validate token

**Users:**
- GET `/users/me` - Get current user
- PUT `/users/me` - Update profile
- GET `/users/{id}` - Get user by ID

**Stores:**
- GET `/stores` - Get all stores
- POST `/stores/create` - Create store
- GET `/stores/{id}` - Get store details
- PUT `/stores/{id}` - Update store
- DELETE `/stores/{id}` - Delete store

**Products:**
- GET `/products` - Get all products
- POST `/products/create` - Create product
- GET `/products/{id}` - Get product details
- PUT `/products/{id}` - Update product
- DELETE `/products/{id}` - Delete product
- GET `/products/search` - Search products

**Cart:**
- GET `/carts/my-cart` - Get my cart
- POST `/carts/items` - Add item to cart
- PUT `/carts/items/{id}` - Update item quantity
- DELETE `/carts/items/{id}` - Remove item
- DELETE `/carts/clear` - Clear cart

**Orders:**
- POST `/orders/checkout` - Create order
- GET `/orders/my-orders` - Get my orders
- GET `/orders/{id}` - Get order details
- POST `/orders/{id}/cancel` - Cancel order

**Drones:** 🚁
- POST `/drones/register` - Register drone
- GET `/drones` - Get all drones
- GET `/drones/{code}` - Get drone by code
- POST `/drones/{code}/location` - Update GPS
- POST `/drones/{code}/status` - Update status
- GET `/drones/{code}/current-delivery` - Get current delivery
- GET `/drones/find-available` - Find suitable drone
- GET `/drones/{code}/health` - Check health
- GET `/drones/nearby` - Get nearby drones

**Deliveries:**
- GET `/deliveries/{id}` - Get delivery details
- POST `/deliveries/{id}/complete` - Complete delivery
- GET `/deliveries/track/{orderCode}` - Track by order code

---

📝 **Document created:** 2025-11-03
🔄 **Last updated:** 2025-11-03
👨‍💻 **Project:** FoodFast - Food Delivery with Drone System

