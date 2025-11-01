# 🍔 FoodFast - Food Delivery System

Hệ thống giao đồ ăn với tích hợp Drone Delivery

## 🚀 Quick Start

### 1. Khởi động server
```bash
# Windows
start-server.bat

# Hoặc
mvnw.cmd spring-boot:run
```

### 2. Truy cập ứng dụng
- **API Base:** http://localhost:8080/home
- **Home Page:** http://localhost:8080/home/index.html
- **Test Drone Delivery:** http://localhost:8080/home/test-delivery.html ⭐
- **Drone Simulator (Mock GPS):** http://localhost:8080/home/drone-simulator-mock.html
- **Drone Simulator (Real GPS):** http://localhost:8080/home/drone-simulator.html
- **Test Connection:** http://localhost:8080/home/test-connection.html
- **Debug Register:** http://localhost:8080/home/debug-register.html

---

## 📱 Drone Simulator

### 🔥 Test trên Điện Thoại (Khuyến nghị)

**Bước 1: Kết nối cùng mạng WiFi**
- Máy tính và điện thoại phải cùng mạng WiFi
- Tắt firewall hoặc cho phép port 8080

**Bước 2: Lấy địa chỉ IP máy tính**
```bash
# Windows: Mở CMD và gõ
ipconfig

# Tìm dòng "IPv4 Address" 
# Ví dụ: 192.168.1.86
```

**Bước 3: Mở trình duyệt trên điện thoại**

🎯 **Mock GPS (Không cần GPS thật):**
```
http://192.168.1.86:8080/home/drone-simulator-mock.html
```
- ✅ Hoạt động trên mọi điện thoại
- ✅ Không cần quyền GPS
- ✅ Có thể test ngay lập tức
- ✅ Mô phỏng di chuyển drone

🎯 **Real GPS (Dùng GPS thật của điện thoại):**
```
http://192.168.1.86:8080/home/drone-simulator.html
```
- ⚠️ CẦN HTTPS hoặc dùng localhost
- ⚠️ Trình duyệt sẽ hỏi quyền GPS → Chọn "Allow"
- ⚠️ Nếu bị lỗi "Only secure origins allowed" → Dùng Mock GPS

**Bước 4: Điền thông tin**
- **API Server URL:** `http://192.168.1.86:8080/home` (thay IP của bạn)
- **Drone Code:** `DRONE001`
- **Phone Model:** Tên điện thoại (ví dụ: iPhone 13, Samsung S21)

**Bước 5: Nhấn "Register & Start"** ✅

---

### 💻 Test trên Máy Tính

#### Mock GPS (Khuyến nghị cho development)
```
http://localhost:8080/home/drone-simulator-mock.html
```
- ✅ Không cần GPS thật
- ✅ Hoạt động với IP address
- ✅ Có thể test qua mạng LAN
- ✅ Mô phỏng di chuyển drone

#### Real GPS (Cần geolocation API)
```
http://localhost:8080/home/drone-simulator.html
```
- ✅ Hoạt động trên localhost
- ⚠️ Cần cấp quyền GPS cho trình duyệt

---

## 🔧 API Endpoints

### Drones
```http
# Đăng ký drone mới
POST /home/drones/register
Content-Type: application/json
{
    "code": "DRONE001",
    "model": "iPhone 13",
    "maxPayloadGram": 2000,
    "latitude": 10.762622,
    "longitude": 106.660172
}

# Lấy danh sách drones
GET /home/drones

# Lấy thông tin drone cụ thể
GET /home/drones/{code}

# Cập nhật vị trí drone
POST /home/drones/{code}/location
Content-Type: application/json
{
    "latitude": 10.762622,
    "longitude": 106.660172,
    "batteryPercent": 95
}

# Thay đổi trạng thái drone
POST /home/drones/{code}/status
Content-Type: application/json
{
    "status": "AVAILABLE"
}
```

### Products
```http
# Lấy danh sách sản phẩm
GET /home/products

# Lấy sản phẩm theo category
GET /home/categories/{categoryId}/products

# Tạo sản phẩm mới
POST /home/products
```

### Cart
```http
# Thêm vào giỏ hàng
POST /home/cart/add

# Xem giỏ hàng
GET /home/cart

# Cập nhật số lượng
PUT /home/cart/update

# Xóa khỏi giỏ
DELETE /home/cart/remove/{productId}
```

### Orders
```http
# Tạo đơn hàng
POST /home/orders/create

# Lấy danh sách đơn hàng
GET /home/orders

# Chi tiết đơn hàng
GET /home/orders/{orderId}
```

---

## 🛠️ Xử lý lỗi thường gặp

### ❌ Lỗi GPS "Only secure origins are allowed" (Trên điện thoại)
**Nguyên nhân:** Truy cập qua IP address, trình duyệt không cho phép GPS

**✅ Giải pháp:**
1. Dùng Mock GPS Simulator: `http://192.168.1.86:8080/home/drone-simulator-mock.html`
2. Mock GPS không cần quyền GPS và hoạt động hoàn hảo!

### ❌ Không kết nối được từ điện thoại
**Nguyên nhân:** Firewall chặn hoặc không cùng mạng WiFi

**✅ Giải pháp:**
1. Kiểm tra cùng mạng WiFi
2. Tắt Windows Firewall tạm thời:
   - Windows Defender Firewall → Turn off
3. Hoặc cho phép port 8080:
   ```
   Inbound Rules → New Rule → Port → TCP 8080 → Allow
   ```
4. Kiểm tra server đã chạy: `http://localhost:8080/home`

### ❌ Lỗi Connection refused
**Nguyên nhân:** Server chưa chạy

**✅ Giải pháp:**
```bash
start-server.bat
```

### ❌ Lỗi Drone code already exists
**Nguyên nhân:** Drone đã được đăng ký

**✅ Giải pháp:** 
- Đổi drone code khác: `DRONE002`, `DRONE003`...
- Hoặc xóa drone cũ qua API/Database

### ❌ Điện thoại không hiện Control Panel sau khi Register
**Nguyên nhân:** API Server URL sai

**✅ Giải pháp:**
- Kiểm tra API URL: `http://192.168.1.86:8080/home` (thay đúng IP)
- Mở browser console (F12) xem lỗi chi tiết
- Test API bằng Postman trước

---

## 📦 Cấu trúc dự án

```
foodfast/
├── src/
│   ├── main/
│   │   ├── java/com/cnpm/foodfast/
│   │   │   ├── Authentications/
│   │   │   ├── Cart/
│   │   │   ├── Drone/          # Drone management
│   │   │   ├── Products/
│   │   │   ├── Store/
│   │   │   └── User/
│   │   └── resources/
│   │       ├── application.yaml
│   │       └── static/
│   │           ├── drone-simulator.html
│   │           ├── drone-simulator-mock.html
│   │           └── test-connection.html
│   └── test/
├── start-server.bat            # Khởi động server
└── README.md                   # File này
```

---

## 🧪 Testing với Postman

Import file: `FoodFast_Postman_Collection.json`

**Test flow:**
1. Register drone
2. Get all drones
3. Update drone location
4. Change drone status

---

## 🎯 Drone Status

- **AVAILABLE:** Sẵn sàng nhận đơn
- **IN_FLIGHT:** Đang giao hàng
- **CHARGING:** Đang sạc pin
- **OFFLINE:** Offline

---

## 💡 Tips

### Testing nhiều drones
```bash
# Mở nhiều tab trình duyệt với drone-simulator-mock.html
# Mỗi tab dùng code khác nhau: DRONE001, DRONE002, DRONE003...
```

### Mô phỏng di chuyển
```bash
# Dùng các nút Move North/South/East/West trong Mock GPS Simulator
# Hoặc call API trực tiếp từ Postman
```

### Theo dõi battery
```bash
# Battery tự động giảm khi status = IN_FLIGHT
# Battery tự động tăng khi status = CHARGING
```

---

## 📞 API Response Format

### Success Response
```json
{
    "code": 1000,
    "message": "Success",
    "result": { ... }
}
```

### Error Response
```json
{
    "code": 9999,
    "message": "Error message"
}
```

---

## 🔐 Authentication

Hệ thống sử dụng JWT token authentication (nếu đã cấu hình)

---

## 📝 Notes

- Mock GPS sử dụng tọa độ TP.HCM mặc định: (10.762622, 106.660172)
- Real GPS cần quyền truy cập location từ trình duyệt
- Drone tự động cập nhật vị trí mỗi 3 giây khi kết nối

---

## 🐛 Bug Reports

Nếu gặp lỗi, kiểm tra:
1. Server đã chạy chưa?
2. Port 8080 có bị chiếm không?
3. Database có kết nối được không?
4. Browser console có báo lỗi gì không?

---

## 📄 License

© 2024 FoodFast Team

